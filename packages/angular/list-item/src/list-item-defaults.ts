import { inject, InjectionToken } from '@angular/core';

/** The five the theme carries. `secondary` is the library's neutral. */
export type ListItemTone = 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

/** The room the row gets. Density is the application's choice; this is not. */
export type ListItemSize = 'sm' | 'md' | 'lg';

/**
 * Where the leading visual and the trailing metadata sit against a row of more
 * than one line: on the middle of the block, or on the title's own line.
 */
export type ListItemAlign = 'center' | 'start';

/**
 * Where the end goes in a row narrower than 22rem. `auto` moves it under the
 * title; `beside` keeps it on the title's line, at the row's end, and the body
 * takes what is left.
 */
export type ListItemEndPlacement = 'auto' | 'beside';

/**
 * What the row is the current one *of*. ARIA 1.2 lists `aria-current` as
 * inherited by `listitem` and does not deprecate it, which makes this the one
 * selection-shaped state a static list may announce for itself.
 */
export type ListItemCurrent = boolean | 'page' | 'step' | 'location' | 'date' | 'time';

export interface ListItemDefaults {
  align: ListItemAlign;
  endPlacement: ListItemEndPlacement;
  inset: boolean;
  size: ListItemSize;
  tone: ListItemTone;
  truncate: boolean;
}

const FALLBACK: ListItemDefaults = {
  align: 'center',
  endPlacement: 'auto',
  inset: false,
  size: 'md',
  tone: 'secondary',
  truncate: false,
};

export const LIST_ITEM_DEFAULTS = new InjectionToken<ListItemDefaults>(
  'slotted list item defaults',
  { providedIn: 'root', factory: () => FALLBACK },
);

/**
 * An application decides once how its rows are aligned, how far they are inset
 * and whether a title the row cannot grow for is clipped. A row that states any
 * of them itself still wins, and so does the list between the two.
 */
export function provideListItemDefaults(defaults: Partial<ListItemDefaults>) {
  return {
    provide: LIST_ITEM_DEFAULTS,
    useFactory: (): ListItemDefaults => ({
      align: defaults.align ?? FALLBACK.align,
      endPlacement: defaults.endPlacement ?? FALLBACK.endPlacement,
      inset: defaults.inset ?? FALLBACK.inset,
      size: defaults.size ?? FALLBACK.size,
      tone: defaults.tone ?? FALLBACK.tone,
      truncate: defaults.truncate ?? FALLBACK.truncate,
    }),
  };
}

/** What a row renders as here, before the list or the row states anything. */
export function injectListItemDefaults(): ListItemDefaults {
  return inject(LIST_ITEM_DEFAULTS);
}
