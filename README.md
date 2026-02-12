# Pickle Jar

A VSCode extension that makes writing Gherkin tests easier by providing a visual toolbox of available step definitions.

## Features

- **Step Definition Discovery**: Automatically scans your workspace for existing step definitions in TypeScript/JavaScript files
- **Visual Toolbox**: Displays all step definitions in a sidebar panel organized by type (Given/When/Then)
- **Easy Insertion**: Click to insert step definitions into your `.feature` files
- **Smart Parameters**: Parameterized step definitions include snippet placeholders that you can tab through
- **Real-time Updates**: File watcher automatically refreshes the toolbox when step definitions change

## Usage

1. Open a workspace that contains Gherkin feature files and step definitions
2. Open the "Pickle Jar" panel in the Explorer sidebar
3. Browse available step definitions organized by type
4. Click on a step definition to insert it at your cursor position in a `.feature` file
5. For parameterized steps, use Tab to navigate through parameter placeholders

## Configuration

You can customize the extension behavior through VSCode settings:

- `pickleJar.stepDefinitionPatterns`: Glob patterns for finding step definition files (default: `**/*.steps.ts`, `**/*.steps.js`, etc.)
- `pickleJar.excludePatterns`: Patterns to exclude from search (default: `**/node_modules/**`, `**/dist/**`, etc.)
- `pickleJar.groupByType`: Group step definitions by type (default: `true`)
- `pickleJar.sortAlphabetically`: Sort step definitions alphabetically (default: `true`)
- `pickleJar.showFilePath`: Show file path in tooltips (default: `true`)

## Requirements

- VSCode 1.80.0 or higher
- A project with Gherkin feature files and Cucumber/Cucumber.js step definitions

## Supported Step Definition Formats

Pickle Jar supports the following step definition formats:

- Standard Cucumber.js: `Given('pattern', callback)`, `When(/regex/, callback)`, etc.
- Decorator syntax: `@given('pattern')`, `@when(/regex/)`, etc.

## Development

To build and test the extension locally:

```bash
npm install
npm run compile
```

Press F5 in VSCode to launch the Extension Development Host.

## License

MIT
