import { inject, InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';

import type { KbdPlatformInput, KbdSize, KbdVariant } from './kbd-defaults';

/**
 * What a combination hands to the keys inside it.
 *
 * Only what the combination was told is handed on: a key that states its own
 * size still wins, and a combination that states nothing hands on nothing, so
 * the provider's default is still what answers. Without this a page writing its
 * own keys inside a `Shortcut` would have to repeat four inputs on each of
 * them, and a key that forgot one would be painted differently from the
 * combination holding it.
 */
export interface SlShortcutAxesValue {
  platform: Signal<KbdPlatformInput | undefined>;
  size: Signal<KbdSize | undefined>;
  variant: Signal<KbdVariant | undefined>;
  disabled: Signal<boolean | undefined>;
}

const SHORTCUT_AXES = new InjectionToken<SlShortcutAxesValue>('slotted kbd shortcut axes');

/**
 * A namespace rather than a class, because there is nothing to instantiate: the
 * combination provides its own signals and a key reads them if it has a
 * combination to read.
 */
export const SlShortcutAxes = {
  token: SHORTCUT_AXES,
  injectOptional: (): SlShortcutAxesValue | null =>
    inject(SHORTCUT_AXES, { optional: true, skipSelf: false }),
} as const;
