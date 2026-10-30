import { revealWithin } from '@slotted/core/collection';
import { keyedProps, selectorKeyProps, withSelectorKey } from '@slotted/core/selector-key';
import { createDismissableLayer } from '@slotted/core/dismissable-layer';
import { createArrowNavigation, tabbables } from '@slotted/core/focus';
import { createPointerIntent } from '@slotted/core/pointer-intent';
import { createPortalRoot } from '@slotted/core/portal';
import { createPositioner, submenuOffsets } from '@slotted/core/positioner';
import type { PositionerHandle } from '@slotted/core/positioner';
import { createPresence } from '@slotted/core/presence';
import type { PresenceHandle, PresenceStatus } from '@slotted/core/presence';
import { createTypeahead, isPrintable } from '@slotted/core/typeahead';
import type { TypeaheadHandle } from '@slotted/core/typeahead';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, Ref } from 'react';
import { createPortal } from 'react-dom';

import { Glyph, Icon } from '../icon';
import { MenuItemIcon, MenuItemLabel, MenuItemMeta } from './menu-items';
import { MenuSurfaceProvider, useMenu } from './menu';
import type {
  MenuContentProps,
  MenuContentRootProps,
  MenuOpenReason,
  MenuSurfaceValue,
  MenuTriggerProps,
  MenuTriggerRootProps,
} from './menu.types';

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault`. Composing rather than replacing is what lets
 * a page put its own `onClick` on a trigger and keep both.
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

/** Every item of a surface, in the order the document holds them. */
export const ITEM_SELECTOR = "[data-part='item']";

const items = (surface: HTMLElement | null) =>
  surface === null ? [] : [...surface.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];

/** What typeahead matches on: the label, or what the item says instead. */
const textOf = (item: HTMLElement) =>
  item.dataset['textValue'] ??
  item.querySelector("[data-part='label']")?.textContent?.trim() ??
  item.textContent?.trim() ??
  '';

const enabled = (item: HTMLElement) => item.dataset['disabled'] === undefined;

type Entry = 'first' | 'last';

/**
 * Focus without the browser's own scroll, which reveals an item by scrolling
 * the page as well as the surface and centres it in the window, carrying the
 * layer off its trigger. The surface scrolls inside the room the positioner
 * gives it, so the item is brought into the surface and nothing further.
 */
function reveal(item: HTMLElement) {
  item.focus({ preventScroll: true });
  const surface = item.closest<HTMLElement>("[data-part='content']");
  if (surface !== null) revealWithin(item, surface);
}

function focusItem(surface: HTMLElement | null, index: number) {
  const list = items(surface);
  const item = list[index < 0 ? list.length + index : index];
  if (item !== undefined) reveal(item);
}

/** The first item a reader can act on, or the first one if none can. */
function focusEntry(surface: HTMLElement | null, entry: Entry) {
  const list = items(surface);
  const ordered = entry === 'first' ? list : [...list].reverse();
  const item = ordered.find(enabled) ?? ordered[0];
  if (item !== undefined) reveal(item);
}

/** Which way the surface is read, asked of the element rather than assumed. */
const readingDirection = (node: HTMLElement | null) =>
  node !== null && getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';

/**
 * Where `Tab` goes once every menu has closed: on down the page from the
 * control that opened the outermost surface.
 *
 * The pattern says Tab moves focus out of the menu and says no more, and a
 * layer portalled to the end of the document has no next element a reader would
 * recognise. `popover` answers the same question with two focus guards; a menu
 * binds `Tab` itself, so it can put focus where the reader was going instead.
 */
function moveOut(trigger: HTMLElement | null, step: 1 | -1) {
  if (trigger === null) return;
  const order = tabbables(trigger.ownerDocument.body);
  const index = order.indexOf(trigger);
  if (index === -1) return void trigger.focus({ preventScroll: true });
  const next = order[index + step];
  (next ?? trigger).focus({ preventScroll: true });
}

/**
 * The control that opens the surface.
 *
 * It renders three different elements and holds one behaviour. On its own it is
 * the consumer's control, given through `render`; on a bar it is the bar's own
 * `menuitem`; inside another menu's surface it is an item of that surface, with
 * `aria-haspopup` and a chevron at the end that points along the reading
 * direction.
 */
export function MenuTrigger({
  children,
  icon,
  meta,
  ref,
  render,
  ...nativeProps
}: MenuTriggerProps) {
  const menu = useMenu();
  const parent = menu.parent;
  const onBar = menu.onBar;
  const bar = menu.menubar;

  const [node, setNode] = useState<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intent = useRef<{ destroy: () => void } | null>(null);

  const latest = useRef({ menu, node });
  latest.current = { menu, node };

  const cancelPending = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
    intent.current?.destroy();
    intent.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  useEffect(() => {
    menu.setTriggerNode(node);
  }, [menu, node]);

  /* A bar keeps its own list of triggers, so it can move between them and
     remember which one it left. */
  useEffect(() => {
    if (!onBar || bar === null) return;
    /* Registered under the name the bar holds — the menu's `value` — and not
       under the surface's id, because the bar's state is that name. */
    bar.register(menu.identity, node);
    return () => bar.register(menu.identity, null);
  }, [bar, menu.identity, node, onBar]);

  const openWith = (reason: MenuOpenReason, entry: 'first' | 'last', source?: unknown) => {
    menu.entry.current = entry;
    menu.toggle(true, reason, source);
  };

  const onClick = (event: { nativeEvent: Event }) => {
    if (menu.disabled) return;
    if (menu.open && parent !== null) return;
    menu.entry.current = 'first';
    menu.toggle(!menu.open, 'pointer', event.nativeEvent);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (menu.disabled) return;
    const direction = readingDirection(node);
    const inlineEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const vertical = bar?.orientation === 'vertical';

    /* On a bar the block axis opens the menu and the inline axis moves along
       the bar; on a vertical bar the two exchange places, which is the swap the
       pattern's fifth note describes. A submenu's item opens on the inline end
       in both, because that is where the submenu is. */
    const opensDown = parent === null && (!onBar || !vertical) && event.key === 'ArrowDown';
    const opensUp = parent === null && (!onBar || !vertical) && event.key === 'ArrowUp';
    const opensInline = event.key === inlineEnd && (parent !== null || (onBar && vertical));

    if (opensDown || opensInline) {
      event.preventDefault();
      event.stopPropagation();
      openWith('keyboard', 'first', event.nativeEvent);
      return;
    }
    if (opensUp) {
      event.preventDefault();
      openWith('keyboard', 'last', event.nativeEvent);
      return;
    }
    if (parent !== null && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      openWith('keyboard', 'first', event.nativeEvent);
    }
  };

  /**
   * Hover opens a submenu, and opens a bar's menu only once the bar already has
   * one open. Moving the pointer along a closed bar opens nothing; moving it
   * along an open one switches menus, which is the behaviour that separates a
   * menubar from a row of buttons.
   */
  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (menu.disabled) return;
    cancelPending();

    if (parent !== null) {
      parent.setOpenItem(node);
      if (!menu.openOnHover || menu.open) return;
      timer.current = setTimeout(
        () => openWith('pointer', 'first', event.nativeEvent),
        menu.submenuOpenDelay,
      );
      return;
    }

    if (onBar && bar !== null && bar.value !== undefined && bar.value !== menu.contentId) {
      node?.focus({ preventScroll: true });
      openWith('pointer', 'first', event.nativeEvent);
    }
  };

  /**
   * The grace area. The submenu stays open while the pointer's own path still
   * points into it, so the diagonal from this item to the surface may cross
   * three items it has no interest in.
   */
  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    if (parent === null || !menu.open) return;

    const surface = menu.contentNode;
    if (surface === null) return;

    intent.current?.destroy();
    intent.current = createPointerIntent({
      target: () => surface.getBoundingClientRect(),
      origin: () => node?.getBoundingClientRect() ?? null,
      timeout: menu.submenuCloseDelay,
      onSettled: () => {
        const state = latest.current;
        if (state.node?.matches(':hover')) return;
        if (surface.matches(':hover')) return;
        state.menu.toggle(false, 'pointer', event.nativeEvent);
      },
    });
  };

  const setTriggerNode = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  /**
   * A submenu's trigger is an item of the surface above, so it is laid out in
   * that surface's columns and its text belongs in the label's cell. On a bar
   * and on its own the trigger is a plain control, and its text is its own.
   */
  const content =
    parent === null ? (
      children
    ) : (
      <>
        {icon === undefined ? null : <MenuItemIcon>{icon}</MenuItemIcon>}
        <MenuItemLabel>{children}</MenuItemLabel>
        {meta === undefined ? null : <MenuItemMeta>{meta}</MenuItemMeta>}
        <Icon directional>
          <Glyph name="chevron-right" />
        </Icon>
      </>
    );

  const rootProps: MenuTriggerRootProps = {
    type: 'button',
    ...nativeProps,
    children: content,
    'aria-controls': menu.open ? menu.contentId : undefined,
    'aria-expanded': menu.open,
    'aria-haspopup': 'menu',
    id: menu.triggerId,
    ...(menu.disabled ? { 'aria-disabled': true, 'data-disabled': '' } : {}),
    ...(menu.open ? { 'data-open': '' } : {}),
    /* On a bar the tab stop belongs to the bar: `roving-tabindex` writes it on
       whichever trigger the reader left, and a `tabIndex` written here every
       render would take it back. An item of a surface is never a tab stop. */
    ...(parent !== null
      ? { role: 'menuitem', 'data-part': 'item', ...selectorKeyProps('part', 'item'), tabIndex: -1 }
      : onBar
        ? { role: 'menuitem', 'data-part': 'trigger', ...selectorKeyProps('part', 'trigger') }
        : {}),
    onClick: compose(nativeProps.onClick, onClick),
    onKeyDown: compose(nativeProps.onKeyDown, onKeyDown),
    onPointerEnter: compose(nativeProps.onPointerEnter, onPointerEnter),
    onPointerLeave: compose(nativeProps.onPointerLeave, onPointerLeave),
  };

  if (render !== undefined) return render({ ...rootProps, ref: setTriggerNode });
  return <button {...rootProps} ref={setTriggerNode} />;
}

/**
 * The layer and the surface it paints.
 *
 * The layer is what the positioner writes `left` and `top` onto and what scales
 * and fades; the surface is the painted panel, and it is the element carrying
 * `role="menu"`. Two boxes rather than one, as `tooltip` and `popover` are
 * built, because the module leaves `transform` alone on purpose.
 */
export function MenuContent({ children, loading, ref, render, ...nativeProps }: MenuContentProps) {
  const menu = useMenu();
  const parent = menu.parent;

  const [layerNode, setLayerNode] = useState<HTMLElement | null>(null);
  const [surfaceNode, setSurfaceNode] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<Element | null>(null);
  const [status, setStatus] = useState<PresenceStatus>('unmounted');
  /**
   * The reader is about to open the menu: the trigger took focus or a press.
   * The portal's layer is made then, because making it reads the trigger's
   * computed style, and a read in the open's own task is a style recalculation
   * the first frame waits for. A press focuses before it clicks, in a task of
   * its own.
   */
  const [warm, setWarm] = useState(false);
  const [openItem, setOpenItem] = useState<HTMLElement | null>(null);
  const [headerId, setHeaderId] = useState<string | null>(null);

  const presence = useRef<PresenceHandle | null>(null);
  const typeahead = useRef<TypeaheadHandle | null>(null);
  const latest = useRef({ menu, surfaceNode });
  latest.current = { menu, surfaceNode };

  useEffect(() => {
    const handle = createPresence({ present: latest.current.menu.open, onStatusChange: setStatus });
    presence.current = handle;
    setStatus(handle.status);
    return () => {
      handle.destroy();
      presence.current = null;
    };
  }, []);

  useEffect(() => {
    presence.current?.sync(menu.open);
  }, [menu.open]);

  useEffect(() => {
    presence.current?.setNode(layerNode);
  }, [layerNode]);

  useEffect(() => {
    menu.setContentNode(surfaceNode);
  }, [menu, surfaceNode]);

  /**
   * Open renders the menu in the commit that opens it, rather than once the
   * presence has reported `entering` in a render of its own.
   */
  const mounted =
    menu.mount === 'eager' ||
    (menu.mount === 'lazy' && menu.seen) ||
    menu.open ||
    status !== 'unmounted';

  useEffect(() => {
    const trigger = menu.triggerNode;
    if (trigger === null || warm) return undefined;
    const prepare = () => setWarm(true);
    trigger.addEventListener('focusin', prepare);
    trigger.addEventListener('pointerdown', prepare);
    return () => {
      trigger.removeEventListener('focusin', prepare);
      trigger.removeEventListener('pointerdown', prepare);
    };
  }, [menu.triggerNode, warm]);

  const layered = mounted || warm;
  useLayoutEffect(() => {
    if (!layered) {
      setContainer(null);
      return;
    }
    const handle = createPortalRoot({
      origin: menu.triggerNode,
      disabled: !menu.portal,
    });
    setContainer(handle.container);
    return () => handle.release();
  }, [layered, menu.portal, menu.triggerNode]);

  const {
    align,
    alignOffset,
    collisionPadding,
    flip,
    hideWhenDetached,
    shift,
    side,
    sideOffset,
    strategy,
  } = menu;

  /* The anchor is the trigger unless the menu was given one: a row, or the
     point a context menu was opened at. */
  const anchor = menu.anchor ?? menu.triggerNode;

  const positioner = useRef<PositionerHandle | null>(null);
  const focusFrame = useRef(0);

  /**
   * `data-open` is written by the measurement that places the menu, on the
   * element, in the task that opened it: the position, the side and the open
   * state reach one style update together, and the first frame after the
   * click shows the menu where it belongs. A render to say "positioned" was a
   * frame of its own.
   *
   * Focus enters the surface as it opens, and the pattern says which item. It
   * moves in the next frame: after the measurement, because focusing an item
   * still at the origin scrolls the page to it, and not in the open's own task,
   * because `focus()` after the writes is a style recalculation the first frame
   * waits for.
   */
  const place = useCallback((handle: PositionerHandle, layer: HTMLElement) => {
    void handle.update().then(() => {
      if (positioner.current !== handle || !latest.current.menu.open) return;
      const wasOpen = layer.hasAttribute('data-open');
      layer.setAttribute('data-open', '');
      const view = layer.ownerDocument.defaultView;
      if (wasOpen || view === null || focusFrame.current !== 0) return;
      focusFrame.current = view.requestAnimationFrame(() => {
        focusFrame.current = 0;
        const { menu, surfaceNode } = latest.current;
        if (!menu.open || surfaceNode === null) return;
        const bar = menu.onBar ? menu.menubar : null;
        const entry = bar === null ? menu.entry.current : bar.entry.current;
        menu.entry.current = 'first';
        if (bar !== null) bar.entry.current = 'first';
        /* `trigger` is a menu opened by arrowing along a bar: it appears and
           takes no focus, so the next arrow moves along the bar rather than
           down a list. */
        if (entry === 'trigger') return;
        focusEntry(surfaceNode, entry);
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (layerNode === null || anchor === null) return;

    /* A submenu is anchored to its item and placed from the parent's edge: the
       parent surface's inset is added along the side, and the submenu's own
       inset above its first item is taken off along the alignment, so the
       first item lines up with the item that opened it (M2). */
    const submenu =
      menu.parent !== null && surfaceNode !== null && menu.triggerNode !== null
        ? submenuOffsets({
            parentSurface: menu.parent.node,
            item: menu.triggerNode,
            surface: surfaceNode,
          })
        : { sideOffset: 0, alignOffset: 0 };

    const handle = createPositioner(anchor, layerNode, {
      align,
      alignOffset: alignOffset + submenu.alignOffset,
      boundaryPadding: collisionPadding,
      flip,
      hideWhenDetached,
      shift,
      side,
      sideOffset: sideOffset + submenu.sideOffset,
      strategy,
    });

    positioner.current = handle;
    if (latest.current.menu.open) place(handle, layerNode);

    return () => {
      handle.destroy();
      positioner.current = null;
      layerNode.removeAttribute('data-open');
    };
  }, [
    align,
    alignOffset,
    anchor,
    collisionPadding,
    flip,
    hideWhenDetached,
    layerNode,
    menu.parent,
    menu.triggerNode,
    shift,
    side,
    sideOffset,
    strategy,
    surfaceNode,
    place,
  ]);

  useLayoutEffect(() => {
    const handle = positioner.current;
    if (handle === null || layerNode === null) return;
    if (menu.open) {
      place(handle, layerNode);
      return;
    }
    layerNode.removeAttribute('data-open');
    if (focusFrame.current !== 0) {
      layerNode.ownerDocument.defaultView?.cancelAnimationFrame(focusFrame.current);
      focusFrame.current = 0;
    }
  }, [layerNode, menu.open, place]);

  /**
   * One layer in the single stack. The trigger is a branch, so pressing it is
   * inside the layer and toggles the menu instead of dismissing it twice; a
   * submenu records the surface above it as another, so a press in the child
   * never closes the parent.
   */
  useEffect(() => {
    if (layerNode === null || !menu.open) return;
    const branches = [menu.triggerNode, parent?.node ?? null].filter(
      (branch): branch is HTMLElement => branch !== null,
    );

    const layer = createDismissableLayer(layerNode, {
      branches,
      escape: menu.closeOnEscape,
      focusOutside: false,
      modal: false,
      outsidePress: menu.closeOnOutsidePress,
      scrollLock: false,
      onDismiss: (request) => {
        const reason: MenuOpenReason = request.reason === 'escape' ? 'escape' : 'outsidePress';
        latest.current.menu.toggle(false, reason, request.source);
        /* An outside press dismisses the whole stack; Escape takes one layer,
           which is what the pattern asks of it. */
        if (reason === 'outsidePress') parent?.closeAll('outsidePress', request.source);
      },
    });
    return () => layer.destroy();
  }, [
    layerNode,
    menu.closeOnEscape,
    menu.closeOnOutsidePress,
    menu.open,
    menu.triggerNode,
    parent,
  ]);

  /** Arrows, `Home` and `End`, with the disabled items kept in the ring. */
  useEffect(() => {
    if (surfaceNode === null) return;
    const navigation = createArrowNavigation(surfaceNode, {
      focus: reveal,
      includeAriaDisabled: true,
      itemSelector: ITEM_SELECTOR,
      loop: () => latest.current.menu.loop,
      orientation: () => 'vertical',
    });
    return () => navigation.destroy();
  }, [surfaceNode]);

  useEffect(() => {
    if (!menu.typeahead) return;
    const handle = createTypeahead({ timeout: menu.typeaheadTimeout });
    typeahead.current = handle;
    return () => {
      handle.destroy();
      typeahead.current = null;
    };
  }, [menu.typeahead, menu.typeaheadTimeout]);

  useEffect(() => {
    if (!menu.open) {
      setOpenItem(null);
      typeahead.current?.reset();
    }
  }, [menu.open]);

  const closeAll = useCallback(
    (reason: MenuOpenReason, source?: unknown) => {
      latest.current.menu.toggle(false, reason, source);
      parent?.closeAll(reason, source);
    },
    [parent],
  );

  const surface: MenuSurfaceValue = {
    close: (reason, source) => menu.toggle(false, reason, source),
    closeAll,
    depth: (parent?.depth ?? -1) + 1,
    focusItem: (index) => focusItem(surfaceNode, index),
    node: surfaceNode,
    openItem,
    rootTrigger: parent?.rootTrigger ?? menu.triggerNode,
    setHeaderId,
    setOpenItem,
  };

  /* The consumer's description and the header's, joined: the header names who
     the menu belongs to, and whatever the consumer wrote still reaches the reader. */
  const describedBy =
    [nativeProps['aria-describedby'], headerId].filter(Boolean).join(' ') || undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const direction = readingDirection(surfaceNode);
    const inlineStart = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const inlineEnd = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const bar = menu.menubar;

    if (event.key === 'Tab') {
      event.preventDefault();
      const trigger = surface.rootTrigger;
      closeAll('dismiss', event.nativeEvent);
      bar?.close('dismiss', event.nativeEvent);
      moveOut(trigger, event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === inlineStart) {
      if (parent !== null) {
        event.preventDefault();
        menu.toggle(false, 'keyboard', event.nativeEvent);
        return;
      }
      if (bar !== null) {
        event.preventDefault();
        bar.step(-1, { open: true, focus: true });
        return;
      }
    }

    /* An item that opens a submenu answers the inline end itself and stops the
       key here, so reaching this point means the item has none — which is the
       three-step rule the pattern gives for a menubar. */
    if (event.key === inlineEnd && bar !== null) {
      event.preventDefault();
      closeAll('keyboard', event.nativeEvent);
      bar.step(1, { open: true, focus: true });
      return;
    }

    if (!menu.typeahead || typeahead.current === null) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!isPrintable(event.key, typeahead.current.query.length > 0)) return;

    event.preventDefault();
    const list = items(surfaceNode);
    const from = list.findIndex((item) => item === event.target);
    const index = typeahead.current.match(event.key, list.map(textOf), from);
    if (index !== -1) focusItem(surfaceNode, index);
  };

  const setLayer = useCallback(
    (element: HTMLElement | null) => {
      setLayerNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  if (!mounted) return null;

  const rootProps: MenuContentRootProps = keyedProps({
    'data-align': align,
    /**
     * A layer kept in the document by `lazy` or `eager` is closed, and a closed
     * surface must not hold its items in the tab order or in the accessibility
     * tree. `inert` answers both at once, and unlike `visibility: hidden` it
     * leaves the exit transition to run.
     */
    ...(menu.open ? {} : { inert: true }),
    'data-part': 'root',
    'data-size': menu.size,
    'data-ui': 'menu',
    'data-width': menu.width,
  });

  const element = (
    <div {...rootProps} ref={setLayer}>
      <div
        {...withSelectorKey(nativeProps, 'part', 'content')}
        aria-busy={loading === true ? true : undefined}
        aria-describedby={describedBy}
        aria-labelledby={nativeProps['aria-label'] === undefined ? menu.triggerId : undefined}
        data-loading={loading === true ? '' : undefined}

        id={menu.contentId}
        onKeyDown={compose(nativeProps.onKeyDown, onKeyDown)}
        ref={setSurfaceNode}
        role="menu"
        /* Focusable only from script: an item losing the pointer hands focus
           back here rather than out of the layer, so the arrows still know
           where they are and no second item stays highlighted. */
        tabIndex={-1}
      >
        <MenuSurfaceProvider value={surface}>{children}</MenuSurfaceProvider>
      </div>
    </div>
  );

  const rendered =
    render === undefined ? element : render({ ...rootProps, children, ref: setLayer });

  return container === null ? rendered : createPortal(rendered, container);
}
