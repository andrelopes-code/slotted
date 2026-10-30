import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';

import type {
  HighlightMatcher,
  HighlightMatchOptions,
  HighlightRange,
} from '@slotted/core/highlight';

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

export interface HighlightDefaultsProviderProps extends Partial<HighlightDefaults> {
  children?: ReactNode | undefined;
}

/**
 * What `render` receives: the family's own attributes over the native ones
 * every element shares, and the runs already rendered as children. `ref` is
 * not named because the element the consumer renders decides its own type.
 */
export interface HighlightRootProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  'data-disabled'?: '' | undefined;
  'data-part': 'root';
  'data-ui': 'highlight';
}

export interface HighlightProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children'>, HighlightMatchOptions {
  /**
   * The text, whole. It is the only content the family renders: nothing in it
   * is HTML, and a run is a slice of it.
   */
  text: string;
  /** One query or several. Empty and whitespace-only entries find nothing. */
  query?: string | readonly string[] | undefined;
  /**
   * Spans already found — by a server, by a fuzzy engine — in the text's own
   * code units. Wins over `query` and `matcher`; normalised like either.
   */
  ranges?: readonly HighlightRange[] | undefined;
  /** Replaces the default matcher. Loses to `ranges`. */
  matcher?: HighlightMatcher | undefined;
  /**
   * The match a find bar is standing on, counting matches only. It is stated,
   * never moved: the family has no keyboard. Out of range marks nothing.
   */
  current?: number | undefined;
  /**
   * Steps the marks down without claiming the row's semantics. The row above
   * already says it with `data-disabled`, and the sheet reads that too.
   */
  disabled?: boolean | undefined;
  /** Substitutes the root element; the `mark` inside it is fixed. */
  render?: ((props: HighlightRootProps) => ReactNode) | undefined;
}
