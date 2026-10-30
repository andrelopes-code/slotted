import { Component, effect, signal } from '@angular/core';
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
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlSkeleton, SlSkeletonRegion } from '@slotted/angular/skeleton';

interface Shipment {
  carrier: string;
  tracking: string;
  packages: string;
  delivery: string;
}

const FIELDS: { key: keyof Shipment; term: string; width: string }[] = [
  { key: 'carrier', term: 'Carrier', width: '6rem' },
  { key: 'tracking', term: 'Tracking number', width: '11rem' },
  { key: 'packages', term: 'Packages', width: '8rem' },
  { key: 'delivery', term: 'Estimated delivery', width: '9rem' },
];

@Component({
  selector: 'app-drawer-loading',
  imports: [
    SlButton,
    SlDescriptionList,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlSkeleton,
    SlSkeletonRegion,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      Track shipment SH-4471
    </button>
    <sl-drawer #drawer="slDrawer" [loading]="shipment() === null" [(open)]="open">
      <header slDrawerHeader>
        <h2 slDrawerTitle>Shipment SH-4471</h2>
        <p slDrawerDescription>Order SO-1182 for Contoso Foods, Seattle.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div
          slSkeletonRegion
          [delay]="200"
          [loading]="shipment() === null"
          [messages]="{ label: 'Loading shipment' }"
          [minDuration]="400"
        >
          <div slDescriptionList>
            @for (field of fields; track field.key) {
              <div slDescriptionListItem>
                <dt slDescriptionListTerm>{{ field.term }}</dt>
                <dd slDescriptionListDescription>
                  @if (shipment(); as loaded) {
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
    </sl-drawer>
  `,
})
export class DrawerLoading {
  readonly fields = FIELDS;
  readonly open = signal(false);
  readonly shipment = signal<Shipment | null>(null);

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) return;
      this.shipment.set(null);
      const timer = setTimeout(
        () =>
          this.shipment.set({
            carrier: 'UPS Ground',
            tracking: '1Z 999 AA1 01 2345 6784',
            packages: '3, 18.4 kg in total',
            delivery: 'Thursday, 8 October',
          }),
        1200,
      );
      onCleanup(() => clearTimeout(timer));
    });
  }
}
