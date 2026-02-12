import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';
import { STEP_DEFINITION_PATTERNS, STEP_TYPE_PATTERN } from './utils/patterns';
import { extractParameters, convertPatternToDisplayText } from './utils/parameterExtractor';

export class StepDefinitionScanner {
  private cache = new Map<string, { mtime: number; stepDefs: StepDefinition[] }>();

  async scanWorkspace(): Promise<StepDefinition[]> {
    const allStepDefs: StepDefinition[] = [];
    const config = vscode.workspace.getConfiguration('pickleJar');
    const patterns = config.get<string[]>('stepDefinitionPatterns', []);
    const excludePatterns = config.get<string[]>('excludePatterns', []);

    if (!vscode.workspace.workspaceFolders) {
      return allStepDefs;
    }

    for (const folder of vscode.workspace.workspaceFolders) {
      for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, pattern),
          `{${excludePatterns.join(',')}}`
        );

        for (const fileUri of files) {
          const stepDefs = await this.scanFile(fileUri);
          allStepDefs.push(...stepDefs);
        }
      }
    }

    return allStepDefs;
  }

  async scanFile(fileUri: vscode.Uri): Promise<StepDefinition[]> {
    try {
      // Check cache first
      const cached = await this.getCached(fileUri);
      if (cached) {
        return cached;
      }

      const content = await vscode.workspace.fs.readFile(fileUri);
      const text = Buffer.from(content).toString('utf8');
      const stepDefs = this.parseStepDefinitions(text, fileUri.fsPath);

      // Update cache
      const stats = await vscode.workspace.fs.stat(fileUri);
      this.cache.set(fileUri.fsPath, {
        mtime: stats.mtime,
        stepDefs
      });

      return stepDefs;
    } catch (error) {
      console.error(`Error scanning file ${fileUri.fsPath}:`, error);
      return [];
    }
  }

  private async getCached(fileUri: vscode.Uri): Promise<StepDefinition[] | null> {
    try {
      const stats = await vscode.workspace.fs.stat(fileUri);
      const cached = this.cache.get(fileUri.fsPath);

      if (cached && cached.mtime === stats.mtime) {
        return cached.stepDefs;
      }
    } catch (error) {
      // File might not exist anymore
    }

    return null;
  }

  private parseStepDefinitions(text: string, filePath: string): StepDefinition[] {
    const stepDefs: StepDefinition[] = [];
    const lines = text.split('\n');

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];

      // Try each pattern
      for (const { pattern: regex } of STEP_DEFINITION_PATTERNS) {
        // Reset regex lastIndex for global regex
        regex.lastIndex = 0;
        const matches = regex.exec(line);

        if (matches) {
          const stepType = this.extractStepType(line);
          if (!stepType) continue;

          const delimiter = matches[1]; // ', ", `, or /
          const pattern = matches[2];
          const isRegex = delimiter === '/';

          const parameters = extractParameters(pattern, isRegex);
          const displayText = convertPatternToDisplayText(pattern, isRegex);

          stepDefs.push({
            type: stepType,
            pattern,
            displayText,
            filePath,
            lineNumber: lineNumber + 1,
            parameters,
            isRegex,
            rawMatch: matches[0]
          });
        }
      }
    }

    return stepDefs;
  }

  private extractStepType(line: string): 'Given' | 'When' | 'Then' | 'And' | 'But' | null {
    const match = line.match(STEP_TYPE_PATTERN);
    if (!match) return null;

    const type = match[0].replace('@', '');
    const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    if (['Given', 'When', 'Then', 'And', 'But'].includes(normalized)) {
      return normalized as 'Given' | 'When' | 'Then' | 'And' | 'But';
    }

    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }

  removeCachedFile(filePath: string): void {
    this.cache.delete(filePath);
  }
}
