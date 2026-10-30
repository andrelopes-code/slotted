import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/splitter/splitter.css';
import {
  anchorsAtStart,
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  extentAtPoint,
  extentBounds,
  extentFromLength,
  holdResizeGesture,
  measureLength,
  nearestSnap,
  stepAmountFromPixels,
  stepExtent,
} from '@slotted/core/extent';
import { createControllable } from '@slotted/core/state';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useSplitterDefaults } from './splitter-defaults';
import type {
  SplitterHandle,
  SplitterLimit,
  SplitterProps,
  SplitterValueReason,
} from './splitter.types';

const NO_SNAP_POINTS: readonly number[] = [];

/**
 * The bar's own axis, in the vocabulary `@slotted/core/extent` speaks.
 *
 * The region the bar sizes is the one before it, so it is anchored at the
 * container's first edge on that axis — `start` across the inline axis, `top`
 * down the block one. `anchorsAtStart` then mirrors the inline case for a
 * right-to-left document, and the pointer and the keyboard both read it, which
 * is what keeps them from disagreeing about which way is bigger.
 */
function sideFor(orientation: 'vertical' | 'horizontal') {
  return orientation === 'vertical' ? ('start' as const) : ('top' as const);
}

/**
 * A limit as a fraction of the container.
 *
 * A number is already one. A string is a CSS length, and only the browser knows
 * what `18rem` or `25%` come to — so it is measured where it will be used
 * rather than parsed here.
 */
function resolveLimit(
  limit: SplitterLimit,
  container: HTMLElement | null,
  span: number,
  fallback: number,
): number {
  if (typeof limit === 'number') return Math.min(Math.max(limit, 0), 1);
  if (container === null || span <= 0) return fallback;
  return extentFromLength({ pixels: measureLength(limit, container, span), span });
}

/**
 * A focusable separator between two regions the consumer owns.
 *
 * It holds the position, the limits, the stops, the keyboard and the whole ARIA
 * contract of the WAI-ARIA Window Splitter pattern. It holds no layout: the
 * fraction is written as `--slotted-splitter-value` on the element `for` names,
 * and a rule in the consumer's own stylesheet is what turns it into a measure.
 * A separator that sized the boxes beside it would be deciding a layout it was
 * only handed a position in.
 */
