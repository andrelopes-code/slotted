import { inject, Injectable, InjectionToken } from '@angular/core';

/** The type step the title sits at. The snapped title takes the step below it. */
export type PageHeaderSize = 'sm' | 'md' | 'lg';

/** The rank of the heading. A page's own header is `1`. */
export type PageHeaderLevel = '1' | '2' | '3';

/**
 * What collapses the header area. `scroll` collapses it when it leaves the
 * scrollport and re-opens it when it returns; `manual` leaves it to the toggle,
 * the pin and the application, and the whole header stays while the page
 * scrolls.
 */
export type PageHeaderCollapse = 'scroll' | 'manual';

/**
 * The ground and the frame. `band` is a strip of the surface with a hairline
 * under it; `plain` paints no ground at rest and takes the surface back once
 * content passes under it; `floating` is a box of its own, rounded, that
 * slides to an inset below the scroller's edge once stuck.
 */
export type PageHeaderVariant = 'band' | 'plain' | 'floating';

/** Why the header area opened or closed. */
export type PageHeaderExpandedReason = 'pointer' | 'keyboard' | 'scroll' | 'programmatic';

/** Why the pin took hold or let go. */
export type PageHeaderPinnedReason = 'pointer' | 'keyboard' | 'programmatic';

export interface PageHeaderDefaults {
  collapse: PageHeaderCollapse;
  level: PageHeaderLevel;
  /** Stuck, the chrome is the theme's material: a translucent ground over a blurred backdrop. */
  material: boolean;
  size: PageHeaderSize;
  variant: PageHeaderVariant;
}

const FALLBACK: PageHeaderDefaults = {
  collapse: 'scroll',
  level: '1',
  material: false,
  size: 'md',
  variant: 'band',
};

export const PAGE_HEADER_DEFAULTS = new InjectionToken<PageHeaderDefaults>(
  'slotted page-header defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its page headers behave — the size, the
 * rank, whether a scroll collapses the area, whether the chrome is a material — rather than repeating them on
 * every screen. A header that states any of them itself still wins. Its words
 * come from the language in force (`provideSlotted`).
 */
export function providePageHeaderDefaults(defaults: Partial<PageHeaderDefaults>) {
  return {
    provide: PAGE_HEADER_DEFAULTS,
    useFactory: (): PageHeaderDefaults => ({ ...FALLBACK, ...defaults }),
  };
}

/** What a page header renders as here, before it states anything of its own. */
export function injectPageHeaderDefaults(): PageHeaderDefaults {
  return inject(PAGE_HEADER_DEFAULTS);
}

/**
 * Application-scoped rather than module-scoped, for the reason `field`
 * records: a module-level counter produces colliding sequences when two
 * applications render in one server process, and the server and the client
 * sequences must match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlPageHeaderIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-page-header-${this.count}`;
  }
}
