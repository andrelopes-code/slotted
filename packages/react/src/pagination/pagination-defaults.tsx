import { createContext, useContext } from 'react';

import type { PaginationDefaults, PaginationDefaultsProviderProps } from './pagination.types';

const PaginationDefaultsContext = createContext<PaginationDefaults>({});

export function usePaginationDefaults(): PaginationDefaults {
  return useContext(PaginationDefaultsContext);
}

/**
 * An application decides once how wide its rows of pages are, how many items a
 * page holds, and
 * whether a page change is announced. A paginator that states any of those
 * itself still wins: an explicit prop is never overridden by context. Its words
 * come from the language in force (`SlottedProvider`).
 */
export function PaginationDefaultsProvider({
  children,
  ...defaults
}: PaginationDefaultsProviderProps) {
  const inherited = usePaginationDefaults();

  return (
    <PaginationDefaultsContext.Provider
      value={{
        boundaryCount: defaults.boundaryCount ?? inherited.boundaryCount,
        defaultPageSize: defaults.defaultPageSize ?? inherited.defaultPageSize,
        live: defaults.live ?? inherited.live,
        pageSizeOptions: defaults.pageSizeOptions ?? inherited.pageSizeOptions,
        siblingCount: defaults.siblingCount ?? inherited.siblingCount,
      }}
    >
      {children}
    </PaginationDefaultsContext.Provider>
  );
}
