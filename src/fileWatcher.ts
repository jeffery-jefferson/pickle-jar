import * as vscode from 'vscode';
import { debounce } from './utils/debounce';

export class StepDefinitionWatcher implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debouncedCallback: (() => void) | null = null;

  activate(patterns: string[], onChangeCallback: () => void): void {
    // Create debounced callback
    this.debouncedCallback = debounce(onChangeCallback, 500);

    // Create a watcher for each pattern
    patterns.forEach(pattern => {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidCreate(() => this.debouncedCallback?.());
      watcher.onDidChange(() => this.debouncedCallback?.());
      watcher.onDidDelete(() => this.debouncedCallback?.());

      this.watchers.push(watcher);
    });
  }

  dispose(): void {
    this.watchers.forEach(watcher => watcher.dispose());
    this.watchers = [];
  }
}
