import * as vscode from 'vscode';

export class CopyStepCommand {
  async execute(item: any): Promise<void> {
    const stepDef = item.stepDefinition || item;

    if (!stepDef?.displayText || !stepDef?.type) {
      vscode.window.showErrorMessage('Invalid step definition');
      return;
    }

    const stepText = `${stepDef.type} ${stepDef.displayText}`;
    await vscode.env.clipboard.writeText(stepText);
    vscode.window.showInformationMessage(`Copied: ${stepText}`);
  }
}
