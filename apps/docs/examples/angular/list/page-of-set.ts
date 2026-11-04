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

@Component({
  selector: 'app-list-page-of-set',
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
    <ul slList aria-label="Orders 41 to 43 of 128" variant="ruled">
      @for (order of orders; track order.id) {
        <li slListItem [position]="order.position" [setSize]="128">
          <div slListItemContent>
            <span slListItemBody>
              <span slListItemLabel>{{ order.id }}</span>
              <span slListItemDescription>{{ order.customer }}</span>
            </span>
            <span slListItemEnd>{{ order.total }}</span>
          </div>
        </li>
      }
    </ul>
  `,
})
export class ListPageOfSet {
  readonly orders = [
    { position: 41, id: 'SO-1141', customer: 'Granite Outfitters', total: '$612.40' },
    { position: 42, id: 'SO-1142', customer: 'Cobalt Fitness', total: '$1,208.00' },
    { position: 43, id: 'SO-1143', customer: 'Fernhill School', total: '$94.75' },
  ];
}
