import { computed, Directive, inject, input } from '@angular/core';

import { SlFormOwner } from './form-defaults';
import type { FormActionsAlign } from './form-defaults';

/**
 * The row a form's actions stand in.
 *
 * `inline` can end-align a row of buttons. What it cannot do without a query
 * the consumer writes for every form is the reflow: below the form's own
 * container width every action takes the whole width, in a column, with the
 * primary one first — a reader's thumb is at the bottom of a phone and their
 * eye at the end of a row.
 */
@Directive({
  selector: '[slFormActions]',
  standalone: true,
  exportAs: 'slFormActions',
  host: {
    // The family's identifier on the part: its rules reach it by name, never as any descendant.
    'data-ui': 'form',
    'data-ui-form': '',
    'data-part': 'actions',
    'data-part-actions': '',
    '[attr.data-align]': 'resolvedAlign()',
  },
})
export class SlFormActions {
  /** Defaults to the form's own `align`, then to the token, then to `end`. */
  readonly align = input<FormActionsAlign | undefined>(undefined);

  private readonly form = inject(SlFormOwner, { optional: true });

  protected readonly resolvedAlign = computed(
    () => this.align() ?? this.form?.resolvedAlign() ?? 'end',
  );
}

/**
 * What the form says about the whole record — a live preview, a summary in
 * words, a help panel — beside the column of fields on a wide form, and after
 * the last field on a narrow one.
 */
@Directive({
  selector: '[slFormAside]',
  standalone: true,
  exportAs: 'slFormAside',
  host: {
    'data-ui': 'form',
    'data-ui-form': '',
    'data-part': 'aside',
    'data-part-aside': '',
  },
})
export class SlFormAside {}
