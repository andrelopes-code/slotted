import { inject, InjectionToken } from '@angular/core';

import type { SkeletonAnimation, SkeletonLive } from './skeleton.constants';

/**
 * What every placeholder in an application looks like, and how a load is
 * timed, before any of them states anything of its own. The two durations are
 * here rather than on a box because the policy is an application's: a team
 * decides once that a wait under two hundred milliseconds is not worth
 * reporting, and every region inherits it.
 */
export interface SkeletonDefaults {
  animation?: SkeletonAnimation;
  delay?: number;
  lastLineSize?: string;
  live?: SkeletonLive;
  loadedLabel?: string;
  minDuration?: number;
}

export const SKELETON_DEFAULTS_TOKEN = new InjectionToken<SkeletonDefaults>(
  'slotted skeleton defaults',
  { providedIn: 'root', factory: (): SkeletonDefaults => ({}) },
);

/**
 * An application decides once how its placeholders are animated, how long a
 * wait has to last before one appears, how long one is held once it has, and
 * what a screen reader hears when the content arrives. A region or a box that
 * states any of those still wins: an explicit input is never overridden by the
 * token. The words the family writes come from the language in force
 * (`provideSlotted`).
 */
export function provideSkeletonDefaults(defaults: SkeletonDefaults) {
  return { provide: SKELETON_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectSkeletonDefaults(): SkeletonDefaults {
  return inject(SKELETON_DEFAULTS_TOKEN);
}
