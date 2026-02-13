import * as vscode from 'vscode';
import { StepDefinitionsProvider } from '../stepDefinitionProvider';
import { SearchBarViewProvider } from '../searchBarViewProvider';

export class SearchCommand {
  constructor(
    private provider: StepDefinitionsProvider,
    private searchBar: SearchBarViewProvider
  ) {}

  async execute(): Promise<void> {
    const searchTerm = await vscode.window.showInputBox({
      prompt: 'Search step definitions (leave empty to clear filter)',
      placeHolder: 'Type to filter step definitions...',
      value: this.provider.getFilter(),
      validateInput: (value) => {
        if (value === '') {
          this.provider.clearFilter();
        } else {
          this.provider.setFilter(value);
        }
        this.searchBar.setQuery(value);
        return null;
      }
    });

    if (searchTerm !== undefined) {
      if (searchTerm === '') {
        this.provider.clearFilter();
        this.searchBar.clearInput();
      } else {
        this.provider.setFilter(searchTerm);
        this.searchBar.setQuery(searchTerm);
      }
    }
  }
}
