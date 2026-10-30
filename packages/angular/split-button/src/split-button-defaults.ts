import { inject, InjectionToken } from '@angular/core';
import type { ButtonSize, ButtonTone, ButtonVariant } from '@slotted/angular/button';

/**
 * What a split button paints itself as here, before it states anything of
 * its own. Every axis is optional: an unset one falls through to `button`'s
 * own token, which is where an application that paints every action at once
 * already set it, and then to the contract's defaults.
 */
export interface SplitButtonDefaults {
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

export const SPLIT_BUTTON_DEFAULTS = new InjectionToken<SplitButtonDefaults>(
  'slotted split button defaults',
  { providedIn: 'root', factory: (): SplitButtonDefaults => ({}) },
);

/**
 * An application decides once how its split buttons are painted rather than
 * repeating three inputs on every one. A split button that states an axis
 * itself still wins.
 */
export function provideSplitButtonDefaults(defaults: SplitButtonDefaults) {
  return { provide: SPLIT_BUTTON_DEFAULTS, useValue: defaults };
}

export function injectSplitButtonDefaults(): SplitButtonDefaults {
  return inject(SPLIT_BUTTON_DEFAULTS);
}
