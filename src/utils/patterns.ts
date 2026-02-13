export const STEP_DEFINITION_PATTERNS = [
  // Standard Cucumber.js: Given('pattern', callback) or Given(/regex/, callback)
  {
    pattern: /(?:Given|When|Then|And|But)\s*\(\s*(['"`/])(.+?)\1/g,
    name: 'cucumber-js-standard',
    language: 'javascript'
  },
  // Decorator syntax: @given('pattern')
  {
    pattern: /@(?:given|when|then|and|but)\s*\(\s*(['"`/])(.+?)\1/gi,
    name: 'cucumber-js-decorator',
    language: 'javascript'
  },
  // C# SpecFlow: [Given("pattern")] or [When(@"pattern")]
  {
    pattern: /\[\s*(?:Given|When|Then|And|But)\s*\(\s*@?"(.+?)"\s*\)\s*\]/g,
    name: 'specflow-csharp',
    language: 'csharp'
  }
];

export const STEP_TYPE_PATTERN = /(?:Given|When|Then|And|But|given|when|then|and|but|@given|@when|@then|@and|@but|\[Given|\[When|\[Then|\[And|\[But)/;

export const CUCUMBER_EXPRESSION_PARAM = /\{([^}]+)\}/g;