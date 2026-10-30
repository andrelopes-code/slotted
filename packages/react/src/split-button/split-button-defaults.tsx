import { createContext, useContext } from 'react';

import type { SplitButtonDefaults, SplitButtonDefaultsProviderProps } from './split-button.types';

const SplitButtonDefaultsContext = createContext<SplitButtonDefaults>({});

/**
 * What a split button paints itself as here, before it states anything of
 * its own. Every axis is optional: an unset one falls through to `button`'s
 * own defaults, which is where an application that paints every action at
 * once already set it.
 */
export function useSplitButtonDefaults(): SplitButtonDefaults {
  return useContext(SplitButtonDefaultsContext);
}

/**
 * An application decides once how its split buttons are painted rather than
 * repeating three props on every one. A split button that states an axis
 * itself still wins.
 */
export function SplitButtonDefaultsProvider({
  children,
  ...defaults
}: SplitButtonDefaultsProviderProps) {
  const inherited = useSplitButtonDefaults();

  return (
    <SplitButtonDefaultsContext.Provider
      value={{
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </SplitButtonDefaultsContext.Provider>
  );
}
