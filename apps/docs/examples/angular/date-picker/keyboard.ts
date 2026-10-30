import { Component, signal } from '@angular/core';
import { SlDatePicker } from '@slotted/angular/date-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-date-picker-keyboard',
  imports: [SlDatePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Dispatch date</label>
      <div
        slDatePicker
        [defaultValue]="dispatch"
        [messages]="messages"
        (openChange)="record($event)"
      ></div>
      <span slFieldDescription>{{ last() }}</span>
    </div>
  `,
})
export class DatePickerKeyboard {
  protected readonly dispatch = plainDate(2026, 9, 30);
  protected readonly messages = {
    choose: 'Choose dispatch date',
    change: 'Change dispatch date, {date}',
  };
  protected readonly last = signal('Focus the field and press Alt+ArrowDown.');

  protected record(request: ChangeRequest<boolean>): void {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}.`);
  }
}
