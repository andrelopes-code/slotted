import { Directive } from '@angular/core';

/** What the footer of the panel says when nothing is wrong. Unset, the limits. */
@Directive({
  selector: '[slDateRangePickerFooter]',
  standalone: true,
  exportAs: 'slDateRangePickerFooter',
})
export class SlDateRangePickerFooter {}
