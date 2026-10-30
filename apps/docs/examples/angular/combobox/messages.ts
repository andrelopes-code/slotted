import { Component } from '@angular/core';
import { SlCombobox, SlComboboxItem } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS', 'OnTrac'];

@Component({
  selector: 'app-combobox-messages',
  imports: [SlCombobox, SlComboboxItem, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Carrier</label>
      <sl-combobox placeholder="Type “royal mail”" [messages]="messages">
        @for (carrier of carriers; track carrier) {
          <sl-combobox-item [value]="carrier" [label]="carrier" />
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxCustomMessages {
  protected readonly carriers = CARRIERS;
  protected readonly messages = {
    clear: 'Clear carrier',
    count: '{count, plural, one {# carrier} other {# carriers}}',
    empty: 'No carrier by that name. Check the spelling on the label.',
  };
}
