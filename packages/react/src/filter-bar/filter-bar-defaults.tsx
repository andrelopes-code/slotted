import { createContext, useContext } from 'react';

import type { FilterBarDefaults, FilterBarDefaultsProviderProps } from './filter-bar.types';

const FilterBarDefaultsContext = createContext<FilterBarDefaults>({});

export function useFilterBarDefaults(): FilterBarDefaults {
  return useContext(FilterBarDefaultsContext);
}

/**
 * An application decides once how its bars apply, how long the query waits,
 * how many chips show, and which key reaches the search. A bar that states any
 * of those itself still wins. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function FilterBarDefaultsProvider({
  children,
  ...defaults
}: FilterBarDefaultsProviderProps) {
  const inherited = useFilterBarDefaults();

  return (
    <FilterBarDefaultsContext.Provider
      value={{
        apply: defaults.apply ?? inherited.apply,
        chipLimit: defaults.chipLimit ?? inherited.chipLimit,
        queryDelay: defaults.queryDelay ?? inherited.queryDelay,
        shortcut: defaults.shortcut === undefined ? inherited.shortcut : defaults.shortcut,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </FilterBarDefaultsContext.Provider>
  );
}
