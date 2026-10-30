import { createContext, useContext, useMemo } from 'react';

import type {
  NavigationMenuDefaults,
  NavigationMenuDefaultsProviderProps,
} from './navigation-menu.types';

/** The contract's defaults. */
export const NAVIGATION_MENU_FALLBACK: NavigationMenuDefaults = {
  arrow: false,
  closeDelay: 300,
  closeOnSelect: true,
  openDelay: 200,
  size: 'md',
};

const NavigationMenuDefaultsContext =
  createContext<NavigationMenuDefaults>(NAVIGATION_MENU_FALLBACK);

/** What a navigation menu renders as here, before it states anything of its own. */
export function useNavigationMenuDefaults(): NavigationMenuDefaults {
  return useContext(NavigationMenuDefaultsContext);
}

/**
 * An application decides once how its navigation menus behave — the hover
 * delays, whether following a link closes the panel, the size, the arrow —
 * rather than on every instance. An instance that states any of them still
 * wins. Its words come from the language in force (`SlottedProvider`).
 */
export function NavigationMenuDefaultsProvider({
  children,
  ...defaults
}: NavigationMenuDefaultsProviderProps) {
  const inherited = useNavigationMenuDefaults();

  const value = useMemo<NavigationMenuDefaults>(
    () => ({
      arrow: defaults.arrow ?? inherited.arrow,
      closeDelay: defaults.closeDelay ?? inherited.closeDelay,
      closeOnSelect: defaults.closeOnSelect ?? inherited.closeOnSelect,
      openDelay: defaults.openDelay ?? inherited.openDelay,
      size: defaults.size ?? inherited.size,
    }),
    [
      defaults.arrow,
      defaults.closeDelay,
      defaults.closeOnSelect,
      defaults.openDelay,
      defaults.size,
      inherited,
    ],
  );

  return (
    <NavigationMenuDefaultsContext.Provider value={value}>
      {children}
    </NavigationMenuDefaultsContext.Provider>
  );
}
