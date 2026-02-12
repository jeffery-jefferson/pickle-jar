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
        treeItem.description = `(line ${stepDef.lineNumber})`;
      } else {
        treeItem.tooltip = `Pattern: ${stepDef.pattern}`;
      }

      treeItem.contextValue = 'stepDefinition';
      treeItem.iconPath = new vscode.ThemeIcon('symbol-key');
    } else {
      // Group node (file or type)
      // File nodes have labels like "filename.cs (count)"
      // Type nodes have labels like "Given (count)"
      const isFileNode = element.label.match(/\.(cs|ts|js)\s*\(/);

      if (isFileNode) {
        treeItem.iconPath = new vscode.ThemeIcon('file');
      } else {
        treeItem.iconPath = new vscode.ThemeIcon('symbol-namespace');
      }
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

    // Group by file first, then by step type
    const fileGroups = new Map<string, StepDefinition[]>();

    // Group all step definitions by file
    this.stepDefinitions.forEach(stepDef => {
      const fileName = stepDef.filePath.split(/[\/\\]/).pop() || stepDef.filePath;
      if (!fileGroups.has(fileName)) {
        fileGroups.set(fileName, []);
      }
      fileGroups.get(fileName)!.push(stepDef);
    });

    // Create file nodes with nested step type groups
    const fileNodes: StepDefinitionItem[] = [];
    const orderedTypes = ['Given', 'When', 'Then', 'And', 'But'];

    // Sort file names alphabetically
    const sortedFileNames = Array.from(fileGroups.keys()).sort();

    sortedFileNames.forEach(fileName => {
      const stepDefs = fileGroups.get(fileName)!;

      // Group step definitions within this file by type
      const typeGroups = new Map<string, StepDefinition[]>();
      orderedTypes.forEach(type => typeGroups.set(type, []));

      stepDefs.forEach(stepDef => {
        const group = typeGroups.get(stepDef.type);
        if (group) {
          group.push(stepDef);
        }
      });

      // Create type nodes for this file
      const typeNodes: StepDefinitionItem[] = [];

      orderedTypes.forEach(type => {
        const typeStepDefs = typeGroups.get(type) || [];
        if (typeStepDefs.length > 0) {
          const children = this.createStepDefinitionItems(typeStepDefs, sortAlphabetically);
          typeNodes.push(
            new StepDefinitionItem(
              `${type} (${typeStepDefs.length})`,
              undefined,
              children
            )
          );
        }
      });

      // Create file node with type nodes as children
      fileNodes.push(
        new StepDefinitionItem(
          `${fileName} (${stepDefs.length})`,
          undefined,
          typeNodes
        )
      );
    });

    return fileNodes;
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
