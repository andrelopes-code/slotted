import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { SlField } from '@slotted/angular/field';

import { injectTextareaDefaults } from './textarea-defaults';
import type { TextareaResize, TextareaSize, TextareaVariant } from './textarea-defaults';

export type { TextareaResize, TextareaSize, TextareaVariant } from './textarea-defaults';

/**
 * Many lines of text, in the element that already holds them.
 *
 * **No frame.** `text-field` wraps its input because an adornment and two
 * buttons have to sit inside one border and a void element can hold no child.
 * Nothing surveyed puts an adornment inside a textarea — the corner is where
 * the resize handle goes — so this family is the control itself, and the two
 * anatomies differ on purpose rather than matching for symmetry.
 *
 * **The platform grows it.** `autoSize` is CSS `field-sizing: content`. Nothing
 * is measured on the main thread, no line height is cached and no layout is
 * read per keystroke, which is what `cdkTextareaAutosize` does. `field-sizing`
 * shrinkwraps, so `rows` stops being the floor: the two row counts reach the
 * stylesheet as custom properties, and it states the floor and the ceiling in
 * line boxes.
 *
 * **Enter makes a line.** Nothing is bound to a key. WAI-ARIA notes the
 * difference between a single-line and a multi-line text control, and
 * `docs/component-features.md` §6 requires it: a multi-line control never
 * submits implicitly.
 */
@Component({
  selector: 'textarea[slTextarea]',
  standalone: true,
  exportAs: 'slTextarea',
  template: '',
  styleUrl: '../../../styles/src/textarea/textarea.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTextarea), multi: true },
  ],
  host: {
    'data-ui': 'textarea',
    'data-ui-textarea': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.id]': 'controlId()',
    '[attr.rows]': 'rows()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-resize]': 'resolvedResize()',
    '[attr.data-mono]': "resolvedMono() ? '' : null",
    '[attr.data-auto-size]': "autoSize() ? '' : null",
    '[attr.data-disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.data-invalid]': "resolvedInvalid() === true ? '' : null",
    '[attr.data-readonly]': "resolvedReadOnly() === true ? '' : null",
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.disabled]': 'disabledAttribute()',
    '[attr.readonly]': 'readonlyAttribute()',
    '[attr.maxlength]': 'maxLengthAttribute()',
    '[style.--slotted-textarea-rows]': 'rows()',
    '[style.--slotted-textarea-max-rows]': 'maxRows()',
    '(input)': 'onInput($event)',
    '(blur)': 'onBlur()',
  },
})
export class SlTextarea implements ControlValueAccessor, OnInit {
  /** Defaults to the field, then to the token, then to `md`. */
  readonly size = input<TextareaSize | undefined>(undefined);
  /** Defaults to the token, then to `outline`. */
  readonly variant = input<TextareaVariant | undefined>(undefined);
  /** Defaults to the token, then to `block`. Withdrawn while `autoSize` is on. */
  readonly resize = input<TextareaResize | undefined>(undefined);
  /** Sets the value in the monospaced family, for a payload or a template. */
  readonly mono = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Grows with the content, through the platform rather than a measurement. */
  readonly autoSize = input(false, { transform: booleanAttribute });
  /** The floor, in rows. It is the element's own `rows` as well. */
  readonly rows = input(3, { transform: numberAttribute });
  /**
   * The ceiling `autoSize` grows to, in rows. It cannot be removed: a control
   * that grows forever pushes the page out from under the caret, which is the
   * defect every auto-grow implementation ships first.
   */
  readonly maxRows = input(12, { transform: numberAttribute });

