import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/number-field/number-field.css';

import { numberFieldMessages } from '@slotted/core/i18n';
import { clamp as clampNumber } from '@slotted/core/measure';
import {
  createNumberFormat,
  createScrub,
  STEP_REPEAT_DELAY,
  STEP_REPEAT_DELAY_COARSE,
  snapToStep as snapToGrid,
  STEP_REPEAT_INTERVAL,
  stepNumber,
} from '@slotted/core/number';
import { createControllable } from '@slotted/core/state';
import type { ChangeReason } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, PointerEvent, PointerEventHandler, ReactNode } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useNumberFieldDefaults } from './number-field-defaults';
import type {
  NumberFieldProps,
  NumberFieldRootProps,
  NumberFieldScrubProps,
} from './number-field.types';

/** What a `NumberFieldScrub` inside the frame asks of the field around it. */
interface ScrubContext {
  inert: boolean;
  begin: (event: PointerEvent<HTMLElement>, sensitivity: number | undefined) => void;
  drag: (event: PointerEvent<HTMLElement>) => void;
  end: () => void;
}

const NumberFieldScrubContext = createContext<ScrubContext | null>(null);

/**
 * A native button fires the same `click` for a pointer, for Space and for
 * Enter. A click synthesised by the keyboard reports no detail; a real one
 * reports the click count — the rule `button`, `tag` and `text-field` all write.
 */
function activationReason(detail: number): ChangeReason {
  return detail === 0 ? 'keyboard' : 'pointer';
}

/**
 * One number, and the two buttons that move it.
 *
 * **The frame is not the control.** The element carrying `data-ui` is a `div`
 * with no role; the `input` inside it holds the value, the identifier and the
 * APG's `spinbutton` role. WAI-ARIA settles the shape: a `spinbutton`, like a
 * `textbox`, may hold only non-interactive presentational children, so the two
 * steppers are the control's siblings rather than its children.
 *
 * **The control is `type="text"`.** `type="number"` empties itself whenever the
 * text is not a valid floating-point number, so no grouping separator, no
 * decimal comma and no currency affix survives it. The raw number reaches a
 * form through a hidden input beside the visible one.
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
 * `undefined` rather than `false`.
 */
