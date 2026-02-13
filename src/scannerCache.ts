import { StepDefinition } from './models/stepDefinition';

export class ScannerCache {
  private cache = new Map<string, { mtime: number; stepDefs: StepDefinition[] }>();

  get(filePath: string, currentMtime: number): StepDefinition[] | null {
    const cached = this.cache.get(filePath);
    return (cached && cached.mtime === currentMtime) ? cached.stepDefs : null;
  }

  set(filePath: string, mtime: number, stepDefs: StepDefinition[]): void {
    this.cache.set(filePath, { mtime, stepDefs });
  }

  clear(): void {
    this.cache.clear();
  }
}
