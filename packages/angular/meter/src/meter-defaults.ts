import { inject, InjectionToken } from '@angular/core';

import type { MeterSize } from './meter.constants';

/** What every meter in an application does before any of them states anything of its own. */
export interface MeterDefaults {
  /** How the share is read out as `aria-valuetext`. A percent with two fractional digits unless set. */
  formatOptions?: Intl.NumberFormatOptions;
  size?: MeterSize;
}

export const METER_DEFAULTS_TOKEN = new InjectionToken<MeterDefaults>('slotted meter defaults', {
  providedIn: 'root',
  factory: (): MeterDefaults => ({}),
});

/**
 * An application decides once how large its meters are and how a share is
 * read out. A meter that states either still wins: an explicit input is never
 * overridden by the token.
 */
export function provideMeterDefaults(defaults: MeterDefaults) {
  return { provide: METER_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectMeterDefaults(): MeterDefaults {
  return inject(METER_DEFAULTS_TOKEN);
}
