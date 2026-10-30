import { createContext, useContext } from 'react';

import type {
  ProgressIndicatorDefaults,
  ProgressIndicatorDefaultsProviderProps,
} from './progress-indicator.types';

const ProgressIndicatorDefaultsContext = createContext<ProgressIndicatorDefaults>({});

export function useProgressIndicatorDefaults(): ProgressIndicatorDefaults {
  return useContext(ProgressIndicatorDefaultsContext);
}

/**
 * An application decides once how its indicators are sized and toned, how long
 * a wait has to last before one appears, how long one is held once it has, and
 * which language writes the digits. An indicator that states any of those still
 * wins: an explicit prop is never overridden by context.
 *
 * The timing belongs here more than anywhere else, for the reason `skeleton`
 * recorded about the same machine: it is a policy about latency, and latency is
 * a property of the application rather than of the bar. The reference page
 * recommends `delay={200} minDuration={400}` set once, and the family ships
 * both at zero because it cannot know.
 */
export function ProgressIndicatorDefaultsProvider({
  children,
  ...defaults
}: ProgressIndicatorDefaultsProviderProps) {
  const inherited = useProgressIndicatorDefaults();

  return (
    <ProgressIndicatorDefaultsContext.Provider
      value={{
        delay: defaults.delay ?? inherited.delay,
        label: defaults.label ?? inherited.label,
        locale: defaults.locale ?? inherited.locale,
        minDuration: defaults.minDuration ?? inherited.minDuration,
        size: defaults.size ?? inherited.size,
        tone: defaults.tone ?? inherited.tone,
      }}
    >
      {children}
    </ProgressIndicatorDefaultsContext.Provider>
  );
}
