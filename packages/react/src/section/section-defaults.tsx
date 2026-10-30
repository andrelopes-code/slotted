import { createContext, useContext } from 'react';

import type { SectionDefaults, SectionDefaultsProviderProps } from './section.types';

const FALLBACK: SectionDefaults = {
  divider: false,
  ground: 'none',
  size: 'md',
  sticky: false,
};

const SectionDefaultsContext = createContext<SectionDefaults>(FALLBACK);

/** What a section renders as here, before it states anything of its own. */
export function useSectionDefaults(): SectionDefaults {
  return useContext(SectionDefaultsContext);
}

/**
 * An application decides once how its sections separate — a rule, a surface,
 * the step of their headings — rather than repeating the same props on every
 * one. A section that states any of them itself still wins.
 */
export function SectionDefaultsProvider({ children, ...defaults }: SectionDefaultsProviderProps) {
  const inherited = useSectionDefaults();

  return (
    <SectionDefaultsContext.Provider
      value={{
        divider: defaults.divider ?? inherited.divider,
        ground: defaults.ground ?? inherited.ground,
        size: defaults.size ?? inherited.size,
        sticky: defaults.sticky ?? inherited.sticky,
      }}
    >
      {children}
    </SectionDefaultsContext.Provider>
  );
}
