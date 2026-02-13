import { StepParameter } from '../models/stepDefinition';
import { CUCUMBER_EXPRESSION_PARAM } from './patterns';
import { extractWords, toCamelCase, FILLER_WORDS } from './textUtils';

export class CucumberParameterExtractor {
  extract(pattern: string, signatureNames: string[] = []): StepParameter[] {
    const parameters: StepParameter[] = [];
    const cucumberParamRegex = new RegExp(CUCUMBER_EXPRESSION_PARAM.source, 'g');
    let match;
    let index = 0;

    while ((match = cucumberParamRegex.exec(pattern)) !== null) {
      const paramType = match[1];
      const name = signatureNames[index] || this.inferName(pattern, match.index, paramType);
      parameters.push({
        name,
        type: paramType,
        index: index++
      });
    }

    return parameters;
  }

  /**
   * Convert Cucumber expression parameters like {int}, {string} to <paramName> placeholders.
   *
   * Examples:
   * - "I have {int} items"           → "I have <items> items" (inferred)
   * - "the {string} button"          → "the <button> button" (inferred)
   * - With signature name "count"    → "I have <count> items"
   */
  convertToDisplayText(pattern: string, signatureNames: string[] = []): string {
    const cucumberParamRegex = new RegExp(CUCUMBER_EXPRESSION_PARAM.source, 'g');
    const replacements: Array<{ match: string; offset: number; paramName: string }> = [];
    let match;
    let index = 0;

    while ((match = cucumberParamRegex.exec(pattern)) !== null) {
      const paramType = match[1];
      const paramName = signatureNames[index] || this.inferName(pattern, match.index, paramType);
      replacements.push({
        match: match[0],
        offset: match.index,
        paramName
      });
      index++;
    }

    // Replace from last to first to preserve offsets
    let displayText = pattern;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      displayText =
        displayText.substring(0, r.offset) +
        `<${r.paramName}>` +
        displayText.substring(r.offset + r.match.length);
    }

    return displayText;
  }

  /**
   * Infer a meaningful parameter name from context for Cucumber expression parameters.
   * Used as a fallback when no method signature is available.
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
