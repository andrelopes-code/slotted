import { createContext, useContext } from 'react';

import type { SparklineDefaults, SparklineDefaultsProviderProps } from './sparkline.types';

const SparklineDefaultsContext = createContext<SparklineDefaults>({});

export function useSparklineDefaults(): SparklineDefaults {
  return useContext(SparklineDefaultsContext);
}

/**
 * An application decides once how its sparklines are drawn and read out —
 * smoothed or not, washed or not, in which number format — and every
 * sparkline inherits it. A sparkline that states any of those still wins: an
 * explicit prop is never overridden by context. Its words and locale come from
 * the language in force (`SlottedProvider`).
 */
export function SparklineDefaultsProvider({
  children,
  ...defaults
}: SparklineDefaultsProviderProps) {
  const inherited = useSparklineDefaults();

  return (
    <SparklineDefaultsContext.Provider
      value={{
        area: defaults.area ?? inherited.area,
        curve: defaults.curve ?? inherited.curve,
        formatOptions: defaults.formatOptions ?? inherited.formatOptions,
        marker: defaults.marker ?? inherited.marker,
      }}
    >
      {children}
    </SparklineDefaultsContext.Provider>
  );
}
