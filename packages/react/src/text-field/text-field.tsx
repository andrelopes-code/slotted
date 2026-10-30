import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/text-field/text-field.css';

import { writeToClipboard } from '@slotted/core/clipboard';
import { textFieldMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useField } from '../field';
import { countsInField } from '../field/field-context';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useTextFieldDefaults } from './text-field-defaults';
import type {
  TextFieldActionProps,
  TextFieldActionRootProps,
  TextFieldProps,
  TextFieldRootProps,
} from './text-field.types';
import { SPINNER_RING } from '../button/spinner-ring';

/** How long the check stays in place of the copy mark: `code-block`'s number. */
const COPIED_FOR = 2000;

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter. A click synthesised by the keyboard reports no detail; a real one
 * reports the click count — the rule `button` and `tag` both write.
 */
function activationReason(event: MouseEvent): Extract<ChangeReason, 'pointer' | 'keyboard'> {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One line of text, and everything that sits inside its border.
 *
 * **The frame is not the control.** The element carrying `data-ui` is a `div`
 * with no role; the `input` inside it holds the value, the identifier and every
 * native attribute. WAI-ARIA settles the shape: a `textbox` may hold only
 * non-interactive, presentational children, so the clear and reveal buttons are
 * the control's siblings rather than its children.
 *
 * **The element owns the characters.** In uncontrolled mode nothing is written
 * back to the `input`: `defaultValue` reaches it as the native attribute, a
 * native `form.reset()` restores it, and the family keeps only what it has to
 * draw — whether the value is empty, and how long it is. A control that took
 * ownership of an uncontrolled value would re-render on every keystroke to show
 * the characters the browser had already painted, and would break `reset()`
 * while doing it.
 *
 * **Unset means ask the field.** `disabled`, `readOnly` and `invalid` default to
 * `undefined` rather than `false`, which is what makes "not disabled" and "said
 * nothing" different answers.
 */
export function TextField({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  className,
  clearable = false,
  copyable = false,
  countMax,
  defaultRevealed = false,
  defaultValue,
  disabled,
  end,
  id,
  invalid,
  loading,
  maxLength,
  messages,
  mono,
  onBlur,
  onChange,
  onKeyDown,
  onKeyUp,
  onRevealedChange,
  onValueChange,
  onValueCopy,
  readOnly,
  ref,
  render,
  revealable = false,
  revealed,
  showCount = false,
  size,
  start,
  style,
  type = 'text',
  value,
  variant,
  ...nativeProps
}: TextFieldProps) {
  const field = useField();
  const defaults = useTextFieldDefaults();
  const t = useMessages(textFieldMessages, messages);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * What the family knows about the value, which is not the value itself. In
   * controlled mode the consumer's string is the truth; in uncontrolled mode
   * the element's is, and this only mirrors it so the clear button and the
   * count have something to read.
   */
  const [mirrored, setMirrored] = useState(defaultValue ?? '');
  const [ownRevealed, setOwnRevealed] = useState(defaultRevealed);
  const [copied, setCopied] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  const current = value ?? mirrored;
  const isRevealed = revealed ?? ownRevealed;

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedMono = mono ?? defaults.mono;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * A native reset restores the element's own value and tells nothing, so the
   * mirror would keep the last thing typed and the clear button would offer to
   * clear an empty control. The form is reached through the element rather than
   * through a prop, because `form` may name a form anywhere in the document.
   */
  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) return;
    const onReset = () => setMirrored(defaultValue ?? '');
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [defaultValue]);

  /**
   * The count is published to the field, which draws it in the spare column of
   * its label row. `length` is in UTF-16 code units, which is what `maxLength`
   * counts: a counter that disagreed with the limit the browser enforces would
   * be wrong at exactly the moment it is read.
   */
  const setCount = field?.setCount;
  const limit = countMax ?? maxLength ?? undefined;
  useEffect(() => {
    if (!showCount || setCount === undefined) return;
    setCount({ length: current.length, max: limit });
    return () => setCount(undefined);
  }, [current, limit, setCount, showCount]);

  /** Where the caret was before the type swapped, so the swap does not move it. */
  const selection = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    const held = selection.current;
    const element = inputRef.current;
    if (held === null || element === null) return;
    selection.current = null;
    element.focus();
    element.setSelectionRange(held[0], held[1]);
  }, [isRevealed]);

  const requestValue = (next: string, reason: ChangeReason, source: unknown) => {
    const state = createControllable<string>({
      controlled: value,
      initial: current,
      onRequest: (request) => onValueChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setMirrored(next);
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    const element = inputRef.current;
    /* Uncontrolled, the element owns the characters, so they are removed from
       it rather than from a copy the family keeps. */
    if (value === undefined && element !== null) element.value = '';
    requestValue('', 'clear', event);
    element?.focus();
  };

  const toggleReveal = (event: MouseEvent<HTMLButtonElement>) => {
    const element = inputRef.current;
    selection.current =
      element === null ? null : [element.selectionStart ?? 0, element.selectionEnd ?? 0];

    const state = createControllable<boolean>({
      controlled: revealed,
      initial: isRevealed,
      onRequest: (request) => onRevealedChange?.(request.value, request),
    });
    if (state.request(!isRevealed, activationReason(event), event)) setOwnRevealed(!isRevealed);
  };

  const announce = (message: string) =>
    getLiveAnnouncer(inputRef.current?.ownerDocument).announce(message);

  const copy = async (event: MouseEvent<HTMLButtonElement>) => {
    const reason = activationReason(event);
    const done = (await writeToClipboard(current)) !== 'refused';
    if (done) {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FOR);
    }
    announce(done ? t('copied') : t('copyFailed'));
    onValueCopy?.({ copied: done, reason, source: event, value: current });
  };

  const isPassword = type === 'password';

  /**
   * Caps Lock is read from the key events the control already receives, and
   * only while it has focus: the platform exposes the modifier on an event and
   * nowhere else, and a warning about the next thing typed means nothing to a
   * control nobody is typing into. It is announced once as it turns on.
   */
  const readCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isPassword || typeof event.getModifierState !== 'function') return;
    const on = event.getModifierState('CapsLock');
    if (on && !capsLock) announce(t('capsLock'));
    if (on !== capsLock) setCapsLock(on);
  };

  const showClear =
    clearable && current !== '' && resolvedDisabled !== true && resolvedReadOnly !== true;
  const showCopy = copyable && current !== '' && resolvedDisabled !== true;
  const showReveal = revealable && isPassword && resolvedDisabled !== true;

  const control = (
    <input
      {...withSelectorKey(nativeProps, 'part', 'input')}
      aria-busy={loading === true ? true : undefined}
      aria-describedby={[describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined}
      aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
      aria-required={ariaRequired ?? (field?.required === true ? true : undefined)}

      disabled={resolvedDisabled}
      id={id ?? field?.ids.control}
      maxLength={maxLength}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
        setCapsLock(false);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        readCapsLock(event);
      }}
      onKeyUp={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyUp?.(event);
        readCapsLock(event);
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        /* The consumer's handler first, and it always runs: the family composes
           with it rather than replacing it. */
        onChange?.(event);
        requestValue(event.currentTarget.value, 'keyboard', event);
      }}
      readOnly={resolvedReadOnly}
      ref={(element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      type={isPassword && isRevealed ? 'text' : type}
      {...(value === undefined ? { defaultValue } : { value })}
    />
  );

  const children: ReactNode = (
    <>
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      {control}
      {/* The ring, the mark and the two buttons below stay rendered for as
          long as their capability is on, and leave through `hidden`, so the
          stylesheet can take them out as well as bring them in. */}
      {loading === undefined ? null : (
        <span
          aria-hidden="true"
          data-part="busy"
          data-part-busy=""
          data-ui="spinner"
          data-ui-spinner=""
          hidden={!loading}
        >
          {SPINNER_RING}
        </span>
      )}
      {isPassword ? (
        <span aria-hidden="true" data-part="caps-lock" data-part-caps-lock="" hidden={!capsLock}>
          <Icon>
            <Glyph name="caps-lock" />
          </Icon>
        </span>
      ) : null}
      {clearable ? (
        <button
          aria-label={t('clear')}
          data-part="clear"
          data-part-clear=""
          hidden={!showClear}
          onClick={clear}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      ) : null}
      {copyable ? (
        <button
          aria-label={t('copy')}
          data-part="copy"
          data-part-copy=""
          hidden={!showCopy}
          onClick={(event) => void copy(event)}
          type="button"
          {...(copied ? { 'data-complete': '' } : {})}
        >
          {/* Keyed by the mark, so the check is a new element and arrives. */}
          <Icon key={copied ? 'check' : 'copy'}>
            <Glyph name={copied ? 'check' : 'copy'} />
          </Icon>
        </button>
      ) : null}
      {showReveal ? (
        <button
          aria-label={t('reveal')}
          aria-pressed={isRevealed}
          data-part="reveal"
          data-part-reveal=""
          onClick={toggleReveal}
          type="button"
        >
          {/* The button announces what pressing it does: a revealed value is
              one a press will hide, so it shows the crossed eye. */}
          <Icon key={isRevealed ? 'eye-off' : 'eye'}>
            <Glyph name={isRevealed ? 'eye-off' : 'eye'} />
          </Icon>
        </button>
      ) : null}
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
        </span>
      )}
    </>
  );

  const rootProps: TextFieldRootProps = keyedProps({
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(loading === true ? { 'data-loading': '' } : {}),
    ...(resolvedMono ? { 'data-mono': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'text-field',
    'data-variant': resolvedVariant,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * A button of the consumer's inside the frame. It is a real `button`, typed
 * `button` unless stated, so a submit inside a form never submits by accident;
 * everything else — its name, its handlers, the wiring a menu trigger hands it
 * through `render` — reaches the element untouched.
 *
 * ```tsx
 * <MenuTrigger render={(props) => <TextFieldAction {...props}>+55 …</TextFieldAction>} />
 * ```
 */
export function TextFieldAction({ render, type = 'button', ...nativeProps }: TextFieldActionProps) {
  const props: TextFieldActionRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'action',
    type,
  });
  return render === undefined ? <button {...props} /> : render(props);
}

/** The count `TextField` publishes, as the field reads it before the effect runs. */
countsInField(
  TextField,
  ({ countMax, defaultValue, maxLength, showCount, value }: TextFieldProps) =>
    showCount === true
      ? { length: (value ?? defaultValue ?? '').length, max: countMax ?? maxLength ?? undefined }
      : undefined,
);
