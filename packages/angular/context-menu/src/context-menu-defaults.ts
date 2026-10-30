import { inject, InjectionToken } from '@angular/core';

export interface ContextMenuDefaults {
  /** Whether a long press on touch and pen opens the menu. */
  longPress: boolean;
  /** How long the press is held before the menu opens, in milliseconds. */
  longPressDelay: number;
}

/**
 * A long press opens on touch and pen, after the delay `tooltip` already holds
 * as `touchDelay`. The surface's own defaults are the menu's, and
 * `provideMenuDefaults()` is where an application sets those; whether the
 * family is disabled is the menu's `disabled`, so there is no second copy.
 */
const FALLBACK: ContextMenuDefaults = {
  longPress: true,
  longPressDelay: 500,
};

export const CONTEXT_MENU_DEFAULTS = new InjectionToken<ContextMenuDefaults>(
  'slotted context-menu defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/** The decisions an application takes once, in its bootstrap. */
export function provideContextMenuDefaults(defaults: Partial<ContextMenuDefaults>) {
  return {
    provide: CONTEXT_MENU_DEFAULTS,
    useFactory: (): ContextMenuDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectContextMenuDefaults(): ContextMenuDefaults {
  return inject(CONTEXT_MENU_DEFAULTS);
}
