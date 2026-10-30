import { createContext, useContext } from 'react';

import type { ToolbarDefaults, ToolbarDefaultsProviderProps } from './toolbar.types';

const FALLBACK: ToolbarDefaults = {
  loop: true,
  orientation: 'horizontal',
  overflow: 'wrap',
  size: 'md',
  variant: 'plain',
};

const ToolbarDefaultsContext = createContext<ToolbarDefaults>(FALLBACK);

/** What a toolbar renders as here, before it states anything of its own. */
export function useToolbarDefaults(): ToolbarDefaults {
  return useContext(ToolbarDefaultsContext);
}

/**
 * An application decides once how its bars are drawn and how they behave — a
 * product whose bars are all framed and compact says so in one place rather
 * than on every bar. A bar that states any of them itself still wins.
 */
export function ToolbarDefaultsProvider({ children, ...defaults }: ToolbarDefaultsProviderProps) {
  const inherited = useToolbarDefaults();

  return (
    <ToolbarDefaultsContext.Provider
      value={{
        loop: defaults.loop ?? inherited.loop,
        orientation: defaults.orientation ?? inherited.orientation,
        overflow: defaults.overflow ?? inherited.overflow,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ToolbarDefaultsContext.Provider>
  );
}
