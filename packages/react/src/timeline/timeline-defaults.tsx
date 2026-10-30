import { createContext, useContext } from 'react';

import type { TimelineDefaults, TimelineDefaultsProviderProps } from './timeline.types';

const TimelineDefaultsContext = createContext<TimelineDefaults>({});

export function useTimelineDefaults(): TimelineDefaults {
  return useContext(TimelineDefaultsContext);
}

/**
 * An application decides once which way its timelines run, which side the
 * events take, how a timestamp is written and in which zone, the moment a
 * relative reading counts from. A timeline that states any of those itself
 * still wins: an explicit prop is never overridden by context. Its words and
 * locale come from the language in force (`SlottedProvider`).
 */
export function TimelineDefaultsProvider({ children, ...defaults }: TimelineDefaultsProviderProps) {
  const inherited = useTimelineDefaults();

  return (
    <TimelineDefaultsContext.Provider
      value={{
        growing: defaults.growing ?? inherited.growing,
        level: defaults.level ?? inherited.level,
        mode: defaults.mode ?? inherited.mode,
        now: defaults.now ?? inherited.now,
        order: defaults.order ?? inherited.order,
        orientation: defaults.orientation ?? inherited.orientation,
        placement: defaults.placement ?? inherited.placement,
        size: defaults.size ?? inherited.size,
        timeFormat: defaults.timeFormat ?? inherited.timeFormat,
        timeZone: defaults.timeZone ?? inherited.timeZone,
        tone: defaults.tone ?? inherited.tone,
        variant: defaults.variant ?? inherited.variant,
      }}
    >
      {children}
    </TimelineDefaultsContext.Provider>
  );
}
