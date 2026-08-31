import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';

export type InputSize = 'sm' | 'md' | 'lg';

/**
 * The native control, wired to the field around it when there is one and
 * standing alone when there is not.
 *
 * Every shared state is undefined by default. Unset defers to the field; set
 * wins over it, in both directions. The resolved value is mirrored onto the
 * element as a data attribute, so the stylesheet is one selector and an input
 * outside a field looks the same as one inside it.
 *
 * `SlField` is imported by its published path. A relative path into the field
 * entry point's source compiles each entry point its own copy of the class,
 * and two copies of a class are two injection tokens.
 */
@Component({
  selector: 'input[slInput]',
  standalone: true,
  template: '',
  styleUrl: '../../../styles/src/input/input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-input',
    'data-slotted-component': 'input',
    'data-part': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-invalid]': "isInvalid() ? '' : null",
    '[attr.data-readonly]': "isReadOnly() ? '' : null",
    '[attr.id]': 'controlId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "isInvalid() ? 'true' : null",
    '[attr.aria-required]': "isRequired() ? 'true' : null",
    '[attr.disabled]': "isDisabled() ? '' : null",
    '[attr.readonly]': "isReadOnly() ? '' : null",
  },
})
export class SlInput {
  readonly disabled = input<boolean | undefined>(undefined);
  readonly invalid = input<boolean | undefined>(undefined);
  readonly readOnly = input<boolean | undefined>(undefined);
  readonly required = input<boolean | undefined>(undefined);
  readonly size = input<InputSize>('md');

  private readonly field = inject(SlField, { optional: true });
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly own = {
    ariaDescribedBy: this.element.getAttribute('aria-describedby'),
    id: this.element.getAttribute('id'),
  };

  protected readonly isDisabled = computed(
    () => this.disabled() ?? this.field?.disabled() ?? false,
  );

  protected readonly isInvalid = computed(() => this.invalid() ?? this.field?.invalid() ?? false);

  protected readonly isReadOnly = computed(
    () => this.readOnly() ?? this.field?.readOnly() ?? false,
  );

  protected readonly isRequired = computed(
    () => this.required() ?? this.field?.required() ?? false,
  );

  protected readonly controlId = computed(() => this.own.id ?? this.field?.controlId() ?? null);

  protected readonly describedBy = computed(() => {
    const ids = [this.own.ariaDescribedBy, this.field?.describedBy()].filter(
      (value): value is string => value !== null && value !== undefined && value !== '',
    );
    return ids.length > 0 ? ids.join(' ') : null;
  });

  constructor() {
    this.field?.registerControl();
  }
}
