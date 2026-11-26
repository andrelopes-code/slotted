import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlToggleGroup, SlToggleGroupItem } from '@slotted/angular/toggle-group';

@Component({
  selector: 'app-toggle-group-field',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlToggleGroup, SlToggleGroupItem],
  template: `
    <div slField>
      <label slFieldLabel>Delivery window</label>
      <div slToggleGroup [defaultValue]="['afternoon']">
        <button slToggleGroupItem value="morning">Morning</button>
        <button slToggleGroupItem value="afternoon">Afternoon</button>
        <button slToggleGroupItem value="evening">Evening</button>
      </div>
      <span slFieldDescription>The carrier confirms the slot the day before.</span>
    </div>
  `,
})
export class ToggleGroupField {}
