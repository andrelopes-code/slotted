import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';

const CITIES = [
  'São Paulo',
  'Zürich',
  'Montréal',
  'Kraków',
  'Malmö',
  'Querétaro',
  'Reykjavík',
  'Düsseldorf',
];

@Component({
  selector: 'app-combobox-filtering',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Destination city</label>
      <sl-combobox placeholder="Try “sao” or “zurich”">
        @for (city of cities; track city) {
          <sl-combobox-item [value]="city" [label]="city" />
        }
      </sl-combobox>
      <span slFieldDescription>Accents and case are ignored when matching.</span>
    </div>
  `,
})
export class ComboboxFiltering {
  protected readonly cities = CITIES;
}
