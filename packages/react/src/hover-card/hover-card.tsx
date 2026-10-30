import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/hover-card/hover-card.css';

import { tabbables } from '@slotted/core/focus';
import { createPointerIntent } from '@slotted/core/pointer-intent';
import type { PointerIntentHandle } from '@slotted/core/pointer-intent';
import { createControllable } from '@slotted/core/state';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, Ref } from 'react';

import { Popover, PopoverArrow, PopoverContent, PopoverLayer, usePopover } from '../popover';
import { useHoverCardDefaults } from './hover-card-defaults';
import type {
  HoverCardContentProps,
  HoverCardContextValue,
  HoverCardOpenReason,
  HoverCardProps,
  HoverCardTriggerProps,
  HoverCardTriggerRootProps,
} from './hover-card.types';

const HoverCardContext = createContext<HoverCardContextValue | undefined>(undefined);

export function useHoverCard(): HoverCardContextValue {
  const context = useContext(HoverCardContext);
  if (context === undefined) {
    throw new Error('HoverCardTrigger and HoverCardContent have to be inside a HoverCard.');
  }
  return context;
}

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault` — the rule every family in this library
 * composes by.
 */
function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The halo the open mark draws past the link's box, plus the same again of
 * air: the popover puts its arrow's tip a pixel off the anchor, which is right
 * for a button and touched the halo on a word.
 */
const SIDE_OFFSET = 4;

/**
 * A preview of a link or a person, opened by hover and by focus.
 *
 * The card is `popover` behind a trigger the popover does not have: this
 * component owns the state — the reasons include `blur`, which the popover
 * never emits — and renders the `Popover` controlled, with focus never taken on
 * open. `PopoverBody`, `PopoverTitle` and the rest are imported from `popover`
 * as they are; Radix restates them under a second name here, and two copies of
 * one machine drift.
 */
export function HoverCard({
  children,
  closeDelay,
  defaultOpen,
  disabled,
  navigable,
  onOpenChange,
  open,
  openDelay,
  ref,
  sideOffset,
  ...popoverProps
}: HoverCardProps) {
  const defaults = useHoverCardDefaults();
  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);

  const resolvedDisabled = disabled ?? defaults.disabled;
  const current = (open ?? own) && !resolvedDisabled;

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intent = useRef<PointerIntentHandle | null>(null);
  const suppressFocusOpen = useRef(false);

  const latest = useRef({ current, onOpenChange, open });
  latest.current = { current, onOpenChange, open };

  const cancelPending = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
    intent.current?.destroy();
    intent.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const toggle = useCallback(
    (next: boolean, reason: HoverCardOpenReason, source?: unknown) => {
      cancelPending();
      const state = latest.current;
      if (next === state.current) return;

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

      /* A close the keyboard caused leaves focus on the trigger, or the
         popover puts it back there. Either way the trigger must not answer
         that focus with the card it just closed. */
      if (!next && (reason === 'escape' || reason === 'keyboard')) suppressFocusOpen.current = true;
      if (moved) setOwn(next);
    },
    [cancelPending],
  );

  const resolvedOpenDelay = openDelay ?? defaults.openDelay;
  const resolvedCloseDelay = closeDelay ?? defaults.closeDelay;

  const openAfterDelay = useCallback(
    (source?: unknown) => {
      cancelPending();
      timer.current = setTimeout(() => toggle(true, 'pointer', source), resolvedOpenDelay);
    },
    [cancelPending, resolvedOpenDelay, toggle],
  );

  const closeAfterDelay = useCallback(
    (source?: unknown) => {
      cancelPending();
      timer.current = setTimeout(() => toggle(false, 'pointer', source), resolvedCloseDelay);
    },
    [cancelPending, resolvedCloseDelay, toggle],
  );

  const graceToward = useCallback(
    (
      target: () => DOMRect | null,
      origin: () => DOMRect | null,
      stillOver: () => boolean,
      source?: unknown,
    ) => {
      cancelPending();
      intent.current = createPointerIntent({
        origin,
        target,
        timeout: resolvedCloseDelay,
        onSettled: () => {
          intent.current = null;
          if (stillOver()) return;
          toggle(false, 'pointer', source);
        },
      });
    },
    [cancelPending, resolvedCloseDelay, toggle],
  );

  const context: HoverCardContextValue = {
    cancelPending,
    closeAfterDelay,
    closeDelay: resolvedCloseDelay,
    disabled: resolvedDisabled,
    graceToward,
    navigable: navigable ?? defaults.navigable,
    open: current,
    openAfterDelay,
    openDelay: resolvedOpenDelay,
    suppressFocusOpen,
    toggle,
  };

  return (
    <HoverCardContext.Provider value={context}>
      <Popover
        {...popoverProps}
        autoFocus={false}
        disabled={resolvedDisabled}
        onOpenChange={(next, request) =>
          toggle(next, request.reason as HoverCardOpenReason, request.source)
        }
        open={current}
        ref={ref}
        sideOffset={sideOffset ?? SIDE_OFFSET}
      >
        {children}
      </Popover>
    </HoverCardContext.Provider>
  );
}

/**
 * The link the card is about. It renders an `<a>`, as Radix and Base UI do,
 * and takes the consumer's own element through `render`. It is the family's
 * one part: the element painted while the card shows, and the anchor the card
 * is measured against — many triggers may share one card, and the one that
 * starts an opening registers itself.
 *
 * The wiring — `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` — is
 * written only when the card is navigable. A card the keyboard cannot enter is
 * not a popup the link has, and saying so would be a lie a screen reader
 * repeats.
 */
export function HoverCardTrigger({ children, ref, render, ...nativeProps }: HoverCardTriggerProps) {
  const popover = usePopover();
  const card = useHoverCard();

  const [node, setNode] = useState<HTMLElement | null>(null);
  const tapped = useRef(false);

  /* The first trigger to mount is the anchor until another takes it. */
  useEffect(() => {
    if (node === null || popover.triggerNode !== null) return;
    popover.setTriggerNode(node);
  }, [node, popover.setTriggerNode, popover.triggerNode]);

  const anchors = node !== null && popover.triggerNode === node;
  const layer = () => popover.contentNode?.parentElement ?? null;

  const claim = () => {
    if (node !== null && popover.triggerNode !== node) popover.setTriggerNode(node);
  };

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (card.disabled || event.pointerType === 'touch') return;
    claim();
    if (card.open && anchors) {
      card.cancelPending();
      return;
    }
    card.openAfterDelay(event.nativeEvent);
  };

  /**
   * Leaving the trigger with the card open starts the grace: the card stays
   * while the pointer's own path still points into it, and closes after
   * `closeDelay` once the pointer has parked somewhere else. Leaving with an
   * open still pending cancels the open.
   */
  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    if (!card.open || !anchors) {
      card.cancelPending();
      return;
    }
    card.graceToward(
      () => layer()?.getBoundingClientRect() ?? null,
      () => node?.getBoundingClientRect() ?? null,
      () => (node?.matches(':hover') ?? false) || (layer()?.matches(':hover') ?? false),
      event.nativeEvent,
    );
  };

  /**
   * `:focus-visible` rather than every focus. A press that focuses a link is a
   * navigation, not a request for its preview — and focus the family itself
   * put back after Escape or a focus guard must not reopen the card.
   */
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (card.disabled) return;
    if (card.suppressFocusOpen.current) return;
    if (!event.target.matches(':focus-visible')) return;
    claim();
    card.toggle(true, 'keyboard', event.nativeEvent);
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    card.suppressFocusOpen.current = false;
    if (!card.open || !anchors) return;
    const next = event.relatedTarget;
    if (next instanceof Node && layer()?.contains(next)) return;
    card.toggle(false, 'blur', event.nativeEvent);
  };

  /**
   * `Tab` on the open trigger enters a navigable card, which lives at the end
   * of the document and would otherwise never be reached. The popover's focus
   * guards bring focus back out past either end.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!card.navigable || !card.open || !anchors) return;
    if (event.key !== 'Tab' || event.shiftKey) return;
    const panel = popover.contentNode;
    if (panel === null) return;
    const [first] = tabbables(panel);
    if (first === undefined) return;
    event.preventDefault();
    first.focus();
  };

  /**
   * There is no hover on a coarse pointer. A tap on a closed trigger opens the
   * card and does not follow the link; a tap on an open one follows it.
   */
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    tapped.current = event.pointerType === 'touch';
  };

  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (!tapped.current) return;
    tapped.current = false;
    if (card.disabled || (card.open && anchors)) return;
    event.preventDefault();
    claim();
    card.toggle(true, 'pointer', event.nativeEvent);
  };

  const setRoot = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  const open = card.open && anchors;

  const rootProps: HoverCardTriggerRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-ui': 'hover-card',
    'data-part': 'root',
    ...(open ? { 'data-open': '' } : {}),
    ...(card.navigable
      ? {
          'aria-controls': open ? popover.contentId : undefined,
          'aria-expanded': open,
          'aria-haspopup': 'dialog',
        }
      : {}),
    onBlur: compose(nativeProps.onBlur, onBlur),
    onClick: compose(nativeProps.onClick, onClick),
    onFocus: compose(nativeProps.onFocus, onFocus),
    onKeyDown: compose(nativeProps.onKeyDown, onKeyDown),
    onPointerDown: compose(nativeProps.onPointerDown, onPointerDown),
    onPointerEnter: compose(nativeProps.onPointerEnter, onPointerEnter),
    onPointerLeave: compose(nativeProps.onPointerLeave, onPointerLeave),
  });

  if (render !== undefined) return render({ ...rootProps, ref: setRoot });
  return <a {...rootProps} ref={setRoot} />;
}

/**
 * The card: the popover's layer and panel in one, with the family's pointer
 * handlers on the layer and the panel's role decided by `navigable`. The arrow
 * is rendered here under the popover's own `arrow` axis. Everything inside —
 * `PopoverBody`, `PopoverTitle`, `PopoverFooter`, `PopoverClose` — is the
 * popover's, and a consumer's props reach the panel.
 */
export function HoverCardContent({ children, ...contentProps }: HoverCardContentProps) {
  const card = useHoverCard();

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    card.cancelPending();
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    card.closeAfterDelay(event.nativeEvent);
  };

  return (
    <PopoverLayer onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <PopoverContent role={card.navigable ? 'dialog' : 'presentation'} {...contentProps}>
        {children}
      </PopoverContent>
      <PopoverArrow />
    </PopoverLayer>
  );
}
