import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { HTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import { usePopover, usePopoverReposition } from './popover';
import type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverBodyProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverContentRootProps,
  PopoverContextValue,
  PopoverDescriptionProps,
  PopoverFocusTarget,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverLayerProps,
  PopoverLayerRootProps,
  PopoverTitleProps,
  PopoverTriggerProps,
  PopoverTriggerRootProps,
} from './popover.types';

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault`.
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
 * An element, a ref to one, or a selector read inside the panel. The last is
 * what a consumer reaches for when the control they mean is rendered by
 * something they hold no ref to.
 */
function resolveFocus(
  target: PopoverFocusTarget | undefined,
  scope: HTMLElement | null,
): HTMLElement | null {
  if (target === undefined) return null;
  if (typeof target === 'string') return scope?.querySelector<HTMLElement>(target) ?? null;
  if (target instanceof Element) return target as HTMLElement;
  return (target.current as HTMLElement | null) ?? null;
}

/**
 * How far the layer moves along its alignment axis so the panel's edge, not
 * the layer's, meets the anchor's. The layer's padding is the gap around the
 * panel, the same on every side, so a layer aligned to the anchor's start edge
 * leaves the panel one gap inside it. A centred layer needs nothing, and
 * neither does one as wide as its anchor, which the positioner centres.
 */
function alignInset(
  layer: HTMLElement,
  side: PopoverContextValue['side'],
  align: PopoverContextValue['align'],
  width: PopoverContextValue['width'],
): number {
  if (align === 'center') return 0;
  if (width === 'anchor' && (side === 'top' || side === 'bottom')) return 0;
  const gap =
    Number.parseFloat(layer.ownerDocument.defaultView?.getComputedStyle(layer).paddingTop ?? '') ||
    0;
  return align === 'start' ? -gap : gap;
}

/**
 * The control that opens the panel.
 *
 * It renders a `button`, which is what gives `Enter` and `Space` for free, and
 * takes the consumer's own control through `render`. It carries the wiring —
 * `aria-expanded`, `aria-haspopup="dialog"`, `aria-controls` — and `data-open`,
 * and **no `data-part`**: a trigger is the consumer's element, very often
 * another family's root, and claiming it would unstyle that family.
 */
export function PopoverTrigger({ children, ref, render, ...nativeProps }: PopoverTriggerProps) {
  const popover = usePopover();

  const onClick = (event: MouseEvent<HTMLElement>) => {
    popover.toggle(!popover.open, event.detail === 0 ? 'keyboard' : 'pointer', event.nativeEvent);
  };

  const rootProps: PopoverTriggerRootProps = {
    ...nativeProps,
    children,
    /* An id the document does not hold references nothing: the panel is
       named only while it exists, which under `mount="active"` is while it
       is open. */
    ...(popover.contentNode !== null ? { 'aria-controls': popover.contentId } : {}),
    'aria-expanded': popover.open,
    'aria-haspopup': 'dialog',
    ...(popover.open ? { 'data-open': '' } : {}),
    onClick: compose(nativeProps.onClick, onClick),
  };

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      popover.setTriggerNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, popover.setTriggerNode],
  );

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <button type="button" {...rootProps} ref={setNode} />;
}

/**
 * What the panel points at, when that is not the button that opened it — a row
 * whose action menu hangs off the row rather than off its own control. It
 * carries no attributes at all: it is only measured.
 */
export function PopoverAnchor({ children, ref, render, ...nativeProps }: PopoverAnchorProps) {
  const popover = usePopover();

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      popover.setAnchorNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, popover.setAnchorNode],
  );

  const rootProps: HTMLAttributes<HTMLElement> = { ...nativeProps, children };
  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <div {...rootProps} ref={setNode} />;
}

/**
 * The positioned layer, and everything the overlay infrastructure does for this
 * family: the portal that keeps the theme, the presence that holds the panel
 * through its exit, the positioner, and the dismissable layer that answers
 * Escape and the outside press.
 *
 * The two focus guards are inside it. Focus reaching one arrived by `Tab` at
 * the edge of a layer that lives at the end of the document, so the family
 * closes and puts focus back on the trigger, from which the reader's next `Tab`
 * continues down the page. It is the only answer that keeps the reading order
 * intact without trapping focus in a layer that is not modal.
 */
export function PopoverLayer({ children, ref, render, ...nativeProps }: PopoverLayerProps) {
  const popover = usePopover();
  const reposition = usePopoverReposition();

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the panel: the trigger took focus or a press.
   * The portal's layer is made then, because making it reads the trigger's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for. A press focuses before it clicks, in a task of
   * its own.
   */
  const [warm, setWarm] = useState(false);

  const presence = useRef<PresenceHandle | null>(null);
  const latest = useRef(popover);
  latest.current = popover;

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
    presence.current?.sync(popover.open);
  }, [popover.open]);

  useEffect(() => {
    presence.current?.setNode(node);
  }, [node]);

  /**
   * Open renders the panel in the commit that opens it, rather than once the
   * presence has reported `entering` in a render of its own.
   */
  const mounted =
    popover.mount === 'eager' ||
    (popover.mount === 'lazy' && popover.seen) ||
    popover.open ||
    status !== 'unmounted';

  useEffect(() => {
    const trigger = popover.triggerNode;
    if (trigger === null || warm) return undefined;
    const prepare = () => setWarm(true);
    trigger.addEventListener('focusin', prepare);
    trigger.addEventListener('pointerdown', prepare);
    return () => {
      trigger.removeEventListener('focusin', prepare);
      trigger.removeEventListener('pointerdown', prepare);
    };
  }, [popover.triggerNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({
      origin: popover.anchorNode ?? popover.triggerNode,
      disabled: !popover.portal,
    });
    setContainer(handle.container);
    return () => handle.release();
  }, [layered, popover.anchorNode, popover.portal, popover.triggerNode]);

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
    width,
  } = popover;
  const anchor = popover.anchorNode ?? popover.triggerNode;

  const positioner = useRef<PositionerHandle | null>(null);
  const focusFrame = useRef(0);
  const wasOpen = useRef(false);

  /**
   * `data-open` is written by the measurement that places the panel, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together, and the first frame after the
   * click shows the panel where it belongs. A render to say "positioned" was
   * a frame of its own.
   *
   * Focus goes to the panel itself rather than to its first control, so a
   * reader hears the panel's name before its contents. It moves in the next
   * frame: after the measurement, because focusing a layer still at the
   * origin scrolls the page to it, and not in the open's own task, because
   * `focus()` after the writes is a style recalculation the first frame waits
   * for.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latest.current.open) return;
      layer.setAttribute('data-open', '');
      if (wasOpen.current) return;
      wasOpen.current = true;
      const view = layer.ownerDocument.defaultView;
      if (view === null || !latest.current.autoFocus || focusFrame.current !== 0) return;
      focusFrame.current = view.requestAnimationFrame(() => {
        focusFrame.current = 0;
        const { contentNode, initialFocus, open } = latest.current;
        if (!open) return;
        const target = resolveFocus(initialFocus, contentNode) ?? contentNode;
        target?.focus();
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (node === null || anchor === null) return;

    const handle = createPositioner(anchor, node, {
      align,
      alignOffset: alignOffset + alignInset(node, side, align, width),
      boundaryPadding: collisionPadding,
      flip,
      hideWhenDetached,
      matchWidth: width === 'anchor',
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
    anchor,
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
    width,
    place,
  ]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || node === null) return;
    if (popover.open) {
      place(handle, node);
      return;
    }
    node.removeAttribute('data-open');
    if (focusFrame.current !== 0) {
      node.ownerDocument.defaultView?.cancelAnimationFrame(focusFrame.current);
      focusFrame.current = 0;
    }
  }, [node, place, popover.open]);

  /**
   * The layer joins the single stack only while it is open. It is not modal:
   * nothing outside becomes `inert` and the page keeps scrolling. The trigger
   * and the anchor are branches, so pressing either is inside the layer.
   */
  useEffect(() => {
    if (node === null || !popover.open) return;
    const branches = [popover.triggerNode, popover.anchorNode].filter(
      (element): element is HTMLElement => element !== null,
    );
    const layer = createDismissableLayer(node, {
      escape: popover.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: popover.closeOnOutsidePress,
      scrollLock: false,
      ...(branches.length > 0 ? { branches } : {}),
      onDismiss: (request) => {
        latest.current.toggle(
          false,
          request.reason === 'escape' ? 'escape' : 'outsidePress',
          request.source,
        );
      },
    });
    return () => layer.destroy();
  }, [
    node,
    popover.anchorNode,
    popover.closeOnEscape,
    popover.closeOnOutsidePress,
    popover.open,
    popover.triggerNode,
  ]);

  /** Focus returns on close; the open moves it in `place`, above. */
  useEffect(() => {
    const { contentNode, finalFocus, open, triggerNode } = latest.current;

    if (!open && wasOpen.current) {
      wasOpen.current = false;
      /**
       * Only if the focus is still inside the layer. A reader who closed the
       * popover by pressing something else on the page keeps the focus they
       * moved to; taking it back would undo their own move.
       */
      const active = node?.ownerDocument.activeElement ?? null;
      if (node !== null && active !== null && !node.contains(active)) return;
      const target = resolveFocus(finalFocus, contentNode) ?? triggerNode;
      target?.focus();
    }
  }, [node, popover.open]);

  const onGuardFocus = () => {
    const { toggle, triggerNode } = latest.current;
    toggle(false, 'keyboard');
    triggerNode?.focus();
  };

  const setLayerNode = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  /* A portalled layer waits for its portal root: drawn in place first, it would
     land for one commit wherever the Popover was written, such as a tbody. */
  if (!mounted || (popover.portal && container === null)) return null;

  const guard = (
    <span
      aria-hidden="true"
      data-part="focus-guard"
      data-part-focus-guard=""
      onFocus={onGuardFocus}
      tabIndex={0}
    />
  );

  const rootProps: PopoverLayerRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {guard}
        {children}
        {guard}
      </>
    ),
    'data-align': align,
    'data-part': 'root',
    'data-size': popover.size,
    'data-ui': 'popover',
    'data-width': popover.width,
  });

  const element =
    render === undefined ? (
      <div {...rootProps} ref={setLayerNode} />
    ) : (
      render({ ...rootProps, ref: setLayerNode })
    );

  return container === null ? element : createPortal(element, container);
}

/**
 * The panel. `role="dialog"`, named by its title and described by its
 * description when those parts are present, and `aria-modal` is never written —
 * saying it would tell a reader the rest of the page is gone while it is not.
 *
 * A popover with no title gets no `aria-labelledby`. The family invents no
 * name; write `aria-label` here instead.
 */
export function PopoverContent({ children, ref, render, ...nativeProps }: PopoverContentProps) {
  const popover = usePopover();

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      popover.setContentNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, popover.setContentNode],
  );

  const rootProps: PopoverContentRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(popover.hasTitle ? { 'aria-labelledby': popover.titleId } : {}),
    ...(popover.hasDescription ? { 'aria-describedby': popover.descriptionId } : {}),
    'data-part': 'content',
    id: popover.contentId,
    /* The consumer's explicit role wins: a hover card that nothing can enter
       is `presentation`, not a dialog nobody is told about. */
    role: nativeProps.role ?? 'dialog',
    tabIndex: -1,
  });

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <div {...rootProps} ref={setNode} />;
}

/** The title, the description and the close control, on the row that stays put. */
export function PopoverHeader({ children, ref, render, ...nativeProps }: PopoverHeaderProps) {
  const rootProps: HTMLAttributes<HTMLElement> = {
    ...nativeProps,
    children,
    ...{ 'data-part': 'header', ...selectorKeyProps('part', 'header') },
  };
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The panel's accessible name. A `div` rather than a heading, for the reason
 * `result-state` records: a heading belongs in the document outline, and only
 * the page knows whether this one does. `render` produces the heading when it
 * does.
 */
export function PopoverTitle({ children, ref, render, ...nativeProps }: PopoverTitleProps) {
  const popover = usePopover();
  const { setHasTitle } = popover;

  useEffect(() => {
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);

  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'title',
    id: popover.titleId,
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** One line under the title, referenced by the panel rather than announced. */
export function PopoverDescription({
  children,
  ref,
  render,
  ...nativeProps
}: PopoverDescriptionProps) {
  const popover = usePopover();
  const { setHasDescription } = popover;

  useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'description',
    id: popover.descriptionId,
  });
  if (render !== undefined) return render(rootProps);
  return <p {...rootProps} ref={ref} />;
}

/**
 * The only part that scrolls, bounded by the height the engine says is left.
 * Radix, Base UI and React Aria each publish that height as a custom property
 * and none of them uses it; bounding the whole panel would scroll the title out
 * of sight, which is how a reader loses track of what they are in.
 */
export function PopoverBody({ children, ref, render, ...nativeProps }: PopoverBodyProps) {
  const rootProps: HTMLAttributes<HTMLElement> = {
    ...nativeProps,
    children,
    ...{ 'data-part': 'body', ...selectorKeyProps('part', 'body') },
  };
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/** The actions row, which keeps its height while the body scrolls under it. */
export function PopoverFooter({ children, ref, render, ...nativeProps }: PopoverFooterProps) {
  const rootProps: HTMLAttributes<HTMLElement> = {
    ...nativeProps,
    children,
    ...{ 'data-part': 'footer', ...selectorKeyProps('part', 'footer') },
  };
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * The pointer's way out. The keyboard has Escape, and a reader on a touch
 * device has no Escape key at all. A close control with no text of its own —
 * the drawn cross, or the consumer's icon — is named by the catalog's `close`;
 * one that shows words, such as "Done", is named by them, and an `aria-label`
 * the consumer wrote wins over both.
 */
export function PopoverClose({ children, ref, render, ...nativeProps }: PopoverCloseProps) {
  const popover = usePopover();
  const node = useRef<HTMLElement | null>(null);
  /* What the rendered button shows, once it exists; until then, what the
     children write. A component that renders its own words is seen only in
     the document. */
  const [shown, setShown] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    if (node.current !== null) setShown((node.current.textContent ?? '').trim() !== '');
  });
  const hasText = shown ?? writesText(children);

  const onClick = (event: MouseEvent<HTMLElement>) => {
    popover.toggle(false, 'dismiss', event.nativeEvent);
  };

  const setNode = useCallback(
    (element: HTMLElement | null) => {
      node.current = element;
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-label': nativeProps['aria-label'] ?? (hasText ? undefined : popover.t('close')),
    children: children ?? (
      <Icon size="sm">
        <Glyph name="x" />
      </Icon>
    ),
    'data-part': 'close',
    onClick: compose(nativeProps.onClick, onClick),
  });

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <button type="button" {...rootProps} ref={setNode} />;
}

/** Whether a tree of children writes text a reader sees, at any depth. */
function writesText(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    typeof child === 'string' || typeof child === 'number'
      ? String(child).trim() !== ''
      : isValidElement<{ children?: ReactNode }>(child) && writesText(child.props.children),
  );
}

/**
 * The mark that points at the anchor. The family draws it; the positioner
 * measures it and says where it goes. It is hidden from assistive technology.
 */
export function PopoverArrow({ ref, render, ...nativeProps }: PopoverArrowProps) {
  const popover = usePopover();

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      popover.setArrowNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, popover.setArrowNode],
  );

  if (!popover.showArrow) return null;

  const rootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': true as const,
    'data-part': 'arrow',
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={setNode} />;
}
