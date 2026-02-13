import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';
import { StepDefinitionItem } from './models/stepDefinitionItem';
import { StepDefinitionScanner } from './stepDefinitionScanner';
import { TreeBuilder } from './treeBuilder';
import { ConfigurationManager } from './configurationManager';

export class StepDefinitionsProvider implements vscode.TreeDataProvider<StepDefinitionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StepDefinitionItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private stepDefinitions: StepDefinition[] = [];
  private searchFilter = '';
  private _message: string | undefined;

  constructor(
    private scanner: StepDefinitionScanner,
    private treeBuilder: TreeBuilder,
    private config: ConfigurationManager
  ) {}

  get message(): string | undefined {
    return this._message;
  }

  async refresh(): Promise<void> {
    this.stepDefinitions = await this.scanner.scanWorkspace();
    this._onDidChangeTreeData.fire(undefined);
  }

  setFilter(filter: string): void {
    this.searchFilter = filter.toLowerCase().trim();
    this._message = this.searchFilter
      ? `🔍 Filtering: "${this.searchFilter}"`
      : undefined;
    this._onDidChangeTreeData.fire(undefined);
  }

  clearFilter(): void {
    this.searchFilter = '';
    this._message = undefined;
    this._onDidChangeTreeData.fire(undefined);
  }

  getFilter(): string {
    return this.searchFilter;
  }

  getTreeItem(element: StepDefinitionItem): vscode.TreeItem {
    const isGroup = element.children !== undefined;

    const treeItem = new vscode.TreeItem(
      element.label,
      isGroup
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    if (isGroup) {
      treeItem.iconPath = new vscode.ThemeIcon(
        element.label.match(/\.(cs|ts|js)\s*\(/) ? 'file' : 'symbol-namespace'
      );
      return treeItem;
    }

    if (!element.stepDefinition) return treeItem;

    const stepDef = element.stepDefinition;
    const showFilePath = this.config.getShowFilePath();

    treeItem.command = {
      command: 'pickleJar.insertStep',
      title: 'Insert Step',
      arguments: [stepDef]
    };

    treeItem.tooltip = showFilePath
      ? `${stepDef.filePath}:${stepDef.lineNumber}\n\nPattern: ${stepDef.pattern}\n\nRight-click → Go to Definition to open source`
      : `Pattern: ${stepDef.pattern}\n\nRight-click → Go to Definition to open source`;

    if (showFilePath) {
      treeItem.description = `(line ${stepDef.lineNumber})`;
    }

    treeItem.contextValue = 'stepDefinition';
    treeItem.iconPath = new vscode.ThemeIcon('symbol-key');

    return treeItem;
  }

  getChildren(element?: StepDefinitionItem): Thenable<StepDefinitionItem[]> {
    if (element) {
      return Promise.resolve(element.children || []);
    }
    return Promise.resolve(this.treeBuilder.buildTree(this.stepDefinitions, this.searchFilter));
  }
}
