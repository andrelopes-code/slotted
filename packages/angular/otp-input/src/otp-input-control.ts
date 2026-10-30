import { normalizeSelection, sanitize } from '@slotted/core/otp';
import type { OtpSelection, OtpType } from '@slotted/core/otp';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
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
  output,
  signal,
} from '@angular/core';
import type { OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { SlField } from '@slotted/angular/field';

import { injectOtpInputDefaults, SlOtpInputState } from './otp-input-defaults';
import { SlOtpInput } from './otp-input';

/** What an edit lost to the filter, and the event that carried it. */
export interface OtpInputRejection {
  readonly text: string;
  readonly source: Event;
}

/**
 * The control itself: the value, the identifier, and everything the field
 * around it says. `dragstart` is refused: a press on a selected character
 * would otherwise drag that text, with a ghost of the character floating
 * under the pointer, and in a full code a character is selected at every
 * press.
 *
 * **The element owns the characters, and the directive keeps a copy.** The
 * frame paints every character, so unlike `text-field` this mirror is the
 * value and not only its length. `writeValue` from a form and a `[value]`
 * binding both write the element; typing writes it directly, and the copy
 * follows — which is what Angular's own `DefaultValueAccessor` does.
 *
 * **The selection is normalised, not the keys.** Every key is the browser's.
 * After each change the directive makes sure a cursor inside the value has
 * one character selected, so typing replaces it instead of being refused by
 * `maxlength` — the rule `@slotted/core/otp` holds.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default
 * to `undefined` rather than `false`. A value the consumer wrote as a static
 * attribute is read before the host binding computes, so the binding never
 * writes over it.
 */
@Directive({
  selector: 'input[slOtpInputControl]',
  standalone: true,
  exportAs: 'slOtpInputControl',
  providers: [
    { provide: SlOtpInputState, useExisting: forwardRef(() => SlOtpInputControl) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SlOtpInputControl), multi: true },
  ],
  host: {
    'data-part': 'input',
    'data-part-input': '',
    '[attr.id]': 'controlId()',
    '[attr.type]': 'resolvedType()',
    '[attr.autocomplete]': 'resolvedAutocomplete()',
    '[attr.inputmode]': 'resolvedInputMode()',
    '[attr.maxlength]': 'frame.resolvedLength()',
    '[attr.spellcheck]': 'resolvedSpellcheck()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.disabled]': 'disabledAttribute()',
    '[attr.readonly]': 'readonlyAttribute()',
    '(input)': 'onInput($event)',
    '(dragstart)': '$event.preventDefault()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class SlOtpInputControl implements ControlValueAccessor, OnInit, SlOtpInputState {
  /** Present means the consumer owns the value. */
  readonly value = input<string | undefined>(undefined);
  /** The value the control starts from when nobody else writes one. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Which characters the code takes. Defaults to the token's, then `numeric`. */
  readonly type = input<OtpType | undefined>(undefined);
  /** Tested against each character; outranks `type` in what is accepted. */
  readonly pattern = input<RegExp | undefined>(undefined);
  /**
   * Run over every edit before the filter: strip a `G-` prefix, uppercase a
   * code the reader typed in lowercase.
   */
  readonly transform = input<((text: string) => string) | undefined>(undefined);
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
  /** Submits the owning form when the code is complete. */
  readonly autoSubmit = input(false, { transform: booleanAttribute });
  /**
   * Asks the platform for the code the moment an SMS arrives, where the
   * WebOTP API exists. The request is abandoned when the form submits or the
   * control is destroyed.
   */
  readonly webOtp = input(false, { transform: booleanAttribute });

  /**
   * One output for one transition, carrying the value, the value it replaces,
   * the reason, the originating event and `cancel()`. There is no `[(value)]`,
   * because a two-way binding has one slot and can carry none of those; a form
   * gets the same movement through `ControlValueAccessor`.
   */
  readonly valueChange = output<ChangeRequest<string>>();
  /** The value, the moment it reaches `length` characters. */
  readonly complete = output<string>();
  /** What an edit lost to the filter, before the value moves. */
  readonly rejected = output<OtpInputRejection>();

  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  /**
   * The frame around the control. Injected without `optional`, so an `input`
   * written without it fails at construction rather than silently losing its
   * boxes. It is public because the host bindings read its length and mask.
   */
  readonly frame = inject(SlOtpInput);
  private readonly field = inject(SlField, { optional: true });
  private readonly defaults = injectOtpInputDefaults();

  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenType = inject(new HostAttributeToken('type'), { optional: true });
  private readonly writtenAutocomplete = inject(new HostAttributeToken('autocomplete'), {
    optional: true,
  });
  private readonly writtenInputMode = inject(new HostAttributeToken('inputmode'), {
    optional: true,
  });
  private readonly writtenSpellcheck = inject(new HostAttributeToken('spellcheck'), {
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

  /** What the element is showing, cut to the code. */
  private readonly mirror = signal('');
  readonly code = this.mirror.asReadonly();
  private readonly ownSelection = signal<OtpSelection | null>(null);
  readonly selection = this.ownSelection.asReadonly();
  private readonly ownFocused = signal(false);
  readonly focused = this.ownFocused.asReadonly();
  private previousSelection: OtpSelection | null = null;
  private reported: string | null = null;
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  readonly resolvedType = computed(() =>
    this.frame.mask() ? 'password' : (this.writtenType ?? 'text'),
  );
  /** Which characters the code takes, stated here or by the token. */
  readonly codeType = computed<OtpType>(() => this.type() ?? this.defaults.type);
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
  protected readonly resolvedAutocomplete = computed(
    () => this.writtenAutocomplete ?? 'one-time-code',
  );
  protected readonly resolvedInputMode = computed(
    () => this.writtenInputMode ?? (this.codeType() === 'numeric' ? 'numeric' : 'text'),
  );
  protected readonly resolvedSpellcheck = computed(() => this.writtenSpellcheck ?? 'false');
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

  constructor() {
    /* A consumer's own value writes the element, the way a form's does. */
    effect(() => {
      const next = this.value();
      if (next === undefined) return;
      const clean = this.sanitize(next).value;
      if (clean === this.element.value) return;
      this.element.value = clean;
      this.mirror.set(clean);
      this.reportCompletion();
    });

    /**
     * The browser fires `selectionchange` on the document, for every control
     * at once; it is read only while this one holds focus. `capture` because
     * the event does not bubble in every engine.
     */
    const onSelectionChange = () => {
      if (this.ownFocused() && document.activeElement === this.element) this.syncSelection();
    };
    document.addEventListener('selectionchange', onSelectionChange, { capture: true });
    this.destroyRef.onDestroy(() =>
      document.removeEventListener('selectionchange', onSelectionChange, { capture: true }),
    );
  }

  /**
   * Angular creates every directive in a template before it binds any input,
   * so the starting value is read here rather than in the constructor.
   */
  ngOnInit() {
    const initial = this.sanitize(this.defaultValue() ?? this.element.value).value;
    if (initial !== this.element.value) this.element.value = initial;
    this.mirror.set(initial);
    this.reportCompletion();

    /**
     * A native reset restores the element's own value and tells nothing, so
     * the copy would keep painting the last thing typed.
     */
    const form = this.element.form;
    if (form !== null) {
      const onReset = () => {
        /* The element is restored after the event; the copy follows it. */
        queueMicrotask(() => this.mirror.set(this.sanitize(this.element.value).value));
      };
      form.addEventListener('reset', onReset);
      this.destroyRef.onDestroy(() => form.removeEventListener('reset', onReset));
    }

    if (this.webOtp()) this.requestWebOtp();
  }

  /** The native element, for `focus()`, `select()` and `setSelectionRange()`. */
  get inputElement(): HTMLInputElement {
    return this.element;
  }

  writeValue(value: string | null | undefined) {
    const clean = this.sanitize(value ?? '').value;
    this.element.value = clean;
    this.mirror.set(clean);
    this.reportCompletion();
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

  pressAt(index: number) {
    const at = Math.min(index, this.element.value.length);
    this.element.focus();
    const end = at < this.element.value.length ? at + 1 : at;
    this.previousSelection = null;
    this.element.setSelectionRange(at, end);
    this.syncSelection();
  }

  protected onInput(event: Event) {
    const element = this.element;
    const { rejected, value: next } = this.sanitize(element.value);
    if (rejected !== '') this.rejected.emit({ text: rejected, source: event });
    if (next !== element.value) {
      /* What the filter dropped is taken out of the element, and the cursor
         goes where the accepted characters end. */
      const caret = Math.min(element.selectionStart ?? next.length, next.length);
      element.value = next;
      element.setSelectionRange(caret, caret);
    }
    /* After an edit the cursor is inserting: the next selection reads as one
       that came from a caret, not from a selected character. */
    const caret = element.selectionStart ?? next.length;
    this.previousSelection = { start: caret, end: caret };

    if (this.request(next, 'keyboard', event)) {
      this.mirror.set(next);
      this.onChangeFn(next);
      this.reportCompletion();
    } else {
      /* Refused: the element goes back to what the copy holds. */
      element.value = this.mirror();
    }
    this.syncSelection();
  }

  protected onFocus() {
    this.ownFocused.set(true);
    /* Focus lands after the last character, or on it when the code is full. */
    const at = this.element.value.length;
    this.element.setSelectionRange(Math.min(at, this.frame.resolvedLength() - 1), at);
    this.previousSelection = null;
    this.syncSelection();
  }

  protected onBlur() {
    this.ownFocused.set(false);
    this.ownSelection.set(null);
    this.previousSelection = null;
    this.onTouchedFn();
  }

  private sanitize(text: string) {
    return sanitize(text, {
      length: this.frame.resolvedLength(),
      pattern: this.pattern(),
      transform: this.transform(),
      type: this.codeType(),
    });
  }

  /** Reads the element's selection, corrects it, and paints the current box. */
  private syncSelection() {
    const element = this.element;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const corrected = normalizeSelection({
      start,
      end,
      valueLength: element.value.length,
      length: this.frame.resolvedLength(),
      previous: this.previousSelection ?? undefined,
    });
    if (corrected !== null) {
      element.setSelectionRange(corrected.start, corrected.end, corrected.direction);
    }
    const final: OtpSelection = corrected ?? { start, end };
    this.previousSelection = final;
    this.ownSelection.set(final);
  }

  /**
   * Completion is a fact about the value, reported once per value: a full
   * code edited into another full code reports again, and a code emptied and
   * retyped reports again.
   */
  private reportCompletion() {
    const code = this.mirror();
    if (code.length !== this.frame.resolvedLength()) {
      this.reported = null;
      return;
    }
    if (this.reported === code) return;
    this.reported = code;
    this.complete.emit(code);
    if (this.autoSubmit()) this.element.form?.requestSubmit();
  }

  /**
   * The WebOTP API: where it exists, the platform hands over the code the
   * moment the SMS arrives. Abandoned when the form submits on its own or the
   * directive is destroyed, which is the shape MDN's example takes.
   */
  private requestWebOtp() {
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;
    const controller = new AbortController();
    const form = this.element.form;
    const abort = () => controller.abort();
    form?.addEventListener('submit', abort);
    this.destroyRef.onDestroy(() => {
      form?.removeEventListener('submit', abort);
      controller.abort();
    });
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: controller.signal } as CredentialRequestOptions)
      .then((credential) => {
        const code = (credential as { code?: string } | null)?.code;
        if (code === undefined) return;
        const next = this.sanitize(code).value;
        if (!this.request(next, 'programmatic', credential)) return;
        this.element.value = next;
        this.mirror.set(next);
        this.onChangeFn(next);
        this.reportCompletion();
      })
      .catch(() => undefined);
  }

  /** Emits the request and says whether anything may commit. */
  private request(next: string, reason: ChangeReason, source: unknown): boolean {
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
