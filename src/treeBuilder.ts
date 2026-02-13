import { StepDefinition } from './models/stepDefinition';
import { StepDefinitionItem } from './models/stepDefinitionItem';
import { ConfigurationManager } from './configurationManager';

const STEP_TYPE_ORDER = ['Given', 'When', 'Then', 'And', 'But'];

export class TreeBuilder {
  constructor(private config: ConfigurationManager) {}

  buildTree(stepDefinitions: StepDefinition[], filter: string): StepDefinitionItem[] {
    const filtered = stepDefinitions.filter(s => this.matchesFilter(s, filter));
    const groupByType = this.config.getGroupByType();
    const sort = this.config.getSortAlphabetically();

    if (!groupByType) {
      return this.toItems(filtered, sort);
    }
    return this.buildGroupedTree(filtered, sort);
  }

  private buildGroupedTree(steps: StepDefinition[], sort: boolean): StepDefinitionItem[] {
    const fileGroups = new Map<string, StepDefinition[]>();
    for (const stepDef of steps) {
      const fileName = stepDef.filePath.split(/[\/\\]/).pop() || stepDef.filePath;
      const group = fileGroups.get(fileName);
      if (group) {
        group.push(stepDef);
      } else {
        fileGroups.set(fileName, [stepDef]);
      }
    }

    return Array.from(fileGroups.keys())
      .sort()
      .map(fileName => {
        const fileSteps = fileGroups.get(fileName)!;
        const typeNodes = this.buildTypeNodes(fileSteps, sort);

        return new StepDefinitionItem(
          `${fileName} (${fileSteps.length})`,
          undefined,
          typeNodes
        );
      });
  }

  private buildTypeNodes(steps: StepDefinition[], sort: boolean): StepDefinitionItem[] {
    const typeGroups = new Map<string, StepDefinition[]>();

    for (const stepDef of steps) {
      const group = typeGroups.get(stepDef.type);
      if (group) {
        group.push(stepDef);
      } else {
        typeGroups.set(stepDef.type, [stepDef]);
      }
    }

    return STEP_TYPE_ORDER
      .filter(type => typeGroups.has(type))
      .map(type => {
        const typeSteps = typeGroups.get(type)!;
        return new StepDefinitionItem(
          `${type} (${typeSteps.length})`,
          undefined,
          this.toItems(typeSteps, sort)
        );
      });
  }

  private toItems(stepDefs: StepDefinition[], sort: boolean): StepDefinitionItem[] {
    const items = stepDefs.map(s => new StepDefinitionItem(s.displayText, s));
    return sort ? items.sort((a, b) => a.label.localeCompare(b.label)) : items;
  }

  private matchesFilter(stepDef: StepDefinition, filter: string): boolean {
    if (!filter) return true;

    return stepDef.pattern.toLowerCase().includes(filter) ||
           stepDef.displayText.toLowerCase().includes(filter) ||
           stepDef.filePath.toLowerCase().includes(filter);
  }
}
