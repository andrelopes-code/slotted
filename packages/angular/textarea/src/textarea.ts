import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { SlField } from '@slotted/angular/field';

export type TextareaSize = 'sm' | 'md' | 'lg';

/**
 * The multi-line control, wired to the field around it when there is one and
 * standing alone when there is not. It follows the mechanism SlInput set:
 * unset defers to the field, set wins over it, and the resolved state is
 * mirrored onto the element.
 */
@Component({
  selector: 'textarea[slTextarea]',
  standalone: true,
  template: '',
  styleUrl: '../../../styles/src/textarea/textarea.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-textarea',
    'data-slotted-component': 'textarea',
    'data-part': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-auto-size]': "autoSize() ? '' : null",
    '[attr.data-disabled]': "isDisabled() ? '' : null",
    '[attr.data-invalid]': "isInvalid() ? '' : null",
    '[attr.data-readonly]': "isReadOnly() ? '' : null",
    '[attr.rows]': 'rows()',
    '[attr.id]': 'controlId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "isInvalid() ? 'true' : null",
    '[attr.aria-required]': "isRequired() ? 'true' : null",
    '[attr.disabled]': "isDisabled() ? '' : null",
    '[attr.readonly]': "isReadOnly() ? '' : null",
  },
})
export class SlTextarea {
  readonly autoSize = input(false, { transform: booleanAttribute });
  readonly disabled = input<boolean | undefined>(undefined);
  readonly invalid = input<boolean | undefined>(undefined);
  readonly readOnly = input<boolean | undefined>(undefined);
  readonly required = input<boolean | undefined>(undefined);
  readonly rows = input(3, { transform: numberAttribute });
  readonly size = input<TextareaSize>('md');

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
