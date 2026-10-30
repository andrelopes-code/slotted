import { Component } from '@angular/core';
import { SlDateRangePicker } from '@slotted/angular/date-range-picker';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { plainDate } from '@slotted/core/date';

@Component({
  selector: 'app-date-range-picker-bounds',
  imports: [SlDateRangePicker, SlField, SlFieldDescription, SlFieldLabel],
  template: `
    <div slField>
      <label slFieldLabel>Shipment window</label>
      <div slDateRangePicker [min]="earliest" [max]="latest"></div>
      <span slFieldDescription>Carriers accept bookings from October 1 to December 31, 2026.</span>
    </div>
  `,
})
export class DateRangePickerBounds {
  protected readonly earliest = plainDate(2026, 10, 1);
  protected readonly latest = plainDate(2026, 12, 31);
}
