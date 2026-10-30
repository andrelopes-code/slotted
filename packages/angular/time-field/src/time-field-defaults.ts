import { inject, InjectionToken } from '@angular/core';
import type { TimeGranularity } from '@slotted/core/date';

/** The type step the control sits at, matching the field around it. */
export type TimeFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a time shows one frame twice rather than two frames.
 */
export type TimeFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The question a consumer asks about the clock. Which variant of each — `h11`
 * or `h12`, `h23` or `h24` — is the locale's own, and `Intl` answers it.
 */
export type TimeFieldHourCycle = 12 | 24;

export interface TimeFieldDefaults {
  granularity: TimeGranularity;
  /** Unset means the locale decides both the cycle and its variant. */
  hourCycle: TimeFieldHourCycle | undefined;
  /** Whether `+`, `-` and `=` open the duration expression. */
  relative: boolean;
  size: TimeFieldSize;
  /** Which zone answers "what time is it now". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: TimeFieldVariant;
}

const FALLBACK: TimeFieldDefaults = {
  granularity: 'minute',
  hourCycle: undefined,
  relative: true,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

export const TIME_FIELD_DEFAULTS = new InjectionToken<TimeFieldDefaults>(
  'slotted time field defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its times look like, which clock they run
 * on and which zone answers "now", rather than repeating the same inputs on
 * every control in a form. A control that states any of them itself still
 * wins. The locale that writes the times, and the words, come from the
 * language in force (`provideSlotted`).
 */
export function provideTimeFieldDefaults(defaults: Partial<TimeFieldDefaults>) {
  return {
    provide: TIME_FIELD_DEFAULTS,
    useFactory: (): TimeFieldDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a time field renders as here, before it states anything of its own. */
export function injectTimeFieldDefaults(): TimeFieldDefaults {
  return inject(TIME_FIELD_DEFAULTS);
}
