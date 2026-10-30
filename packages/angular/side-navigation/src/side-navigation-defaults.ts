import { inject, Injectable, InjectionToken } from '@angular/core';

/** The row height step. `md` reads the geometry `app-shell` publishes. */
export type SideNavigationSize = 'sm' | 'md' | 'lg';

/**
 * How the column reads the room it has. `auto` is compact below `compactAt`
 * pixels of its own width and labelled above; the other two force one.
 */
export type SideNavigationMode = 'auto' | 'expanded' | 'compact';

/**
 * Where a label that does not fit is cut. `end` is the stylesheet's ellipsis;
 * `middle` keeps the start and the tail, measured by the binding; `none` wraps.
 */
export type SideNavigationTruncate = 'end' | 'middle' | 'none';

/** Why the set of open groups moved. */
export type SideNavigationExpandedReason =
  'pointer' | 'keyboard' | 'select' | 'escape' | 'programmatic';

/** Why the flyout opened or closed. */
export type SideNavigationFlyoutReason =
  | 'pointer'
  | 'keyboard'
  | 'select'
  | 'escape'
  | 'outsidePress'
  | 'blur'
  | 'resize'
  | 'programmatic';

/** Why the current destination moved. */
export type SideNavigationValueReason = 'pointer' | 'keyboard' | 'programmatic';

export interface SideNavigationDefaults {
  autoExpand: boolean;
  compactAt: number;
  guides: boolean;
  landmark: boolean;
  mode: SideNavigationMode;
  multiple: boolean;
  size: SideNavigationSize;
  truncate: SideNavigationTruncate;
}

/** The contract's defaults, and the width the rail is read at. */
export const SIDE_NAVIGATION_FALLBACK: SideNavigationDefaults = {
  autoExpand: true,
  compactAt: 96,
  guides: true,
  landmark: true,
  mode: 'auto',
  multiple: true,
  size: 'md',
  truncate: 'end',
};

export const SIDE_NAVIGATION_DEFAULTS = new InjectionToken<SideNavigationDefaults>(
  'slotted side-navigation defaults',
  { providedIn: 'root', factory: () => SIDE_NAVIGATION_FALLBACK },
);

/**
 * An application decides once how its columns read — the rail's width, the
 * cut, whether groups open one at a time — rather than repeating it on every
 * navigation in a product. A column that states any of them itself still wins.
 * Its words come from the language in force (`provideSlotted`).
 */
export function provideSideNavigationDefaults(defaults: Partial<SideNavigationDefaults>) {
  return {
    provide: SIDE_NAVIGATION_DEFAULTS,
    useFactory: (): SideNavigationDefaults => ({ ...SIDE_NAVIGATION_FALLBACK, ...defaults }),
  };
}

/** What a column renders as here, before it states anything of its own. */
export function injectSideNavigationDefaults(): SideNavigationDefaults {
  return inject(SIDE_NAVIGATION_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlSideNavigationIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-side-navigation-${this.count}`;
  }
}
