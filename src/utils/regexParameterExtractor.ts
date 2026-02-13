import { StepParameter } from '../models/stepDefinition';
import { stripDelimiters, extractWords, toCamelCase } from './textUtils';

const CAPTURE_GROUP_REGEX = /\([^)]*\)/g;

export class RegexParameterExtractor {
  extract(pattern: string, signatureNames: string[] = []): StepParameter[] {
    const parameters: StepParameter[] = [];
    const cleanPattern = stripDelimiters(pattern);
    let match;
    let index = 0;

    while ((match = CAPTURE_GROUP_REGEX.exec(cleanPattern)) !== null) {
      const name = signatureNames[index] || this.inferName(cleanPattern, match.index);
      parameters.push({
        name,
        type: this.inferType(match[0]),
        index: index++
      });
    }

    CAPTURE_GROUP_REGEX.lastIndex = 0;
    return parameters;
  }

  convertToDisplayText(pattern: string, signatureNames: string[] = []): string {
    let displayText = stripDelimiters(pattern);
    const cleanedPattern = displayText;

    const captureGroups: Array<{ match: string; offset: number; paramName: string }> = [];
    let match;
    let index = 0;

    while ((match = CAPTURE_GROUP_REGEX.exec(cleanedPattern)) !== null) {
      const paramName = signatureNames[index] || this.inferName(cleanedPattern, match.index);
      captureGroups.push({
        match: match[0],
        offset: match.index,
        paramName
      });
      index++;
    }

    CAPTURE_GROUP_REGEX.lastIndex = 0;

    // Replace from last to first to preserve offsets
    for (let i = captureGroups.length - 1; i >= 0; i--) {
      const group = captureGroups[i];
      displayText =
        displayText.substring(0, group.offset) +
        `<${group.paramName}>` +
        displayText.substring(group.offset + group.match.length);
    }

    // Remove remaining regex escape characters
    return displayText.replace(/\\/g, '');
  }

  inferType(regexGroup: string): string {
    if (/\\d/.test(regexGroup)) return 'int';
    if (/float|decimal/.test(regexGroup)) return 'float';
    if (/\\w/.test(regexGroup)) return 'word';
    if (/\.\*/.test(regexGroup)) return 'string';
    return 'value';
  }

  /**
   * Infer a meaningful parameter name from surrounding context in a regex pattern.
   * Used as a fallback when no method signature is available.
   *
   * Examples:
   * - "the http response is (.*)" → "httpResponse"
   * - "I have (\d+) items"       → "items"
   * - "the (.*) button"          → "button"
   */
  inferName(pattern: string, captureGroupOffset: number): string {
    const cleanPattern = stripDelimiters(pattern);
    const beforeCapture = cleanPattern.substring(0, captureGroupOffset);
    const afterCapture = cleanPattern.substring(captureGroupOffset);

    const wordsBefore = extractWords(beforeCapture);
    const lastWordsBefore = wordsBefore.slice(-3);
    const firstWordsAfter = extractWords(afterCapture).slice(0, 2);

    const captureGroupMatch = afterCapture.match(/^\([^)]*\)/);
    const captureGroup = captureGroupMatch ? captureGroupMatch[0] : '(.*)';
    const paramType = this.inferType(captureGroup);

    let inferredName = '';

    if (lastWordsBefore.length > 0) {
      const contextWord = lastWordsBefore[lastWordsBefore.length - 1];

      if (['is', 'are', 'was', 'were'].includes(contextWord)) {
        // "the response is (.*)" → "response"
        if (lastWordsBefore.length >= 2) {
          inferredName = lastWordsBefore[lastWordsBefore.length - 2];
        }
      } else if (['has', 'have'].includes(contextWord)) {
        // "I have (\d+) items" → "items"
        if (firstWordsAfter.length > 0) {
          inferredName = firstWordsAfter[0];
        }
      } else {
        inferredName = contextWord;
      }
    }

    if (!inferredName && firstWordsAfter.length > 0) {
      inferredName = firstWordsAfter[0];
    }

    if (inferredName) {
      // Strip articles
      inferredName = inferredName.replace(/^(the|a|an)$/i, '');

      // Build camelCase for "X Y is" patterns → "xY"
      const lastWord = lastWordsBefore[lastWordsBefore.length - 1];
      if (lastWordsBefore.length >= 2 && (lastWord === 'is' || lastWord === 'are')) {
        const words = lastWordsBefore.slice(0, -1);
        if (words.length >= 2) {
          inferredName = words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        }
      }

      return toCamelCase(inferredName);
    }

    return paramType;
  }
}
