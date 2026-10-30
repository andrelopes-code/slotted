import { inject, Injectable, InjectionToken } from '@angular/core';

/** The control step of a trigger and of a top-level link. */
export type NavigationMenuSize = 'sm' | 'md' | 'lg';

/** A row under which panels open, or a column beside which they open. */
export type NavigationMenuOrientation = 'horizontal' | 'vertical';

/** How many columns of links or groups a panel lays out. */
export type NavigationMenuColumns = 1 | 2 | 3;

/** Why the open section moved. */
export type NavigationMenuValueReason =
  'pointer' | 'keyboard' | 'escape' | 'outsidePress' | 'blur' | 'select' | 'programmatic';

export interface NavigationMenuDefaults {
  /** Draws the mark on the surface's edge that points at the open trigger. */
  arrow: boolean;
  /** Milliseconds a pointer leaving the root waits before the section closes. */
  closeDelay: number;
  /** A link inside a panel closes the panel when it is followed. */
  closeOnSelect: boolean;
  /** Milliseconds a pointer rests on a trigger before its section opens. */
  openDelay: number;
  size: NavigationMenuSize;
}

/** The contract's defaults. */
export const NAVIGATION_MENU_FALLBACK: NavigationMenuDefaults = {
  arrow: false,
  closeDelay: 300,
  closeOnSelect: true,
  openDelay: 200,
  size: 'md',
};

export const NAVIGATION_MENU_DEFAULTS = new InjectionToken<NavigationMenuDefaults>(
  'slotted navigation-menu defaults',
  { providedIn: 'root', factory: () => NAVIGATION_MENU_FALLBACK },
);

/**
 * An application decides once how its navigation menus behave — the hover
 * delays, whether following a link closes the panel, the size, the arrow —
 * rather than on every instance. An instance that states any of them still
 * wins. Its words come from the language in force (`provideSlotted`).
 */
export function provideNavigationMenuDefaults(defaults: Partial<NavigationMenuDefaults>) {
  return {
    provide: NAVIGATION_MENU_DEFAULTS,
    useFactory: (): NavigationMenuDefaults => ({ ...NAVIGATION_MENU_FALLBACK, ...defaults }),
  };
}

/** What a navigation menu renders as here, before it states anything of its own. */
export function injectNavigationMenuDefaults(): NavigationMenuDefaults {
  return inject(NAVIGATION_MENU_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlNavigationMenuIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-navigation-menu-${this.count}`;
  }
}
