import { inject, InjectionToken } from '@angular/core';

/** The width of the content column: the container's own sizes. */
export type PageWidth = 'measure' | 'content' | 'wide' | 'full' | 'bleed';

/** The inset of the content column from the edge of the page: the container's own steps. */
export type PageInset = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Who scrolls. `ancestor` puts the page inside whatever scrolls and makes it
 * at least as tall as that, so the footer has a bottom to stick to. `self`
 * makes the page's own scroll part the scroller, with the footer below it.
 */
export type PageScroll = 'ancestor' | 'self';

/** The ground: the sunken canvas of an application, or the plain surface of a document. */
export type PageGround = 'sunken' | 'surface';

/** Whether the root is the document's `main` landmark. */
export type PageLandmark = 'main' | 'none';

export interface PageDefaults {
  ground: PageGround;
  inset: PageInset;
  landmark: PageLandmark;
  scroll: PageScroll;
  width: PageWidth;
}

const FALLBACK: PageDefaults = {
  ground: 'sunken',
  inset: 6,
  landmark: 'main',
  scroll: 'ancestor',
  width: 'wide',
};

export const PAGE_DEFAULTS = new InjectionToken<PageDefaults>('slotted page defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its pages are laid out — the measure, the
 * inset, who scrolls, the ground — rather than repeating the same inputs on
 * every route. A page that states any of them itself still wins. Its words
 * come from the language in force (`provideSlotted`).
 */
export function providePageDefaults(defaults: Partial<PageDefaults>) {
  return {
    provide: PAGE_DEFAULTS,
    useFactory: (): PageDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a page renders as here, before it states anything of its own. */
export function injectPageDefaults(): PageDefaults {
  return inject(PAGE_DEFAULTS);
}
