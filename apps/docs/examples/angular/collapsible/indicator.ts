import { Component } from '@angular/core';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-collapsible-indicator',
  imports: [SlCollapsible, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slCollapsible [open]="true" indicator="chevron" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Carrier contracts</button>
        </div>
        <div slCollapsiblePanel>Three active contracts renew on January 1.</div>
      </div>

      <div slCollapsible indicator="chevron" togglePlacement="start" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Customs documents</button>
        </div>
        <div slCollapsiblePanel>Commercial invoice and packing list.</div>
      </div>

      <div slCollapsible [open]="true" indicator="plus-minus" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Supplier invoices</button>
        </div>
        <div slCollapsiblePanel>Seven invoices are due this week.</div>
      </div>

      <div slCollapsible indicator="plus-minus" togglePlacement="start" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Purchase orders</button>
        </div>
        <div slCollapsiblePanel>Twelve orders await approval.</div>
      </div>

      <div slCollapsible [open]="true" indicator="none" variant="ruled">
        <div slCollapsibleHeader>
          <button slCollapsibleTrigger>Dock schedule</button>
        </div>
        <div slCollapsiblePanel>Door 4 is reserved from 08:00 to 10:00.</div>
      </div>
    </div>
  `,
})
export class CollapsibleIndicator {}