export function Splitter({
  className,
  collapsed,
  collapsedValue,
  collapsible = false,
  defaultCollapsed = false,
  defaultValue = 0.5,
  disabled = false,
  for: forRef,
  max,
  min,
  onCollapsedChange,
  onDoubleClick,
  onKeyDown,
  onPointerDown,
  onResizeEnd,
  onValueChange,
  orientation,
  ref,
  render,
  snapPoints,
  style,
  value,
  ...rest
}: SplitterProps) {
  const defaults = useSplitterDefaults();
  const resolvedOrientation = orientation ?? defaults.orientation;
  const resolvedMin = min ?? defaults.min;
  const resolvedMax = max ?? defaults.max;
  const resolvedCollapsedValue = collapsedValue ?? defaults.collapsedValue;
  const stops = snapPoints ?? NO_SNAP_POINTS;

  const bar = useRef<HTMLDivElement>(null);
  const generatedId = useId();

  const [ownValue, setOwnValue] = useState(defaultValue);
  /**
   * The id of the region, once there is a region to have one.
   *
   * It is state and not a value read during render, which is a correction: the
   * id is written in the effect below, and a render that read the element
   * before the effect ran found no id and wrote no `aria-controls` — and
   * nothing re-rendered afterwards to fix it. The separator announced a value
   * and never said what it was a value of.
   *
   * Reading the element during render would not do either: it is a layout read
   * in the render phase, which is what makes a server render and its hydration
   * disagree.
   */
  const [regionId, setRegionId] = useState<string>();
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  const [dragging, setDragging] = useState(false);

  const currentValue = value ?? ownValue;
  const currentCollapsed = collapsed ?? ownCollapsed;

  /**
   * The fraction to come back to. Held here and not in the value, because
   * `react-resizable-panels` persists the geometry alone and a restored panel
   * comes back indistinguishable from a very small one.
   */
  const restore = useRef(defaultValue);
  const release = useRef<(() => void) | null>(null);
  /**
   * The value as it stands now, for the listeners a drag adds. They are made
   * when the pointer goes down and live until it comes up, so a value read from
   * their render is the value the drag started from: the drag's own requests
   * compared against it, and `onResizeEnd` reported it as where the drag ended.
   */
  const latest = useRef(currentValue);
  useLayoutEffect(() => {
    latest.current = currentValue;
  }, [currentValue]);
  /** Bumped when the container's measure changes, which no prop can say. */
  const [measured, setMeasured] = useState(0);

  /** The box the fraction is a fraction *of*: whatever holds the bar. */
  const container = useCallback(() => bar.current?.parentElement ?? null, []);

  /** The element the bar sizes, announces, and writes the fraction on. */
  const sized = useCallback((): HTMLElement | null => {
    if (forRef !== undefined) return forRef.current;
    const previous = bar.current?.previousElementSibling;
    return previous instanceof HTMLElement ? previous : null;
  }, [forRef]);

  const geometry = useCallback(() => {
    const box = container();
    const rect = box?.getBoundingClientRect();
    const span =
      rect === undefined ? 0 : resolvedOrientation === 'vertical' ? rect.width : rect.height;
    const rtl = box !== null && box !== undefined && getComputedStyle(box).direction === 'rtl';
    return { box: box ?? null, rect, rtl, span };
  }, [container, resolvedOrientation]);

  const limits = useCallback(() => {
    const { box, span } = geometry();
    const low = resolveLimit(resolvedMin, box, span, 0);
    const high = resolveLimit(resolvedMax, box, span, 1);
    /* A max below the min is the consumer's arithmetic, not a crash: the pair
       is ordered rather than trusted, so the range always exists. */
    return extentBounds(stops, Math.min(low, high), Math.max(low, high));
  }, [geometry, resolvedMax, resolvedMin, stops]);

  const requestValue = useCallback(
    (next: number, reason: SplitterValueReason, source: unknown) => {
      if (next === latest.current) return;

      const state = createControllable<number>({
        controlled: value,
        initial: latest.current,
        onRequest: (raw) => {
          onValueChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      /* The return value, and not a flag read inside `onRequest`: a flag
         assigned there is assigned before the consumer has been handed the
         request and had the chance to refuse it. */
      if (state.request(next, reason, source)) {
        latest.current = next;
        setOwnValue(next);
      }
    },
    [onValueChange, value],
  );

  const requestCollapsed = useCallback(
    (next: boolean, reason: SplitterValueReason, source: unknown) => {
      if (next === currentCollapsed) return;

      const state = createControllable<boolean>({
        controlled: collapsed,
        initial: currentCollapsed,
        onRequest: (raw) => {
          onCollapsedChange?.(raw.value, {
            get cancelled() {
              return raw.cancelled;
            },
            cancel: () => raw.cancel(),
            previous: raw.previous,
            reason,
            source: raw.source,
            value: raw.value,
          });
        },
      });

      const moved = state.request(next, reason, source);
      /* Controlled mode reports and waits for the consumer, so `moved` is false
         there without anything having been refused. A refusal is a request that
         did not move an *uncontrolled* value, and only that case stops the
         measure moving with the state. */
      if (!moved && collapsed === undefined) return false;
      if (moved) setOwnCollapsed(next);
      return true;
    },
    [collapsed, currentCollapsed, onCollapsedChange],
  );

  /**
   * `Enter`, from the pattern: "If the primary pane is not collapsed, collapses
   * the pane. If the pane is collapsed, restores the splitter to its previous
   * position."
   *
   * Both halves move, and they move together: a collapse that changed the state
   * and not the measure would leave the bar where it was, and a restore that
   * changed the measure and not the state would leave a panel that is open and
   * says it is not.
   */
  const toggleCollapsed = useCallback(
    (source: unknown, reason: SplitterValueReason) => {
      if (!collapsible) return;

      if (currentCollapsed) {
        if (requestCollapsed(false, reason, source) !== false) {
          requestValue(restore.current, reason, source);
        }
        return;
      }

      restore.current = currentValue;
      if (requestCollapsed(true, reason, source) !== false) {
        requestValue(resolvedCollapsedValue, reason, source);
      }
    },
    [
      collapsible,
      currentCollapsed,
      currentValue,
      requestCollapsed,
      requestValue,
      resolvedCollapsedValue,
    ],
  );

  /**
   * The fraction, published where CSS can read it. This is what replaces the
   * layout the family does not hold: a consumer writes
   * `inline-size: calc(var(--slotted-splitter-value) * 100%)` once and never
   * holds the number in state at all.
   *
   * It is written in an effect rather than during render because it is a write
   * to an element this component does not own, and because `for` is a ref,
   * which has nothing in it yet on the first render.
   */
  useEffect(() => {
    const target = sized();
    if (target === null) return;

    target.style.setProperty('--slotted-splitter-value', String(currentValue));
    if (target.id === '') target.id = `${generatedId}-region`;
    setRegionId(target.id);
  }, [currentValue, generatedId, sized]);

  useEffect(() => () => release.current?.(), []);

  /** A fraction brought inside the limits as they resolve now. */
  const clamp = useCallback(
    (fraction: number) => {
      const bounds = limits();
      return Math.min(Math.max(fraction, bounds.min), bounds.max);
    },
    [limits],
  );

  /**
   * The container's measure, watched: a length limit is a different fraction
   * of a container that was resized. Guarded, because `ResizeObserver` is
   * absent from a server render and from jsdom.
   */
  useEffect(() => {
    const box = container();
    if (typeof ResizeObserver === 'undefined' || box === null) return;
    const observer = new ResizeObserver(() => setMeasured((count) => count + 1));
    observer.observe(box);
    return () => observer.disconnect();
  }, [container]);

  /**
   * The contract's `extent.clamped`: the reported value is always the clamped
   * one. Limits move under a value — a length limit when the container is
   * resized, a fraction when the consumer passes another — and a value
   * restored from another window's layout can lie outside them, so the bar
   * brings it back inside, as a programmatic request. A collapsed region stands
   * below its floor on purpose and is left there.
   */
  useEffect(() => {
    if (currentCollapsed || dragging) return;
    const held = clamp(currentValue);
    if (held !== currentValue) requestValue(held, 'programmatic', undefined);
  }, [clamp, currentCollapsed, currentValue, dragging, measured, requestValue]);

  useImperativeHandle(
    ref,
    (): SplitterHandle => ({
      get bar() {
        return bar.current;
      },
      collapse: () => {
        if (!collapsible || currentCollapsed) return;
        restore.current = currentValue;
        if (requestCollapsed(true, 'programmatic', undefined) !== false) {
          requestValue(resolvedCollapsedValue, 'programmatic', undefined);
        }
      },
      expand: () => {
        if (!currentCollapsed) return;
        if (requestCollapsed(false, 'programmatic', undefined) !== false) {
          requestValue(restore.current, 'programmatic', undefined);
        }
      },
      focus: () => bar.current?.focus(),
      reset: () => requestValue(clamp(defaultValue), 'programmatic', undefined),
    }),
    [
      clamp,
      collapsible,
      currentCollapsed,
      currentValue,
      defaultValue,
      requestCollapsed,
      requestValue,
      resolvedCollapsedValue,
    ],
  );

  const { max: boundMax, min: boundMin } = limits();

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled || event.button !== 0) return;

    const { rect, rtl, span } = geometry();
    if (rect === undefined || span <= 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    release.current = holdResizeGesture(
      event.currentTarget.ownerDocument,
      resolvedOrientation === 'vertical' ? 'col-resize' : 'row-resize',
    );

    const side = sideFor(resolvedOrientation);
    const target = event.currentTarget;

    /*
     * Where on the bar the hand took it, as a fraction: the bar keeps that point
     * under the pointer for the whole drag. Read as an absolute position, a bar
     * taken a few pixels from the edge it marks leapt those pixels on the first
     * move — and a bar whose region is followed by a gap leapt the gap.
     */
    const grab =
      extentAtPoint({ point: { x: event.clientX, y: event.clientY }, rect, rtl, side }) -
      latest.current;

    const move = (moved: PointerEvent) => {
      const live = container()?.getBoundingClientRect();
      if (live === undefined) return;

      const raw = extentAtPoint({
        point: { x: moved.clientX, y: moved.clientY },
        rect: live,
        rtl,
        side,
      });
      requestValue(clamp(raw - grab), 'pointer', moved);
    };

    const up = (ended: PointerEvent) => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      release.current?.();
      release.current = null;
      setDragging(false);

      /* The stop nearest where the hand left it, and only then. A drag that
         snapped on every move would fight the hand rather than help it. */
      const live = container()?.getBoundingClientRect();
      if (live !== undefined && stops.length > 0) {
        const raw = extentAtPoint({
          point: { x: ended.clientX, y: ended.clientY },
          rect: live,
          rtl,
          side,
        });
        const snapped = clamp(nearestSnap(raw - grab, stops));
        requestValue(snapped, 'pointer', ended);
        onResizeEnd?.(snapped);
        return;
      }

      onResizeEnd?.(latest.current);
    };

    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;

    if (event.key === 'Enter') {
      if (!collapsible) return;
      event.preventDefault();
      toggleCollapsed(event, 'keyboard');
      return;
    }

    const { rect, rtl } = geometry();
    if (rect === undefined) return;

    const side = sideFor(resolvedOrientation);
    const grows = anchorsAtStart(side, rtl) ? 1 : -1;
    const vertical = resolvedOrientation === 'vertical';

    /* The cross axis is left to the page, so a document that scrolls still
       scrolls while the separator holds focus. */
    const direction =
      event.key === (vertical ? 'ArrowRight' : 'ArrowDown')
        ? (grows as 1 | -1)
        : event.key === (vertical ? 'ArrowLeft' : 'ArrowUp')
          ? (-grows as 1 | -1)
          : undefined;

    if (direction !== undefined) {
      event.preventDefault();
      const amount = stepAmountFromPixels({
        pixels: event.shiftKey ? EXTENT_LARGE_STEP_PX : EXTENT_STEP_PX,
        rect,
        side,
      });
      requestValue(
        stepExtent({
          amount,
          direction,
          fraction: currentValue,
          max: boundMax,
          min: boundMin,
          snapPoints: stops,
        }),
        'keyboard',
        event,
      );
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      requestValue(boundMin, 'keyboard', event);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      requestValue(boundMax, 'keyboard', event);
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(event);
    if (event.defaultPrevented || disabled) return;
    requestValue(clamp(defaultValue), 'pointer', event);
  };

  const props = keyedProps({
    ...rest,
    'aria-controls': rest['aria-controls'] ?? regionId,
    'aria-disabled': disabled ? true : undefined,
    'aria-orientation': resolvedOrientation === 'vertical' ? ('vertical' as const) : undefined,
    'aria-valuemax': Math.round(boundMax * 100),
    'aria-valuemin': Math.round(boundMin * 100),
    'aria-valuenow': Math.round(currentValue * 100),
    className,
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(dragging ? { 'data-dragging': '' } : {}),
    ...(collapsible && !currentCollapsed ? { 'data-expanded': '' } : {}),
    'data-orientation': resolvedOrientation,
    'data-part': 'root' as const,
    'data-ui': 'splitter' as const,
    onDoubleClick: handleDoubleClick,
    onKeyDown: handleKeyDown,
    onPointerDown: handlePointerDown,
    ref: bar,
    role: 'separator',
    style,
    tabIndex: rest.tabIndex ?? 0,
    children: (
      <>
        <span aria-hidden="true" data-part="line" data-part-line="" />
        <span aria-hidden="true" data-part="grip" data-part-grip="" />
        <span aria-hidden="true" data-part="line" data-part-line="" />
      </>
    ),
  });

  if (render !== undefined) return render(props);
  return <div {...props} />;
}
