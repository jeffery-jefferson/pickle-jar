import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';
import { StepDefinitionItem } from './models/stepDefinitionItem';
import { StepDefinitionScanner } from './stepDefinitionScanner';
import { TreeBuilder } from './treeBuilder';
import { ConfigurationManager } from './configurationManager';

const STEP_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  Given: { icon: 'circle-filled', color: 'charts.green' },
  When:  { icon: 'circle-filled', color: 'charts.purple' },
  Then:  { icon: 'circle-filled', color: 'charts.blue' },
  And:   { icon: 'circle-filled', color: 'charts.yellow' },
  But:   { icon: 'circle-filled', color: 'charts.orange' },
};

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
    this.updateMessage();
    this._onDidChangeTreeData.fire(undefined);
  }

  setFilter(filter: string): void {
    this.searchFilter = filter.toLowerCase().trim();
    this.updateMessage();
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

  private updateMessage(): void {
    if (!this.searchFilter) {
      this._message = undefined;
      return;
    }

    const results = this.treeBuilder.buildTree(this.stepDefinitions, this.searchFilter);
    this._message = results.length === 0
      ? `No steps matching "${this.searchFilter}"`
      : `🔍 Filtering: "${this.searchFilter}"`;
  }

  getTreeItem(element: StepDefinitionItem): vscode.TreeItem {
    const isGroup = element.children !== undefined;
    const isFileGroup = isGroup && !!element.label.match(/\.(cs|ts|js)\s*\(/);

    // File groups collapse by default; type groups expand
    const collapsibleState = isGroup
      ? (isFileGroup
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded)
      : vscode.TreeItemCollapsibleState.None;

    const treeItem = new vscode.TreeItem(element.label, collapsibleState);

    if (isGroup) {
      treeItem.iconPath = new vscode.ThemeIcon(
        isFileGroup ? 'file' : 'symbol-namespace'
      );
      return treeItem;
    }

    if (!element.stepDefinition) return treeItem;

    const stepDef = element.stepDefinition;
    const showFilePath = this.config.getShowFilePath();

    // Color-coded icon based on step type
    const typeStyle = STEP_TYPE_ICONS[stepDef.type];
    if (typeStyle) {
      treeItem.iconPath = new vscode.ThemeIcon(
        typeStyle.icon,
        new vscode.ThemeColor(typeStyle.color)
      );
    } else {
      treeItem.iconPath = new vscode.ThemeIcon('symbol-key');
    }

    treeItem.command = {
      command: 'pickleJar.insertStep',
      title: 'Insert Step',
      arguments: [stepDef]
    };

    treeItem.tooltip = showFilePath
      ? `${stepDef.filePath}:${stepDef.lineNumber}\n\nPattern: ${stepDef.pattern}\n\nClick to insert · Right-click for more options`
      : `Pattern: ${stepDef.pattern}\n\nClick to insert · Right-click for more options`;

    if (showFilePath) {
      treeItem.description = `(line ${stepDef.lineNumber})`;
    }

    treeItem.contextValue = 'stepDefinition';

    return treeItem;
  }

  getChildren(element?: StepDefinitionItem): Thenable<StepDefinitionItem[]> {
    if (element) {
      return Promise.resolve(element.children || []);
    }
    return Promise.resolve(this.treeBuilder.buildTree(this.stepDefinitions, this.searchFilter));
  }
}
