import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const CARRIERS: MultiSelectOption[] = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
  { value: 'dhl', label: 'DHL Express' },
  { value: 'ontrac', label: 'OnTrac' },
];

@Component({
  selector: 'app-multi-select-keyboard',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Carrier priority</label>
      <sl-multi-select
        reorderable
        placeholder="Add a carrier"
        [items]="carriers"
        [value]="priority"
      >
        @for (carrier of carriers; track carrier.value) {
          <sl-multi-select-item [value]="carrier.value" [label]="carrier.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>
        Rates are requested from the first carrier, then the next. Alt with an arrow moves the
        focused carrier.
      </span>
    </div>
  `,
})
export class MultiSelectKeyboard {
  protected readonly carriers = CARRIERS;
  protected readonly priority = ['usps', 'ups', 'fedex'];
}
