import { Component, computed, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import type { CalendarValue } from '@slotted/angular/calendar';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import {
  addDays,
  createDateFormat,
  isPlainDate,
  plainDate,
  type PlainDate,
} from '@slotted/core/date';

const TODAY = plainDate(2026, 9, 30);
const words = createDateFormat({ locale: 'en-US' });

@Component({
  selector: 'app-date-picker-controlled',
  imports: [SlButton, SlDatePicker, SlField, SlFieldDescription, SlFieldLabel, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Follow up with Harbor Freightways</label>
        <div slDatePicker [value]="followUp()" (valueChange)="set($event.value)"></div>
        <span slFieldDescription>{{ summary() }}</span>
      </div>
      <div slInline [gap]="2">
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="inDays(7)"
        >
          In 1 week
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="inDays(14)"
        >
          In 2 weeks
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="ghost"
          type="button"
          (click)="followUp.set(null)"
        >
          No follow-up
        </button>
      </div>
    </div>
  `,
})
export class DatePickerControlled {
  protected readonly followUp = signal<PlainDate | null>(addDays(TODAY, 7));
  protected readonly summary = computed(() => {
    const date = this.followUp();
    return date === null ? 'No follow-up scheduled.' : `Reminder on ${words.describe(date)}.`;
  });

  protected set(value: CalendarValue): void {
    this.followUp.set(isPlainDate(value) ? value : null);
  }

  protected inDays(days: number): void {
    this.followUp.set(addDays(TODAY, days));
  }
}
