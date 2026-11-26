import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlToolbar, SlToolbarSeparator } from '@slotted/angular/toolbar';

@Component({
  selector: 'app-toggle-group-toolbar',
  imports: [SlButton, SlToggleGroup, SlToggleGroupItem, SlToolbar, SlToolbarSeparator],
  template: `
    <div slToolbar aria-label="Sales report">
      <div slToggleGroup aria-label="Chart type" variant="ghost" [defaultValue]="['bars']">
        <button slToggleGroupItem value="bars">Bars</button>
        <button slToggleGroupItem value="lines">Lines</button>
      </div>
      <div slToolbarSeparator></div>
      <div
        slToggleGroup
        aria-label="Overlays"
        multiple
        variant="ghost"
        [defaultValue]="['forecast']"
      >
        <button slToggleGroupItem value="forecast">Forecast</button>
        <button slToggleGroupItem value="prior-year">Prior year</button>
      </div>
      <div slToolbarSeparator></div>
      <button slButton size="sm" tone="secondary" variant="ghost">Export</button>
    </div>
  `,
})
export class ToggleGroupToolbar {}
