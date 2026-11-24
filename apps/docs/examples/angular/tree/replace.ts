import { Component } from '@angular/core';
import { SlTree } from '@slotted/angular/tree';

interface Entry {
  id: string;
  name: string;
  children?: Entry[];
}

const FOLDERS: Entry[] = [
  {
    id: 'contracts',
    name: 'Contracts',
    children: [
      { id: 'contoso', name: 'Contoso Foods 2026.pdf' },
      { id: 'fabrikam', name: 'Fabrikam Supply 2026.pdf' },
      { id: 'atlas', name: 'Atlas Freight renewal.pdf' },
    ],
  },
  {
    id: 'forecasts',
    name: 'Forecasts',
    children: [
      { id: 'q3', name: 'Q3 demand.xlsx' },
      { id: 'q4', name: 'Q4 demand.xlsx' },
    ],
  },
];

@Component({
  selector: 'app-tree-replace',
  imports: [SlTree],
  template: `
    <div
      slTree
      aria-label="Documents"
      expandOn="expander"
      selectionBehavior="replace"
      selectionIndicator="highlight"
      selectionMode="multiple"
      [expandedKeys]="['contracts', 'forecasts']"
      [value]="['contoso', 'fabrikam']"
      [nodes]="folders"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    ></div>
  `,
})
export class TreeReplace {
  protected readonly folders = FOLDERS;
  protected readonly key = (entry: Entry) => entry.id;
  protected readonly name = (entry: Entry) => entry.name;
  protected readonly children = (entry: Entry) => entry.children;
}
