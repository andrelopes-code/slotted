import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/time-range-picker/time-range-picker.css';

import {
  compareTime,
  createTimeFormat,
  firstUnavailableIndex,
  hourJump,
  isSameTime,
  isTruncated,
  nearestIndex,
  openingIndex as openingIndexOf,
  nowIn,
  runRefusal,
  secondsOfDay,
  timeList,
  timeRangeProblems,
  timeRangeSeconds,
  toISOTime,
} from '@slotted/core/date';
import type { PlainTime, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { timeRangePickerMessages } from '@slotted/core/i18n';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
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

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { TimeField } from '../time-field';
import type { TimeFieldChangeRequest, TimeFieldHandle } from '../time-field';
import { useTimeRangePickerDefaults } from './time-range-picker-defaults';
import type {
  TimeRange,
  TimeRangePickerHighlight,
  TimeRangePickerPosition,
  TimeRangePickerPresetProps,
  TimeRangePickerPresetRootProps,
  TimeRangePickerProps,
  TimeRangePickerRootProps,
  TimeRangePickerValueReason,
} from './time-range-picker.types';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * The number is here as well as in the stylesheet because the DOM has to say
 * which presentation it is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** What an empty list steps from before the browser has said what time it is. */
const SSR_REFERENCE: PlainTime = { hour: 12, minute: 0, second: 0 };

const EMPTY: TimeRange = { start: null, end: null };
const NO_HIGHLIGHT: TimeRangePickerHighlight = { start: null, end: null };

type PositionReason = 'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic';
type HighlightReason = 'pointer' | 'keyboard' | 'programmatic';

interface PresetContextValue {
  readonly held: TimeRange | null;
  choose(range: TimeRange, event: MouseEvent<HTMLElement>): void;
}

const PresetContext = createContext<PresetContextValue | null>(null);

/** The one word for nothing: a value whose both ends are `null` is `null`. */
function normalize(range: TimeRange | null): TimeRange | null {
  return range === null || (range.start === null && range.end === null) ? null : range;
}

export function isSameTimeRange(a: TimeRange | null, b: TimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return isSameTime(a.start, b.start) && isSameTime(a.end, b.end);
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

function other(position: TimeRangePickerPosition): TimeRangePickerPosition {
  return position === 'start' ? 'end' : 'start';
}

/**
 * A one-line frame — the value in words, a clear and the trigger — and behind
 * it one end at a time: two tabs, the field of the current end, a hint, and
 * the list of that end.
 *
 * **The frame is one line at any width.** Two segmented fields stood in it
 * first and were withdrawn at the visual gate: a segment cannot shrink, and
 * two of them broke the frame into two lines in any form column narrower than
 * they are, against the height every control shares. The fields live in the
 * panel's band, where the reader types and where the width is the panel's.
 *
 * **One end at a time.** Two lists side by side were refused at the release
 * gate as too much interface at once for a lay reader and for a phone. The
 * tab says which end, the panel shows only that end, and choosing one end
 * moves to the other — the end list appears already striking what the chosen
 * start refuses, every row saying the duration the run would have.
 *
 * **A press that leaves the work with one end is not the value.** The press
 * that completes it emits the whole run; `Escape`, an outside press and the
 * trigger abandon the work and the previous value stands. An end typed in the
 * field is a value on its own, where the reader sees it.
 */
export function TimeRangePicker({
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
  footer,
  granularity,
  highlighted,
  hourCycle,
  invalid,
  isTimeUnavailable,
  lengthLabel,
  locale,
  max,
  maxLength,
  maxOptions,
  messages,
  min,
  minLength,
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
  referenceTime,
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
  ...nativeProps
}: TimeRangePickerProps) {
  const field = useField();
  const defaults = useTimeRangePickerDefaults();
  const appLocale = useLocale();
  const t = useMessages(timeRangePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fieldRef = useRef<TimeFieldHandle | null>(null);
  const fieldBox = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TimeRangePickerPosition, HTMLButtonElement | null>>({
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
  const [ownValue, setOwnValue] = useState<TimeRange | null>(normalize(defaultValue ?? null));
  const held = value === undefined ? ownValue : normalize(value);
  const [ownPosition, setOwnPosition] = useState<TimeRangePickerPosition>(defaultPosition);
  const currentPosition = position ?? ownPosition;
  const [ownHighlight, setOwnHighlight] = useState<TimeRangePickerHighlight>(
    defaultHighlighted ?? NO_HIGHLIGHT,
  );
  const highlight = highlighted ?? ownHighlight;

  /**
   * The work: the two ends as the reader left them while the panel is open.
   * A press in a list writes it; the value is asked for when it is whole.
   * Closed by anything, it is thrown away and rebuilt from the value on the
   * next open.
   */
  const [work, setWork] = useState<TimeRange>(held ?? EMPTY);
  /** The option under the pointer, which enters the duration and nothing else. */
  const [hovered, setHovered] = useState<{
    position: TimeRangePickerPosition;
    time: PlainTime;
  } | null>(null);
  /** Whether the list holds focus, so its highlight is the pending end. */
  const [listFocused, setListFocused] = useState(false);

  const resolvedLocale = locale ?? appLocale;
  const resolvedTimeZone = timeZone ?? defaults.timeZone;
  const resolvedGranularity = granularity ?? defaults.granularity;
  const resolvedHourCycle = hourCycle ?? defaults.hourCycle;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;
  const resolvedPlacement = placement ?? defaults.placement;
  const resolvedCloseOnSelect = closeOnSelect ?? defaults.closeOnSelect;
  const resolvedStep = step ?? defaults.step;
  const resolvedMaxOptions = maxOptions ?? defaults.maxOptions;
  const resolvedUnavailable = unavailableOptions ?? defaults.unavailableOptions;
  const lengthLabelOf = lengthLabel ?? defaults.lengthLabel;
  const resolvedLengthLabel = useCallback(
    (seconds: number) => lengthLabelOf(seconds, resolvedLocale),
    [lengthLabelOf, resolvedLocale],
  );
  /** The name of one end: the field's, its tab's and the hint's `{end}`. */
  const labelOf = (position: TimeRangePickerPosition) => t(position);
  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedRequired = required ?? field?.required;
  const editable = resolvedDisabled !== true && resolvedReadOnly !== true;

  const format = useMemo(
    () =>
      createTimeFormat({
        granularity: resolvedGranularity,
        hourCycle: resolvedHourCycle,
        locale: resolvedLocale,
      }),
    [resolvedGranularity, resolvedHourCycle, resolvedLocale],
  );

  const [clock, setClock] = useState<PlainTime>(() => SSR_REFERENCE);
  useEffect(() => setClock(nowIn(resolvedTimeZone)), [resolvedTimeZone]);
  const anchor = referenceTime ?? clock;

  const start = held?.start ?? null;
  const end = held?.end ?? null;
  const ordered = start !== null && end !== null && compareTime(start, end) <= 0;

  /**
   * Validity the family owns, beside the validity the consumer states: the
   * bounds, the predicate, the order of the two ends and the duration.
   */
  const problems = useMemo(
    () =>
      timeRangeProblems(held, { max, maxLength, min, minLength, unavailable: isTimeUnavailable }),
    [held, isTimeUnavailable, max, maxLength, min, minLength],
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
    (next: TimeRange | null, reason: TimeRangePickerValueReason, source: unknown) => {
      const normalized = normalize(next);
      const state = createControllable<TimeRange | null>({
        controlled: value === undefined ? undefined : held,
        initial: held,
        equals: isSameTimeRange,
        onRequest: (request) => onValueChange?.(request.value, request),
      });
      if (state.request(normalized, reason, source)) setOwnValue(normalized);
    },
    [held, onValueChange, value],
  );

  const requestPosition = useCallback(
    (next: TimeRangePickerPosition, reason: PositionReason, source: unknown) => {
      const state = createControllable<TimeRangePickerPosition>({
        controlled: position,
        initial: currentPosition,
        onRequest: (request) => onPositionChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnPosition(next);
    },
    [currentPosition, onPositionChange, position],
  );

  const requestHighlight = useCallback(
    (next: TimeRangePickerHighlight, reason: HighlightReason, source: unknown) => {
      const state = createControllable<TimeRangePickerHighlight>({
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
     opens on the first end that is missing; with a whole value, where it was. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setWork(held ?? EMPTY);
      setHovered(null);
      const missing: TimeRangePickerPosition | null =
        held?.start == null ? 'start' : held.end === null ? 'end' : null;
      if (missing !== null && missing !== currentPosition) {
        requestPosition(missing, 'programmatic', undefined);
      }
    }
    wasOpen.current = isOpen;
  }, [currentPosition, held, isOpen, requestPosition]);

  /* ── The lists ───────────────────────────────────────────────────────── */

  const listOptions = useMemo(
    () => ({
      isTimeUnavailable,
      max,
      maxOptions: resolvedMaxOptions,
      min,
      options,
      step: resolvedStep,
    }),
    [isTimeUnavailable, max, min, options, resolvedMaxOptions, resolvedStep],
  );
  const base = useMemo<TimeOption[]>(() => timeList(listOptions), [listOptions]);
  const truncated = useMemo(() => isTruncated(listOptions), [listOptions]);

  /**
   * The list of one end: the shared list, and what the other end of the work
   * refuses of it — the options on the wrong side of it, those whose duration
   * would fall outside the limits, and with `contiguous` those beyond the
   * first refused option after it. The search runs over the list, never over
   * the seconds.
   */
  const listFor = useCallback(
    (position: TimeRangePickerPosition): TimeOption[] => {
      const otherEnd = work[other(position)];
      let refused: (option: TimeOption, index: number) => boolean = () => false;
      if (otherEnd !== null) {
        const direction: 1 | -1 = position === 'end' ? 1 : -1;
        const anchorSeconds = secondsOfDay(otherEnd);
        const anchorIndex = nearestIndex(base, otherEnd);
        const wall = contiguous ? firstUnavailableIndex(base, anchorIndex, direction) : -1;
        refused = (option, index) =>
          runRefusal(anchorSeconds, secondsOfDay(option.time), direction, {
            maxLength,
            minLength,
          }) ||
          (wall >= 0 && (direction === 1 ? index >= wall : index <= wall));
      }
      const marked = base.map((option, index) =>
        option.unavailable || !refused(option, index) ? option : { ...option, unavailable: true },
      );
      return resolvedUnavailable === 'hide'
        ? marked.filter((option) => !option.unavailable)
        : marked;
    },
    [base, contiguous, maxLength, minLength, resolvedUnavailable, work],
  );
  const lists = useMemo(() => ({ start: listFor('start'), end: listFor('end') }), [listFor]);
  const labels = useMemo(
    () => ({
      start: lists.start.map((option) => format.format(option.time)),
      end: lists.end.map((option) => format.format(option.time)),
    }),
    [format, lists],
  );

  /** The duration a row would make with the other end as it stands, or `null`. */
  const durationOf = useCallback(
    (position: TimeRangePickerPosition, option: TimeOption): string | null => {
      const otherEnd = work[other(position)];
      if (otherEnd === null || option.unavailable) return null;
      const seconds =
        position === 'end'
          ? timeRangeSeconds(otherEnd, option.time)
          : timeRangeSeconds(option.time, otherEnd);
      return resolvedLengthLabel(seconds);
    },
    [resolvedLengthLabel, work],
  );

  /** Where a list opens: on its end, on the nearest step to now, or on the first available option. */
  const openingIndex = useCallback(
    (position: TimeRangePickerPosition) => {
      const otherEnd = work[other(position)];
      return openingIndexOf(
        lists[position],
        work[position] ?? otherEnd ?? anchor,
        otherEnd,
        position,
      );
    },
    [anchor, lists, work],
  );

  const highlightIndex = useCallback(
    (position: TimeRangePickerPosition) => {
      const time = highlight[position];
      return time === null
        ? -1
        : lists[position].findIndex((option) => isSameTime(option.time, time));
    },
    [highlight, lists],
  );

  const moveHighlight = useCallback(
    (position: TimeRangePickerPosition, index: number, source: unknown) => {
      const list = lists[position];
      const option = list[Math.max(0, Math.min(list.length - 1, index))];
      if (option === undefined) return;
      requestHighlight({ ...highlight, [position]: option.time }, 'keyboard', source);
    },
    [highlight, lists, requestHighlight],
  );

  /** The highlight of each list lands where the list opens, and follows the work. */
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
    /* Only when the surface opens or the lists under it change: a highlight
       the reader moved is theirs until one of those happens. */
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
    /* Created once; the effect below keeps it in step with the state. */
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

  /** Which presentation the surface is in, as a fact the DOM carries. */
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
    /* The anchor is the frame, so the surface hangs from the box the reader sees. */
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

  /**
   * One layer in the single stack, with the trigger as a branch so pressing it
   * again closes the surface instead of dismissing and reopening it.
   */
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
        /* A field with an expression open takes Escape first: the layer asks in
           the capture phase, so the field's own attribute is what says so. */
        if (
          request.reason === 'escape' &&
          layerNode.querySelector('[data-ui="time-field"][data-relative]') !== null
        ) {
          return;
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

  /** The field, or the list where the field is not drawn (a coarse pointer). */
  const focusField = useCallback(() => {
    const box = fieldBox.current;
    if (box !== null && getComputedStyle(box).display === 'none') {
      focusOption(Math.max(0, highlightIndex(currentPosition)));
      return;
    }
    fieldRef.current?.focus();
  }, [currentPosition, focusOption, highlightIndex]);

  /**
   * Into the list of one end: the tab moves there when it is not the current
   * one, and focus lands on its highlight after the render that drew it.
   */
  const enterList = useCallback(
    (position: TimeRangePickerPosition, source: unknown) => {
      const at = highlightIndex(position);
      const index = at >= 0 ? at : openingIndex(position);
      if (position !== currentPosition) requestPosition(position, 'select', source);
      if (index < 0) {
        requestAnimationFrame(() => fieldRef.current?.focus());
        return;
      }
      moveHighlight(position, index, source);
      /* The list is rendered by the time the layer is on screen; focus after
         the paint that mounted it. */
      requestAnimationFrame(() => focusOption(index));
    },
    [currentPosition, focusOption, highlightIndex, moveHighlight, openingIndex, requestPosition],
  );

  /**
   * Opened by Enter, Space or a press, focus lands on the first segment of the
   * current end's field: typing is the first thing in the panel. Opened by an
   * arrow, it lands in that end's list.
   */
  const focusOnOpen = useRef<'field' | 'list' | null>(null);
  useEffect(() => {
    if (!isOpen || layerNode === null || focusOnOpen.current === null) return;
    const where = focusOnOpen.current;
    focusOnOpen.current = null;
    if (where === 'list') {
      enterList(currentPosition, undefined);
      return;
    }
    requestAnimationFrame(focusField);
  }, [currentPosition, enterList, focusField, isOpen, layerNode]);

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
   * A press in a list, or on `now`: the end of that list is written to the
   * work. Whole, the work is the value and the panel closes when the press
   * completed it; incomplete, focus carries to the end that is missing.
   */
  const writeEnd = (position: TimeRangePickerPosition, time: PlainTime, source: unknown) => {
    const wasWhole = work.start !== null && work.end !== null;
    const next: TimeRange = { ...work, [position]: time };
    setWork(next);
    requestHighlight({ ...highlight, [position]: time }, 'pointer', source);
    if (next.start !== null && next.end !== null) {
      requestValue(next, 'select', source);
      requestPosition(position, 'select', source);
      closeAfter(!wasWhole, source);
      return;
    }
    enterList(other(position), source);
  };

  const select = (position: TimeRangePickerPosition, option: TimeOption, source: unknown) => {
    if (option.unavailable || !editable) return;
    writeEnd(position, option.time, source);
  };

  /**
   * The way out of a sheet that fills the screen, and of an edit left half
   * way: a whole work is the value; one end alone stays as it is.
   */
  const done = (event: MouseEvent<HTMLElement>) => {
    if (work.start !== null && work.end !== null && !isSameTimeRange(work, held)) {
      requestValue(work, 'select', event);
    }
    setOpen(false, 'pointer', event);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const choosePreset = (range: TimeRange, event: MouseEvent<HTMLElement>) => {
    setWork(range);
    requestValue(range, 'select', event);
    requestPosition('start', 'select', event);
    closeAfter(true, event);
  };

  /**
   * The field in the band writes the current end to the work at every request
   * it emits, with the field's own reason, and an open end is a value on its
   * own: it is written where the reader sees it.
   */
  const onFieldValue = (next: PlainTime | null, request: TimeFieldChangeRequest) => {
    const nextWork: TimeRange = { ...work, [currentPosition]: next };
    setWork(nextWork);
    requestValue(nextWork, request.reason as TimeRangePickerValueReason, request.source);
  };

  /* ── The tabs ────────────────────────────────────────────────────────── */

  const focusTab = (position: TimeRangePickerPosition) =>
    tabRefs.current[position]?.focus({ preventScroll: true });

  /** Automatic activation: the arrow moves the position with it. */
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;
    const next: TimeRangePickerPosition | null =
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
    /* ChromeOS turns the chord into PageDown before the browser sees it, which
       is why the trigger is the guaranteed way in and the chord a shortcut. */
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOnOpen.current = 'list';
      if (!isOpen) setOpen(true, 'keyboard', event);
      else enterList(currentPosition, event);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      focusOnOpen.current = 'field';
      setOpen(!isOpen, 'keyboard', event);
    }
  };

  const onListKeyDown =
    (position: TimeRangePickerPosition) => (event: KeyboardEvent<HTMLDivElement>) => {
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
   * The pending end: the option under the pointer, or the highlighted option
   * of the list that has focus. The duration is said for the run it would
   * make with the other end of the work; with no pending end, for the work.
   */
  const pending = hovered ?? (listFocused ? highlightFor(currentPosition, highlight) : null);
  const pendingRun: TimeRange | null =
    pending === null ? null : { ...work, [pending.position]: pending.time };
  const spokenFor = (range: TimeRange): string =>
    range.start !== null && range.end !== null
      ? resolvedLengthLabel(timeRangeSeconds(range.start, range.end))
      : '';
  const spokenLength = pendingRun === null ? spokenFor(work) : spokenFor(pendingRun);
  /** "30 min to 4 hr", "at least 30 min", "at most 4 hr". */
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
  const workProblems =
    work.start !== null && work.end !== null
      ? timeRangeProblems(work, {
          max,
          maxLength,
          min,
          minLength,
          unavailable: isTimeUnavailable,
        })
      : [];
  const hintProblem = workProblems[0];
  const hint =
    work[currentPosition] === null
      ? t('chooseTime', { end: labelOf(currentPosition) })
      : hintProblem === undefined
        ? ''
        : t(hintProblem === 'min' || hintProblem === 'max' ? 'bounds' : hintProblem);
  const hintId = `${contentId}-hint`;

  /** The trigger's accessible name: focus returns here when the surface closes. */
  const spoken =
    start !== null && end !== null
      ? ordered
        ? t('change', {
            start: format.describe(start),
            end: format.describe(end),
            length: resolvedLengthLabel(timeRangeSeconds(start, end)),
          })
        : t('changeReversed', { start: format.describe(start), end: format.describe(end) })
      : t('choose');
  const summary =
    held === null
      ? null
      : `${start === null ? '' : format.format(start)} – ${end === null ? '' : format.format(end)}`.trim();

  /* Crossed bounds, while the order holds: the start cannot step past the end
     nor the end before the start. Reversed, each field keeps the outer bounds
     and the end field alone says the order is wrong. */
  const workOrdered =
    work.start !== null && work.end !== null && compareTime(work.start, work.end) <= 0;
  const startMax = workOrdered
    ? max === undefined || compareTime(work.end as PlainTime, max) < 0
      ? (work.end as PlainTime)
      : max
    : max;
  const endMin = workOrdered
    ? min === undefined || compareTime(work.start as PlainTime, min) > 0
      ? (work.start as PlainTime)
      : min
    : min;

  const fieldProps = {
    disabled: resolvedDisabled,
    granularity: resolvedGranularity,
    isTimeUnavailable,
    locale: resolvedLocale,
    readOnly: resolvedReadOnly,
    required: resolvedRequired,
    size: 'sm' as const,
    timeZone: resolvedTimeZone,
    variant: 'plain' as const,
    ...(resolvedHourCycle === undefined ? {} : { hourCycle: resolvedHourCycle }),
    ...(referenceTime === undefined ? {} : { referenceTime }),
    ...(relative === undefined ? {} : { relative }),
  };

  const tabId = (position: TimeRangePickerPosition) => `${contentId}-tab-${position}`;

  const tab = (position: TimeRangePickerPosition) => {
    const time = work[position];
    const current = currentPosition === position;
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
        {...(time === null ? { 'data-placeholder': '' } : {})}
      >
        <span data-part="tab-label" data-part-tab-label="">
          {labelOf(position)}
        </span>
        <span data-part="tab-value" data-part-tab-value="">
          {time === null ? '—' : format.format(time)}
        </span>
      </button>
    );
  };

  const panel = () => {
    const position = currentPosition;
    const list = lists[position];
    const current = highlightIndex(position);
    const chosen = work[position];
    return (
      <div data-part="panel" data-part-panel="" data-position={position} id={`${contentId}-panel`}>
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
                  key={toISOTime(option.time)}
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
      data-ui="time-range-picker"
      data-ui-time-range-picker=""
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
            <TimeField
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
              value={work[currentPosition]}
            />
          </div>
          <button
            data-part="now"
            data-part-now=""
            disabled={!editable}
            onClick={(event) => writeEnd(currentPosition, anchor, event)}
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
            <Glyph name="clock" />
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
          value={start === null ? '' : toISOTime(start)}
        />
        <input
          data-part="hidden-input"
          data-part-hidden-input=""
          name={endName}
          type="hidden"
          value={end === null ? '' : toISOTime(end)}
        />
      </div>
      {container === null ? surface : null}
    </>
  );

  const rootProps: TimeRangePickerRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    ...(resolvedRequired === true ? { 'data-required': '' } : {}),
    ...(isOpen ? { 'data-open': '' } : {}),
    'data-granularity': resolvedGranularity,
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-ui': 'time-range-picker',
    'data-variant': resolvedVariant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as TimeRangePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}
      {container === null ? null : createPortal(surface, container)}
    </>
  );
}

function highlightFor(
  position: TimeRangePickerPosition,
  highlight: TimeRangePickerHighlight,
): { position: TimeRangePickerPosition; time: PlainTime } | null {
  const time = highlight[position];
  return time === null ? null : { position, time };
}

/**
 * One shortcut. It writes its range with the `select` reason and carries
 * `data-selected` while the value equals it. The list is the product's — "the
 * morning shift" is a business clock — and the family ships the button, not
 * the list.
 */
export function TimeRangePickerPreset({
  children,
  onClick,
  ref,
  render,
  value,
  ...nativeProps
}: TimeRangePickerPresetProps) {
  const context = useContext(PresetContext);
  const range = typeof value === 'function' ? value() : value;
  const selected = context !== null && isSameTimeRange(context.held, range);

  const rootProps: TimeRangePickerPresetRootProps = keyedProps({
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
      {...(rootProps as TimeRangePickerPresetRootProps & { ref?: React.Ref<HTMLButtonElement> })}
    />
  ) : (
    render(rootProps)
  );
}
