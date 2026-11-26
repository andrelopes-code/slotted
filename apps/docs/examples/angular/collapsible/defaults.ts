import { Component } from '@angular/core';
import {
  provideCollapsibleDefaults,
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-defaults',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  providers: [
    provideCollapsibleDefaults({
      indicator: 'plus-minus',
      size: 'sm',
      togglePlacement: 'start',
      variant: 'ruled',
    }),
  ],
  template: `
    <div slStack [gap]="2">
      <div slCollapsible [open]="true">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Receiving dock</button>
        </div>
        <div slCollapsiblePanel>Six pallets are waiting for putaway.</div>
      </div>

      <div slCollapsible>
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Cold storage</button>
        </div>
        <div slCollapsiblePanel>Temperature held at 36 degrees F.</div>
      </div>

      <div slCollapsible indicator="chevron" togglePlacement="end" variant="framed">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Returns</button>
        </div>
        <div slCollapsiblePanel>Fourteen units are waiting for inspection.</div>
      </div>
    </div>
  `,
})
export class CollapsibleDefaults {}
