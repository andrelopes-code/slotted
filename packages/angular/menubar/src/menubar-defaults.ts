import { inject, InjectionToken } from '@angular/core';
import type { MenuSize } from '@slotted/angular/menu';

export type MenubarOrientation = 'horizontal' | 'vertical';

export interface MenubarDefaults {
  disabled: boolean;
  loop: boolean;
  orientation: MenubarOrientation;
  size: MenuSize;
  typeahead: boolean;
}

/**
 * A bar is horizontal, wraps at its ends and answers typeahead — the three the
 * pattern describes. `size` is the one an application usually states, and it
 * reaches every menu the bar opens.
 */
const FALLBACK: MenubarDefaults = {
  disabled: false,
  loop: true,
  orientation: 'horizontal',
  size: 'md',
  typeahead: true,
};

export const MENUBAR_DEFAULTS = new InjectionToken<MenubarDefaults>('slotted menubar defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/** The decisions an application takes once, in its bootstrap. */
export function provideMenubarDefaults(defaults: Partial<MenubarDefaults>) {
  return {
    provide: MENUBAR_DEFAULTS,
    useFactory: (): MenubarDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectMenubarDefaults(): MenubarDefaults {
  return inject(MENUBAR_DEFAULTS);
}
