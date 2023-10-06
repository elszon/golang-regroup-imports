import * as vscode from 'vscode';
import * as regroup from './importRegrouper'
import * as groups from './groups';
import * as path from 'path';
import * as fs from 'fs';

export class GroupImports {
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('Go Regroup imports');
        const enabled = vscode.workspace.getConfiguration('regroupImports').get<boolean>('onSave');
        this.isEnabled = enabled !== undefined ? enabled : false;
    }

    public get isEnabled() {
        return this.context.globalState.get('isEnabled', false);
    }

    public set isEnabled(value: boolean) {
        this.context.globalState.update('isEnabled', value);
        this.message();
    }

    public run(doc: vscode.TextDocument) {

        if (doc.languageId != 'go') {
            this.message("skip: " + doc.fileName);
            return
        }

        if (!this.isEnabled) {
            return
        }

        this.message("start: " + doc.fileName);

        const edit = new vscode.WorkspaceEdit();
        const importRange = findImports(doc.getText());
        if (!importRange) {
            return
        }

        const workspaceFolders = () => {
            if (vscode.workspace.workspaceFolders === undefined ||
                vscode.workspace.workspaceFolders.length == 0) {
                return Array<string>(0)
            }
            return vscode.workspace.workspaceFolders.map((f) => f.uri.path)
        }

        const goModule = findProjectModule(doc.fileName, workspaceFolders());
        if (!goModule) {
            this.message("go module not found for file: " + doc.fileName);
            return
        }

        const regrouper = this.buildRegrouper(goModule);

        const imports = doc.getText(importRange);
        const replacement = regrouper.group(imports.split('\n'));
        const reorderedImports = createImportSection(replacement);

        if (imports != reorderedImports) {
            edit.replace(doc.uri, importRange, reorderedImports);
            vscode.workspace.applyEdit(edit).then(doc.save);
        }

        this.message("done: " + doc.fileName);
    }

    private buildRegrouper(projectModule: string) {
        const org = orgModule(projectModule)
        if (org) {
            return new regroup.GoImportsRegrouper(new Array<groups.Group>(
                new groups.Std(),
                new groups.Default(),
                new groups.Prefix(org),
                new groups.Prefix(projectModule),
                new groups.Blank(),
                new groups.Dot(),
            ));
        }
        return new regroup.GoImportsRegrouper(new Array<groups.Group>(
            new groups.Std(),
            new groups.Default(),
            new groups.Prefix(projectModule),
            new groups.Blank(),
            new groups.Dot(),
        ));
    }

    public message(m?: string) {
        m = m || `on save: ${this.isEnabled ? 'enabled' : 'disabled'}`;
        this.outputChannel.appendLine(m);
    }
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

    if (workspaceFolders.length == 0) {
        return null
    }

    while (true) {
        filepath = filepath.split(path.sep).slice(0, -1).join(path.sep);
        if (!workspaceFolders.some((e) => filepath.startsWith(e))) {
            return null
        }
        const modFilepath = filepath + '/go.mod';
        if (fs.existsSync(modFilepath)) {
            const words = fs.readFileSync(modFilepath, 'utf-8');

            const matches = moduleRegex.exec(words)
            if (matches !== null && matches.length >= 1) {
                return matches[1];
            }
        }
    }
}

export function orgModule(projectMod: string) {

    const first = projectMod.indexOf('/');
    if (first == -1) {
        return null
    }

    const second = projectMod.indexOf('/', first + 1);
    if (second == -1) {
        return null
    }

    return projectMod.substring(0, second);
}

export function createImportSection(g: string[][]) {
    let first = true;
    let out = "";
    for (let r of g.slice()) {
        if (r.length == 0) {
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
