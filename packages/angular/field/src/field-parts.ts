import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { SlField } from './field';
import { necessityMark } from './field-defaults';

/**
 * Names the control, and says whether it has to be answered.
 *
 * The association is explicit — `for` pointing at the control's identifier —
 * because the APG's naming practice records that some combinations of assistive
 * technology and browser fail to treat the implicit form, wrapping the control
 * in the label, as having an accessible name at all.
 *
 * The necessity marker is drawn here rather than written by the page. The glyph
 * is `aria-hidden`, because `aria-required` on the control already carries the
 * semantics and a reader working a form of twenty required fields does not need
 * to hear "asterisk" twenty times; the two word forms are not hidden, because
 * `(optional)` is information rather than decoration.
 */
@Component({
  selector: 'label[slFieldLabel]',
  standalone: true,
  exportAs: 'slFieldLabel',
  template: `<ng-content />
    @if (mark(); as text) {
      <!-- Text rather than a margin, so the accessible name reads "Note (optional)". -->
      &ngsp;<span
        data-part="mark"
        data-part-mark=""
        [attr.aria-hidden]="markHidden() ? 'true' : null"
        >{{ text }}</span
      >
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'label',
    'data-part-label': '',
    '[attr.for]': 'labelFor()',
    '[attr.id]': 'labelId()',
  },
})
export class SlFieldLabel {
  private readonly field = inject(SlField);
  private readonly writtenFor = inject(new HostAttributeToken('for'), { optional: true });
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });

  protected readonly labelFor = computed(() => this.writtenFor ?? this.field.ids().control);
  protected readonly labelId = computed(() => this.writtenId ?? this.field.ids().label);

  private readonly necessity = computed(() =>
    necessityMark(this.field.resolvedNecessity(), this.field.required() === true, this.field.t),
  );
  protected readonly markHidden = computed(() => this.necessity()?.hidden === true);
  protected readonly mark = computed(() => this.necessity()?.text ?? null);
}

/**
 * Applies the field's wiring to a control the library does not own.
 *
 * Controls this library ships read the field themselves and need no directive,
 * which is what
 * `docs/history/designs/2026-08-31-field-aware-controls-design.md` decides.
 * This exists for the two cases that cannot: a plain native element, and a
 * component written before this library.
 *
 * Every value the consumer wrote wins. A host binding beats a static attribute
 * in Angular, so each written value is read before the binding is computed
 * rather than after — the asymmetry with React, where a consumer's prop simply
 * spreads over the family's.
 */
@Directive({
  selector: '[slFieldControl]',
  standalone: true,
  exportAs: 'slFieldControl',
  host: {
    'data-part': 'control',
    'data-part-control': '',
    '[attr.id]': 'controlId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.disabled]': 'disabledAttribute()',
    '[attr.readonly]': 'readonlyAttribute()',
  },
})
export class SlFieldControl {
  private readonly field = inject(SlField);
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly writtenInvalid = inject(new HostAttributeToken('aria-invalid'), {
    optional: true,
  });
  private readonly writtenRequired = inject(new HostAttributeToken('aria-required'), {
    optional: true,
  });
  private readonly writtenDisabled = inject(new HostAttributeToken('disabled'), { optional: true });
  private readonly writtenReadonly = inject(new HostAttributeToken('readonly'), { optional: true });

  protected readonly controlId = computed(() => this.writtenId ?? this.field.ids().control);

  /** Merged after the consumer's own, so a tour step is read before the help. */
  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });

  protected readonly ariaInvalid = computed(
    () => this.writtenInvalid ?? (this.field.invalid() === true ? 'true' : null),
  );
  protected readonly ariaRequired = computed(
    () => this.writtenRequired ?? (this.field.required() === true ? 'true' : null),
  );
  protected readonly disabledAttribute = computed(
    () => this.writtenDisabled ?? (this.field.resolvedDisabled() === true ? '' : null),
  );
  protected readonly readonlyAttribute = computed(
    () => this.writtenReadonly ?? (this.field.resolvedReadOnly() === true ? '' : null),
  );
}

/**
 * A link or a button at the end of the label row — `Forgot password?`,
 * `Generate` — written on the consumer's own `a` or `button`. On a `button` the
 * directive writes `type="button"` unless the page wrote a type, so it never
 * submits the form it sits in; on a link it writes nothing. The field does not
 * disable it with the control: what it does is the page's.
 */
@Directive({
  selector: '[slFieldAction]',
  standalone: true,
  exportAs: 'slFieldAction',
  host: {
    'data-part': 'action',
    'data-part-action': '',
    '[attr.type]': 'type',
  },
})
export class SlFieldAction {
  private readonly writtenType = inject(new HostAttributeToken('type'), { optional: true });
  protected readonly type =
    this.writtenType ??
    (inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON'
      ? 'button'
      : null);
}
