import { createContext, useContext } from 'react';

import type { ResultStateDefaults, ResultStateDefaultsProviderProps } from './result-state.types';

const FALLBACK: ResultStateDefaults = {
  align: 'center',
  illustration: 'none',
  live: 'polite',
  reach: 'section',
  status: 'empty',
};

const ResultStateDefaultsContext = createContext<ResultStateDefaults>(FALLBACK);

/** What a result state renders as here, before it states anything of its own. */
export function useResultStateDefaults(): ResultStateDefaults {
  return useContext(ResultStateDefaultsContext);
}

/**
 * An application decides once how its empty and error regions are drawn, and —
 * the one that matters most — whether they announce. A data-dense product sets
 * `reach="inline"` and `align="start"` for a whole screen of tables rather than
 * repeating the two props on every one of them.
 *
 * A region that states any of them itself still wins: an explicit prop is never
 * overridden by context. Of the seven surveyed implementations only Ant has an
 * equivalent, it reaches `Empty`'s image alone, and it ships one binding.
 */
export function ResultStateDefaultsProvider({
  children,
  ...defaults
}: ResultStateDefaultsProviderProps) {
  const inherited = useResultStateDefaults();

  return (
    <ResultStateDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        illustration: defaults.illustration ?? inherited.illustration,
        live: defaults.live ?? inherited.live,
        reach: defaults.reach ?? inherited.reach,
        status: defaults.status ?? inherited.status,
      }}
    >
      {children}
    </ResultStateDefaultsContext.Provider>
  );
}
