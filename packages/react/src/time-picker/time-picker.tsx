import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/time-picker/time-picker.css';

import {
  createTimeFormat,
  hourJump,
  isSameTime,
  isTimeInRange,
  isTruncated,
  nearestIndex,
  nowIn,
  timeList,
  toISOTime,
} from '@slotted/core/date';
import type { PlainTime, TimeOption } from '@slotted/core/date';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { timePickerMessages } from '@slotted/core/i18n';
import { attachGripDismiss } from '@slotted/core/extent';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createControllable } from '@slotted/core/state';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useField } from '../field';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { TimeField } from '../time-field';
import type { TimeFieldHandle } from '../time-field';
import { useTimePickerDefaults } from './time-picker-defaults';
import type { TimePickerProps, TimePickerRootProps } from './time-picker.types';

/**
 * Below this width, on a finger, the surface is a sheet rather than a popover.
 * §2.7 of `docs/component-features.md` asks for it by name. The number is here
 * as well as in the stylesheet because the DOM has to say which presentation it
 * is in, and a media query cannot write an attribute.
 */
const SHEET_QUERY = '(max-width: 480px) and (pointer: coarse)';

/** What an empty panel steps from before the browser has said what time it is. */
const SSR_REFERENCE: PlainTime = { hour: 12, minute: 0, second: 0 };

/**
 * A time field, a trigger, and a list of times behind them.
 *
 * **It composes `time-field` and redraws none of it.** The field keeps its own
 * `data-ui`; this family owns the box the positioner measures, the trigger
 * inside the field's end slot, and the layer the list stands on.
 *
 * **One panel shape, at every step.** A listbox of whole times: a reader
 * choosing a slot is choosing one thing, and `09:15` is legible at a glance
 * where a `15` in a column of minutes is legible only beside the column next
 * to it. A column per unit was drawn and withdrawn — the field types every
 * second, and `options` states any set of times a step cannot describe.
 *
 * **The panel never takes the field away.** `Alt`+`ArrowDown` opens it and
 * leaves focus in the field, so the segments keep every key they had and the
 * highlight follows what is typed. `docs/component-features.md` §6 asks for
 * exactly that.
 */
