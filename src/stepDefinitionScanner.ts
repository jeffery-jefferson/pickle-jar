import * as vscode from 'vscode';
import { StepDefinition } from './models/stepDefinition';
import { StepDefinitionParser } from './stepDefinitionParser';
import { ScannerCache } from './scannerCache';
import { ConfigurationManager } from './configurationManager';

export class StepDefinitionScanner {
  private parser = new StepDefinitionParser();
  private cache = new ScannerCache();

  constructor(private config: ConfigurationManager) {}

  async scanWorkspace(): Promise<StepDefinition[]> {
    const patterns = this.config.getStepDefinitionPatterns();
    const excludePatterns = this.config.getExcludePatterns();

    if (!vscode.workspace.workspaceFolders) {
      return [];
    }

    const excludePattern = this.buildExcludePattern(excludePatterns);
    const scannedFiles = new Set<string>();
    const allStepDefs: StepDefinition[] = [];

    for (const folder of vscode.workspace.workspaceFolders) {
      for (const pattern of patterns) {
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(folder, pattern),
          excludePattern
        );

        for (const fileUri of files) {
          if (scannedFiles.has(fileUri.fsPath)) continue;
          scannedFiles.add(fileUri.fsPath);

          const stepDefs = await this.scanFile(fileUri);
          allStepDefs.push(...stepDefs);
        }
      }
    }

    return allStepDefs;
  }

  async scanFile(fileUri: vscode.Uri): Promise<StepDefinition[]> {
    try {
      const stats = await vscode.workspace.fs.stat(fileUri);
      const cached = this.cache.get(fileUri.fsPath, stats.mtime);
      if (cached) return cached;

      const content = await vscode.workspace.fs.readFile(fileUri);
      const text = Buffer.from(content).toString('utf8');
      const stepDefs = this.parser.parseFileContent(text, fileUri.fsPath);

      this.cache.set(fileUri.fsPath, stats.mtime, stepDefs);
      return stepDefs;
    } catch (error) {
      console.error(`[Pickle Jar] Error scanning file ${fileUri.fsPath}:`, error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private buildExcludePattern(excludePatterns: string[]): string | undefined {
    const baseFolders = excludePatterns.map(p =>
      p.replace(/^\*\*\//, '').replace(/\/\*\*$/, '')
    );
    return baseFolders.length > 0
      ? `**/{${baseFolders.join(',')}}/**`
      : undefined;
  }
}
