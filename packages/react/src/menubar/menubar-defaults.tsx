import { createContext, useContext } from 'react';

import type { MenubarDefaults, MenubarDefaultsProviderProps } from './menubar.types';

/**
 * A bar is horizontal, wraps at its ends, and answers typeahead — the three
 * the pattern describes. `size` is the one an application usually states, and
 * it reaches every menu the bar opens.
 */
export const MENUBAR_FALLBACK: MenubarDefaults = {
  disabled: false,
  loop: true,
  orientation: 'horizontal',
  size: 'md',
  typeahead: true,
};

const MenubarDefaultsContext = createContext<MenubarDefaults>(MENUBAR_FALLBACK);

export function useMenubarDefaults(): MenubarDefaults {
  return useContext(MenubarDefaultsContext);
}

/** The decisions an application takes once, in its bootstrap. */
export function MenubarDefaultsProvider({ children, ...overrides }: MenubarDefaultsProviderProps) {
  const inherited = useMenubarDefaults();

  const value: MenubarDefaults = {
    disabled: overrides.disabled ?? inherited.disabled,
    loop: overrides.loop ?? inherited.loop,
    orientation: overrides.orientation ?? inherited.orientation,
    size: overrides.size ?? inherited.size,
    typeahead: overrides.typeahead ?? inherited.typeahead,
  };

  return (
    <MenubarDefaultsContext.Provider value={value}>{children}</MenubarDefaultsContext.Provider>
  );
}
