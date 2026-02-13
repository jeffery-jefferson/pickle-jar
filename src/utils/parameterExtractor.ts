import { StepParameter } from '../models/stepDefinition';
import { RegexParameterExtractor } from './regexParameterExtractor';
import { CucumberParameterExtractor } from './cucumberParameterExtractor';

const regexExtractor = new RegexParameterExtractor();
const cucumberExtractor = new CucumberParameterExtractor();

export function extractParameters(
  pattern: string,
  isRegex: boolean,
  signatureNames: string[] = []
): StepParameter[] {
  return isRegex
    ? regexExtractor.extract(pattern, signatureNames)
    : cucumberExtractor.extract(pattern, signatureNames);
}

export function convertPatternToDisplayText(
  pattern: string,
  isRegex: boolean,
  signatureNames: string[] = []
): string {
  return isRegex
    ? regexExtractor.convertToDisplayText(pattern, signatureNames)
    : cucumberExtractor.convertToDisplayText(pattern, signatureNames);
}
