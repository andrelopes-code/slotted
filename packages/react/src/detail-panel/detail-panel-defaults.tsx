import { createContext, useContext } from 'react';

import type { DetailPanelDefaults, DetailPanelDefaultsProviderProps } from './detail-panel.types';

const FALLBACK: DetailPanelDefaults = {
  aside: 'end',
  layout: 'stacked',
  level: '2',
  mount: 'active',
  scroll: 'ancestor',
  size: 'md',
};

const DetailPanelDefaultsContext = createContext<DetailPanelDefaults>(FALLBACK);

/** What a detail panel renders as here, before it states anything of its own. */
export function useDetailPanelDefaults(): DetailPanelDefaults {
  return useContext(DetailPanelDefaultsContext);
}

/**
 * An application decides once how its records read — stacked or tabbed,
 * the aside's side, the rank, the size, who scrolls — rather than repeating
 * them on every screen. A panel that states any of them itself still wins.
 * Its words come from the language in force (`SlottedProvider`).
 */
export function DetailPanelDefaultsProvider({
  children,
  ...defaults
}: DetailPanelDefaultsProviderProps) {
  const inherited = useDetailPanelDefaults();

  return (
    <DetailPanelDefaultsContext.Provider
      value={{
        aside: defaults.aside ?? inherited.aside,
        layout: defaults.layout ?? inherited.layout,
        level: defaults.level ?? inherited.level,
        mount: defaults.mount ?? inherited.mount,
        scroll: defaults.scroll ?? inherited.scroll,
        size: defaults.size ?? inherited.size,
      }}
    >
      {children}
    </DetailPanelDefaultsContext.Provider>
  );
}
