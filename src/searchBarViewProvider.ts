import * as vscode from 'vscode';
import { StepDefinitionsProvider } from './stepDefinitionProvider';

export class SearchBarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'pickleJar.searchBar';

  private _view?: vscode.WebviewView;

  constructor(private provider: StepDefinitionsProvider) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'search':
          if (message.value) {
            this.provider.setFilter(message.value);
          } else {
            this.provider.clearFilter();
          }
          break;
        case 'clear':
          this.provider.clearFilter();
          break;
      }
    });
  }

  /** Update the webview input from extension code (e.g. command palette search). */
  setQuery(value: string): void {
    this._view?.webview.postMessage({ type: 'setQuery', value });
  }

  /** Clear the webview input from extension code. */
  clearInput(): void {
    this._view?.webview.postMessage({ type: 'setQuery', value: '' });
    this.provider.clearFilter();
  }

  private getHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      padding: 8px 12px;
      background: transparent;
    }
    .search-container {
      display: flex;
      align-items: center;
      position: relative;
    }
    input {
      width: 100%;
      padding: 4px 28px 4px 8px;
      border: 1px solid var(--vscode-input-border, transparent);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      border-radius: 2px;
      outline: none;
    }
    input:focus {
      border-color: var(--vscode-focusBorder);
    }
    input::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    .clear-btn {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--vscode-input-foreground);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 2px;
      display: none;
      line-height: 1;
      opacity: 0.7;
    }
    .clear-btn:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground, rgba(90, 93, 94, 0.31));
    }
    .clear-btn.visible {
      display: block;
    }
  </style>
</head>
<body>
  <div class="search-container">
    <input type="text" id="search" placeholder="Filter step definitions..." spellcheck="false" />
    <button class="clear-btn" id="clearBtn" title="Clear search">&times;</button>
  </div>
  <script>
    (function() {
      const vscode = acquireVsCodeApi();
      const input = document.getElementById('search');
      const clearBtn = document.getElementById('clearBtn');
      let debounceTimer;

      function updateClearButton() {
        clearBtn.classList.toggle('visible', input.value.length > 0);
      }

      input.addEventListener('input', () => {
        updateClearButton();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          vscode.postMessage({ type: 'search', value: input.value });
        }, 250);
      });

      clearBtn.addEventListener('click', () => {
        input.value = '';
        updateClearButton();
        clearTimeout(debounceTimer);
        vscode.postMessage({ type: 'clear' });
        input.focus();
      });

      // Listen for messages from the extension (e.g. sync from command palette search)
      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.type === 'setQuery') {
          input.value = message.value || '';
          updateClearButton();
        }
      });
    })();
  </script>
</body>
</html>`;
  }
}
