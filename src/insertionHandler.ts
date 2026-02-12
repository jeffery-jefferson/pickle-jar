import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';
import { inferPlaceholder } from './utils/parameterExtractor';

export class InsertionHandler {
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

    const snippet = this.createSnippet(stepDef);
    await editor.insertSnippet(snippet);
  }

  private createSnippet(stepDef: StepDefinition): vscode.SnippetString {
    let snippetText = `${stepDef.type} ${stepDef.displayText}`;

    if (stepDef.parameters.length > 0) {
      // Replace parameters with snippet placeholders
      let paramIndex = 0;

      if (stepDef.isRegex) {
        // For regex patterns, replace {type} placeholders (already converted in displayText)
        snippetText = snippetText.replace(/\{([^}]+)\}/g, () => {
          paramIndex++;
          const param = stepDef.parameters[paramIndex - 1];
          if (param) {
            return `\${${paramIndex}:${param.placeholder}}`;
          }
          return `\${${paramIndex}:value}`;
        });
      } else {
        // For Cucumber expressions, replace {type} with snippet placeholders
        snippetText = snippetText.replace(/\{([^}]+)\}/g, (match, paramType) => {
          paramIndex++;
          const placeholder = inferPlaceholder(paramType);
          return `\${${paramIndex}:${placeholder}}`;
        });
      }
    }

    // Add final cursor position
    snippetText += '$0';

    return new vscode.SnippetString(snippetText);
  }
}
