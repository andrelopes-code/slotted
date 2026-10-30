import { Component } from '@angular/core';
import { provideComboboxDefaults, SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const WAREHOUSES = ['Reno, NV', 'Columbus, OH', 'Savannah, GA'];
const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS'];

@Component({
  selector: 'app-combobox-defaults',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel, SlStack],
  providers: [provideComboboxDefaults({ variant: 'subtle', autoHighlight: true })],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Warehouse</label>
        <sl-combobox placeholder="Any warehouse">
          @for (warehouse of warehouses; track warehouse) {
            <sl-combobox-item [value]="warehouse" [label]="warehouse" />
          }
        </sl-combobox>
      </div>
      <div slField>
        <label slFieldLabel>Carrier</label>
        <sl-combobox placeholder="Any carrier">
          @for (carrier of carriers; track carrier) {
            <sl-combobox-item [value]="carrier" [label]="carrier" />
          }
        </sl-combobox>
      </div>
    </div>
  `,
})
export class ComboboxAppDefaults {
  protected readonly warehouses = WAREHOUSES;
  protected readonly carriers = CARRIERS;
}
