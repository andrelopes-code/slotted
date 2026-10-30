import { inject, Injectable, InjectionToken } from '@angular/core';

/**
 * What the region is reporting. Seven values rather than one component per
 * semantic, which is what the guide's section 17 asks of `empty-state` and
 * `error-state`.
 *
 * It is not a tone. Two pairs share one — `empty`, `no-results` and
 * `not-found` are all secondary, `forbidden` and `offline` are both warning —
 * so naming the axis `tone` would have made `forbidden` and `offline` one
 * value.
 */
export type ResultStateStatus =
  'empty' | 'no-results' | 'not-found' | 'error' | 'forbidden' | 'offline' | 'success';

/**
 * Which scope the message applies to, which is the axis `alert` already
 * speaks: a row inside a cell, a panel inside a card, the whole route. The
 * geometry follows from the scope; a size axis would say the same message can
 * be drawn large or small, which is not the choice a consumer is making.
 */
export type ResultStateReach = 'inline' | 'section' | 'page';

/** Whether the region reads centerd or from the inline edge. */
export type ResultStateAlign = 'center' | 'start';

/**
 * The picture the family draws around the page's glyph: a framed tile, three
 * layers leaning back, or a stack of cards, all in the neutral surface and
 * border roles. `none` draws nothing of the family's own, and `inline` reach
 * draws none of them.
 */
export type ResultStateIllustration = 'none' | 'tile' | 'stack' | 'cards';

/**
 * Whether the text announces itself, and how loudly. The default is `polite`,
 * where `alert`'s is `off`: WCAG 2.2's Understanding document for SC 4.1.3
 * names this family's own text as its example of a status message, and a
 * result state is by definition the outcome of an operation.
 */
export type ResultStateLive = 'off' | 'polite' | 'assertive';

export interface ResultStateDefaults {
  align: ResultStateAlign;
  illustration: ResultStateIllustration;
  live: ResultStateLive;
  reach: ResultStateReach;
  status: ResultStateStatus;
}

const FALLBACK: ResultStateDefaults = {
  align: 'center',
  illustration: 'none',
  live: 'polite',
  reach: 'section',
  status: 'empty',
};

export const RESULT_STATE_DEFAULTS = new InjectionToken<ResultStateDefaults>(
  'slotted result-state defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its empty and error regions are drawn, and
 * whether they announce, rather than repeating the inputs on every table in a
 * data-dense screen. A region that states any of them itself still wins: an
 * explicit input is never overridden by the token.
 */
export function provideResultStateDefaults(defaults: Partial<ResultStateDefaults>) {
  return {
    provide: RESULT_STATE_DEFAULTS,
    useFactory: (): ResultStateDefaults => ({
      align: defaults.align ?? FALLBACK.align,
      illustration: defaults.illustration ?? FALLBACK.illustration,
      live: defaults.live ?? FALLBACK.live,
      reach: defaults.reach ?? FALLBACK.reach,
      status: defaults.status ?? FALLBACK.status,
    }),
  };
}

/** What a result state renders as here, before it states anything of its own. */
export function injectResultStateDefaults(): ResultStateDefaults {
  return inject(RESULT_STATE_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `tag` and
 * `alert` both record: a module-level counter produces colliding sequences when
 * two applications render in one server process, and the server and the client
 * sequences have to match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlResultStateIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-result-state-${this.count}`;
  }
}
