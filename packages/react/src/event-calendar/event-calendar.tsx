import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/event-calendar/event-calendar.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import {
  addDays,
  compareDate,
  daysBetween,
  compareDateTime,
  createDateFormat,
  isPlainDateTime,
  isSameDate,
  nowDateTimeIn,
  plainDateTime,
  secondsOfDay,
  timeOfSeconds,
  todayIn,
  toISODate,
} from '@slotted/core/date';
import type { PlainDate, PlainDateTime, PlainTime } from '@slotted/core/date';
import {
  calendarColor,
  contextSlot,
  formatOccurrence,
  occurrenceWhen,
  slotMinutes,
  formatTimeRange,
  moveDate,
  movePlacement,
  nextAllowedPlacement,
  placeOccurrence,
  placementOf,
  resizePlacement,
  withPlacement,
  occurrencesIn,
  occurrencesOn,
  stepView,
  viewRange,
  viewTitle,
} from '@slotted/core/event-calendar';
import type {
  CalendarEvent,
  DateMove,
  EventOccurrence,
  EventPlacement,
  EventShift,
} from '@slotted/core/event-calendar';
import { eventCalendarMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  createElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
  PointerEvent as ReactPointerEvent,
  SyntheticEvent,
} from 'react';

import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
} from '../drawer';
import { ContextMenu, ContextMenuTrigger, useContextMenu } from '../context-menu';
import type { ContextMenuContextValue } from '../context-menu';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from '../menu';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  usePopover,
} from '../popover';
import { ProgressBar } from '../progress-indicator';
import { Segment, SegmentedControl } from '../segmented-control';
import { EventCalendarContext } from './event-calendar-context';
import type { EventCalendarModel, GridRow } from './event-calendar-context';
import { useEventCalendarDefaults } from './event-calendar-defaults';
import { EventItem } from './event-calendar-event';
import { List } from './event-calendar-list';
import { fullDate, Month } from './event-calendar-month';
import { TimeGrid } from './event-calendar-time-grid';
import type {
  EventCalendarContextTarget,
  EventCalendarEventChange,
  EventCalendarProps,
  EventCalendarRootProps,
  EventCalendarSelection,
} from './event-calendar.types';

const ALL_VIEWS = ['month', 'week', 'day', 'list'] as const;
const WIDGETS = "[data-part='day-number'], [data-part='event'], [data-part='more']";

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key, index) => key === b[index]);

/**
 * The day under a point, in one row of the grid, found by the cells' boxes.
 * The day of the cell that holds an event is not it: a bar lives in its first
 * day's cell, so a bar picked up by its middle measured every move from its
 * start and travelled the days in between twice. Columns and the all-day row
 * are vertical strips and answer by the horizontal position alone, so a hand
 * that drifts off the row keeps its day; a month cell answers by both.
 */
function dayUnder(root: ParentNode | null, row: string, x: number, y: number): PlainDate | null {
  for (const cell of root?.querySelectorAll<HTMLElement>(`[data-row='${row}'][data-date]`) ?? []) {
    const box = cell.getBoundingClientRect();
    const across = x >= box.left && x < box.right;
    if (across && (row !== 'day' || (y >= box.top && y < box.bottom))) {
      const [year, month, day] = (cell.dataset['date'] ?? '').split('-').map(Number) as [
        number,
        number,
        number,
      ];
      return { year, month, day };
    }
  }
  return null;
}

function sameSelection(a: EventCalendarSelection | null, b: EventCalendarSelection | null) {
  if (a === null || b === null) return a === b;
  if (isPlainDateTime(a.start) !== isPlainDateTime(b.start)) return false;
  if (isPlainDateTime(a.start)) {
    return (
      compareDateTime(a.start, b.start as PlainDateTime) === 0 &&
      compareDateTime(a.end as PlainDateTime, b.end as PlainDateTime) === 0
    );
  }
  return (
    compareDate(a.start, b.start as PlainDate) === 0 &&
    compareDate(a.end as PlainDate, b.end as PlainDate) === 0
  );
}

const orderedDays = (a: PlainDate, b: PlainDate) =>
  compareDate(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };

/** A minute of `date`; 1440 is 00:00 of the day after, where an exclusive end lands. */
const atMinutes = (date: PlainDate, minutes: number): PlainDateTime =>
  minutes >= 1440
    ? plainDateTime(addDays(date, 1), timeOfSeconds(0))
    : plainDateTime(date, timeOfSeconds(Math.max(0, minutes) * 60));

/**
 * One request of the state model: the value, the one it replaces, the reason
 * and the source, cancellable before anything commits, and not emitted at all
 * for a value equal to the current one. Returns whether it was accepted; the
 * caller commits it when it owns the value.
 *
 * `createControllable` reads `undefined` as "not controlled", and two of these
 * values — the selection and the open event — hold `null` as a value a
 * consumer can own. The mode is therefore the caller's, stated once per model.
 */
function ask<T>(
  current: T,
  next: T,
  equals: (a: T, b: T) => boolean,
  reason: ChangeReason,
  source: unknown,
  onRequest: ((value: T, request: ChangeRequest<T>) => void) | undefined,
): boolean {
  if (equals(current, next)) return false;
  let cancelled = false;
  onRequest?.(next, {
    value: next,
    previous: current,
    reason,
    source,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  });
  return !cancelled;
}

/**
 * When the open occurrence happens, under the detail's title: the day and the
 * hours as two parts that never break inside themselves.
 */
function When({ when }: { when: { day: string | null; range: string } }) {
  return (
    <>
      {when.day === null ? null : (
        <>
          <span data-part="detail-day" data-part-detail-day="">
            {when.day},
          </span>{' '}
        </>
      )}
      <span data-part="detail-range" data-part-detail-range="">
        {when.range}
      </span>
    </>
  );
}

/** Hands the `context-menu` family's context to the calendar that holds it. */
function ContextFamily({ handle }: { handle: { current: ContextMenuContextValue | null } }) {
  handle.current = useContextMenu();
  return null;
}

/** Puts the detail's popover on whichever element opened it. */
function AnchorTo({ element }: { element: HTMLElement | null }) {
  const popover = usePopover();
  useLayoutEffect(() => {
    popover.setAnchorNode(element);
  }, [element, popover.setAnchorNode]);
  return null;
}

/**
 * A calendar of events: month, week, day and list, over wall-clock values.
 *
 * **The events are the consumer's.** The family expands their recurrence,
 * lays them out and asks, with a reason, to move the date, the view, the
 * calendars in view, the chosen stretch of time and the open event — five
 * values, each controlled or not.
 *
 * **The grid is a layout grid from the APG with the day as its cell.** One cell
 * holds the tab stop; arrows move the day; Enter goes into the day's events and
 * Escape comes back out. The list is not a grid: every event is in the tab
 * order, under a heading per day.
 *
 * **Below the compact size class the month and the week are a list** of the
 * same days, without the view changing: the reader's choice is there again when
 * the window widens.
 */
