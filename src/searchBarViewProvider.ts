import * as vscode from 'vscode';
import { StepDefinitionsProvider } from './stepDefinitionProvider';

const STEP_TYPE_COLORS: Record<string, string> = {
  Given: '#4ec9b0',
  When:  '#c586c0',
  Then:  '#569cd6',
  And:   '#dcdcaa',
  But:   '#ce9178',
};

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
          this.sendResults(message.value);
          break;
        case 'clear':
          this._view?.webview.postMessage({ type: 'results', results: [] });
          break;
        case 'insertStep': {
          const steps = this.provider.searchSteps(message.query);
          const step = steps.find(s =>
            s.type === message.stepType &&
            s.displayText === message.displayText
          );
          if (step) {
            vscode.commands.executeCommand('pickleJar.insertStep', step);
          }
          break;
        }
      }
    });
  }

  /** Update the webview input from extension code. */
  setQuery(value: string): void {
    this._view?.webview.postMessage({ type: 'setQuery', value });
    if (value) {
      this.sendResults(value);
    }
  }

  /** Clear the webview input from extension code. */
  clearInput(): void {
    this._view?.webview.postMessage({ type: 'setQuery', value: '' });
    this._view?.webview.postMessage({ type: 'results', results: [] });
  }

  private sendResults(query: string): void {
    const steps = this.provider.searchSteps(query);
    const results = steps.map(s => ({
      type: s.type,
      displayText: s.displayText,
      color: STEP_TYPE_COLORS[s.type] || '#d4d4d4',
      fileName: s.filePath.split(/[\/\\]/).pop() || '',
    }));
    this._view?.webview.postMessage({ type: 'results', results, query });
  }

  private getHtml(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      padding: 8px 8px 0;
      background: transparent;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
    }
    .search-container {
      display: flex;
      align-items: center;
      position: relative;
    }
    input {
      width: 100%;
      padding: 5px 28px 5px 8px;
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
    .clear-btn.visible { display: block; }

    .results {
      margin-top: 6px;
      max-height: 100vh;
      overflow-y: auto;
    }
    .result-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 3px;
      line-height: 1.4;
    }
    .result-item:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .step-type {
      font-weight: 600;
      font-size: 0.85em;
      flex-shrink: 0;
    }
    .step-text {
      color: var(--vscode-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .result-file {
      margin-left: auto;
      font-size: 0.8em;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
      opacity: 0.7;
    }
    .no-results {
      padding: 8px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
    .result-count {
      padding: 4px 8px;
      font-size: 0.8em;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="search-container">
    <input type="text" id="search" placeholder="Search step definitions..." spellcheck="false" />
    <button class="clear-btn" id="clearBtn" title="Clear search">&times;</button>
  </div>
  <div id="results" class="results"></div>
  <script>
    (function() {
      const vscode = acquireVsCodeApi();
      const input = document.getElementById('search');
      const clearBtn = document.getElementById('clearBtn');
      const resultsDiv = document.getElementById('results');
      let debounceTimer;
      let currentQuery = '';

      function updateClearButton() {
        clearBtn.classList.toggle('visible', input.value.length > 0);
      }

      input.addEventListener('input', () => {
        updateClearButton();
        clearTimeout(debounceTimer);
        const val = input.value;
        debounceTimer = setTimeout(() => {
          currentQuery = val;
          if (val) {
            vscode.postMessage({ type: 'search', value: val });
          } else {
            resultsDiv.innerHTML = '';
            vscode.postMessage({ type: 'clear' });
          }
        }, 200);
      });

      clearBtn.addEventListener('click', () => {
        input.value = '';
        currentQuery = '';
        updateClearButton();
        clearTimeout(debounceTimer);
        resultsDiv.innerHTML = '';
        vscode.postMessage({ type: 'clear' });
        input.focus();
      });

      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'setQuery') {
          input.value = msg.value || '';
          currentQuery = msg.value || '';
          updateClearButton();
        } else if (msg.type === 'results') {
          renderResults(msg.results, msg.query);
        }
      });

      function renderResults(results, query) {
        if (!results || results.length === 0) {
          resultsDiv.innerHTML = query
            ? '<div class="no-results">No matching steps</div>'
            : '';
          return;
        }
        let html = '<div class="result-count">' + results.length + ' result' + (results.length !== 1 ? 's' : '') + '</div>';
        for (const r of results) {
          html += '<div class="result-item" data-type="' + escapeAttr(r.type) + '" data-text="' + escapeAttr(r.displayText) + '">'
            + '<span class="step-type" style="color:' + r.color + '">' + escapeHtml(r.type) + '</span>'
            + '<span class="step-text">' + escapeHtml(r.displayText) + '</span>'
            + '<span class="result-file">' + escapeHtml(r.fileName) + '</span>'
            + '</div>';
        }
        resultsDiv.innerHTML = html;

        resultsDiv.querySelectorAll('.result-item').forEach(el => {
          el.addEventListener('click', () => {
            vscode.postMessage({
              type: 'insertStep',
              stepType: el.dataset.type,
              displayText: el.dataset.text,
              query: currentQuery
            });
          });
        });
      }

      function escapeHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }
      function escapeAttr(s) {
        return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }
    })();
  </script>
</body>
</html>`;
  }
}
