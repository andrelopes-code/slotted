import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import {
  provideToggleGroupDefaults,
  SlToggleGroup,
  SlToggleGroupItem,
} from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-defaults',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  providers: [provideToggleGroupDefaults({ size: 'sm', variant: 'ghost', deselectable: false })],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Inherits the provider</p>
        <div slToggleGroup aria-label="Table density" [defaultValue]="['compact']">
          <button slToggleGroupItem value="comfortable">Comfortable</button>
          <button slToggleGroupItem value="compact">Compact</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">States its own variant</p>
        <div slToggleGroup aria-label="Row height" variant="outline" [defaultValue]="['compact']">
          <button slToggleGroupItem value="comfortable">Comfortable</button>
          <button slToggleGroupItem value="compact">Compact</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupDefaults {}
