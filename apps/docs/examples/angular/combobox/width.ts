import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const ZONES = [
  { id: 'pacific', label: '(UTC−08:00) Pacific Time — Los Angeles, Vancouver' },
  { id: 'mountain', label: '(UTC−07:00) Mountain Time — Denver, Calgary' },
  { id: 'central', label: '(UTC−06:00) Central Time — Chicago, Mexico City' },
  { id: 'eastern', label: '(UTC−05:00) Eastern Time — New York, Toronto' },
  { id: 'london', label: '(UTC+00:00) Greenwich Mean Time — London, Lisbon' },
];

@Component({
  selector: 'app-combobox-width',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Report time zone</label>
      <sl-combobox placeholder="Search zones" [fullWidth]="false" width="content">
        @for (zone of zones; track zone.id) {
          <sl-combobox-item [value]="zone.id" [label]="zone.label" />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxPopupWidth {
  protected readonly zones = ZONES;
}
