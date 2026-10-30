import { createContext, useContext } from 'react';

import type { ListItemDefaults, ListItemDefaultsProviderProps } from './list-item.types';

const FALLBACK: ListItemDefaults = {
  align: 'center',
  inset: false,
  size: 'md',
  tone: 'secondary',
  truncate: false,
};

const ListItemDefaultsContext = createContext<ListItemDefaults>(FALLBACK);

/** What a row renders as here, before the list or the row states anything. */
export function useListItemDefaults(): ListItemDefaults {
  return useContext(ListItemDefaultsContext);
}

/**
 * An application decides once how its rows are aligned, how far they are inset
 * and whether a title the row cannot grow for is clipped. A row that states any
 * of them itself still wins, and so does the list between the two.
 */
export function ListItemDefaultsProvider({ children, ...defaults }: ListItemDefaultsProviderProps) {
  const inherited = useListItemDefaults();

  return (
    <ListItemDefaultsContext.Provider
      value={{
        align: defaults.align ?? inherited.align,
        inset: defaults.inset ?? inherited.inset,
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        truncate: defaults.truncate ?? inherited.truncate,
      }}
    >
      {children}
    </ListItemDefaultsContext.Provider>
  );
}
