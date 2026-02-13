/**
 * Extracts parameter names from method/function signatures that follow
 * step definition declarations.
 *
 * Supports:
 * - C# methods:        public async Task GoShopping(string shoppingCentre, int count)
 * - JS/TS callbacks:   Given('pattern', function(name, age) {
 * - JS/TS arrows:      Given('pattern', (name, age) => {
 * - TS typed params:   Given('pattern', (name: string, age: number) => {
 * - Decorator methods: async goShopping(shoppingCentre: string) {
 */

// C# method signature: looks for a parameter list in a method declaration
// Matches: Task MethodName(string param1, int param2)
const CSHARP_METHOD_REGEX = /\w+\s+\w+\s*\(([^)]*)\)/;

// JS/TS callback or arrow function parameters
// Matches: function(param1, param2) or (param1, param2) =>
const JS_CALLBACK_REGEX = /(?:function\s*)?(\([^)]*\))\s*(?:=>|{)/;

// Decorator-style: method signature on the line itself or next line
// Matches: async methodName(param1: string) { or methodName(param1, param2) {
const DECORATOR_METHOD_REGEX = /(?:async\s+)?\w+\s*\(([^)]*)\)/;

/**
 * Given the lines following a step definition, extract parameter names
 * from the method/function signature.
 *
 * @param followingLines - The lines after the step definition line (typically 1-5)
 * @param language - 'csharp' or 'javascript'
 * @returns Array of parameter names in order, or empty array if not found
 */
export function extractSignatureParamNames(
  followingLines: string[],
  language: 'csharp' | 'javascript'
): string[] {
  const combined = followingLines.join(' ');

  if (language === 'csharp') {
    return parseCSharpSignature(combined);
  }
  return parseJavaScriptSignature(combined);
}

function parseCSharpSignature(text: string): string[] {
  const match = text.match(CSHARP_METHOD_REGEX);
  if (!match || !match[1].trim()) return [];

  return parseParamList(match[1], true);
}

function parseJavaScriptSignature(text: string): string[] {
  // First try inline callback/arrow: Given('...', (param1, param2) => {
  const callbackMatch = text.match(JS_CALLBACK_REGEX);
  if (callbackMatch) {
    const inner = callbackMatch[1].replace(/^\(|\)$/g, '');
    if (inner.trim()) return parseParamList(inner, false);
  }

  // Then try decorator-style method signature
  const methodMatch = text.match(DECORATOR_METHOD_REGEX);
  if (methodMatch && methodMatch[1].trim()) {
    return parseParamList(methodMatch[1], false);
  }

  return [];
}

/**
 * Parse a comma-separated parameter list into an array of names.
 *
 * Handles:
 * - "string shoppingCentre, int count"  (C# typed)
 * - "name, age"                          (JS untyped)
 * - "name: string, age: number"          (TS typed)
 */
function parseParamList(paramString: string, isCSharp: boolean): string[] {
  return paramString
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => {
      if (isCSharp) {
        // C#: "string shoppingCentre" or "ScenarioContext context"
        // Take the last word (the name)
        const parts = p.split(/\s+/);
        return parts[parts.length - 1];
      } else {
        // JS/TS: "name" or "name: string" or "name = defaultVal"
        // Take everything before : or =
        return p.split(/[=:]/)[0].trim();
      }
    })
    .filter(name => name.length > 0);
}
