import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/time-field/time-field.css';

import {
  boundSegment,
  clearSegment,
  commitTyping,
  createTimeFormat,
  EMPTY_SEGMENTS,
  fieldRange,
  isRelativeKey,
  isSameTime,
  isTimeInRange,
  nowIn,
  parseDuration,
  plainDate,
  resolveRelative,
  segmentsOfTime,
  stepSegment,
  timeOf,
  toISOTime,
  typeDayPeriod,
  typeDigit,
} from '@slotted/core/date';
import type {
  PlainTime,
  SegmentReference,
  SegmentState,
  TimeFieldName,
  TimeFormat,
} from '@slotted/core/date';
import { timeFieldMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ClipboardEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useTimeFieldDefaults } from './time-field-defaults';
import type {
  TimeFieldChangeRequest,
  TimeFieldProps,
  TimeFieldRootProps,
  TimeFieldValueReason,
} from './time-field.types';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * The APG spin-button example pages every button by five. Fifteen minutes is
 * the page a reader of a time field means and the step a quarter-hour panel
 * offers, so the two agree; three hours is a quarter of a twelve-hour cycle.
 * The cost is written in `specs/components/time-field/contract.json`.
 */
const PAGE_STEP: Record<TimeFieldName, number> = {
  hour: 3,
  minute: 15,
  second: 15,
  dayPeriod: 1,
};

/**
 * The date half of the reference, which a time field never draws and the engine
 * still asks for. One `SegmentState` holds both halves — that is what
 * `datetime-field` needs — so the reference carries both as well.
 */
const REFERENCE_DATE = plainDate(2000, 1, 1);

/**
 * What an empty segment steps from before the browser has said what time it is.
 *
 * Nothing is drawn from it and no value is derived from it: it is only the time
 * `ArrowUp` on an empty field starts from, and the effect below replaces it on
 * the first paint. A real clock read during render would hydrate to different
 * markup on a server and a browser, which is the one thing `frameworks.md` asks
 * a React binding not to do.
 */
const SSR_REFERENCE: PlainTime = { hour: 12, minute: 0, second: 0 };

/**
 * A segmented time control: one spin button per field, in the order the locale
 * writes them.
 *
 * **The frame is not the control.** The element carrying `data-ui` is a `div`
 * with no role; `role="group"` is on the row of segments, which is what the
 * APG's spin-button example names as the thing that tells a screen-reader user
 * that the buttons are one time.
 *
 * **There is no `input[type=time]` under any of it**, for the reason
 * `date-field` refuses `input[type=date]`: the browser's own control cannot be
 * styled past its closed state, its panel is drawn by the operating system and
 * answers no scheme, no density and no direction, and its field order is the
 * browser's locale rather than the application's. The value still reaches a
 * plain form post through a hidden input carrying `HH:mm:ss`.
 *
 * **The segments are the state and the value is derived.** An hour with no
 * minute is not a time, so `value` is `null` — and that is not the same as an
 * empty field. Every surveyed implementation holds a whole time or nothing and
 * cannot say the difference; the request carries the segments so a consumer
 * can.
 *
 * **A time can be written as a duration.** `+`, `-` and `=` open one expression
 * region in place of the segments, and what it resolves to is drawn beside it
 * before `Enter` commits anything. No surveyed implementation offers it.
 */
