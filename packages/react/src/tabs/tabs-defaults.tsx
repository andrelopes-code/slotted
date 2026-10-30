import { createContext, useContext } from 'react';

import type { TabsDefaults, TabsDefaultsProviderProps } from './tabs.types';

const FALLBACK: TabsDefaults = {
  activation: 'automatic',
  fit: 'auto',
  loop: true,
  mount: 'active',
  orientation: 'horizontal',
  size: 'md',
  track: 'line',
  variant: 'line',
};

const TabsDefaultsContext = createContext<TabsDefaults>(FALLBACK);

/** What a tabs family renders as here, before it states anything of its own. */
export function useTabsDefaults(): TabsDefaults {
  return useContext(TabsDefaultsContext);
}

/**
 * An application decides once how its tabs look and behave, rather than
 * repeating the same seven props on every family in a product. A family that
 * states any of them itself still wins.
 */
export function TabsDefaultsProvider({ children, ...defaults }: TabsDefaultsProviderProps) {
  const inherited = useTabsDefaults();

  return (
    <TabsDefaultsContext.Provider
      value={{
        activation: defaults.activation ?? inherited.activation,
        fit: defaults.fit ?? inherited.fit,
        loop: defaults.loop ?? inherited.loop,
        mount: defaults.mount ?? inherited.mount,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
        track: defaults.track ?? inherited.track,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TabsDefaultsContext.Provider>
  );
}
