import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';

export class InsertionHandler implements vscode.Disposable {
  private decorationType = vscode.window.createTextEditorDecorationType({
    border: '1px dotted rgba(255, 255, 255, 0.4)',
    borderRadius: '2px',
  });
  private selectionListener: vscode.Disposable | undefined;

  async insertStepDefinition(stepDef: StepDefinition): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    if (!editor.document.fileName.endsWith('.feature')) {
      vscode.window.showWarningMessage(
        'Pickle Jar: Please open a .feature file to insert step definitions'
      );
      return;
    }

    const insertionLine = editor.selection.active.line;
    await editor.insertSnippet(this.createSnippet(stepDef));

    if (stepDef.parameters.length > 0) {
      this.applyParameterDecorations(editor, insertionLine, stepDef);
    }
  }

  private createSnippet(stepDef: StepDefinition): vscode.SnippetString {
    let snippetText = `${stepDef.type} ${stepDef.displayText}`;
    let paramIndex = 0;

    snippetText = snippetText.replace(/\{([^}]+)\}/g, (_match, paramName) => {
      paramIndex++;
      return `\${${paramIndex}:(${paramName})}`;
    });

    snippetText += '$0';
    return new vscode.SnippetString(snippetText);
  }

  private applyParameterDecorations(
    editor: vscode.TextEditor,
    insertionLine: number,
    stepDef: StepDefinition
  ): void {
    const lineText = editor.document.lineAt(insertionLine).text;
    const decorations: vscode.DecorationOptions[] = [];
    let searchStart = 0;

    for (const param of stepDef.parameters) {
      const token = `(${param.name})`;
      const idx = lineText.indexOf(token, searchStart);
      if (idx === -1) continue;

      const range = new vscode.Range(
        new vscode.Position(insertionLine, idx),
        new vscode.Position(insertionLine, idx + token.length)
      );

      const hoverMessage = new vscode.MarkdownString();
      hoverMessage.appendMarkdown(`**${param.name}** \`{${param.type}}\``);

      decorations.push({ range, hoverMessage });
      searchStart = idx + token.length;
    }

    editor.setDecorations(this.decorationType, decorations);
    this.trackCursorForCleanup(editor, insertionLine);
  }

  private trackCursorForCleanup(editor: vscode.TextEditor, insertionLine: number): void {
    this.selectionListener?.dispose();
    this.selectionListener = vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor !== editor) return;

      if (e.selections[0].active.line !== insertionLine) {
        editor.setDecorations(this.decorationType, []);
        this.selectionListener?.dispose();
        this.selectionListener = undefined;
      }
    });
  }

  dispose(): void {
    this.selectionListener?.dispose();
    this.decorationType.dispose();
  }
}
