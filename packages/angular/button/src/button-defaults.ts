import { inject, InjectionToken } from '@angular/core';

import type { ButtonSize, ButtonTone, ButtonVariant } from './button.constants';

/**
 * What a button paints itself as here, before it states anything of its own.
 *
 * Every axis is optional, and that is the difference from a family with one
 * member. The four members disagree about their own defaults on purpose — a
 * primary action is accent and solid, an icon button is neutral and ghost — so
 * a token that filled every axis would flatten them into one appearance the
 * moment an application set a single value.
 */
export interface ButtonDefaults {
  /**
   * Absence is written explicitly rather than left to the optional marker.
   * Under `exactOptionalPropertyTypes` the two are not interchangeable, and an
   * unset axis has to be expressible by a value as well as by a missing key —
   * a provider that computes its defaults cannot omit a property.
   */
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

export const BUTTON_DEFAULTS_TOKEN = new InjectionToken<ButtonDefaults>('slotted button defaults', {
  providedIn: 'root',
  factory: (): ButtonDefaults => ({}),
});

/**
 * An application decides once how its actions are painted and how large they
 * are, rather than repeating three inputs on every button. A button that states
 * an axis itself still wins: an explicit input is never overridden by the
 * token.
 */
export function provideButtonDefaults(defaults: ButtonDefaults) {
  return { provide: BUTTON_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectButtonDefaults(): ButtonDefaults {
  return inject(BUTTON_DEFAULTS_TOKEN);
}
