import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
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
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const EVENTS = [
  { at: 'Oct 6, 7:42 AM', what: 'Out for delivery, Seattle, WA' },
  { at: 'Oct 6, 5:10 AM', what: 'Arrived at the delivery facility, Seattle, WA' },
  { at: 'Oct 5, 11:58 PM', what: 'Departed facility, Portland, OR' },
  { at: 'Oct 5, 9:20 PM', what: 'Arrived at facility, Portland, OR' },
  { at: 'Oct 5, 2:04 PM', what: 'Departed facility, Medford, OR' },
  { at: 'Oct 5, 10:37 AM', what: 'Arrived at facility, Medford, OR' },
  { at: 'Oct 4, 11:15 PM', what: 'Departed facility, Sacramento, CA' },
  { at: 'Oct 4, 6:48 PM', what: 'Arrived at facility, Sacramento, CA' },
  { at: 'Oct 4, 1:30 PM', what: 'Departed facility, Reno, NV' },
  { at: 'Oct 4, 9:02 AM', what: 'Processed at the origin facility, Reno, NV' },
  { at: 'Oct 3, 6:15 PM', what: 'Picked up from the Northwind warehouse, Reno, NV' },
  { at: 'Oct 3, 4:40 PM', what: 'Weighed and labelled: 3 packages, 18.4 kg' },
  { at: 'Oct 3, 2:12 PM', what: 'Packed at station 4, Reno, NV' },
  { at: 'Oct 3, 11:05 AM', what: 'Picked from aisles 12, 14 and 21' },
  { at: 'Oct 2, 4:55 PM', what: 'Released to the warehouse' },
  { at: 'Oct 2, 4:31 PM', what: 'Payment captured, card ending 4242' },
];

@Component({
  selector: 'app-drawer-long-content',
  imports: [
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerFooter,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlStack,
    SlText,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      Tracking history
    </button>
    <sl-drawer #drawer="slDrawer" [(open)]="open">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Tracking 1Z999AA10123456784</h2>
        <p slDrawerDescription>Shipment SH-4471, 16 events since 2 October.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slStack [gap]="4">
          @for (event of events; track event.at) {
            <div slStack [gap]="0">
              <span slText size="sm" tone="muted">{{ event.at }}</span>
              <span slText size="sm">{{ event.what }}</span>
            </div>
          }
        </div>
      </div>
      <footer slDrawerFooter>
        <button slButton variant="ghost" tone="secondary" (click)="open.set(false)">Close</button>
        <button slButton>Email to customer</button>
      </footer>
    </sl-drawer>
  `,
})
export class DrawerLongContent {
  readonly events = EVENTS;
  readonly open = signal(false);
}
