import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/context-menu/context-menu.css';

import type { PositionerAnchor } from '@slotted/core/positioner';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, Ref } from 'react';

import { Menu, useMenu } from '../menu';
import type { MenuHandle, MenuOpenReason } from '../menu';
import { useContextMenuDefaults } from './context-menu-defaults';
import type {
  ContextMenuContextValue,
  ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuTriggerRootProps,
} from './context-menu.types';

const ContextMenuContext = createContext<ContextMenuContextValue | undefined>(undefined);

export function useContextMenu(): ContextMenuContextValue {
  const context = useContext(ContextMenuContext);
  if (context === undefined) {
    throw new Error('ContextMenuTrigger has to be inside a ContextMenu.');
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

/** A rectangle with no size at the point the reader pressed. */
function pointAnchor(x: number, y: number): PositionerAnchor {
  const rect = new DOMRect(x, y, 0, 0);
  return { getBoundingClientRect: () => rect };
}

/** Past this many pixels a held finger is a scroll, not a press. */
const MOVEMENT_THRESHOLD = 10;

/**
 * The window after a keyboard opening in which a `contextmenu` event is the
 * one Windows fires for the key rather than a second press. Chrome dispatches
 * it right after the `keydown`; the window is generous because a task may run
 * between the two.
 */
const KEYBOARD_ECHO = 300;

/**
 * A menu opened from a point.
 *
 * The component is the `Menu` family's state owner behind a different trigger:
 * it renders the `Menu`, hands it the point the reader pressed as its anchor
 * and what held focus at that moment as its way back, and nothing else changes
 * — `MenuContent` and every item are imported from `menu` as they are, the way
 * a `Menubar` holds its menus. Radix re-exports sixteen parts under a second
 * name here, and two copies of one machine drift.
 */
export function ContextMenu({
  children,
  disabled,
  longPress,
  longPressDelay,
  onOpenChange,
  ref,
  ...menuProps
}: ContextMenuProps) {
  const defaults = useContextMenuDefaults();
  const [anchor, setAnchor] = useState<PositionerAnchor | null>(null);
  const returnTo = useRef<Element | null>(null);
  const inner = useRef<MenuHandle | null>(null);

  const resolvedDisabled = disabled ?? defaults.disabled;

  /* `open()` from script hangs the surface from the target rather than from
     wherever the pointer last pressed, which may be a stale point. */
  useImperativeHandle(
    ref,
    () => ({
      close: () => inner.current?.close(),
      focus: (index?: number) => inner.current?.focus(index),
      open: () => {
        setAnchor(null);
        inner.current?.open();
      },
    }),
    [],
  );

  const context: ContextMenuContextValue = {
    disabled: resolvedDisabled,
    longPress: longPress ?? defaults.longPress,
    longPressDelay: longPressDelay ?? defaults.longPressDelay,
    returnTo,
    setAnchor,
  };

  return (
    <ContextMenuContext.Provider value={context}>
      <Menu
        {...menuProps}
        anchor={anchor}
        disabled={resolvedDisabled}
        finalFocus={returnTo}
        {...(onOpenChange === undefined ? {} : { onOpenChange })}
        ref={inner}
      >
        {children}
      </Menu>
    </ContextMenuContext.Provider>
  );
}

/**
 * The target: the region a secondary click, a long press or `Shift+F10` opens
 * the menu on. It is the family's one part, because a context target is a
 * region the consumer wraps and not a control that is another family's root —
 * and `render` takes a row or a card when the wrapper cannot be a `div`.
 *
 * It writes no `aria-haspopup`, which is not permitted on a generic element,
 * and no `tabindex`, which would add a tab stop to every wrapped region. A
 * target the consumer made focusable can be opened from the keyboard; one they
 * did not cannot, and the reference page says so.
 */
export function ContextMenuTrigger({
  children,
  ref,
  render,
  ...nativeProps
}: ContextMenuTriggerProps) {
  const menu = useMenu();
  const family = useContextMenu();

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [pressed, setPressed] = useState(false);
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const openedByKeyboardAt = useRef(0);

  const latest = useRef({ family, menu, node });
  latest.current = { family, menu, node };

  useEffect(() => {
    menu.setTriggerNode(node);
  }, [menu, node]);

  const cancelPress = useCallback(() => {
    if (press.current === null) return;
    clearTimeout(press.current.timer);
    press.current = null;
    setPressed(false);
  }, []);

  useEffect(() => cancelPress, [cancelPress]);

  /**
   * Opens, or moves. The way back is captured now: the element that held focus
   * when the reader pressed — the checkbox in the row, the canvas — and the
   * target itself when nothing did. While the surface is already open the
   * anchor moves and no request is emitted, because `open` did not change.
   */
  const openAt = (anchor: PositionerAnchor | null, reason: MenuOpenReason, source: Event) => {
    const state = latest.current;
    if (!state.menu.open) {
      const active = state.node?.ownerDocument.activeElement ?? null;
      state.family.returnTo.current =
        active !== null && active !== active.ownerDocument.body ? active : state.node;
    }
    state.family.setAnchor(anchor);
    state.menu.entry.current = 'first';
    state.menu.toggle(true, reason, source);
  };

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    if (family.disabled) return;
    event.preventDefault();
    cancelPress();
    /* Windows fires `contextmenu` for the key the family already answered. */
    if (Date.now() - openedByKeyboardAt.current < KEYBOARD_ECHO) return;
    openAt(pointAnchor(event.clientX, event.clientY), 'pointer', event.nativeEvent);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (family.disabled) return;
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
    event.preventDefault();
    openedByKeyboardAt.current = Date.now();
    openAt(null, 'keyboard', event.nativeEvent);
  };

  /**
   * A primary press on the target while the menu shows closes it: the target
   * is a branch of the layer, so the layer would not, and from the reader's
   * side the target is elsewhere. On touch and pen the same press may also be
   * the start of a long one.
   */
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (family.disabled) return;
    if (event.button === 0 && menu.open) {
      menu.toggle(false, 'outsidePress', event.nativeEvent);
    }
    if (!family.longPress || event.pointerType === 'mouse' || event.button !== 0) return;

    cancelPress();
    const { clientX: x, clientY: y } = event;
    const source = event.nativeEvent;
    press.current = {
      x,
      y,
      timer: setTimeout(() => {
        press.current = null;
        setPressed(false);
        openAt(pointAnchor(x, y), 'pointer', source);
      }, family.longPressDelay),
    };
    setPressed(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (press.current === null) return;
    if (
      Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) >
      MOVEMENT_THRESHOLD
    ) {
      cancelPress();
    }
  };

  /**
   * The browser would draw its own menu over a secondary click on an item of
   * the family's. While the surface shows, `contextmenu` inside it is prevented.
   */
  useEffect(() => {
    if (!menu.open || menu.contentNode === null) return;
    const layer = menu.contentNode.parentElement ?? menu.contentNode;
    const guard = (event: Event) => {
      if (event.target instanceof Node && layer.contains(event.target)) event.preventDefault();
    };
    const document = layer.ownerDocument;
    document.addEventListener('contextmenu', guard, true);
    return () => document.removeEventListener('contextmenu', guard, true);
  }, [menu.contentNode, menu.open]);

  const setRoot = useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      attach(element, ref as Ref<HTMLElement> | undefined);
    },
    [ref],
  );

  const rootProps: ContextMenuTriggerRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-ui': 'context-menu',
    'data-part': 'root',
    /* The menu names its surface after this element unless it is given an
       aria-label; a row's text is the name of what the commands act on. */
    id: menu.triggerId,
    ...(menu.open ? { 'data-open': '' } : {}),
    ...(pressed ? { 'data-pressed': '' } : {}),
    ...(family.disabled ? { 'data-disabled': '' } : {}),
    onContextMenu: compose(nativeProps.onContextMenu, onContextMenu),
    onKeyDown: compose(nativeProps.onKeyDown, onKeyDown),
    onPointerCancel: compose(nativeProps.onPointerCancel, cancelPress),
    onPointerDown: compose(nativeProps.onPointerDown, onPointerDown),
    onPointerMove: compose(nativeProps.onPointerMove, onPointerMove),
    onPointerUp: compose(nativeProps.onPointerUp, cancelPress),
  });

  if (render !== undefined) return render({ ...rootProps, ref: setRoot });
  return <div {...rootProps} ref={setRoot} />;
}
