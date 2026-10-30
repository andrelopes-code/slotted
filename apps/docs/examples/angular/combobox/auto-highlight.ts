import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const UNITS = ['Each', 'Case of 6', 'Case of 12', 'Pallet', 'Kilogram', 'Pound', 'Meter', 'Liter'];

@Component({
  selector: 'app-combobox-auto-highlight',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Unit of measure</label>
      <sl-combobox autoHighlight loop placeholder="Type “ca” and press Enter">
        @for (unit of units; track unit) {
          <sl-combobox-item [value]="unit" [label]="unit" />
        }
      </sl-combobox>
      <span slFieldDescription>The first match is highlighted, so Enter takes it.</span>
    </div>
  `,
})
export class ComboboxAutoHighlight {
  protected readonly units = UNITS;
}
