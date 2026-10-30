import { createContext, useContext, useMemo } from 'react';

import type {
  StatusIndicatorDefaults,
  StatusIndicatorDefaultsProviderProps,
} from './status-indicator.types';

const StatusIndicatorDefaultsContext = createContext<StatusIndicatorDefaults>({});

export function useStatusIndicatorDefaults(): StatusIndicatorDefaults {
  return useContext(StatusIndicatorDefaultsContext);
}

/**
 * An application decides once how its statuses are marked, how large they are
 * and whether they announce. A single indicator that states any of those still
 * wins: an explicit prop is never overridden by context. What each of the six
 * is called comes from the language in force (`SlottedProvider`).
 */
export function StatusIndicatorDefaultsProvider({
  children,
  live,
  mark,
  size,
}: StatusIndicatorDefaultsProviderProps) {
  const inherited = useStatusIndicatorDefaults();
  const value = useMemo(
    () => ({
      live: live ?? inherited.live,
      mark: mark ?? inherited.mark,
      size: size ?? inherited.size,
    }),
    [live, mark, size, inherited],
  );

  return (
    <StatusIndicatorDefaultsContext.Provider value={value}>
      {children}
    </StatusIndicatorDefaultsContext.Provider>
  );
}
