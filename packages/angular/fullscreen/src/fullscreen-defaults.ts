import { inject, InjectionToken } from '@angular/core';
import type { FullscreenNavigationUI, FullscreenPolicy } from '@slotted/core/fullscreen';

export type FullscreenTriggerSize = 'sm' | 'md' | 'lg';

/** `ghost` inside a bar that is already framed; `outline` over content. */
export type FullscreenTriggerVariant = 'ghost' | 'outline';

export interface FullscreenDefaults {
  mode: FullscreenPolicy;
  navigationUI: FullscreenNavigationUI;
  size: FullscreenTriggerSize;
  variant: FullscreenTriggerVariant;
}

const FALLBACK: FullscreenDefaults = {
  mode: 'auto',
  navigationUI: 'auto',
  size: 'md',
  variant: 'ghost',
};

export const FULLSCREEN_DEFAULTS = new InjectionToken<FullscreenDefaults>(
  'slotted fullscreen defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once whether its regions ask the platform and how the
 * control is drawn; a region or a control that states any of them itself still
 * wins. The words come from the language in force (`provideSlotted`).
 */
export function provideFullscreenDefaults(defaults: Partial<FullscreenDefaults>) {
  return {
    provide: FULLSCREEN_DEFAULTS,
    useFactory: (): FullscreenDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

export function injectFullscreenDefaults(): FullscreenDefaults {
  return inject(FULLSCREEN_DEFAULTS);
}
