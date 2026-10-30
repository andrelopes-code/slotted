import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  afterNextRender,
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { SlField } from '@slotted/angular/field';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';

import { SlTextFieldControl } from './text-field-defaults';
import type { TextFieldType } from './text-field-defaults';
import { SlTextField } from './text-field';

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter. A click synthesised by the keyboard reports no detail; a real one
 * reports the click count — the rule `button` and `tag` both write.
 */
function activationReason(event: Event): ChangeReason {
  return event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * The control itself: the value, the identifier, and everything the field
 * around it says.
 *
 * **The element owns the characters.** The directive keeps a mirror of what the
 * element shows, for the clear button and the count, and never a second copy of
 * the value. `writeValue` from a form and a `[value]` binding both write the
 * element; typing writes it directly, and nothing here fights the browser for
 * it — which is what Angular's own `DefaultValueAccessor` does, and the
 * asymmetry with React, where a controlled input's DOM belongs to React.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`, which is what makes "not disabled" and "said
 * nothing" different answers. A value the consumer wrote as a static attribute
 * is read before the host binding computes, so the binding never writes over it.
 */
@Directive({
  selector: 'input[slTextFieldInput]',
  standalone: true,
  exportAs: 'slTextFieldInput',
  providers: [
    { provide: SlTextFieldControl, useExisting: forwardRef(() => SlTextFieldInput) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlTextFieldInput), multi: true },
  ],
  host: {
    'data-part': 'input',
    'data-part-input': '',
    '[attr.id]': 'controlId()',
    '[attr.type]': 'resolvedType()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.disabled]': 'disabledAttribute()',
    '[attr.readonly]': 'readonlyAttribute()',
    '[attr.aria-busy]': "textField.loading() === true ? 'true' : null",
    '(input)': 'onInput($event)',
    '(keydown)': 'readCapsLock($event)',
    '(keyup)': 'readCapsLock($event)',
    '(blur)': 'onBlur()',
  },
})
export class SlTextFieldInput implements ControlValueAccessor, OnInit, SlTextFieldControl {
  /** Present means the consumer owns the value. */
  readonly value = input<string | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Unstated rather than `false`, so the control defers to the field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`. Reaches the element as the native `readonly`. */
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Unstated rather than `false`. Reaches the element as `aria-invalid`. */
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  /** Publishes the length of the value to the field, which draws the count. */
  readonly showCount = input(false, { transform: booleanAttribute });
  /**
   * The limit the count is measured against. Defaults to the element's own
   * `maxlength`, and set alone it is a soft limit: the value can pass it, and
   * the counter says so before validation runs.
   */
  readonly countMax = input<number | undefined, unknown>(undefined, {
    transform: (value) =>
      value === undefined || value === null ? undefined : numberAttribute(value),
  });
  /** Present means the consumer owns whether the password is showing. */
  readonly revealedValue = input<boolean | undefined, boolean | string | undefined>(undefined, {
    alias: 'revealed',
    transform: (value) => (value === undefined ? undefined : booleanAttribute(value)),
  });
  readonly defaultRevealed = input(false, { transform: booleanAttribute });
  /**
   * The element's own `type`, written or bound. An input rather than a host
   * attribute read once, because a bound `[type]` would otherwise go to the
   * element's property and the host binding below would never see it.
   */
  readonly type = input<TextFieldType | string | undefined>(undefined);

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(value)]`,
   * because a two-way binding has one slot and can carry none of those; a form
   * gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<ChangeRequest<string>>();
  readonly revealedChange = output<ChangeRequest<boolean>>();

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  /**
   * The frame around the control. Injected without `optional`, so an `input`
   * written without it fails at construction rather than silently losing its
   * border, its ring and the place its two buttons stand — the property
   * `docs/history/designs/2026-08-31-field-aware-controls-design.md` asks of
   * every control this library ships. It is public because a template that
   * reaches the input through `exportAs` may want the frame's resolved step.
   */
  readonly textField = inject(SlTextField);
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
  private readonly ownRevealed = signal(false);
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  private readonly ownCapsLock = signal(false);
  readonly capsLock = this.ownCapsLock.asReadonly();
  readonly currentValue = this.mirror.asReadonly();
  readonly empty = computed(() => this.mirror() === '');
  readonly revealed = computed(() => this.revealedValue() ?? this.ownRevealed());
  private readonly ownType = computed(() => this.type() ?? 'text');
  readonly password = computed(() => this.ownType() === 'password');

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
  /**
   * The swap the reveal button makes. It is the element's own `type` otherwise,
   * so a consumer's `type="email"` survives the host binding that a directive
   * on the element would otherwise write over.
   */
  protected readonly resolvedType = computed<TextFieldType | string>(() =>
    this.password() && this.revealed() ? 'text' : this.ownType(),
  );
  /** Merged after the consumer's own, so a tour step is read before the help. */
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

