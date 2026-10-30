import { DEFAULT_DATA_LIST_FIELDS } from '@slotted/core/data-list';
import { createContext, useContext } from 'react';

import type { DataListDefaults, DataListDefaultsProviderProps } from './data-list.types';

const FALLBACK: DataListDefaults = {
  variant: 'ruled',
  size: 'md',
  fields: DEFAULT_DATA_LIST_FIELDS,
  selectionMode: 'none',
  skeletonRows: 5,
  loadingDelay: 200,
  loadingMinDuration: 400,
};

const DataListDefaultsContext = createContext<DataListDefaults>(FALLBACK);

/** What a data list does here, before it states anything of its own. */
export function useDataListDefaults(): DataListDefaults {
  return useContext(DataListDefaultsContext);
}

/**
 * An application states the family's defaults once. A list that states its
 * own value still wins. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function DataListDefaultsProvider({ children, ...rest }: DataListDefaultsProviderProps) {
  const inherited = useDataListDefaults();
  const defined = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined),
  ) as Partial<DataListDefaults>;
  return (
    <DataListDefaultsContext.Provider value={{ ...inherited, ...defined }}>
      {children}
    </DataListDefaultsContext.Provider>
  );
}
