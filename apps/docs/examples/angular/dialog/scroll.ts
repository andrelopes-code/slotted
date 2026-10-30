import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const ITEMS = Array.from({ length: 24 }, (_, index) => ({
  sku: `NW-${String(4100 + index * 7)}`,
  name: [
    'Chai, 10 boxes',
    'Aniseed syrup, 12 bottles',
    'Cajun seasoning, 48 jars',
    'Olive oil, 36 bottles',
    'Dried pears, 12 packs',
    'Curry sauce, 12 jars',
  ][index % 6],
}));

const TERMS = [
  'Prices are in US dollars and exclude sales tax, which is added at the rate of the delivery address.',
  'Payment is due 30 days from the invoice date. Balances unpaid after 45 days accrue interest at 1% a month.',
  'Goods travel at the risk of Northwind Traders until they are signed for at the delivery address.',
  'Damaged goods are reported within 5 business days of delivery, with photos of the packaging and the label.',
  'Returns of undamaged goods are accepted within 30 days and are refunded less a 10% restocking fee.',
  'Orders above $5,000 may be split into several shipments, each invoiced when it leaves the warehouse.',
  'Either party may end a standing order with 14 days of written notice; shipments already picked are invoiced.',
  'These terms are governed by the law of the State of Washington.',
];

@Component({
  selector: 'app-dialog-scroll',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <div slInline [gap]="2">
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="items">
        Review 24 line items
      </button>
      <sl-dialog #items="slDialog" [(open)]="open">
        <header slDialogHeader>
          <h2 slDialogTitle>Purchase order PO-7730</h2>
          <p slDialogDescription>Only the list scrolls; the actions stay in view.</p>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <div slStack [gap]="2">
            @for (item of lineItems; track item.sku) {
              <div slInline [gap]="3" justify="between">
                <span slText size="sm">{{ item.name }}</span>
                <span slText size="sm" tone="muted">{{ item.sku }}</span>
              </div>
            }
          </div>
        </div>
        <footer slDialogFooter>
          <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">
            Cancel
          </button>
          <button slButton (click)="open.set(false)">Approve order</button>
        </footer>
      </sl-dialog>
      <button slButton tone="secondary" variant="outline" [slDialogTrigger]="terms">
        Read the terms of sale
      </button>
      <sl-dialog #terms="slDialog" scroll="viewport">
        <header slDialogHeader>
          <h2 slDialogTitle>Terms of sale</h2>
          <button slDialogClose></button>
        </header>
        <div slDialogBody>
          <div slStack [gap]="4">
            @for (term of termsOfSale; track term) {
              <span slText>{{ term }}</span>
            }
          </div>
        </div>
      </sl-dialog>
    </div>
  `,
})
export class DialogScroll {
  readonly open = signal(false);
  readonly lineItems = ITEMS;
  readonly termsOfSale = TERMS;
}
