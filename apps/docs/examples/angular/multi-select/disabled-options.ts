import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';

const WAREHOUSES: (MultiSelectOption & { description: string })[] = [
  { value: 'RNO', label: 'Reno, NV', description: '142 pallet spaces free' },
  { value: 'CMH', label: 'Columbus, OH', description: '38 pallet spaces free' },
  {
    value: 'SAV',
    label: 'Savannah, GA',
    description: 'At capacity until November 3',
    disabled: true,
  },
  { value: 'DFW', label: 'Dallas, TX', description: '210 pallet spaces free' },
  {
    value: 'ONT',
    label: 'Ontario, CA',
    description: 'Closed for a stock count this week',
    disabled: true,
  },
];

@Component({
  selector: 'app-multi-select-disabled-options',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Receiving warehouses</label>
      <sl-multi-select placeholder="Add a warehouse" [items]="warehouses" [value]="receiving">
        @for (warehouse of warehouses; track warehouse.value) {
          <sl-multi-select-item
            [value]="warehouse.value"
            [label]="warehouse.label"
            [description]="warehouse.description"
            [disabled]="warehouse.disabled ?? false"
          />
        }
      </sl-multi-select>
    </div>
  `,
})
export class MultiSelectDisabledOptions {
  protected readonly warehouses = WAREHOUSES;
  protected readonly receiving = ['RNO'];
}
