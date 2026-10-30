import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'DFW', label: 'Dallas, TX' },
];

const SIZES = [
  { size: 'sm', label: 'Filter by warehouse' },
  { size: 'md', label: 'Stocking warehouses' },
  { size: 'lg', label: 'Return warehouses' },
] as const;

@Component({
  selector: 'app-multi-select-sizes',
  imports: [SlField, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (entry of sizes; track entry.size) {
        <div slField [size]="entry.size">
          <label slFieldLabel>{{ entry.label }}</label>
          <sl-multi-select [items]="warehouses" [value]="stocked">
            @for (warehouse of warehouses; track warehouse.value) {
              <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
            }
          </sl-multi-select>
        </div>
      }
    </div>
  `,
})
export class MultiSelectSizes {
  protected readonly sizes = SIZES;
  protected readonly warehouses = WAREHOUSES;
  protected readonly stocked = ['RNO', 'CMH'];
}
