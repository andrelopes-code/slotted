import '@slotted/styles/tooltip/tooltip.css';

import { isClipped } from '@slotted/core/overflow';
import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useTooltipDefaults, useTooltipGroup } from './tooltip-defaults';
import type { TooltipContextValue, TooltipOpenReason, TooltipProps } from './tooltip.types';

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined);

/**
 * Where the layer publishes its own `update`, so `reposition()` on the handle
 * reaches it. A context of its own rather than a field on the value, because it
 * is written by a descendant and read by an ancestor.
 */
const TooltipRepositionContext = createContext<{ current: (() => void) | undefined }>({
  current: undefined,
});

/** Read by the layer, which is the only part that holds a positioner. */
export function useTooltipReposition() {
  return useContext(TooltipRepositionContext);
}

/**
 * What the tooltip around this part says. A trigger or a layer outside one has
 * no state to report and nothing to be anchored to, so this throws rather than
 * rendering markup that looks right and never opens.
 */
export function useTooltip(): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error(
      'TooltipTrigger, TooltipLayer, TooltipContent and TooltipArrow have to be inside a Tooltip.',
    );
  }
  return context;
}

/**
 * A short, non-interactive sentence about the element under the pointer or
 * under focus.
 *
 * This component owns the state and **renders nothing**. The trigger stays
 * where the consumer wrote it and the layer is portalled to the end of the
 * document, so no single element could hold both — which is why the family's
 * namesake is not the component that renders `data-part="root"` here.
 *
 * What it does not hold is as deliberate as what it does. The layer never takes
 * focus and never holds a control: the APG's tooltip pattern says so, and names
 * the non-modal dialog for the other case, which is `Popover`.
 */
