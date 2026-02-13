import { StepDefinition, StepType } from './models/stepDefinition';
import { STEP_DEFINITION_PATTERNS, STEP_TYPE_PATTERN } from './utils/patterns';
import { extractParameters, convertPatternToDisplayText } from './utils/parameterExtractor';

const VALID_STEP_TYPES: StepType[] = ['Given', 'When', 'Then', 'And', 'But'];

export class StepDefinitionParser {
  parseFileContent(text: string, filePath: string): StepDefinition[] {
    const stepDefs: StepDefinition[] = [];
    const lines = text.split('\n');

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];

      for (const { pattern: regex, name: patternName } of STEP_DEFINITION_PATTERNS) {
        regex.lastIndex = 0;
        const matches = regex.exec(line);
        if (!matches) continue;

        const stepType = this.extractStepType(line);
        if (!stepType) continue;

        const isCSharp = patternName === 'specflow-csharp';
        const pattern = isCSharp ? matches[1] : matches[2];
        const delimiter = isCSharp ? '"' : matches[1];

        const hasRegexPatterns = /\([^)]*\)|\\d|\\w|\.\*|\.\+/.test(pattern);
        const isRegex = hasRegexPatterns || (!isCSharp && delimiter === '/');

        stepDefs.push({
          type: stepType,
          pattern,
          displayText: convertPatternToDisplayText(pattern, isRegex),
          filePath,
          lineNumber: lineNumber + 1,
          parameters: extractParameters(pattern, isRegex),
          isRegex,
          rawMatch: matches[0]
        });

        break; // Only match one pattern per line
      }
    }

    return stepDefs;
  }

  private extractStepType(line: string): StepType | null {
    const match = line.match(STEP_TYPE_PATTERN);
    if (!match) return null;

    const type = match[0].replace(/@|\[|\s/g, '');
    const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    return VALID_STEP_TYPES.includes(normalized as StepType)
      ? (normalized as StepType)
      : null;
  }
}
