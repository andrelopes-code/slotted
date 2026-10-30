import { Directive } from '@angular/core';

/**
 * What one row of the list draws.
 *
 * The row is the family's — its role, its states, its keyboard and its target
 * size — and what is written inside it is the consumer's. It is a template
 * rather than a projected slot because it is re-rendered once per option, which
 * is exactly the case `references/frameworks.md` names `NgTemplateOutlet` for.
 *
 * The context carries the time as `$implicit`, plus `date`, `label`,
 * `selected`, `current` and `unavailable`.
 */
@Directive({
  selector: '[slDateTimePickerOption]',
  standalone: true,
  exportAs: 'slDateTimePickerOption',
})
export class SlDateTimePickerOption {}

/**
 * The consumer's own shortcuts, in the head beside `now`.
 *
 * This family ships no list of them: "tomorrow at nine" is a business clock,
 * and a library that guessed at one would be guessing at an industry. What it
 * ships is the row they stand in.
 */
@Directive({
  selector: '[slDateTimePickerPresets]',
  standalone: true,
  exportAs: 'slDateTimePickerPresets',
  host: { 'data-part': 'presets', 'data-part-presets': '' },
})
export class SlDateTimePickerPresets {}

/** The consumer's own actions, under both surfaces. */
@Directive({
  selector: '[slDateTimePickerFooter]',
  standalone: true,
  exportAs: 'slDateTimePickerFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlDateTimePickerFooter {}
