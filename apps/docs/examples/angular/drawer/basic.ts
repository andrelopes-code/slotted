import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerFooter,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';

const DETAILS = [
  { term: 'Ship to', value: '1200 Harbor Ave, Seattle, WA' },
  { term: 'Payment', value: 'Captured, card ending 4242' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Warehouse', value: 'Reno, NV' },
  { term: 'Total', value: '$1,240.00' },
];

@Component({
  selector: 'app-drawer-basic',
  imports: [
    SlBadge,
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlInline,
    SlStack,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      View order SO-1182
    </button>
    <sl-drawer #drawer="slDrawer" [(open)]="open">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Order SO-1182</h2>
        <p slDrawerDescription>Contoso Foods, placed on 2 October 2026.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slStack [gap]="4">
          <div slInline>
            <span slBadge tone="accent">Ready to ship</span>
          </div>
          <div slDescriptionList>
            @for (detail of details; track detail.term) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ detail.term }}</dt>
                <dd slDescriptionListDescription>{{ detail.value }}</dd>
              </div>
            }
          </div>
        </div>
      </div>
      <footer slDrawerFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Close</button>
        <button slButton (click)="open.set(false)">Create shipment</button>
      </footer>
    </sl-drawer>
  `,
})
export class DrawerBasic {
  readonly open = signal(false);
  readonly details = DETAILS;
}
