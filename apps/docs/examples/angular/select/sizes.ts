import { Component } from '@angular/core';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import {
  SlSelect,
  SlSelectItem,
  type SelectOption,
  type SelectSize,
} from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const SIZES: { size: SelectSize; label: string }[] = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
];

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

@Component({
  selector: 'app-select-sizes',
  imports: [SlField, SlFieldLabel, SlSelect, SlSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      @for (step of sizes; track step.size) {
        <div slField>
          <label slFieldLabel>{{ step.label }}</label>
          <sl-select value="RNO" [size]="step.size" [items]="warehouses">
            @for (warehouse of warehouses; track warehouse.value) {
              <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
            }
          </sl-select>
        </div>
      }
    </div>
  `,
})
export class SelectSizes {
  protected readonly sizes = SIZES;
  protected readonly warehouses = WAREHOUSES;
}
