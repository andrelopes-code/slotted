import { Component, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import {
  SlSelect,
  SlSelectItem,
  type SelectOption,
  type SelectSelection,
} from '@slotted/angular/select';

const TEAMS: SelectOption[] = [
  { value: 'fulfilment', label: 'Fulfilment' },
  { value: 'finance', label: 'Finance' },
  { value: 'customer-care', label: 'Customer care' },
  { value: 'purchasing', label: 'Purchasing' },
  { value: 'returns', label: 'Returns desk' },
];

@Component({
  selector: 'app-select-multiple',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Notify teams</label>
      <sl-select
        multiple
        clearable
        placeholder="No one is notified"
        [items]="teams"
        [(value)]="notified"
      >
        @for (team of teams; track team.value) {
          <sl-select-item [value]="team.value">{{ team.label }}</sl-select-item>
        }
      </sl-select>
      <span slFieldDescription>Each team gets an email when the order is delayed.</span>
    </div>
  `,
})
export class SelectMultiple {
  protected readonly teams = TEAMS;
  protected readonly notified = signal<SelectSelection>(['fulfilment', 'finance']);
}
