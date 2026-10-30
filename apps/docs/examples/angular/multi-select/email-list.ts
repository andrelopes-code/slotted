import { Component, signal } from '@angular/core';
import { SlField, SlFieldDescription, SlFieldError, SlFieldLabel } from '@slotted/angular/field';
import {
  SlMultiSelect,
  SlMultiSelectItem,
  type MultiSelectRefuseCause,
} from '@slotted/angular/multi-select';

const TEAMS = [
  { value: 'purchasing@northwind.example', description: 'Purchasing team' },
  { value: 'warehouse-ops@northwind.example', description: 'Warehouse operations' },
  { value: 'category-managers@northwind.example', description: 'Category managers' },
];

const isEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());

const REASONS: Record<MultiSelectRefuseCause, string> = {
  invalid: 'is not an email address',
  duplicate: 'is already on the list',
  limit: 'is over the limit',
};

@Component({
  selector: 'app-multi-select-email-list',
  imports: [
    SlField,
    SlFieldDescription,
    SlFieldError,
    SlFieldLabel,
    SlMultiSelect,
    SlMultiSelectItem,
  ],
  template: `
    <div slField [invalid]="refused() !== null ? true : undefined">
      <label slFieldLabel>Stockout alerts</label>
      <sl-multi-select
        creatable
        placeholder="name@company.com"
        [delimiters]="delimiters"
        [value]="recipients"
        [validateValue]="isEmail"
        (valueRefuse)="refuse($event)"
        (valueChange)="refused.set(null)"
      >
        @for (team of teams; track team.value) {
          <sl-multi-select-item
            [value]="team.value"
            [label]="team.value"
            [description]="team.description"
          />
        }
      </sl-multi-select>
      @if (refused(); as message) {
        <span slFieldError live="polite">{{ message }}</span>
      } @else {
        <span slFieldDescription>Paste a list separated by commas, semicolons or spaces.</span>
      }
    </div>
  `,
})
export class MultiSelectEmailList {
  protected readonly teams = TEAMS;
  protected readonly delimiters = [',', ';', ' '];
  protected readonly recipients = ['purchasing@northwind.example'];
  protected readonly isEmail = isEmail;
  protected readonly refused = signal<string | null>(null);

  protected refuse(event: { values: readonly string[]; cause: MultiSelectRefuseCause }): void {
    this.refused.set(`${event.values.join(', ')} ${REASONS[event.cause]}.`);
  }
}
