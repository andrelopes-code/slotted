import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

@Component({
  selector: 'app-list-selection',
  imports: [
    SlBadge,
    SlCheckbox,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlListItemStart,
    SlStack,
    SlText,
    SlVisuallyHidden,
  ],
  template: `
    <div slStack [gap]="3">
      <ul slList aria-label="Orders to pick" variant="ruled">
        @for (order of orders; track order.id) {
          <li slListItem [selected]="picked().includes(order.id)">
            <div slListItemContent>
              <span slListItemStart>
                <span
                  slCheckbox
                  [checked]="picked().includes(order.id)"
                  (checkedChange)="pick(order.id, $event.value)"
                >
                  <span slVisuallyHidden>Pick {{ order.id }}</span>
                </span>
              </span>
              <span slListItemBody>
                <span slListItemLabel>{{ order.id }}</span>
                <span slListItemDescription>{{ order.customer }}</span>
              </span>
              <span slListItemEnd>
                <span slBadge variant="soft">{{ order.lines }} lines</span>
              </span>
            </div>
          </li>
        }
      </ul>
      <span slText size="sm" tone="muted">
        {{ picked().length }} of {{ orders.length }} orders on the pick list
      </span>
    </div>
  `,
})
export class ListSelection {
  readonly orders = [
    { id: 'SO-1182', customer: 'Contoso Foods', lines: 6 },
    { id: 'SO-1183', customer: 'Atlas Freight', lines: 2 },
    { id: 'SO-1184', customer: 'Ember Goods', lines: 11 },
  ];

  readonly picked = signal<string[]>(['SO-1182']);

  pick(id: string, checked: boolean) {
    this.picked.update((current) =>
      checked ? [...current, id] : current.filter((entry) => entry !== id),
    );
  }
}
