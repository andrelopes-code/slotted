import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-picker-focus-and-open',
  imports: [SlButton, SlDatePicker, SlField, SlFieldLabel, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slField>
        <label slFieldLabel>Contract renewal date</label>
        <div slDatePicker #picker="slDatePicker" [defaultValue]="renewal"></div>
      </div>
      <div slInline [gap]="2">
        <button
          slButton
          size="sm"
          tone="secondary"
          variant="outline"
          type="button"
          (click)="picker.focus()"
        >
          Edit date
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
export class DatePickerFocusAndOpen {
  protected readonly renewal = plainDate(2027, 3, 31);
}
