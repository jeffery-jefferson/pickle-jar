import * as vscode from 'vscode';

export class GoToDefinitionCommand {
  async execute(item: any): Promise<void> {
    const stepDef = item.stepDefinition || item;

    if (!stepDef?.filePath) {
      vscode.window.showErrorMessage('Invalid step definition');
      return;
    }

    try {
      const uri = vscode.Uri.file(stepDef.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      const position = new vscode.Position(stepDef.lineNumber - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }
}
