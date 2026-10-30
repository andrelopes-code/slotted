import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/datetime-range-picker/datetime-range-picker.css';

import {
  blockedAround,
  compareDateTime,
  createDateTimeFormat,
  createTimeFormat,
  dateTimeRangeProblems,
  dateTimeRangeSeconds,
  dayWindow,
  firstUnavailableIndex,
  hourJump,
  isDateRefusedInRun,
  isSameDate,
  isSameTime,
  isTruncated,
  nearestIndex,
  openingIndex as openingIndexOf,
  nowDateTimeIn,
  orderedRun,
  runRefusal,
  timeList,
  toISODateTime,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { datetimeRangePickerMessages } from '@slotted/core/i18n';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Calendar } from '../calendar';
import type { CalendarHandle, CalendarValue, CalendarView } from '../calendar';
import { DateTimeField } from '../datetime-field';
import type { DateTimeFieldChangeRequest, DateTimeFieldHandle } from '../datetime-field';
import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { useDateTimeRangePickerDefaults } from './datetime-range-picker-defaults';
import type {
  DateTimeRange,
  DateTimeRangePickerHighlight,
  DateTimeRangePickerPosition,
  DateTimeRangePickerPresetProps,
  DateTimeRangePickerPresetRootProps,
  DateTimeRangePickerProps,
  DateTimeRangePickerRootProps,
  DateTimeRangePickerValueReason,
} from './datetime-range-picker.types';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * The number is here as well as in the stylesheet because the DOM has to say
 * which presentation it is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** How far `contiguous` looks for an unavailable day when no `maxLength` bounds it. */
const CONTIGUOUS_SEARCH = 366;

/** What an empty panel steps from before the browser has said what day it is. */
const SSR_REFERENCE: PlainDateTime = {
  date: { year: 2026, month: 1, day: 1 },
  time: { hour: 12, minute: 0, second: 0 },
};

const MIDNIGHT: PlainTime = { hour: 0, minute: 0, second: 0 };

/** One end of the work: its two halves, each of which may still be missing. */
interface Half {
  readonly date: PlainDate | null;
  readonly time: PlainTime | null;
}
interface Work {
  readonly start: Half;
  readonly end: Half;
}

const NO_HALF: Half = { date: null, time: null };
const EMPTY: Work = { start: NO_HALF, end: NO_HALF };
const NO_HIGHLIGHT: DateTimeRangePickerHighlight = { start: null, end: null };

type PositionReason = 'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic';
type HighlightReason = 'pointer' | 'keyboard' | 'programmatic';

interface PresetContextValue {
  readonly held: DateTimeRange | null;
  choose(range: DateTimeRange, event: MouseEvent<HTMLElement>): void;
}

const PresetContext = createContext<PresetContextValue | null>(null);

/** The one word for nothing: a value whose both ends are `null` is `null`. */
function normalize(range: DateTimeRange | null): DateTimeRange | null {
  return range === null || (range.start === null && range.end === null) ? null : range;
}

function isSameDateTime(a: PlainDateTime | null, b: PlainDateTime | null): boolean {
  if (a === null || b === null) return a === b;
  return compareDateTime(a, b) === 0;
}

export function isSameDateTimeRange(a: DateTimeRange | null, b: DateTimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return isSameDateTime(a.start, b.start) && isSameDateTime(a.end, b.end);
}

/**
 * Scrolls the list alone. `scrollIntoView` would scroll every ancestor too,
 * and a page with an open surface must not jump when a list opens on its
 * highlight. Centerd when the list opens, and by the least that lands the row
 * whole when a key moves the highlight. jsdom measures nothing, so it is a
 * no-op there rather than a throw.
 */
function revealRow(list: HTMLElement, row: HTMLElement, center: boolean) {
  const box = list.getBoundingClientRect();
  const cell = row.getBoundingClientRect();
  if (box.height === 0 || cell.height === 0) return;
  const above = cell.top - box.top;
  if (center) list.scrollTop += above - (box.height - cell.height) / 2;
  else if (above < 0) list.scrollTop += above;
  else if (cell.bottom > box.bottom) list.scrollTop += cell.bottom - box.bottom;
}

function other(position: DateTimeRangePickerPosition): DateTimeRangePickerPosition {
  return position === 'start' ? 'end' : 'start';
}

function halfOf(value: PlainDateTime | null): Half {
  return value === null ? NO_HALF : { date: value.date, time: value.time };
}

function wholeOf(half: Half): PlainDateTime | null {
  return half.date === null || half.time === null ? null : { date: half.date, time: half.time };
}

function workOf(range: DateTimeRange | null): Work {
  return range === null ? EMPTY : { start: halfOf(range.start), end: halfOf(range.end) };
}

function rangeOf(work: Work): DateTimeRange | null {
  return normalize({ start: wholeOf(work.start), end: wholeOf(work.end) });
}

/**
 * A one-line frame — the value in words, a clear and the trigger — and behind
 * it one end at a time: two tabs, the field of the current end, a hint, the
 * range calendar and the list of that end.
 *
 * **The frame is one line at any width**, for the reason `time-range-picker`
 * records. The field lives in the panel's band, where the reader types.
 *
 * **One calendar for the two dates, and the list of the current end.** The
 * grid draws the run and its pending band the way `date-range-picker` does;
 * the list runs on the day of the current end — or on the grid's focused day
 * while the end has none — and says the duration beside each row while the
 * two ends are on the same day.
 *
 * **The press that leaves the work incomplete carries focus to the half that
 * is missing; the press that completes it closes the panel.** The rule
 * `datetime-picker` wrote, once per end.
 */
