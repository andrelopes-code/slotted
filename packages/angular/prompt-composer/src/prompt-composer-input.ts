import {
  booleanAttribute,
  computed,
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
import { SlField } from '@slotted/angular/field';
import { appendPhrase } from '@slotted/core/dictation';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';

import { SlPromptComposer } from './prompt-composer';
import { SlPromptComposerControl } from './prompt-composer-defaults';

/**
 * The value. Enter sends unless the composer's `submitOn` is `mod-enter`;
 * Mod+Enter always sends; Shift+Enter is the platform's line break; nothing is
 * sent while an input method is composing, because there Enter confirms the
 * composition. Files pasted with or without text go to the composer's
 * `attach`.
 *
 * The element owns the characters, as in `text-field`: a form's `writeValue`
 * and a `[value]` binding write the element, and the directive keeps a mirror
 * for the send and the count.
 */
@Directive({
  selector: 'textarea[slPromptComposerInput]',
  standalone: true,
  exportAs: 'slPromptComposerInput',
  providers: [
    { provide: SlPromptComposerControl, useExisting: forwardRef(() => SlPromptComposerInput) },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlPromptComposerInput),
      multi: true,
    },
  ],
  host: {
    'data-part': 'input',
    'data-part-input': '',
    '[attr.id]': 'controlId()',
    '[attr.dir]': "writtenDir ?? 'auto'",
    '[attr.rows]': 'rows()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "resolvedInvalid() === true ? 'true' : null",
    '[attr.aria-required]': "field?.required() === true ? 'true' : null",
    '[attr.disabled]': "resolvedDisabled() === true ? '' : null",
    '[attr.readonly]': "resolvedReadOnly() === true ? '' : null",
    '[style.--slotted-prompt-composer-rows]': 'rows()',
    '[style.--slotted-prompt-composer-max-rows]': 'maxRows() ?? null',
    '(input)': 'onInput($event)',
    '(keydown)': 'onKeyDown($event)',
    '(paste)': 'onPaste($event)',
    '(blur)': 'onTouchedFn()',
  },
})
export class SlPromptComposerInput
  implements ControlValueAccessor, OnInit, SlPromptComposerControl
{
  /** Present means the consumer owns the value. */
  readonly value = input<string | undefined>(undefined);
  readonly defaultValue = input<string | undefined>(undefined);
  readonly disabled = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  readonly readOnly = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  readonly invalid = input<boolean | undefined, boolean | string | undefined>(undefined, {
    transform: (value: boolean | string | undefined) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  /** The fewest lines the value shows. */
  readonly rows = input(1, { transform: numberAttribute });
  /** The most lines it grows to before it scrolls. */
  readonly maxRows = input<number | undefined, unknown>(undefined, {
    transform: (value) => (value == null ? undefined : numberAttribute(value)),
  });
  /** Publishes the length of the value to the field, which draws the count. */
  readonly showCount = input(false, { transform: booleanAttribute });

  /** Before the value moves: `keyboard` for an edit, `submit` for the clearing after a send. */
  readonly valueChange = output<ChangeRequest<string>>();

  private readonly element: HTMLTextAreaElement = inject(ElementRef).nativeElement;
  private readonly composer = inject(SlPromptComposer);
  protected readonly field = inject(SlField, { optional: true });
  protected readonly writtenDir = inject(new HostAttributeToken('dir'), { optional: true });
  private readonly writtenId = inject(new HostAttributeToken('id'), { optional: true });
  private readonly writtenMaxLength = inject(new HostAttributeToken('maxlength'), {
    optional: true,
  });

  private readonly mirror = signal('');
  private readonly formDisabled = signal<boolean | undefined>(undefined);
  private onChangeFn: (value: string) => void = () => undefined;
  protected onTouchedFn: () => void = () => undefined;

  readonly current = this.mirror.asReadonly();
  readonly resolvedDisabled = computed(
    () => this.disabled() ?? this.formDisabled() ?? this.field?.resolvedDisabled(),
  );
  readonly resolvedReadOnly = computed(() => this.readOnly() ?? this.field?.resolvedReadOnly());
  readonly resolvedInvalid = computed(() => this.invalid() ?? this.field?.invalid());

  protected readonly controlId = computed(
    () => this.writtenId ?? this.field?.ids().control ?? null,
  );
  protected readonly describedBy = computed(() => this.field?.describedBy() || null);

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
      const max = this.writtenMaxLength === null ? undefined : Number(this.writtenMaxLength);
      this.field.setCount({ length: this.mirror().length, max });
    });
  }

  ngOnInit() {
    const initial = this.defaultValue() ?? this.element.value;
    if (initial !== this.element.value) this.element.value = initial;
    this.mirror.set(this.element.value);
  }

  /** The native element, for `focus()`, `select()` and `setSelectionRange()`. */
  get inputElement(): HTMLTextAreaElement {
    return this.element;
  }

  focus() {
    this.element.focus();
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

  clearAfterSubmit(source: Event) {
    if (!this.request('', 'submit', source)) return;
    this.element.value = '';
    this.mirror.set('');
    this.onChangeFn('');
  }

  dictate(phrase: string) {
    const next = appendPhrase(this.mirror(), phrase);
    if (!this.request(next, 'dictation', undefined)) return;
    this.element.value = next;
    this.mirror.set(next);
    this.onChangeFn(next);
  }

  protected onInput(event: Event) {
    const next = this.element.value;
    if (this.request(next, 'keyboard', event)) {
      this.mirror.set(next);
      this.onChangeFn(next);
    } else {
      this.element.value = this.mirror();
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.key !== 'Enter' || event.shiftKey) return;
    if (event.isComposing || event.keyCode === 229) return;
    const mod = event.metaKey || event.ctrlKey;
    if (!mod && this.composer.resolvedSubmitOn() !== 'enter') return;
    event.preventDefault();
    this.composer.submitWith('keyboard', event);
  }

  protected onPaste(event: ClipboardEvent) {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length === 0) return;
    if (event.clipboardData?.getData('text/plain') === '') event.preventDefault();
    this.composer.attachFiles(files, 'paste', event);
  }

  private request(next: string, reason: ChangeReason, source: Event | undefined): boolean {
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
