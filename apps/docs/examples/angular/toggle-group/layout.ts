import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-layout',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">fullWidth</p>
        <div slToggleGroup aria-label="Billing cycle" fullWidth [defaultValue]="['monthly']">
          <button slToggleGroupItem value="monthly">Monthly</button>
          <button slToggleGroupItem value="yearly">Yearly</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">attached off</p>
        <div
          slToggleGroup
          aria-label="Order status filter"
          multiple
          [attached]="false"
          [defaultValue]="['open']"
        >
          <button slToggleGroupItem value="open">Open</button>
          <button slToggleGroupItem value="packed">Packed</button>
          <button slToggleGroupItem value="shipped">Shipped</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">vertical</p>
        <div
          slToggleGroup
          aria-label="Warehouse zone"
          orientation="vertical"
          [defaultValue]="['storage']"
        >
          <button slToggleGroupItem value="receiving">Receiving</button>
          <button slToggleGroupItem value="storage">Storage</button>
          <button slToggleGroupItem value="dispatch">Dispatch</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupLayout {}
