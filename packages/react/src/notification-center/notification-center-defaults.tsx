import { createContext, useContext } from 'react';

import type {
  NotificationCenterDefaults,
  NotificationCenterDefaultsProviderProps,
} from './notification-center.types';

const FALLBACK: NotificationCenterDefaults = {
  arrivals: 'hold',
  controls: 'both',
  growing: 'none',
  level: '2',
  size: 'md',
  timeFormat: 'relative',
};

const NotificationCenterDefaultsContext = createContext<NotificationCenterDefaults>(FALLBACK);

/** What a notification center renders as here, before it states anything of its own. */
export function useNotificationCenterDefaults(): NotificationCenterDefaults {
  return useContext(NotificationCenterDefaultsContext);
}

/**
 * An application decides once how its notifications read — the size, the
 * rank, how more loads, whether arrivals are held, how time is written, the
 * time zone — rather than repeating them on every screen. A center that states
 * any of them itself still wins. Its words and locale come from the language
 * in force (`SlottedProvider`).
 */
export function NotificationCenterDefaultsProvider({
  children,
  ...defaults
}: NotificationCenterDefaultsProviderProps) {
  const inherited = useNotificationCenterDefaults();

  return (
    <NotificationCenterDefaultsContext.Provider
      value={{
        arrivals: defaults.arrivals ?? inherited.arrivals,
        controls: defaults.controls ?? inherited.controls,
        growing: defaults.growing ?? inherited.growing,
        level: defaults.level ?? inherited.level,
        size: defaults.size ?? inherited.size,
        timeFormat: defaults.timeFormat ?? inherited.timeFormat,
        timeZone: defaults.timeZone ?? inherited.timeZone,
      }}
    >
      {children}
    </NotificationCenterDefaultsContext.Provider>
  );
}
