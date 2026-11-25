import { inject, InjectionToken } from '@angular/core';
import type { TimeGranularity } from '@slotted/core/date';
import type { TimeFieldHourCycle } from '@slotted/angular/time-field';

export type TimePickerSize = 'sm' | 'md' | 'lg';
export type TimePickerVariant = 'outline' | 'subtle' | 'plain';

/** Where the surface opens, before the positioner has read the room. */
export type TimePickerPlacement =
  'bottom-start' | 'bottom' | 'bottom-end' | 'top-start' | 'top' | 'top-end';

/**
 * A quarter of an hour, which is the slot a booking flow asks in and the step
 * every surveyed panel defaults to within a factor of two.
 */
export const TIME_PICKER_STEP = 900;

export interface TimePickerDefaults {
  /** Whether the panel keeps a draft until Apply. */
  confirm: boolean;
  granularity: TimeGranularity;
  hourCycle: TimeFieldHourCycle | undefined;
  placement: TimePickerPlacement;
  size: TimePickerSize;
  step: number;
  timeZone: string | undefined;
  variant: TimePickerVariant;
}

const FALLBACK: TimePickerDefaults = {
  confirm: true,
  granularity: 'minute',
  hourCycle: undefined,
  placement: 'bottom-start',
  size: 'md',
  step: TIME_PICKER_STEP,
  timeZone: undefined,
  variant: 'outline',
};

export const TIME_PICKER_DEFAULTS = new InjectionToken<TimePickerDefaults>(
  'slotted time picker defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what step its panels offer, rather than repeating
 * the same inputs on every picker in a product. A picker that states any of
 * them itself still wins. The locale and the words come from the language in
 * force (`provideSlotted`).
 *
 * `step` is the one worth setting first: a product books in twenty-minute slots
 * and a quarter-hour default puts a panel of the wrong times in front of every
 * reader.
 */
export function provideTimePickerDefaults(defaults: Partial<TimePickerDefaults>) {
  return {
    provide: TIME_PICKER_DEFAULTS,
    useFactory: (): TimePickerDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a time picker renders as here, before it states anything of its own. */
export function injectTimePickerDefaults(): TimePickerDefaults {
  return inject(TIME_PICKER_DEFAULTS);
}
