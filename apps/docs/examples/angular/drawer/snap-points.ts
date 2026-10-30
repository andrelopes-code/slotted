import { Component, signal } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import {
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerDescription,
  SlDrawerHeader,
  SlDrawerResizer,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const SHIPMENTS = [
  { id: 'SH-4471', to: 'Contoso Foods, Seattle', status: 'In transit', tone: 'accent' },
  { id: 'SH-4472', to: 'Fabrikam Grocers, Portland', status: 'In transit', tone: 'accent' },
  { id: 'SH-4473', to: 'Tailspin Market, Boise', status: 'Delayed', tone: 'warning' },
  { id: 'SH-4474', to: 'Adventure Works, Denver', status: 'In transit', tone: 'accent' },
  {
    id: 'SH-4475',
    to: 'Litware Deli, Salt Lake City',
    status: 'Out for delivery',
    tone: 'success',
  },
  { id: 'SH-4476', to: 'Proseware Cafe, Spokane', status: 'In transit', tone: 'accent' },
  { id: 'SH-4477', to: 'Wingtip Bakery, Eugene', status: 'Delayed', tone: 'warning' },
  { id: 'SH-4478', to: 'Coho Winery, Walla Walla', status: 'Out for delivery', tone: 'success' },
  { id: 'SH-4479', to: 'Northwind Outlet, Reno', status: 'In transit', tone: 'accent' },
  { id: 'SH-4480', to: 'Fourth Coffee, Tacoma', status: 'In transit', tone: 'accent' },
] as const;

@Component({
  selector: 'app-drawer-snap-points',
  imports: [
    SlBadge,
    SlButton,
    SlDrawer,
    SlDrawerBody,
    SlDrawerClose,
    SlDrawerDescription,
    SlDrawerHeader,
    SlDrawerResizer,
    SlDrawerTitle,
    SlDrawerTrigger,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="drawer">
      Shipments in transit
    </button>
    <sl-drawer #drawer="slDrawer" side="bottom" [snapPoints]="[0.4, 0.9]" [(extent)]="extent">
      <div slDrawerResizer></div>
      <header slDrawerHeader>
        <h2 slDrawerTitle>Shipments in transit</h2>
        <p slDrawerDescription>10 shipments left the Reno warehouse this week.</p>
        <button slDrawerClose></button>
      </header>
      <div slDrawerBody>
        <div slStack [gap]="3">
          @for (shipment of shipments; track shipment.id) {
            <div slInline align="center" [gap]="3" justify="between">
              <div slStack [gap]="0">
                <span slText size="sm" weight="semibold">{{ shipment.id }}</span>
                <span slText size="sm" tone="muted">{{ shipment.to }}</span>
              </div>
              <span slBadge [tone]="shipment.tone">{{ shipment.status }}</span>
            </div>
          }
        </div>
      </div>
    </sl-drawer>
  `,
})
export class DrawerSnapPoints {
  readonly shipments = SHIPMENTS;
  readonly extent = signal<number | undefined>(0.4);
}
