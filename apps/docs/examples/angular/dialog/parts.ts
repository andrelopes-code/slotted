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
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';

const DETAILS = [
  { term: 'Carrier', value: 'UPS Ground' },
  { term: 'Tracking number', value: '1Z 999 AA1 01 2345 6784' },
  { term: 'Packages', value: '3, 18.4 kg in total' },
  { term: 'Estimated delivery', value: 'Thursday, 8 October' },
];

@Component({
  selector: 'app-dialog-parts',
  imports: [
    SlBadge,
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      View shipment
    </button>
    <sl-dialog #dialog="slDialog" [(open)]="open">
      <header slDialogHeader>
        <h2 slDialogTitle>Shipment SH-4471</h2>
        <p slDialogDescription>Order SO-1182 for Contoso Foods, Seattle.</p>
        <span slBadge tone="accent">In transit</span>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slDescriptionList>
          @for (detail of details; track detail.term) {
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>{{ detail.term }}</dt>
              <dd slDescriptionListDescription>{{ detail.value }}</dd>
            </div>
          }
        </div>
      </div>
      <footer slDialogFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Close</button>
        <button slButton>Print label</button>
      </footer>
    </sl-dialog>
  `,
})
export class DialogParts {
  readonly open = signal(false);
  readonly details = DETAILS;
}
