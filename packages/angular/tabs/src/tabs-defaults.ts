import { inject, Injectable, InjectionToken } from '@angular/core';

/** Whether moving focus to a tab also selects it. */
export type TabsActivation = 'automatic' | 'manual';

/** Which way the list runs. A horizontal list scrolls; a vertical one stacks. */
export type TabsOrientation = 'horizontal' | 'vertical';

/** The type step the list and its tabs sit at. */
export type TabsSize = 'sm' | 'md' | 'lg';

/**
 * How the list is drawn. `line` is a row of labels over a hairline; `contained`
 * is a sunken track holding a surface per tab. Both paint the same marker,
 * which is what survives the `high-contrast` scheme.
 */
export type TabsVariant = 'line' | 'contained';

/**
 * Whether the list draws the line its tabs stand on. `none` is for a list that
 * sits on a line the page already drew — a card header's edge, a table's own
 * rule — where two hairlines a pixel apart read as one smudge.
 */
export type TabsTrack = 'line' | 'none';

/** Whether each tab is as wide as its label or takes an equal share of the line. */
export type TabsFit = 'auto' | 'equal';

/**
 * When a panel exists. The names are Cloudscape's, which are the clearest three
 * words in the field for the same three behaviors.
 */
export type TabsMount = 'active' | 'lazy' | 'eager';

/** Which way the selection travelled, from the two indices. */
export type TabsActivationDirection = 'forward' | 'backward' | 'none';

export interface TabsDefaults {
  activation: TabsActivation;
  fit: TabsFit;
  track: TabsTrack;
  loop: boolean;
  mount: TabsMount;
  orientation: TabsOrientation;
  size: TabsSize;
  variant: TabsVariant;
}

const FALLBACK: TabsDefaults = {
  activation: 'automatic',
  fit: 'auto',
  loop: true,
  mount: 'active',
  orientation: 'horizontal',
  size: 'md',
  track: 'line',
  variant: 'line',
};

export const TABS_DEFAULTS = new InjectionToken<TabsDefaults>('slotted tabs defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its tabs look and behave, rather than
 * repeating the same seven inputs on every family in a product. A family that
 * states any of them itself still wins.
 */
export function provideTabsDefaults(defaults: Partial<TabsDefaults>) {
  return {
    provide: TABS_DEFAULTS,
    useFactory: (): TabsDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a tabs family renders as here, before it states anything of its own. */
export function injectTabsDefaults(): TabsDefaults {
  return inject(TABS_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field` records:
 * a module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlTabsIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tabs-${this.count}`;
  }
}
