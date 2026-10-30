import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
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

@Component({
  selector: 'app-multi-select-states',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlMultiSelect,
    SlMultiSelectItem,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Stocking warehouses</label>
        <sl-multi-select placeholder="Add a warehouse" [items]="warehouses">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
        <span slFieldError>Choose at least one warehouse before publishing.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Warehouses holding stock</label>
        <sl-multi-select [items]="warehouses" [value]="holding">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>Updated by the nightly inventory sync.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Transfer warehouses</label>
        <sl-multi-select [items]="warehouses" [value]="transfer">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-multi-select-item [value]="warehouse.value" [label]="warehouse.label" />
          }
        </sl-multi-select>
        <span slFieldDescription>Transfers open once the purchase order is received.</span>
      </div>
    </div>
  `,
})
export class MultiSelectStates {
  protected readonly warehouses = WAREHOUSES;
  protected readonly holding = ['RNO', 'SAV'];
  protected readonly transfer = ['CMH'];
}
