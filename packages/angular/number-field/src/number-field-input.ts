import {
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { clamp as clampNumber } from '@slotted/core/measure';
import { createNumberFormat, snapToStep as snapToGrid, stepNumber } from '@slotted/core/number';
import type { NumberFormat } from '@slotted/core/number';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import { SlField } from '@slotted/angular/field';
import { injectLocale } from '@slotted/angular/i18n';

import { injectNumberFieldDefaults, SlNumberFieldControl } from './number-field-defaults';
import type { NumberFieldClamp, NumberFieldFormatOn } from './number-field-defaults';
import { SlNumberField } from './number-field';

/** `undefined` stays absent; anything else becomes a number. */
const optionalNumber = (value: unknown) =>
  value === undefined || value === null || value === '' ? undefined : numberAttribute(value);

/**
 * The control itself: the number, the identifier, and everything the field
 * around it says.
 *
 * **The element is `type="text"` and carries the APG's `spinbutton` role.**
 * `type="number"` empties itself whenever the text is not a valid
 * floating-point number, so no grouping separator, no decimal comma and no
 * currency affix survives it.
 *
 * **The text belongs to the element and the number belongs to the family.** The
 * number moves on every keystroke that parses. Under `formatOn="change"`, the
 * default, the text takes the locale's shape on that same keystroke: the
 * grouping a long number is read by appears while it is being typed, and the
 * caret comes back to the character it was on because it is counted in the
 * reader's own characters rather than in string indices. Under
 * `formatOn="commit"` the text is the reader's until blur, `Enter`, a stepper
 * press, a key step or a wheel turn.
 *
 * Rounding, padding and clamping belong to the commit under both. A keystroke
 * never takes away a nought the reader has just typed.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`. A value the consumer wrote as a static
 * attribute is read before the host binding computes, so the binding never
 * writes over it.
 */
@Directive({
  selector: 'input[slNumberFieldInput]',
  standalone: true,
  exportAs: 'slNumberFieldInput',
  providers: [
    { provide: SlNumberFieldControl, useExisting: forwardRef(() => SlNumberFieldInput) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlNumberFieldInput), multi: true },
  ],
  host: {
    'data-part': 'input',
    'data-part-input': '',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    /* Bound rather than static, so a consumer who wrote `type="number"` on a
       number field does not get the element that empties its own value. */
    '[attr.type]': "'text'",
    '[attr.role]': "'spinbutton'",
    '[attr.id]': 'controlId()',
    '[attr.inputmode]': 'resolvedInputMode()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-valuenow]': 'numberValue()',
    '[attr.aria-valuemin]': 'min() ?? null',
    '[attr.aria-valuemax]': 'max() ?? null',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.name]': 'null',
    '[attr.disabled]': 'disabledAttribute()',
    '[attr.readonly]': 'readonlyAttribute()',
    '(input)': 'onInput($event)',
    '(beforeinput)': 'onBeforeInput($event)',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class SlNumberFieldInput implements ControlValueAccessor, OnInit, SlNumberFieldControl {
  /**
   * Present means the consumer owns the number, for the life of the component.
   * `null` is empty, and `undefined` is the absence that makes the control
   * uncontrolled — the two are different answers.
   */
  readonly value = input<number | null | undefined, unknown>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : (optionalNumber(raw) ?? null)),
  });
  /** The number the control starts from when nobody else writes one. */
  readonly defaultValue = input<number | null, unknown>(null, {
    transform: (raw) => (raw === undefined ? null : (optionalNumber(raw) ?? null)),
  });

  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly step = input<number, unknown>(1, { transform: (raw) => optionalNumber(raw) ?? 1 });
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  readonly largeStep = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** The amount `Alt` moves by. Defaults to `step / 10`. */
  readonly smallStep = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Where an empty control starts stepping from. Defaults to `min`, then nought. */
  readonly stepFrom = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly snapToStep = input(false, { transform: booleanAttribute });
  /** Where a value outside the range goes, and when. Defaults to the token, then `blur`. */
  readonly clamp = input<NumberFieldClamp | undefined>(undefined);
  /** How the value is written and read back, through `Intl.NumberFormat`. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** When the text takes that shape. Defaults to the token, then `change`. */
  readonly formatOn = input<NumberFieldFormatOn | undefined>(undefined);
  /** BCP 47. Defaults to the language in force (`provideSlotted`). */
  readonly locale = input<string | undefined>(undefined);
  /**
   * Lets the wheel move the value while the control has focus. Off by default:
   * a reader scrolling a form must not change an amount by passing over it.
   */
  readonly wheel = input(false, { transform: booleanAttribute });

  /** Unstated rather than `false`, so the control defers to the field. */
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (raw) => (raw === undefined ? undefined : booleanAttribute(raw)),
  });

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(value)]`,
   * because a two-way binding has one slot and can carry none of those; a form
   * gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<ChangeRequest<number | null>>();

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  /**
   * The frame around the control. Injected without `optional`, so an `input`
   * written without it fails at construction rather than silently losing its
   * border, its ring and the place its two buttons stand.
   */
  readonly numberField = inject(SlNumberField);
  private readonly field = inject(SlField, { optional: true });
  private readonly defaults = injectNumberFieldDefaults();
  private readonly appLocale = injectLocale();

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenName = inject(new HostAttributeToken('name'), { optional: true });
  private readonly writtenForm = inject(new HostAttributeToken('form'), { optional: true });
  private readonly writtenInputMode = inject(new HostAttributeToken('inputmode'), {
    optional: true,
  });
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

  /** What the family holds when nobody else owns it. */
  private readonly own = signal<number | null>(null);
  /** What the element is showing. Never a second copy of the number. */
  private readonly text = signal('');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: number | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  /**
   * One formatter, rebuilt only when the locale or the format changes. The
   * options object is read through a signal, so an inline object handed on
   * every change detection does not rebuild the parser.
   */
  private readonly formatter = computed<NumberFormat>(() => {
    const options = this.format();
    return createNumberFormat({
      locale: this.locale() ?? this.appLocale(),
      ...(options === undefined ? {} : { options }),
    });
  });

  /** Present means the consumer owns it; absent means the directive does. */
  private readonly controlled = computed(() => this.value() !== undefined);
  readonly numberValue = computed(() => {
    const bound = this.value();
    return bound === undefined ? this.own() : bound;
  });
  readonly valueText = computed(() => {
    const shown = this.text();
    return shown === '' ? null : shown;
  });

  readonly resolvedClamp = computed(() => this.clamp() ?? this.defaults.clamp);
  protected readonly resolvedFormatOn = computed(() => this.formatOn() ?? this.defaults.formatOn);
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(
    () =>
      this.readOnly() ??
      (this.writtenReadonly === null ? undefined : true) ??
      this.field?.resolvedReadOnly(),
  );
  /**
   * Unstated, the control asks the field. Under `clamp="none"` nothing returns
   * a number outside `min`…`max` to the range, so the control reports it.
   */
  private readonly outsideRange = computed(() => {
    const current = this.numberValue();
    const min = this.min();
    const max = this.max();
    return (
      this.resolvedClamp() === 'none' &&
      current !== null &&
      ((min !== undefined && current < min) || (max !== undefined && current > max))
    );
  });
  readonly resolvedInvalid = computed(
    () => this.invalid() ?? (this.outsideRange() ? true : this.field?.invalid()),
  );

  readonly controlId = computed(() => this.writtenId ?? this.field?.ids().control ?? null);
  readonly submissionName = computed(() => this.writtenName);
  readonly submissionForm = computed(() => this.writtenForm);

  private readonly parsedText = computed(() => this.formatter().parse(this.text()));
  readonly atMax = computed(() => {
    const max = this.max();
    const current = this.parsedText();
    return max !== undefined && current !== null && current >= max;
  });
  readonly atMin = computed(() => {
    const min = this.min();
    const current = this.parsedText();
    return min !== undefined && current !== null && current <= min;
  });

  /**
   * The software keyboard, derived from the props rather than from the user
   * agent. Neither numeric keypad offers a minus sign on every platform, so a
   * control that admits a negative asks for the full keyboard.
   */
  protected readonly resolvedInputMode = computed(() => {
    if (this.writtenInputMode !== null) return this.writtenInputMode;
    const min = this.min();
    if (min === undefined || min < 0) return 'text';
    return this.formatter().maximumFractionDigits > 0 ? 'decimal' : 'numeric';
  });

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

  constructor() {
    /* The element shows what the family holds, and the text is only rewritten
       when it no longer means the same number — typing `1234` must not become
       `1,234` between two keystrokes. */
    effect(() => {
      const next = this.numberValue();
      const formatter = this.formatter();
      if (Object.is(next, formatter.parse(this.text()))) return;
      this.write(formatter.format(next));
    });

    this.attachWheel();
  }

  /**
   * Angular creates every directive in a template before it binds any input, so
   * the starting value is read here rather than in the constructor: read there,
   * `defaultValue` is always its own default and the control starts empty.
   */
  ngOnInit() {
    const bound = this.value();
    const initial = bound === undefined ? this.defaultValue() : bound;
    if (bound === undefined) this.own.set(initial);
    this.write(this.formatter().format(initial));
  }

  /** The native element, for `focus()`, `select()` and `setSelectionRange()`. */
  get inputElement(): HTMLInputElement {
    return this.element;
  }

  /** Steps up by one step and reports `programmatic`. */
  increment() {
    this.move(1, this.step(), 'programmatic', undefined);
  }

  /** Steps down by one step and reports `programmatic`. */
  decrement() {
    this.move(-1, this.step(), 'programmatic', undefined);
  }

  /** What a `slNumberFieldScrub` drag calls, once per whole step travelled. */
  scrubBy(steps: number, source: PointerEvent) {
    if (steps === 0) return;
    const step = this.step();
    const amount = source.shiftKey
      ? (this.largeStep() ?? step * 10)
      : source.altKey
        ? (this.smallStep() ?? step / 10)
        : step;
    this.move(steps > 0 ? 1 : -1, amount * Math.abs(steps), 'pointer', source);
  }

  /** What the frame's two buttons call. Focus returns to the value. */
  stepBy(direction: 1 | -1, source: Event | undefined) {
    this.element.focus();
    this.move(direction, this.step(), 'pointer', source);
  }

  writeValue(value: number | null) {
    this.own.set(value ?? null);
    this.write(this.formatter().format(value ?? null));
  }

  registerOnChange(fn: (value: number | null) => void) {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.formDisabled.set(isDisabled);
  }

  protected onInput(event: Event) {
    const raw = this.element.value;
    const native = event as InputEvent;

    /* An IME commits a whole run, and a run reshaped half way through is a run
       the engine can no longer finish. The text is left alone until
       `compositionend` sends a keystroke that is not composing. */
    if (this.resolvedFormatOn() !== 'change' || native.isComposing) {
      this.text.set(raw);
      this.request(this.formatter().parse(raw), 'keyboard', undefined);
      return;
    }

    const formatter = this.formatter();
    const caret = this.element.selectionStart ?? raw.length;
    const deletion = native.inputType?.startsWith('delete') === true;
    const edited = deletion
      ? formatter.deleteAcrossSeparator(
          this.text(),
          { text: raw, caret },
          native.inputType === 'deleteContentForward' ? 1 : -1,
        )
      : { text: raw, caret };
    const shaped = formatter.formatWhileTyping(edited);

    this.write(shaped.text);
    /* Only while the reader is in the control: moving the selection of an
       element nobody is typing in scrolls it into view on some engines. */
    if (this.element.ownerDocument.activeElement === this.element) {
      this.element.setSelectionRange(shaped.caret, shaped.caret);
    }
    this.request(formatter.parse(shaped.text), 'keyboard', undefined);
  }

  /**
   * The keystroke filter. `beforeinput` is where a keystroke, a paste and a
   * drop all arrive before the element changes, and it is the only place a
   * character that cannot be part of a number can be refused without moving
   * the caret.
   */
  protected onBeforeInput(event: InputEvent) {
    if (event.defaultPrevented) return;
    /* An IME commits a whole run; refusing it character by character would
       make a full-width `１２３` untypeable. */
    if (event.isComposing) return;
    if (event.inputType.startsWith('delete')) return;

    const start = this.element.selectionStart ?? this.element.value.length;
    const finish = this.element.selectionEnd ?? this.element.value.length;
    const next =
      this.element.value.slice(0, start) + (event.data ?? '') + this.element.value.slice(finish);

    const formatter = this.formatter();
    if (!formatter.isPartial(next)) {
      event.preventDefault();
      return;
    }
    if (this.resolvedClamp() !== 'strict') return;
    const parsed = formatter.parse(next);
    if (parsed === null) return;
    const min = this.min();
    const max = this.max();
    if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
      event.preventDefault();
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (this.resolvedDisabled() === true || this.resolvedReadOnly() === true) return;

    const step = this.step();
    const large = this.largeStep() ?? step * 10;
    const small = this.smallStep() ?? step / 10;
    const amount = event.shiftKey ? large : event.altKey ? small : step;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.move(1, amount, 'keyboard', event);
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.move(-1, amount, 'keyboard', event);
        return;
      case 'PageUp':
        event.preventDefault();
        this.move(1, large, 'keyboard', event);
        return;
      case 'PageDown':
        event.preventDefault();
        this.move(-1, large, 'keyboard', event);
        return;
      case 'Home': {
        const min = this.min();
        if (min === undefined || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        this.settle(min, this.request(min, 'keyboard', event));
        return;
      }
      case 'End': {
        const max = this.max();
        if (max === undefined || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        this.settle(max, this.request(max, 'keyboard', event));
        return;
      }
      case 'Enter':
        /* Committed and not intercepted: a single-line control submits its
           form, which is the platform's behavior. */
        this.commit('keyboard', event);
        return;
      default:
    }
  }

  protected onBlur(event: FocusEvent) {
    this.onTouchedFn();
    this.commit('blur', event);
  }

  /**
   * The wheel, when it is asked for, and never otherwise. It is a native
   * listener rather than a host binding because the event has to be cancelled,
   * and a host listener on `wheel` is passive in some browsers.
   */
  private attachWheel() {
    const onWheel = (event: WheelEvent) => {
      if (!this.wheel()) return;
      if (this.resolvedDisabled() === true || this.resolvedReadOnly() === true) return;
      if (this.element.ownerDocument.activeElement !== this.element) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      this.move(event.deltaY < 0 ? 1 : -1, this.step(), 'pointer', event);
    };

    this.element.addEventListener('wheel', onWheel, { passive: false });
    inject(DestroyRef).onDestroy(() => this.element.removeEventListener('wheel', onWheel));
  }

  /** Formats what the reader typed and puts the value back in range. */
  private commit(reason: ChangeReason, source: Event | undefined) {
    const formatter = this.formatter();
    let next = formatter.parse(this.text());
    const min = this.min();
    const max = this.max();

    if (next !== null) {
      /* The number committed is the number shown: rounded to the precision
         the format states, through the same formatter. */
      next = formatter.parse(formatter.format(next)) ?? next;
      /* A typed value goes to the nearest multiple of the grid. */
      if (this.snapToStep()) next = snapToGrid(next, this.step(), min ?? 0);
      if (this.resolvedClamp() !== 'none') {
        next = clampNumber(next, min ?? Number.NEGATIVE_INFINITY, max ?? Number.POSITIVE_INFINITY);
      }
    }
    this.settle(next, this.request(next, reason, source));
  }

  private move(direction: 1 | -1, amount: number, reason: ChangeReason, source: Event | undefined) {
    const min = this.min();
    const max = this.max();
    const stepFrom = this.stepFrom();
    const next = stepNumber({
      value: this.formatter().parse(this.text()),
      direction,
      step: amount,
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(stepFrom === undefined ? {} : { stepFrom }),
      snapToStep: this.snapToStep(),
    });
    this.settle(next, this.request(next, reason, source));
  }

  /**
   * Asks to move, and says whether anything did. A refused request answers
   * `false`, and the caller uses that to decide what the element shows: a
   * control that wrote the new number into the text regardless would show a
   * value the consumer never accepted.
   */
  private request(next: number | null, reason: ChangeReason, source: Event | undefined): boolean {
    const current = this.numberValue();
    if (Object.is(next, current)) return false;

    let cancelled = false;
    const state = createControllable<number | null>({
      controlled: undefined,
      initial: current,
      onRequest: (pending) => {
        this.valueChange.emit(pending);
        cancelled = pending.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return false;

    this.onChangeFn(next);
    /* A controlled control never moves its own number: it asks, and waits for
       the consumer's next value. */
    if (this.controlled()) return false;
    this.own.set(next);
    return true;
  }

  private settle(next: number | null, moved: boolean) {
    const shown = moved ? next : this.numberValue();
    this.write(this.formatter().format(shown));
  }

  /** One place the element's text is written, so the signal never drifts from it. */
  private write(value: string) {
    if (this.element.value !== value) this.element.value = value;
    this.text.set(value);
  }
}
