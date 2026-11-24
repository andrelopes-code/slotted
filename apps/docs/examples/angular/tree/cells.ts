import { Component } from '@angular/core';
import { SlTree, SlTreeCell, SlTreeDescription, SlTreeMeta } from '@slotted/angular/tree';

interface Location {
  id: string;
  name: string;
  units?: number;
  status?: string;
  children?: Location[];
}

const LOCATIONS: Location[] = [
  {
    id: 'cmh',
    name: 'Columbus, OH',
    children: [
      { id: 'cmh-a', name: 'Zone A', units: 1840 },
      { id: 'cmh-b', name: 'Zone B', units: 920, status: 'Counting' },
    ],
  },
  {
    id: 'rno',
    name: 'Reno, NV',
    children: [
      { id: 'rno-a', name: 'Zone A', units: 2310 },
      { id: 'rno-cold', name: 'Cold storage', units: 415 },
    ],
  },
];

@Component({
  selector: 'app-tree-cells',
  imports: [SlTree, SlTreeCell, SlTreeDescription, SlTreeMeta],
  template: `
    <div
      slTree
      aria-label="Stock locations"
      [expandedKeys]="['cmh']"
      [nodes]="locations"
      [getKey]="key"
      [getLabel]="name"
      [getChildren]="children"
    >
      <ng-template slTreeCell="description" let-location [slTreeCellOf]="locations">
        @if (location.status; as status) {
          <span slTreeDescription>{{ status }}</span>
        }
      </ng-template>
      <ng-template slTreeCell="meta" let-location [slTreeCellOf]="locations">
        <span slTreeMeta>{{ amount(location) }}</span>
      </ng-template>
    </div>
  `,
})
export class TreeCells {
  protected readonly locations = LOCATIONS;
  protected readonly key = (location: Location) => location.id;
  protected readonly name = (location: Location) => location.name;
  protected readonly children = (location: Location) => location.children;
  protected readonly amount = (location: Location) =>
    location.units?.toLocaleString('en-US') ?? `${location.children?.length ?? 0} zones`;
}
