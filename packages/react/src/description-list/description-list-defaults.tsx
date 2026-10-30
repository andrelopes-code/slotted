import { createContext, useContext } from 'react';

import type {
  DescriptionListDefaults,
  DescriptionListDefaultsProviderProps,
} from './description-list.types';

const DescriptionListDefaultsContext = createContext<DescriptionListDefaults>({});

export function useDescriptionListDefaults(): DescriptionListDefaults {
  return useContext(DescriptionListDefaultsContext);
}

/**
 * An application decides once how its details panels are arranged. A list
 * that states any of it itself still wins: an explicit prop is never
 * overridden by context. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function DescriptionListDefaultsProvider({
  children,
  ...defaults
}: DescriptionListDefaultsProviderProps) {
  const inherited = useDescriptionListDefaults();

  return (
    <DescriptionListDefaultsContext.Provider
      value={{
        columns: defaults.columns ?? inherited.columns,
        layout: defaults.layout ?? inherited.layout,
        minColumnWidth: defaults.minColumnWidth ?? inherited.minColumnWidth,
        termWidth: defaults.termWidth ?? inherited.termWidth,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </DescriptionListDefaultsContext.Provider>
  );
}
