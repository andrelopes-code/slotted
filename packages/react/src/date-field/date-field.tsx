import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/date-field/date-field.css';

import {
  boundSegment,
  clearSegment,
  commitTyping,
  createDateFormat,
  dateOf,
  EMPTY_SEGMENTS,
  fieldRange,
  isDateInRange,
  isSameDate,
  parseISOYearMonth,
  plainDate,
  segmentsOf,
  stepSegment,
  toISODate,
  toISOYearMonth,
  todayIn,
  typeDigit,
  yearMonthPattern,
} from '@slotted/core/date';
import type { DateFieldName, PlainDate, SegmentState } from '@slotted/core/date';
import { dateFieldMessages } from '@slotted/core/i18n';
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
import { useDateFieldDefaults } from './date-field-defaults';
import type {
  DateFieldChangeRequest,
  DateFieldProps,
  DateFieldRootProps,
  DateFieldValueReason,
} from './date-field.types';

/**
 * How far `PageUp` and `PageDown` move each field.
 *
 * Five is the APG spin-button example's step, adopted for the day and the
 * month. The year departs: five years is not a page of years, and ten is the
 * step the calendar's own year view pages by, so the two agree. The cost is
 * written in `specs/components/date-field/contract.json` under `departures`.
 */
const PAGE_STEP: Record<DateFieldName, number> = { day: 5, month: 5, year: 10 };

/**
 * What an empty segment steps from before the browser has said what day it is.
 *
 * Nothing is drawn from it and no value is derived from it: it is only the
 * date `ArrowUp` on an empty field starts from, and the effect below replaces
 * it on the first paint. A real date read during render would hydrate to
 * different markup on a server and a browser in different zones, which is the
 * one thing `frameworks.md` asks a React binding not to do.
 */
const SSR_REFERENCE = plainDate(2000, 1, 1);

/**
 * A segmented date control: one spin button per field, in the order the
 * locale writes them.
 *
 * **The frame is not the control.** The element carrying `data-ui` is a `div`
 * with no role; `role="group"` is on the row of segments, which is what the
 * APG's spin-button example names as the thing that tells a screen-reader user
 * that three buttons are one date. The clear button is the group's sibling.
 *
 * **There is no `input[type=date]` under any of it.** The browser's own control
 * cannot be styled, cannot be given the application's own calendar, and takes
 * its field order from the browser's locale rather than the application's. The
 * value still reaches a plain form post, through a hidden input carrying the
 * ISO string — the decision `currency-field` already took for a number.
 *
 * **The segments are the state and the value is derived.** A date with a day
 * and a month and no year is not a date, so `value` is `null` — and that is not
 * the same as an empty field. Every surveyed implementation holds a whole date
 * or nothing and cannot say the difference; the request carries the segments so
 * a consumer can.
 *
 * **Unset means ask the field.** `disabled`, `readOnly`, `invalid` and
 * `required` default to `undefined` rather than `false`, which is what makes
 * "not disabled" and "said nothing" different answers.
 */
