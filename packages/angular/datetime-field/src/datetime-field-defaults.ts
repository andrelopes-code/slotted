import { inject, InjectionToken } from '@angular/core';
import type { TimeGranularity } from '@slotted/core/date';

/** The type step the control sits at, matching the field around it. */
export type DateTimeFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a datetime shows one frame twice rather than two frames.
 */
export type DateTimeFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The question a consumer asks about the clock. Which variant of each — `h11`
 * or `h12`, `h23` or `h24` — is the locale's own, and `Intl` answers it.
 */
export type DateTimeFieldHourCycle = 12 | 24;

export interface DateTimeFieldDefaults {
  /** Only `gregory` today. The axis exists so a second calendar can arrive. */
  calendar: 'gregory';
  /** `0` is Sunday. Unset asks the locale. */
  firstDayOfWeek: number | undefined;
  /** How much of the time half is written. The date half is always whole. */
  granularity: TimeGranularity;
  /** Unset means the locale decides both the cycle and its variant. */
  hourCycle: DateTimeFieldHourCycle | undefined;
  /** Whether `+`, `-` and `=` open the duration expression. */
  relative: boolean;
  size: DateTimeFieldSize;
  /** Which zone answers "what is the time now". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: DateTimeFieldVariant;
  /** Two typed digits below this many years ahead are read as this century. */
  yearPivot: number | undefined;
}

const FALLBACK: DateTimeFieldDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  granularity: 'minute',
  hourCycle: undefined,
  relative: true,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
  yearPivot: undefined,
};

export const DATE_TIME_FIELD_DEFAULTS = new InjectionToken<DateTimeFieldDefaults>(
  'slotted datetime field defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its datetimes look like, which clock they
 * run on and which zone answers "now", rather than repeating the same inputs on
 * every control in a form. A control that states any of them itself still
 * wins. The locale that writes them, and the words the controls announce, come
 * from the language in force (`provideSlotted`).
 */
export function provideDateTimeFieldDefaults(defaults: Partial<DateTimeFieldDefaults>) {
  return {
    provide: DATE_TIME_FIELD_DEFAULTS,
    useFactory: (): DateTimeFieldDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a datetime field renders as here, before it states anything itself. */
export function injectDateTimeFieldDefaults(): DateTimeFieldDefaults {
  return inject(DATE_TIME_FIELD_DEFAULTS);
}