  /** Present means the consumer owns the value. */
  readonly value = input<string | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Unstated rather than `false`, so the control defers to the field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Publishes the length of the value to the field, which draws the count. */
  readonly showCount = input(false, { transform: booleanAttribute });
  /**
   * The native limit, as a binding. Without this input `[maxLength]` would set
   * the element's property and the count would never see it; a static
   * `maxlength` attribute is read as written.
   */
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** The limit the count is measured against. Defaults to `maxlength`. */
  readonly countMax = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });

  /** One output for one transition, carrying the reason and `cancel()`. */
  readonly valueChange = output<ChangeRequest<string>>();

  private readonly element = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  private readonly defaults = injectTextareaDefaults();
  private readonly field = inject(SlField, { optional: true });

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
  private readonly writtenReadonly = inject(new HostAttributeToken('readonly'), { optional: true });
  private readonly writtenMaxLength = inject(new HostAttributeToken('maxlength'), {
    optional: true,
  });

  /** What the element is showing. Never a second copy of the value. */
  private readonly mirror = signal('');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  readonly resolvedSize = computed(
    () => this.size() ?? this.field?.resolvedSize() ?? this.defaults.size,
  );
  readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  readonly resolvedMono = computed(() => this.mono() ?? this.defaults.mono);
  /**
   * A control that sizes itself and a handle that fixes its size disagree on
   * the next keystroke, so the handle is withdrawn rather than left to fight.
   */
  readonly resolvedResize = computed<TextareaResize>(() =>
    this.autoSize() ? 'none' : (this.resize() ?? this.defaults.resize),
  );
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(
    () =>
      this.readOnly() ??
      (this.writtenReadonly === null ? undefined : true) ??
      this.field?.resolvedReadOnly(),
  );
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());

  protected readonly controlId = computed(
    () => this.writtenId ?? this.field?.ids().control ?? null,
  );
  protected readonly describedBy = computed(() => {
    const merged = [this.writtenDescribedBy, this.field?.describedBy()].filter(Boolean);
    return merged.length === 0 ? null : merged.join(' ');
  });
  protected readonly ariaInvalid = computed(
    () => this.writtenInvalid ?? (this.resolvedInvalid() === true ? 'true' : null),
  );
  protected readonly ariaRequired = computed(
    () => this.writtenRequired ?? (this.field?.required() === true ? 'true' : null),
  );
  protected readonly disabledAttribute = computed(() =>
    this.resolvedDisabled() === true ? '' : null,
  );
  protected readonly readonlyAttribute = computed(() =>
    this.resolvedReadOnly() === true ? '' : null,
  );

  protected readonly maxLengthAttribute = computed(
    () => this.maxLength() ?? this.writtenMaxLength ?? null,
  );

  private readonly limit = computed(() => {
    const written = this.writtenMaxLength === null ? undefined : Number(this.writtenMaxLength);
    return (
      this.countMax() ??
      this.maxLength() ??
      (written === undefined || Number.isNaN(written) ? undefined : written)
    );
  });

  constructor() {
    effect(() => {
      const next = this.value();
      if (next === undefined || next === this.element.value) return;
      this.element.value = next;
      this.mirror.set(next);
    });

    effect(() => {
      if (this.field === null) return;
      if (!this.showCount()) {
        this.field.setCount(undefined);
        return;
      }
      this.field.setCount({ length: this.mirror().length, max: this.limit() });
    });
  }

  /**
   * Angular creates every directive in a template before it binds any input, so
   * the starting value is read here rather than in the constructor, where
   * `defaultValue` is always still `undefined`.
   */
  ngOnInit() {
    const initial = this.defaultValue() ?? this.element.value;
    if (initial !== this.element.value) this.element.value = initial;
    this.mirror.set(this.element.value);
  }

  /** The native element, for `focus()`, `select()` and `setSelectionRange()`. */
  get textareaElement(): HTMLTextAreaElement {
    return this.element;
  }

  writeValue(value: string | null | undefined) {
    this.element.value = value ?? '';
    this.mirror.set(this.element.value);
  }

  registerOnChange(fn: (value: string) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  protected onInput(event: Event) {
    const next = this.element.value;
    if (next === this.mirror()) return;

    let cancelled = false;
    const state = createControllable<string>({
      controlled: undefined,
      initial: this.mirror(),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(next, 'keyboard', event);
    if (cancelled) return;

    this.mirror.set(next);
    this.onChangeFn(next);
  }

  protected onBlur() {
    this.onTouchedFn();
  }
}
