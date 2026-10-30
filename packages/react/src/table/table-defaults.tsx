import { createContext, useContext } from 'react';

import type { TableDefaults, TableDefaultsProviderProps } from './table.types';

const TableDefaultsContext = createContext<TableDefaults>({});

export function useTableDefaults(): TableDefaults {
  return useContext(TableDefaultsContext);
}

/**
 * An application decides once how its tables are framed and how they select. A
 * table that states any of it itself still wins: an explicit prop is never
 * overridden by context. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function TableDefaultsProvider({ children, ...defaults }: TableDefaultsProviderProps) {
  const inherited = useTableDefaults();

  return (
    <TableDefaultsContext.Provider
      value={{
        cellAlign: defaults.cellAlign ?? inherited.cellAlign,
        columns: defaults.columns ?? inherited.columns,
        edges: defaults.edges ?? inherited.edges,
        layout: defaults.layout ?? inherited.layout,
        selectionMode: defaults.selectionMode ?? inherited.selectionMode,
        stickyFooter: defaults.stickyFooter ?? inherited.stickyFooter,
        stickyHeader: defaults.stickyHeader ?? inherited.stickyHeader,
        stickyTo: defaults.stickyTo ?? inherited.stickyTo,
        striped: defaults.striped ?? inherited.striped,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TableDefaultsContext.Provider>
  );
}
