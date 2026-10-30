import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

@Component({
  selector: 'app-combobox-inline-completion',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Time zone</label>
      <sl-combobox autocomplete="both" placeholder="Type “eu” or “am”">
        @for (zone of zones; track zone) {
          <sl-combobox-item [value]="zone" [label]="zone" />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxInlineCompletion {
  protected readonly zones = TIME_ZONES;
}
