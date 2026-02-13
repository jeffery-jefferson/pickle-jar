import { StepDefinition } from './stepDefinition';

export class StepDefinitionItem {
  constructor(
    public readonly label: string,
    public readonly stepDefinition?: StepDefinition,
    public readonly children?: StepDefinitionItem[]
  ) {}
}
