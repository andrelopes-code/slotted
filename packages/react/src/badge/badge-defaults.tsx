import { createContext, useContext } from 'react';

import type { BadgeDefaults, BadgeDefaultsProviderProps } from './badge.types';

const FALLBACK: BadgeDefaults = {
  locale: undefined,
  max: 99,
  shape: 'pill',
  size: 'md',
  tone: 'secondary',
  variant: 'soft',
};

const BadgeDefaultsContext = createContext<BadgeDefaults>(FALLBACK);

/** What a badge renders as here, before it states anything of its own. */
export function useBadgeDefaults(): BadgeDefaults {
  return useContext(BadgeDefaultsContext);
}

/**
 * An application decides once how its badges are painted, how large they are
 * and — the one that matters most — which locale writes their digits, rather
 * than repeating five props on every badge. A badge that states any of them
 * itself still wins: an explicit value is never overridden by context.
 *
 * Angular Material is the only surveyed implementation with the equivalent
 * (`MAT_BADGE_CONFIG`), and Ant Design's `ConfigProvider` is the only other
 * one; neither ships the second binding.
 */
export function BadgeDefaultsProvider({ children, ...defaults }: BadgeDefaultsProviderProps) {
  const inherited = useBadgeDefaults();

  return (
    <BadgeDefaultsContext.Provider
      value={{
        locale: defaults.locale ?? inherited.locale,
        max: defaults.max ?? inherited.max,
        shape: defaults.shape ?? inherited.shape,
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </BadgeDefaultsContext.Provider>
  );
}
