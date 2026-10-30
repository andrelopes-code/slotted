import { Directive } from '@angular/core';

/**
 * The consumer's own shortcuts, beside the two lists where there is room and
 * above them where there is not. Each one is a `slTimeRangePickerPreset` button.
 */
@Directive({
  selector: '[slTimeRangePickerPresets]',
  standalone: true,
  exportAs: 'slTimeRangePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlTimeRangePickerPresets {}

/** The consumer's own actions, under the two lists. */
@Directive({
  selector: '[slTimeRangePickerFooter]',
  standalone: true,
  exportAs: 'slTimeRangePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlTimeRangePickerFooter {}

/**
 * What one row of a list draws.
 *
 * The row is the family's — its role, its states, its keyboard and its target
 * size — and what is written inside it is the consumer's. It is a template
 * rather than a projected slot because it is re-rendered once per option. The
 * context carries the time as `$implicit`, plus `position`, `label`,
 * `duration`, `selected`, `current` and `unavailable`.
 */
@Directive({
  selector: '[slTimeRangePickerOption]',
  standalone: true,
  exportAs: 'slTimeRangePickerOption',
})
export class SlTimeRangePickerOption {}
