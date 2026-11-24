import { Component } from '@angular/core';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlList } from '@slotted/angular/list';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemEnd,
  SlListItemLabel,
} from '@slotted/angular/list-item';
import { SlHeading, SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-card-bleed',
  imports: [
    SlCard,
    SlCardBody,
    SlCardHeader,
    SlHeading,
    SlList,
    SlListItem,
    SlListItemBody,
    SlListItemContent,
    SlListItemEnd,
    SlListItemLabel,
    SlText,
  ],
  template: `
    <div slCard>
      <div slCardHeader>
        <h2 slHeading size="md">Open invoices</h2>
        <p slText size="sm" tone="muted">Due before 31 December</p>
      </div>
      <div slCardBody bleed>
        <ul slList aria-label="Open invoices" variant="ruled">
          @for (invoice of invoices; track invoice.id) {
            <li slListItem>
              <div slListItemContent>
                <span slListItemBody>
                  <span slListItemLabel>{{ invoice.supplier }}</span>
                </span>
                <span slListItemEnd>{{ invoice.amount }}</span>
              </div>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class CardBleed {
  protected readonly invoices = [
    { id: '20418', supplier: 'Meridian Packaging', amount: '$4,820.00' },
    { id: '20431', supplier: 'Alder Freight', amount: '$12,115.50' },
    { id: '20437', supplier: 'Kestrel Pallets', amount: '$1,340.00' },
  ];
}
