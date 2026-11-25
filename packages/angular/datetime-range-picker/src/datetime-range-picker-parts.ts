import { Directive } from '@angular/core';

/** What the footer says when nothing is wrong. Unset, the limits, the zone or the step. */
@Directive({
  selector: '[slDateTimeRangePickerFooter]',
  standalone: true,
  exportAs: 'slDateTimeRangePickerFooter',
})
export class SlDateTimeRangePickerFooter {}
