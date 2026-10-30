import { Directive } from '@angular/core';

/**
 * The consumer's own shortcuts, beside the grid and the two lists where there is room
 * and above them where there is not. Each one is a `slDateTimeRangePickerPreset` button.
 */
@Directive({
  selector: '[slDateTimeRangePickerPresets]',
  standalone: true,
  exportAs: 'slDateTimeRangePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlDateTimeRangePickerPresets {}

/** The consumer's own actions, under the grid and the two lists. */
@Directive({
  selector: '[slDateTimeRangePickerFooter]',
  standalone: true,
  exportAs: 'slDateTimeRangePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDateTimeRangePickerFooter {}

/**
 * What one row of a list draws.
 *
 * The row is the family's — its role, its states, its keyboard and its target
 * size — and what is written inside it is the consumer's. It is a template
 * rather than a projected slot because it is re-rendered once per option. The
 * context carries the time as `$implicit`, plus `position`, `date`, `label`,
 * `duration`, `selected`, `current` and `unavailable`.
 */
@Directive({
  selector: '[slDateTimeRangePickerOption]',
  standalone: true,
  exportAs: 'slDateTimeRangePickerOption',
})
export class SlDateTimeRangePickerOption {}
