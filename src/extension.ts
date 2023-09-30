// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as golang from './golang';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let ext = new golang.GroupImports(context)

	vscode.workspace.onDidSaveTextDocument(e => { ext.run(e) })


	vscode.commands.registerCommand('extension.goRegroupImports.toggle', () => {
		ext.isEnabled = !ext.isEnabled;
	});

	console.log('Congratulations, your extension "golang-regroup-imports" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() { }
