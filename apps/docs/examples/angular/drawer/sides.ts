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

const SIDES = [
  {
    side: 'start',
    label: 'Start',
    title: 'Warehouses',
    body: 'Reno, Columbus and Savannah. A panel from the start edge suits navigation between sites.',
  },
  {
    side: 'end',
    label: 'End',
    title: 'Order SO-1182',
    body: 'Contoso Foods, 14 cases. The end edge is the default and suits the details of a row.',
  },
  {
    side: 'top',
    label: 'Top',
    title: 'Carrier notice',
    body: 'UPS pickups from Reno run two hours late today. A panel from the top suits a notice that belongs to the whole screen.',
  },
  {
    side: 'bottom',
    label: 'Bottom',
    title: '3 orders selected',
    body: 'SO-1182, SO-1183 and SO-1184. A sheet from the bottom suits actions on a phone, within reach of the thumb.',
  },
] as const;

@Component({
  selector: 'app-drawer-sides',
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
      @for (item of sides; track item.side) {
        <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
          {{ item.label }}
        </button>
        <sl-drawer #drawer="slDrawer" [side]="item.side">
          <header slDrawerHeader>
            <h2 slDrawerTitle>{{ item.title }}</h2>
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
export class DrawerSides {
  readonly sides = SIDES;
}
