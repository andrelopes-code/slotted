import { Component, signal } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-date-range-picker-keyboard',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Shipping blackout</label>
      <div
        slDateRangePicker
        [defaultValue]="blackout"
        [messages]="messages"
        (openChange)="record($event)"
      ></div>
      <span slFieldDescription>{{ last() }}</span>
    </div>
  `,
})
export class DateRangePickerKeyboard {
  protected readonly blackout = { start: plainDate(2026, 11, 26), end: plainDate(2026, 11, 29) };
  protected readonly messages = {
    choose: 'Choose blackout dates',
    change: 'Change blackout dates, {start} to {end}, {length}',
  };
  protected readonly last = signal('Focus either date and press Alt+ArrowDown.');

  protected record(request: ChangeRequest<boolean>): void {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}.`);
  }
}
