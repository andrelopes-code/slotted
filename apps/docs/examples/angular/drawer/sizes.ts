import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

const SIZES = [
  { size: 'sm', body: '18rem. One field or a short list, such as the carrier for a shipment.' },
  { size: 'md', body: '24rem, the default. The details of an order or a short form.' },
  { size: 'lg', body: '30rem. A record with a table of lines, such as the items of an order.' },
  { size: 'xl', body: '40rem. Two columns, such as a customer and their open orders.' },
  { size: 'full', body: 'The whole screen. A task that needs every column, such as a pick list.' },
] as const;

@Component({
  selector: 'app-drawer-sizes',
  imports: [
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlInline,
    SlText,
  ],
  template: `
    <div slInline [gap]="2">
      @for (item of sizes; track item.size) {
        <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
          {{ item.size }}
        </button>
        <sl-drawer #drawer="slDrawer" [size]="item.size">
          <header slDrawerHeader>
            <h2 slDrawerTitle>Shipment SH-4471</h2>
            <button slDrawerClose></button>
          </header>
          <div slDrawerBody>
            <span slText size="sm">{{ item.body }}</span>
          </div>
        </sl-drawer>
      }
    </div>
  `,
})
export class DrawerSizes {
  readonly sizes = SIZES;
}
