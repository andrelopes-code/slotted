import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/datetime-field/datetime-field.css';

import {
  boundSegment,
  clearSegment,
  commitTyping,
  createDateTimeFormat,
  DATE_TIME_UNITS,
  dateTimeOf,
  dayWindow,
  EMPTY_SEGMENTS,
  fieldRange,
  halfOfField,
  incompleteHalf,
  isDateTimeInRange,
  isRelativeKey,
  isSameDateTime,
  isTimeInRange,
  nowDateTimeIn,
  parseDuration,
  resolveRelativeDateTime,
  segmentsOfDateTime,
  stepSegment,
  toISODateTime,
  typeDayPeriod,
  typeDigit,
} from '@slotted/core/date';
import type {
  DateTimeFormat,
  PlainDateTime,
  SegmentFieldName,
  SegmentReference,
  SegmentState,
} from '@slotted/core/date';
import { datetimeFieldMessages } from '@slotted/core/i18n';
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
import { useDateTimeFieldDefaults } from './datetime-field-defaults';
import type {
  DateTimeFieldChangeRequest,
  DateTimeFieldProps,
  DateTimeFieldRootProps,
  DateTimeFieldValueReason,
} from './datetime-field.types';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * Each half pages the way its own family already pages: year 10, month 5 and
 * day 5 from `date-field`, hour 3, minute 15, second 15 and day period 1 from
 * `time-field`. Two fields drawing the same segment and paging it differently
 * would be one behaviour with two answers. What remains is a disagreement with
 * `calendar`, which pages by the month it draws rather than by a unit, and the
 * cost of that is written in the contract.
 */
const PAGE_STEP: Record<SegmentFieldName, number> = {
  year: 10,
  month: 5,
  day: 5,
  hour: 3,
  minute: 15,
  second: 15,
  dayPeriod: 1,
};

/**
 * What an empty segment steps from before the browser has said what time it is.
 *
 * Nothing is drawn from it and no value is derived from it: it is only the
 * datetime `ArrowUp` on an empty field starts from, and the effect below
 * replaces it on the first paint. A real clock read during render would hydrate
 * to different markup on a server and a browser, which is the one thing
 * `frameworks.md` asks a React binding not to do.
 */
const SSR_REFERENCE: PlainDateTime = {
  date: { year: 2000, month: 1, day: 1 },
  time: { hour: 12, minute: 0, second: 0 },
};

/**
 * A segmented datetime control: one spin button per field, in the order the
 * locale writes them, with all seven fields in one row.
 *
 * **It is not a `date-field` beside a `time-field`.** Two nested family roots
 * would be two groups, two values and two `SegmentState`s, and "the reader is
 * typing" would become two questions with two answers. The order of the halves
 * and the literal between them come from one combined `Intl.DateTimeFormat`
 * that neither of them can see, and a digit that fills the last date segment
 * advances across the boundary into the first time segment — which two roots
 * cannot do.
 *
 * **The frame is not the control.** The element carrying `data-ui` is a `div`
 * with no role; `role="group"` is on the row of segments, which is what the
 * APG's spin-button example names as the thing that tells a screen-reader user
 * that the buttons are one value.
 *
 * **The missing half is said out loud.** `value` is `null` until both halves
 * are whole, which every surveyed implementation reports; *which* half is
 * missing is what none of them can say, and it is on the root, on the request,
 * and in the Angular validator.
 *
 * **A datetime can be written as a duration.** `+`, `-` and `=` open one
 * expression region in place of the segments, and `+2d` moves the day — which
 * is where `time-field`'s `crossesMidnight` flag is finally spent.
 */