export function DateTimeRangePicker({
  calendar,
  className,
  clearable = false,
  closeOnSelect,
  contiguous = true,
  defaultHighlighted,
  defaultOpen = false,
  defaultPosition = 'start',
  defaultValue,
  disabled,
  endName,
  firstDayOfWeek,
  fixedWeeks = true,
  footer,
  granularity,
  highlighted,
  hourCycle,
  invalid,
  isDateUnavailable,
  isTimeUnavailable,
  lengthLabel,
  locale,
  max,
  maxLength,
  maxOptions,
  messages,
  maxTime,
  min,
  minLength,
  minTime,
  months,
  onHighlightedChange,
  onKeyDown,
  onOpenChange,
  onPositionChange,
  onValueChange,
  open,
  options,
  placement,
  position,
  presets,
  readOnly,
  ref,
  referenceDateTime,
  relative,
  render,
  renderOption,
  required,
  size,
  startName,
  step,
  style,
  timeZone,
  unavailableOptions,
  value,
  variant,
  weekNumbers,
  yearPivot,
  ...nativeProps
}: DateTimeRangePickerProps) {
  const field = useField();
  const defaults = useDateTimeRangePickerDefaults();
  const appLocale = useLocale();
  const t = useMessages(datetimeRangePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fieldRef = useRef<DateTimeFieldHandle | null>(null);
  const fieldBox = useRef<HTMLDivElement | null>(null);
  const calendarHandle = useRef<CalendarHandle | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<DateTimeRangePickerPosition, HTMLButtonElement | null>>({
    start: null,
    end: null,
  });
  const contentId = useId();

  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the surface: the control took focus or a
   * press. The portal's layer is made then, because making it reads the
   * trigger's computed style, and a read in the open's own task is a style
   * recalculation the first frame waits for.
   */
  const [warm, setWarm] = useState(false);
  const [sheet, setSheet] = useState(false);

  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const [ownValue, setOwnValue] = useState<DateTimeRange | null>(normalize(defaultValue ?? null));
  const held = value === undefined ? ownValue : normalize(value);
  const [ownPosition, setOwnPosition] = useState<DateTimeRangePickerPosition>(defaultPosition);
  const currentPosition = position ?? ownPosition;
  const [ownHighlight, setOwnHighlight] = useState<DateTimeRangePickerHighlight>(
    defaultHighlighted ?? NO_HIGHLIGHT,
  );
  const highlight = highlighted ?? ownHighlight;
  const [view, setView] = useState<CalendarView>('day');

  /**
   * The work: the two ends as the reader left them while the panel is open,
   * each with its date and time as two halves. A press in the grid or a list
   * writes one half; the value is asked for when all four are there. Closed
   * by anything, it is thrown away and rebuilt from the value on the next
   * open.
   */
  const [work, setWork] = useState<Work>(() => workOf(held));
  /** The pending end the calendar reports, or `null` while no run is open. */
  const [preview, setPreview] = useState<PlainDate | null>(null);
  /** The option under the pointer, which enters the duration and nothing else. */
  const [hovered, setHovered] = useState<{
    position: DateTimeRangePickerPosition;
    time: PlainTime;
  } | null>(null);
  const [listFocused, setListFocused] = useState(false);

  const resolvedLocale = locale ?? appLocale;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedCalendar = calendar ?? defaults.calendar;
  const resolvedGranularity = granularity ?? defaults.granularity;
  const resolvedHourCycle = hourCycle ?? defaults.hourCycle;
  const resolvedFirstDay = firstDayOfWeek ?? defaults.firstDayOfWeek;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedPlacement = placement ?? defaults.placement;
  const resolvedCloseOnSelect = closeOnSelect ?? defaults.closeOnSelect;
  const resolvedStep = step ?? defaults.step;
  const resolvedMaxOptions = maxOptions ?? defaults.maxOptions;
  const resolvedMonths = months ?? defaults.months;
  const resolvedUnavailable = unavailableOptions ?? defaults.unavailableOptions;
  const lengthLabelOf = lengthLabel ?? defaults.lengthLabel;
  const resolvedLengthLabel = useCallback(
    (seconds: number) => lengthLabelOf(seconds, resolvedLocale),
    [lengthLabelOf, resolvedLocale],
  );
  /** The name of one end: the field's, its tab's and the hint's `{end}`. */
  const labelOf = (position: DateTimeRangePickerPosition) => t(position);
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedRequired = required ?? field?.required;
  const editable = resolvedDisabled !== true && resolvedReadOnly !== true;

  const format = useMemo(
    () =>
      createDateTimeFormat({
        granularity: resolvedGranularity,
        hourCycle: resolvedHourCycle,
        locale: resolvedLocale,
        ...(resolvedFirstDay === undefined ? {} : { firstDayOfWeek: resolvedFirstDay }),
        ...(yearPivot === undefined ? {} : { yearPivot }),
      }),
    [resolvedFirstDay, resolvedGranularity, resolvedHourCycle, resolvedLocale, yearPivot],
  );

  /* A time alone in a tab — the reader chose an hour before a day. */
  const timeFormat = useMemo(
    () =>
      createTimeFormat({
        granularity: resolvedGranularity,
        hourCycle: resolvedHourCycle,
        locale: resolvedLocale,
      }),
    [resolvedGranularity, resolvedHourCycle, resolvedLocale],
  );

  const [clock, setClock] = useState<PlainDateTime>(() => SSR_REFERENCE);
  useEffect(() => setClock(nowDateTimeIn(resolvedTimeZone)), [resolvedTimeZone]);
  const anchor = referenceDateTime ?? clock;

  const bounds = useMemo(() => ({ max, maxTime, min, minTime }), [max, maxTime, min, minTime]);

  const start = held?.start ?? null;
  const end = held?.end ?? null;
  const ordered = start !== null && end !== null && compareDateTime(start, end) <= 0;

  /**
   * Validity the family owns, beside the validity the consumer states: both
   * pairs of bounds, the two predicates, the order of the two ends and the
   * duration.
   */
  const problems = useMemo(
    () =>
      dateTimeRangeProblems(held, {
        contiguous,
        max,
        maxLength,
        maxTime,
        min,
        minLength,
        minTime,
        unavailableDay: isDateUnavailable,
        unavailableTime: isTimeUnavailable,
      }),
    [
      contiguous,
      held,
      isDateUnavailable,
      isTimeUnavailable,
      max,
      maxLength,
      maxTime,
      min,
      minLength,
      minTime,
    ],
  );
  const resolvedInvalid = invalid ?? (problems.length > 0 ? true : field?.invalid);

  /* ── State ───────────────────────────────────────────────────────────── */

  const setOpen = useCallback(
    (
      next: boolean,
      reason: 'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'select',
      source: unknown,
    ) => {
      const state = createControllable<boolean>({
        controlled: open,
        initial: isOpen,
        onRequest: (request) => onOpenChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnOpen(next);
    },
    [isOpen, onOpenChange, open],
  );

  const requestValue = useCallback(
    (next: DateTimeRange | null, reason: DateTimeRangePickerValueReason, source: unknown) => {
      const normalized = normalize(next);
      const state = createControllable<DateTimeRange | null>({
        controlled: value === undefined ? undefined : held,
        initial: held,
        equals: isSameDateTimeRange,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(normalized, reason, source)) setOwnValue(normalized);
    },
    [held, onValueChange, value],
  );

  const requestPosition = useCallback(
    (next: DateTimeRangePickerPosition, reason: PositionReason, source: unknown) => {
      const state = createControllable<DateTimeRangePickerPosition>({
        controlled: position,
        initial: currentPosition,
        onRequest: (request) => onPositionChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnPosition(next);
    },
    [currentPosition, onPositionChange, position],
  );

  const requestHighlight = useCallback(
    (next: DateTimeRangePickerHighlight, reason: HighlightReason, source: unknown) => {
      const state = createControllable<DateTimeRangePickerHighlight>({
        controlled: highlighted,
        initial: highlight,
        equals: (a, b) => isSameTime(a.start, b.start) && isSameTime(a.end, b.end),
        onRequest: (request) => onHighlightedChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnHighlight(next);
    },
    [highlight, highlighted, onHighlightedChange],
  );

  /* The work starts from the value every time the panel opens, and the tab
     opens on the first end with a half missing; with a whole value, where it was. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setWork(workOf(held));
      setHovered(null);
      setPreview(null);
      const missing: DateTimeRangePickerPosition | null =
        held?.start == null ? 'start' : held.end === null ? 'end' : null;
      if (missing !== null && missing !== currentPosition) {
        requestPosition(missing, 'programmatic', undefined);
      }
    }
    wasOpen.current = isOpen;
  }, [currentPosition, held, isOpen, requestPosition]);

  /* ── The grid ────────────────────────────────────────────────────────── */

  /**
   * The day the grid has focused. The family holds it — rather than the
   * calendar alone — because a list of an end with no date runs on it, and
   * because the panel opens on the current end's day or on today.
   */
  const [focusedDate, setFocusedDate] = useState<PlainDate>(
    () => (held?.start ?? held?.end ?? anchor).date,
  );
  useEffect(() => {
    if (!isOpen) return;
    const target = (currentPosition === 'end' ? work.end.date : work.start.date) ?? anchor.date;
    setFocusedDate(target);
    /* Only when the surface opens: the day is the reader's after that. */
  }, [isOpen]);

  /**
   * What the calendar is shown: the two dates of the work, with the end
   * withheld while the end is the current position so the next press writes
   * it instead of restarting the run — `date-range-picker`'s rule.
   */
  const calendarValue: CalendarValue =
    work.start.date === null
      ? null
      : currentPosition === 'end' && work.end.date !== null
        ? { start: work.start.date, end: null }
        : { start: work.start.date, end: work.end.date };
  const openStart =
    calendarValue !== null && !Array.isArray(calendarValue) && 'start' in calendarValue
      ? calendarValue.end === null
        ? calendarValue.start
        : null
      : null;

  const blocked = useMemo(
    () =>
      openStart === null || !contiguous
        ? { before: null, after: null }
        : blockedAround(
            openStart,
            isDateUnavailable ?? (() => false),
            maxLength === undefined ? CONTIGUOUS_SEARCH : Math.ceil(maxLength / 86_400) + 1,
          ),
    [contiguous, isDateUnavailable, maxLength, openStart],
  );
  const gridUnavailable = useCallback(
    (date: PlainDate) => {
      if (dayWindow(date, bounds) === null) return true;
      if (openStart === null) return isDateUnavailable?.(date) === true;
      return isDateRefusedInRun(
        openStart,
        date,
        { contiguous, count: 'days', unavailable: isDateUnavailable },
        blocked,
      );
    },
    [blocked, bounds, contiguous, isDateUnavailable, openStart],
  );

  /* ── The two lists ───────────────────────────────────────────────────── */

  /** The day each list serves: the date of its end, or the grid's focused day. */
  const dayFor = useCallback(
    (position: DateTimeRangePickerPosition): PlainDate => work[position].date ?? focusedDate,
    [focusedDate, work],
  );

  /**
   * The list of one end: the day's window from both pairs of bounds, the
   * predicate on that day, and — on the same day as the other end — what the
   * other end of the work refuses. The duration limits apply across days.
   */
  const listFor = useCallback(
    (position: DateTimeRangePickerPosition): TimeOption[] => {
      const day = dayFor(position);
      const window = dayWindow(day, bounds);
      if (window === null || isDateUnavailable?.(day) === true) return [];
      const base = timeList({
        isTimeUnavailable:
          isTimeUnavailable === undefined ? undefined : (time) => isTimeUnavailable(time, day),
        max: window.latest,
        maxOptions: resolvedMaxOptions,
        min: window.earliest,
        options,
        step: resolvedStep,
      });
      const otherEnd = wholeOf(work[other(position)]);
      let refused: (option: TimeOption, index: number) => boolean = () => false;
      if (otherEnd !== null) {
        const direction: 1 | -1 = position === 'end' ? 1 : -1;
        const sameDay = isSameDate(day, otherEnd.date);
        const wall =
          sameDay && contiguous
            ? firstUnavailableIndex(base, nearestIndex(base, otherEnd.time), direction)
            : -1;
        refused = (option, index) => {
          const candidate = { date: day, time: option.time };
          const seconds =
            position === 'end'
              ? dateTimeRangeSeconds(otherEnd, candidate)
              : dateTimeRangeSeconds(candidate, otherEnd);
          if (runRefusal(0, seconds, 1, { maxLength, minLength })) return true;
          return sameDay && wall >= 0 && (direction === 1 ? index >= wall : index <= wall);
        };
      }
      const marked = base.map((option, index) =>
        option.unavailable || !refused(option, index) ? option : { ...option, unavailable: true },
      );
      return resolvedUnavailable === 'hide'
        ? marked.filter((option) => !option.unavailable)
        : marked;
    },
    [
      bounds,
      contiguous,
      dayFor,
      isDateUnavailable,
      isTimeUnavailable,
      maxLength,
      minLength,
      options,
      resolvedMaxOptions,
      resolvedStep,
      resolvedUnavailable,
      work,
    ],
  );
  const lists = useMemo(() => ({ start: listFor('start'), end: listFor('end') }), [listFor]);
  const truncated = useMemo(
    () => isTruncated({ maxOptions: resolvedMaxOptions, options, step: resolvedStep }),
    [options, resolvedMaxOptions, resolvedStep],
  );
  const labels = useMemo(
    () => ({
      start: lists.start.map((option) => format.time.format(option.time)),
      end: lists.end.map((option) => format.time.format(option.time)),
    }),
    [format, lists],
  );

  /** The duration a row would make with the other end, on the same day only. */
  const durationOf = useCallback(
    (position: DateTimeRangePickerPosition, option: TimeOption): string | null => {
      const otherEnd = wholeOf(work[other(position)]);
      const day = dayFor(position);
      if (otherEnd === null || option.unavailable || !isSameDate(day, otherEnd.date)) return null;
      const candidate = { date: day, time: option.time };
      const seconds =
        position === 'end'
          ? dateTimeRangeSeconds(otherEnd, candidate)
          : dateTimeRangeSeconds(candidate, otherEnd);
      return resolvedLengthLabel(seconds);
    },
    [dayFor, resolvedLengthLabel, work],
  );

  const openingIndex = useCallback(
    (position: DateTimeRangePickerPosition) => {
      const across = work[other(position)];
      const otherEnd =
        across.date !== null && across.time !== null && isSameDate(across.date, dayFor(position))
          ? across.time
          : null;
      return openingIndexOf(
        lists[position],
        work[position].time ?? otherEnd ?? anchor.time,
        otherEnd,
        position,
      );
    },
    [anchor, dayFor, lists, work],
  );

  const highlightIndex = useCallback(
    (position: DateTimeRangePickerPosition) => {
      const time = highlight[position];
      return time === null
        ? -1
        : lists[position].findIndex((option) => isSameTime(option.time, time));
    },
    [highlight, lists],
  );

  const moveHighlight = useCallback(
    (position: DateTimeRangePickerPosition, index: number, source: unknown) => {
      const list = lists[position];
      const option = list[Math.max(0, Math.min(list.length - 1, index))];
      if (option === undefined) return;
      requestHighlight({ ...highlight, [position]: option.time }, 'keyboard', source);
    },
    [highlight, lists, requestHighlight],
  );

  useEffect(() => {
    if (!isOpen) return;
    const next = { ...highlight };
    for (const position of ['start', 'end'] as const) {
      const index = openingIndex(position);
      next[position] = index < 0 ? null : (lists[position][index]?.time ?? null);
    }
    if (!isSameTime(next.start, highlight.start) || !isSameTime(next.end, highlight.end)) {
      requestHighlight(next, 'programmatic', undefined);
    }
    /* Only when the surface opens or the lists under it change. */
  }, [isOpen, lists]);

  /* The lists open on their highlight once the layer exists — the layer is
     portalled, so it is not there on the render that opened it — and a
     highlight moved by a key lands whole rather than half under the edge. */
  const revealed = useRef(false);
  useEffect(() => {
    if (!isOpen || layerNode === null) {
      revealed.current = false;
      return;
    }
    const center = !revealed.current;
    revealed.current = true;
    const list = listRef.current;
    const index = highlightIndex(currentPosition);
    const row = list?.querySelectorAll<HTMLElement>('[data-part="option"]')[index];
    if (index < 0 || list === null || row === undefined) return;
    revealRow(list, row, center);
  }, [currentPosition, highlightIndex, isOpen, layerNode]);

  const typeahead = useRef({
    start: createTypeahead({ locale: () => resolvedLocale }),
    end: createTypeahead({ locale: () => resolvedLocale }),
  });
  useEffect(() => {
    const handles = typeahead.current;
    return () => {
      handles.start.destroy();
      handles.end.destroy();
    };
  }, []);

  /* ── The layer ───────────────────────────────────────────────────────── */

  const presence = useRef<PresenceHandle | null>(null);
  useEffect(() => {
    const handle = createPresence({ present: isOpen, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);
  useEffect(() => presence.current?.sync(isOpen), [isOpen]);
  useEffect(() => presence.current?.setNode(layerNode), [layerNode]);

  /** Open renders the surface in the commit that opens it. */
  const mounted = isOpen || status !== 'unmounted';

  useEffect(() => {
    const root = rootRef.current;
    if (root === null || warm) return undefined;
    const prepare = () => setWarm(true);
    root.addEventListener('focusin', prepare);
    root.addEventListener('pointerdown', prepare);
    return () => {
      root.removeEventListener('focusin', prepare);
      root.removeEventListener('pointerdown', prepare);
    };
  }, [warm]);

  const layered = mounted || warm;

  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({ origin: triggerRef.current, disabled: false });
    setContainer(handle.container as HTMLElement);
    return () => handle.release();
  }, [layered]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(SHEET_QUERY);
    const read = () => setSheet(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  /** A pull down on the sheet's grip dismisses it, as the grip of every other sheet does. */
  useEffect(() => {
    if (!sheet || !isOpen || layerNode === null) return;
    const grip = layerNode.querySelector<HTMLElement>(
      ':scope > [data-part="content"] > [data-part="grip"]',
    );
    if (grip === null) return;
    return attachGripDismiss({
      grip,
      sheet: layerNode,
      onDismiss: (event) => {
        setOpen(false, 'pointer', event);
      },
    });
  }, [isOpen, layerNode, setOpen, sheet]);

  /* Placed before the first paint: the positioner writes `data-positioned` with the side. */
  useLayoutEffect(() => {
    if (layerNode === null || rootRef.current === null || sheet) return;
    const anchorElement =
      rootRef.current.querySelector<HTMLElement>('[data-part="control"]') ?? rootRef.current;
    const [side, align = 'center'] = resolvedPlacement.split('-') as [
      'top' | 'bottom',
      'start' | 'end' | undefined,
    ];
    const handle = createPositioner(anchorElement, layerNode, { align, side });
    void handle.update();
    return () => {
      handle.destroy();
      layerNode.removeAttribute('data-positioned');
    };
  }, [layerNode, resolvedPlacement, sheet]);

  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    if (layerNode === null || !isOpen) return;
    const branches: Element[] = triggerRef.current === null ? [] : [triggerRef.current];
    const layer = createDismissableLayer(layerNode, {
      branches,
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      onDismiss: (request) => {
        /* A field's expression first, the calendar's view second, the surface
           last: the layer asks in the capture phase, so the decision is taken
           here and the layer simply not asked. */
        if (request.reason === 'escape') {
          if (layerNode.querySelector('[data-ui="datetime-field"][data-relative]') !== null) return;
          if (viewRef.current !== 'day') {
            setView(viewRef.current === 'year' ? 'month' : 'day');
            return;
          }
        }
        setOpen(false, request.reason === 'escape' ? 'escape' : 'outsidePress', request.source);
        if (request.reason === 'escape') triggerRef.current?.focus({ preventScroll: true });
      },
    });
    return () => layer.destroy();
  }, [isOpen, layerNode, setOpen]);

  /* ── Focus ───────────────────────────────────────────────────────────── */

  const focusOption = useCallback((index: number) => {
    listRef.current?.querySelectorAll<HTMLElement>('[data-part="option"]')[index]?.focus();
  }, []);

  const enterGrid = useCallback((date: PlainDate | null) => {
    requestAnimationFrame(() => {
      const handle = calendarHandle.current;
      if (handle === null) return;
      if (date !== null) handle.focusDate(date);
      handle.focus();
    });
  }, []);

  /** The field, or the grid where the field is not drawn (a coarse pointer). */
  const focusField = useCallback(() => {
    const box = fieldBox.current;
    if (box !== null && getComputedStyle(box).display === 'none') {
      enterGrid(work[currentPosition].date ?? anchor.date);
      return;
    }
    fieldRef.current?.focus();
  }, [anchor.date, currentPosition, enterGrid, work]);

  /**
   * Into the list of one end: the tab moves there when it is not the current
   * one, and focus lands on its highlight after the render that drew it.
   */
  const enterList = useCallback(
    (position: DateTimeRangePickerPosition, source: unknown) => {
      const at = highlightIndex(position);
      const index = at >= 0 ? at : openingIndex(position);
      if (position !== currentPosition) requestPosition(position, 'select', source);
      if (index < 0) {
        requestAnimationFrame(() => fieldRef.current?.focus());
        return;
      }
      moveHighlight(position, index, source);
      requestAnimationFrame(() => focusOption(index));
    },
    [currentPosition, focusOption, highlightIndex, moveHighlight, openingIndex, requestPosition],
  );

  /**
   * Opened by Enter, Space or a press, focus lands on the first segment of the
   * current end's field. Opened by an arrow, it lands on the cell of the
   * current end's date, or on today.
   */
  const focusOnOpen = useRef<'field' | 'grid' | null>(null);
  useEffect(() => {
    if (!isOpen || layerNode === null || focusOnOpen.current === null) return;
    const where = focusOnOpen.current;
    focusOnOpen.current = null;
    if (where === 'grid') {
      enterGrid((currentPosition === 'end' ? work.end.date : work.start.date) ?? anchor.date);
      return;
    }
    requestAnimationFrame(focusField);
  }, [isOpen, layerNode]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => triggerRef.current?.focus(),
      open: () => setOpen(true, 'keyboard', undefined),
      close: () => setOpen(false, 'keyboard', undefined),
    }),
    [setOpen],
  );

  /* ── The work ────────────────────────────────────────────────────────── */

  const closeAfter = (completed: boolean, source: unknown) => {
    const closes =
      resolvedCloseOnSelect === 'always' || (resolvedCloseOnSelect === 'auto' && completed);
    if (!closes) return;
    setOpen(false, 'select', source);
    triggerRef.current?.focus({ preventScroll: true });
  };

  /**
   * After a press wrote a half: whole, the work is the value and the panel
   * closes when the press completed it; incomplete, focus carries to the half
   * that is missing — this end's first, then the other end's.
   */
  const settle = (
    next: Work,
    before: Work,
    pressed: DateTimeRangePickerPosition,
    source: unknown,
  ) => {
    const wasWhole = wholeOf(before.start) !== null && wholeOf(before.end) !== null;
    setWork(next);
    const whole = wholeOf(next.start) !== null && wholeOf(next.end) !== null;
    if (whole) {
      requestValue(rangeOf(next), 'select', source);
      requestPosition(pressed, 'select', source);
      closeAfter(!wasWhole, source);
      return;
    }
    for (const position of [pressed, other(pressed)]) {
      const half = next[position];
      if (half.date !== null && half.time !== null) continue;
      if (half.date === null) {
        requestPosition(position, 'select', source);
        enterGrid(next[other(position)].date);
      } else {
        enterList(position, source);
      }
      return;
    }
  };

  const writeTime = (position: DateTimeRangePickerPosition, time: PlainTime, source: unknown) => {
    const half: Half = { date: work[position].date ?? dayFor(position), time };
    requestHighlight({ ...highlight, [position]: time }, 'pointer', source);
    settle({ ...work, [position]: half }, work, position, source);
  };

  const select = (position: DateTimeRangePickerPosition, option: TimeOption, source: unknown) => {
    if (option.unavailable || !editable) return;
    writeTime(position, option.time, source);
  };

  const chooseNow = (position: DateTimeRangePickerPosition, source: unknown) => {
    settle({ ...work, [position]: halfOf(anchor) }, work, position, source);
  };

  /**
   * The way out of a sheet that fills the screen, and of an edit left half
   * way: a whole work is the value; a half alone stays as it is.
   */
  const done = (event: MouseEvent<HTMLElement>) => {
    const whole = rangeOf(work);
    if (whole?.start != null && whole.end !== null && !isSameDateTimeRange(whole, held)) {
      requestValue(whole, 'select', event);
    }
    setOpen(false, 'pointer', event);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onCalendarValue = (next: CalendarValue, request: ChangeRequest<CalendarValue>) => {
    if (next === null || Array.isArray(next) || !('start' in next)) return;
    if (next.end === null) {
      /* The first press: the run restarts on this start; the end's date is
         withheld and its time kept. */
      settle(
        { start: { ...work.start, date: next.start }, end: { ...work.end, date: null } },
        work,
        'start',
        request.source,
      );
      return;
    }
    /* The second press: the grid ordered the two dates; the times stay with
       the end they were on. */
    settle(
      { start: { ...work.start, date: next.start }, end: { ...work.end, date: next.end } },
      work,
      'end',
      request.source,
    );
  };

  const choosePreset = (range: DateTimeRange, event: MouseEvent<HTMLElement>) => {
    setWork(workOf(range));
    requestValue(range, 'select', event);
    requestPosition('start', 'select', event);
    closeAfter(true, event);
  };

  /** The field in the band writes the current end whole, with the field's own reason. */
  const onFieldValue = (next: PlainDateTime | null, request: DateTimeFieldChangeRequest) => {
    const nextWork: Work = { ...work, [currentPosition]: halfOf(next) };
    setWork(nextWork);
    requestValue(
      { start: wholeOf(nextWork.start), end: wholeOf(nextWork.end) },
      request.reason as DateTimeRangePickerValueReason,
      request.source,
    );
  };

  /* ── The tabs ────────────────────────────────────────────────────────── */

  const focusTab = (position: DateTimeRangePickerPosition) =>
    tabRefs.current[position]?.focus({ preventScroll: true });

  /** Automatic activation: the arrow moves the position with it. */
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;
    const next: DateTimeRangePickerPosition | null =
      event.key === 'ArrowRight' || event.key === 'End'
        ? 'end'
        : event.key === 'ArrowLeft' || event.key === 'Home'
          ? 'start'
          : null;
    if (next === null) return;
    event.preventDefault();
    if (next !== currentPosition) requestPosition(next, 'keyboard', event);
    focusTab(next);
  };

  /* ── Keys ────────────────────────────────────────────────────────────── */

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented || !editable) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOnOpen.current = 'grid';
      if (!isOpen) setOpen(true, 'keyboard', event);
      else enterGrid((currentPosition === 'end' ? work.end.date : work.start.date) ?? anchor.date);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      focusOnOpen.current = 'field';
      setOpen(!isOpen, 'keyboard', event);
    }
  };

  const onListKeyDown =
    (position: DateTimeRangePickerPosition) => (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event as never);
      if (event.defaultPrevented) return;
      const list = lists[position];
      const found = highlightIndex(position);
      const at = found >= 0 ? found : 0;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          moveHighlight(position, at + 1, event);
          focusOption(Math.min(list.length - 1, at + 1));
          return;
        case 'ArrowUp':
          event.preventDefault();
          moveHighlight(position, at - 1, event);
          focusOption(Math.max(0, at - 1));
          return;
        case 'Home':
          event.preventDefault();
          moveHighlight(position, 0, event);
          focusOption(0);
          return;
        case 'End':
          event.preventDefault();
          moveHighlight(position, list.length - 1, event);
          focusOption(list.length - 1);
          return;
        case 'PageDown': {
          event.preventDefault();
          const next = hourJump(list, at, 1);
          moveHighlight(position, next, event);
          focusOption(next);
          return;
        }
        case 'PageUp': {
          event.preventDefault();
          const previous = hourJump(list, at, -1);
          moveHighlight(position, previous, event);
          focusOption(previous);
          return;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          const option = list[at];
          if (option !== undefined) select(position, option, event);
          return;
        }
        default:
          break;
      }

      const handle = typeahead.current[position];
      if (isPrintable(event.key, handle.query.length > 0)) {
        const index = handle.match(event.key, labels[position], at);
        if (index < 0) return;
        event.preventDefault();
        moveHighlight(position, index, event);
        focusOption(index);
      }
    };

  /* ── What is said ────────────────────────────────────────────────────── */

  /**
   * The pending end: the option under the pointer, the highlighted option of
   * the list that has focus, or the grid's pending day. The duration is said
   * for the run it would make with the other end of the work.
   */
  const pendingTime =
    hovered ??
    (!listFocused || highlight[currentPosition] === null
      ? null
      : { position: currentPosition, time: highlight[currentPosition] as PlainTime });
  let pendingRun: Work | null = null;
  if (pendingTime !== null) {
    pendingRun = {
      ...work,
      [pendingTime.position]: {
        date: dayFor(pendingTime.position),
        time: pendingTime.time,
      },
    };
  } else if (openStart !== null && preview !== null) {
    /* A pending day enters with the time that end already holds, or midnight. */
    const run = orderedRun(openStart, preview);
    pendingRun = {
      start: { date: run.start, time: work.start.time ?? MIDNIGHT },
      end: { date: run.end, time: work.end.time ?? MIDNIGHT },
    };
  }
  const spokenFor = (candidate: Work): string => {
    const a = wholeOf(candidate.start);
    const b = wholeOf(candidate.end);
    return a !== null && b !== null && compareDateTime(a, b) <= 0
      ? resolvedLengthLabel(dateTimeRangeSeconds(a, b))
      : '';
  };
  const spokenLength = pendingRun === null ? spokenFor(work) : spokenFor(pendingRun);
  /** "1 day to 7 days", "at least 1 day", "at most 7 days". */
  const limitText =
    minLength !== undefined && maxLength !== undefined
      ? t('limit.between', {
          min: resolvedLengthLabel(minLength),
          max: resolvedLengthLabel(maxLength),
        })
      : minLength !== undefined
        ? t('limit.atLeast', { min: resolvedLengthLabel(minLength) })
        : maxLength !== undefined
          ? t('limit.atMost', { max: resolvedLengthLabel(maxLength) })
          : null;

  /**
   * What the next press should be, or what is wrong: the difference between a
   * panel that refuses and a panel that explains. Empty while the work is
   * whole and valid, when the length says the duration.
   */
  const workWhole = rangeOf(work);
  const workProblems =
    workWhole?.start != null && workWhole.end !== null
      ? dateTimeRangeProblems(workWhole, {
          contiguous,
          max,
          maxLength,
          maxTime,
          min,
          minLength,
          minTime,
          unavailableDay: isDateUnavailable,
          unavailableTime: isTimeUnavailable,
        })
      : [];
  const hintProblem = workProblems[0];
  const currentHalf = work[currentPosition];
  const hint =
    currentHalf.date === null
      ? t('chooseDay', { end: labelOf(currentPosition) })
      : currentHalf.time === null
        ? t('chooseTime', {
            end: labelOf(currentPosition),
            day: format.describeDate(currentHalf.date, 'short'),
          })
        : hintProblem === undefined
          ? ''
          : t(hintProblem === 'min' || hintProblem === 'max' ? 'bounds' : hintProblem);
  const hintId = `${contentId}-hint`;

  const spoken =
    start !== null && end !== null
      ? ordered
        ? t('change', {
            start: format.describe(start),
            end: format.describe(end),
            length: resolvedLengthLabel(dateTimeRangeSeconds(start, end)),
          })
        : t('changeReversed', { start: format.describe(start), end: format.describe(end) })
      : t('choose');

  /* The frame writes each end short — "12 Sep, 14:00" — because the whole
     value in words is the trigger's. */
  const short = useMemo(
    () =>
      new Intl.DateTimeFormat(resolvedLocale, {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
        timeZone: 'UTC',
        ...(resolvedHourCycle === undefined ? {} : { hour12: resolvedHourCycle === 12 }),
      }),
    [resolvedHourCycle, resolvedLocale],
  );
  const writeShort = (item: PlainDateTime) =>
    short.format(
      Date.UTC(
        item.date.year,
        item.date.month - 1,
        item.date.day,
        item.time.hour,
        item.time.minute,
      ),
    );
  const summary =
    held === null
      ? null
      : `${start === null ? '' : writeShort(start)} – ${end === null ? '' : writeShort(end)}`.trim();
  const writeDay = (date: PlainDate) => format.describeDate(date, 'short');

  const workStart = wholeOf(work.start);
  const workEnd = wholeOf(work.end);
  const workOrdered =
    workStart !== null && workEnd !== null && compareDateTime(workStart, workEnd) <= 0;
  const startMax = workOrdered
    ? max === undefined || compareDateTime(workEnd as PlainDateTime, max) < 0
      ? (workEnd as PlainDateTime)
      : max
    : max;
  const endMin = workOrdered
    ? min === undefined || compareDateTime(workStart as PlainDateTime, min) > 0
      ? (workStart as PlainDateTime)
      : min
    : min;

  const fieldProps = {
    calendar: resolvedCalendar,
    disabled: resolvedDisabled,
    granularity: resolvedGranularity,
    isDateUnavailable,
    isTimeUnavailable,
    locale: resolvedLocale,
    maxTime,
    minTime,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    size: 'sm' as const,
    timeZone: resolvedTimeZone,
    variant: 'plain' as const,
    ...(resolvedHourCycle === undefined ? {} : { hourCycle: resolvedHourCycle }),
    ...(resolvedFirstDay === undefined ? {} : { firstDayOfWeek: resolvedFirstDay }),
    ...(yearPivot === undefined ? {} : { yearPivot }),
    ...(referenceDateTime === undefined ? {} : { referenceDateTime }),
    ...(relative === undefined ? {} : { relative }),
  };

  const tabId = (position: DateTimeRangePickerPosition) => `${contentId}-tab-${position}`;

  const tab = (position: DateTimeRangePickerPosition) => {
    const half = work[position];
    const whole = wholeOf(half);
    const current = currentPosition === position;
    const text =
      whole !== null
        ? writeShort(whole)
        : half.date !== null
          ? writeDay(half.date)
          : half.time !== null
            ? timeFormat.format(half.time)
            : '—';
    return (
      <button
        aria-controls={`${contentId}-panel`}
        aria-selected={current}
        data-part="tab"
        data-part-tab=""
        data-position={position}
        disabled={!editable}
        id={tabId(position)}
        onClick={(event) => {
          if (!current) requestPosition(position, 'pointer', event);
        }}
        onKeyDown={onTabKeyDown}
        ref={(node) => {
          tabRefs.current[position] = node;
        }}
        role="tab"
        tabIndex={current ? 0 : -1}
        type="button"
        {...(current ? { 'data-current': '' } : {})}
        {...(whole === null && half.date === null && half.time === null
          ? { 'data-placeholder': '' }
          : {})}
      >
        <span data-part="tab-label" data-part-tab-label="">
          {labelOf(position)}
        </span>
        <span data-part="tab-value" data-part-tab-value="">
          {text}
        </span>
      </button>
    );
  };

  const panel = () => {
    const position = currentPosition;
    const list = lists[position];
    const current = highlightIndex(position);
    const chosen = work[position].time;
    const day = dayFor(position);
    return (
      <div data-part="panel" data-part-panel="" data-position={position} id={`${contentId}-panel`}>
        <div data-part="date-panel" data-part-date-panel="">
          <Calendar
            fixedWeeks={fixedWeeks}
            focusedDate={focusedDate}
            isDateUnavailable={gridUnavailable}
            locale={resolvedLocale}
            max={max?.date}
            min={min?.date}
            months={resolvedMonths}
            onFocusedDateChange={(date) => setFocusedDate(date)}
            onPreviewChange={setPreview}
            onValueChange={onCalendarValue}
            onViewChange={setView}
            readOnly={resolvedReadOnly}
            ref={calendarHandle}
            selectionMode="range"
            timeZone={resolvedTimeZone}
            value={calendarValue}
            view={view}
            weekNumbers={weekNumbers}
            {...(resolvedFirstDay === undefined ? {} : { firstDayOfWeek: resolvedFirstDay })}
          />
        </div>
        {list.length === 0 ? (
          <div data-part="empty" data-part-empty="">
            {t('empty')}
          </div>
        ) : (
          <div
            aria-describedby={hint === '' ? undefined : hintId}
            aria-labelledby={tabId(position)}
            data-part="list"
            data-part-list=""
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setListFocused(false);
              }
            }}
            onFocus={() => setListFocused(true)}
            onKeyDown={onListKeyDown(position)}
            onPointerLeave={() => setHovered(null)}
            ref={listRef}
            role="listbox"
            {...(truncated
              ? {
                  'aria-description': t('truncated'),
                  'data-truncated': '',
                }
              : {})}
          >
            {list.map((option, index) => {
              const rowLabel = labels[position][index] ?? '';
              const selected = isSameTime(option.time, chosen);
              const isCurrent = index === current;
              const duration = durationOf(position, option);
              return (
                <div
                  aria-disabled={option.unavailable ? true : undefined}
                  aria-selected={selected}
                  data-part="option"
                  data-part-option=""
                  key={`${day.year}-${day.month}-${day.day}-${option.time.hour}-${option.time.minute}-${option.time.second}`}
                  onClick={(event) => select(position, option, event)}
                  onPointerEnter={() =>
                    setHovered(option.unavailable ? null : { position, time: option.time })
                  }
                  role="option"
                  tabIndex={isCurrent ? 0 : -1}
                  {...(option.unavailable ? { 'data-disabled': '' } : {})}
                  {...(selected ? { 'data-selected': '' } : {})}
                  {...(isCurrent ? { 'data-current': '' } : {})}
                >
                  {renderOption === undefined ? (
                    <>
                      {rowLabel}
                      {duration === null ? null : (
                        <span data-part="option-duration" data-part-option-duration="">
                          {duration}
                        </span>
                      )}
                    </>
                  ) : (
                    renderOption({
                      current: isCurrent,
                      date: day,
                      duration,
                      label: rowLabel,
                      position,
                      selected,
                      time: option.time,
                      unavailable: option.unavailable,
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const presetContext: PresetContextValue = { held, choose: choosePreset };

  const surface: ReactNode = mounted ? (
    <div
      data-part="positioner"
      data-part-positioner=""
      data-presentation={sheet ? 'sheet' : 'popover'}
      data-ui="datetime-range-picker"
      data-ui-datetime-range-picker=""
      ref={setLayerNode}
      {...(isOpen ? { 'data-open': '' } : {})}
    >
      <div
        aria-label={spoken}
        data-part="content"
        data-part-content=""
        id={contentId}
        role="dialog"
      >
        {sheet ? <span aria-hidden="true" data-part="grip" data-part-grip="" /> : null}
        <div data-part="head" data-part-head="">
          <div data-part="tabs" data-part-tabs="" role="tablist">
            {tab('start')}
            {tab('end')}
          </div>
          <div data-part="field" data-part-field="" data-position={currentPosition} ref={fieldBox}>
            <DateTimeField
              {...fieldProps}
              aria-describedby={hint === '' ? undefined : hintId}
              aria-label={labelOf(currentPosition)}
              invalid={
                currentPosition === 'end' && workProblems.includes('order') ? true : undefined
              }
              max={currentPosition === 'start' ? startMax : max}
              min={currentPosition === 'end' ? endMin : min}
              onValueChange={onFieldValue}
              ref={fieldRef}
              value={currentPosition === 'start' ? workStart : workEnd}
            />
          </div>
          <button
            data-part="now"
            data-part-now=""
            disabled={!editable}
            onClick={(event) => chooseNow(currentPosition, event)}
            type="button"
          >
            {t('now')}
          </button>
          <span
            data-part="hint"
            data-part-hint=""
            id={hintId}
            {...(hintProblem === undefined ? {} : { 'data-invalid': '' })}
          >
            {hint}
          </span>
          <span
            aria-live="polite"
            data-part="length"
            data-part-length=""
            {...(pendingRun === null ? {} : { 'data-pending': '' })}
          >
            {spokenLength}
          </span>
          {limitText === null ? null : (
            <span data-part="limit" data-part-limit="">
              {limitText}
            </span>
          )}
        </div>
        {presets === undefined ? null : (
          <PresetContext.Provider value={presetContext}>
            <div data-part="presets" data-part-presets="">
              {presets}
            </div>
          </PresetContext.Provider>
        )}
        {panel()}
        <div data-part="footer" data-part-footer="">
          {footer}
          <button data-part="done" data-part-done="" onClick={done} type="button">
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const children: ReactNode = (
    <>
      <div data-part="control" data-part-control="">
        <button
          aria-controls={isOpen ? contentId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={spoken}
          data-part="trigger"
          data-part-trigger=""
          disabled={!editable}
          onClick={(event) => {
            focusOnOpen.current = 'field';
            setOpen(!isOpen, 'pointer', event);
          }}
          onKeyDown={onTriggerKeyDown}
          ref={triggerRef}
          type="button"
        >
          <span
            data-part="summary"
            data-part-summary=""
            {...(summary === null ? { 'data-placeholder': '' } : {})}
          >
            {summary ?? t('choose')}
          </span>
          <Icon>
            <Glyph name="calendar" />
          </Icon>
        </button>
        {clearable && held !== null ? (
          <button
            aria-label={t('clear')}
            data-part="clear"
            data-part-clear=""
            disabled={!editable}
            onClick={(event) => {
              setWork(EMPTY);
              requestValue(null, 'clear', event);
              requestPosition('start', 'clear', event);
              triggerRef.current?.focus();
            }}
            type="button"
          >
            <Icon>
              <Glyph name="x" />
            </Icon>
          </button>
        ) : null}
        <input
          data-part="hidden-input"
          data-part-hidden-input=""
          name={startName}
          type="hidden"
          value={start === null ? '' : toISODateTime(start)}
        />
        <input
          data-part="hidden-input"
          data-part-hidden-input=""
          name={endName}
          type="hidden"
          value={end === null ? '' : toISODateTime(end)}
        />
      </div>
      {container === null ? surface : null}
    </>
  );

  const rootProps: DateTimeRangePickerRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    ...(isOpen ? { 'data-open': '' } : {}),
    'data-calendar': resolvedCalendar,
    'data-granularity': resolvedGranularity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'datetime-range-picker',
    'data-variant': resolvedVariant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div
          {...(rootProps as DateTimeRangePickerRootProps & { ref?: React.Ref<HTMLDivElement> })}
        />
      ) : (
        render(rootProps)
      )}
      {container === null ? null : createPortal(surface, container)}
    </>
  );
}

/**
 * One shortcut. It writes its range with the `select` reason and carries
 * `data-selected` while the value equals it. The list is the product's —
 * "this afternoon" is a business clock — and the family ships the button, not
 * the list.
 */
export function DateTimeRangePickerPreset({
  children,
  onClick,
  ref,
  render,
  value,
  ...nativeProps
}: DateTimeRangePickerPresetProps) {
  const context = useContext(PresetContext);
  const range = typeof value === 'function' ? value() : value;
  const selected = context !== null && isSameDateTimeRange(context.held, range);

  const rootProps: DateTimeRangePickerPresetRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'preset',
    ...(selected ? { 'data-selected': '' } : {}),
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) return;
      context?.choose(typeof value === 'function' ? value() : value, event);
    },
    ref: ref as React.Ref<HTMLElement>,
    type: 'button',
  });

  return render === undefined ? (
    <button
      {...(rootProps as DateTimeRangePickerPresetRootProps & {
        ref?: React.Ref<HTMLButtonElement>;
      })}
    />
  ) : (
    render(rootProps)
  );
}
