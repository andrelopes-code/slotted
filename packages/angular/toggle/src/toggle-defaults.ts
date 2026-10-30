import { inject, InjectionToken } from '@angular/core';

/** The type step the control sits at. */
export type ToggleSize = 'sm' | 'md' | 'lg';

/**
 * Whether the control is framed or bare. `ghost` is the toggle that sits
 * inside something already framed — a toolbar, a card header. There is no
 * tone axis: a mode is one colour when it is on, and an action that persists
 * in one of five tones is `SlToggleButton`.
 */
export type ToggleVariant = 'outline' | 'ghost' | 'chips';

export interface ToggleDefaults {
  size: ToggleSize;
  variant: ToggleVariant;
}

const FALLBACK: ToggleDefaults = {
  size: 'md',
  variant: 'outline',
};

export const TOGGLE_DEFAULTS = new InjectionToken<ToggleDefaults>('slotted toggle defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its toggles are drawn — a toolbar of ghost
 * modes, a form of framed ones — rather than repeating the two inputs on
 * every control. A toggle that states either itself still wins.
 */
export function provideToggleDefaults(defaults: Partial<ToggleDefaults>) {
  return {
    provide: TOGGLE_DEFAULTS,
    useFactory: (): ToggleDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a toggle renders as here, before it states anything of its own. */
export function injectToggleDefaults(): ToggleDefaults {
  return inject(TOGGLE_DEFAULTS);
}
