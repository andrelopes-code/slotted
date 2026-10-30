import { Directive } from '@angular/core';

/**
 * The consumer's own shortcuts, beside the grid where there is room and above
 * it where there is not. Each one is a `slDateRangePickerPreset` button.
 */
@Directive({
  selector: '[slDateRangePickerPresets]',
  standalone: true,
  exportAs: 'slDateRangePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlDateRangePickerPresets {}

/** The consumer's own actions, under whatever the surface is holding. */
@Directive({
  selector: '[slDateRangePickerFooter]',
  standalone: true,
  exportAs: 'slDateRangePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDateRangePickerFooter {}
