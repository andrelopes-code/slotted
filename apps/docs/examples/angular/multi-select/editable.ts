import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlMultiSelect } from '@slotted/angular/multi-select';

@Component({
  selector: 'app-multi-select-editable',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect],
  template: `
    <div slField>
      <label slFieldLabel>Bin locations</label>
      <sl-multi-select
        creatable
        editable
        placeholder="Add a bin"
        [value]="bins"
        [messages]="{ empty: 'Type a bin code and press Enter.' }"
      />
      <span slFieldDescription>
        Press ArrowLeft to reach a bin, then Enter to correct it in place.
      </span>
    </div>
  `,
})
export class MultiSelectEditable {
  protected readonly bins = ['A-12-03', 'A-12-04', 'C-02-11'];
}
