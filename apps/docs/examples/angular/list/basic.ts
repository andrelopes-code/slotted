import { Component } from '@angular/core';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';

const WAREHOUSES = [
  { id: 'reno', name: 'Reno', summary: '312 orders to ship today', open: '1,284' },
  { id: 'columbus', name: 'Columbus', summary: '198 orders to ship today', open: '962' },
  { id: 'savannah', name: 'Savannah', summary: '74 orders to ship today', open: '418' },
];

@Component({
  selector: 'app-list-basic',
  imports: [
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
  ],
  template: `
    <ul slList aria-label="Warehouses" variant="ruled">
      @for (warehouse of warehouses; track warehouse.id) {
        <li slListItem>
          <a slListItemContent [href]="'#' + warehouse.id">
            <span slListItemBody>
              <span slListItemLabel>{{ warehouse.name }}</span>
              <span slListItemDescription>{{ warehouse.summary }}</span>
            </span>
            <span slListItemEnd>{{ warehouse.open }}</span>
          </a>
        </li>
      }
    </ul>
  `,
})
export class ListBasic {
  readonly warehouses = WAREHOUSES;
}
