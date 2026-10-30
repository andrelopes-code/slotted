import '@slotted/styles/menu/menu.css';
import '@slotted/styles/highlight/highlight.css';

import { createControllable } from '@slotted/core/state';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useMenuDefaults } from './menu-defaults';
import type {
  MenuContextValue,
  MenuEntry,
  MenuFocusTarget,
  MenuOpenReason,
  MenuProps,
  MenuSurfaceValue,
  MenubarSurfaceValue,
} from './menu.types';

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

/**
 * The surface a part is inside. A `Menu` that finds one is a submenu of it, an
 * item reads it to close every surface at once, and a nested surface reads its
 * depth from it.
 */
const MenuSurfaceContext = createContext<MenuSurfaceValue | null>(null);

/**
 * The bar a menu belongs to. The menubar family provides it; this family only
 * reads it, so nothing here depends on anything above it.
 */
const MenubarSurfaceContext = createContext<MenubarSurfaceValue | null>(null);

export const MenuSurfaceProvider = MenuSurfaceContext.Provider;
export const MenubarSurfaceProvider = MenubarSurfaceContext.Provider;

export function useMenuSurface(): MenuSurfaceValue | null {
  return useContext(MenuSurfaceContext);
}

export function useMenubarSurface(): MenubarSurfaceValue | null {
  return useContext(MenubarSurfaceContext);
}

/**
 * What the menu around this part says. A trigger, a surface or an item outside
 * one has no state to report, so this throws rather than rendering markup that
 * looks right and never opens.
 */
export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('MenuTrigger, MenuContent and every item have to be inside a Menu.');
  }
  return context;
}

/**
 * A list of commands on a layer.
 *
 * This component owns the state and **renders nothing**: the trigger stays
 * where the consumer wrote it and the surface is portalled to the end of the
 * document, so no single element could hold both.
 *
 * Where it sits decides what it is. On its own it hangs from the consumer's own
 * control. Inside another menu's surface it is a submenu, and its trigger
 * becomes an item of the surface above. Inside a `Menubar` it is one of the
 * bar's menus, and the bar — not this component — holds which one is open,
 * because a bar has at most one and a boolean on each could represent two.
 */
/** The element a focus target names, or `null`. */
function resolveFocus(target: MenuFocusTarget | undefined, scope: HTMLElement | null) {
  if (target === undefined) return null;
  if (typeof target === 'string') return scope?.querySelector<HTMLElement>(target) ?? null;
  if (target instanceof Element) return target as HTMLElement;
  return (target.current as HTMLElement | null) ?? null;
}

