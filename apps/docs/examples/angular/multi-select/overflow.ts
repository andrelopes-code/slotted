import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectOption,
} from '@slotted/angular/multi-select';
import { SlStack } from '@slotted/angular/stack';

const WAREHOUSES: MultiSelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'ONT', label: 'Ontario, CA' },
  { value: 'SEA', label: 'Kent, WA' },
  { value: 'DFW', label: 'Dallas, TX' },
  { value: 'JOT', label: 'Joliet, IL' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
  { value: 'ABE', label: 'Allentown, PA' },
  { value: 'EWR', label: 'Edison, NJ' },
];

const STOCKED = ['RNO', 'ONT', 'SEA', 'DFW', 'JOT', 'CMH', 'SAV'];

@Component({
  selector: 'app-multi-select-overflow',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlMultiSelect, SlMultiSelectItem, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Stocking warehouses</label>
        <sl-multi-select overflow="wrap" [items]="warehouses" [value]="stocked">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>Wrap: every chip stays in view, up to three rows.</span>
      </div>
      <div slField>
        <label slFieldLabel>Stocking warehouses</label>
        <sl-multi-select overflow="collapse" [items]="warehouses" [value]="stocked">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>Collapse: one row, and a count of the rest.</span>
      </div>
    </div>
  `,
})
export class MultiSelectOverflow {
  protected readonly warehouses = WAREHOUSES;
  protected readonly stocked = STOCKED;
}
