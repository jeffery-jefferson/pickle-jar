import * as vscode from 'vscode';
import { SearchBarViewProvider } from '../searchBarViewProvider';

export class SearchCommand {
  constructor(private searchBar: SearchBarViewProvider) {}

  async execute(): Promise<void> {
    const searchTerm = await vscode.window.showInputBox({
      prompt: 'Search step definitions',
      placeHolder: 'Type to search step definitions...',
      validateInput: (value) => {
        this.searchBar.setQuery(value);
        return null;
      }
    });

    if (searchTerm !== undefined) {
      if (searchTerm === '') {
        this.searchBar.clearInput();
      } else {
        this.searchBar.setQuery(searchTerm);
      }
    }
  }
}
