import { keyedProps } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent, Ref } from 'react';
import { createPortal } from 'react-dom';

import { useTooltip, useTooltipReposition } from './tooltip';
import type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipContentRootProps,
  TooltipLayerProps,
  TooltipLayerRootProps,
  TooltipTriggerProps,
  TooltipTriggerRootProps,
} from './tooltip.types';

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault`. Composing rather than replacing is what lets
 * a page put its own `onPointerEnter` on a trigger and keep both.
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

/** Two refs on one element: the family's, and whatever the consumer passed. */
function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The element the hint is about.
 *
 * It renders a `button` and is meant to be given the consumer's own control
 * through `render`, which is what nearly every tooltip in a product does. The
 * family writes the ARIA relationship and `data-open` on it and **no
 * `data-part`**: `data-part` names a part of the family that owns the element,
 * and sixteen stylesheets in this repository key on `[data-part='root']`, so
 * claiming a `badge` or a `checkbox` used as a trigger would unstyle it and
 * nothing would report it.
 *
 * A control the page has disabled with the native attribute fires no pointer
 * events at all, so the one explanation of why it is disabled would be the one
 * nobody can reach. The reference page shows the two shapes that work:
 * `aria-disabled` on a control that stays focusable, or a wrapping element
 * carrying the trigger.
 */
export function TooltipTrigger({ children, ref, render, ...nativeProps }: TooltipTriggerProps) {
  const tooltip = useTooltip();
  const holding = useRef(false);

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (tooltip.openOn !== 'hover' || event.pointerType === 'touch') return;
    tooltip.openAfterDelay(event.nativeEvent);
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    holding.current = false;
    if (tooltip.openOn === 'manual') return;
    tooltip.closeAfterDelay(event.nativeEvent);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') {
      holding.current = true;
      tooltip.pressAndHold(event.nativeEvent);
      return;
    }
    if (tooltip.closeOnPress && tooltip.open) tooltip.toggle(false, 'pointer', event.nativeEvent);
  };

  const releasePress = (event: PointerEvent<HTMLElement>) => {
    if (!holding.current) return;
    holding.current = false;
    tooltip.cancelPending();
    void event;
  };

  /**
   * `:focus-visible` rather than every focus. A pointer press focuses a button
   * too, and a tooltip that opened on it would arrive before the delay it was
   * given and stay after the press that was meant to dismiss it.
   */
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (tooltip.openOn === 'manual') return;
    if (!event.target.matches(':focus-visible')) return;
    tooltip.toggle(true, 'keyboard', event.nativeEvent);
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (tooltip.openOn === 'manual') return;
    tooltip.toggle(false, 'blur', event.nativeEvent);
  };

  /**
   * A click synthesised by the keyboard reports no detail; a real one reports
   * the click count. It is how `Enter` and `Space` are told from a press
   * without a key listener existing for either.
   */
  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (!tooltip.closeOnPress || !tooltip.open) return;
    tooltip.toggle(false, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
  };

  const described = tooltip.describes === 'description';
  /* Under `none` the trigger references nothing: it already says the words. */
  const names = tooltip.describes !== 'none' && (tooltip.open || tooltip.describes === 'label');

  const rootProps: TooltipTriggerRootProps = {
    ...nativeProps,
    children,
    ...(names && described ? { 'aria-describedby': tooltip.contentId } : {}),
    'aria-labelledby': names && !described ? tooltip.contentId : nativeProps['aria-labelledby'],
    ...(tooltip.open ? { 'data-open': '' } : {}),
    onBlur: compose(nativeProps.onBlur, onBlur),
    onClick: compose(nativeProps.onClick, onClick),
    onFocus: compose(nativeProps.onFocus, onFocus),
    onPointerCancel: compose(nativeProps.onPointerCancel, releasePress),
    onPointerDown: compose(nativeProps.onPointerDown, onPointerDown),
    onPointerEnter: compose(nativeProps.onPointerEnter, onPointerEnter),
    onPointerLeave: compose(nativeProps.onPointerLeave, onPointerLeave),
    onPointerUp: compose(nativeProps.onPointerUp, releasePress),
  };

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      tooltip.setTriggerNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    // The setter is stable; the consumer's ref is not, and both are read here.
    [ref, tooltip.setTriggerNode],
  );

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <button type="button" {...rootProps} ref={setNode} />;
}

/**
 * The positioned layer.
 *
 * It is the element `packages/core/src/positioner` writes `position`, `left`
 * and `top` onto, and the one that scales and fades — the module leaves
 * `transform` alone on purpose, and the family animates `scale` so a consumer's
 * own `translate` is free too. Its padding is the gap between the trigger and
 * the painted surface, which is what lets the pointer cross onto a hoverable
 * tooltip without leaving it.
 */
export function TooltipLayer({ children, ref, render, ...nativeProps }: TooltipLayerProps) {
  const tooltip = useTooltip();
  const reposition = useTooltipReposition();

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to see the tip: the pointer reached the trigger or
   * focus did. The portal's layer is made then, because making it reads the
   * trigger's computed style, and a read in the open's own task is a style
   * recalculation the first frame waits for.
   */
  const [warm, setWarm] = useState(false);

  const presence = useRef<PresenceHandle | null>(null);
  const latest = useRef(tooltip);
  latest.current = tooltip;

  /**
   * Created inside the effect rather than during render, so a development
   * double-mount destroys and rebuilds the handle instead of leaving the
   * component holding one that has already been torn down.
   *
   * `present` is passed even when it is `false`, because that is what puts the
   * handle in controlled mode — the family owns `open`, and `sync` is ignored
   * on a handle that owns its own presence.
   */
  useEffect(() => {
    const handle = createPresence({
      present: latest.current.open,
      onStatusChange: setStatus,
    });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  useEffect(() => {
    presence.current?.sync(tooltip.open);
  }, [tooltip.open]);

  useEffect(() => {
    presence.current?.setNode(node);
  }, [node]);

  /**
   * `active` drops the layer after the exit, `lazy` keeps it once it has been
   * open, `eager` never removes it — which is what `describes="label"` forces,
   * because an accessible name has to exist before it is read.
   */
  const mounted =
    tooltip.mount === 'eager' ||
    (tooltip.mount === 'lazy' && tooltip.seen) ||
    tooltip.open ||
    status !== 'unmounted';

  useEffect(() => {
    const trigger = tooltip.triggerNode;
    if (trigger === null || warm) return undefined;
    const prepare = () => setWarm(true);
    trigger.addEventListener('focusin', prepare);
    trigger.addEventListener('pointerover', prepare);
    return () => {
      trigger.removeEventListener('focusin', prepare);
      trigger.removeEventListener('pointerover', prepare);
    };
  }, [tooltip.triggerNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({
      origin: tooltip.triggerNode,
      disabled: !tooltip.portal,
    });
    setContainer(handle.container);
    return () => handle.release();
  }, [layered, tooltip.portal, tooltip.triggerNode]);

  const {
    align,
    alignOffset,
    arrowNode,
    arrowPadding,
    collisionPadding,
    flip,
    hideWhenDetached,
    shift,
    side,
    sideOffset,
    strategy,
  } = tooltip;

  const positioner = useRef<PositionerHandle | null>(null);

  /**
   * `data-open` is written by the measurement that places the tip, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together. A render to say "positioned" was a
   * frame of its own. The open delay is the trigger's, and is not this.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latest.current.open) return;
      layer.setAttribute('data-open', '');
    });
  }, []);

  useLayoutEffect(() => {
    if (node === null || tooltip.triggerNode === null) return;

    const handle = createPositioner(tooltip.triggerNode, node, {
      align,
      alignOffset,
      boundaryPadding: collisionPadding,
      flip,
      hideWhenDetached,
      shift,
      side,
      sideOffset,
      strategy,
      ...(arrowNode ? { arrow: arrowNode, arrowPadding } : {}),
    });

    reposition.current = () => void handle.update();
    positioner.current = handle;
    if (latest.current.open) place(handle, node);

    return () => {
      reposition.current = undefined;
      handle.destroy();
      positioner.current = null;
      node.removeAttribute('data-open');
    };
  }, [
    align,
    alignOffset,
    arrowNode,
    arrowPadding,
    collisionPadding,
    flip,
    hideWhenDetached,
    node,
    reposition,
    shift,
    side,
    sideOffset,
    strategy,
    tooltip.triggerNode,
    place,
  ]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || node === null) return;
    if (tooltip.open) place(handle, node);
    else node.removeAttribute('data-open');
  }, [node, place, tooltip.open]);

  /**
   * The layer joins the single stack only while it is open, so its depth is its
   * real position among the layers a reader has actually opened. Escape reaches
   * the topmost layer alone, which is why a tooltip opened over a popover takes
   * it first; the trigger is a branch, so pressing it is not an outside press
   * and the family closes on it deliberately instead.
   */
  useEffect(() => {
    if (node === null || !tooltip.open) return;
    const layer = createDismissableLayer(node, {
      escape: true,
      focusOutside: false,
      modal: false,
      outsidePress: true,
      scrollLock: false,
      ...(tooltip.triggerNode ? { branches: [tooltip.triggerNode] } : {}),
      onDismiss: (request) => {
        latest.current.toggle(
          false,
          request.reason === 'escape' ? 'escape' : 'pointer',
          request.source,
        );
      },
    });
    return () => layer.destroy();
  }, [node, tooltip.open, tooltip.triggerNode]);

  const onPointerEnter = () => {
    if (tooltip.hoverable) tooltip.cancelPending();
  };
  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (tooltip.hoverable) tooltip.closeAfterDelay(event.nativeEvent);
  };

  const setLayerNode = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  if (!mounted) return null;

  const rootProps: TooltipLayerRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-align': align,
    ...(tooltip.hoverable ? { 'data-hoverable': '' } : {}),
    'data-part': 'root',
    'data-size': tooltip.size,
    'data-ui': 'tooltip',
    'data-variant': tooltip.variant,
    onPointerEnter: compose(nativeProps.onPointerEnter, onPointerEnter),
    onPointerLeave: compose(nativeProps.onPointerLeave, onPointerLeave),
  });

  const element =
    render === undefined ? (
      <div {...rootProps} ref={setLayerNode} />
    ) : (
      render({ ...rootProps, ref: setLayerNode })
    );

  return container === null ? element : createPortal(element, container);
}

/** The painted surface, and the element the trigger's ARIA relationship names. */
export function TooltipContent({ children, ref, render, ...nativeProps }: TooltipContentProps) {
  const tooltip = useTooltip();

  const rootProps: TooltipContentRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(tooltip.describes === 'none' ? { 'aria-hidden': true } : {}),
    'data-part': 'content',
    id: tooltip.contentId,
    role: 'tooltip',
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The mark that points at the anchor. The family draws it; the positioner
 * measures it and says where it goes. It is hidden from assistive technology,
 * because it is decoration a reader has no use for.
 */
export function TooltipArrow({ ref, render, ...nativeProps }: TooltipArrowProps) {
  const tooltip = useTooltip();

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      tooltip.setArrowNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, tooltip.setArrowNode],
  );

  if (!tooltip.showArrow) return null;

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true as const,
    'data-part': 'arrow',
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={setNode} />;
}
