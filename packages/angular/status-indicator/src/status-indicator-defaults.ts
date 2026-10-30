import { inject, InjectionToken } from '@angular/core';

import type {
  StatusIndicatorLive,
  StatusIndicatorMark,
  StatusIndicatorSize,
} from './status-indicator.constants';

/**
 * What every status in an application looks like before any one of them states
 * anything of its own. The six words come from the language in force
 * (`provideSlotted`).
 */
export interface StatusIndicatorDefaults {
  live?: StatusIndicatorLive;
  mark?: StatusIndicatorMark;
  size?: StatusIndicatorSize;
}

export const STATUS_INDICATOR_DEFAULTS_TOKEN = new InjectionToken<StatusIndicatorDefaults>(
  'slotted status indicator defaults',
  { providedIn: 'root', factory: (): StatusIndicatorDefaults => ({}) },
);

/**
 * An application decides once how its statuses are marked, how large they are
 * and whether they announce. An indicator that states any of those still wins:
 * an explicit input is never overridden by the token.
 */
export function provideStatusIndicatorDefaults(defaults: StatusIndicatorDefaults) {
  return { provide: STATUS_INDICATOR_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectStatusIndicatorDefaults(): StatusIndicatorDefaults {
  return inject(STATUS_INDICATOR_DEFAULTS_TOKEN);
}
