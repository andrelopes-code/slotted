import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-combobox-states',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField disabled>
        <label slFieldLabel>Warehouse</label>
        <sl-combobox inputValue="Reno, NV" defaultValue="RNO">
          <sl-combobox-item value="RNO" label="Reno, NV" />
          <sl-combobox-item value="CMH" label="Columbus, OH" />
        </sl-combobox>
        <span slFieldDescription>Locked while the transfer is in transit.</span>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Billing entity</label>
        <sl-combobox inputValue="Northwind Trading Co." defaultValue="northwind-us">
          <sl-combobox-item value="northwind-us" label="Northwind Trading Co." />
          <sl-combobox-item value="northwind-eu" label="Northwind Europe B.V." />
        </sl-combobox>
        <span slFieldDescription
          >Set by the contract. The text can still be selected and copied.</span
        >
      </div>
    </div>
  `,
})
export class ComboboxStates {}