  private readonly limit = computed(() => {
    const written = this.writtenMaxLength === null ? undefined : Number(this.writtenMaxLength);
    return (
      this.countMax() ?? (written === undefined || Number.isNaN(written) ? undefined : written)
    );
  });

  constructor() {
    /* A consumer's own value writes the element, the way a form's does. */
    effect(() => {
      const next = this.value();
      if (next === undefined || next === this.element.value) return;
      this.element.value = next;
      this.mirror.set(next);
    });

    /* The count is the control's and the place is the field's. */
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
   * the starting value is read here rather than in the constructor: read there,
   * `defaultValue` is always `undefined` and the mirror starts empty — which is
   * what the first run of this family's spec showed, as a clear button that
   * never appeared and a count that stayed at nought.
   */
  ngOnInit() {
    this.ownRevealed.set(this.defaultRevealed());
    const initial = this.defaultValue() ?? this.element.value;
    if (initial !== this.element.value) this.element.value = initial;
    this.mirror.set(this.element.value);
  }

  /** The native element, for `focus()`, `select()` and `setSelectionRange()`. */
  get inputElement(): HTMLInputElement {
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

  clear(source: Event) {
    if (this.request('', 'clear', source)) {
      this.element.value = '';
      this.mirror.set('');
      this.onChangeFn('');
    }
    this.element.focus();
  }

  toggleReveal(source: Event) {
    const start = this.element.selectionStart;
    const end = this.element.selectionEnd;
    const next = !this.revealed();

    let cancelled = false;
    const state = createControllable<boolean>({
      controlled: this.revealedValue(),
      initial: this.revealed(),
      onRequest: (request) => {
        this.revealedChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(next, activationReason(source), source);
    if (cancelled) return;
    this.ownRevealed.set(next);

    /* Swapping the type moves the caret to the end, so it is put back after
       the attribute is written rather than before. */
    afterNextRender(
      () => {
        this.element.focus();
        if (start !== null && end !== null) this.element.setSelectionRange(start, end);
      },
      { injector: this.injector },
    );
  }

  protected onInput(event: Event) {
    const next = this.element.value;
    if (this.request(next, 'keyboard', event)) {
      this.mirror.set(next);
      this.onChangeFn(next);
    }
  }

  protected onBlur() {
    this.ownCapsLock.set(false);
    this.onTouchedFn();
  }

  /**
   * Caps Lock is read from the key events the control already receives, and
   * only in a password: the platform exposes the modifier on an event and
   * nowhere else. It is announced once, as it turns on.
   */
  protected readCapsLock(event: KeyboardEvent) {
    if (!this.password() || typeof event.getModifierState !== 'function') return;
    const on = event.getModifierState('CapsLock');
    if (on && !this.ownCapsLock()) {
      getLiveAnnouncer(this.element.ownerDocument).announce(this.textField.t('capsLock'));
    }
    this.ownCapsLock.set(on);
  }

  /** Emits the request and says whether anything may commit. */
  private request(next: string, reason: ChangeReason, source: Event): boolean {
    if (next === this.mirror()) return false;

    let cancelled = false;
    const state = createControllable<string>({
      controlled: undefined,
      initial: this.mirror(),
      onRequest: (request) => {
        this.valueChange.emit(request);
        cancelled = request.cancelled;
      },
    });
    state.request(next, reason, source);
    return !cancelled;
  }
}