export function NumberField({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  className,
  clamp,
  defaultValue = null,
  disabled,
  end,
  form,
  format,
  formatOn,
  handle,
  id,
  inputMode,
  invalid,
  largeStep,
  locale,
  max,
  messages,
  min,
  name,
  onBlur,
  onChange,
  onKeyDown,
  onValueChange,
  readOnly,
  ref,
  render,
  size,
  smallStep,
  snapToStep = false,
  start,
  step = 1,
  stepFrom,
  stepper,
  style,
  value,
  variant,
  wheel = false,
  ...nativeProps
}: NumberFieldProps) {
  const field = useField();
  const defaults = useNumberFieldDefaults();
  const t = useMessages(numberFieldMessages, messages);
  const appLocale = useLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedStepper = stepper ?? defaults.stepper;
  const resolvedClamp = clamp ?? defaults.clamp;
  const resolvedFormatOn = formatOn ?? defaults.formatOn;
  const resolvedLocale = locale ?? appLocale;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;

  /**
   * One formatter, rebuilt only when the locale or the format actually changes.
   * The options object is compared by its own content rather than by identity,
   * because a consumer writing `format={{ style: 'percent' }}` inline hands a
   * new object on every render and would otherwise rebuild the parser — and
   * reformat the text — on each one.
   */
  const formatKey = format === undefined ? '' : JSON.stringify(format);
  const formatter = useMemo(
    () =>
      createNumberFormat({
        locale: resolvedLocale,
        ...(format === undefined ? {} : { options: format }),
      }),
    /* `formatKey` stands in for `format`: the options are compared by content,
       so an inline object is not a new format. */
    [resolvedLocale, formatKey, format],
  );

  /** What the family knows about the number, which in controlled mode is not it. */
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;

  /**
   * Unstated, the control asks the field. Under `clamp="none"` nothing returns
   * a number outside `min`…`max` to the range, so the control reports it.
   */
  const outsideRange =
    resolvedClamp === 'none' &&
    current !== null &&
    ((min !== undefined && current < min) || (max !== undefined && current > max));
  const resolvedInvalid = invalid ?? (outsideRange ? true : field?.invalid);

  /** What the element is showing. Never a second copy of the number. */
  const [text, setText] = useState(() => formatter.format(current));

  const largeAmount = largeStep ?? step * 10;
  const smallAmount = smallStep ?? step / 10;

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  /**
   * Asks to move, and says whether anything did. A controlled component and a
   * refused request both answer `false`, and the caller uses that to decide
   * what the element shows: a family that wrote the new number into the text
   * regardless would show a value the consumer never accepted.
   */
  const request = useCallback(
    (next: number | null, reason: ChangeReason, source: unknown) => {
      const state = createControllable<number | null>({
        controlled: value,
        initial: current,
        onRequest: (pending) => onValueChange?.(pending.value, pending),
      });
      const moved = state.request(next, reason, source);
      if (moved) setOwn(next);
      return moved;
    },
    [current, onValueChange, value],
  );

  /** What the element shows after a move that may not have been accepted. */
  const settle = useCallback(
    (next: number | null, moved: boolean) => {
      setText(formatter.format(moved ? next : current));
    },
    [current, formatter],
  );

  /**
   * Formats what the reader typed and puts the value back in range. The number
   * is read from the live text rather than from state, because a keystroke and
   * its commit can arrive in the same frame.
   */
  const commit = useCallback(
    (reason: ChangeReason, source: unknown) => {
      let next = formatter.parse(text);
      if (next !== null) {
        /* The number committed is the number shown: rounded to the precision
           the format states, through the same formatter. */
        next = formatter.parse(formatter.format(next)) ?? next;
        /* A typed value goes to the nearest multiple of the grid. */
        if (snapToStep) next = snapToGrid(next, step, min ?? 0);
        if (resolvedClamp !== 'none') {
          next = clampNumber(
            next,
            min ?? Number.NEGATIVE_INFINITY,
            max ?? Number.POSITIVE_INFINITY,
          );
        }
      }
      settle(next, request(next, reason, source));
    },
    [formatter, max, min, request, resolvedClamp, settle, snapToStep, step, text],
  );

  const move = useCallback(
    (
      direction: 1 | -1,
      amount: number,
      reason: ChangeReason,
      source: unknown,
      from: number | null = formatter.parse(text),
    ) => {
      const next = stepNumber({
        value: from,
        direction,
        step: amount,
        ...(min === undefined ? {} : { min }),
        ...(max === undefined ? {} : { max }),
        ...(stepFrom === undefined ? {} : { stepFrom }),
        snapToStep,
      });
      settle(next, request(next, reason, source));
      return next;
    },
    [formatter, max, min, request, settle, snapToStep, stepFrom, text],
  );

  useImperativeHandle(
    handle,
    () => ({
      increment: () => move(1, step, 'programmatic', undefined),
      decrement: () => move(-1, step, 'programmatic', undefined),
    }),
    [move, step],
  );

  /**
   * A native reset restores the element's own value and tells nothing, so the
   * family would keep the last thing typed. The form is reached through the
   * element rather than through a prop, because `form` may name a form anywhere
   * in the document.
   */
  useEffect(() => {
    const owner = inputRef.current?.form;
    if (owner === null || owner === undefined) return;
    const onReset = () => {
      setOwn(defaultValue);
      setText(formatter.format(defaultValue));
    };
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
  }, [defaultValue, formatter]);

  /**
   * A controlled value the consumer moved is written back into the text — and
   * only then.
   *
   * The comparison is against what the text already *means*, not against the
   * previous value: typing `1234` in controlled mode makes the consumer echo
   * 1234 straight back, and an effect that compared values would reformat the
   * text to `1,234` between two keystrokes and move the caret with it.
   */
  const shown = useRef(text);
  shown.current = text;
  useEffect(() => {
    if (value === undefined) return;
    /* Read through a ref rather than from the closure, so the comparison is
       against what the element shows now and not what it showed when this
       effect was last created. */
    if (Object.is(value, formatter.parse(shown.current))) return;
    setText(formatter.format(value));
  }, [formatter, value]);

  /**
   * The keystroke filter, on the native event rather than on React's synthetic
   * one: `beforeinput` is where a keystroke, a paste and a drop all arrive
   * before the element changes, and it is the only place a character that
   * cannot be part of a number can be refused without moving the caret.
   */
  useEffect(() => {
    const element = inputRef.current;
    if (element === null) return;

    const onBeforeInput = (event: InputEvent) => {
      if (event.defaultPrevented) return;
      /* An IME commits a whole run; refusing it character by character would
         make a full-width `１２３` untypeable. */
      if (event.isComposing) return;
      if (event.inputType.startsWith('delete')) return;

      const start = element.selectionStart ?? element.value.length;
      const finish = element.selectionEnd ?? element.value.length;
      const next = element.value.slice(0, start) + (event.data ?? '') + element.value.slice(finish);

      if (!formatter.isPartial(next)) {
        event.preventDefault();
        return;
      }
      if (resolvedClamp !== 'strict') return;
      const parsed = formatter.parse(next);
      if (parsed === null) return;
      if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
        event.preventDefault();
      }
    };

    element.addEventListener('beforeinput', onBeforeInput);
    return () => element.removeEventListener('beforeinput', onBeforeInput);
  }, [formatter, max, min, resolvedClamp]);

  /**
   * The wheel, when it is asked for, and never otherwise. It is a native
   * listener because the event has to be cancelled, and React's synthetic
   * wheel handler is passive.
   */
  useEffect(() => {
    const element = inputRef.current;
    if (element === null || !wheel) return;
    if (resolvedDisabled === true || resolvedReadOnly === true) return;

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== element) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      move(event.deltaY < 0 ? 1 : -1, step, 'pointer', event);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [move, resolvedDisabled, resolvedReadOnly, step, wheel]);

  /**
   * Where the caret goes after a keystroke the family reshaped the text
   * around. It is applied after the render that wrote the text, because the
   * element is controlled: setting the selection before React has put the new
   * value on the node would select inside the old string.
   *
   * `null` is "the family did not move it", which is every render that was not
   * a live regrouping — the browser's own caret is left where it is.
   */
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    if (caret === null) return;
    pendingCaret.current = null;
    const element = inputRef.current;
    /* Only while the reader is in the control. Moving the selection of an
       element nobody is typing in scrolls it into view on some engines. */
    if (element === null || element.ownerDocument.activeElement !== element) return;
    element.setSelectionRange(caret, caret);
  });

  /** The held stepper, cleared on release and on unmount alike. */
  const repeat = useRef<{ delay?: number; interval?: number }>({});
  const stopRepeating = useCallback(() => {
    window.clearTimeout(repeat.current.delay);
    window.clearInterval(repeat.current.interval);
    repeat.current = {};
  }, []);
  useEffect(() => stopRepeating, [stopRepeating]);

  const parsed = formatter.parse(text);
  const atMax = max !== undefined && parsed !== null && parsed >= max;
  const atMin = min !== undefined && parsed !== null && parsed <= min;
  const inert = resolvedDisabled === true || resolvedReadOnly === true;

  const press = (direction: 1 | -1) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    /* Focus stays on the value: the button is out of the tab order and the
       caret is what the reader came back to. */
    event.preventDefault();
    inputRef.current?.focus();
    move(direction, step, activationReason(event.detail), event);

    stopRepeating();
    const delay = event.pointerType === 'touch' ? STEP_REPEAT_DELAY_COARSE : STEP_REPEAT_DELAY;
    repeat.current.delay = window.setTimeout(() => {
      repeat.current.interval = window.setInterval(() => {
        move(direction, step, 'pointer', undefined);
      }, STEP_REPEAT_INTERVAL);
    }, delay);
  };

  /**
   * A drag over a `scrub` part. The number it moves from is carried in a ref
   * rather than read from the text: pointer moves arrive faster than renders,
   * and two moves read against one stale text would count as one.
   */
  const [scrubbing, setScrubbing] = useState(false);
  const scrub = useRef<{
    travel: ReturnType<typeof createScrub>;
    from: number | null;
  } | null>(null);
  const scrubContext: ScrubContext = {
    inert,
    begin: (event, sensitivity) => {
      if (event.button !== 0 || inert) return;
      /* No text selection, and the caret stays in the value the drag moves. */
      event.preventDefault();
      inputRef.current?.focus();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const element = inputRef.current;
      scrub.current = {
        travel: createScrub({
          clientX: event.clientX,
          ...(sensitivity === undefined ? {} : { sensitivity }),
          rtl: element !== null && getComputedStyle(element).direction === 'rtl',
        }),
        from: formatter.parse(text),
      };
      setScrubbing(true);
    },
    drag: (event) => {
      const active = scrub.current;
      if (active === null) return;
      const steps = active.travel.steps(event.clientX);
      if (steps === 0) return;
      const amount = event.shiftKey ? largeAmount : event.altKey ? smallAmount : step;
      active.from = move(
        steps > 0 ? 1 : -1,
        amount * Math.abs(steps),
        'pointer',
        event,
        active.from,
      );
    },
    end: () => {
      if (scrub.current === null) return;
      scrub.current = null;
      setScrubbing(false);
    },
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || inert) return;

    const amount = event.shiftKey ? largeAmount : event.altKey ? smallAmount : step;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        move(1, amount, 'keyboard', event);
        return;
      case 'ArrowDown':
        event.preventDefault();
        move(-1, amount, 'keyboard', event);
        return;
      case 'PageUp':
        event.preventDefault();
        move(1, largeAmount, 'keyboard', event);
        return;
      case 'PageDown':
        event.preventDefault();
        move(-1, largeAmount, 'keyboard', event);
        return;
      case 'Home':
        if (min === undefined || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        settle(min, request(min, 'keyboard', event));
        return;
      case 'End':
        if (max === undefined || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        settle(max, request(max, 'keyboard', event));
        return;
      case 'Enter':
        /* Committed and not intercepted: a single-line control submits its
           form, which is the platform's behavior and one a form of one field
           depends on. */
        commit('keyboard', event);
        return;
      default:
    }
  };

  /**
   * The software keyboard, derived from the props rather than from the user
   * agent: a user-agent check during render is a hydration mismatch. Neither
   * numeric keypad offers a minus sign on every platform, so a control that
   * admits a negative asks for the full keyboard.
   */
  const negativePossible = min === undefined || min < 0;
  const derivedInputMode = negativePossible
    ? 'text'
    : formatter.maximumFractionDigits > 0
      ? 'decimal'
      : 'numeric';

  const stepperButton = (direction: 1 | -1) => {
    const part = direction === 1 ? 'increment' : 'decrement';
    return (
      <button
        aria-controls={id ?? field?.ids.control}
        aria-label={t(part)}
        data-part={part}
        {...selectorKeyProps('part', part)}
        disabled={inert || (direction === 1 ? atMax : atMin)}
        key={part}
        onLostPointerCapture={stopRepeating}
        onPointerCancel={stopRepeating}
        onPointerDown={press(direction)}
        onPointerLeave={stopRepeating}
        onPointerUp={stopRepeating}
        tabIndex={-1}
        type="button"
      >
        {/* Stacked, both are the down chevron and the stylesheet turns the
            increment's half a turn; split, they are the minus and the plus,
            which do not change with the reading direction. */}
        <Icon>
          <Glyph
            name={
              resolvedStepper === 'split' ? (direction === 1 ? 'plus' : 'minus') : 'chevron-down'
            }
          />
        </Icon>
      </button>
    );
  };

  const control = (
    <input
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      {...withSelectorKey(nativeProps, 'part', 'input')}
      aria-describedby={[describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined}
      aria-invalid={ariaInvalid ?? (resolvedInvalid === true ? true : undefined)}
      aria-required={ariaRequired ?? (field?.required === true ? true : undefined)}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={parsed ?? undefined}
      aria-valuetext={text === '' ? undefined : text}

      disabled={resolvedDisabled}
      id={id ?? field?.ids.control}
      inputMode={inputMode ?? derivedInputMode}
      onBlur={(event) => {
        onBlur?.(event);
        commit('blur', event);
      }}
      onChange={(event) => {
        /* The consumer's handler first, and it always runs: the family composes
           with it rather than replacing it. */
        onChange?.(event);
        const element = event.currentTarget;
        const raw = element.value;
        const native = event.nativeEvent as InputEvent;

        /* An IME commits a whole run, and a run reshaped half way through is a
           run the engine can no longer finish. The text is left alone until
           `compositionend` sends a keystroke that is not composing. */
        if (resolvedFormatOn !== 'change' || native.isComposing) {
          setText(raw);
          request(formatter.parse(raw), 'keyboard', event);
          return;
        }

        const caret = element.selectionStart ?? raw.length;
        const deletion = native.inputType?.startsWith('delete') === true;
        const edited = deletion
          ? formatter.deleteAcrossSeparator(
              text,
              { text: raw, caret },
              native.inputType === 'deleteContentForward' ? 1 : -1,
            )
          : { text: raw, caret };
        const shaped = formatter.formatWhileTyping(edited);

        /* Written on the element as well as into state, and the caret with it.
           A keystroke that only repaired punctuation leaves the text the state
           already holds, so React has nothing to re-render and the effect below
           never runs — the browser's own caret would stay where the edit left
           it, which is inside the affix it just broke. */
        if (element.value !== shaped.text) element.value = shaped.text;
        if (element.ownerDocument.activeElement === element) {
          element.setSelectionRange(shaped.caret, shaped.caret);
        }
        setText(shaped.text);
        pendingCaret.current = shaped.caret;
        request(formatter.parse(shaped.text), 'keyboard', event);
      }}
      onKeyDown={keyDown}
      readOnly={resolvedReadOnly}
      ref={(element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      role="spinbutton"
      type="text"
      value={text}
    />
  );

  const steppers =
    resolvedStepper === 'none'
      ? null
      : resolvedStepper === 'split'
        ? [stepperButton(-1), stepperButton(1)]
        : [
            <span data-part="stepper" data-part-stepper="" key="stepper">
              {stepperButton(1)}
              {stepperButton(-1)}
            </span>,
          ];

  /**
   * The split arrangement is written in the order it is painted — decrement,
   * the value, increment — rather than reordered with `order`, so the reading
   * order and the painted order are the same one.
   */
  const children: ReactNode = (
    <NumberFieldScrubContext.Provider value={scrubContext}>
      {resolvedStepper === 'split' ? steppers?.[0] : null}
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      {control}
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
        </span>
      )}
      {resolvedStepper === 'split' ? steppers?.[1] : steppers}
      {name === undefined ? null : (
        <input
          form={form}
          name={name}
          type="hidden"
          value={current === null ? '' : String(current)}
        />
      )}
    </NumberFieldScrubContext.Provider>
  );

  const rootProps: NumberFieldRootProps = keyedProps({
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(scrubbing ? { 'data-scrubbing': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-stepper': resolvedStepper,
    'data-ui': 'number-field',
    'data-variant': resolvedVariant,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * A mark that moves the number when it is dragged sideways — the design
 * tools' gesture. Placed in `start` or `end`, where the field it belongs to
 * is the frame around it:
 *
 * ```tsx
 * <NumberField start={<NumberFieldScrub>W</NumberFieldScrub>} />
 * ```
 *
 * Each `sensitivity` pixels towards the inline end is one step up; `Shift`
 * moves by `largeStep` and `Alt` by `smallStep`, as on the keyboard. It is
 * hidden from assistive technology by default and takes no focus: the
 * input's arrow keys are the same movement.
 */
export function NumberFieldScrub({
  'aria-hidden': ariaHidden = true,
  onLostPointerCapture,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  sensitivity,
  ...props
}: NumberFieldScrubProps) {
  const context = useContext(NumberFieldScrubContext);
  if (context === null) {
    throw new Error('NumberFieldScrub belongs in the start or end of a NumberField.');
  }
  const [active, setActive] = useState(false);
  const finish =
    (handler: PointerEventHandler<HTMLSpanElement> | undefined) =>
    (event: PointerEvent<HTMLSpanElement>) => {
      handler?.(event);
      setActive(false);
      context.end();
    };

  return (
    <span
      {...withSelectorKey(props, 'part', 'scrub')}
      aria-hidden={ariaHidden}

      data-scrubbing={active ? '' : undefined}
      onLostPointerCapture={finish(onLostPointerCapture)}
      onPointerCancel={finish(onPointerCancel)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || context.inert || event.button !== 0) return;
        context.begin(event, sensitivity);
        setActive(true);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        context.drag(event);
      }}
      onPointerUp={finish(onPointerUp)}
    />
  );
}
