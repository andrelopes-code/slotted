import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/otp-input/otp-input.css';

import { currentSlots, normalizeSelection, sanitize, spreadPlaceholder } from '@slotted/core/otp';
import type { OtpSelection } from '@slotted/core/otp';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, PointerEvent, ReactNode } from 'react';

import { useField } from '../field';
import { useOtpInputDefaults } from './otp-input-defaults';
import type { OtpInputProps, OtpInputRootProps } from './otp-input.types';

/** The character a masked box shows, which is the one a password field shows. */
const MASK = '•';

/**
 * `groups` has to add up to `length`; a partition that does not is one group.
 * A silent fallback rather than a throw, because a code field that renders
 * nothing on a verification screen locks the reader out of the product.
 */
function partition(length: number, groups: readonly number[] | undefined): number[] {
  if (groups === undefined) return [length];
  const sum = groups.reduce((total, size) => total + size, 0);
  return sum === length && groups.every((size) => size > 0) ? [...groups] : [length];
}

/**
 * One real input and N painted boxes.
 *
 * **The input is the control.** It holds the value, the `name`, the `form`,
 * `autocomplete="one-time-code"`, the identifier the field's label points at,
 * and it is the one tab stop. It lies over the boxes, transparent, so the
 * click, the long press with "Paste" on iOS and the keyboard's autofill bar
 * all reach it. The boxes are paint, hidden from assistive technology, each
 * showing one character of what the input holds.
 *
 * **The family owns the characters — even uncontrolled.** Unlike `text-field`,
 * which mirrors only the length, this one paints every character, so it keeps
 * a copy of the value the element holds. The element stays the source:
 * `defaultValue` reaches it as the native attribute, `form.reset()` restores
 * it, and the copy follows.
 *
 * **The selection is normalized, not the keys.** Every key is the browser's.
 * After each change the family makes sure a cursor inside the value has one
 * character selected, so typing replaces it instead of being refused by
 * `maxlength` — the rule `@slotted/core/otp` holds and input-otp wrote.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default
 * to `undefined` rather than `false`.
 */