export function TimePicker({
  className,
  clearable = false,
  closeOnSelect,
  defaultHighlightedValue,
  defaultOpen = false,
  defaultValue,
  disabled,
  footer,
  granularity,
  highlightedValue,
  hourCycle,
  invalid,
  isTimeUnavailable,
  locale,
  max,
  maxOptions,
  messages,
  min,
  name,
  onHighlightedValueChange,
  onKeyDown,
  onOpenChange,
  onValueChange,
  open,
  options,
  placement,
  presets,
  readOnly,
  ref,
  referenceTime,
  relative,
  render,
  renderOption,
  required,
  size,
  step,
  style,
  timeZone,
  unavailableOptions,
  value,
  variant,
  ...nativeProps
}: TimePickerProps) {
  const field = useField();
  const defaults = useTimePickerDefaults();
  const appLocale = useLocale();
  const t = useMessages(timePickerMessages, messages);
  const rootRef = useRef<HTMLElement | null>(null);
  const fieldHandle = useRef<TimeFieldHandle | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
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
  const [ownValue, setOwnValue] = useState<PlainTime | null>(defaultValue ?? null);
  const held = value ?? ownValue;

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

  /**
   * Validity the family owns, beside the validity the consumer states. A time
   * outside the bounds or refused by the predicate is invalid whatever the
   * field around it says, because this control is the only thing that knows.
   */
  const outOfRange =
    held !== null && (!isTimeInRange(held, min, max) || isTimeUnavailable?.(held) === true);
  const resolvedInvalid = invalid ?? (outOfRange ? true : field?.invalid);

  /* ── The list ────────────────────────────────────────────────────────── */

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

  const list = useMemo<TimeOption[]>(() => {
    const built = timeList(listOptions);
    return resolvedUnavailable === 'hide' ? built.filter((option) => !option.unavailable) : built;
  }, [listOptions, resolvedUnavailable]);

  const truncated = useMemo(() => isTruncated(listOptions), [listOptions]);
  const labels = useMemo(() => list.map((option) => format.format(option.time)), [format, list]);

  /**
   * Where the panel opens: on the chosen time, on the nearest step to now when
   * nothing is chosen, and on the first available option when that is refused.
   */
  const openingIndex = useCallback(() => {
    if (list.length === 0) return -1;
    const wanted = held ?? anchor;
    const near = nearestIndex(list, wanted);
    if (near >= 0 && list[near]?.unavailable !== true) return near;
    const first = list.findIndex((option) => !option.unavailable);
    return first >= 0 ? first : 0;
  }, [anchor, held, list]);

  const [ownHighlight, setOwnHighlight] = useState<PlainTime | null>(
    defaultHighlightedValue ?? null,
  );
  const highlight = highlightedValue ?? ownHighlight;
  const highlightIndex = useMemo(
    () =>
      highlight === null ? -1 : list.findIndex((option) => isSameTime(option.time, highlight)),
    [highlight, list],
  );

  const requestHighlight = useCallback(
    (next: PlainTime | null, reason: 'pointer' | 'keyboard' | 'programmatic', source: unknown) => {
      const state = createControllable<PlainTime | null>({
        controlled: highlightedValue,
        initial: highlight,
        equals: isSameTime,
        onRequest: (request) => onHighlightedValueChange?.(request.value, request),
      });
      if (state.request(next, reason, source)) setOwnHighlight(next);
    },
    [highlight, highlightedValue, onHighlightedValueChange],
  );

  const moveHighlight = useCallback(
    (index: number, source: unknown) => {
      const option = list[Math.max(0, Math.min(list.length - 1, index))];
      if (option === undefined) return;
      requestHighlight(option.time, 'keyboard', source);
    },
    [list, requestHighlight],
  );

  /* ── State the two families share ────────────────────────────────────── */

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
    (next: PlainTime | null, request: { reason: string; source?: unknown }) => {
      const state = createControllable<PlainTime | null>({
        controlled: value,
        initial: held,
        equals: isSameTime,
        onRequest: (asked) => onValueChange?.(asked.value, asked as never),
      });
      if (state.request(next, request.reason as never, request.source)) setOwnValue(next);
    },
    [held, onValueChange, value],
  );

  /** The presence of the layer, so an exit animation is allowed to finish. */
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
   * again closes the surface instead of dismissing and reopening it in one
   * gesture.
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
        setOpen(false, request.reason === 'escape' ? 'escape' : 'outsidePress', request.source);
        /* Focus goes back to the trigger on a key and stays where the reader
           put it on a press outside. */
        if (request.reason === 'escape') triggerRef.current?.focus({ preventScroll: true });
      },
    });
    return () => layer.destroy();
  }, [isOpen, layerNode, setOpen]);

  /** The highlight lands where the panel opens, and follows what is typed. */
  useEffect(() => {
    if (!isOpen) return;
    const index = openingIndex();
    if (index < 0) return;
    requestHighlight(list[index]?.time ?? null, 'programmatic', undefined);
    /* Only when the surface opens or the list under it changes: a highlight the
       reader moved is theirs until one of those happens. */
  }, [isOpen, list]);

  /**
   * A highlight moved by a key lands whole rather than half under the edge.
   *
   * `scrollIntoView` is called optionally because jsdom does not implement it,
   * and a test environment without a scroller is not a reason for the family to
   * throw where a browser would scroll.
   */
  useEffect(() => {
    if (!isOpen || highlightIndex < 0) return;
    const row =
      listRef.current?.querySelectorAll<HTMLElement>('[data-part="option"]')[highlightIndex];
    row?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightIndex, isOpen]);

  const typeahead = useRef(createTypeahead({ locale: () => resolvedLocale }));
  useEffect(() => {
    const handle = typeahead.current;
    return () => handle.destroy();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => fieldHandle.current?.focus(),
      open: () => setOpen(true, 'keyboard', undefined),
      close: () => setOpen(false, 'keyboard', undefined),
    }),
    [setOpen],
  );

  /**
   * The trigger's accessible name. Focus returns here when the surface closes,
   * so this is where the reader is told what was chosen.
   */
  const spoken = held === null ? t('choose') : t('change', { time: format.describe(held) });

  const closesOnSelect = resolvedCloseOnSelect !== 'never';

  const select = useCallback(
    (option: TimeOption, source: unknown) => {
      if (option.unavailable || !editable) return;
      requestValue(option.time, { reason: 'select', source });
      requestHighlight(option.time, 'pointer', source);
      if (closesOnSelect) {
        setOpen(false, 'select', source);
        triggerRef.current?.focus({ preventScroll: true });
      }
    },
    [closesOnSelect, editable, requestHighlight, requestValue, setOpen],
  );

  const focusOption = useCallback((index: number) => {
    listRef.current?.querySelectorAll<HTMLElement>('[data-part="option"]')[index]?.focus();
  }, []);

  const enterList = useCallback(
    (source: unknown) => {
      const index = highlightIndex >= 0 ? highlightIndex : openingIndex();
      if (index < 0) return;
      moveHighlight(index, source);
      /* The list is rendered by the time the layer is on screen; focus after
         the paint that mounted it. */
      requestAnimationFrame(() => focusOption(index));
    },
    [focusOption, highlightIndex, moveHighlight, openingIndex],
  );

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented || !editable) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) setOpen(true, 'keyboard', event);
      enterList(event);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented) return;

    const at = highlightIndex >= 0 ? highlightIndex : 0;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveHighlight(at + 1, event);
        focusOption(Math.min(list.length - 1, at + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(at - 1, event);
        focusOption(Math.max(0, at - 1));
        return;
      case 'Home':
        event.preventDefault();
        moveHighlight(0, event);
        focusOption(0);
        return;
      case 'End':
        event.preventDefault();
        moveHighlight(list.length - 1, event);
        focusOption(list.length - 1);
        return;
      case 'PageDown': {
        event.preventDefault();
        const next = hourJump(list, at, 1);
        moveHighlight(next, event);
        focusOption(next);
        return;
      }
      case 'PageUp': {
        event.preventDefault();
        const previous = hourJump(list, at, -1);
        moveHighlight(previous, event);
        focusOption(previous);
        return;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = list[at];
        if (option !== undefined) select(option, event);
        return;
      }
      default:
        break;
    }

    /* Type-ahead, which the pattern recommends above seven options and this
       list passes at every step it offers. */
    if (isPrintable(event.key, typeahead.current.query.length > 0)) {
      const found = typeahead.current.match(event.key, labels, at);
      if (found < 0) return;
      event.preventDefault();
      moveHighlight(found, event);
      focusOption(found);
    }
  };

  /**
   * The chord the sibling picker took, with the same recorded cost: ChromeOS
   * turns it into `PageDown` before the browser sees it, so the trigger is
   * always drawn and this is only a shortcut. Focus stays in the field.
   */
  const onControlKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event as never);
    if (event.defaultPrevented || !editable) return;
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true, 'keyboard', event);
    }
  };

  const surface: ReactNode = mounted ? (
    <div
      data-part="positioner"
      data-part-positioner=""
      data-presentation={sheet ? 'sheet' : 'popover'}
      data-ui="time-picker"
      data-ui-time-picker=""
      ref={setLayerNode}
      {...(isOpen ? { 'data-open': '' } : {})}
    >
      <div
        aria-label={spoken}
        data-part="content"
        data-part-content=""
        id={contentId}
        role="listbox"
        {...(truncated ? { 'aria-description': t('truncated') } : {})}
      >
        {sheet ? <span aria-hidden="true" data-part="grip" data-part-grip="" /> : null}
        {presets === undefined ? null : (
          <div data-part="presets" data-part-presets="">
            {presets}
          </div>
        )}
        <div data-part="head" data-part-head="">
          <button
            data-part="now"
            data-part-now=""
            onClick={(event) => requestValue(anchor, { reason: 'select', source: event })}
            type="button"
          >
            {t('now')}
          </button>
        </div>
        {list.length === 0 ? (
          <div data-part="empty" data-part-empty="">
            {t('empty')}
          </div>
        ) : (
          <div
            data-part="list"
            data-part-list=""
            onKeyDown={onListKeyDown}
            ref={listRef}
            {...(truncated ? { 'data-truncated': '' } : {})}
          >
            {list.map((option, index) => {
              const label = labels[index] ?? '';
              const selected = isSameTime(option.time, held);
              const current = index === highlightIndex;
              return (
                <div
                  aria-disabled={option.unavailable ? true : undefined}
                  aria-selected={selected}
                  data-part="option"
                  data-part-option=""
                  key={toISOTime(option.time)}
                  onClick={(event) => select(option, event)}
                  role="option"
                  tabIndex={current ? 0 : -1}
                  {...(option.unavailable ? { 'data-disabled': '' } : {})}
                  {...(selected ? { 'data-selected': '' } : {})}
                  {...(current ? { 'data-current': '' } : {})}
                >
                  {renderOption === undefined
                    ? label
                    : renderOption({
                        current,
                        label,
                        selected,
                        time: option.time,
                        unavailable: option.unavailable,
                      })}
                </div>
              );
            })}
          </div>
        )}
        {footer === undefined ? null : (
          <div data-part="footer" data-part-footer="">
            {footer}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const children: ReactNode = (
    <>
      <div data-part="control" data-part-control="" onKeyDown={onControlKeyDown}>
        <TimeField
          clearable={clearable}
          disabled={resolvedDisabled}
          end={
            <button
              aria-controls={isOpen ? contentId : undefined}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-label={spoken}
              data-part="trigger"
              data-part-trigger=""
              disabled={!editable}
              onClick={(event) => {
                setOpen(!isOpen, 'pointer', event);
                if (!isOpen) enterList(event);
              }}
              onKeyDown={onTriggerKeyDown}
              ref={triggerRef}
              type="button"
            >
              <Icon>
                <Glyph name="clock" />
              </Icon>
            </button>
          }
          granularity={resolvedGranularity}
          invalid={resolvedInvalid}
          isTimeUnavailable={isTimeUnavailable}
          locale={resolvedLocale}
          max={max}
          min={min}
          name={name}
          onValueChange={(next, request) => requestValue(next, request)}
          readOnly={resolvedReadOnly}
          ref={fieldHandle}
          required={resolvedRequired}
          size={resolvedSize}
          timeZone={resolvedTimeZone}
          value={held}
          variant={resolvedVariant}
          {...(resolvedHourCycle === undefined ? {} : { hourCycle: resolvedHourCycle })}
          {...(referenceTime === undefined ? {} : { referenceTime })}
          {...(relative === undefined ? {} : { relative })}
        />
      </div>
      {container === null ? surface : null}
    </>
  );

  const rootProps: TimePickerRootProps = keyedProps({
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
    'data-ui': 'time-picker',
    'data-variant': resolvedVariant,
    ref: rootRef,
  });

  return (
    <>
      {render === undefined ? (
        <div {...(rootProps as TimePickerRootProps & { ref?: React.Ref<HTMLDivElement> })} />
      ) : (
        render(rootProps)
      )}
      {/* The layer is moved out of the flow, so nothing between the control and
          the page's root can clip it. */}
      {container === null ? null : createPortal(surface, container)}
    </>
  );
}
