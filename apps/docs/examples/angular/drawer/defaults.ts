import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  provideDrawerDefaults,
  SlDrawer,
  SlDrawerBody,
  SlDrawerClose,
  SlDrawerHeader,
  SlDrawerTitle,
  SlDrawerTrigger,
} from '@slotted/angular/drawer';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-drawer-defaults',
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
  providers: [provideDrawerDefaults({ side: 'start', size: 'sm' })],
  template: `
    <div slInline [gap]="2">
      <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="warehouses">
        Warehouses
      </button>
      <sl-drawer #warehouses="slDrawer">
        <header slDrawerHeader>
          <h2 slDrawerTitle>Warehouses</h2>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <span slText size="sm">From the start edge and small, both from the provider.</span>
        </div>
      </sl-drawer>
      <button slButton tone="secondary" variant="outline" [slDrawerTrigger]="carriers">
        Carriers
      </button>
      <sl-drawer #carriers="slDrawer" size="lg">
        <header slDrawerHeader>
          <h2 slDrawerTitle>Carriers</h2>
          <button slDrawerClose></button>
        </header>
        <div slDrawerBody>
          <span slText size="sm">
            From the start edge, from the provider, and large because this drawer says so.
          </span>
        </div>
      </sl-drawer>
    </div>
  `,
})
export class DrawerDefaults {}
