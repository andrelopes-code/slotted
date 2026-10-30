import { Component } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectOption } from '@slotted/angular/select';

const OWNERS: SelectOption[] = [
  { value: 'avery', label: 'Avery Collins' },
  { value: 'kenji', label: 'Kenji Watanabe' },
  { value: 'lucia', label: 'Lucía Fernández' },
  { value: 'ruth', label: 'Ruth Adeyemi' },
];

@Component({
  selector: 'app-select-clearable',
  imports: [SlField, SlFieldDescription, SlFieldLabel, SlSelect, SlSelectItem],
  template: `
    <div slField>
      <label slFieldLabel>Assignee</label>
      <sl-select clearable placeholder="Unassigned" value="kenji" [items]="owners">
        @for (owner of owners; track owner.value) {
          <sl-select-item [value]="owner.value">{{ owner.label }}</sl-select-item>
        }
      </sl-select>
      <span slFieldDescription>Clear the assignee to return the ticket to the queue.</span>
    </div>
  `,
})
export class SelectClearable {
  protected readonly owners = OWNERS;
}
