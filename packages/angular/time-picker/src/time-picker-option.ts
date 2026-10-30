import { Directive } from '@angular/core';

/**
 * What one row of the panel draws.
 *
 * The row is the family's — its role, its states, its keyboard and its target
 * size — and what is written inside it is the consumer's. It is a template
 * rather than a projected slot because it is re-rendered once per option, which
 * is exactly the case `references/frameworks.md` names `NgTemplateOutlet` for.
 *
 * The context carries the time as `$implicit`, plus `label`, `selected`,
 * `current` and `unavailable`.
 */
@Directive({
  selector: '[slTimePickerOption]',
  standalone: true,
  exportAs: 'slTimePickerOption',
})
export class SlTimePickerOption {}
