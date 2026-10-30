import { createContext, useContext } from 'react';

import type { PageHeaderDefaults, PageHeaderDefaultsProviderProps } from './page-header.types';

const FALLBACK: PageHeaderDefaults = {
  collapse: 'scroll',
  level: '1',
  material: false,
  size: 'md',
  variant: 'band',
};

const PageHeaderDefaultsContext = createContext<PageHeaderDefaults>(FALLBACK);

/** What a page header renders as here, before it states anything of its own. */
export function usePageHeaderDefaults(): PageHeaderDefaults {
  return useContext(PageHeaderDefaultsContext);
}

/**
 * An application decides once how its page headers behave — the size, the
 * rank, whether a scroll collapses the area, whether the chrome is a material — rather than repeating them on
 * every screen. A header that states any of them itself still wins. Its words
 * come from the language in force (`SlottedProvider`).
 */
export function PageHeaderDefaultsProvider({
  children,
  ...defaults
}: PageHeaderDefaultsProviderProps) {
  const inherited = usePageHeaderDefaults();

  return (
    <PageHeaderDefaultsContext.Provider
      value={{
        collapse: defaults.collapse ?? inherited.collapse,
        level: defaults.level ?? inherited.level,
        material: defaults.material ?? inherited.material,
        size: defaults.size ?? inherited.size,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </PageHeaderDefaultsContext.Provider>
  );
}
