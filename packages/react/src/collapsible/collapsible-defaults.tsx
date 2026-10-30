import { createContext, useContext } from 'react';

import type { CollapsibleDefaults, CollapsibleDefaultsProviderProps } from './collapsible.types';

const FALLBACK: CollapsibleDefaults = {
  indicator: 'chevron',
  level: 'none',
  mount: 'eager',
  size: 'md',
  togglePlacement: 'end',
  truncate: false,
  variant: 'plain',
};

const CollapsibleDefaultsContext = createContext<CollapsibleDefaults>(FALLBACK);

/** What a disclosure renders as here, before it states anything of its own. */
export function useCollapsibleDefaults(): CollapsibleDefaults {
  return useContext(CollapsibleDefaultsContext);
}

/**
 * An application decides once how its disclosures look, rather than repeating
 * the same seven props on every one in a product. A disclosure that states any
 * of them itself still wins, and so does the accordion between the two.
 */
export function CollapsibleDefaultsProvider({
  children,
  ...defaults
}: CollapsibleDefaultsProviderProps) {
  const inherited = useCollapsibleDefaults();

  return (
    <CollapsibleDefaultsContext.Provider
      value={{
        indicator: defaults.indicator ?? inherited.indicator,
        level: defaults.level ?? inherited.level,
        mount: defaults.mount ?? inherited.mount,
        size: defaults.size ?? inherited.size,
        togglePlacement: defaults.togglePlacement ?? inherited.togglePlacement,
        truncate: defaults.truncate ?? inherited.truncate,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </CollapsibleDefaultsContext.Provider>
  );
}
