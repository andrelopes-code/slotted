import { Directive } from '@angular/core';

/**
 * The consumer's own shortcuts, in a column beside the list.
 *
 * This family ships no list of them: "start of the shift" is a business clock
 * and a library that guessed at one would be guessing at an industry. What it
 * ships is the column they stand in.
 */
@Directive({
  selector: '[slTimePickerPresets]',
  standalone: true,
  exportAs: 'slTimePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlTimePickerPresets {}

/** The consumer's own actions, under the list. */
@Directive({
  selector: '[slTimePickerFooter]',
  standalone: true,
  exportAs: 'slTimePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlTimePickerFooter {}
