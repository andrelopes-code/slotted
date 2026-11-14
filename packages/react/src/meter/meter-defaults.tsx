import { createContext, useContext } from 'react';

import type { MeterDefaults, MeterDefaultsProviderProps } from './meter.types';

const MeterDefaultsContext = createContext<MeterDefaults>({});

export function useMeterDefaults(): MeterDefaults {
  return useContext(MeterDefaultsContext);
}

/**
 * An application decides once how large its meters are and how a share is
 * read out. A meter that states either still wins: an explicit prop is never
 * overridden by context.
 */
export function MeterDefaultsProvider({ children, ...defaults }: MeterDefaultsProviderProps) {
  const inherited = useMeterDefaults();

  return (
    <MeterDefaultsContext.Provider
      value={{
        formatOptions: defaults.formatOptions ?? inherited.formatOptions,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </MeterDefaultsContext.Provider>
  );
}
