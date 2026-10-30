import { createContext, useContext } from 'react';

import type { ProseDefaults, ProseDefaultsProviderProps } from './prose.types';

/**
 * `lg` rather than the control step: the family exists for text a reader stays
 * with, and 0.875rem is the size a button label is set in. `normal` is the
 * documentation rhythm, which is the case a region of rendered Markdown is in
 * unless the application says otherwise.
 *
 * The scrolling region's name comes from the catalog rather than a required
 * prop because a renderer's component map cannot supply one per table.
 */
const FALLBACK: ProseDefaults = {
  flow: 'normal',
  size: 'lg',
};

const ProseDefaultsContext = createContext<ProseDefaults>(FALLBACK);

/** What a region is set in here, before it states anything of its own. */
export function useProseDefaults(): ProseDefaults {
  return useContext(ProseDefaultsContext);
}

/**
 * An application decides once how its rendered content reads — Typeset's
 * presets, as a typed value rather than as a class. A region that states any
 * of them itself still wins: an explicit prop is never overridden by context,
 * and nesting a provider narrows the decision for one part of the page.
 */
export function ProseDefaultsProvider({ children, ...defaults }: ProseDefaultsProviderProps) {
  const inherited = useProseDefaults();

  return (
    <ProseDefaultsContext.Provider
      value={{
        flow: defaults.flow ?? inherited.flow,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </ProseDefaultsContext.Provider>
  );
}
