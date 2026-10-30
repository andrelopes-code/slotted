import { createContext, useContext } from 'react';

import type { ToggleGroupDefaults, ToggleGroupDefaultsProviderProps } from './toggle-group.types';

const FALLBACK: ToggleGroupDefaults = {
  attached: true,
  deselectable: true,
  loop: true,
  orientation: 'horizontal',
  size: 'md',
  variant: 'outline',
};

const ToggleGroupDefaultsContext = createContext<ToggleGroupDefaults>(FALLBACK);

/** What a toggle group renders as here, before it states anything of its own. */
export function useToggleGroupDefaults(): ToggleGroupDefaults {
  return useContext(ToggleGroupDefaultsContext);
}

/**
 * An application decides once how its toggle bars are drawn and how they
 * behave, rather than repeating the same props on every one of them. A group
 * that states any of them itself still wins.
 */
export function ToggleGroupDefaultsProvider({
  children,
  ...defaults
}: ToggleGroupDefaultsProviderProps) {
  const inherited = useToggleGroupDefaults();

  return (
    <ToggleGroupDefaultsContext.Provider
      value={{
        attached: defaults.attached ?? inherited.attached,
        deselectable: defaults.deselectable ?? inherited.deselectable,
        loop: defaults.loop ?? inherited.loop,
        orientation: defaults.orientation ?? inherited.orientation,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ToggleGroupDefaultsContext.Provider>
  );
}
