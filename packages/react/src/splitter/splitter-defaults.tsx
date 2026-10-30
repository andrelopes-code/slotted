import { createContext, useContext } from 'react';

import type { SplitterDefaults, SplitterDefaultsProviderProps } from './splitter.types';

const FALLBACK: SplitterDefaults = {
  collapsedValue: 0,
  max: 1,
  min: 0,
  orientation: 'vertical',
};

const SplitterDefaultsContext = createContext<SplitterDefaults>(FALLBACK);

/** What a splitter is here, before it states anything of its own. */
export function useSplitterDefaults(): SplitterDefaults {
  return useContext(SplitterDefaultsContext);
}

/**
 * An application decides once how far its bars may travel, rather than
 * repeating the same floor on every one in a product. A workspace whose
 * navigation never goes below two hundred pixels says so here and nowhere else.
 *
 * None of the seven surveyed implementations has an equivalent: each takes its
 * limits per instance, so a product changing its floor changes every call site.
 *
 * A bar that states any of them itself still wins, because an explicit consumer
 * value always does.
 */
export function SplitterDefaultsProvider({ children, ...defaults }: SplitterDefaultsProviderProps) {
  const inherited = useSplitterDefaults();

  return (
    <SplitterDefaultsContext.Provider
      value={{
        collapsedValue: defaults.collapsedValue ?? inherited.collapsedValue,
        max: defaults.max ?? inherited.max,
        min: defaults.min ?? inherited.min,
        orientation: defaults.orientation ?? inherited.orientation,
      }}
    >
      {children}
    </SplitterDefaultsContext.Provider>
  );
}
