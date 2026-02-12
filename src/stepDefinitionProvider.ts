import * as vscode from 'vscode';
import { StepDefinition, StepDefinitionItem } from './models/stepDefinition';
import { StepDefinitionScanner } from './stepDefinitionScanner';

export class StepDefinitionsProvider implements vscode.TreeDataProvider<StepDefinitionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<StepDefinitionItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private stepDefinitions: StepDefinition[] = [];

  constructor(private scanner: StepDefinitionScanner) {}

  async refresh(): Promise<void> {
    this.stepDefinitions = await this.scanner.scanWorkspace();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: StepDefinitionItem): vscode.TreeItem {
    const isGroup = element.children !== undefined;

    const treeItem = new vscode.TreeItem(
      element.label,
      isGroup
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    if (!isGroup && element.stepDefinition) {
      // Leaf node - actual step definition
      const stepDef = element.stepDefinition;

      treeItem.command = {
        command: 'pickleJar.insertStep',
        title: 'Insert Step',
        arguments: [stepDef]
      };

      const config = vscode.workspace.getConfiguration('pickleJar');
      const showFilePath = config.get<boolean>('showFilePath', true);

      if (showFilePath) {
        const fileName = stepDef.filePath.split(/[\/\\]/).pop() || stepDef.filePath;
        treeItem.tooltip = `${stepDef.filePath}:${stepDef.lineNumber}\n\nPattern: ${stepDef.pattern}`;
        treeItem.description = `(${fileName}:${stepDef.lineNumber})`;
      } else {
        treeItem.tooltip = `Pattern: ${stepDef.pattern}`;
      }

      treeItem.contextValue = 'stepDefinition';
      treeItem.iconPath = new vscode.ThemeIcon('symbol-key');
    } else {
      // Group node
      treeItem.iconPath = new vscode.ThemeIcon('folder');
    }

    return treeItem;
  }

  getChildren(element?: StepDefinitionItem): Thenable<StepDefinitionItem[]> {
    if (!element) {
      // Root level - return groups
      return Promise.resolve(this.getGroupNodes());
    } else {
      // Return children of group
      return Promise.resolve(element.children || []);
    }
  }

  private getGroupNodes(): StepDefinitionItem[] {
    const config = vscode.workspace.getConfiguration('pickleJar');
    const groupByType = config.get<boolean>('groupByType', true);
    const sortAlphabetically = config.get<boolean>('sortAlphabetically', true);

    if (!groupByType) {
      // Return flat list
      return this.createStepDefinitionItems(this.stepDefinitions, sortAlphabetically);
    }

    // Group by step type
    const groups = new Map<string, StepDefinition[]>();
    const orderedTypes = ['Given', 'When', 'Then', 'And', 'But'];

    // Initialize groups
    orderedTypes.forEach(type => groups.set(type, []));

    // Populate groups
    this.stepDefinitions.forEach(stepDef => {
      const group = groups.get(stepDef.type);
      if (group) {
        group.push(stepDef);
      }
    });

    // Create group nodes
    const groupNodes: StepDefinitionItem[] = [];

    orderedTypes.forEach(type => {
      const stepDefs = groups.get(type) || [];
      if (stepDefs.length > 0) {
        const children = this.createStepDefinitionItems(stepDefs, sortAlphabetically);
        groupNodes.push(
          new StepDefinitionItem(
            `${type} (${stepDefs.length})`,
            undefined,
            children
          )
        );
      }
    });

    return groupNodes;
  }

  private createStepDefinitionItems(
    stepDefs: StepDefinition[],
    sort: boolean
  ): StepDefinitionItem[] {
    let items = stepDefs.map(stepDef =>
      new StepDefinitionItem(stepDef.displayText, stepDef)
    );

    if (sort) {
      items = items.sort((a, b) => a.label.localeCompare(b.label));
    }

    return items;
  }

  getStepDefinitions(): StepDefinition[] {
    return this.stepDefinitions;
  }
}
