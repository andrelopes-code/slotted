import { createContext, useContext } from 'react';

import type { ColumnManagerDefaults, ColumnManagerProviderProps } from './column-manager.types';

const FALLBACK: ColumnManagerDefaults = {
  presentation: 'popover',
  apply: 'live',
};

const ColumnManagerDefaultsContext = createContext<ColumnManagerDefaults>(FALLBACK);

/** What a column manager renders as here, before it states anything of its own. */
export function useColumnManagerDefaults(): ColumnManagerDefaults {
  return useContext(ColumnManagerDefaultsContext);
}

/**
 * An application decides once where its managers stand and whether they apply
 * at once. A manager that states either itself still wins. Its words come from
 * the language in force (`SlottedProvider`).
 */
export function ColumnManagerProvider({
  apply,
  children,
  presentation,
}: ColumnManagerProviderProps) {
  const inherited = useColumnManagerDefaults();
  return (
    <ColumnManagerDefaultsContext.Provider
      value={{
        apply: apply ?? inherited.apply,
        presentation: presentation ?? inherited.presentation,
      }}
    >
      {children}
    </ColumnManagerDefaultsContext.Provider>
  );
}