export function OtpInput({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  attached,
  autoComplete = 'one-time-code',
  autoSubmit = false,
  className,
  defaultValue,
  disabled,
  groups,
  id,
  inputMode,
  invalid,
  length: lengthProp,
  mask = false,
  onBlur,
  onChange,
  onComplete,
  onDragStart,
  onFocus,
  onRejected,
  onValueChange,
  pattern,
  placeholder,
  readOnly,
  ref,
  render,
  size,
  spellCheck = false,
  style,
  transform,
  type: typeProp,
  value,
  variant,
  webOtp = false,
  ...nativeProps
}: OtpInputProps) {
  const field = useField();
  const defaults = useOtpInputDefaults();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const length = lengthProp ?? defaults.length;
  const type = typeProp ?? defaults.type;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedAttached = attached ?? defaults.attached;
  const resolvedPlaceholder = placeholder ?? defaults.placeholder;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;

  const options = { length, pattern, transform, type };
  /* What the element starts with, cut to what the code accepts. */
  const initial = sanitize(defaultValue ?? '', options).value;

  const [mirrored, setMirrored] = useState(initial);
  const [selection, setSelection] = useState<OtpSelection | null>(null);
  const [focused, setFocused] = useState(false);
  const previousSelection = useRef<OtpSelection | null>(null);
  const current = (value ?? mirrored).slice(0, length);

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * A native reset restores the element's own value and tells nothing, so the
   * copy would keep painting the last thing typed over an element that is
   * empty again.
   */
  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) return;
    const onReset = () => setMirrored(initial);
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [initial]);

  const requestValue = (next: string, reason: ChangeReason, source: unknown) => {
    const state = createControllable<string>({
      controlled: value,
      initial: current,
      onRequest: (request) => onValueChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setMirrored(next);
  };

  /**
   * Completion is a fact about the value, so it is read from the value after
   * it has moved — in controlled mode that is after the consumer accepted the
   * request. It is reported once per value: a full code edited into another
   * full code reports again, and a code emptied and retyped reports again.
   */
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (current.length !== length) {
      reported.current = null;
      return;
    }
    if (reported.current === current) return;
    reported.current = current;
    onComplete?.(current);
    if (autoSubmit) inputRef.current?.form?.requestSubmit();
  }, [autoSubmit, current, length, onComplete]);

  /** Reads the element's selection, corrects it, and paints the current box. */
  const syncSelection = () => {
    const element = inputRef.current;
    if (element === null) return;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const corrected = normalizeSelection({
      start,
      end,
      valueLength: element.value.length,
      length,
      previous: previousSelection.current ?? undefined,
    });
    if (corrected !== null)
      element.setSelectionRange(corrected.start, corrected.end, corrected.direction);
    const final: OtpSelection = corrected ?? { start, end };
    previousSelection.current = final;
    setSelection(final);
  };

  /**
   * The browser fires `selectionchange` on the document, for every control at
   * once; it is read only while this one holds focus. `capture` because the
   * event does not bubble in every engine.
   */
  useEffect(() => {
    if (!focused) return;
    const onSelectionChange = () => {
      if (document.activeElement === inputRef.current) syncSelection();
    };
    document.addEventListener('selectionchange', onSelectionChange, { capture: true });
    return () =>
      document.removeEventListener('selectionchange', onSelectionChange, { capture: true });
  }, [focused, length]);

  /**
   * The WebOTP API: where it exists, the platform hands over the code the
   * moment the SMS arrives. Abandoned when the form submits on its own or the
   * control unmounts, which is the shape MDN's example takes.
   */
  useEffect(() => {
    if (!webOtp || typeof window === 'undefined' || !('OTPCredential' in window)) return;
    const controller = new AbortController();
    const form = inputRef.current?.form ?? null;
    const abort = () => controller.abort();
    form?.addEventListener('submit', abort);
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: controller.signal } as CredentialRequestOptions)
      .then((credential) => {
        const code = (credential as { code?: string } | null)?.code;
        if (code === undefined) return;
        const next = sanitize(code, options).value;
        const element = inputRef.current;
        if (value === undefined && element !== null) element.value = next;
        requestValue(next, 'programmatic', credential);
      })
      .catch(() => undefined);
    return () => {
      form?.removeEventListener('submit', abort);
      controller.abort();
    };
  }, [webOtp]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const element = event.currentTarget;
    const { rejected, value: next } = sanitize(element.value, options);
    if (rejected !== '') onRejected?.(rejected, event);
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
    previousSelection.current = { start: caret, end: caret };
    /* The consumer's handler first, and it always runs. */
    onChange?.(event);
    requestValue(next, 'keyboard', event);
    syncSelection();
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
    setFocused(true);
    const element = event.currentTarget;
    /* Focus lands after the last character, or on it when the code is full. */
    const at = element.value.length;
    element.setSelectionRange(Math.min(at, length - 1), at);
    previousSelection.current = null;
    syncSelection();
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    setFocused(false);
    setSelection(null);
    previousSelection.current = null;
  };

  /**
   * A press on a box puts the cursor in that box. The input lies over the
   * boxes and would otherwise place its caret by the x of transparent text;
   * the box under the pointer is what the reader meant, so it is found from
   * the point and the selection is set to it — clamped to the value, since a
   * cursor cannot sit past the last character typed.
   */
  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    const element = inputRef.current;
    if (element === null || element.disabled || typeof document.elementsFromPoint !== 'function')
      return;
    const slot = document
      .elementsFromPoint(event.clientX, event.clientY)
      .find(
        (candidate): candidate is HTMLElement =>
          candidate instanceof HTMLElement &&
          candidate.dataset['part'] === 'slot' &&
          candidate.closest("[data-ui='otp-input']") === event.currentTarget,
      );
    if (slot === undefined) return;
    event.preventDefault();
    const index = Math.min(Number(slot.dataset['index'] ?? 0), element.value.length);
    element.focus();
    const end = index < element.value.length ? index + 1 : index;
    previousSelection.current = null;
    element.setSelectionRange(index, end);
    syncSelection();
  };

  const control = (
    <input
      {...withSelectorKey(nativeProps, 'part', 'input')}
      aria-describedby={[describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined}
      aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
      aria-required={ariaRequired ?? (field?.required === true ? true : undefined)}
      autoComplete={autoComplete}

      disabled={resolvedDisabled}
      id={id ?? field?.ids.control}
      inputMode={inputMode ?? (type === 'numeric' ? 'numeric' : 'text')}
      maxLength={length}
      onBlur={handleBlur}
      onChange={handleChange}
      onDragStart={(event) => {
        /* A press on a selected character would otherwise drag that text,
           with a ghost of the character floating under the pointer — and in
           a full code a character is selected at every press. */
        onDragStart?.(event);
        event.preventDefault();
      }}
      onFocus={handleFocus}
      readOnly={resolvedReadOnly}
      ref={(element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      spellCheck={spellCheck}
      type={mask ? 'password' : 'text'}
      {...(value === undefined ? { defaultValue: initial } : { value: current })}
    />
  );

  const placeholders = spreadPlaceholder(resolvedPlaceholder, length);
  const active = new Set(
    focused && selection !== null
      ? currentSlots({ ...selection, length, valueLength: current.length })
      : [],
  );
  const boxes: ReactNode[] = [];
  let index = 0;
  for (const [groupIndex, count] of partition(length, groups).entries()) {
    if (groupIndex > 0) {
      boxes.push(
        <div
          aria-hidden="true"
          data-part="separator"
          data-part-separator=""
          key={`separator-${groupIndex}`}
        />,
      );
    }
    const slots: ReactNode[] = [];
    for (let position = 0; position < count; position += 1, index += 1) {
      const character = current[index] ?? '';
      const shown = character === '' ? '' : mask ? MASK : character;
      slots.push(
        <div
          data-index={index}
          data-part="slot"
          data-part-slot=""
          key={index}
          {...(active.has(index) ? { 'data-current': '' } : {})}
          {...(shown === '' && placeholders[index] !== ''
            ? { 'data-placeholder': placeholders[index] }
            : {})}
        >
          {shown}
        </div>,
      );
    }
    boxes.push(
      <div aria-hidden="true" data-part="group" data-part-group="" key={`group-${groupIndex}`}>
        {slots}
      </div>,
    );
  }

  const rootProps: OtpInputRootProps = keyedProps({
    children: (
      <>
        {control}
        {boxes}
      </>
    ),
    className,
    onPointerDown: handlePointerDown,
    style,
    ...(resolvedAttached ? { 'data-attached': '' } : {}),
    ...(current.length === length ? { 'data-complete': '' } : {}),
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(mask ? { 'data-mask': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'otp-input',
    'data-variant': resolvedVariant,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
