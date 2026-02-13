import { StepParameter } from '../models/stepDefinition';
import { RegexParameterExtractor } from './regexParameterExtractor';
import { CucumberParameterExtractor } from './cucumberParameterExtractor';

const regexExtractor = new RegexParameterExtractor();
const cucumberExtractor = new CucumberParameterExtractor();

export function extractParameters(pattern: string, isRegex: boolean): StepParameter[] {
  return isRegex
    ? regexExtractor.extract(pattern)
    : cucumberExtractor.extract(pattern);
}

export function convertPatternToDisplayText(pattern: string, isRegex: boolean): string {
  return isRegex
    ? regexExtractor.convertToDisplayText(pattern)
    : pattern;
}
