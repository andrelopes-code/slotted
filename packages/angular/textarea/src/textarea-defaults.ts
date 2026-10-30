import { inject, InjectionToken } from '@angular/core';

/** The type step the control sits at, matching the field around it. */
export type TextareaSize = 'sm' | 'md' | 'lg';

/** How much frame the control shows. The three `text-field` draws. */
export type TextareaVariant = 'outline' | 'subtle' | 'plain';

/**
 * Which way the manual handle may drag. `block` is the default rather than the
 * platform's `both`: a control wider than its field breaks the field's grid,
 * and a reader who widens one control in a form has broken its alignment.
 */
export type TextareaResize = 'block' | 'none' | 'both';

export interface TextareaDefaults {
  mono: boolean;
  resize: TextareaResize;
  size: TextareaSize;
  variant: TextareaVariant;
}

const FALLBACK: TextareaDefaults = {
  mono: false,
  resize: 'block',
  size: 'md',
  variant: 'outline',
};

export const TEXTAREA_DEFAULTS = new InjectionToken<TextareaDefaults>('slotted textarea defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once what its multi-line controls look like and
 * whether their handle drags, rather than repeating the same inputs on every
 * control. A control that states any of them itself still wins, and a control
 * inside a field takes the field's step over this token's.
 */
export function provideTextareaDefaults(defaults: Partial<TextareaDefaults>) {
  return {
    provide: TEXTAREA_DEFAULTS,
    useFactory: (): TextareaDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a textarea renders as here, before it states anything of its own. */
export function injectTextareaDefaults(): TextareaDefaults {
  return inject(TEXTAREA_DEFAULTS);
}
