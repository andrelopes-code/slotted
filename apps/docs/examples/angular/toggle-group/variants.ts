import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-variants',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">outline</p>
        <div
          slToggleGroup
          aria-label="Table density"
          variant="outline"
          [defaultValue]="['compact']"
        >
          <button slToggleGroupItem value="comfortable">Comfortable</button>
          <button slToggleGroupItem value="compact">Compact</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">ghost</p>
        <div slToggleGroup aria-label="Row height" variant="ghost" [defaultValue]="['compact']">
          <button slToggleGroupItem value="comfortable">Comfortable</button>
          <button slToggleGroupItem value="compact">Compact</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">chips</p>
        <div
          slToggleGroup
          aria-label="Product categories"
          multiple
          variant="chips"
          [defaultValue]="['packaging', 'pallets']"
        >
          <button slToggleGroupItem value="hardware">Hardware</button>
          <button slToggleGroupItem value="packaging">Packaging</button>
          <button slToggleGroupItem value="pallets">Pallets</button>
          <button slToggleGroupItem value="labels">Labels</button>
          <button slToggleGroupItem value="safety">Safety gear</button>
          <button slToggleGroupItem value="cleaning">Cleaning</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupVariants {}