export function Menu({
  align,
  alignOffset,
  anchor,
  children,
  closeOnEscape,
  closeOnOutsidePress,
  closeOnSelect,
  collisionPadding,
  defaultOpen,
  disabled,
  finalFocus,
  flip,
  hideWhenDetached,
  loop,
  mount,
  onOpenChange,
  open,
  openOnHover,
  portal,
  ref,
  shift,
  side,
  sideOffset,
  size,
  strategy,
  submenuCloseDelay,
  submenuOpenDelay,
  typeahead,
  typeaheadTimeout,
  value,
  width,
}: MenuProps) {
  const defaults = useMenuDefaults();
  const parent = useMenuSurface();
  /**
   * A submenu of a bar's menu still sees the bar in context, and must not read
   * its own state from it: the bar holds which of *its* menus is open, and a
   * submenu is not one of them. It still needs the bar for the two keys that
   * move between menus, which is why the raw value stays on the context.
   */
  const menubar = useMenubarSurface();
  const onBar = parent === null && menubar !== null;

  const generated = useId();
  const identity = value ?? generated;
  const contentId = `${generated}menu`;
  const triggerId = `${generated}trigger`;

  const [own, setOwn] = useState<boolean>(defaultOpen ?? false);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);

  const resolvedDisabled = disabled ?? defaults.disabled;

  /**
   * A menu on a bar reads its own state from the bar, so the two models compose
   * instead of competing: the bar holds the identity of the open menu, and this
   * menu is open when that identity is its own.
   */
  const held = onBar ? menubar?.value === identity : (open ?? own);
  const current = held && !resolvedDisabled;

  const seen = useRef(current);
  if (current) seen.current = true;

  /** Where focus lands when the surface opens. `ArrowUp` asks for the last. */
  const entry = useRef<MenuEntry>('first');

  const latest = useRef({
    contentNode,
    current,
    finalFocus,
    identity,
    menubar,
    onBar,
    onOpenChange,
    open,
    parent,
    triggerNode,
  });
  latest.current = {
    contentNode,
    current,
    finalFocus,
    identity,
    menubar,
    onBar,
    onOpenChange,
    open,
    parent,
    triggerNode,
  };

  const toggle = useCallback((next: boolean, reason: MenuOpenReason, source?: unknown) => {
    const state = latest.current;
    if (next === state.current) return;

    let cancelled = false;
    const controllable = createControllable<boolean>({
      controlled: state.onBar ? undefined : state.open,
      initial: state.current,
      onRequest: (request) => {
        cancelled = request.cancelled;
        state.onOpenChange?.(request.value, request as never);
      },
    });
    const moved = controllable.request(next, reason, source);
    if (cancelled) return;

    if (state.onBar && state.menubar !== null) {
      if (next) state.menubar.open(state.identity, reason, source);
      else state.menubar.close(reason, source);
    } else if (moved) {
      setOwn(next);
    }

    /**
     * Focus goes back to whatever opened the surface — the consumer's control,
     * the item above, or the trigger on the bar — unless the reader pressed
     * somewhere else, in which case taking it back would fight them.
     */
    if (!next && reason !== 'outsidePress' && reason !== 'programmatic') {
      const target = resolveFocus(state.finalFocus, state.contentNode) ?? state.triggerNode;
      target?.focus({ preventScroll: true });
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      close: () => toggle(false, 'programmatic'),
      open: () => toggle(true, 'programmatic'),
      focus: () => latest.current.triggerNode?.focus({ preventScroll: true }),
    }),
    [toggle],
  );

  /* A submenu opens to the inline end of the item that owns it; a menu on a
     vertical bar opens beside the bar rather than under it. */
  const inheritedSide =
    parent !== null
      ? 'inline-end'
      : onBar && menubar?.orientation === 'vertical'
        ? 'inline-end'
        : undefined;

  const context: MenuContextValue = {
    align: align ?? (parent !== null ? 'start' : defaults.align),
    alignOffset: alignOffset ?? defaults.alignOffset,
    anchor: anchor ?? null,
    closeOnEscape: closeOnEscape ?? defaults.closeOnEscape,
    closeOnOutsidePress: closeOnOutsidePress ?? defaults.closeOnOutsidePress,
    closeOnSelect: closeOnSelect ?? defaults.closeOnSelect,
    collisionPadding: collisionPadding ?? defaults.collisionPadding,
    contentId,
    contentNode,
    disabled: resolvedDisabled || (onBar && (menubar?.disabled ?? false)),
    entry,
    flip: flip ?? defaults.flip,
    hideWhenDetached: hideWhenDetached ?? defaults.hideWhenDetached,
    identity,
    loop: loop ?? defaults.loop,
    menubar,
    mount: mount ?? defaults.mount,
    open: current,
    openOnHover: openOnHover ?? defaults.openOnHover,
    parent,
    portal: portal ?? defaults.portal,
    seen: seen.current,
    setContentNode,
    setTriggerNode,
    shift: shift ?? defaults.shift,
    side: side ?? inheritedSide ?? defaults.side,
    sideOffset: sideOffset ?? defaults.sideOffset,
    onBar,
    size: size ?? (onBar ? menubar?.size : undefined) ?? defaults.size,
    strategy: strategy ?? defaults.strategy,
    submenuCloseDelay: submenuCloseDelay ?? defaults.submenuCloseDelay,
    submenuOpenDelay: submenuOpenDelay ?? defaults.submenuOpenDelay,
    toggle,
    triggerId,
    triggerNode,
    typeahead: typeahead ?? defaults.typeahead,
    typeaheadTimeout: typeaheadTimeout ?? defaults.typeaheadTimeout,
    /* A submenu hangs from an item, and an item's width is not a measure. */
    width: parent === null ? (width ?? defaults.width) : 'content',
  };

  return <MenuContext.Provider value={context}>{children}</MenuContext.Provider>;
}
