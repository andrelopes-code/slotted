import { inject, InjectionToken } from '@angular/core';

import type { ProgressSize, ProgressTone } from './progress-indicator.constants';

/**
 * What every indicator in an application looks like, and how a wait is timed,
 * before any of them states anything of its own.
 *
 * The two durations are here rather than on an indicator because the policy is
 * an application's: a team decides once that a wait under two hundred
 * milliseconds is not worth reporting, and every bar inherits it. `locale` is
 * here for the same reason — the digits of a percentage belong to the
 * application's language, not to one upload.
 */
export interface ProgressIndicatorDefaults {
  delay?: number;
  label?: string;
  locale?: string;
  minDuration?: number;
  size?: ProgressSize;
  tone?: ProgressTone;
}

export const PROGRESS_INDICATOR_DEFAULTS_TOKEN = new InjectionToken<ProgressIndicatorDefaults>(
  'slotted progress indicator defaults',
  { providedIn: 'root', factory: (): ProgressIndicatorDefaults => ({}) },
);

/**
 * An application decides once how its indicators are sized and toned, how long
 * a wait has to last before one appears, how long one is held once it has, and
 * which language writes the digits. An indicator that states any of those still
 * wins: an explicit input is never overridden by the token.
 */
export function provideProgressIndicatorDefaults(defaults: ProgressIndicatorDefaults) {
  return { provide: PROGRESS_INDICATOR_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectProgressIndicatorDefaults(): ProgressIndicatorDefaults {
  return inject(PROGRESS_INDICATOR_DEFAULTS_TOKEN);
}
