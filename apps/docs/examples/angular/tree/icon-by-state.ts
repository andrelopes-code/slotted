import { Component, signal } from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlTree, SlTreeCell, SlTreeIcon } from '@slotted/angular/tree';

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

const FOLDER =
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z';
const FOLDER_OPEN =
  'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2';

@Component({
  selector: 'app-tree-icon-by-state',
  imports: [SlGlyph, SlIcon, SlTree, SlTreeCell, SlTreeIcon],
  template: `
    <div
      slTree
      aria-label="Documents"
      [(expandedKeys)]="open"
      [nodes]="folders"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    >
      <ng-template slTreeCell="icon" let-entry [slTreeCellOf]="folders">
        <span slTreeIcon>
          <span slIcon>
            @if (entry.children) {
              <svg
                fill="none"
                stroke="currentColor"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path [attr.d]="open().includes(entry.id) ? folderOpen : folder" />
              </svg>
            } @else {
              <svg slGlyph name="file-text"></svg>
            }
          </span>
        </span>
      </ng-template>
    </div>
  `,
})
export class TreeIconByState {
  protected readonly folders = FOLDERS;
  protected readonly key = (entry: Entry) => entry.id;
  protected readonly name = (entry: Entry) => entry.name;
  protected readonly children = (entry: Entry) => entry.children;
  protected readonly folder = FOLDER;
  protected readonly folderOpen = FOLDER_OPEN;
  protected readonly open = signal<readonly string[]>(['contracts']);
}
