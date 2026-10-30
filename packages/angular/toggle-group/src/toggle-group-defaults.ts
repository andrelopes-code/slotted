import { inject, InjectionToken } from '@angular/core';

/** The type step the group and every item inside it sit at. */
export type ToggleGroupSize = 'sm' | 'md' | 'lg';

/**
 * Whether the items are framed or bare. `ghost` is the bar that sits inside
 * something already framed — a toolbar, a card header. `chips` are separate
 * rounded items that wrap, the pressed one in the neutral tone's ink, and
 * never join. There is no tone axis:
 * "on" is one color across the system, and a bar that wants the whole palette
 * is `button-group` around toggle buttons.
 */
export type ToggleGroupVariant = 'outline' | 'ghost' | 'chips';

/** How the items flow. The arrows follow the same axis. */
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export interface ToggleGroupDefaults {
  attached: boolean;
  deselectable: boolean;
  loop: boolean;
  orientation: ToggleGroupOrientation;
  size: ToggleGroupSize;
  variant: ToggleGroupVariant;
}

const FALLBACK: ToggleGroupDefaults = {
  attached: true,
  deselectable: true,
  loop: true,
  orientation: 'horizontal',
  size: 'md',
  variant: 'outline',
};

export const TOGGLE_GROUP_DEFAULTS = new InjectionToken<ToggleGroupDefaults>(
  'slotted toggle group defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its toggle bars are drawn and how they
 * behave, rather than repeating the same inputs on every one of them. A group
 * that states any of them itself still wins.
 */
export function provideToggleGroupDefaults(defaults: Partial<ToggleGroupDefaults>) {
  return {
    provide: TOGGLE_GROUP_DEFAULTS,
    useFactory: (): ToggleGroupDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a toggle group renders as here, before it states anything of its own. */
export function injectToggleGroupDefaults(): ToggleGroupDefaults {
  return inject(TOGGLE_GROUP_DEFAULTS);
}
