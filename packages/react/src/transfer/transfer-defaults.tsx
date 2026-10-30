import { createContext, useContext } from 'react';

import type { TransferDefaults, TransferDefaultsProviderProps } from './transfer.types';

const FALLBACK: TransferDefaults = {
  size: 'md',
  layout: 'auto',
  searchable: true,
  selectAll: true,
  reorderable: false,
  rows: 8,
};

const TransferDefaultsContext = createContext<TransferDefaults>(FALLBACK);

/** What a transfer renders as here, before it states anything of its own. */
export function useTransferDefaults(): TransferDefaults {
  return useContext(TransferDefaultsContext);
}

/**
 * An application decides once how its transfers look. A transfer that states
 * any of it itself still wins, and a nested provider overrides only what it
 * names. The words come from the language in force (`SlottedProvider`).
 */
export function TransferDefaultsProvider({ children, ...rest }: TransferDefaultsProviderProps) {
  const inherited = useTransferDefaults();
  return (
    <TransferDefaultsContext.Provider
      value={{
        layout: rest.layout ?? inherited.layout,
        reorderable: rest.reorderable ?? inherited.reorderable,
        rows: rest.rows ?? inherited.rows,
        searchable: rest.searchable ?? inherited.searchable,
        selectAll: rest.selectAll ?? inherited.selectAll,
        size: rest.size ?? inherited.size,
      }}
    >
      {children}
    </TransferDefaultsContext.Provider>
  );
}
