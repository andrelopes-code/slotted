import { inject, Injectable, InjectionToken } from '@angular/core';

/** Which of the five semantic colours the message speaks in. */
export type AlertTone = 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** How that colour is painted. `soft` is the tinted box an alert usually is. */
export type AlertVariant = 'soft' | 'outline' | 'solid';

/**
 * The scope the message applies to, which is the guide's three recipes as one
 * axis: an alert beside the thing it is about, a callout inside a section, a
 * banner across a page.
 */
export type AlertReach = 'inline' | 'section' | 'page';

/**
 * Whether the message announces itself, and how loudly. `off` is the default,
 * because the WAI-ARIA APG records that screen readers do not inform users of
 * alerts already present when the page finishes loading.
 */
export type AlertLive = 'off' | 'polite' | 'assertive';

/**
 * Where the actions stand: on a row under the words, or at the end of the
 * words' own row once the box is 40rem wide.
 */
export type AlertActionsPlacement = 'below' | 'end';

export interface AlertDefaults {
  live: AlertLive;
  reach: AlertReach;
  tone: AlertTone;
  variant: AlertVariant;
}

const FALLBACK: AlertDefaults = {
  live: 'off',
  reach: 'section',
  tone: 'accent',
  variant: 'soft',
};

export const ALERT_DEFAULTS = new InjectionToken<AlertDefaults>('slotted alert defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its messages are painted, at what reach and
 * how loud, rather than repeating the same inputs on every alert in a settings
 * page. An alert that states any of them itself still wins: an explicit input is
 * never overridden by the token. The dismiss control's name comes from the
 * language in force (`provideSlotted`).
 */
export function provideAlertDefaults(defaults: Partial<AlertDefaults>) {
  return {
    provide: ALERT_DEFAULTS,
    useFactory: (): AlertDefaults => ({
      live: defaults.live ?? FALLBACK.live,
      reach: defaults.reach ?? FALLBACK.reach,
      tone: defaults.tone ?? FALLBACK.tone,
      variant: defaults.variant ?? FALLBACK.variant,
    }),
  };
}

/** What an alert renders as here, before it states anything of its own. */
export function injectAlertDefaults(): AlertDefaults {
  return inject(ALERT_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `tag` records: a
 * module-level counter produces colliding sequences when two applications
 * render in one server process, and the server and the client sequences must
 * match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlAlertIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-alert-${this.count}`;
  }
}
