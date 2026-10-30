import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

@Component({
  selector: 'app-combobox-clearable',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel, SlStack],
  template: `
    <div slStack [gap]="5">
      <div slField>
        <label slFieldLabel>Default warehouse</label>
        <sl-combobox inputValue="Columbus, OH" defaultValue="CMH">
          <sl-combobox-item value="RNO" label="Reno, NV" />
          <sl-combobox-item value="CMH" label="Columbus, OH" />
          <sl-combobox-item value="SAV" label="Savannah, GA" />
        </sl-combobox>
        <span slFieldDescription>Optional. Clearing it routes orders by distance.</span>
      </div>
      <div slField>
        <label slFieldLabel>Payment terms</label>
        <sl-combobox [clearable]="false" inputValue="Net 30" defaultValue="net-30">
          <sl-combobox-item value="prepaid" label="Prepaid" />
          <sl-combobox-item value="net-30" label="Net 30" />
          <sl-combobox-item value="net-45" label="Net 45" />
        </sl-combobox>
        <span slFieldDescription>Every account has terms, so there is nothing to clear.</span>
      </div>
    </div>
  `,
})
export class ComboboxClearable {}
