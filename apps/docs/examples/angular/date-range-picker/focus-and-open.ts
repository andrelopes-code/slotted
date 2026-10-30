import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-focus-and-open',
  imports: [SlButton, SlDateRangePicker, SlField, SlFieldLabel, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Contract term</label>
        <div slDateRangePicker #picker="slDateRangePicker" [defaultValue]="term"></div>
      </div>
      <div slInline [gap]="2">
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="picker.focus('end')"
        >
          Edit end date
        </button>
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="picker.openSurface()"
        >
          Open calendar
        </button>
      </div>
    </div>
  `,
})
export class DateRangePickerFocusAndOpen {
  protected readonly term = { start: plainDate(2026, 4, 1), end: plainDate(2027, 3, 31) };
}
