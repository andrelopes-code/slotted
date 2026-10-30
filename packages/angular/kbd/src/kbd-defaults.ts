import { inject, InjectionToken, isDevMode, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import type { KbdPlatform, KbdPlatformInput } from '@slotted/core/keys';
import { resolvePlatform } from '@slotted/core/keys';

export type { KbdPlatform, KbdPlatformInput } from '@slotted/core/keys';

/**
 * Four absolute heights — 16, 20, 24 and 28 pixels — and one that reads the text
 * around it. `inherit` is the step prose wants: an absolute cap inside a heading
 * is a stamp, and one in fine print is a slab.
 */
export type KbdSize = 'xs' | 'sm' | 'md' | 'lg' | 'inherit';

/**
 * `raised` is the only value that looks like a key. `outline` owns no ground,
 * so it carries over any surface. `soft` is the tinted chip. `plain` is the
 * menu-row form, and it takes the color of the text it sits in.
 */
export type KbdVariant = 'raised' | 'outline' | 'soft' | 'plain';

export interface KbdDefaults {
  /**
   * `auto` asks the runtime. State it instead where the page is rendered on a
   * server: nothing is detected then, and the first paint is already right.
   */
  platform: KbdPlatformInput;
  size: KbdSize;
  variant: KbdVariant;
  /** Between two simultaneous keys. A Mac joins with nothing whatever this says. */
  separator: string;
  /** Replaces what the eye sees, per key token: `{ ctrl: 'Strg' }`. */
  legends: Readonly<Record<string, string>> | undefined;
  /** Replaces what a reader hears, per key token: `{ ctrl: 'Steuerung' }`. */
  names: Readonly<Record<string, string>> | undefined;
}

const FALLBACK: KbdDefaults = {
  platform: 'auto',
  size: 'md',
  variant: 'raised',
  separator: '+',
  legends: undefined,
  names: undefined,
};

export const KBD_DEFAULTS = new InjectionToken<KbdDefaults>('slotted kbd defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once which platform its shortcuts are written for, how
 * its keys are painted, and which legends and names it writes in place of the
 * catalog's for particular keys. A key that states any of them itself still
 * wins: an explicit input is never overridden by the token. The words come from
 * the `keys` catalog of the language in force (`provideSlotted`).
 */
export function provideKbdDefaults(defaults: Partial<KbdDefaults>) {
  return {
    provide: KBD_DEFAULTS,
    useFactory: (): KbdDefaults => ({
      platform: defaults.platform ?? FALLBACK.platform,
      size: defaults.size ?? FALLBACK.size,
      variant: defaults.variant ?? FALLBACK.variant,
      separator: defaults.separator ?? FALLBACK.separator,
      legends: defaults.legends ?? FALLBACK.legends,
      names: defaults.names ?? FALLBACK.names,
    }),
  };
}

/** What a key renders as here, before it states anything of its own. */
export function injectKbdDefaults(): KbdDefaults {
  return inject(KBD_DEFAULTS);
}

/**
 * The reader's platform, resolved synchronously in the browser and never on the
 * server.
 *
 * The asymmetry with the React binding is deliberate and is the one worth
 * recording. React has `useSyncExternalStore`, which distinguishes a hydrating
 * render from a plain client one, so it can be right on the first paint of a
 * client-rendered page *and* free of hydration mismatches on a server-rendered
 * one. Angular exposes no equivalent, so the choice is between a flash on every
 * page and a mismatch on hydrated ones. This binding takes neither: it resolves
 * at once in the browser, which is right for the client-rendered application,
 * and an application that server-renders states `platform` through
 * `provideKbdDefaults` — at which point nothing is detected at all.
 *
 * A development-mode warning is what stops that requirement from being
 * discovered by a reader seeing `Ctrl` on their Mac.
 */
export function injectKbdPlatform(): (stated?: KbdPlatformInput) => KbdPlatform {
  const defaults = injectKbdDefaults();
  const browser = isPlatformBrowser(inject(PLATFORM_ID));

  if (!browser && defaults.platform === 'auto' && isDevMode()) {
    console.warn(
      '[slotted/kbd] The platform cannot be detected on the server, so every shortcut is ' +
        'rendered for `other`. Call provideKbdDefaults({ platform }) to state it.',
    );
  }

  return (stated?: KbdPlatformInput) => {
    const requested = stated ?? defaults.platform;
    if (requested !== 'auto') return requested;
    return browser ? resolvePlatform('auto') : 'other';
  };
}
