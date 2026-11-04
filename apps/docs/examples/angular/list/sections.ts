import { Component } from '@angular/core';
import {
  SlList,
  SlListSection,
  SlListSectionEnd,
  SlListSectionLabel,
  SlListSectionList,
} from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';

const DAYS = [
  {
    day: 'Today',
    total: '$4,820.00',
    payouts: [
      { id: 'PO-2291', customer: 'Contoso Foods', amount: '$3,150.00' },
      { id: 'PO-2290', customer: 'Aster Bakery', amount: '$1,670.00' },
    ],
  },
  {
    day: 'Yesterday',
    total: '$3,115.50',
    payouts: [
      { id: 'PO-2289', customer: 'Bluefin Market', amount: '$2,240.50' },
      { id: 'PO-2288', customer: 'Driftwood Inn', amount: '$875.00' },
    ],
  },
];

@Component({
  selector: 'app-list-sections',
  imports: [
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemDescription,
    SlListItemEnd,
    SlListItemLabel,
    SlListSection,
    SlListSectionEnd,
    SlListSectionLabel,
    SlListSectionList,
  ],
  template: `
    <ul slList aria-label="Payouts" variant="ruled">
      @for (group of days; track group.day) {
        <li slListSection>
          <h3 slListSectionLabel>
            {{ group.day }}
            <span slListSectionEnd>{{ group.total }}</span>
          </h3>
          <ul slListSectionList>
            @for (payout of group.payouts; track payout.id) {
              <li slListItem>
                <div slListItemContent>
                  <span slListItemBody>
                    <span slListItemLabel>{{ payout.customer }}</span>
                    <span slListItemDescription>{{ payout.id }}</span>
                  </span>
                  <span slListItemEnd>{{ payout.amount }}</span>
                </div>
              </li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
})
export class ListSections {
  readonly days = DAYS;
}
