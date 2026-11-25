import { Directive } from '@angular/core';

/** What the footer of the panel says when nothing is wrong. Unset, the limits or the step. */
@Directive({
  selector: '[slTimeRangePickerFooter]',
  standalone: true,
  exportAs: 'slTimeRangePickerFooter',
})
export class SlTimeRangePickerFooter {}
