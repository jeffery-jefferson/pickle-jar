import * as vscode from 'vscode';
import { ConfigurationManager } from './configurationManager';
import { StepDefinitionScanner } from './stepDefinitionScanner';
import { TreeBuilder } from './treeBuilder';
import { StepDefinitionsProvider } from './stepDefinitionProvider';
import { InsertionHandler } from './insertionHandler';
import { StepDefinitionWatcher } from './fileWatcher';
import { GoToDefinitionCommand } from './commands/goToDefinitionCommand';
import { SearchCommand } from './commands/searchCommand';

export function activate(context: vscode.ExtensionContext) {
  const configManager = new ConfigurationManager();
  const scanner = new StepDefinitionScanner(configManager);
  const treeBuilder = new TreeBuilder(configManager);
  const provider = new StepDefinitionsProvider(scanner, treeBuilder, configManager);
  const insertionHandler = new InsertionHandler();
  const watcher = new StepDefinitionWatcher();
  const goToDefinition = new GoToDefinitionCommand();
  const searchCommand = new SearchCommand(provider);

  const treeView = vscode.window.createTreeView('pickleJar.stepDefinitions', {
    treeDataProvider: provider,
    showCollapseAll: true
  });

  provider.onDidChangeTreeData(() => {
    treeView.message = provider.message;
  });

  watcher.activate(configManager.getStepDefinitionPatterns(), () => provider.refresh());

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand('pickleJar.insertStep', (s) => insertionHandler.insertStepDefinition(s)),
    vscode.commands.registerCommand('pickleJar.refresh', async () => {
      scanner.clearCache();
      await provider.refresh();
      vscode.window.showInformationMessage('Pickle Jar: Step definitions refreshed');
    }),
    vscode.commands.registerCommand('pickleJar.search', () => searchCommand.execute()),
    vscode.commands.registerCommand('pickleJar.clearSearch', () => {
      provider.clearFilter();
      vscode.window.showInformationMessage('Pickle Jar: Search filter cleared');
    }),
    vscode.commands.registerCommand('pickleJar.goToDefinition', (item) => goToDefinition.execute(item)),
    watcher,
    configManager.onConfigurationChanged(async () => {
      watcher.dispose();
      watcher.activate(configManager.getStepDefinitionPatterns(), () => provider.refresh());
      await provider.refresh();
    }),
    insertionHandler
  );

  provider.refresh().catch(error => {
    console.error('[Pickle Jar] Error during initial scan:', error);
  });
}

export function deactivate() {}
