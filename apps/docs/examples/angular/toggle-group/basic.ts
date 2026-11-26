import { Component } from '@angular/core';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';

@Component({
  selector: 'app-toggle-group-basic',
  imports: [SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slToggleGroup aria-label="Revenue period" [defaultValue]="['week']">
      <button slToggleGroupItem value="day">Day</button>
      <button slToggleGroupItem value="week">Week</button>
      <button slToggleGroupItem value="month">Month</button>
      <button slToggleGroupItem value="quarter">Quarter</button>
    </div>
  `,
})
export class ToggleGroupBasic {}
