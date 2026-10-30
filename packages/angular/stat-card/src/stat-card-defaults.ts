import { inject, InjectionToken } from '@angular/core';

import type {
  StatCardFill,
  StatCardGoodWhen,
  StatCardLayout,
  StatCardSize,
} from './stat-card.constants';

/**
 * What every card in an application does before any of them states anything
 * of its own. `goodWhen` is here because a product usually has one answer —
 * a sales dashboard wants everything up, an operations one wants everything
 * down — and a card that disagrees says so.
 */
export interface StatCardDefaults {
  fill?: StatCardFill;
  formatOptions?: Intl.NumberFormatOptions;
  goodWhen?: StatCardGoodWhen;
  layout?: StatCardLayout;
  size?: StatCardSize;
}

export const STAT_CARD_DEFAULTS_TOKEN = new InjectionToken<StatCardDefaults>(
  'slotted stat-card defaults',
  { providedIn: 'root', factory: (): StatCardDefaults => ({}) },
);

/**
 * An explicit input is never overridden by the token. The words and the locale
 * come from the language in force (`provideSlotted`).
 */
export function provideStatCardDefaults(defaults: StatCardDefaults) {
  return { provide: STAT_CARD_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectStatCardDefaults(): StatCardDefaults {
  return inject(STAT_CARD_DEFAULTS_TOKEN);
}
