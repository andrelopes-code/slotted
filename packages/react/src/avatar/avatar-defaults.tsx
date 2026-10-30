import { createContext, useContext } from 'react';

import type { AvatarDefaults, AvatarDefaultsProviderProps } from './avatar.types';

const FALLBACK: AvatarDefaults = {
  locale: undefined,
  shape: 'circle',
  size: 'md',
  tone: 'auto',
  variant: 'soft',
};

const AvatarDefaultsContext = createContext<AvatarDefaults>(FALLBACK);

/** What an avatar renders as here, before it states anything of its own. */
export function useAvatarDefaults(): AvatarDefaults {
  return useContext(AvatarDefaultsContext);
}

/**
 * An application decides once how its avatars are shaped, how large they are,
 * how they are painted and — the one that matters most — which locale cases
 * their initials, rather than repeating four props on every avatar. An avatar
 * that states any of them itself still wins: an explicit value is never
 * overridden by context.
 *
 * `AvatarGroup` provides through the same context rather than a channel of its
 * own, which is what keeps a member's explicit `size` winning over the group's.
 * Fluent and Atlassian both ship the React half of this; neither ships an
 * Angular one, and `provideAvatarDefaults` is the other half here.
 */
export function AvatarDefaultsProvider({ children, ...defaults }: AvatarDefaultsProviderProps) {
  const inherited = useAvatarDefaults();

  return (
    <AvatarDefaultsContext.Provider
      value={{
        locale: defaults.locale ?? inherited.locale,
        shape: defaults.shape ?? inherited.shape,
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </AvatarDefaultsContext.Provider>
  );
}
