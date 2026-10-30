import { inject, InjectionToken } from '@angular/core';

export interface HoverCardDefaults {
  /** Milliseconds the pointer rests on the trigger before the card opens. */
  openDelay: number;
  /** Milliseconds after the pointer has left trigger and card before it closes. */
  closeDelay: number;
  /**
   * Whether the card holds controls a keyboard reader can reach. On, `Tab`
   * from the open trigger enters it, the panel is a `dialog` and the trigger
   * says so; off, the card is a `presentation` the link never announces.
   */
  navigable: boolean;
}

/**
 * 600 to open is the number `tooltip` holds and the one Base UI reached; 300
 * to close is Radix's and Base UI's. The card is not navigable until a
 * consumer says it holds controls. The panel's own defaults are the popover's,
 * and `providePopoverDefaults()` is where an application sets those.
 */
const FALLBACK: HoverCardDefaults = {
  closeDelay: 300,
  navigable: false,
  openDelay: 600,
};

export const HOVER_CARD_DEFAULTS = new InjectionToken<HoverCardDefaults>(
  'slotted hover-card defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/** The decisions an application takes once, in its bootstrap. */
export function provideHoverCardDefaults(defaults: Partial<HoverCardDefaults>) {
  return {
    provide: HOVER_CARD_DEFAULTS,
    useFactory: (): HoverCardDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectHoverCardDefaults(): HoverCardDefaults {
  return inject(HOVER_CARD_DEFAULTS);
}
