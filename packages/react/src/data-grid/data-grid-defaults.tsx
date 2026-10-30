import { createContext, useContext, useMemo } from 'react';

import type { DataGridDefaults, DataGridDefaultsProviderProps } from './data-grid.types';

const DataGridDefaultsContext = createContext<DataGridDefaults>({});

/**
 * An application states the family's defaults once; a grid that states its
 * own value still wins. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function DataGridDefaultsProvider({ children, ...defaults }: DataGridDefaultsProviderProps) {
  const parent = useContext(DataGridDefaultsContext);
  /* Rebuilt on every render of the provider, which is rare: a provider stands
     at the top of an application and its props do not move. */
  const merged: DataGridDefaults = { ...parent };
  for (const [key, entry] of Object.entries(defaults)) {
    if (entry !== undefined) (merged as Record<string, unknown>)[key] = entry;
  }
  const value = useMemo(() => merged, [JSON.stringify(merged)]);
  return (
    <DataGridDefaultsContext.Provider value={value}>{children}</DataGridDefaultsContext.Provider>
  );
}

export function useDataGridDefaults(): DataGridDefaults {
  return useContext(DataGridDefaultsContext);
}
