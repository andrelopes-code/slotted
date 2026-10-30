import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlCombobox, SlComboboxItem, SlComboboxItemIcon } from '@slotted/angular/combobox';
import { SlField, SlFieldLabel } from '@slotted/angular/field';

const PEOPLE = [
  { id: 'avery', name: 'Avery Collins', role: 'Fulfilment lead', away: false },
  { id: 'kenji', name: 'Kenji Watanabe', role: 'Customer care', away: false },
  { id: 'lucia', name: 'Lucía Fernández', role: 'Account manager', away: false },
  { id: 'ruth', name: 'Ruth Adeyemi', role: 'On leave until 14 October', away: true },
  { id: 'tomasz', name: 'Tomasz Nowak', role: 'Warehouse supervisor, Reno', away: false },
  { id: 'omar', name: 'Omar Haddad', role: 'Finance', away: false },
];

@Component({
  selector: 'app-combobox-assignee-picker',
  imports: [SlAvatar, SlCombobox, SlComboboxItem, SlComboboxItemIcon, SlField, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Assignee</label>
      <sl-combobox autoHighlight placeholder="Assign to…">
        @for (person of people; track person.id) {
          <sl-combobox-item
            [value]="person.id"
            [label]="person.name"
            [description]="person.role"
            [disabled]="person.away"
          >
            <span slComboboxItemIcon
              ><span slAvatar [name]="person.name" size="xs" decorative></span
            ></span>
          </sl-combobox-item>
        }
      </sl-combobox>
    </div>
  `,
})
export class ComboboxAssigneePicker {
  protected readonly people = PEOPLE;
}
