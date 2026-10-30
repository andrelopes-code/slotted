import { createContext, useContext } from 'react';

import type { HighlightDefaults, HighlightDefaultsProviderProps } from './highlight.types';

const FALLBACK: HighlightDefaults = {
  locale: undefined,
  sensitivity: 'base',
  occurrences: 'all',
};

const HighlightDefaultsContext = createContext<HighlightDefaults>(FALLBACK);

/** What a mark compares with here, before it states anything of its own. */
export function useHighlightDefaults(): HighlightDefaults {
  return useContext(HighlightDefaultsContext);
}

/**
 * An application decides once which locale its marks compare in, how strict
 * the comparison is, and whether every occurrence is marked. A mark that
 * states any of them itself still wins: an explicit prop is never overridden
 * by context. A host — `combobox`, `select` — passes the locale its filter
 * used, which is the same rule from the other side.
 */
export function HighlightDefaultsProvider({
  children,
  ...defaults
}: HighlightDefaultsProviderProps) {
  const inherited = useHighlightDefaults();

  return (
    <HighlightDefaultsContext.Provider
      value={{
        locale: defaults.locale ?? inherited.locale,
        sensitivity: defaults.sensitivity ?? inherited.sensitivity,
        occurrences: defaults.occurrences ?? inherited.occurrences,
      }}
    >
      {children}
    </HighlightDefaultsContext.Provider>
  );
}
