import { inject, InjectionToken } from '@angular/core';

/** Where the surface opens, before the positioner has read the room. */
export type DatePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export type DatePickerSize = 'sm' | 'md' | 'lg';
export type DatePickerVariant = 'outline' | 'subtle' | 'plain';
export type DatePickerCalendar = 'gregory';

export interface DatePickerDefaults {
  calendar: DatePickerCalendar;
  /** Whether the panel keeps a draft until Apply. Unset, only a run or a set does. */
  confirm: boolean | undefined;
  placement: DatePickerPlacement;
  size: DatePickerSize;
  timeZone: string | undefined;
  variant: DatePickerVariant;
}

const FALLBACK: DatePickerDefaults = {
  calendar: 'gregory',
  confirm: undefined,
  placement: 'bottom-start',
  size: 'md',
  timeZone: undefined,
  variant: 'outline',
};

export const DATE_PICKER_DEFAULTS = new InjectionToken<DatePickerDefaults>(
  'slotted date picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once which zone answers "today" and where its
 * surfaces open — rather than repeating the same inputs on every picker in a
 * form. The locale that writes its dates and the trigger's names come from the
 * language in force (`provideSlotted`).
 */
export function provideDatePickerDefaults(defaults: Partial<DatePickerDefaults>) {
  return {
    provide: DATE_PICKER_DEFAULTS,
    useFactory: (): DatePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a date picker renders as here, before it states anything of its own. */
export function injectDatePickerDefaults(): DatePickerDefaults {
  return inject(DATE_PICKER_DEFAULTS);
}
