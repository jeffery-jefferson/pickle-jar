import { StepParameter } from '../models/stepDefinition';
import { CUCUMBER_EXPRESSION_PARAM, REGEX_CAPTURE_GROUP } from './patterns';

export function extractParameters(pattern: string, isRegex: boolean): StepParameter[] {
  const parameters: StepParameter[] = [];

  if (isRegex) {
    // Extract regex capture groups
    const matches = pattern.matchAll(REGEX_CAPTURE_GROUP);
    let index = 0;
    for (const match of matches) {
      const paramType = inferParameterTypeFromRegex(match[0]);
      parameters.push({
        name: paramType,
        placeholder: inferPlaceholder(paramType),
        index: index++
      });
    }
  } else {
    // Extract Cucumber expression parameters
    const matches = pattern.matchAll(CUCUMBER_EXPRESSION_PARAM);
    let index = 0;
    for (const match of matches) {
      const paramType = match[1];
      parameters.push({
        name: paramType,
        placeholder: inferPlaceholder(paramType),
        index: index++
      });
    }
  }

  return parameters;
}

export function inferParameterTypeFromRegex(regexGroup: string): string {
  if (/\\d/.test(regexGroup)) return 'int';
  if (/float|decimal/.test(regexGroup)) return 'float';
  if (/\\w/.test(regexGroup)) return 'word';
  if (/\.\*/.test(regexGroup)) return 'string';
  return 'value';
}

export function inferPlaceholder(paramType: string): string {
  const placeholders: Record<string, string> = {
    'int': '0',
    'float': '0.0',
    'string': 'text',
    'word': 'word',
    'byte': '0',
    'short': '0',
    'long': '0',
    'double': '0.0',
    'bigdecimal': '0.0',
    'biginteger': '0'
  };

  return placeholders[paramType.toLowerCase()] || 'value';
}

export function convertPatternToDisplayText(pattern: string, isRegex: boolean): string {
  let displayText = pattern;

  if (isRegex) {
    // Remove regex delimiters and anchors
    displayText = displayText.replace(/^[\/^]+|[\/\$]+$/g, '');

    // Replace common regex patterns with readable placeholders
    displayText = displayText.replace(/\\d\+/g, '{int}');
    displayText = displayText.replace(/\\d\*/g, '{int?}');
    displayText = displayText.replace(/\.\*/g, '{string}');
    displayText = displayText.replace(/\\w\+/g, '{word}');
    displayText = displayText.replace(/\([^)]*\)/g, (match) => {
      const type = inferParameterTypeFromRegex(match);
      return `{${type}}`;
    });

    // Remove remaining regex escape characters
    displayText = displayText.replace(/\\/g, '');
  }

  return displayText;
}
