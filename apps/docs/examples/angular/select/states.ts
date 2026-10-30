import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';

const WAREHOUSES: SelectOption[] = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

@Component({
  selector: 'app-select-states',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlSelect,
    SlSelectItem,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField invalid required>
        <label slFieldLabel>Return warehouse</label>
        <sl-select value="SAV" [items]="warehouses">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
          }
        </sl-select>
        <span slFieldError>Savannah does not accept returns. Choose Reno or Columbus.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Origin warehouse</label>
        <sl-select value="RNO" [items]="warehouses">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
          }
        </sl-select>
        <span slFieldDescription>Set when the order was picked.</span>
      </div>
      <div slField disabled>
        <label slFieldLabel>Transfer warehouse</label>
        <sl-select value="CMH" [items]="warehouses">
          @for (warehouse of warehouses; track warehouse.value) {
            <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
          }
        </sl-select>
        <span slFieldDescription>Transfers open once the order is invoiced.</span>
      </div>
    </div>
  `,
})
export class SelectStates {
  protected readonly warehouses = WAREHOUSES;
}
