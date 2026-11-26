import { Component } from '@angular/core';
import { SlStack } from '@slotted/angular/stack';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-toggle-group-keyboard',
  imports: [SlStack, SlText, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slStack [gap]="5">
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Arrows wrap at the ends</p>
        <div slToggleGroup aria-label="Pick window" [defaultValue]="['morning']">
          <button slToggleGroupItem value="morning">Morning</button>
          <button slToggleGroupItem value="afternoon">Afternoon</button>
          <button slToggleGroupItem value="night">Night</button>
        </div>
      </div>
      <div slStack [gap]="2">
        <p slText size="sm" tone="muted">Arrows stop at the ends</p>
        <div slToggleGroup aria-label="Dock shift" [loop]="false" [defaultValue]="['early']">
          <button slToggleGroupItem value="early">Early</button>
          <button slToggleGroupItem value="late">Late</button>
          <button slToggleGroupItem value="overnight">Overnight</button>
        </div>
      </div>
    </div>
  `,
})
export class ToggleGroupKeyboard {}
