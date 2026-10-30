import { createContext, useContext } from 'react';

import type { TagDefaults, TagDefaultsProviderProps } from './tag.types';

const FALLBACK: TagDefaults = {
  shape: 'pill',
  size: 'md',
  tone: 'secondary',
  variant: 'soft',
};

const TagDefaultsContext = createContext<TagDefaults>(FALLBACK);

/** What a tag renders as here, before it states anything of its own. */
export function useTagDefaults(): TagDefaults {
  return useContext(TagDefaultsContext);
}

/**
 * An application decides once how its tags are painted and how large they
 * are, rather than repeating four props on every chip in a filter bar. A tag
 * that states any of them itself still wins: an explicit prop is never
 * overridden by context. The remove control's word comes from the language in
 * force (`SlottedProvider`).
 *
 * Ant Design's `ConfigProvider` is the only surveyed implementation with an
 * equivalent, and it ships one binding.
 */
export function TagDefaultsProvider({ children, ...defaults }: TagDefaultsProviderProps) {
  const inherited = useTagDefaults();

  return (
    <TagDefaultsContext.Provider
      value={{
        shape: defaults.shape ?? inherited.shape,
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TagDefaultsContext.Provider>
  );
}
