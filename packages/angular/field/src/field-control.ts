import { computed, Directive, ElementRef, inject } from '@angular/core';

import { SlField } from './field';

/**
 * Applies the field's wiring to any control, including a plain native input.
 * Every binding yields to a value the consumer already placed on the element,
 * which is the family's invariant: the field fills what is unset and never
 * overwrites what was passed.
 */
@Directive({
  selector: '[slFieldControl]',
  standalone: true,
  host: {
    'data-part': 'control',
    '[attr.id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.disabled]': 'disabled()',
    '[attr.readonly]': 'readOnly()',
  },
})
export class SlFieldControl {
  private readonly field = inject(SlField);
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly own = {
    ariaDescribedBy: this.element.getAttribute('aria-describedby'),
    ariaInvalid: this.element.getAttribute('aria-invalid'),
    ariaRequired: this.element.getAttribute('aria-required'),
    disabled: this.element.getAttribute('disabled'),
    id: this.element.getAttribute('id'),
    readOnly: this.element.getAttribute('readonly'),
  };

  readonly id = computed(() => this.own.id ?? this.field.controlId());

  readonly describedBy = computed(() => {
    const ids = [this.own.ariaDescribedBy, this.field.describedBy()].filter(
      (value): value is string => value !== null && value !== '',
    );
    return ids.length > 0 ? ids.join(' ') : null;
  });

  readonly ariaInvalid = computed(
    () => this.own.ariaInvalid ?? (this.field.invalid() ? 'true' : null),
  );

  readonly ariaRequired = computed(
    () => this.own.ariaRequired ?? (this.field.required() ? 'true' : null),
  );

  readonly disabled = computed(() => this.own.disabled ?? (this.field.disabled() ? '' : null));

  readonly readOnly = computed(() => this.own.readOnly ?? (this.field.readOnly() ? '' : null));

  constructor() {
    this.field.registerControl();
  }
}
