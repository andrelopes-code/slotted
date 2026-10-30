import { Component } from '@angular/core';
import { SlCheckbox, SlCheckboxDescription } from '@slotted/angular/checkbox';
import { SlGrid } from '@slotted/angular/grid';

@Component({
  selector: 'app-checkbox-tile',
  imports: [SlCheckbox, SlCheckboxDescription, SlGrid],
  template: `
    <div slGrid [gap]="4" minItemWidth="sm">
      <div slCheckbox variant="tile" defaultChecked>
        Daily backup
        <p slCheckboxDescription>One copy a day, kept for 30 days.</p>
      </div>
      <div slCheckbox variant="tile">
        Audit log
        <p slCheckboxDescription>Who changed what, and when, exported as CSV.</p>
      </div>
      <div slCheckbox variant="tile" disabled>
        Secondary region
        <p slCheckboxDescription>Available on the Scale plan.</p>
      </div>
    </div>
  `,
})
export class CheckboxTile {}
