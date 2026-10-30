import { createContext, useContext } from 'react';

import type { SkeletonDefaults, SkeletonDefaultsProviderProps } from './skeleton.types';

const SkeletonDefaultsContext = createContext<SkeletonDefaults>({});

export function useSkeletonDefaults(): SkeletonDefaults {
  return useContext(SkeletonDefaultsContext);
}

/**
 * An application decides once how its placeholders are animated, how long a
 * wait has to last before one appears, how long one is held once it has, and
 * what a screen reader hears when the content arrives. A region or a box that
 * states any of those still wins: an explicit prop is never overridden by
 * context. The words the family writes come from the language in force
 * (`SlottedProvider`).
 *
 * The timing belongs here more than anywhere else. It is a policy about
 * latency, and latency is a property of the application rather than of the
 * placeholder — the reference page recommends `delay={200} minDuration={400}`
 * set once, and the family ships both at zero because it cannot know.
 */
export function SkeletonDefaultsProvider({ children, ...defaults }: SkeletonDefaultsProviderProps) {
  const inherited = useSkeletonDefaults();

  return (
    <SkeletonDefaultsContext.Provider
      value={{
        animation: defaults.animation ?? inherited.animation,
        delay: defaults.delay ?? inherited.delay,
        lastLineSize: defaults.lastLineSize ?? inherited.lastLineSize,
        live: defaults.live ?? inherited.live,
        loadedLabel: defaults.loadedLabel ?? inherited.loadedLabel,
        minDuration: defaults.minDuration ?? inherited.minDuration,
      }}
    >
      {children}
    </SkeletonDefaultsContext.Provider>
  );
}
