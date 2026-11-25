import { Directive } from '@angular/core';

/** What the footer of the panel says when nothing is wrong. Unset, the step. */
@Directive({
  selector: '[slDateTimePickerFooter]',
  standalone: true,
  exportAs: 'slDateTimePickerFooter',
})
export class SlDateTimePickerFooter {}
