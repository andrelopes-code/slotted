import { inject, InjectionToken } from '@angular/core';

import type {
  LoadingOverlayLive,
  LoadingOverlaySize,
  LoadingOverlayVeil,
} from './loading-overlay.constants';

/**
 * What every overlay in an application looks like, and how a wait is timed,
 * before any of them states anything of its own.
 *
 * The two durations are here rather than on an overlay because the policy is
 * an application's: a team decides once that a wait under two hundred
 * milliseconds is not worth reporting, and every region inherits it. The
 * family ships both at zero because it cannot know them, so an application
 * that sets neither pays for no timer.
 */
export interface LoadingOverlayDefaults {
  delay?: number;
  live?: LoadingOverlayLive;
  loadedLabel?: string;
  minDuration?: number;
  size?: LoadingOverlaySize;
  veil?: LoadingOverlayVeil;
}

export const LOADING_OVERLAY_DEFAULTS_TOKEN = new InjectionToken<LoadingOverlayDefaults>(
  'slotted loading overlay defaults',
  { providedIn: 'root', factory: (): LoadingOverlayDefaults => ({}) },
);

/**
 * An overlay that states any of these still wins: an explicit input is never
 * overridden by the token. The words the family writes come from the language
 * in force (`provideSlotted`).
 */
export function provideLoadingOverlayDefaults(defaults: LoadingOverlayDefaults) {
  return { provide: LOADING_OVERLAY_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectLoadingOverlayDefaults(): LoadingOverlayDefaults {
  return inject(LOADING_OVERLAY_DEFAULTS_TOKEN);
}
