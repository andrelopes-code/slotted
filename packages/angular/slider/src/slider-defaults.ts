import { inject, InjectionToken } from '@angular/core';

/** The type step the control sits at, matching the field around it. */
export type SliderSize = 'sm' | 'md' | 'lg';

/**
 * Which axis the scale runs along. A vertical slider's minimum is at the
 * bottom, which is where the browser's own vertical range input and every
 * surveyed implementation put it.
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * When the value stands on the thumb. `auto` shows it while the thumb is being
 * dragged or has the caret, `always` shows it at rest as well, and `none`
 * withdraws it — which is what a scale whose values are words needs.
 */
export type SliderValueLabel = 'auto' | 'always' | 'none';

/** Where the filled portion starts: an end of the scale, or a point on it. */
export type SliderOrigin = 'min' | 'max' | number;

/** A tick on the scale, with the label that may become the announced value. */
export interface SliderMark {
  value: number;
  label?: string | undefined;
}

export interface SliderDefaults {
  orientation: SliderOrientation;
  size: SliderSize;
  valueLabel: SliderValueLabel;
}

const FALLBACK: SliderDefaults = {
  orientation: 'horizontal',
  size: 'md',
  valueLabel: 'auto',
};

export const SLIDER_DEFAULTS = new InjectionToken<SliderDefaults>('slotted slider defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once what its sliders look like, rather than
 * repeating the same inputs on every scale. A slider that states any of them
 * itself still wins, and a slider inside a field takes the field's step before
 * this token's. The locale its values are written in comes from the language
 * in force (`provideSlotted`).
 */
export function provideSliderDefaults(defaults: Partial<SliderDefaults>) {
  return {
    provide: SLIDER_DEFAULTS,
    useFactory: (): SliderDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a slider renders as here, before it states anything of its own. */
export function injectSliderDefaults(): SliderDefaults {
  return inject(SLIDER_DEFAULTS);
}
