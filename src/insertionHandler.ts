import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';

export class InsertionHandler implements vscode.Disposable {
  private parameterDecorationType = vscode.window.createTextEditorDecorationType({
    border: '1px dotted rgba(255, 255, 255, 0.4)',
    borderRadius: '2px',
  });

  private tabHintDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentText: '  Press Tab for next parameter',
      color: new vscode.ThemeColor('editorCodeLens.foreground'),
      fontStyle: 'italic',
      margin: '0 0 0 12px',
    },
  });

  private statusBarItem: vscode.StatusBarItem;
  private selectionListener: vscode.Disposable | undefined;
  private snippetExitListener: vscode.Disposable | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
  }

  async insertStepDefinition(stepDef: StepDefinition): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const isFeatureFile =
      editor.document.fileName.endsWith('.feature') ||
      editor.document.languageId === 'feature' ||
      editor.document.languageId === 'cucumber';

    if (!isFeatureFile) {
      vscode.window.showWarningMessage(
        'Pickle Jar: Please open a .feature file to insert step definitions'
      );
      return;
    }

    const insertionLine = editor.selection.active.line;
    await editor.insertSnippet(this.createSnippet(stepDef));

    if (stepDef.parameters.length > 0) {
      this.applyParameterDecorations(editor, insertionLine, stepDef);
      this.showTabHint(editor, insertionLine, stepDef.parameters.length);
    }
  }

  private createSnippet(stepDef: StepDefinition): vscode.SnippetString {
    let snippetText = `${stepDef.type} ${stepDef.displayText}`;
    let paramIndex = 0;

    snippetText = snippetText.replace(/<([^>]+)>/g, (_match, paramName) => {
      paramIndex++;
      return `\${${paramIndex}:<${paramName}>}`;
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
      const token = `<${param.name}>`;
      const idx = lineText.indexOf(token, searchStart);
      if (idx === -1) continue;

      const range = new vscode.Range(
        new vscode.Position(insertionLine, idx),
        new vscode.Position(insertionLine, idx + token.length)
      );

      const hoverMessage = new vscode.MarkdownString();
      hoverMessage.appendMarkdown(
        `**${param.name}** \`{${param.type}}\`\n\nPress \`Tab\` for next parameter`
      );

      decorations.push({ range, hoverMessage });
      searchStart = idx + token.length;
    }

    editor.setDecorations(this.parameterDecorationType, decorations);
  }

  private showTabHint(
    editor: vscode.TextEditor,
    insertionLine: number,
    paramCount: number
  ): void {
    // Show inline "Tab → next parameter" hint after the line
    const lineEnd = editor.document.lineAt(insertionLine).range.end;
    editor.setDecorations(this.tabHintDecorationType, [
      { range: new vscode.Range(lineEnd, lineEnd) }
    ]);

    // Show status bar hint
    this.statusBarItem.text = `$(arrow-right) ${paramCount} parameter${paramCount > 1 ? 's' : ''} — Press Tab for next parameter`;
    this.statusBarItem.tooltip = 'Pickle Jar: Press Tab to go to the next parameter';
    this.statusBarItem.show();

    this.trackSnippetCompletion(editor, insertionLine);
  }

  private trackSnippetCompletion(editor: vscode.TextEditor, insertionLine: number): void {
    this.selectionListener?.dispose();
    this.snippetExitListener?.dispose();

    // Clean up when cursor leaves the insertion line
    this.selectionListener = vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor !== editor) return;

      if (e.selections[0].active.line !== insertionLine) {
        this.clearAllHints(editor);
      }
    });

    // Clean up when the active editor changes (snippet abandoned)
    this.snippetExitListener = vscode.window.onDidChangeActiveTextEditor(() => {
      this.clearAllHints(editor);
    });
  }

  private clearAllHints(editor: vscode.TextEditor): void {
    editor.setDecorations(this.parameterDecorationType, []);
    editor.setDecorations(this.tabHintDecorationType, []);
    this.statusBarItem.hide();
    this.selectionListener?.dispose();
    this.selectionListener = undefined;
    this.snippetExitListener?.dispose();
    this.snippetExitListener = undefined;
  }

  dispose(): void {
    this.selectionListener?.dispose();
    this.snippetExitListener?.dispose();
    this.parameterDecorationType.dispose();
    this.tabHintDecorationType.dispose();
    this.statusBarItem.dispose();
  }
}
