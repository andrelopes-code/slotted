import { Component, effect, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDescriptionList,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';

interface Invoice {
  customer: string;
  issued: string;
  due: string;
  amount: string;
}

const FIELDS: { key: keyof Invoice; term: string; width: string }[] = [
  { key: 'customer', term: 'Customer', width: '9rem' },
  { key: 'issued', term: 'Issued', width: '6rem' },
  { key: 'due', term: 'Due', width: '6rem' },
  { key: 'amount', term: 'Amount', width: '5rem' },
];

@Component({
  selector: 'app-dialog-loading',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlSkeleton,
    SlSkeletonRegion,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      View invoice INV-2041
    </button>
    <sl-dialog #dialog="slDialog" [loading]="invoice() === null" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Invoice INV-2041</h2>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div
          slSkeletonRegion
          [delay]="200"
          [loading]="invoice() === null"
          [messages]="{ label: 'Loading invoice' }"
        >
          <div slDescriptionList>
            @for (field of fields; track field.key) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ field.term }}</dt>
                <dd slDescriptionListDescription>
                  @if (invoice(); as loaded) {
                    {{ loaded[field.key] }}
                  } @else {
                    <span slSkeleton [inlineSize]="field.width"></span>
                  }
                </dd>
              </div>
            }
          </div>
        </div>
      </div>
    </sl-dialog>
  `,
})
export class DialogLoading {
  readonly fields = FIELDS;
  readonly open = signal(false);
  readonly invoice = signal<Invoice | null>(null);

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) return;
      this.invoice.set(null);
      const timer = setTimeout(
        () =>
          this.invoice.set({
            customer: 'Northwind Traders',
            issued: '12 August 2026',
            due: '11 September 2026',
            amount: '$1,240.00',
          }),
        1200,
      );
      onCleanup(() => clearTimeout(timer));
    });
  }
}
