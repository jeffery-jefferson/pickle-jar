import * as vscode from 'vscode';
import { StepDefinitionScanner } from './stepDefinitionScanner';
import { StepDefinitionsProvider } from './stepDefinitionProvider';
import { InsertionHandler } from './insertionHandler';
import { StepDefinitionWatcher } from './fileWatcher';
import { ConfigurationManager } from './configurationManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('Pickle Jar extension is now active');

  // Initialize components
  const scanner = new StepDefinitionScanner();
  const provider = new StepDefinitionsProvider(scanner);
  const insertionHandler = new InsertionHandler();
  const watcher = new StepDefinitionWatcher();
  const configManager = new ConfigurationManager();

  // Register TreeView
  const treeView = vscode.window.createTreeView('pickleJar.stepDefinitions', {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  // Register commands
  const insertStepCommand = vscode.commands.registerCommand(
    'pickleJar.insertStep',
    async (stepDef) => {
      await insertionHandler.insertStepDefinition(stepDef);
    }
  );

  const refreshCommand = vscode.commands.registerCommand(
    'pickleJar.refresh',
    async () => {
      scanner.clearCache();
      await provider.refresh();
      vscode.window.showInformationMessage('Pickle Jar: Step definitions refreshed');
    }
  );

  const searchCommand = vscode.commands.registerCommand(
    'pickleJar.search',
    async () => {
      const searchTerm = await vscode.window.showInputBox({
        prompt: 'Search step definitions',
        placeHolder: 'Type to filter step definitions...',
        value: ''
      });

      if (searchTerm !== undefined) {
        if (searchTerm === '') {
          provider.clearFilter();
        } else {
          provider.setFilter(searchTerm);
        }
      }
    }
  );

  const clearSearchCommand = vscode.commands.registerCommand(
    'pickleJar.clearSearch',
    () => {
      provider.clearFilter();
      vscode.window.showInformationMessage('Pickle Jar: Search filter cleared');
    }
  );

  const goToDefinitionCommand = vscode.commands.registerCommand(
    'pickleJar.goToDefinition',
    async (item) => {
      try {
        // When invoked from context menu, we receive a StepDefinitionItem
        // When invoked programmatically, we receive a StepDefinition
        // Extract the actual StepDefinition
        const stepDef = item.stepDefinition || item;

        if (!stepDef || !stepDef.filePath) {
          vscode.window.showErrorMessage('Invalid step definition');
          return;
        }

        const uri = vscode.Uri.file(stepDef.filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document);

        // Navigate to the specific line
        const lineNumber = stepDef.lineNumber - 1; // VSCode uses 0-based line numbers
        const position = new vscode.Position(lineNumber, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    }
  );

  // Start file watching
  const patterns = configManager.getStepDefinitionPatterns();
  watcher.activate(patterns, async () => {
    await provider.refresh();
  });

  // Listen for configuration changes
  const configListener = configManager.onConfigurationChanged(async () => {
    // Restart file watcher with new patterns
    watcher.dispose();
    const newPatterns = configManager.getStepDefinitionPatterns();
    watcher.activate(newPatterns, async () => {
      await provider.refresh();
    });

    // Refresh tree view
    await provider.refresh();
  });

  // Initial scan
  provider.refresh().catch(error => {
    console.error('[Pickle Jar] Error during initial scan:', error);
  });

  // Register disposables
  context.subscriptions.push(
    treeView,
    insertStepCommand,
    refreshCommand,
    searchCommand,
    clearSearchCommand,
    goToDefinitionCommand,
    watcher,
    configListener
  );
}

export function deactivate() {
  console.log('Pickle Jar extension is now deactivated');
}
