export type StepType = 'Given' | 'When' | 'Then' | 'And' | 'But';

export interface StepDefinition {
  type: StepType;
  pattern: string;
  displayText: string;
  filePath: string;
  lineNumber: number;
  parameters: StepParameter[];
  isRegex: boolean;
  rawMatch: string;
}

export interface StepParameter {
  name: string;
  type: string;
  index: number;
}
