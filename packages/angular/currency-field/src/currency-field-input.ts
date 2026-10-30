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
import {
  amountFromUnit,
  createCurrencyFormat,
  currencyAffix,
  MAX_AMOUNT_DIGITS,
  requestInUnit,
  withAmount,
} from '@slotted/core/currency';
import type {
  CurrencyAffix,
  CurrencyChangeRequest,
  CurrencyFormat,
  CurrencyUnit,
} from '@slotted/core/currency';
import { clamp as clampNumber } from '@slotted/core/measure';
import { stepNumber } from '@slotted/core/number';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { SlField } from '@slotted/angular/field';
import { injectLocale } from '@slotted/angular/i18n';

import { injectCurrencyFieldDefaults, SlCurrencyFieldControl } from './currency-field-defaults';
import type {
  CurrencyFieldClamp,
  CurrencyFieldDisplay,
  CurrencyFieldEntry,
  CurrencyFieldFormatOn,
} from './currency-field-defaults';
import { SlCurrencyField } from './currency-field';

/** `undefined` stays absent; anything else becomes a number. */
const optionalNumber = (value: unknown) =>
  value === undefined || value === null || value === '' ? undefined : numberAttribute(value);

/** The two keys that set the sign under cents-first entry. */
const SIGN_KEYS = new Set(['-', '−', '+', '(']);

/**
 * The control itself: the amount, the currency, the identifier, and everything
 * the field around it says.
 *
 * **The element is `type="text"` and carries the APG's `spinbutton` role.**
 * `type="number"` empties itself whenever the text is not a valid
 * floating-point number, so no grouping separator and no currency symbol
 * survives it.
 *
 * **Under `entry="cents"` the digits are the amount.** After every edit the
 * directive reads the digits out of the text and divides by the currency's
 * minor units, so `1234` is `R$ 12,34`. The text is generated rather than
 * typed, which is why rewriting it on every keystroke is legal here and
 * forbidden in `number-field`: there is no typed text to protect, and the caret
 * has exactly one legal position.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`. A value the consumer wrote as a static
 * attribute is read before the host binding computes.
 */
