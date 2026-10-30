import { createContext, useContext } from 'react';

import type { CascaderDefaults, CascaderDefaultsProviderProps } from './cascader.types';

export const CASCADER_FALLBACK: CascaderDefaults = {
  size: 'md',
  variant: 'outline',
  fullWidth: true,
  layout: 'auto',
  selectionMode: 'single',
  selectable: 'leaf',
  checkedStrategy: 'all',
  expandOn: 'press',
  closeOnSelect: true,
  search: false,
  clearable: true,
  portal: true,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: false,
  separator: '/',
  hoverDelay: 150,
  maxColumns: 3,
  maxCrumbs: 4,
};

const CascaderDefaultsContext = createContext<CascaderDefaults>(CASCADER_FALLBACK);

export function useCascaderDefaults(): CascaderDefaults {
  return useContext(CascaderDefaultsContext);
}

/**
 * Sets every axis once for a subtree. A cascader that states one itself still
 * wins. Its words come from the language in force (`SlottedProvider`).
 */
export function CascaderDefaultsProvider({
  children,
  ...overrides
}: CascaderDefaultsProviderProps) {
  const inherited = useCascaderDefaults();
  const value: CascaderDefaults = { ...inherited };
  for (const [key, given] of Object.entries(overrides)) {
    if (given !== undefined) (value as unknown as Record<string, unknown>)[key] = given;
  }
  return (
    <CascaderDefaultsContext.Provider value={value}>{children}</CascaderDefaultsContext.Provider>
  );
}
