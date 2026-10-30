import { inject, InjectionToken } from '@angular/core';

/** The type step the control sits at, matching the field around it. */
export type DateFieldSize = 'sm' | 'md' | 'lg';

/**
 * How much frame the control shows. The three steps `text-field` set, so a form
 * holding a name and a date shows one frame twice rather than two frames.
 */
export type DateFieldVariant = 'outline' | 'subtle' | 'plain';

/**
 * The calendar system the value is written in.
 *
 * One value today, and it is an axis rather than a silence: a second calendar
 * system is a second arithmetic, and declaring the axis now is what keeps its
 * arrival from being a contract break.
 */
export type DateFieldCalendar = 'gregory';

/**
 * Two typed digits up to twenty years ahead of this year are this century, and
 * anything above them is the last: `30` is 2030 and `80` is 1980 in 2026.
 *
 * A birth-date field sets it to `0`, and then only a year already past can be
 * typed in two digits. The number is stated rather than inferred because the
 * alternative is two bindings guessing, differently, at what `26` means.
 */
export const DATE_FIELD_YEAR_PIVOT = 20;

export interface DateFieldDefaults {
  calendar: DateFieldCalendar;
  /** `0` is Sunday. Unset means the locale decides. */
  firstDayOfWeek: number | undefined;
  size: DateFieldSize;
  /** Which zone answers "what is today". Unset means the runtime's own. */
  timeZone: string | undefined;
  variant: DateFieldVariant;
  yearPivot: number;
}

const FALLBACK: DateFieldDefaults = {
  calendar: 'gregory',
  firstDayOfWeek: undefined,
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
  yearPivot: DATE_FIELD_YEAR_PIVOT,
};

export const DATE_FIELD_DEFAULTS = new InjectionToken<DateFieldDefaults>(
  'slotted date field defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its dates look like, which zone answers
 * "today" and how a two-digit year resolves, rather than repeating the same
 * inputs on every control in a form. A control that states any of them itself
 * still wins. The locale that writes the dates, and the clear button's name,
 * come from the language in force (`provideSlotted`).
 */
export function provideDateFieldDefaults(defaults: Partial<DateFieldDefaults>) {
  return {
    provide: DATE_FIELD_DEFAULTS,
    useFactory: (): DateFieldDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a date field renders as here, before it states anything of its own. */
export function injectDateFieldDefaults(): DateFieldDefaults {
  return inject(DATE_FIELD_DEFAULTS);
}
