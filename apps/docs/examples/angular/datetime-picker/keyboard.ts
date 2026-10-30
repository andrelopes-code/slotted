import { Component, signal } from '@angular/core';
import { SlDateTimePicker } from '@slotted/angular/datetime-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { ChangeRequest } from '@slotted/core/state';

@Component({
  selector: 'app-datetime-picker-keyboard',
  imports: [SlDateTimePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Dispatch</label>
      <div
        slDateTimePicker
        [defaultValue]="dispatch"
        [messages]="messages"
        (openChange)="record($event)"
      ></div>
      <span slFieldDescription>{{ last() }}</span>
    </div>
  `,
})
export class DateTimePickerKeyboard {
  protected readonly dispatch = plainDateTime(plainDate(2026, 9, 30), plainTime(16, 30));
  protected readonly messages = {
    choose: 'Choose dispatch time',
    change: 'Change dispatch time, {date}',
  };
  protected readonly last = signal('Focus the field and press Alt+ArrowDown.');

  protected record(request: ChangeRequest<boolean>): void {
    this.last.set(`${request.value ? 'Opened' : 'Closed'} by ${request.reason}.`);
  }
}