export function DateTimeField({
  'aria-describedby': describedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  calendar,
  className,
  clearable = false,
  defaultValue,
  disabled,
  end,
  firstDayOfWeek,
  granularity,
  hourCycle,
  id,
  invalid,
  isDateUnavailable,
  isTimeUnavailable,
  locale,
  max,
  messages,
  maxTime,
  min,
  minTime,
  name,
  onKeyDown,
  onPaste: onPasteProp,
  onValueChange,
  readOnly,
  ref,
  referenceDateTime,
  relative,
  render,
  required,
  size,
  start,
  style,
  timeZone,
  value,
  variant,
  yearPivot,
  ...nativeProps
}: DateTimeFieldProps) {
  const field = useField();
  /* The field resolves its label through the control it holds, and warns when
     no control says it is there. */
  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);
  const defaults = useDateTimeFieldDefaults();
  const appLocale = useLocale();
  const t = useMessages(datetimeFieldMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const durationRef = useRef<HTMLInputElement | null>(null);
  const generatedId = useId();

  const resolvedLocale = locale ?? appLocale;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedGranularity = granularity ?? defaults.granularity;
  const resolvedHourCycle = hourCycle ?? defaults.hourCycle;
  const resolvedCalendar = calendar ?? defaults.calendar;
  const resolvedFirstDayOfWeek = firstDayOfWeek ?? defaults.firstDayOfWeek;
  const resolvedYearPivot = yearPivot ?? defaults.yearPivot;
  const resolvedRelative = relative ?? defaults.relative;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required;

  const format = useMemo(
    () =>
      createDateTimeFormat({
        granularity: resolvedGranularity,
        hourCycle: resolvedHourCycle,
        locale: resolvedLocale,
        ...(resolvedFirstDayOfWeek === undefined ? {} : { firstDayOfWeek: resolvedFirstDayOfWeek }),
        ...(resolvedYearPivot === undefined ? {} : { yearPivot: resolvedYearPivot }),
      }),
    [
      resolvedFirstDayOfWeek,
      resolvedGranularity,
      resolvedHourCycle,
      resolvedLocale,
      resolvedYearPivot,
    ],
  );

  /**
   * What datetime it is, resolved after the first paint rather than during it.
   *
   * Nothing is drawn from it — it is the value an empty segment steps to and
   * the anchor a duration resolves against — so the first paint holding a fixed
   * datetime costs nothing a reader can see, and a consumer who needs it stated
   * says `referenceDateTime`.
   */
  const [clock, setClock] = useState<PlainDateTime>(() => SSR_REFERENCE);
  useEffect(() => setClock(nowDateTimeIn(resolvedTimeZone)), [resolvedTimeZone]);
  const anchor = referenceDateTime ?? clock;

  const reference: SegmentReference = useMemo(() => {
    const shown = format.toDisplay(anchor.time.hour);
    return {
      ...anchor.date,
      dayPeriod: shown.dayPeriod ?? 0,
      hour: shown.hour,
      hourCycle: format.hourCycle,
      minute: anchor.time.minute,
      second: anchor.time.second,
    };
  }, [anchor, format]);

  const [ownSegments, setOwnSegments] = useState<SegmentState>(() =>
    segmentsOfDateTime(value ?? defaultValue ?? null, format),
  );
  const [activeField, setActiveField] = useState<SegmentFieldName | undefined>(undefined);
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
   * different datetime. Written on every render it would throw away a
   * half-typed value on the keystroke that completes a different one.
   */
  useEffect(() => {
    if (value === undefined) return;
    if (isSameDateTime(dateTimeOf(segmentsRef.current, format), value)) return;
    segmentsRef.current = segmentsOfDateTime(value, format);
    setOwnSegments(segmentsRef.current);
  }, [format, value]);

  const segments = ownSegments;
  const current = dateTimeOf(segments, format);
  const incomplete = incompleteHalf(segments, format);

  const fields = useMemo(
    () =>
      format.pattern
        .filter((part) => part.type !== 'literal')
        .map((part) => part.type as SegmentFieldName),
    [format],
  );

  /**
   * Moves the segments, and asks before the derived value moves with them.
   *
   * The segments always commit: they are what the control is showing, and a
   * consumer who owns the value does not own the half of a datetime being
   * typed. The value is a request, cancellable, and it carries the segments and
   * the missing half beside it.
   */
  const commit = useCallback(
    (next: SegmentState, reason: DateTimeFieldValueReason, source: unknown) => {
      const previous = dateTimeOf(segmentsRef.current, format);
      segmentsRef.current = next;
      setOwnSegments(next);

      /**
       * A run of typed digits moves the display and not the value. Typing `23`
       * into an hour passes through `2` on the way, and `2` is a time the
       * arithmetic accepts and nobody meant. The request is emitted when the
       * run ends: on the digit that fills the field, on the key that leaves it,
       * or on blur.
       */
      if (next.typing !== null) return;

      const state = createControllable<PlainDateTime | null>({
        controlled: value,
        initial: previous,
        equals: isSameDateTime,
        onRequest: (request) => {
          onValueChange?.(request.value, {
            ...request,
            incomplete: incompleteHalf(next, format),
            segments: next,
          } as DateTimeFieldChangeRequest);
        },
      });
      state.request(dateTimeOf(next, format), reason, source);
    },
    [format, onValueChange, value],
  );

  const focusField = useCallback((field: SegmentFieldName) => {
    setActiveField(field);
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-part="segment"][data-field="${field}"]`)
      ?.focus();
  }, []);

  /**
   * Where a press on the frame puts the reader: the first field still waiting
   * for a value, and the first field of the value when none is. Every text
   * control on the page answers a press anywhere inside its border, and this
   * one has to as well.
   */
  const focusEntry = useCallback(() => {
    const held = read();
    const empty = fields.find((name) => held[name] === null);
    const target = empty ?? fields[0];
    if (target !== undefined) focusField(target);
  }, [fields, focusField]);

  /**
   * The arrows and a finished run of digits walk the whole row, across the
   * boundary between the halves. Two nested fields would both stop there, which
   * is the third reason this family draws one row.
   */
  const moveBy = useCallback(
    (name: SegmentFieldName, step: number) => {
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

  /**
   * What the expression resolves to, or `null` while it says nothing yet.
   *
   * The unit set is the wider one: `d` and `w` beside `h`, `m` and `s`. The
   * widening is additive — `parseDuration` still defaults to the three a time
   * alone can mean — so `time-field` refuses a `d` exactly as it did.
   */
  const resolved = useMemo(() => {
    if (expression === null) return null;
    const seconds = parseDuration(expression, { units: DATE_TIME_UNITS });
    return seconds === null ? null : resolveRelativeDateTime(anchor, seconds);
  }, [anchor, expression]);

  /** Whether the expression landed on a different day from the anchor's. */
  const rollsDay =
    resolved !== null &&
    (resolved.date.year !== anchor.date.year ||
      resolved.date.month !== anchor.date.month ||
      resolved.date.day !== anchor.date.day);

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
      commit(segmentsOfDateTime(resolved, format), 'keyboard', source);
      setExpression(null);
    },
    [commit, format, resolved],
  );

  /**
   * A key the field acted on is the field's, and nothing above it sees it.
   *
   * A `div` with `role="spinbutton"` is not an `input`, a `textarea` or
   * `contenteditable`, so every "is the target editable" guard an application
   * writes misses it and a reader typing a datetime fires every single-key
   * shortcut on the page. `preventDefault` alone does not help: a shortcut
   * handler reads the key, not the default. Recorded first by `date-field`.
   */
  const consume = (event: KeyboardEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onSegmentKeyDown = (name: SegmentFieldName) => (event: KeyboardEvent<HTMLDivElement>) => {
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
     * `Alt` with an arrow is not this control's chord. `datetime-picker` opens
     * its panel with `Alt`+`ArrowDown`, and a segment that stepped on it would
     * eat the only shortcut the surface has.
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
      const typed = typeDayPeriod(read(), event.key, format.time);
      if (typed === null) return;
      consume(event);
      commit(typed.segments, 'keyboard', event);
      if (typed.advance) moveBy(name, 1);
      return;
    }

    if (/^\d$/.test(event.key)) {
      consume(event);
      const typed = typeDigit(read(), name, Number(event.key), format.time, reference);
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
         the field takes it first while an expression is open, which is the
         staging `datetime-picker` depends on. */
      consume(event);
      closeExpression();
    }
  };

  /**
   * A whole value, pasted. The locale's shape is read first and ISO 8601 after
   * it; text that is neither but reads as a duration opens the expression, so
   * pasting `+2d` does what typing it does.
   */
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    onPasteProp?.(event as never);
    if (event.defaultPrevented || !editable) return;

    const text = event.clipboardData.getData('text/plain');
    const parsed = format.parse(text);
    if (parsed !== null) {
      event.preventDefault();
      commit(segmentsOfDateTime(parsed, format), 'keyboard', event);
      return;
    }

    if (resolvedRelative && parseDuration(text, { units: DATE_TIME_UNITS }) !== null) {
      event.preventDefault();
      setExpression(text.trim());
    }
  };

  /** A run of typed digits ends when focus leaves. */
  const onSegmentBlur = () => {
    setActiveField(undefined);
    const held = read();
    if (held.typing === null) return;
    commit(commitTyping(held, format.time, reference), 'blur', undefined);
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
   * `aria-labelledby`, so the reader hears the datetime without visiting every
   * button and remembering each.
   */
  const valueTextId = `${generatedId}-value`;
  const spoken = current === null ? undefined : format.describe(current);

  /**
   * Validity the family owns, beside the validity the consumer states.
   *
   * Both pairs of bounds apply at once — the whole-value one and the window
   * that repeats on every day — which is the combination MUI's own validation
   * page records that it cannot ship.
   */
  const window = current === null ? null : dayWindow(current.date, { max, maxTime, min, minTime });
  const outOfRange =
    current !== null &&
    (!isDateTimeInRange(current, min, max) ||
      window === null ||
      !isTimeInRange(current.time, window.earliest, window.latest));
  const unavailable =
    current !== null &&
    (isDateUnavailable?.(current.date) === true ||
      isTimeUnavailable?.(current.time, current.date) === true);
  const isInvalid = resolvedInvalid === true || unavailable || outOfRange;

  const empty = fields.every((name) => segments[name] === null);
  const showClear = clearable && !empty && editable && !relativeOpen;

  /* One box per half, and the only place the row is allowed to break. */
  const halves = useMemo(() => {
    const groups: { half: 'date' | 'time'; parts: typeof format.pattern }[] = [];
    for (const part of format.pattern) {
      const owner = part.half ?? 'date';
      const last = groups[groups.length - 1];
      if (last !== undefined && last.half === owner) {
        (last.parts as unknown as (typeof part)[]).push(part);
      } else {
        groups.push({ half: owner, parts: [part] as unknown as typeof format.pattern });
      }
    }
    return groups;
  }, [format]);

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
            placeholder="+40m, 1h30, +2d"
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
            {...(rollsDay ? { 'data-rolls-day': '' } : {})}
          >
            <Icon directional>
              <Glyph name="chevron-right" />
            </Icon>
            {resolved === null ? (
              ''
            ) : rollsDay ? (
              <>
                {/* The day moved, which is what `+2d` is for. The date is
                    written out and lifted from the time beside it, so the eye
                    lands on the part that moved — where `time-field` has to
                    raise a warning, because a `PlainTime` has no day. */}
                <span data-part="preview-date" data-part-preview-date="">
                  {format.describeDate(resolved.date, 'short')}
                </span>
                {', '}
                {format.time.format(resolved.time)}
              </>
            ) : (
              format.time.format(resolved.time)
            )}
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
          {halves.map((group) => (
            <span data-half={group.half} data-part="half" data-part-half="" key={group.half}>
              {group.parts.map((part, index) => {
                if (part.type === 'literal') {
                  /* A boundary the locale writes as whitespace alone is not
                     drawn: the row's own column gap already separates the
                     halves, and a space beside that gap is twice the distance
                     the locale asked for. */
                  if (part.boundary === true && part.drawn === false) return null;
                  return (
                    <span
                      aria-hidden="true"
                      data-part="literal"
                      data-part-literal=""
                      key={`literal-${group.half}-${String(index)}`}
                      {...(part.boundary === true ? { 'data-boundary': '' } : {})}
                    >
                      {part.value}
                    </span>
                  );
                }

                const name = part.type as SegmentFieldName;
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
            </span>
          ))}
        </div>
      )}
      {/* The whole value in words, for the group's own accessible name. */}
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
        value={current === null ? '' : toISODateTime(current)}
      />
    </>
  );

  const rootProps: DateTimeFieldRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(isInvalid ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    ...(relativeOpen ? { 'data-relative': '' } : {}),
    ...(incomplete === null ? {} : { 'data-incomplete': incomplete }),
    'data-calendar': resolvedCalendar,
    'data-cycle': format.usesDayPeriod ? '12' : '24',
    'data-granularity': resolvedGranularity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'datetime-field',
    'data-variant': resolvedVariant,
    onMouseDown: onRootMouseDown,
    ref: rootRef,
  }) as DateTimeFieldRootProps;

  return render === undefined ? (
    <div {...(rootProps as DateTimeFieldRootProps & { ref?: React.Ref<HTMLDivElement> })} />
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
function segmentText(field: SegmentFieldName, format: DateTimeFormat, segments: SegmentState) {
  const raw = segments[field];
  if (raw === null) return format.pattern.find((part) => part.type === field)?.value ?? '';

  const typing = segments.typing;
  if (typing !== null && typing.field === field) return String(raw).padStart(typing.digits, '0');

  return format.formatValue(raw, field);
}

/**
 * One field of the value, as the spin button the APG's example makes it.
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
  field: SegmentFieldName;
  format: DateTimeFormat;
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
  /* The day's own maximum is the month's, which is why the range is asked with
     the year and the month rather than assumed to be 31. */
  const range = fieldRange(field, {
    hourCycle: format.hourCycle,
    ...(segments.month === null ? {} : { month: segments.month }),
    ...(segments.year === null ? {} : { year: segments.year }),
  });

  const spoken =
    raw === null
      ? undefined
      : field === 'dayPeriod'
        ? format.dayPeriodNames()[raw === 1 ? 1 : 0]
        : field === 'month'
          ? format.date.monthNames('long')[raw - 1]
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
      data-half={halfOfField(field)}
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
