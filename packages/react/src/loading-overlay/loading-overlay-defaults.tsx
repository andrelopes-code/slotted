import { createContext, useContext } from 'react';

import type {
  LoadingOverlayDefaults,
  LoadingOverlayDefaultsProviderProps,
} from './loading-overlay.types';

const LoadingOverlayDefaultsContext = createContext<LoadingOverlayDefaults>({});

export function useLoadingOverlayDefaults(): LoadingOverlayDefaults {
  return useContext(LoadingOverlayDefaultsContext);
}

/**
 * An application decides once how its overlays obscure what they cover, how
 * long a wait has to last before one appears, how long one is held once it
 * has, and what a screen reader hears when a wait ends. An overlay that states
 * any of those still wins: an explicit prop is never overridden by context.
 * The words the family writes come from the language in force
 * (`SlottedProvider`).
 *
 * The timing belongs here more than anywhere else, for the reason `skeleton`
 * records: it is a policy about latency, and latency is a property of the
 * application rather than of one overlay. The family ships both durations at
 * zero because it cannot know them, so an application that sets neither pays
 * for no timer.
 */
export function LoadingOverlayDefaultsProvider({
  children,
  ...defaults
}: LoadingOverlayDefaultsProviderProps) {
  const inherited = useLoadingOverlayDefaults();

  return (
    <LoadingOverlayDefaultsContext.Provider
      value={{
        delay: defaults.delay ?? inherited.delay,
        live: defaults.live ?? inherited.live,
        loadedLabel: defaults.loadedLabel ?? inherited.loadedLabel,
        minDuration: defaults.minDuration ?? inherited.minDuration,
        size: defaults.size ?? inherited.size,
        veil: defaults.veil ?? inherited.veil,
      }}
    >
      {children}
    </LoadingOverlayDefaultsContext.Provider>
  );
}
