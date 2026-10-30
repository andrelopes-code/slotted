import { inject, InjectionToken } from '@angular/core';

/** Whether the bar paints a ground and a rule of its own. */
export type ActionBarVariant = 'plain' | 'raised';

/** The step the bar's own inset, gap and separator sit at. */
export type ActionBarSize = 'sm' | 'md' | 'lg';

/** Where the run of actions sits in the room left after the status. */
export type ActionBarAlign = 'end' | 'start' | 'center';

/**
 * Where an action stands in the order of giving way.
 *
 * The five are adapted from `sap.m.OverflowToolbarPriority`, and they exist here
 * and not in `toolbar` because the two bars read in opposite directions. In a
 * bar of tools the first control is the most used, so giving way from the end
 * gives up the least used one. In a bar of actions the action that confirms is
 * at the **end** of the line, so giving way from the end would give up Save
 * first.
 *
 * - `pinned` never gives way.
 * - `high` gives way after `low` and `hide`, into the surface.
 * - `low` is the first rank to reach the surface, and the default for an action
 *   that declares a counterpart.
 * - `hide` gives way before every other rank and is **not** offered in the
 *   surface: a control that is not worth a row in a menu.
 * - `always` is never drawn in the bar; its counterpart is in the surface from
 *   the start.
 */
export type ActionBarPriority = 'pinned' | 'high' | 'low' | 'hide' | 'always';

export interface ActionBarDefaults {
  align: ActionBarAlign;
  size: ActionBarSize;
  sticky: boolean;
  variant: ActionBarVariant;
}

const FALLBACK: ActionBarDefaults = {
  align: 'end',
  size: 'md',
  sticky: false,
  variant: 'plain',
};

export const ACTION_BAR_DEFAULTS = new InjectionToken<ActionBarDefaults>(
  'slotted action bar defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its action bars are drawn — a product whose
 * bars are all raised, compact and stuck to the bottom of the page says so in
 * one place rather than on every bar. A bar that states any of them itself
 * still wins.
 */
export function provideActionBarDefaults(defaults: Partial<ActionBarDefaults>) {
  return {
    provide: ACTION_BAR_DEFAULTS,
    useFactory: (): ActionBarDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a bar renders as here, before it states anything of its own. */
export function injectActionBarDefaults(): ActionBarDefaults {
  return inject(ACTION_BAR_DEFAULTS);
}
