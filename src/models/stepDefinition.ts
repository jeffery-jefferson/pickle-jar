export interface StepDefinition {
  type: 'Given' | 'When' | 'Then' | 'And' | 'But';
  pattern: string;           // Original regex or cucumber expression
  displayText: string;       // Human-readable version for display
  filePath: string;
  lineNumber: number;
  parameters: StepParameter[];
  isRegex: boolean;
  rawMatch: string;
}

export interface StepParameter {
  name: string;              // Inferred parameter name (e.g., "int", "string")
  placeholder: string;       // Default value for snippet (e.g., "0", "text")
  index: number;             // Position in step definition
}

export class StepDefinitionItem {
  constructor(
    public readonly label: string,
    public readonly stepDefinition?: StepDefinition,
    public readonly children?: StepDefinitionItem[]
  ) {}
}
