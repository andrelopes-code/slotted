import { Component, computed, signal } from '@angular/core';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlSelect, SlSelectItem, type SelectSelection } from '@slotted/angular/select';
import { SlStack } from '@slotted/angular/stack';
import {
  addDays,
  createDateFormat,
  isPlainDate,
  plainDate,
  type PlainDate,
} from '@slotted/core/date';

const TERMS = [
  { value: 'receipt', label: 'Due on receipt', days: 0 },
  { value: 'net-15', label: 'Net 15', days: 15 },
  { value: 'net-30', label: 'Net 30', days: 30 },
  { value: 'net-60', label: 'Net 60', days: 60 },
];
const words = createDateFormat({ locale: 'en-US' });

@Component({
  selector: 'app-date-picker-invoice-due',
  imports: [
    SlDatePicker,
    SlField,
    SlFieldDescription,
    SlFieldLabel,
    SlSelect,
    SlSelectItem,
    SlStack,
  ],
  template: `
    <div slStack [gap]="5">
      <div slField required>
        <label slFieldLabel>Invoice date</label>
        <div slDatePicker [value]="issued()" (valueChange)="setIssued($event.value)"></div>
      </div>
      <div slField>
        <label slFieldLabel>Payment terms</label>
        <sl-select [items]="terms" [(value)]="term">
          @for (option of terms; track option.value) {
            <sl-select-item [value]="option.value">{{ option.label }}</sl-select-item>
          }
        </sl-select>
      </div>
      <div slField readOnly>
        <label slFieldLabel>Due date</label>
        <div slDatePicker [value]="due()"></div>
        <span slFieldDescription>{{ summary() }}</span>
      </div>
    </div>
  `,
})
export class DatePickerInvoiceDue {
  protected readonly terms = TERMS;
  protected readonly issued = signal<PlainDate | null>(plainDate(2026, 9, 30));
  protected readonly term = signal<SelectSelection>('net-30');
  protected readonly due = computed(() => {
    const issued = this.issued();
    const days = TERMS.find((option) => option.value === this.term())?.days ?? 0;
    return issued === null ? null : addDays(issued, days);
  });
  protected readonly summary = computed(() => {
    const due = this.due();
    return due === null ? 'Set the invoice date first.' : `Payment is due ${words.describe(due)}.`;
  });

  protected setIssued(value: CalendarValue): void {
    this.issued.set(isPlainDate(value) ? value : null);
  }
}
