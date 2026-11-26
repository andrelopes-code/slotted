import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-selection',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">
          One at a time, and none when the active item is pressed again
        </p>
        <div slToggleGroup aria-label="Shipping speed" [defaultValue]="['standard']">
          <button slToggleGroupItem value="standard">Standard</button>
          <button slToggleGroupItem value="express">Express</button>
          <button slToggleGroupItem value="overnight">Overnight</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Several at once</p>
        <div slToggleGroup aria-label="Order channels" multiple [defaultValue]="['web', 'retail']">
          <button slToggleGroupItem value="web">Web</button>
          <button slToggleGroupItem value="retail">Retail</button>
          <button slToggleGroupItem value="wholesale">Wholesale</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">One at a time, always one</p>
        <div
          slToggleGroup
          aria-label="Reporting currency"
          [deselectable]="false"
          [defaultValue]="['usd']"
        >
          <button slToggleGroupItem value="usd">USD</button>
          <button slToggleGroupItem value="eur">EUR</button>
          <button slToggleGroupItem value="gbp">GBP</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupSelection {}
