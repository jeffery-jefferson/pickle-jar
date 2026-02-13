export const STEP_DEFINITION_PATTERNS = [
  // C# SpecFlow: [Given("pattern")] or [When(@"pattern")]
  // Must be checked before Cucumber.js to avoid false matches on [When("...")] syntax
  {
    pattern: /\[\s*(?:Given|When|Then|And|But)\s*\(\s*@?"(.+?)"\s*\)\s*\]/g,
    name: 'specflow-csharp',
    language: 'csharp'
  },
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
  }
];

export const STEP_TYPE_PATTERN = /(?:Given|When|Then|And|But|given|when|then|and|but|@given|@when|@then|@and|@but|\[Given|\[When|\[Then|\[And|\[But)/;

export const CUCUMBER_EXPRESSION_PARAM = /\{([^}]+)\}/g;
