import { StepParameter } from '../models/stepDefinition';
import { CUCUMBER_EXPRESSION_PARAM } from './patterns';
import { extractWords, toCamelCase, FILLER_WORDS } from './textUtils';

export class CucumberParameterExtractor {
  extract(pattern: string): StepParameter[] {
    const parameters: StepParameter[] = [];
    const cucumberParamRegex = new RegExp(CUCUMBER_EXPRESSION_PARAM.source, 'g');
    let match;
    let index = 0;

    while ((match = cucumberParamRegex.exec(pattern)) !== null) {
      const paramType = match[1];
      parameters.push({
        name: this.inferName(pattern, match.index, paramType),
        type: paramType,
        index: index++
      });
    }

    return parameters;
  }

  /**
   * Infer a meaningful parameter name from context for Cucumber expression parameters.
   *
   * Examples:
   * - "I have {int} items"     → "items"
   * - "the {string} button"    → "button"
   * - "user enters {string}"   → "enters"
   */
  private inferName(pattern: string, paramOffset: number, paramType: string): string {
    const beforeParam = pattern.substring(0, paramOffset);
    const afterParam = pattern.substring(paramOffset);

    const closingBrace = afterParam.indexOf('}');
    const textAfter = closingBrace >= 0 ? afterParam.substring(closingBrace + 1) : '';

    const wordsBefore = extractWords(beforeParam);
    const wordsAfter = extractWords(textAfter);
    const lastWordBefore = wordsBefore[wordsBefore.length - 1] || '';
    const firstWordAfter = wordsAfter[0] || '';

    if (firstWordAfter && !FILLER_WORDS.has(firstWordAfter.toLowerCase())) {
      return toCamelCase(firstWordAfter);
    }

    if (lastWordBefore && !FILLER_WORDS.has(lastWordBefore.toLowerCase())) {
      return toCamelCase(lastWordBefore);
    }

    return paramType;
  }
}
