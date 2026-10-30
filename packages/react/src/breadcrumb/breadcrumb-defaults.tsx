import { createContext, useContext } from 'react';

import type { BreadcrumbDefaults, BreadcrumbDefaultsProviderProps } from './breadcrumb.types';

const BreadcrumbDefaultsContext = createContext<BreadcrumbDefaults>({});

export function useBreadcrumbDefaults(): BreadcrumbDefaults {
  return useContext(BreadcrumbDefaultsContext);
}

/**
 * An application decides once how deep its trails may get before they fold,
 * whether they fold for want of width, and what is drawn between two crumbs. A
 * trail that states any of those itself still wins: an explicit prop is never
 * overridden by context. Its words come from the language in force
 * (`SlottedProvider`).
 */
export function BreadcrumbDefaultsProvider({
  children,
  ...defaults
}: BreadcrumbDefaultsProviderProps) {
  const inherited = useBreadcrumbDefaults();

  return (
    <BreadcrumbDefaultsContext.Provider
      value={{
        itemsAfterCollapse: defaults.itemsAfterCollapse ?? inherited.itemsAfterCollapse,
        itemsBeforeCollapse: defaults.itemsBeforeCollapse ?? inherited.itemsBeforeCollapse,
        maxItems: defaults.maxItems ?? inherited.maxItems,
        overflow: defaults.overflow ?? inherited.overflow,
        separator: defaults.separator ?? inherited.separator,
      }}
    >
      {children}
    </BreadcrumbDefaultsContext.Provider>
  );
}
