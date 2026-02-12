export const STEP_DEFINITION_PATTERNS = [
  // Standard Cucumber.js: Given('pattern', callback) or Given(/regex/, callback)
  {
    pattern: /(?:Given|When|Then|And|But)\s*\(\s*(['"`/])(.+?)\1/g,
    name: 'standard'
  },
  // Decorator syntax: @given('pattern')
  {
    pattern: /@(?:given|when|then|and|but)\s*\(\s*(['"`/])(.+?)\1/gi,
    name: 'decorator'
  }
];

export const STEP_TYPE_PATTERN = /^(?:Given|When|Then|And|But|given|when|then|and|but|@given|@when|@then|@and|@but)/;

export const CUCUMBER_EXPRESSION_PARAM = /\{([^}]+)\}/g;
export const REGEX_CAPTURE_GROUP = /\([^)]*\)/g;
