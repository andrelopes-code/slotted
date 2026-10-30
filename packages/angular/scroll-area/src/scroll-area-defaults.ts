import { inject, InjectionToken } from '@angular/core';

/** Which axes scroll. Logical, so a vertical writing mode needs no second vocabulary. */
export type ScrollAreaAxis = 'block' | 'inline' | 'both';

/**
 * What the scrollbar does. `auto` is `overflow: auto`; `always` is
 * `overflow: scroll`; `hover` paints the bar transparent until a pointer or the
 * keyboard is inside; `none` removes the bar and leaves the scrolling.
 *
 * `scroll` — visible only while scrolling, which Radix and Mantine both ship —
 * is folded into `hover`, because it is what a platform overlay scrollbar
 * already does on its own.
 */
export type ScrollAreaScrollbars = 'auto' | 'always' | 'hover' | 'none';

/** `scrollbar-gutter`, and `stable` is the default because content that shifts is the defect. */
export type ScrollAreaGutter = 'auto' | 'stable' | 'both-edges';

/**
 * Where the veil is drawn. `both` dims what the reader has passed as well as
 * what is ahead; `end` only what is ahead; `none` leaves the scrollbar to say
 * there is more.
 */
export type ScrollAreaFade = 'both' | 'end' | 'none';

/** `overscroll-behavior`, and `contain` is the default. */
export type ScrollAreaOverscroll = 'contain' | 'auto' | 'none';

export interface ScrollAreaDefaults {
  axis: ScrollAreaAxis;
  scrollbars: ScrollAreaScrollbars;
  gutter: ScrollAreaGutter;
  fade: ScrollAreaFade;
  overscroll: ScrollAreaOverscroll;
}

const FALLBACK: ScrollAreaDefaults = {
  axis: 'block',
  fade: 'both',
  gutter: 'stable',
  overscroll: 'contain',
  scrollbars: 'auto',
};

export const SCROLL_AREA_DEFAULTS = new InjectionToken<ScrollAreaDefaults>(
  'slotted scroll-area defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once what its scroll areas look like — whether the
 * bar waits for a hand, whether the veil dims both ends — rather than repeating
 * it on fifty of them. A region's name comes from the language in force
 * (`provideSlotted`).
 *
 * None of the five surveyed implementations has an equivalent: each takes its
 * policy per instance, and Mantine's `type` in particular is written on every
 * call site of every product that uses it.
 */
export function provideScrollAreaDefaults(defaults: Partial<ScrollAreaDefaults>) {
  return {
    provide: SCROLL_AREA_DEFAULTS,
    useFactory: (): ScrollAreaDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a scroll area is here, before it states anything of its own. */
export function injectScrollAreaDefaults(): ScrollAreaDefaults {
  return inject(SCROLL_AREA_DEFAULTS);
}