export function DateField({
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
  id,
  invalid,
  isDateUnavailable,
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
}: DateFieldProps) {
  const field = useField();
  /* The field resolves its label through the control it holds, and warns when
     no control says it is there. */
  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);
  const defaults = useDateFieldDefaults();
  const appLocale = useLocale();
  const t = useMessages(dateFieldMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();

  const resolvedLocale = locale ?? appLocale;
  const resolvedFirstDay = firstDayOfWeek ?? defaults.firstDayOfWeek;
  const resolvedPivot = yearPivot ?? defaults.yearPivot;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedCalendar = calendar ?? defaults.calendar;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedRequired = required ?? field?.required;

  const format = useMemo(
    () =>
      createDateFormat({
        locale: resolvedLocale,
        firstDayOfWeek: resolvedFirstDay,
        yearPivot: resolvedPivot,
      }),
    [resolvedFirstDay, resolvedLocale, resolvedPivot],
  );

  /**
   * Which day it is, resolved after the first paint rather than during it.
   *
   * A server and a browser in different zones disagree about today, and a
   * value read during render would hydrate to different markup on the two
   * sides. Nothing is drawn from it — it is the date an empty segment steps to
   * — so the first paint being a day behind costs nothing a reader can see.
   */
  const [reference, setReference] = useState<PlainDate>(() => SSR_REFERENCE);
  useEffect(() => setReference(todayIn(resolvedTimeZone)), [resolvedTimeZone]);

  const [ownSegments, setOwnSegments] = useState<SegmentState>(() =>
    segmentsOf(value ?? defaultValue ?? null),
  );
  const [activeField, setActiveField] = useState<DateFieldName | undefined>(undefined);

  /**
   * The segments as they are *now*, not as they were when this render began.
   *
   * Moving focus to the next segment fires the previous one's `blur` inside the
   * same event, before React has re-rendered — so a `blur` handler reading the
   * render's own state reads the state from before the keystroke and writes it
   * back over the digit just accepted. Typing `1` then `2` into a day left `01`
   * and moved on, which is what the first run of this family's spec showed.
   */
  const segmentsRef = useRef(ownSegments);
  const read = () => segmentsRef.current;

  /**
   * The consumer's value writes the segments, and only when it names a
   * different date. Written on every render it would throw away a half-typed
   * date on the keystroke that completes a different one.
   */
  useEffect(() => {
    if (value === undefined) return;
    if (isSameDate(dateOf(segmentsRef.current), value)) return;
    segmentsRef.current = segmentsOf(value);
    setOwnSegments(segmentsRef.current);
  }, [value]);

  const segments = ownSegments;
  const current = dateOf(segments);

  /** A field that holds a month draws the locale's pattern without its day. */
  const monthly = granularity === 'month';
  const pattern = useMemo(
    () => (monthly ? yearMonthPattern(format.pattern) : format.pattern),
    [format, monthly],
  );

  const fields = useMemo(
    () =>
      pattern.filter((part) => part.type !== 'literal').map((part) => part.type as DateFieldName),
    [pattern],
  );

  /**
   * Moves the segments, and asks before the derived value moves with them.
   *
   * The segments always commit: they are what the control is showing, and a
   * consumer who owns the value does not own the half of a date being typed.
   * The value is a request, cancellable, and it carries the segments beside it.
   */
  const commit = useCallback(
    (given: SegmentState, reason: DateFieldValueReason, source: unknown) => {
      /* A month has no day segment to fill, so the day is the first of it. */
      const next = monthly && given.day !== 1 ? { ...given, day: 1, intendedDay: 1 } : given;
      const previous = dateOf(segmentsRef.current);
      segmentsRef.current = next;
      setOwnSegments(next);

      /**
       * A run of typed digits moves the display and not the value. Typing
       * `2026` into a year passes through 2, 20 and 202 on the way, and every
       * one of those is a date the arithmetic accepts — so a consumer writing
       * each request to a server would ask it about the year 2. The request is
       * emitted when the run ends: on the digit that fills the field, on the
       * key that leaves it, or on blur, which is where a short year resolves.
       */
      if (next.typing !== null) return;

      const state = createControllable<PlainDate | null>({
        controlled: value,
        initial: previous,
        equals: isSameDate,
        onRequest: (request) => {
          onValueChange?.(request.value, { ...request, segments: next } as DateFieldChangeRequest);
        },
      });
      state.request(dateOf(next), reason, source);
    },
    [monthly, onValueChange, value],
  );

  const focusField = useCallback((name: DateFieldName) => {
    setActiveField(name);
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-part="segment"][data-field="${name}"]`)
      ?.focus();
  }, []);

  /**
   * Where a press on the frame puts the reader: the first field still waiting
   * for a value, and the first field of the date when none is.
   *
   * A press that landed on the frame's own padding, on the gap between two
   * fields or on an adornment did nothing at all — the reader saw a control
   * that looked like a text field and answered like a picture. Every text
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
    (name: DateFieldName, step: number) => {
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

  /**
   * A key the field acted on is the field's, and nothing above it sees it.
   *
   * Every application that binds a bare key guards it with "is the target an
   * editable element", and that guard tests for `input`, `textarea` and
   * `contenteditable`. A `div` with `role="spinbutton"` is none of the three,
   * so a reader typing a date into this control fires every single-key
   * shortcut on the page: in Storybook, pressing `1` moved focus out of the
   * story and into the sidebar, and the date could not be typed at all.
   *
   * `preventDefault` alone does not help — a shortcut handler reads the key,
   * not the default. The event has to stop.
   */
  const consume = (event: KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onSegmentKeyDown = (name: DateFieldName) => (event: KeyboardEvent<HTMLDivElement>) => {
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
     * `Alt` with an arrow is not this control's chord. `date-picker` opens its
     * calendar with `Alt`+`ArrowDown`, and a segment that stepped on it would
     * eat the only shortcut the surface has — which is what the first run of
     * the picker's spec showed.
     */
    if (event.altKey) return;

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
      case 'Backspace':
      case 'Delete':
        consume(event);
        commit(clearSegment(read(), name), 'clear', event);
        return;
      case 'End':
        consume(event);
        commit(boundSegment(read(), name, 'max', reference), 'keyboard', event);
        return;
      default:
        break;
    }

    if (/^\d$/.test(event.key)) {
      consume(event);
      const typed = typeDigit(read(), name, Number(event.key), format, reference);
      commit(typed.segments, 'keyboard', event);
      if (typed.advance) moveBy(name, 1);
    }
  };

  /**
   * A whole date, pasted. The locale's shape is read first and ISO 8601 after
   * it, so `12/03/2026` is December to an American and March to a Brazilian
   * while `2026-09-09` is the ninth to both.
   */
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    onPasteProp?.(event as never);
    if (event.defaultPrevented || !editable) return;
    const text = event.clipboardData.getData('text/plain');
    const month = monthly ? parseISOYearMonth(text) : null;
    const parsed = month === null ? format.parse(text) : plainDate(month.year, month.month, 1);
    if (parsed === null) return;
    event.preventDefault();
    commit(segmentsOf(parsed), 'keyboard', event);
  };

  /** A run of typed digits ends when focus leaves, and a short year resolves. */
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
    focusEntry();
  };

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    commit(EMPTY_SEGMENTS, 'clear', event);
    const first = fields[0];
    if (first !== undefined) focusField(first);
  };

  /**
   * What a screen reader is told the group holds. The APG's example names the
   * whole date in a hidden element referenced by the group's own
   * `aria-labelledby`, so the reader hears the date without visiting all three
   * buttons and remembering each.
   */
  const valueTextId = `${generatedId}-value`;
  const spoken =
    current === null ? undefined : monthly ? format.monthYear(current) : format.describe(current);

  /**
   * Validity the family owns, beside the validity the consumer states. A date
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because the control is the only thing that knows.
   */
  const unavailable = current !== null && isDateUnavailable?.(current) === true;
  const outOfRange = current !== null && !isDateInRange(current, min, max);
  const isInvalid = resolvedInvalid === true || unavailable || outOfRange;

  const empty = fields.every((name) => segments[name] === null);
  const showClear = clearable && !empty && editable;

  const children: ReactNode = (
    <>
      {start === undefined ? null : (
        <span data-part="start" data-part-start="">
          {start}
        </span>
      )}
      <div
        aria-describedby={[describedBy, field?.describedBy].filter(Boolean).join(' ') || undefined}
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
        {pattern.map((part, index) => {
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
              reference={reference}
              segments={segments}
              tabIndex={name === (activeField ?? fields[0]) ? 0 : -1}
            />
          );
        })}
      </div>
      {/* The whole date in words, for the group's own accessible name. */}
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
        value={
          current === null
            ? ''
            : monthly
              ? toISOYearMonth({ year: current.year, month: current.month })
              : toISODate(current)
        }
      />
    </>
  );

  const rootProps: DateFieldRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(isInvalid ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    'data-calendar': resolvedCalendar,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'date-field',
    'data-variant': resolvedVariant,
    onMouseDown: onRootMouseDown,
    ref: rootRef,
  });

  return render === undefined ? (
    <div {...(rootProps as DateFieldRootProps & { ref?: React.Ref<HTMLDivElement> })} />
  ) : (
    render(rootProps)
  );
}

/**
 * What one field shows.
 *
 * A finished value is padded to the field's width, so the three columns hold
 * their place: `9` and `09` occupy the same box and the separators never step
 * sideways. A value still being typed is **not** padded — it is the digits the
 * reader has put in, in the order they put them. Padded, a year on its way to
 * 2026 read `0002`, then `0020`, then `0202`, which is three numbers nobody
 * typed and a reader watching their own year turn into something else.
 */
function segmentText({
  field,
  format,
  reference,
  segments,
}: {
  field: DateFieldName;
  format: ReturnType<typeof createDateFormat>;
  reference: PlainDate;
  segments: SegmentState;
}) {
  const raw = segments[field];
  if (raw === null) return format.pattern.find((part) => part.type === field)?.value ?? '';

  const typing = segments.typing;
  if (typing !== null && typing.field === field) {
    return String(raw).padStart(typing.digits, '0');
  }

  return format.formatField(
    {
      year: segments.year ?? reference.year,
      month: segments.month ?? reference.month,
      day: segments.day ?? reference.day,
    },
    field,
  );
}

/**
 * One field of the date, as the spin button the APG's example makes it.
 *
 * `aria-valuetext` is what the reader hears instead of the number: a month
 * announces its name, because "nine" is not September in any language the
 * reader is likely to be thinking in.
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
  reference,
  segments,
  tabIndex,
}: {
  disabled: boolean;
  field: DateFieldName;
  format: ReturnType<typeof createDateFormat>;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** The unit's word; the placeholder is drawn, never spoken. */
  label: string;
  readOnly: boolean;
  reference: PlainDate;
  segments: SegmentState;
  tabIndex: number;
}) {
  const raw = segments[field];
  const range = fieldRange(field, {
    year: segments.year ?? reference.year,
    month: segments.month ?? reference.month,
  });

  const spoken =
    raw === null
      ? undefined
      : field === 'month'
        ? (format.monthNames('long')[raw - 1] ?? String(raw))
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
      {segmentText({ field, format, reference, segments })}
    </div>
  );
}