@Directive({
  selector: 'input[slCurrencyFieldInput]',
  standalone: true,
  exportAs: 'slCurrencyFieldInput',
  providers: [
    { provide: SlCurrencyFieldControl, useExisting: forwardRef(() => SlCurrencyFieldInput) },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlCurrencyFieldInput),
      multi: true,
    },
  ],
  host: {
    'data-part': 'input',
    'data-part-input': '',
    autocorrect: 'off',
    spellcheck: 'false',
    /* Bound rather than static, so a consumer who wrote `type="number"` on a
       currency field does not get the element that empties its own value. */
    '[attr.type]': "'text'",
    '[attr.role]': "'spinbutton'",
    '[attr.id]': 'controlId()',
    '[attr.inputmode]': 'resolvedInputMode()',
    '[attr.autocomplete]': 'resolvedAutocomplete()',
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
export class SlCurrencyFieldInput implements ControlValueAccessor, OnInit, SlCurrencyFieldControl {
  /**
   * An ISO 4217 code. It decides the symbol, the minor units and therefore how
   * far a digit shifts. Required here or on the token: a field that guessed two
   * minor digits would write `¥12,34`.
   */
  readonly currency = input<string | undefined>(undefined);
  /** How the currency is written beside the amount. Defaults to the token, then `symbol`. */
  readonly currencyDisplay = input<CurrencyFieldDisplay | undefined>(undefined);
  /** Overrides the currency's own minor units, for a unit price quoted finer. */
  readonly fractionDigits = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  });

  /**
   * Present means the consumer owns the amount, for the life of the component.
   * `null` is empty, and `undefined` is the absence that makes the control
   * uncontrolled — the two are different answers.
   */
  readonly valueInUnit = input<number | null | undefined, unknown>(undefined, {
    alias: 'value',
    transform: (raw) => (raw === undefined ? undefined : (optionalNumber(raw) ?? null)),
  });
  /** The amount the control starts from when nobody else writes one, in `unit`. */
  readonly defaultValueInUnit = input<number | null, unknown>(null, {
    alias: 'defaultValue',
    transform: (raw) => (raw === undefined ? null : (optionalNumber(raw) ?? null)),
  });
  /**
   * The unit `value`, `defaultValue`, `min`, `max`, the steps, `stepFrom`,
   * `valueChange`, the form model and the submitted amount are in. `major` is
   * `12.34`; `minor` is the integer `1234` of the currency's minor unit, which
   * `fractionDigits` decides when set. Entry, format and appearance do not
   * change. Defaults to the token, then `major`.
   */
  readonly unit = input<CurrencyUnit | undefined>(undefined);

  /** How the reader types. Defaults to the token, then `cents`. */
  readonly entry = input<CurrencyFieldEntry | undefined>(undefined);
  /**
   * When the text takes the locale's shape under `entry="natural"`. Defaults to
   * the token, then `change`. Cents-first entry generates the text after every
   * edit, so it decides nothing there.
   */
  readonly formatOn = input<CurrencyFieldFormatOn | undefined>(undefined);

  /** The smallest amount, in `unit`. */
  readonly minInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'min',
    transform: optionalNumber,
  });
  /** The largest amount, in `unit`. */
  readonly maxInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'max',
    transform: optionalNumber,
  });
  /** What the arrows and the two buttons move by, in `unit`. One major unit by default. */
  readonly stepInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'step',
    transform: optionalNumber,
  });
  /** The amount `Shift` and the page keys move by. Defaults to `step * 10`. */
  readonly largeStepInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'largeStep',
    transform: optionalNumber,
  });
  /** The amount `Alt` moves by. Defaults to `step / 10`. */
  readonly smallStepInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'smallStep',
    transform: optionalNumber,
  });
  /** Where an empty control starts stepping from. Defaults to `min`, then nought. */
  readonly stepFromInUnit = input<number | undefined, unknown>(undefined, {
    alias: 'stepFrom',
    transform: optionalNumber,
  });
  /** Where an amount outside the range goes, and when. Defaults to the token, then `blur`. */
  readonly clamp = input<CurrencyFieldClamp | undefined>(undefined);
  /** Any other `Intl.NumberFormatOptions`. Every key here wins over the family's own. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);
  /**
   * BCP 47. Decides the separators and the numbering system, never the symbol.
   * Defaults to the language in force (`provideSlotted`).
   */
  readonly locale = input<string | undefined>(undefined);
  /**
   * Lets the wheel move the amount while the control has focus. Off by default:
   * a reader scrolling a form must not change a total by passing over it.
   */
  readonly wheel = input(false, { transform: booleanAttribute });
  /**
   * Whether an emptied control holds nothing, or nought.
   *
   * Off, because an amount is not an optional number: a total, a price and a
   * balance are all nought when nothing is in them. Cleared, the control shows
   * `0,00` and emits `0`. On, it can be left empty and emits `null`.
   */
  readonly allowEmpty = input(false, { transform: booleanAttribute });

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
   * One output for one transition, carrying the amount, the amount it replaces,
   * the currency, the exact integer of minor units, the reason, the originating
   * event and `cancel()`. There is no `[(value)]`, because a two-way binding has
   * one slot and can carry none of those.
   */
  readonly valueChange = output<CurrencyChangeRequest>();

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  /**
   * The frame around the control. Injected without `optional`, so an `input`
   * written without it fails at construction rather than silently losing its
   * border and its ring.
   */
  readonly currencyField = inject(SlCurrencyField);
  private readonly field = inject(SlField, { optional: true });
  private readonly defaults = injectCurrencyFieldDefaults();
  private readonly appLocale = injectLocale();

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenName = inject(new HostAttributeToken('name'), { optional: true });
  private readonly writtenForm = inject(new HostAttributeToken('form'), { optional: true });
  private readonly writtenInputMode = inject(new HostAttributeToken('inputmode'), {
    optional: true,
  });
  private readonly writtenAutocomplete = inject(new HostAttributeToken('autocomplete'), {
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
  /** What the element is showing. Never a second copy of the amount. */
  private readonly text = signal('');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  /**
   * The sign, while the field holds nothing to carry it. Typing `-` into an
   * empty amount and then a digit produces a debit, which a sign derived from
   * the text alone could not express.
   */
  private pendingNegative = false;
  private onChangeFn: (value: number | null) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  /**
   * One formatter, rebuilt only when something it reads actually changes. The
   * options object is read through a signal, so an inline object handed on
   * every change detection does not rebuild the parser.
   */
  /**
   * At the display appearance the mark is drawn apart from the digits, so the
   * frame can mute it at a smaller step: the text carries the amount alone,
   * and the mark stands on the side the locale writes it on.
   */
  readonly affix = computed<CurrencyAffix | null>(() => {
    const currency = this.currency() ?? this.defaults.currency;
    if (currency === undefined || this.currencyField.resolvedAppearance() !== 'display')
      return null;
    return currencyAffix({
      currency,
      currencyDisplay: this.currencyDisplay() ?? this.defaults.currencyDisplay,
      locale: this.locale() ?? this.appLocale(),
    });
  });

  private readonly formatter = computed<CurrencyFormat>(() => {
    const currency = this.currency() ?? this.defaults.currency;
    if (currency === undefined) {
      /* Loudly, and where it is written: a currency field cannot decide how
         many digits a cent has, and one that guessed two would write ¥12,34. */
      throw new Error(
        'slCurrencyFieldInput needs a currency: set [currency], or provideCurrencyFieldDefaults({ currency }).',
      );
    }
    const fractionDigits = this.fractionDigits();
    const options = this.format();
    return createCurrencyFormat({
      currency,
      currencyDisplay:
        this.affix() === null ? (this.currencyDisplay() ?? this.defaults.currencyDisplay) : 'none',
      locale: this.locale() ?? this.appLocale(),
      ...(fractionDigits === undefined ? {} : { fractionDigits }),
      ...(options === undefined ? {} : { options }),
    });
  });

  readonly resolvedUnit = computed(() => this.unit() ?? this.defaults.unit);
  /* Everything below computes in major units; `unit` is converted here, on the way in. */
  private inMajor<T extends number | null | undefined>(amount: T): T {
    return this.resolvedUnit() === 'minor'
      ? amountFromUnit(amount, 'minor', this.formatter())
      : amount;
  }
  /** On the way out. */
  private inUnit(amount: number | null): number | null {
    return this.resolvedUnit() === 'minor' ? this.formatter().toMinorUnits(amount) : amount;
  }
  readonly value = computed(() => this.inMajor(this.valueInUnit()));
  readonly defaultValue = computed(() => this.inMajor(this.defaultValueInUnit()));
  readonly min = computed(() => this.inMajor(this.minInUnit()));
  readonly max = computed(() => this.inMajor(this.maxInUnit()));
  readonly step = computed(() => {
    const step = this.stepInUnit();
    return step === undefined ? 1 : this.inMajor(step);
  });
  readonly largeStep = computed(() => this.inMajor(this.largeStepInUnit()));
  readonly smallStep = computed(() => this.inMajor(this.smallStepInUnit()));
  readonly stepFrom = computed(() => this.inMajor(this.stepFromInUnit()));

  /** Present means the consumer owns it; absent means the directive does. */
  private readonly controlled = computed(() => this.value() !== undefined);
  readonly numberValue = computed(() => {
    const bound = this.value();
    const held = bound === undefined ? this.own() : bound;
    /* The amount the family settles on when nothing is left in the control.
       It governs what is emitted, what `aria-valuenow` reports and what the
       hidden input submits alike, so the three never disagree. */
    return this.allowEmpty() ? held : (held ?? 0);
  });
  readonly submittedValue = computed(() => this.inUnit(this.numberValue()));
  readonly valueText = computed(() => {
    const shown = this.text();
    if (shown === '') return null;
    const affix = this.affix();
    if (affix === null) return shown;
    return affix.position === 'start' ? `${affix.text} ${shown}` : `${shown} ${affix.text}`;
  });

  readonly resolvedEntry = computed(() => this.entry() ?? this.defaults.entry);
  protected readonly resolvedFormatOn = computed(() => this.formatOn() ?? this.defaults.formatOn);
  readonly resolvedClamp = computed(() => this.clamp() ?? this.defaults.clamp);
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

  /** Whether the range admits a debit at all. There is no `allowNegative`. */
  private readonly allowNegative = computed(() => {
    const min = this.min();
    return min === undefined || min < 0;
  });

  /**
   * The software keyboard, derived from the props rather than from the user
   * agent. Cents-first entry types neither a separator nor a sign into the
   * digits, so the numeric keypad is complete for the task.
   */
  protected readonly resolvedInputMode = computed(() => {
    if (this.writtenInputMode !== null) return this.writtenInputMode;
    if (this.resolvedEntry() === 'cents') return 'numeric';
    if (this.allowNegative()) return 'text';
    return this.formatter().maximumFractionDigits > 0 ? 'decimal' : 'numeric';
  });

  /**
   * `transaction-amount` is the token a payment amount belongs to, and the
   * default is `off`: most amounts in a back office are not payment amounts,
   * and a browser filling an invoice total is worse than no help at all.
   */
  protected readonly resolvedAutocomplete = computed(() => this.writtenAutocomplete ?? 'off');

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
       when it no longer means the same amount. */
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
   * the starting amount is read here rather than in the constructor: read
   * there, `defaultValue` is always its own default and the control starts
   * empty.
   */
  ngOnInit() {
    const bound = this.value();
    const initial = bound === undefined ? this.defaultValue() : bound;
    if (bound === undefined) this.own.set(initial);
    this.write(this.formatter().format(this.numberValue()));
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

  /** What a `slCurrencyFieldScrub` drag calls, once per whole step travelled. */
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

  /** What the frame's two buttons call. Focus returns to the amount. */
  stepBy(direction: 1 | -1, source: Event | undefined) {
    this.element.focus();
    this.move(direction, this.step(), 'pointer', source);
  }

  writeValue(value: number | null) {
    const amount = this.inMajor(value ?? null);
    this.own.set(amount);
    this.write(this.formatter().format(this.settledAmount(amount)));
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
    const next = this.element.value;
    const formatter = this.formatter();

    if (this.resolvedEntry() !== 'cents') {
      const native = event as InputEvent;
      /* An IME commits a whole run, and a run reshaped half way through is a
         run the engine can no longer finish. */
      if (this.resolvedFormatOn() !== 'change' || native.isComposing) {
        this.text.set(next);
        this.request(this.settledAmount(formatter.parse(next)), 'keyboard', event);
        return;
      }

      const caret = this.element.selectionStart ?? next.length;
      const deletion = native.inputType?.startsWith('delete') === true;
      const edited = deletion
        ? formatter.deleteAcrossSeparator(
            this.text(),
            { text: next, caret },
            native.inputType === 'deleteContentForward' ? 1 : -1,
          )
        : { text: next, caret };
      const shaped = formatter.formatWhileTyping(edited);

      this.write(shaped.text);
      /* `write` puts the caret after the last digit under cents-first entry and
         leaves it alone otherwise, so this is the only place it moves here. */
      if (this.element.ownerDocument.activeElement === this.element) {
        this.element.setSelectionRange(shaped.caret, shaped.caret);
      }
      this.request(this.settledAmount(formatter.parse(shaped.text)), 'keyboard', event);
      return;
    }

    const inputType = (event as InputEvent).inputType;
    const edit = formatter.editFromText({
      text: next,
      /* What the element showed before this keystroke, which is what turns the
         digits the reader added into digits at the right rather than digits
         where the caret happened to be. */
      previous: this.text(),
      negative: this.negativeNow(),
      allowNegative: this.allowNegative(),
      allowEmpty: this.allowEmpty(),
      ...(inputType === undefined ? {} : { inputType }),
    });
    this.pendingNegative = edit.value !== null && edit.value < 0;
    this.settle(edit.value, this.request(edit.value, 'keyboard', event, edit.minorUnits));
  }

  /**
   * The keystroke filter. `beforeinput` is where a keystroke, a paste and a
   * drop all arrive before the element changes, and it is the only place a
   * character that cannot be part of an amount can be refused without moving
   * the caret.
   */
  protected onBeforeInput(event: InputEvent) {
    if (event.defaultPrevented) return;
    /* An IME commits a whole run; refusing it character by character would
       make a full-width `１２３` untypeable. */
    if (event.isComposing) return;
    if (event.inputType.startsWith('delete')) return;
    /* A paste is parsed rather than filtered: it is the reader's own amount. */
    if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') return;

    const formatter = this.formatter();
    const start = this.element.selectionStart ?? this.element.value.length;
    const finish = this.element.selectionEnd ?? this.element.value.length;
    const inserted = event.data ?? '';
    const next = this.element.value.slice(0, start) + inserted + this.element.value.slice(finish);
    const min = this.min();
    const max = this.max();

    if (this.resolvedEntry() !== 'cents') {
      if (!formatter.isPartial(next)) {
        event.preventDefault();
        return;
      }
      if (this.resolvedClamp() !== 'strict') return;
      const parsed = formatter.parse(next);
      if (parsed === null) return;
      if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
        event.preventDefault();
      }
      return;
    }

    /* The sign is a key rather than a digit, so `-` pressed twice does not
       produce two signs and never enters the digit run. */
    if (SIGN_KEYS.has(inserted)) {
      event.preventDefault();
      if (!this.allowNegative()) return;
      const wanted = inserted !== '+';
      this.pendingNegative = wanted;
      const current = this.numberValue();
      if (current === null || current === 0 || current < 0 === wanted) return;
      const flipped = -current;
      this.settle(
        flipped,
        this.request(flipped, 'keyboard', event, formatter.toMinorUnits(flipped)),
      );
      return;
    }

    if (formatter.digitsOf(inserted).length !== [...inserted].length) {
      event.preventDefault();
      return;
    }
    /* Fifteen digits is where a double stops holding a cent, so the text stops
       growing rather than rounding silently. */
    if (formatter.digitsOf(next).length > MAX_AMOUNT_DIGITS) {
      event.preventDefault();
      return;
    }
    if (this.resolvedClamp() !== 'strict') return;
    const edit = formatter.editFromText({
      text: next,
      previous: this.element.value,
      negative: this.negativeNow(),
      allowNegative: this.allowNegative(),
      allowEmpty: this.allowEmpty(),
    });
    if (edit.value === null) return;
    if ((min !== undefined && edit.value < min) || (max !== undefined && edit.value > max)) {
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

  /** The sign at the moment of the edit, rather than at the last render. */
  private negativeNow() {
    const current = this.numberValue();
    /* Nought has no sign — `-0` and `0` are one amount — so a debit held
       against an empty or nought amount can only come from the key. */
    return current === null || current === 0 ? this.pendingNegative : current < 0;
  }

  /** Formats what the reader typed and puts the amount back in range. */
  private commit(reason: ChangeReason, source: Event | undefined) {
    const formatter = this.formatter();
    let next = formatter.parse(this.text());
    /* The commit is where a half-typed amount stops being half typed, so it is
       where an emptied one becomes the nought it means. */
    if (next === null && !this.allowEmpty()) next = 0;

    if (next !== null && this.resolvedClamp() !== 'none') {
      next = clampNumber(
        next,
        this.min() ?? Number.NEGATIVE_INFINITY,
        this.max() ?? Number.POSITIVE_INFINITY,
      );
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
    });
    this.settle(next, this.request(next, reason, source));
  }

  /**
   * Asks to move, and says whether anything did. A refused request answers
   * `false`, and the caller uses that to decide what the element shows.
   */
  private request(
    next: number | null,
    reason: ChangeReason,
    source: Event | undefined,
    minorUnits?: number | null,
  ): boolean {
    const formatter = this.formatter();
    const current = this.numberValue();
    if (Object.is(next, current)) return false;

    let cancelled = false;
    const state = createControllable<number | null>({
      controlled: undefined,
      initial: current,
      onRequest: (pending) => {
        this.valueChange.emit(
          requestInUnit(
            withAmount(pending, formatter.currency, minorUnits ?? formatter.toMinorUnits(next)),
            this.resolvedUnit(),
            formatter,
          ),
        );
        cancelled = pending.cancelled;
      },
    });
    state.request(next, reason, source);
    if (cancelled) return false;

    this.onChangeFn(this.inUnit(next));
    /* A controlled control never moves its own amount: it asks, and waits for
       the consumer's next value. */
    if (this.controlled()) return false;
    this.own.set(next);
    return true;
  }

  /** Nothing, or the nought it means. The one rule `allowEmpty` decides. */
  private settledAmount(amount: number | null) {
    return this.allowEmpty() ? amount : (amount ?? 0);
  }

  private settle(next: number | null, moved: boolean) {
    const shown = moved ? next : this.numberValue();
    this.write(this.formatter().format(shown));
  }

  /**
   * One place the element's text is written, so the signal never drifts from
   * it. Under cents-first entry the caret goes back after the last digit —
   * before whatever affix the locale writes at the end — because that is the
   * only position where the next keystroke means anything.
   */
  private write(value: string) {
    if (this.element.value !== value) this.element.value = value;
    this.text.set(value);

    if (this.resolvedEntry() !== 'cents') return;
    if (this.element.ownerDocument.activeElement !== this.element) return;

    const formatter = this.formatter();
    let position = value.length;
    for (let index = value.length; index > 0; index -= 1) {
      if (formatter.digitsOf(value[index - 1] ?? '') !== '') {
        position = index;
        break;
      }
    }
    this.element.setSelectionRange(position, position);
  }
}
