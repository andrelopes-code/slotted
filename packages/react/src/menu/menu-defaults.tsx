import { setPortalContainer } from '@slotted/core/portal';
import { createContext, useContext, useEffect, useRef } from 'react';

import type { MenuDefaults, MenuDefaultsProviderProps } from './menu.types';

/**
 * The numbers, and why they are these numbers.
 *
 * `side` and `align` put the surface under the start edge of its own button,
 * where the button's text and the items' labels share one edge; `popover`
 * centers, because it points at something instead of hanging from it.
 *
 * `submenuOpenDelay` is a hundred and fifty milliseconds (M2): short enough
 * that a deliberate hover is answered before the reader presses, long enough
 * that a pointer crossing three items on its way down opens none of them.
 * `submenuCloseDelay` is the window the pointer has to reach the submenu once
 * it has stopped heading there, and it is spent by `pointer-intent`.
 *
 * `hideWhenDetached` is `true` against `popover`'s `false`: a menu whose button
 * has scrolled out of a pane is a list of commands for a control the reader can
 * no longer see.
 */
export const MENU_FALLBACK: MenuDefaults = {
  align: 'start',
  alignOffset: 0,
  closeOnEscape: true,
  closeOnOutsidePress: true,
  closeOnSelect: true,
  collisionPadding: 8,
  disabled: false,
  flip: true,
  hideWhenDetached: true,
  loop: true,
  mount: 'active',
  openOnHover: true,
  portal: true,
  shift: true,
  side: 'bottom',
  sideOffset: 0,
  size: 'md',
  strategy: 'absolute',
  submenuCloseDelay: 300,
  submenuOpenDelay: 150,
  typeahead: true,
  typeaheadTimeout: 500,
  width: 'content',
};

const MenuDefaultsContext = createContext<MenuDefaults>(MENU_FALLBACK);

/** The defaults in force here. A menu reads it; a consumer rarely needs to. */
export function useMenuDefaults(): MenuDefaults {
  return useContext(MenuDefaultsContext);
}

/**
 * The decisions an application takes once, in its bootstrap, rather than on
 * every menu it renders. A menu that states one of them itself still wins,
 * which is what lets a dense table's row menu differ from the header's.
 */
export function MenuDefaultsProvider({
  children,
  container,
  ...overrides
}: MenuDefaultsProviderProps) {
  const inherited = useMenuDefaults();
  const previous = useRef<Element | null>(null);

  useEffect(() => {
    if (container === undefined) return;
    previous.current = container;
    setPortalContainer(container);
    return () => setPortalContainer(null);
  }, [container]);

  const value: MenuDefaults = {
    align: overrides.align ?? inherited.align,
    alignOffset: overrides.alignOffset ?? inherited.alignOffset,
    closeOnEscape: overrides.closeOnEscape ?? inherited.closeOnEscape,
    closeOnOutsidePress: overrides.closeOnOutsidePress ?? inherited.closeOnOutsidePress,
    closeOnSelect: overrides.closeOnSelect ?? inherited.closeOnSelect,
    collisionPadding: overrides.collisionPadding ?? inherited.collisionPadding,
    disabled: overrides.disabled ?? inherited.disabled,
    flip: overrides.flip ?? inherited.flip,
    hideWhenDetached: overrides.hideWhenDetached ?? inherited.hideWhenDetached,
    loop: overrides.loop ?? inherited.loop,
    mount: overrides.mount ?? inherited.mount,
    openOnHover: overrides.openOnHover ?? inherited.openOnHover,
    portal: overrides.portal ?? inherited.portal,
    shift: overrides.shift ?? inherited.shift,
    side: overrides.side ?? inherited.side,
    sideOffset: overrides.sideOffset ?? inherited.sideOffset,
    size: overrides.size ?? inherited.size,
    strategy: overrides.strategy ?? inherited.strategy,
    submenuCloseDelay: overrides.submenuCloseDelay ?? inherited.submenuCloseDelay,
    submenuOpenDelay: overrides.submenuOpenDelay ?? inherited.submenuOpenDelay,
    typeahead: overrides.typeahead ?? inherited.typeahead,
    typeaheadTimeout: overrides.typeaheadTimeout ?? inherited.typeaheadTimeout,
    width: overrides.width ?? inherited.width,
  };

  return <MenuDefaultsContext.Provider value={value}>{children}</MenuDefaultsContext.Provider>;
}
