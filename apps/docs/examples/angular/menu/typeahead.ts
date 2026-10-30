import { Component } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlMenu, SlMenuItem, SlMenuItemMeta, SlMenuTrigger } from '@slotted/angular/menu';

const CARRIERS = [
  { name: 'DHL Express', transit: '1 day' },
  { name: 'DPD', transit: '2 days' },
  { name: 'FedEx', transit: '1 day' },
  { name: 'GLS', transit: '3 days' },
  { name: 'PostNL', transit: '2 days' },
  { name: 'Royal Mail', transit: '3 days' },
  { name: 'UPS', transit: '2 days' },
  { name: 'USPS', transit: '5 days' },
];

@Component({
  selector: 'app-menu-typeahead',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlMenu, SlMenuItem, SlMenuItemMeta, SlMenuTrigger],
  template: `
    <button slButton variant="outline" [slMenuTriggerFor]="carrierMenu">
      Ship with
      <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
    </button>
    <sl-menu #carrierMenu>
      @for (carrier of carriers; track carrier.name) {
        <button slMenuItem>
          {{ carrier.name }} <span slMenuItemMeta>{{ carrier.transit }}</span>
        </button>
      }
    </sl-menu>
  `,
})
export class MenuTypeahead {
  protected readonly carriers = CARRIERS;
}
