import { inject, InjectionToken } from '@angular/core';

import type { HighlightMatchOptions } from '@slotted/core/highlight';

export type {
  HighlightMatcher,
  HighlightMatchOptions,
  HighlightRange,
  HighlightRun,
} from '@slotted/core/highlight';

export type HighlightOccurrences = NonNullable<HighlightMatchOptions['occurrences']>;
export type HighlightSensitivity = NonNullable<HighlightMatchOptions['sensitivity']>;

/** What an application sets once for every mark under it. */
export interface HighlightDefaults {
  /** BCP 47. `undefined` asks the runtime. */
  locale: string | undefined;
  /** `base`: `resume` finds `Resumé`, as `typeahead` and `createFilter` compare. */
  sensitivity: HighlightSensitivity;
  /** `all`: every place a query appears; `first`: one span per query. */
  occurrences: HighlightOccurrences;
}

const FALLBACK: HighlightDefaults = {
  locale: undefined,
  sensitivity: 'base',
  occurrences: 'all',
};

export const HIGHLIGHT_DEFAULTS = new InjectionToken<HighlightDefaults>(
  'slotted highlight defaults',
  {
    providedIn: 'root',
    factory: () => FALLBACK,
  },
);

/**
 * An application decides once which locale its marks compare in, how strict
 * the comparison is, and whether every occurrence is marked. A mark that
 * states any of them itself still wins: an explicit input is never overridden
 * by the token. A host — `combobox`, `select` — passes the locale its filter
 * used, which is the same rule from the other side.
 */
export function provideHighlightDefaults(defaults: Partial<HighlightDefaults>) {
  return {
    provide: HIGHLIGHT_DEFAULTS,
    useFactory: (): HighlightDefaults => ({
      locale: defaults.locale ?? FALLBACK.locale,
      sensitivity: defaults.sensitivity ?? FALLBACK.sensitivity,
      occurrences: defaults.occurrences ?? FALLBACK.occurrences,
    }),
  };
}

/** What a mark compares with here, before it states anything of its own. */
export function injectHighlightDefaults(): HighlightDefaults {
  return inject(HIGHLIGHT_DEFAULTS);
}
