import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlMultiSelect, SlMultiSelectItem } from '@slotted/angular/multi-select';

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'ABE', label: 'Allentown, PA' },
];

@Component({
  selector: 'app-multi-select-basic',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Stocking warehouses</label>
      <sl-multi-select placeholder="Add a warehouse">
        @for (warehouse of warehouses; track warehouse.value) {
          <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>Chai tea, 24 bags is reordered at each of these warehouses.</span>
    </div>
  `,
})
export class MultiSelectBasic {
  protected readonly warehouses = WAREHOUSES;
}