export function Tooltip({
  align,
  alignOffset,
  arrow,
  arrowPadding,
  children,
  closeDelay,
  closeOnPress,
  collisionPadding,
  defaultOpen,
  describes,
  disabled,
  flip,
  hideWhenDetached,
  hoverable,
  mount,
  onOpenChange,
  open,
  openDelay,
  openOn,
  portal,
  ref,
  shift,
  side,
  sideOffset,
  size,
  strategy,
  touchDelay,
  variant,
  whenClipped,
}: TooltipProps) {
  const defaults = useTooltipDefaults();
  const group = useTooltipGroup();
  const contentId = `${useId()}tooltip`;

  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const [arrowNode, setArrowNode] = useState<HTMLElement | null>(null);
  const reposition = useRef<(() => void) | undefined>(undefined);

  const resolvedDisabled = disabled === true;
  const current = (open ?? own) && !resolvedDisabled;

  const resolvedDescribes = describes ?? defaults.describes;
  /**
   * Under `label` the layer is the trigger's accessible name, so it has to be
   * in the document before it is ever opened. Forcing the axis is deliberate
   * and stated: the alternative is a button silently announced as "button".
   */
  const resolvedMount = resolvedDescribes === 'label' ? 'eager' : (mount ?? defaults.mount);
  const resolvedOpenDelay = openDelay ?? defaults.openDelay;
  const resolvedCloseDelay = closeDelay ?? defaults.closeDelay;
  const resolvedTouchDelay = touchDelay ?? defaults.touchDelay;
  const resolvedGroupDelay = defaults.groupDelay;

  const seen = useRef(current);
  if (current) seen.current = true;

  /**
   * One timer for the whole family. An open waiting on `openDelay`, a close
   * waiting on `closeDelay` and a long press waiting on `touchDelay` are never
   * pending at once — each cancels the others — so a second timer could only
   * make it possible for them to disagree.
   */
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /**
   * The values the callbacks need, read at the moment they run rather than at
   * the moment they were made. A timer that fired against the render it was
   * created in would answer with a state two interactions old.
   */
  const resolvedWhenClipped = whenClipped ?? defaults.whenClipped;
  const latest = useRef({
    current,
    disabled: resolvedDisabled,
    group,
    onOpenChange,
    open,
    triggerNode,
    whenClipped: resolvedWhenClipped,
  });
  latest.current = {
    current,
    disabled: resolvedDisabled,
    group,
    onOpenChange,
    open,
    triggerNode,
    whenClipped: resolvedWhenClipped,
  };

  const cancelPending = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const toggle = useCallback(
    (next: boolean, reason: TooltipOpenReason, source?: unknown) => {
      cancelPending();
      const state = latest.current;
      if (next === state.current) return;
      /**
       * Refused rather than recorded: an open granted while disabled is hidden
       * by `current`, and the leave that follows finds nothing to close, so it
       * would surface the moment `disabled` turned false.
       */
      if (next && state.disabled) return;
      /**
       * Measured here rather than watched: the answer is needed at the moment
       * the hint would open, and a box measured then is never a box two column
       * drags old.
       */
      if (next && state.whenClipped && state.triggerNode !== null) {
        if (!isClipped(state.triggerNode)) return;
      }

      let cancelled = false;
      const controllable = createControllable<boolean>({
        controlled: state.open,
        initial: state.current,
        onRequest: (request) => {
          cancelled = request.cancelled;
          state.onOpenChange?.(request.value, request);
        },
      });
      const moved = controllable.request(next, reason, source);
      if (cancelled) return;

      /**
       * The window the next tooltip opens instantly inside starts when this one
       * closes, whether the family moved its own state or a controlled consumer
       * is about to. A reader crossing a toolbar pays one warmup.
       */
      if (!next) state.group.lastClosedAt = Date.now();
      if (moved) setOwn(next);
    },
    [cancelPending],
  );

  const openAfterDelay = useCallback(
    (source: unknown) => {
      cancelPending();
      const sinceLast = Date.now() - latest.current.group.lastClosedAt;
      if (resolvedOpenDelay <= 0 || sinceLast < resolvedGroupDelay) {
        toggle(true, 'pointer', source);
        return;
      }
      timer.current = setTimeout(() => toggle(true, 'pointer', source), resolvedOpenDelay);
    },
    [cancelPending, resolvedGroupDelay, resolvedOpenDelay, toggle],
  );

  const closeAfterDelay = useCallback(
    (source: unknown) => {
      cancelPending();
      if (resolvedCloseDelay <= 0) {
        toggle(false, 'pointer', source);
        return;
      }
      timer.current = setTimeout(() => toggle(false, 'pointer', source), resolvedCloseDelay);
    },
    [cancelPending, resolvedCloseDelay, toggle],
  );

  /**
   * A coarse pointer has no hover at all, so a press held still opens the hint
   * and a tap does not — a tap is the control's own action.
   */
  const pressAndHold = useCallback(
    (source: unknown) => {
      cancelPending();
      timer.current = setTimeout(() => toggle(true, 'pointer', source), resolvedTouchDelay);
    },
    [cancelPending, resolvedTouchDelay, toggle],
  );

  useEffect(() => cancelPending, [cancelPending]);

  /** Disabling cancels a waiting open and forgets an own open, so enabling opens nothing. */
  useEffect(() => {
    if (!resolvedDisabled) return;
    cancelPending();
    setOwn(false);
  }, [cancelPending, resolvedDisabled]);

  useImperativeHandle(
    ref,
    () => ({
      close: () => toggle(false, 'programmatic'),
      open: () => toggle(true, 'programmatic'),
      reposition: () => reposition.current?.(),
    }),
    [toggle],
  );

  const context: TooltipContextValue = {
    align: align ?? defaults.align,
    alignOffset: alignOffset ?? defaults.alignOffset,
    arrowNode,
    arrowPadding: arrowPadding ?? defaults.arrowPadding,
    cancelPending,
    closeAfterDelay,
    closeOnPress: closeOnPress ?? defaults.closeOnPress,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    contentId,
    describes: resolvedDescribes,
    disabled: resolvedDisabled,
    flip: flip ?? defaults.flip,
    hideWhenDetached: hideWhenDetached ?? defaults.hideWhenDetached,
    hoverable: hoverable ?? defaults.hoverable,
    mount: resolvedMount,
    open: current,
    openAfterDelay,
    openOn: openOn ?? defaults.openOn,
    portal: portal ?? defaults.portal,
    pressAndHold,
    seen: seen.current,
    setArrowNode,
    setTriggerNode,
    shift: shift ?? defaults.shift,
    showArrow: arrow ?? defaults.arrow,
    side: side ?? defaults.side,
    sideOffset: sideOffset ?? defaults.sideOffset,
    size: size ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    toggle,
    triggerNode,
    variant: variant ?? defaults.variant,
  };

  return (
    <TooltipContext.Provider value={context}>
      <TooltipRepositionContext.Provider value={reposition}>
        {children}
      </TooltipRepositionContext.Provider>
    </TooltipContext.Provider>
  );
}
