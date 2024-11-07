import * as vscode from 'vscode';
import * as regroup from './importRegrouper'
import * as groups from './groups';
import * as fs from 'fs';


enum LogLevel {
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

type LogLevelStrings = keyof typeof LogLevel;

export class GroupImports {
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;
    private orgPrefix: string;
    private logLevel: LogLevel;

    constructor(context: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Go Regroup imports'),
        enabled = vscode.workspace.getConfiguration('regroupImports').get<boolean>('onSave'),
        orgPrefix = vscode.workspace.getConfiguration('regroupImports').get<string>('organization'),
        logLevel = vscode.workspace.getConfiguration('regroupImports').get<LogLevelStrings>('logLevel'),
    ) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.orgPrefix = orgPrefix !== undefined ? orgPrefix : "";
        this.isEnabled = enabled !== undefined ? enabled : false;
        this.logLevel = logLevel !== undefined ? LogLevel[logLevel] : LogLevel.INFO;

        this.outputChannel.appendLine("LogLevel: " + this.logLevel.toString())
    }

    public get isEnabled() {
        return this.context.globalState.get('isEnabled', false);
    }

    public set isEnabled(value: boolean) {
        this.context.globalState.update('isEnabled', value);
        this.message(LogLevel.INFO);
    }

    public tryRun(doc: vscode.TextDocument) {
        try {
            this.run(doc)
        } catch (e: any) {
            this.message(LogLevel.ERROR, "run error: " + e.toString())
        }
    }

    public run(doc: vscode.TextDocument) {

        if (doc.languageId !== 'go') {
            this.message(LogLevel.DEBUG, "skip: " + doc.fileName);
            return
        }

        if (!this.isEnabled) {
            return
        }

        this.message(LogLevel.INFO, "start: " + doc.fileName);

        const edit = new vscode.WorkspaceEdit();
        const importRange = findImports(doc.getText());
        if (!importRange) {
            this.message(LogLevel.INFO, "done (no imports to reorder): " + doc.fileName);
            return
        }

        const goModule = findProjectModule(doc.fileName, workspaceFolders());
        if (!goModule) {
            this.message(LogLevel.INFO, "go module not found for file: " + doc.fileName);
            return
        }

        this.message(LogLevel.DEBUG, "go module: " + goModule);

        const regrouper = this.buildRegrouper(goModule, this.orgPrefix);


        const imports = doc.getText(importRange);
        this.message(LogLevel.DEBUG, "to replace:\n" + imports)

        const replacement = regrouper.group(imports.split('\n'));
        const reorderedImports = createImportSection(replacement);
        this.message(LogLevel.DEBUG, "replace by:\n" + reorderedImports)

        if (imports !== reorderedImports) {
            edit.replace(doc.uri, importRange, reorderedImports);
            vscode.workspace.applyEdit(edit).then(doc.save);
        }

        this.message(LogLevel.INFO, "done: " + doc.fileName);
    }

    private buildRegrouper(goModule: string, orgPrefix: string) {
        if (orgPrefix.trim().length !== 0) {
            this.message(LogLevel.DEBUG, "buildRegrouper: with org prefix: " + orgPrefix + " and mod: " + goModule);

            return new regroup.GoImportsRegrouper(new Array<groups.Group>(
                new groups.Std(),
                new groups.Default(),
                new groups.Prefix(orgPrefix),
                new groups.Prefix(goModule),
                new groups.Blank(),
                new groups.Dot(),
            ));
        }

        const org = orgModule(goModule)
        if (org) {
            this.message(LogLevel.DEBUG, "buildRegrouper: with org: " + org + " and mod: " + goModule);

            return new regroup.GoImportsRegrouper(new Array<groups.Group>(
                new groups.Std(),
                new groups.Default(),
                new groups.Prefix(org),
                new groups.Prefix(goModule),
                new groups.Blank(),
                new groups.Dot(),
            ));
        }

        this.message(LogLevel.DEBUG, "buildRegrouper: default with org: " + goModule);

        return new regroup.GoImportsRegrouper(new Array<groups.Group>(
            new groups.Std(),
            new groups.Default(),
            new groups.Prefix(goModule),
            new groups.Blank(),
            new groups.Dot(),
        ));
    }

    public message(ll: LogLevel, m?: string) {
        if (ll <= this.logLevel) {
            m = m || `on save: ${this.isEnabled ? 'enabled' : 'disabled'}`;
            this.outputChannel.appendLine(m);
        }
    }
}

function workspaceFolders() {
    if (vscode.workspace.workspaceFolders === undefined ||
        vscode.workspace.workspaceFolders.length === 0) {
        return Array<string>(0)
    }
    return vscode.workspace.workspaceFolders.map((f) => f.uri.path)
}

export function findImports(doc: string) {
    let start = 0;
    const lines = doc.split('\n');
    for (var line of lines) {
        start++;
        if (line.includes('import (')) {
            break;
        }
    }
    if (start >= lines.length) {
        return null;
    }

    let end = start;
    for (var line of lines.slice(start + 1)) {
        if (line.includes(')')) {
            break;
        }
        end++;
    }
    if (end >= lines.length) {
        return null;
    }

    return new vscode.Range(start, 0, end, Number.MAX_VALUE);
}

export function findProjectModule(filepath: string, workspaceFolders: string[]) {
    const moduleRegex = /module (.*?)\n/;

    if (workspaceFolders.length === 0) {
        return undefined
    }

    const workspaces = workspaceFolders.filter((e) => filepath.startsWith(e))
    for (const w of workspaces) {
        const gomodFilepath = w + '/go.mod';
        if (!fs.existsSync(gomodFilepath)) {
            continue
        }

        const gomod = fs.readFileSync(gomodFilepath, 'utf-8');

        const module = moduleRegex.exec(gomod)
        if (module !== null &&
            module.length >= 1) {
            return module[1];
        }
    }
}

export function orgModule(projectMod: string) {
    const publicGitServices = ['gitlab.com', 'github.com', 'bitbucket.org', 'sourceforge.net'];

    const publicProvider = publicGitServices.some((e) => projectMod.includes(e));

    if (!publicProvider) {
        const first = projectMod.indexOf('/');
        if (first !== -1) {
            return projectMod.substring(0, first);
        }
    }

    const first = projectMod.indexOf('/');
    if (first === -1) {
        return null
    }

    const second = projectMod.indexOf('/', first + 1);
    if (second === -1) {
        return null
    }

    return projectMod.substring(0, second);
}

export function createImportSection(g: string[][]) {
    let first = true;
    let out = "";
    for (let r of g.slice()) {
        if (r.length === 0) {
            continue
        }
        if (!first) {
            out += '\n\n';
        }
        out += r.join('\n');
        first = false;
    }
    return out
}
