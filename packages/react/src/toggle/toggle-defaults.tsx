import { createContext, useContext } from 'react';

import type { ToggleDefaults, ToggleDefaultsProviderProps } from './toggle.types';

export const TOGGLE_FALLBACK: ToggleDefaults = {
  size: 'md',
  variant: 'outline',
};

const ToggleDefaultsContext = createContext<ToggleDefaults>(TOGGLE_FALLBACK);

/** What a toggle renders as here, before it states anything of its own. */
export function useToggleDefaults(): ToggleDefaults {
  return useContext(ToggleDefaultsContext);
}

/**
 * An application decides once how its toggles are drawn — a toolbar of ghost
 * modes, a form of framed ones — rather than repeating the two props on
 * every control. A toggle that states either itself still wins.
 */
export function ToggleDefaultsProvider({ children, ...defaults }: ToggleDefaultsProviderProps) {
  const inherited = useToggleDefaults();

  return (
    <ToggleDefaultsContext.Provider
      value={{
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ToggleDefaultsContext.Provider>
  );
}