export function EventCalendar<E extends CalendarEvent = CalendarEvent>({
  actions,
  calendars = [],
  className,
  compact,
  date,
  dayHours,
  defaultDate,
  now: ownedNow,
  defaultOpenEvent,
  defaultSelection,
  defaultView,
  defaultVisibleCalendars,
  editable = false,
  empty,
  error,
  events,
  filter,
  firstDayOfWeek,
  fixedWeeks,
  header = true,
  hourCycle,
  level = 2,
  listRange,
  loading = false,
  loadingDelay,
  loadingMinDuration,
  locale,
  maxColumns,
  maxEvents,
  messages,
  onDateChange,
  onEventChange,
  canDrop,
  onOpenEventChange,
  onRangeChange,
  onSelectionChange,
  onViewChange,
  onVisibleCalendarsChange,
  openEvent,
  ref,
  render,
  renderDayContent,
  renderEvent,
  renderContextMenu,
  renderEventDetail,
  scrollTime,
  selection,
  selectionMode = 'none',
  slotDuration,
  style,
  timeZone,
  view,
  views = ALL_VIEWS,
  visibleCalendars,
  weekends,
  weekNumbers,
  workingHours = [],
  ...nativeProps
}: EventCalendarProps<E>) {
  const defaults = useEventCalendarDefaults();
  const baseId = useId();
  const titleId = `${baseId}-title`;

  const appLocale = useLocale();
  const t = useMessages(eventCalendarMessages, messages);
  const resolvedLocale = locale ?? appLocale;
  const resolvedZone = timeZone ?? defaults.timeZone;
  const resolvedCycle = hourCycle ?? defaults.hourCycle;
  const resolvedWeekends = weekends ?? defaults.weekends;
  const resolvedHours = dayHours ?? defaults.dayHours;
  const resolvedSlot = slotMinutes(slotDuration ?? defaults.slotDuration);
  const resolvedScroll = scrollTime ?? defaults.scrollTime;
  const resolvedMaxEvents = Math.max(1, maxEvents ?? defaults.maxEvents);
  const resolvedMaxColumns = Math.max(2, maxColumns ?? defaults.maxColumns);
  const resolvedCompact = compact ?? defaults.compact;
  const resolvedListRange = listRange ?? defaults.listRange;
  const resolvedFirstDay = useMemo(
    () =>
      createDateFormat({
        locale: resolvedLocale,
        firstDayOfWeek: firstDayOfWeek ?? defaults.firstDayOfWeek,
      }).firstDayOfWeek,
    [defaults.firstDayOfWeek, firstDayOfWeek, resolvedLocale],
  );
  const viewOptions = {
    firstDayOfWeek: resolvedFirstDay,
    weekends: resolvedWeekends,
    fixedWeeks: fixedWeeks ?? defaults.fixedWeeks,
    listRange: resolvedListRange,
  };

  const rootRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Now, ticked on the minute after the first paint, so a server and a
   * browser in different zones never disagree about the markup they drew.
   */
  const [clock, setClock] = useState<PlainDateTime | null>(null);
  const clockRuns = ownedNow === undefined;
  useEffect(() => {
    if (!clockRuns) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      setClock(nowDateTimeIn(resolvedZone));
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    tick();
    return () => clearTimeout(timer);
  }, [resolvedZone, clockRuns]);
  const now = ownedNow ?? clock;
  const today = now?.date ?? null;

  /* ── The five models ─────────────────────────────────────────────────── */

  /**
   * The first day an uncontrolled calendar opens on. It is read in the zone
   * the calendar names; an application rendering on a server passes
   * `defaultDate`, which is the one way two machines agree on it.
   */
  const [ownDate, setOwnDate] = useState<PlainDate>(() => defaultDate ?? todayIn(resolvedZone));
  const currentDate = date ?? ownDate;

  const [ownView, setOwnView] = useState(defaultView ?? views[0] ?? 'month');
  const currentView = view ?? ownView;

  const allKeys = useMemo(() => calendars.map((entry) => entry.key), [calendars]);
  const [ownVisible, setOwnVisible] = useState<readonly string[] | null>(
    defaultVisibleCalendars ?? null,
  );
  const shown = visibleCalendars ?? ownVisible ?? allKeys;

  const [ownSelection, setOwnSelection] = useState<EventCalendarSelection | null>(
    defaultSelection ?? null,
  );
  const currentSelection = selection === undefined ? ownSelection : selection;

  const [ownOpen, setOwnOpen] = useState<string | null>(defaultOpenEvent ?? null);
  const currentOpen = openEvent === undefined ? ownOpen : openEvent;

  const requestDate = useCallback(
    (next: PlainDate, reason: ChangeReason, source?: unknown) => {
      const accepted = ask(currentDate, next, isSameDate, reason, source, onDateChange);
      if (accepted && date === undefined) setOwnDate(next);
      return accepted;
    },
    [currentDate, date, onDateChange],
  );

  const requestView = useCallback(
    (next: typeof currentView, reason: ChangeReason, source?: unknown) => {
      const accepted = ask(currentView, next, Object.is, reason, source, onViewChange);
      if (accepted && view === undefined) setOwnView(next);
      return accepted;
    },
    [currentView, onViewChange, view],
  );

  const requestVisible = useCallback(
    (next: readonly string[], reason: ChangeReason, source?: unknown) => {
      const accepted = ask(shown, next, sameKeys, reason, source, onVisibleCalendarsChange);
      if (accepted && visibleCalendars === undefined) setOwnVisible(next);
      return accepted;
    },
    [onVisibleCalendarsChange, shown, visibleCalendars],
  );

  const requestSelection = useCallback(
    (next: EventCalendarSelection | null, reason: ChangeReason, source?: unknown) => {
      const accepted = ask(
        currentSelection,
        next,
        sameSelection,
        reason,
        source,
        onSelectionChange,
      );
      if (accepted && selection === undefined) setOwnSelection(next);
      return accepted;
    },
    [currentSelection, onSelectionChange, selection],
  );

  const requestOpen = useCallback(
    (next: string | null, reason: ChangeReason, source?: unknown) => {
      const accepted = ask(currentOpen, next, Object.is, reason, source, onOpenEventChange);
      if (accepted && openEvent === undefined) setOwnOpen(next);
      return accepted;
    },
    [currentOpen, onOpenEventChange, openEvent],
  );

  /* ── Width ───────────────────────────────────────────────────────────── */

  const [narrow, setNarrow] = useState(false);
  /* Where a sheet gives focus back: the "+N" or the event that opened it. */
  const moreReturn = useRef<HTMLElement | null>(null);
  const detailReturn = useRef<HTMLElement | null>(null);
  /* The root, as state: a sheet's container has to be known when it renders. */
  const [sheetHost, setSheetHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const element = rootRef.current;
    if (element === null) return undefined;
    const gate = createWidthGate(element, { at: COMPACT_BELOW, onChange: setNarrow });
    setNarrow(gate.narrow());
    return () => gate.destroy();
  }, []);

  const layout: 'grid' | 'list' =
    currentView === 'list' ||
    (narrow && resolvedCompact === 'list' && (currentView === 'month' || currentView === 'week'))
      ? 'list'
      : 'grid';

  /* ── What is drawn ───────────────────────────────────────────────────── */

  const range =
    layout === 'list' && currentView !== 'list'
      ? viewRange('list', currentDate, {
          ...viewOptions,
          listRange: currentView === 'month' ? 'month' : currentView === 'day' ? 'week' : 'week',
        })
      : viewRange(currentView, currentDate, viewOptions);
  const rangeStart = toISODate(range.start);
  const rangeEnd = toISODate(range.end);

  const collator = useMemo(() => new Intl.Collator(resolvedLocale), [resolvedLocale]);
  const occurrences = useMemo(() => {
    const found = occurrencesIn(events, range.start, range.end, { collator });
    return found.filter(
      (occurrence) =>
        (occurrence.event.calendar === undefined ||
          !allKeys.includes(occurrence.event.calendar) ||
          shown.includes(occurrence.event.calendar)) &&
        (filter === undefined || filter(occurrence)),
    );
    /* The range is keyed by its two ends, which is what changes it. */
  }, [allKeys, collator, events, filter, rangeEnd, rangeStart, shown]);

  /* ── Editing ─────────────────────────────────────────────────────────── */

  const canEdit = useCallback(
    (occurrence: EventOccurrence) =>
      typeof editable === 'function' ? editable(occurrence as EventOccurrence<E>) : editable,
    [editable],
  );

  /**
   * The occurrence a pointer is moving, drawn where it would land: the views
   * lay the proposal out like any other placement, so a moved block takes its
   * columns and pushes its neighbours as it will once the application agrees.
   */
  const [editing, setEditing] = useState<{
    key: string;
    placement: EventPlacement;
    invalid: boolean;
  } | null>(null);
  const laidOut = useMemo(
    () =>
      editing === null ? occurrences : withPlacement(occurrences, editing.key, editing.placement),
    [editing, occurrences],
  );

  const pendingEventFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    const key = pendingEventFocus.current;
    if (key === null) return;
    pendingEventFocus.current = null;
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-part='event'][data-key='${CSS.escape(key)}']`)
      ?.focus();
  });

  /** The change the family would ask for: `canDrop` and `onEventChange` read the same one. */
  const changeFor = useCallback(
    (
      occurrence: EventOccurrence,
      placement: EventPlacement,
      kind: 'move' | 'resize',
    ): EventCalendarEventChange<E> => ({
      key: occurrence.key,
      event: occurrence.event as E,
      occurrence: occurrence.start.date,
      recurring: occurrence.recurring,
      kind,
      ...placeOccurrence(placement),
    }),
    [],
  );

  const allows = useCallback(
    (occurrence: EventOccurrence, placement: EventPlacement, kind: 'move' | 'resize') =>
      canDrop === undefined || canDrop(changeFor(occurrence, placement, kind)),
    [canDrop, changeFor],
  );

  /** Asks the application to put an occurrence somewhere else; the family holds no event. */
  const requestEventChange = useCallback(
    (
      occurrence: EventOccurrence,
      placement: EventPlacement,
      kind: 'move' | 'resize',
      reason: ChangeReason,
      source: unknown,
    ) => {
      const change = (value: EventPlacement) => changeFor(occurrence, value, kind);
      const same = (a: EventCalendarEventChange<E>, b: EventCalendarEventChange<E>) =>
        JSON.stringify([a.start, a.end]) === JSON.stringify([b.start, b.end]);
      const accepted = ask(
        change(placementOf(occurrence)),
        change(placement),
        same,
        reason,
        source,
        onEventChange,
      );
      if (accepted) {
        getLiveAnnouncer().announce(
          `${occurrence.event.title}, ${formatOccurrence(
            { ...occurrence, start: placement.start, end: placement.end },
            { locale: resolvedLocale, hourCycle: resolvedCycle },
          )}`,
        );
      }
      return accepted;
    },
    [changeFor, onEventChange, resolvedCycle, resolvedLocale],
  );

  const title = viewTitle(currentView, range, currentDate, {
    locale: resolvedLocale,
    listRange: currentView === 'list' ? resolvedListRange : undefined,
  });

  const lastRange = useRef<string | null>(null);
  useEffect(() => {
    const key = `${rangeStart}/${rangeEnd}/${currentView}`;
    if (lastRange.current === key) return;
    lastRange.current = key;
    onRangeChange?.({ start: range.start, end: range.end, view: currentView });
  }, [currentView, onRangeChange, rangeEnd, rangeStart]);

  /* ── Focus inside the grid ───────────────────────────────────────────── */

  const [row, setRow] = useState<GridRow>('timed');
  const pendingFocus = useRef<{ date: string; row: string } | null>(null);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    bodyRef.current
      ?.querySelector<HTMLElement>(`[data-row='${target.row}'][data-date='${target.date}']`)
      ?.focus();
  });

  const eventElements = useRef(new Map<string, HTMLElement>());
  const registerEvent = useCallback((key: string, element: HTMLElement | null) => {
    if (element === null) eventElements.current.delete(key);
    else eventElements.current.set(key, element);
  }, []);

  /* ── The two panels ──────────────────────────────────────────────────── */

  const [more, setMore] = useState<{ date: PlainDate; element: HTMLElement } | null>(null);
  const [detailAnchor, setDetailAnchor] = useState<HTMLElement | null>(null);

  const openOccurrence = useMemo(
    () =>
      currentOpen === null
        ? null
        : (occurrences.find((occurrence) => occurrence.key === currentOpen) ?? null),
    [currentOpen, occurrences],
  );

  const hostsDetail = renderEventDetail !== undefined;

  /* ── Selection by pointer ────────────────────────────────────────────── */

  const [pending, setPending] = useState<EventCalendarSelection | null>(null);
  const drag = useRef<
    | { kind: 'days'; anchor: PlainDate }
    | { kind: 'hours'; date: PlainDate; anchor: number; column: HTMLElement }
    | null
  >(null);
  const [startHour, endHour] = resolvedHours;

  const minuteAt = (column: HTMLElement, clientY: number, round: 'floor' | 'ceil') => {
    const rect = column.getBoundingClientRect();
    const span = (endHour - startHour) * 60;
    const raw = startHour * 60 + ((clientY - rect.top) / Math.max(1, rect.height)) * span;
    const snapped = Math[round](raw / resolvedSlot) * resolvedSlot;
    return Math.min(endHour * 60, Math.max(startHour * 60, snapped));
  };

  /** A stretch in words: the day, its hours, or the first and the last day. */
  const stretchWords = useCallback(
    (next: EventCalendarSelection) => {
      const options = { locale: resolvedLocale, hourCycle: resolvedCycle };
      return isPlainDateTime(next.start)
        ? `${fullDate({ locale: resolvedLocale }, next.start.date)}, ${formatTimeRange(
            next.start.time,
            (next.end as PlainDateTime).time,
            options,
          )}`
        : isSameDate(next.start, next.end as PlainDate)
          ? fullDate({ locale: resolvedLocale }, next.start)
          : `${fullDate({ locale: resolvedLocale }, next.start)} – ${fullDate(
              { locale: resolvedLocale },
              next.end as PlainDate,
            )}`;
    },
    [resolvedCycle, resolvedLocale],
  );

  /** The chosen stretch in words, said once through the shared live region. */
  const announce = useCallback(
    (next: EventCalendarSelection) =>
      getLiveAnnouncer().announce(t('selected', { text: stretchWords(next) })),
    [stretchWords, t],
  );

  useEffect(() => {
    if (pending === null) return undefined;
    const move = (event: PointerEvent) => {
      const state = drag.current;
      if (state === null) return;
      if (state.kind === 'hours') {
        const here = minuteAt(state.column, event.clientY, 'floor');
        const from = Math.min(state.anchor, here);
        const to = Math.max(state.anchor, here) + resolvedSlot;
        setPending({
          start: atMinutes(state.date, from),
          end: atMinutes(state.date, Math.min(to, endHour * 60)),
        });
        return;
      }
      const over =
        dayUnder(rootRef.current, 'day', event.clientX, event.clientY) ??
        dayUnder(rootRef.current, 'all-day', event.clientX, event.clientY);
      if (over === null) return;
      setPending(orderedDays(state.anchor, over));
    };
    const up = (event: PointerEvent) => {
      const chosen = pending;
      drag.current = null;
      setPending(null);
      if (chosen !== null && requestSelection(chosen, 'pointer', event)) announce(chosen);
    };
    const cancel = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      drag.current = null;
      setPending(null);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('keydown', cancel, true);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('keydown', cancel, true);
    };
  });

  /** A press on an editable event: nothing moves until the pointer travels four pixels. */
  const edit = useRef<{
    occurrence: EventOccurrence;
    kind: 'move' | 'resize';
    row: string;
    date: PlainDate;
    column: HTMLElement;
    x: number;
    y: number;
    started: boolean;
    placement: EventPlacement;
    invalid: boolean;
  } | null>(null);
  const swallowClick = useRef(false);

  const startEdit = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const target = event.target as HTMLElement;
    const element = target.closest<HTMLElement>("[data-part='event'][data-editable]");
    const cell = element?.closest<HTMLElement>('[data-row]');
    const key = element?.dataset['key'];
    const iso = cell?.dataset['date'];
    if (element === null || element === undefined || cell === null || cell === undefined)
      return false;
    const occurrence = occurrences.find((entry) => entry.key === key);
    if (occurrence === undefined || iso === undefined) return false;
    const row = cell.dataset['row'] ?? '';
    const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
    edit.current = {
      occurrence,
      kind: target.closest("[data-part='resize-handle']") ? 'resize' : 'move',
      row,
      date: dayUnder(rootRef.current, row, event.clientX, event.clientY) ?? { year, month, day },
      column: cell,
      x: event.clientX,
      y: event.clientY,
      started: false,
      placement: placementOf(occurrence),
      invalid: false,
    };
    const hourSize = () =>
      Math.max(1, cell.getBoundingClientRect().height / Math.max(1, endHour - startHour));
    const move = (moved: PointerEvent) => {
      const state = edit.current;
      if (state === null) return;
      if (!state.started && Math.hypot(moved.clientX - state.x, moved.clientY - state.y) < 4)
        return;
      state.started = true;
      const over = dayUnder(rootRef.current, state.row, moved.clientX, moved.clientY);
      const days = over === null ? 0 : daysBetween(state.date, over);
      const minutes =
        state.row === 'timed'
          ? Math.round(((moved.clientY - state.y) / hourSize()) * (60 / resolvedSlot)) *
            resolvedSlot
          : 0;
      const shift: EventShift = { days, minutes };
      state.placement =
        state.kind === 'move'
          ? movePlacement(placementOf(state.occurrence), shift)
          : resizePlacement(placementOf(state.occurrence), shift, resolvedSlot);
      state.invalid = !allows(state.occurrence, state.placement, state.kind);
      setEditing({
        key: state.occurrence.key,
        placement: state.placement,
        invalid: state.invalid,
      });
    };
    const finish = (ended: Event, commit: boolean) => {
      const state = edit.current;
      edit.current = null;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('keydown', cancel, true);
      setEditing(null);
      if (state === null || !state.started) return;
      swallowClick.current = true;
      /* Let go over a refused destination: the event goes back, and nothing is asked. */
      if (commit && !state.invalid)
        requestEventChange(state.occurrence, state.placement, state.kind, 'pointer', ended);
    };
    const up = (ended: PointerEvent) => finish(ended, true);
    const cancel = (pressed: globalThis.KeyboardEvent) => {
      if (pressed.key !== 'Escape' || edit.current?.started !== true) return;
      pressed.stopPropagation();
      finish(pressed, false);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('keydown', cancel, true);
    return true;
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (startEdit(event)) return;
    if (selectionMode !== 'range') return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input')) return;
    const cell = target.closest<HTMLElement>('[data-row]');
    const iso = cell?.dataset['date'];
    if (cell === null || cell === undefined || iso === undefined) return;
    const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
    const at = { year, month, day };
    if (cell.dataset['row'] === 'timed') {
      const anchor = minuteAt(cell, event.clientY, 'floor');
      drag.current = { kind: 'hours', date: at, anchor, column: cell };
      setPending({
        start: atMinutes(at, anchor),
        end: atMinutes(at, Math.min(anchor + resolvedSlot, endHour * 60)),
      });
    } else if (cell.dataset['row'] === 'day' || cell.dataset['row'] === 'all-day') {
      drag.current = { kind: 'days', anchor: at };
      setPending({ start: at, end: at });
    } else return;
    event.preventDefault();
  };

  /* ── Context menu ────────────────────────────────────────────────────── */

  /**
   * The target of the menu that shows, and the element it stands on. Its event
   * carries `data-context`; its stretch is drawn as the selection being made,
   * so the reader sees what "New event" will cover before choosing it.
   */
  const [context, setContext] = useState<{
    target: EventCalendarContextTarget<E>;
    element: HTMLElement;
  } | null>(null);
  /* What the press that is opening the menu pointed at, resolved before the
     family asks to open; the request is refused when it pointed at nothing. */
  const aimed = useRef<{ target: EventCalendarContextTarget<E>; element: HTMLElement } | null>(
    null,
  );
  const contextFamily = useRef<ContextMenuContextValue | null>(null);

  const aimAt = (from: EventTarget | null, clientY: number | null) => {
    aimed.current = null;
    const body = bodyRef.current;
    if (renderContextMenu === undefined || !(from instanceof Element) || body === null) return null;
    if (!body.contains(from)) return null;
    const drawn = from.closest<HTMLElement>("[data-part='event'][data-key]");
    const occurrence =
      drawn === null ? undefined : occurrences.find((entry) => entry.key === drawn.dataset['key']);
    let found: { target: EventCalendarContextTarget<E>; element: HTMLElement };
    if (drawn !== null && occurrence !== undefined) {
      found = {
        target: { kind: 'event', occurrence: occurrence as EventOccurrence<E> },
        element: drawn,
      };
    } else {
      const cell = from.closest<HTMLElement>('[data-date]');
      const iso = cell?.dataset['date'];
      if (cell === null || cell === undefined || iso === undefined) return null;
      const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
      const timed = cell.dataset['row'] === 'timed';
      const slot = contextSlot({
        date: { year, month, day },
        minute: timed && clientY !== null ? minuteAt(cell, clientY, 'floor') : null,
        timed,
        held: pending ?? currentSelection,
        slot: resolvedSlot,
        endMinute: endHour * 60,
      }) as EventCalendarSelection;
      /* From the keyboard a column is the height of the day: the menu hangs
         from the selection drawn in it, or from the day's header. */
      const element =
        timed && clientY === null
          ? (cell.querySelector<HTMLElement>("[data-part='selection']") ??
            body.querySelector<HTMLElement>(`[data-part='column-header'][data-date='${iso}']`) ??
            cell)
          : cell;
      found = { target: { kind: 'slot', slot }, element };
    }
    const items = renderContextMenu(found.target);
    if (items === null || items === undefined || items === false) return null;
    aimed.current = found;
    return found;
  };

  const contextLabel =
    context === null
      ? undefined
      : context.target.kind === 'event'
        ? context.target.occurrence.event.title
        : stretchWords(context.target.slot);

  /* ── Keyboard ────────────────────────────────────────────────────────── */

  const selectionAnchor = useRef<PlainDate | null>(null);

  const moveTo = (next: PlainDate, nextRow: string, event: SyntheticEvent) => {
    pendingFocus.current = { date: toISODate(next), row: nextRow };
    if (isSameDate(next, currentDate)) {
      bodyRef.current
        ?.querySelector<HTMLElement>(`[data-row='${nextRow}'][data-date='${toISODate(next)}']`)
        ?.focus();
      pendingFocus.current = null;
      return;
    }
    requestDate(next, 'keyboard', event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>('[data-row]');
    if (cell === null || !bodyRef.current?.contains(cell) || cell.dataset['row'] === undefined)
      return;
    const cellRow = cell.dataset['row'];

    if (target !== cell) {
      const element = target.closest<HTMLElement>("[data-part='event'][data-editable]");
      if (element !== null && event.altKey && event.key.startsWith('Arrow')) {
        const occurrence = occurrences.find((entry) => entry.key === element.dataset['key']);
        if (occurrence === undefined) return;
        event.preventDefault();
        const rtl = getComputedStyle(cell).direction === 'rtl';
        const sideways = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        const forward =
          event.key === 'ArrowRight'
            ? !rtl
            : event.key === 'ArrowLeft'
              ? rtl
              : event.key === 'ArrowDown';
        const step = forward ? 1 : -1;
        const shift: EventShift = sideways
          ? { days: step, minutes: 0 }
          : cellRow === 'timed'
            ? { days: 0, minutes: step * resolvedSlot }
            : { days: cellRow === 'day' ? step * 7 : 0, minutes: 0 };
        if (shift.days === 0 && shift.minutes === 0) return;
        const kind = event.shiftKey ? 'resize' : 'move';
        /* A refused destination is passed over for the next one allowed; with
           none in reach the event stays, and the reader is told why. */
        const placement = nextAllowedPlacement(placementOf(occurrence), shift, kind, {
          slot: resolvedSlot,
          hours: resolvedHours,
          allowed: (candidate) => allows(occurrence, candidate, kind),
        });
        if (placement === null) {
          getLiveAnnouncer().announce(t('dropInvalid', { title: occurrence.event.title }));
          return;
        }
        pendingEventFocus.current = occurrence.key;
        requestEventChange(occurrence, placement, kind, 'keyboard', event);
        return;
      }
      if (event.key === 'Escape' || event.key === 'F2') {
        event.preventDefault();
        cell.focus();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const widgets = [...cell.querySelectorAll<HTMLElement>(WIDGETS)];
        const index = widgets.indexOf(target.closest<HTMLElement>(WIDGETS) ?? target);
        const next = widgets[index + (event.key === 'ArrowDown' ? 1 : -1)];
        event.preventDefault();
        next?.focus();
      }
      return;
    }

    const rtl = getComputedStyle(cell).direction === 'rtl';
    const monthGrid = cellRow === 'day';
    const moves: Record<string, DateMove | undefined> = {
      ArrowLeft: rtl ? 'next' : 'previous',
      ArrowRight: rtl ? 'previous' : 'next',
      Home: event.ctrlKey || event.metaKey ? 'periodStart' : 'rowStart',
      End: event.ctrlKey || event.metaKey ? 'periodEnd' : 'rowEnd',
      PageUp: event.shiftKey && monthGrid ? 'yearBack' : 'pageBack',
      PageDown: event.shiftKey && monthGrid ? 'yearForward' : 'pageForward',
      ArrowUp: monthGrid ? 'up' : undefined,
      ArrowDown: monthGrid ? 'down' : undefined,
    };

    /* In the hours, Shift with the vertical arrows grows the chosen stretch. */
    if (
      cellRow === 'timed' &&
      event.shiftKey &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      selectionMode === 'range'
    ) {
      event.preventDefault();
      const held = currentSelection;
      if (
        held === null ||
        !isPlainDateTime(held.start) ||
        !isSameDate(held.start.date, currentDate)
      )
        return;
      const startMinutes = secondsOfDay(held.start.time) / 60;
      const endValue = held.end as PlainDateTime;
      const endMinutes = isSameDate(endValue.date, currentDate)
        ? secondsOfDay(endValue.time) / 60
        : 1440;
      const nextEnd = Math.min(
        endHour * 60,
        Math.max(
          startMinutes + resolvedSlot,
          endMinutes + (event.key === 'ArrowDown' ? 1 : -1) * resolvedSlot,
        ),
      );
      const next = { start: held.start, end: atMinutes(currentDate, nextEnd) };
      if (requestSelection(next, 'keyboard', event)) announce(next);
      return;
    }

    if (!monthGrid && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const order: GridRow[] = ['header', 'all-day', 'timed'];
      const index = order.indexOf(cellRow as GridRow);
      const nextRow = order[index + (event.key === 'ArrowDown' ? 1 : -1)];
      if (nextRow === undefined) return;
      setRow(nextRow);
      pendingFocus.current = { date: toISODate(currentDate), row: nextRow };
      return;
    }

    const move = moves[event.key];
    if (move !== undefined) {
      event.preventDefault();
      const next = moveDate(currentView, currentDate, move, viewOptions);
      if (
        event.shiftKey &&
        selectionMode === 'range' &&
        event.key.startsWith('Arrow') &&
        cellRow !== 'timed'
      ) {
        const anchor = selectionAnchor.current ?? currentDate;
        selectionAnchor.current = anchor;
        const chosen = orderedDays(anchor, next);
        if (requestSelection(chosen, 'keyboard', event)) announce(chosen);
      } else if (!event.shiftKey) {
        selectionAnchor.current = null;
      }
      moveTo(next, cellRow, event);
      return;
    }

    if (event.key === 'Enter' || event.key === 'F2') {
      const first = cell.querySelector<HTMLElement>(WIDGETS);
      if (first === null) return;
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.key === ' ' && selectionMode === 'range') {
      event.preventDefault();
      selectionAnchor.current = currentDate;
      const next: EventCalendarSelection =
        cellRow === 'timed'
          ? (() => {
              const from = Math.min(
                Math.max(secondsOfDay(resolvedScroll) / 60, startHour * 60),
                endHour * 60 - resolvedSlot,
              );
              return {
                start: atMinutes(currentDate, from),
                end: atMinutes(currentDate, from + resolvedSlot),
              };
            })()
          : { start: currentDate, end: currentDate };
      if (requestSelection(next, 'keyboard', event)) announce(next);
      return;
    }

    if (event.key === 'Escape' && currentSelection !== null) {
      event.preventDefault();
      requestSelection(null, 'escape', event);
    }
  };

  /* ── Scroll to the working morning ───────────────────────────────────── */

  const scrollToTime = useCallback(
    (time: PlainTime) => {
      const scroller = scrollerRef.current;
      const column = scroller?.querySelector<HTMLElement>("[data-part='column']");
      if (scroller === null || scroller === undefined || column === null || column === undefined)
        return;
      const hourSize = column.getBoundingClientRect().height / Math.max(1, endHour - startHour);
      /* Half a label above the hour: the label is centred on its rule, and a
         scroll that stopped on the rule cut the first visible one in half. */
      /* Half a line of the label's own type: its box is the whole hour. */
      const label = scroller.querySelector<HTMLElement>("[data-part='hour']");
      const lead = label === null ? 0 : parseFloat(getComputedStyle(label).lineHeight) / 2 || 0;
      scroller.scrollTop = Math.max(0, (secondsOfDay(time) / 3600 - startHour) * hourSize - lead);
    },
    [endHour, startHour],
  );

  useLayoutEffect(() => {
    if (layout === 'grid' && (currentView === 'week' || currentView === 'day')) {
      scrollToTime(resolvedScroll);
    }
    /* On entering the hours only: paging a week keeps where the reader was. */
  }, [currentView, layout]);

  /* ── Loading, announced once ─────────────────────────────────────────── */

  const delay = loadingDelay ?? defaults.loadingDelay;
  const holdFor = loadingMinDuration ?? defaults.loadingMinDuration;
  /**
   * The indicator exists while there is a wait, and a little after: through
   * the delay it may still be withheld in, and the hold it keeps once shown.
   * Mounted with nothing to report it was an element that is only `hidden`,
   * and a `hidden` progress bar is still painted in its linear shape.
   */
  const [loaderMounted, setLoaderMounted] = useState(loading);
  useEffect(() => {
    if (loading) {
      setLoaderMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setLoaderMounted(false), delay + holdFor);
    return () => clearTimeout(timer);
  }, [delay, holdFor, loading]);
  const loadingText = t('loading');
  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => getLiveAnnouncer().announce(loadingText), delay);
    return () => clearTimeout(timer);
  }, [delay, loading, loadingText]);

  /* ── The handle ──────────────────────────────────────────────────────── */

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return rootRef.current;
      },
      focus() {
        const stop =
          bodyRef.current?.querySelector<HTMLElement>("[data-row][tabindex='0']") ??
          bodyRef.current?.querySelector<HTMLElement>("[data-part='event']");
        stop?.focus();
      },
      focusDate(next: PlainDate) {
        pendingFocus.current = {
          date: toISODate(next),
          row: currentView === 'month' ? 'day' : row,
        };
        if (isSameDate(next, currentDate)) {
          bodyRef.current
            ?.querySelector<HTMLElement>(
              `[data-row='${pendingFocus.current.row}'][data-date='${toISODate(next)}']`,
            )
            ?.focus();
          pendingFocus.current = null;
          return;
        }
        requestDate(next, 'programmatic');
      },
      focusEvent(key: string) {
        const element = eventElements.current.get(key);
        if (element === undefined || !element.isConnected) return false;
        element.focus();
        return true;
      },
      scrollToTime,
    }),
    [currentDate, currentView, requestDate, row, scrollToTime],
  );

  /* ── The model the views share ───────────────────────────────────────── */

  const model: EventCalendarModel = {
    id: baseId,
    t,
    locale: resolvedLocale,
    hourCycle: resolvedCycle,
    timeZone: resolvedZone,
    view: currentView,
    date: currentDate,
    today,
    now,
    calendars,
    openKey: currentOpen,
    hostsDetail,
    selection: currentSelection,
    pendingSelection: pending ?? (context?.target.kind === 'slot' ? context.target.slot : null),
    selectionMode,
    narrow,
    weekNumbers: weekNumbers ?? defaults.weekNumbers,
    maxEvents: resolvedMaxEvents,
    maxColumns: resolvedMaxColumns,
    slotDuration: resolvedSlot,
    dayHours: resolvedHours,
    workingHours,
    row: currentView === 'month' ? 'timed' : row,
    moreDate: more === null ? null : toISODate(more.date),
    headingLevel: level,
    renderEvent: renderEvent as EventCalendarModel['renderEvent'],
    canEdit,
    draggingKey: editing?.key ?? null,
    dropInvalid: editing?.invalid ?? false,
    contextKey: context?.target.kind === 'event' ? context.target.occurrence.key : null,
    renderDayContent,
    activate(occurrence, element, reason, event) {
      setDetailAnchor(element);
      setMore(null);
      requestOpen(currentOpen === occurrence.key ? null : occurrence.key, reason, event);
    },
    drill(next, reason, event) {
      /* A month of marks on a phone opens the day's events where the finger
         is, as a sheet; the day view there is a list of one day. */
      if (narrow && currentView === 'month' && layout === 'grid') {
        const element = event.currentTarget as HTMLElement;
        setMore((held) =>
          held !== null && isSameDate(held.date, next) ? null : { date: next, element },
        );
        return;
      }
      requestView('day', reason, event);
      requestDate(next, reason, event);
    },
    openMore(next, element) {
      setMore((held) =>
        held !== null && isSameDate(held.date, next) ? null : { date: next, element },
      );
    },
    registerEvent,
    calendarLabel: (key) => calendars.find((entry) => entry.key === key)?.label,
    colorOf: (key) => calendarColor(key, calendars),
  };

  /* ── Header ──────────────────────────────────────────────────────────── */

  const titleElement = createElement(
    `h${level}`,
    {
      'aria-live': 'polite',
      'data-part': 'title',
      ...selectorKeyProps('part', 'title'),
      id: titleId,
    },
    title,
  );

  const headerElement = header ? (
    <div data-part="header" data-part-header="">
      {titleElement}
      <div aria-label={t('navigation')} data-part="navigation" data-part-navigation="" role="group">
        <button
          aria-label={t(`previous.${currentView}` as const)}
          data-part="previous"
          data-part-previous=""
          onClick={(clicked) =>
            requestDate(
              stepView(currentView, currentDate, -1, viewOptions),
              clicked.detail === 0 ? 'keyboard' : 'pointer',
              clicked,
            )
          }
          type="button"
        >
          <Icon>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
        <button
          data-part="today"
          data-part-today=""
          onClick={(clicked) =>
            requestDate(
              today ?? todayIn(resolvedZone),
              clicked.detail === 0 ? 'keyboard' : 'pointer',
              clicked,
            )
          }
          type="button"
        >
          {t('today')}
        </button>
        <button
          aria-label={t(`next.${currentView}` as const)}
          data-part="next"
          data-part-next=""
          onClick={(clicked) =>
            requestDate(
              stepView(currentView, currentDate, 1, viewOptions),
              clicked.detail === 0 ? 'keyboard' : 'pointer',
              clicked,
            )
          }
          type="button"
        >
          <Icon>
            <Glyph name="chevron-right" />
          </Icon>
        </button>
      </div>
      {views.length > 1 ? (
        <div data-part="views" data-part-views="">
          <SegmentedControl
            aria-label={t('views')}
            fullWidth
            onValueChange={(next, request) =>
              requestView(next as typeof currentView, request.reason, request.source)
            }
            value={currentView}
          >
            {views.map((name) => (
              <Segment key={name} value={name}>
                {t(`view.${name}` as const)}
              </Segment>
            ))}
          </SegmentedControl>
        </div>
      ) : null}
      {calendars.length > 1 ? (
        <Menu>
          <MenuTrigger
            render={(triggerProps) => (
              <button {...withSelectorKey(triggerProps, 'part', 'filter')} type="button">
                <Icon>
                  <Glyph name="funnel" />
                </Icon>
                <span>{t('calendars')}</span>
                <Icon>
                  <Glyph name="chevron-down" />
                </Icon>
              </button>
            )}
          />
          <MenuContent>
            {calendars.map((entry) => {
              const color = calendarColor(entry.key, calendars);
              return (
                <MenuCheckboxItem
                  checked={shown.includes(entry.key)}
                  key={entry.key}
                  onCheckedChange={(checked, request) =>
                    requestVisible(
                      checked
                        ? allKeys.filter((key) => key === entry.key || shown.includes(key))
                        : shown.filter((key) => key !== entry.key),
                      request.reason,
                      request.source,
                    )
                  }
                >
                  {/* The calendar's colour opens the label; the column before it is
                      the check's. A menu item holds one mark in that column, and a
                      dot there drew the check over itself. */}
                  <svg aria-hidden="true" height="10" viewBox="0 0 14 10" width="14">
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      style={{
                        fill: color === null ? 'currentColor' : `var(--slotted-data-${color})`,
                      }}
                    />
                  </svg>
                  {entry.label}
                </MenuCheckboxItem>
              );
            })}
          </MenuContent>
        </Menu>
      ) : null}
      {actions === undefined || actions === null ? null : (
        <div data-part="actions" data-part-actions="">
          {actions}
        </div>
      )}
    </div>
  ) : null;

  /* ── Body ────────────────────────────────────────────────────────────── */

  const emptyKey = currentView === 'month' ? 'month' : currentView === 'day' ? 'day' : 'week';
  const bodyContent = (
    <>
      <div data-part="loader" data-part-loader="">
        {loaderMounted ? (
          <ProgressBar
            delay={delay}
            hideLabel
            label={t('loading')}
            loading={loading}
            minDuration={holdFor}
            onWithdraw={() => setLoaderMounted(false)}
            size="sm"
          />
        ) : null}
      </div>
      {error === undefined || error === null ? null : (
        <div data-part="error" data-part-error="">
          {error}
        </div>
      )}
      {layout === 'list' ? (
        <List
          days={range.days}
          empty={empty}
          emptyText={t(`empty.${emptyKey}` as const)}
          occurrences={laidOut}
        />
      ) : currentView === 'month' ? (
        <Month
          anchorMonth={currentDate.month}
          occurrences={laidOut}
          titleId={titleId}
          weeks={range.weeks}
        />
      ) : (
        <TimeGrid
          days={range.days}
          occurrences={laidOut}
          scrollerRef={scrollerRef}
          titleId={titleId}
        />
      )}
    </>
  );
  const bodyProps = {
    'aria-busy': loading ? true : undefined,
    'data-part': 'body',
    ...selectorKeyProps('part', 'body'),
    onKeyDown: handleKeyDown,
    onPointerDown: startDrag,
  } as const;

  /**
   * With a context menu the body is the `context-menu` target: one region for
   * every day, hour and event, the way a file list is one target for its rows.
   * The press is aimed before the family sees it — at an event, or at the
   * stretch under the pointer — and a press at nothing, or at something the
   * application gives no items for, keeps the browser's own menu.
   */
  const bodyElement =
    renderContextMenu === undefined ? (
      <div {...bodyProps} ref={bodyRef}>
        {bodyContent}
      </div>
    ) : (
      <ContextMenu
        onOpenChange={(open, request) => {
          if (!open) {
            setContext(null);
            return;
          }
          const found = aimed.current;
          if (found === null) {
            request.cancel();
            return;
          }
          setContext(found);
          /* From the keyboard the menu hangs from what it acts on, not the grid. */
          if (request.reason === 'keyboard') contextFamily.current?.setAnchor(found.element);
        }}
      >
        <ContextFamily handle={contextFamily} />
        <ContextMenuTrigger
          render={(trigger) => (
            <div
              {...keyedProps({ ...trigger, ...bodyProps })}
              onContextMenuCapture={(event) => {
                if (aimAt(event.target, event.clientY) === null) event.stopPropagation();
              }}
              onKeyDown={(event) => {
                if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
                  if (aimAt(event.target, null) === null) return;
                } else handleKeyDown(event);
                trigger.onKeyDown?.(event);
              }}
              onPointerDown={(event) => {
                if (event.pointerType !== 'mouse') aimAt(event.target, event.clientY);
                startDrag(event);
                trigger.onPointerDown?.(event);
              }}
              ref={(node) => {
                bodyRef.current = node as HTMLDivElement | null;
                trigger.ref?.(node);
              }}
            >
              {bodyContent}
            </div>
          )}
        />
        <MenuContent aria-label={contextLabel}>
          {context === null ? null : renderContextMenu(context.target)}
        </MenuContent>
      </ContextMenu>
    );

  const moreOccurrences = more === null ? [] : occurrencesOn(occurrences, more.date);
  const moreTitle = more === null ? null : fullDate(model, more.date);
  const moreList =
    more === null ? null : (
      <ul
        aria-label={t('dayEvents', { day: moreTitle ?? '' })}
        data-layout="stacked"
        data-part="list-events"
        data-part-list-events=""
        role="list"
      >
        {moreOccurrences.map((occurrence) => (
          <li key={occurrence.key}>
            <EventItem
              date={more.date}
              inGrid={false}
              layout="list"
              occurrence={occurrence}
              withLocation
            />
          </li>
        ))}
      </ul>
    );
  const detailAnchorElement =
    (currentOpen !== null && eventElements.current.get(currentOpen)?.isConnected
      ? eventElements.current.get(currentOpen)
      : detailAnchor) ?? null;
  const detailWhen =
    openOccurrence === null ? null : (
      <When
        when={occurrenceWhen(openOccurrence, { hourCycle: resolvedCycle, locale: resolvedLocale })}
      />
    );
  const detailBody =
    openOccurrence === null
      ? null
      : renderEventDetail?.(openOccurrence as EventOccurrence<E>, {
          close: () => requestOpen(null, 'programmatic'),
        });
  moreReturn.current = more?.element ?? null;
  detailReturn.current = detailAnchorElement;

  /**
   * Below the compact size class the "+N" panel and the detail are sheets from
   * the bottom edge, not popovers hung from a mark a finger just covered: the
   * whole width, a title, a close, the platform's way back. They live inside
   * the root, so a region that contains its fixed layers — a phone frame, a
   * pane — keeps them; in a page they cover the window.
   */
  const panels = narrow ? (
    <>
      <Drawer
        container={sheetHost}
        finalFocus={moreReturn}
        onOpenChange={(open) => {
          if (!open) setMore(null);
        }}
        open={more !== null}
        side="bottom"
      >
        <DrawerPanel>
          <DrawerResizer />
          <DrawerHeader>
            <DrawerTitle>{moreTitle}</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>{moreList}</DrawerBody>
        </DrawerPanel>
      </Drawer>
      {hostsDetail ? (
        <Drawer
          container={sheetHost}
          finalFocus={detailReturn}
          onOpenChange={(open, request) => {
            if (!open) requestOpen(null, request.reason, request.source);
          }}
          open={openOccurrence !== null}
          side="bottom"
        >
          <DrawerPanel>
            <DrawerResizer />
            <DrawerHeader>
              <DrawerTitle>{openOccurrence?.event.title}</DrawerTitle>
              <DrawerDescription>{detailWhen}</DrawerDescription>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>{detailBody}</DrawerBody>
          </DrawerPanel>
        </Drawer>
      ) : null}
    </>
  ) : (
    <>
      <Popover
        onOpenChange={(open) => {
          if (!open) setMore(null);
        }}
        open={more !== null}
        portal={false}
      >
        <AnchorTo element={more?.element ?? null} />
        <PopoverLayer>
          <PopoverContent>
            {more === null ? null : (
              <>
                <PopoverHeader>
                  <PopoverTitle>{moreTitle}</PopoverTitle>
                  <PopoverClose />
                </PopoverHeader>
                <PopoverBody>{moreList}</PopoverBody>
              </>
            )}
          </PopoverContent>
        </PopoverLayer>
      </Popover>
      {hostsDetail ? (
        <Popover
          finalFocus={detailAnchor ?? undefined}
          onOpenChange={(open, request) => {
            if (!open) requestOpen(null, request.reason, request.source);
          }}
          open={openOccurrence !== null}
          portal={false}
          size="lg"
        >
          <AnchorTo element={detailAnchorElement} />
          <PopoverLayer>
            <PopoverContent>
              {openOccurrence === null ? null : (
                <>
                  <PopoverHeader>
                    <PopoverTitle>{openOccurrence.event.title}</PopoverTitle>
                    <PopoverDescription>{detailWhen}</PopoverDescription>
                    <PopoverClose />
                  </PopoverHeader>
                  <PopoverBody>{detailBody}</PopoverBody>
                </>
              )}
            </PopoverContent>
          </PopoverLayer>
        </Popover>
      ) : null}
    </>
  );

  const rootProps: EventCalendarRootProps = keyedProps({
    ...nativeProps,
    className,
    'data-layout': layout,
    'data-loading': loading ? '' : undefined,
    'data-part': 'root',
    'data-slot-duration': String(resolvedSlot),
    'data-ui': 'event-calendar',
    'data-view': currentView,
    onClickCapture: (clicked: ReactMouseEvent<HTMLElement>) => {
      nativeProps.onClickCapture?.(clicked as never);
      if (!swallowClick.current) return;
      swallowClick.current = false;
      clicked.preventDefault();
      clicked.stopPropagation();
    },
    ref: (node: HTMLElement | null) => {
      rootRef.current = node;
      if (node !== sheetHost) setSheetHost(node);
    },
    style: style as CSSProperties | undefined,
    children: (
      <EventCalendarContext.Provider value={model}>
        {headerElement}
        {bodyElement}
        {panels}
      </EventCalendarContext.Provider>
    ),
  });

  return render === undefined ? (
    <div {...(rootProps as EventCalendarRootProps & { ref?: Ref<HTMLDivElement> })} />
  ) : (
    render(rootProps)
  );
}
