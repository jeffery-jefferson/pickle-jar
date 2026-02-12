import * as vscode from 'vscode';

export class ConfigurationManager {
  private config = vscode.workspace.getConfiguration('pickleJar');

  getStepDefinitionPatterns(): string[] {
    return this.config.get<string[]>('stepDefinitionPatterns', [
      '**/*.steps.ts',
      '**/*.steps.js',
      '**/*Steps.cs',
      '**/*StepDefinitions.cs',
      '**/step_definitions/**/*.ts',
      '**/step_definitions/**/*.js',
      '**/StepDefinitions/**/*.cs',
      '**/steps/**/*.ts',
      '**/steps/**/*.js',
      '**/Steps/**/*.cs'
    ]);
  }

  getExcludePatterns(): string[] {
    return this.config.get<string[]>('excludePatterns', [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/.git/**'
    ]);
  }

  getGroupByType(): boolean {
    return this.config.get<boolean>('groupByType', true);
  }

  getSortAlphabetically(): boolean {
    return this.config.get<boolean>('sortAlphabetically', true);
  }

  getShowFilePath(): boolean {
    return this.config.get<boolean>('showFilePath', true);
  }

  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('pickleJar')) {
        this.config = vscode.workspace.getConfiguration('pickleJar');
        callback();
      }
    });
  }
}
