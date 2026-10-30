import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';

const WAREHOUSES = [
  { value: 'RNO', label: 'Reno, NV' },
  { value: 'CMH', label: 'Columbus, OH' },
  { value: 'SAV', label: 'Savannah, GA' },
];

@Component({
  selector: 'app-select-basic',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Fulfilment warehouse</label>
      <sl-select placeholder="Choose a warehouse">
        @for (warehouse of warehouses; track warehouse.value) {
          <sl-select-item [value]="warehouse.value">{{ warehouse.label }}</sl-select-item>
        }
      </sl-select>
      <span slFieldDescription>New orders ship from this warehouse.</span>
    </div>
  `,
})
export class SelectBasic {
  protected readonly warehouses = WAREHOUSES;
}
