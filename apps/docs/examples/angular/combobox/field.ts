import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import { SlStack } from '@slotted/angular/stack';

const OWNERS = ['Avery Collins', 'Kenji Watanabe', 'Lucía Fernández', 'Omar Haddad'];
const COST_CENTERS = ['4100 Fulfilment', '4200 Customer care', '4300 Marketing'];

@Component({
  selector: 'app-combobox-field',
  imports: [
    SlCombobox,
    SlComboboxItem,
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <label slFieldLabel>Account manager</label>
        <sl-combobox placeholder="Search people">
          @for (owner of owners; track owner) {
            <sl-combobox-item [value]="owner" [label]="owner" />
          }
        </sl-combobox>
        <span slFieldDescription>Receives the renewal reminders for this account.</span>
      </div>
      <div slField invalid required>
        <label slFieldLabel>Cost center</label>
        <sl-combobox inputValue="4900">
          @for (center of costCenters; track center) {
            <sl-combobox-item [value]="center" [label]="center" />
          }
        </sl-combobox>
        <span slFieldError>4900 is closed. Choose an open cost center.</span>
      </div>
    </div>
  `,
})
export class ComboboxField {
  protected readonly owners = OWNERS;
  protected readonly costCenters = COST_CENTERS;
}
