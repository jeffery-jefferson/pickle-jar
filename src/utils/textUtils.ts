export const DELIMITER_REGEX = /^[\/^]+|[\/\$]+$/g;

export const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'has', 'have', 'i', 'we', 'they'
]);

export function stripDelimiters(pattern: string): string {
  return pattern.replace(DELIMITER_REGEX, '');
}

export function extractWords(text: string): string[] {
  return text.match(/\b\w+\b/g) || [];
}

export function toCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}
