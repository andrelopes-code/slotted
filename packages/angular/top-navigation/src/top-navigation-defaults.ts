import { inject, Injectable, InjectionToken } from '@angular/core';
import { COMPACT_BELOW } from '@slotted/core/measure';

/** The control height step of everything in the bar. */
export type TopNavigationSize = 'sm' | 'md' | 'lg';

/**
 * Which step of the bar's width folds an item into the panel: `low` folds
 * first, under 1024 pixels; `medium` under 600; `high` under 480.
 */
export type TopNavigationPriority = 'high' | 'medium' | 'low';

/** Why the panel opened or closed. */
export type TopNavigationMoreReason =
  'pointer' | 'keyboard' | 'select' | 'escape' | 'outsidePress' | 'resize' | 'programmatic';

/** Why the search opened or closed. */
export type TopNavigationSearchReason =
  'pointer' | 'keyboard' | 'escape' | 'blur' | 'resize' | 'programmatic';

/** Why the current destination moved. */
export type TopNavigationValueReason = 'pointer' | 'keyboard' | 'programmatic';

export interface TopNavigationDefaults {
  frame: boolean;
  landmark: boolean;
  size: TopNavigationSize;
}

/** The contract's defaults. */
export const TOP_NAVIGATION_FALLBACK: TopNavigationDefaults = {
  frame: true,
  landmark: true,
  size: 'md',
};

/**
 * The three steps of the bar's width, in CSS pixels, under which each
 * priority folds. The stylesheet reads the same three literals in its
 * container conditions; this is the copy the script reads. `medium` is the
 * compact size class's limit, where app-shell overlays its regions.
 */
export const TOP_NAVIGATION_COLLAPSE_AT: Readonly<Record<TopNavigationPriority, number>> = {
  high: 480,
  low: 1024,
  medium: COMPACT_BELOW,
};

export const TOP_NAVIGATION_DEFAULTS = new InjectionToken<TopNavigationDefaults>(
  'slotted top-navigation defaults',
  { providedIn: 'root', factory: () => TOP_NAVIGATION_FALLBACK },
);

/**
 * An application decides once how its bars read — the size, the frame —
 * rather than repeating it on every bar in a product. A bar that states any of
 * them itself still wins. Its words come from the language in force
 * (`provideSlotted`).
 */
export function provideTopNavigationDefaults(defaults: Partial<TopNavigationDefaults>) {
  return {
    provide: TOP_NAVIGATION_DEFAULTS,
    useFactory: (): TopNavigationDefaults => ({ ...TOP_NAVIGATION_FALLBACK, ...defaults }),
  };
}

/** What a bar renders as here, before it states anything of its own. */
export function injectTopNavigationDefaults(): TopNavigationDefaults {
  return inject(TOP_NAVIGATION_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTopNavigationIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-top-navigation-${this.count}`;
  }
}
