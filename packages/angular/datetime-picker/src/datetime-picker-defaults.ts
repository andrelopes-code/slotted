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

/**
 * When the panel closes on a press.
 *
 * `auto` is the family's own rule, and it is what lets the panel need no
 * confirm button: it closes on the press that **completed** the value and stays
 * open otherwise.
 */
export type DateTimePickerCloseOnSelect = 'auto' | 'always' | 'never';

/** Which surface focus lands on when the panel opens. */
export type DateTimePickerOpenTo = 'date' | 'time';

/** What a refused option does: stay and say so, or go. */
export type DateTimePickerUnavailableOptions = 'disable' | 'hide';

/**
 * A whole day at a one-minute step, which is the finest whole-day list any
 * surveyed implementation offers. A day at a one-second step is 86 400 rows and
 * is a configuration mistake rather than a list.
 */
export const DATE_TIME_PICKER_MAX_OPTIONS = 1440;

export interface DateTimePickerDefaults {
  calendar: 'gregory';
  closeOnSelect: DateTimePickerCloseOnSelect;
  granularity: TimeGranularity;
  hourCycle: DateTimePickerHourCycle | undefined;
  maxOptions: number;
  openTo: DateTimePickerOpenTo;
  placement: DateTimePickerPlacement;
  size: DateTimePickerSize;
  /** Seconds between two offered times. */
  step: number;
  timeZone: string | undefined;
  unavailableOptions: DateTimePickerUnavailableOptions;
  variant: DateTimePickerVariant;
}

const FALLBACK: DateTimePickerDefaults = {
  calendar: 'gregory',
  closeOnSelect: 'auto',
  granularity: 'minute',
  hourCycle: undefined,
  maxOptions: DATE_TIME_PICKER_MAX_OPTIONS,
  openTo: 'date',
  placement: 'bottom-start',
  size: 'md',
  step: 900,
  timeZone: undefined,
  unavailableOptions: 'disable',
  variant: 'outline',
};

export const DATE_TIME_PICKER_DEFAULTS = new InjectionToken<DateTimePickerDefaults>(
  'slotted datetime picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its datetime pickers behave — which clock
 * they run on, which step the list offers, which surface focus opens on —
 * rather than repeating the same inputs on every control in a form. A control
 * that states any of them itself still wins. The locale that writes them and
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
