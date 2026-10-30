import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'ABE', label: 'Allentown, PA' },
];

@Component({
  selector: 'app-multi-select-initial-value',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Stocking warehouses</label>
      <sl-multi-select placeholder="Add a warehouse" [items]="warehouses" [value]="stocked">
        @for (warehouse of warehouses; track warehouse.value) {
          <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
        }
      </sl-multi-select>
      <span slFieldDescription>Earl Grey, 100 bags is stocked at two warehouses.</span>
    </div>
  `,
})
export class MultiSelectInitialValue {
  protected readonly warehouses = WAREHOUSES;
  protected readonly stocked = ['RNO', 'CMH'];
}
