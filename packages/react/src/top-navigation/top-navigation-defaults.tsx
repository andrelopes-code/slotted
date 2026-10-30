import { createContext, useContext, useMemo } from 'react';

import type {
  TopNavigationDefaults,
  TopNavigationDefaultsProviderProps,
} from './top-navigation.types';

/** The contract's defaults. */
export const TOP_NAVIGATION_FALLBACK: TopNavigationDefaults = {
  frame: true,
  landmark: true,
  size: 'md',
};

const TopNavigationDefaultsContext = createContext<TopNavigationDefaults>(TOP_NAVIGATION_FALLBACK);

/** What a bar renders as here, before it states anything of its own. */
export function useTopNavigationDefaults(): TopNavigationDefaults {
  return useContext(TopNavigationDefaultsContext);
}

/**
 * An application decides once how its bars read — the size, the frame —
 * rather than repeating it on every bar in a product. A bar that states any of
 * them itself still wins. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function TopNavigationDefaultsProvider({
  children,
  ...defaults
}: TopNavigationDefaultsProviderProps) {
  const inherited = useTopNavigationDefaults();

  const value = useMemo<TopNavigationDefaults>(
    () => ({
      frame: defaults.frame ?? inherited.frame,
      landmark: defaults.landmark ?? inherited.landmark,
      size: defaults.size ?? inherited.size,
    }),
    [defaults.frame, defaults.landmark, defaults.size, inherited],
  );

  return (
    <TopNavigationDefaultsContext.Provider value={value}>
      {children}
    </TopNavigationDefaultsContext.Provider>
  );
}
