import { Directive } from '@angular/core';

/**
 * The consumer's own shortcuts, in a column beside the grid.
 *
 * This family ships no list of them: "last 7 days" is a business calendar and a
 * library that guessed at one would be guessing at a fiscal year. What it ships
 * is the column they stand in.
 */
@Directive({
  selector: '[slDatePickerPresets]',
  standalone: true,
  exportAs: 'slDatePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlDatePickerPresets {}

/** The consumer's own actions, under whatever the surface is holding. */
@Directive({
  selector: '[slDatePickerFooter]',
  standalone: true,
  exportAs: 'slDatePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDatePickerFooter {}
