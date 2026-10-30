import { createContext, useContext } from 'react';

import type { AlertDefaults, AlertDefaultsProviderProps } from './alert.types';

const FALLBACK: AlertDefaults = {
  live: 'off',
  reach: 'section',
  tone: 'accent',
  variant: 'soft',
};

const AlertDefaultsContext = createContext<AlertDefaults>(FALLBACK);

/** What an alert renders as here, before it states anything of its own. */
export function useAlertDefaults(): AlertDefaults {
  return useContext(AlertDefaultsContext);
}

/**
 * An application decides once how its messages are painted, at what reach and
 * how loud, rather than repeating the same props on every alert in a settings
 * page. An alert that states any of them itself still wins: an explicit prop is
 * never overridden by context. The dismiss control's name comes from the
 * language in force (`SlottedProvider`).
 *
 * MUI's `DefaultPropsProvider` is the only surveyed implementation with an
 * equivalent, and it ships one binding.
 */
export function AlertDefaultsProvider({ children, ...defaults }: AlertDefaultsProviderProps) {
  const inherited = useAlertDefaults();

  return (
    <AlertDefaultsContext.Provider
      value={{
        live: defaults.live ?? inherited.live,
        reach: defaults.reach ?? inherited.reach,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </AlertDefaultsContext.Provider>
  );
}
