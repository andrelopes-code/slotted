import { Directive } from '@angular/core';

/** What the footer of the panel says when nothing is wrong. */
@Directive({ selector: '[slTimePickerFooter]', standalone: true, exportAs: 'slTimePickerFooter' })
export class SlTimePickerFooter {}
