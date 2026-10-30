import { inject, InjectionToken } from '@angular/core';

import type { SparklineCurve } from './sparkline.constants';

/**
 * What every sparkline in an application does before any of them states
 * anything of its own: how a number is read out, whether a line is smoothed,
 * washed and marked. Its words and locale come from the language in force
 * (`provideSlotted`).
 */
export interface SparklineDefaults {
  area?: boolean;
  curve?: SparklineCurve;
  formatOptions?: Intl.NumberFormatOptions;
  marker?: boolean;
}

export const SPARKLINE_DEFAULTS_TOKEN = new InjectionToken<SparklineDefaults>(
  'slotted sparkline defaults',
  { providedIn: 'root', factory: (): SparklineDefaults => ({}) },
);

/**
 * An application decides once how its sparklines are drawn and read out, and
 * every sparkline inherits it. A sparkline that states any of those still
 * wins: an explicit input is never overridden by the token.
 */
export function provideSparklineDefaults(defaults: SparklineDefaults) {
  return { provide: SPARKLINE_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectSparklineDefaults(): SparklineDefaults {
  return inject(SPARKLINE_DEFAULTS_TOKEN);
}
