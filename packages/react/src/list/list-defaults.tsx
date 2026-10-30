import { createContext, useContext } from 'react';

import type { ListDefaults, ListDefaultsProviderProps } from './list.types';

const FALLBACK: ListDefaults = { inset: false, marker: 'none', size: 'md', variant: 'plain' };

const ListDefaultsContext = createContext<ListDefaults>(FALLBACK);

/** What a list renders as here, before it states anything of its own. */
export function useListDefaults(): ListDefaults {
  return useContext(ListDefaultsContext);
}

/**
 * An application decides once how its lists are told apart and how much room a
 * row gets, rather than repeating four props on every list in a product. A list
 * that states any of them itself still wins: an explicit value is never
 * overridden by context.
 */
export function ListDefaultsProvider({ children, ...defaults }: ListDefaultsProviderProps) {
  const inherited = useListDefaults();

  return (
    <ListDefaultsContext.Provider
      value={{
        inset: defaults.inset ?? inherited.inset,
        marker: defaults.marker ?? inherited.marker,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </ListDefaultsContext.Provider>
  );
}
