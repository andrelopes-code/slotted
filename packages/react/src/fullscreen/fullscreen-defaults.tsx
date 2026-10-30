import { createContext, useContext } from 'react';

import type { FullscreenDefaults, FullscreenDefaultsProviderProps } from './fullscreen.types';

export const FULLSCREEN_FALLBACK: FullscreenDefaults = {
  mode: 'auto',
  navigationUI: 'auto',
  size: 'md',
  variant: 'ghost',
};

const FullscreenDefaultsContext = createContext<FullscreenDefaults>(FULLSCREEN_FALLBACK);

export function useFullscreenDefaults(): FullscreenDefaults {
  return useContext(FullscreenDefaultsContext);
}

/**
 * An application decides once whether its regions ask the platform and how the
 * control is drawn; a region or a control that states any of them itself still
 * wins. The words come from the language in force (`SlottedProvider`).
 */
export function FullscreenDefaultsProvider({
  children,
  ...defaults
}: FullscreenDefaultsProviderProps) {
  const inherited = useFullscreenDefaults();

  return (
    <FullscreenDefaultsContext.Provider
      value={{
        mode: defaults.mode ?? inherited.mode,
        navigationUI: defaults.navigationUI ?? inherited.navigationUI,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </FullscreenDefaultsContext.Provider>
  );
}
