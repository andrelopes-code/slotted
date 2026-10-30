import { createContext, useContext, useMemo } from 'react';

import type {
  SideNavigationDefaults,
  SideNavigationDefaultsProviderProps,
} from './side-navigation.types';

/** The contract's defaults, and the width the rail is read at. */
export const SIDE_NAVIGATION_FALLBACK: SideNavigationDefaults = {
  autoExpand: true,
  compactAt: 96,
  guides: true,
  landmark: true,
  mode: 'auto',
  multiple: true,
  size: 'md',
  truncate: 'end',
};

const SideNavigationDefaultsContext =
  createContext<SideNavigationDefaults>(SIDE_NAVIGATION_FALLBACK);

/** What a column renders as here, before it states anything of its own. */
export function useSideNavigationDefaults(): SideNavigationDefaults {
  return useContext(SideNavigationDefaultsContext);
}

/**
 * An application decides once how its columns read — the rail's width, the
 * cut, whether groups open one at a time — rather than repeating it on every
 * navigation in a product. A column that states any of them itself still wins.
 * Its words come from the language in force (`SlottedProvider`).
 */
export function SideNavigationDefaultsProvider({
  children,
  ...defaults
}: SideNavigationDefaultsProviderProps) {
  const inherited = useSideNavigationDefaults();

  const value = useMemo<SideNavigationDefaults>(
    () => ({
      autoExpand: defaults.autoExpand ?? inherited.autoExpand,
      compactAt: defaults.compactAt ?? inherited.compactAt,
      guides: defaults.guides ?? inherited.guides,
      landmark: defaults.landmark ?? inherited.landmark,
      mode: defaults.mode ?? inherited.mode,
      multiple: defaults.multiple ?? inherited.multiple,
      size: defaults.size ?? inherited.size,
      truncate: defaults.truncate ?? inherited.truncate,
    }),
    [
      defaults.autoExpand,
      defaults.compactAt,
      defaults.guides,
      defaults.landmark,
      defaults.mode,
      defaults.multiple,
      defaults.size,
      defaults.truncate,
      inherited,
    ],
  );

  return (
    <SideNavigationDefaultsContext.Provider value={value}>
      {children}
    </SideNavigationDefaultsContext.Provider>
  );
}
