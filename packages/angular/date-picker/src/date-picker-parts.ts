import { Directive } from '@angular/core';

/** What the footer of the panel says when nothing is wrong. */
@Directive({ selector: '[slDatePickerFooter]', standalone: true, exportAs: 'slDatePickerFooter' })
export class SlDatePickerFooter {}
