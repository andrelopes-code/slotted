import { createContext, useContext } from 'react';

import type { PageDefaults, PageDefaultsProviderProps } from './page.types';

const FALLBACK: PageDefaults = {
  ground: 'sunken',
  inset: 6,
  landmark: 'main',
  scroll: 'ancestor',
  width: 'wide',
};

const PageDefaultsContext = createContext<PageDefaults>(FALLBACK);

/** What a page renders as here, before it states anything of its own. */
export function usePageDefaults(): PageDefaults {
  return useContext(PageDefaultsContext);
}

/**
 * An application decides once how its pages are laid out — the measure, the
 * inset, who scrolls, the ground — rather than repeating the same props on
 * every route. A page that states any of them itself still wins. Its words
 * come from the language in force (`SlottedProvider`).
 */
export function PageDefaultsProvider({ children, ...defaults }: PageDefaultsProviderProps) {
  const inherited = usePageDefaults();

  return (
    <PageDefaultsContext.Provider
      value={{
        ground: defaults.ground ?? inherited.ground,
        inset: defaults.inset ?? inherited.inset,
        landmark: defaults.landmark ?? inherited.landmark,
        scroll: defaults.scroll ?? inherited.scroll,
        width: defaults.width ?? inherited.width,
      }}
    >
      {children}
    </PageDefaultsContext.Provider>
  );
}
