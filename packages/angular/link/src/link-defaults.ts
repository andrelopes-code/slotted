import { inject, InjectionToken } from '@angular/core';

import type { LinkUnderline, LinkVariant } from './link.constants';

/** What every link on the page looks like before it states anything of its own. */
export interface LinkDefaults {
  underline?: LinkUnderline;
  variant?: LinkVariant;
  visited?: boolean;
}

export const LINK_DEFAULTS_TOKEN = new InjectionToken<LinkDefaults>('slotted link defaults', {
  providedIn: 'root',
  factory: (): LinkDefaults => ({}),
});

/**
 * An application decides once whether its links are underlined, how they are
 * painted, and whether a followed destination is marked. A link that states
 * any of those itself still wins: an explicit input is never overridden by the
 * token. Its words come from the language in force (`provideSlotted`).
 */
export function provideLinkDefaults(defaults: LinkDefaults) {
  return { provide: LINK_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectLinkDefaults(): LinkDefaults {
  return inject(LINK_DEFAULTS_TOKEN);
}
