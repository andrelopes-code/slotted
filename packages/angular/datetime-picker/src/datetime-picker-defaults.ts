import { inject, InjectionToken } from '@angular/core';
import type { TimeGranularity } from '@slotted/core/date';

import type {
  DateTimeFieldHourCycle,
  DateTimeFieldSize,
  DateTimeFieldVariant,
} from '@slotted/angular/datetime-field';

export type DateTimePickerSize = DateTimeFieldSize;
export type DateTimePickerVariant = DateTimeFieldVariant;
export type DateTimePickerHourCycle = DateTimeFieldHourCycle;

/** Where the panel hangs from the control. */
export type DateTimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

export interface DateTimePickerDefaults {
  calendar: 'gregory';
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: DateTimePickerHourCycle | undefined;
  placement: DateTimePickerPlacement;
  size: DateTimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  variant: DateTimePickerVariant;
}

const FALLBACK: DateTimePickerDefaults = {
  calendar: 'gregory',
  confirm: true,
  granularity: 'minute',
  hourCycle: undefined,
  placement: 'bottom-start',
  size: 'md',
  step: 900,
  timeZone: undefined,
  variant: 'outline',
};

export const DATE_TIME_PICKER_DEFAULTS = new InjectionToken<DateTimePickerDefaults>(
  'slotted datetime picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its datetime pickers behave — which clock
 * they run on, which step they offer, whether the panel confirms — rather than
 * repeating the same inputs on every control in a form. A control that states
 * any of them itself still wins. The locale that writes them and
 * every word they say come from the language in force (`provideSlotted`).
 */
export function provideDateTimePickerDefaults(defaults: Partial<DateTimePickerDefaults>) {
  return {
    provide: DATE_TIME_PICKER_DEFAULTS,
    useFactory: (): DateTimePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a datetime picker renders as here, before it states anything itself. */
export function injectDateTimePickerDefaults(): DateTimePickerDefaults {
  return inject(DATE_TIME_PICKER_DEFAULTS);
}