export function TimeField({
  'aria-describedby': describedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
  clearable = false,
  defaultValue,
  disabled,
  end,
  granularity,
  hourCycle,
  id,
  invalid,
  isTimeUnavailable,
  locale,
  max,
  messages,
  min,
  name,
  onKeyDown,
  onPaste: onPasteProp,
  onValueChange,
  readOnly,
  ref,
  referenceTime,
  relative,
  render,
  required,
  size,
  start,
  style,
  timeZone,
  value,
  variant,
  ...nativeProps
}: TimeFieldProps) {
  const field = useField();
  const defaults = useTimeFieldDefaults();
  const appLocale = useLocale();
  const t = useMessages(timeFieldMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const durationRef = useRef<HTMLInputElement | null>(null);
  const generatedId = useId();

  const resolvedLocale = locale ?? appLocale;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedGranularity = granularity ?? defaults.granularity;
  const resolvedHourCycle = hourCycle ?? defaults.hourCycle;
  const resolvedRelative = relative ?? defaults.relative;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required;

  const format = useMemo(
    () =>
      createTimeFormat({
        granularity: resolvedGranularity,
        hourCycle: resolvedHourCycle,
        locale: resolvedLocale,
      }),
    [resolvedGranularity, resolvedHourCycle, resolvedLocale],
  );

  /**
   * What time it is, resolved after the first paint rather than during it.
   *
   * Nothing is drawn from it — it is the time an empty segment steps to and the
   * anchor a duration resolves against — so the first paint holding noon costs
   * nothing a reader can see, and a consumer who needs it stated says
   * `referenceTime`.
   */
  const [clock, setClock] = useState<PlainTime>(() => SSR_REFERENCE);
  useEffect(() => setClock(nowIn(resolvedTimeZone)), [resolvedTimeZone]);
  const anchor = referenceTime ?? clock;

  const reference: SegmentReference = useMemo(() => {
    const shown = format.toDisplay(anchor.hour);
    return {
      ...REFERENCE_DATE,
      dayPeriod: shown.dayPeriod ?? 0,
      hour: shown.hour,
      hourCycle: format.hourCycle,
      minute: anchor.minute,
      second: anchor.second,
    };
  }, [anchor, format]);

  const [ownSegments, setOwnSegments] = useState<SegmentState>(() =>
    segmentsOfTime(value ?? defaultValue ?? null, format),
  );
  const [activeField, setActiveField] = useState<TimeFieldName | undefined>(undefined);
  /** The duration being written, or `null` while the segments are showing. */
  const [expression, setExpression] = useState<string | null>(null);

  /**
   * The segments as they are *now*, not as they were when this render began.
   *
   * Moving focus to the next segment fires the previous one's `blur` inside the
   * same event, before React has re-rendered — so a `blur` handler reading the
   * render's own state writes it back over the digit just accepted. The rule
   * `date-field` paid for, inherited whole.
   */
  const segmentsRef = useRef(ownSegments);
  const read = () => segmentsRef.current;

  /**
   * The consumer's value writes the segments, and only when it names a
   * different time. Written on every render it would throw away a half-typed
   * time on the keystroke that completes a different one.
   */
  useEffect(() => {
    if (value === undefined) return;
    if (isSameTime(timeOf(segmentsRef.current, format), value)) return;
    segmentsRef.current = segmentsOfTime(value, format);
    setOwnSegments(segmentsRef.current);
  }, [format, value]);

  const segments = ownSegments;
  const current = timeOf(segments, format);

  const fields = useMemo(
    () =>
      format.pattern
        .filter((part) => part.type !== 'literal')
        .map((part) => part.type as TimeFieldName),
    [format],
  );

  /**
   * Moves the segments, and asks before the derived value moves with them.
   *
   * The segments always commit: they are what the control is showing, and a
   * consumer who owns the value does not own the half of a time being typed.
   * The value is a request, cancellable, and it carries the segments and the
   * midnight crossing beside it.
   */
  const commit = useCallback(
    (
      next: SegmentState,
      reason: TimeFieldValueReason,
      source: unknown,
      crossesMidnight = false,
    ) => {
      const previous = timeOf(segmentsRef.current, format);
      segmentsRef.current = next;
      setOwnSegments(next);

      /**
       * A run of typed digits moves the display and not the value. Typing `23`
       * into an hour passes through `2` on the way, and `2` is a time the
       * arithmetic accepts and nobody meant. The request is emitted when the
       * run ends: on the digit that fills the field, on the key that leaves
       * it, or on blur.
       */
      if (next.typing !== null) return;

      const state = createControllable<PlainTime | null>({
        controlled: value,
        initial: previous,
        equals: isSameTime,
        onRequest: (request) => {
          onValueChange?.(request.value, {
            ...request,
            crossesMidnight,
            segments: next,
          } as TimeFieldChangeRequest);
        },
      });
      state.request(timeOf(next, format), reason, source);
    },
    [format, onValueChange, value],
  );

  const focusField = useCallback((name: TimeFieldName) => {
    setActiveField(name);
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-part="segment"][data-field="${name}"]`)
      ?.focus();
  }, []);

  /**
   * Where a press on the frame puts the reader: the first field still waiting
   * for a value, and the first field of the time when none is. Every text
   * control on the page answers a press anywhere inside its border, and this
   * one has to as well.
   */
  const focusEntry = useCallback(() => {
    const held = read();
    const empty = fields.find((name) => held[name] === null);
    const target = empty ?? fields[0];
    if (target !== undefined) focusField(target);
  }, [fields, focusField]);

  const moveBy = useCallback(
    (name: TimeFieldName, step: number) => {
      const index = fields.indexOf(name) + step;
      const next = fields[index];
      if (next !== undefined) focusField(next);
    },
    [fields, focusField],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        const first = fields[0];
        if (first !== undefined) focusField(first);
      },
      clear: () => commit(EMPTY_SEGMENTS, 'clear', undefined),
      get activeField() {
        return activeField;
      },
    }),
    [activeField, commit, fields, focusField],
  );

  const editable = resolvedDisabled !== true && resolvedReadOnly !== true;

  /* ── The duration expression ─────────────────────────────────────────── */

  const relativeOpen = expression !== null;

  /** What the expression resolves to, or `null` while it says nothing yet. */
  const resolved = useMemo(() => {
    if (expression === null) return null;
    const seconds = parseDuration(expression);
    return seconds === null ? null : resolveRelative(anchor, seconds);
  }, [anchor, expression]);

  useEffect(() => {
    if (!relativeOpen) return;
    const input = durationRef.current;
    if (input === null) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [relativeOpen]);

  const closeExpression = useCallback(() => {
    setExpression(null);
    const first = fields[0];
    if (first !== undefined) focusField(first);
  }, [fields, focusField]);

  const commitExpression = useCallback(
    (source: unknown) => {
      if (resolved === null) {
        setExpression(null);
        return;
      }
      commit(segmentsOfTime(resolved.time, format), 'keyboard', source, resolved.days !== 0);
      setExpression(null);
    },
    [commit, format, resolved],
  );

  /**
   * A key the field acted on is the field's, and nothing above it sees it.
   *
   * A `div` with `role="spinbutton"` is not an `input`, a `textarea` or
   * `contenteditable`, so every "is the target editable" guard an application
   * writes misses it and a reader typing a time fires every single-key shortcut
   * on the page. `preventDefault` alone does not help: a shortcut handler reads
   * the key, not the default. Recorded first by `date-field`.
   */
  const consume = (event: KeyboardEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onSegmentKeyDown = (name: TimeFieldName) => (event: KeyboardEvent<HTMLDivElement>) => {
    /* The reader's own handler first, and it always runs: the family composes
       with it rather than replacing it. */
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;

    /* An inline direction is a physical pair of keys and a logical order, so
       the arrow that walks forward is the one pointing along the writing
       direction rather than the one pointing right. */
    const rtl = rootRef.current !== null && getComputedStyle(rootRef.current).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forward) {
      consume(event);
      moveBy(name, 1);
      return;
    }
    if (event.key === backward) {
      consume(event);
      moveBy(name, -1);
      return;
    }

    if (!editable) return;

    /**
     * `Alt` with an arrow is not this control's chord. `time-picker` opens its
     * panel with `Alt`+`ArrowDown`, and a segment that stepped on it would eat
     * the only shortcut the surface has.
     */
    if (event.altKey) return;

    if (resolvedRelative && isRelativeKey(event.key)) {
      consume(event);
      setExpression(event.key);
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        consume(event);
        commit(stepSegment(read(), name, 1, reference), 'keyboard', event);
        return;
      case 'ArrowDown':
        consume(event);
        commit(stepSegment(read(), name, -1, reference), 'keyboard', event);
        return;
      case 'PageUp':
        consume(event);
        commit(stepSegment(read(), name, PAGE_STEP[name], reference), 'keyboard', event);
        return;
      case 'PageDown':
        consume(event);
        commit(stepSegment(read(), name, -PAGE_STEP[name], reference), 'keyboard', event);
        return;
      case 'Home':
        consume(event);
        commit(boundSegment(read(), name, 'min', reference), 'keyboard', event);
        return;
      case 'End':
        consume(event);
        commit(boundSegment(read(), name, 'max', reference), 'keyboard', event);
        return;
      case 'Backspace':
      case 'Delete':
        consume(event);
        commit(clearSegment(read(), name), 'clear', event);
        return;
      default:
        break;
    }

    /* The day period holds two words rather than digits, and the platform's own
       control takes it by the first letter of either. */
    if (name === 'dayPeriod' && /^\p{L}$/u.test(event.key)) {
      const typed = typeDayPeriod(read(), event.key, format);
      if (typed === null) return;
      consume(event);
      commit(typed.segments, 'keyboard', event);
      if (typed.advance) moveBy(name, 1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      consume(event);
      const typed = typeDigit(read(), name, Number(event.key), format, reference);
      commit(typed.segments, 'keyboard', event);
      if (typed.advance) moveBy(name, 1);
    }
  };

  const onExpressionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;

    if (event.key === 'Enter') {
      /* An expression inside a form must not submit it: `Enter` is this
         control's commit and nothing above it needs to hear the key. */
      consume(event);
      commitExpression(event);
      const first = fields[0];
      if (first !== undefined) focusField(first);
      return;
    }

    if (event.key === 'Escape') {
      /* Abandoned whole, and the segments come back exactly as they were. The
         key is stopped so an overlay above does not close on the same press —
         the field takes it first while an expression is open. */
      consume(event);
      closeExpression();
    }
  };

  /**
   * A whole time, pasted. The locale's shape is read first and ISO 8601 after
   * it; text that is neither but reads as a duration opens the expression, so
   * pasting `+40m` does what typing it does.
   */
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    onPasteProp?.(event as never);
    if (event.defaultPrevented || !editable) return;

    const text = event.clipboardData.getData('text/plain');
    const parsed = format.parse(text);
    if (parsed !== null) {
      event.preventDefault();
      commit(segmentsOfTime(parsed, format), 'keyboard', event);
      return;
    }

    if (resolvedRelative && parseDuration(text) !== null) {
      event.preventDefault();
      setExpression(text.trim());
    }
  };

  /** A run of typed digits ends when focus leaves. */
  const onSegmentBlur = () => {
    setActiveField(undefined);
    const held = read();
    if (held.typing === null) return;
    commit(commitTyping(held, format, reference), 'blur', undefined);
  };

  /**
   * A press inside the frame that landed on nothing of its own. The default is
   * prevented so the press does not immediately blur the field it just gave
   * focus to, which is what a `mousedown` on a non-focusable box would do.
   */
  const onRootMouseDown = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-part="segment"], button, a, input, select, textarea') != null) {
      return;
    }
    event.preventDefault();
    if (!relativeOpen) focusEntry();
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    commit(EMPTY_SEGMENTS, 'clear', event);
    const first = fields[0];
    if (first !== undefined) focusField(first);
  };

  /**
   * What a screen reader is told the group holds. The APG's example names the
   * whole value in a hidden element referenced by the group's own
   * `aria-labelledby`, so the reader hears the time without visiting every
   * button and remembering each.
   */
  const valueTextId = `${generatedId}-value`;
  const spoken = current === null ? undefined : format.describe(current);

  /**
   * Validity the family owns, beside the validity the consumer states. A time
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because the control is the only thing that knows.
   */
  const unavailable = current !== null && isTimeUnavailable?.(current) === true;
  const outOfRange = current !== null && !isTimeInRange(current, min, max);
  const isInvalid = resolvedInvalid === true || unavailable || outOfRange;

  const empty = fields.every((name) => segments[name] === null);
  const showClear = clearable && !empty && editable && !relativeOpen;

  const children: ReactNode = (
    <>
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      {relativeOpen ? (
        <>
          <input
            aria-describedby={
              [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined
            }
            aria-label={t('duration')}
            data-part="duration"
            data-part-duration=""
            onBlur={(event) => commitExpression(event)}
            onChange={(event) => setExpression(event.target.value)}
            onKeyDown={onExpressionKeyDown}
            placeholder="+40m"
            ref={durationRef}
            type="text"
            value={expression}
          />
          <span
            aria-live="polite"
            data-part="preview"
            data-part-preview=""
            role="status"
            {...(resolved === null ? {} : { 'data-resolved': '' })}
            {...(resolved !== null && resolved.days !== 0 ? { 'data-crosses-midnight': '' } : {})}
          >
            <Icon directional>
              <Glyph name="chevron-right" />
            </Icon>
            {resolved === null
              ? ''
              : resolved.days === 0
                ? format.format(resolved.time)
                : t('nextDay', { time: format.format(resolved.time) })}
          </span>
        </>
      ) : (
        <div
          aria-describedby={
            [describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined
          }
          aria-disabled={resolvedDisabled === true ? true : undefined}
          aria-invalid={isInvalid ? true : undefined}
          aria-label={ariaLabel}
          aria-labelledby={
            ariaLabel === undefined
              ? [labelledBy ?? field?.ids.label, valueTextId].filter(Boolean).join(' ')
              : undefined
          }
          aria-readonly={resolvedReadOnly === true ? true : undefined}
          aria-required={resolvedRequired === true ? true : undefined}
          data-part="segments"
          data-part-segments=""
          id={id ?? field?.ids.control}
          onPaste={onPaste}
          role="group"
        >
          {format.pattern.map((part, index) => {
            if (part.type === 'literal') {
              return (
                <span
                  aria-hidden="true"
                  data-part="literal"
                  data-part-literal=""
                  key={`literal-${String(index)}`}
                >
                  {part.value}
                </span>
              );
            }

            const name = part.type;
            return (
              <Segment
                disabled={resolvedDisabled === true}
                field={name}
                format={format}
                key={name}
                onBlur={onSegmentBlur}
                onFocus={() => setActiveField(name)}
                onKeyDown={onSegmentKeyDown(name)}
                label={t(name)}
                readOnly={resolvedReadOnly === true}
                segments={segments}
                tabIndex={name === (activeField ?? fields[0]) ? 0 : -1}
              />
            );
          })}
        </div>
      )}
      {/* The whole time in words, for the group's own accessible name. */}
      <span data-part="value-text" data-part-value-text="" hidden id={valueTextId}>
        {spoken}
      </span>
      {showClear ? (
        <button
          aria-label={t('clear')}
          data-part="clear"
          data-part-clear=""
          onClick={clear}
          type="button"
        >
          <Icon>
            <Glyph name="x" />
          </Icon>
        </button>
      ) : null}
      {end === undefined ? null : (
        <span data-part="end" data-part-end="">
          {end}
        </span>
      )}
      <input
        data-part="hidden-input"
        data-part-hidden-input=""
        name={name}
        readOnly
        type="hidden"
        value={current === null ? '' : toISOTime(current)}
      />
    </>
  );

  const rootProps: TimeFieldRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(isInvalid ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    ...(relativeOpen ? { 'data-relative': '' } : {}),
    'data-cycle': format.usesDayPeriod ? '12' : '24',
    'data-granularity': resolvedGranularity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'time-field',
    'data-variant': resolvedVariant,
    onMouseDown: onRootMouseDown,
    ref: rootRef,
  });

  return render === undefined ? (
    <div {...(rootProps as TimeFieldRootProps & { ref?: React.Ref<HTMLDivElement> })} />
  ) : (
    render(rootProps)
  );
}

/**
 * What one field shows.
 *
 * A finished value is padded to the field's width, so the columns hold their
 * place: `9` and `09` occupy the same box and the separators never step
 * sideways. A value still being typed is **not** padded — it is the digits the
 * reader has put in, in the order they put them.
 */
function segmentText(field: TimeFieldName, format: TimeFormat, segments: SegmentState) {
  const raw = segments[field];
  if (raw === null) return format.pattern.find((part) => part.type === field)?.value ?? '';

  const typing = segments.typing;
  if (typing !== null && typing.field === field) return String(raw).padStart(typing.digits, '0');

  return format.formatValue(raw, field);
}

/**
 * One field of the time, as the spin button the APG's example makes it.
 *
 * `aria-valuetext` is what the reader hears instead of the number, and the day
 * period is why it is not optional: `aria-valuenow` there is `0` or `1`, which
 * is not a name in any language.
 */
function Segment({
  disabled,
  field,
  format,
  onBlur,
  onFocus,
  onKeyDown,
  label,
  readOnly,
  segments,
  tabIndex,
}: {
  disabled: boolean;
  field: TimeFieldName;
  format: TimeFormat;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** The unit's word; the placeholder is drawn, never spoken. */
  label: string;
  readOnly: boolean;
  segments: SegmentState;
  tabIndex: number;
}) {
  const raw = segments[field];
  const range = fieldRange(field, { hourCycle: format.hourCycle });

  const spoken =
    raw === null
      ? undefined
      : field === 'dayPeriod'
        ? format.dayPeriodNames()[raw === 1 ? 1 : 0]
        : String(raw);

  return (
    <div
      aria-disabled={disabled ? true : undefined}
      aria-label={label}
      aria-readonly={readOnly ? true : undefined}
      aria-valuemax={range.max}
      aria-valuemin={range.min}
      aria-valuenow={raw ?? undefined}
      aria-valuetext={spoken}
      data-field={field}
      data-part="segment"
      data-part-segment=""
      {...(raw === null ? { 'data-placeholder': '' } : {})}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      /* Safari does not focus a `div` on a press even when it carries a
         `tabindex`, so the press says so itself rather than relying on it. */
      onMouseDown={(event) => {
        event.preventDefault();
        event.currentTarget.focus();
      }}
      role="spinbutton"
      tabIndex={disabled ? -1 : tabIndex}
    >
      {segmentText(field, format, segments)}
    </div>
  );
}
