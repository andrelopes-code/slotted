/**
 * Whether a label answers a query, compared the way the reader's locale
 * compares, and which spans of it did the answering.
 *
 * `docs/component-features.md` §2.9 asks that search, ordering and typeahead use
 * a locale-sensitive comparison, and §6 refuses a family that assumes `contains`
 * and English normalization. This module is the default a combobox filters with
 * and the adapter a consumer replaces; it is not the family's only answer.
 *
 * It is deliberately not `packages/core/src/typeahead`, which builds a collator
 * of its own for a different job: a typeahead matches a growing prefix against a
 * list, with a reset window and a cycle through repeated first characters. A
 * filter has neither, and merging the two would give each the other's state.
 *
 * Nothing here touches the DOM or a framework.
 */

import { findMatch, highlightRuns, matchRanges as allRanges } from '../highlight';
import type { HighlightRange } from '../highlight';

export interface FilterOptions {
  /**
   * BCP 47. Undefined asks the runtime, which is what a component with no
   * locale provider does.
   */
  locale?: string | undefined;
  /**
   * `base` treats `a`, `á` and `A` as one letter, which is what a reader typing
   * `resume` into a list holding `Resumé` expects. `accent` keeps accents apart
   * and folds case; `variant` keeps both.
   */
  sensitivity?: 'base' | 'accent' | 'case' | 'variant';
}

export interface Filter {
  /** Whether the query appears anywhere in the label. */
  contains: (label: string, query: string) => boolean;
  /** Whether the label opens with the query. */
  startsWith: (label: string, query: string) => boolean;
  /** Whether the two are the same word to this locale. */
  equals: (label: string, query: string) => boolean;
}

/**
 * The window scan lives in `../highlight` since wave 10, because the mark is
 * the consumer that exists without a collection — a paragraph under a find
 * bar — and the filter and the mark have to be decided by one scan: an option
 * that passes here shows the span found there.
 */
const scan = (collator: Intl.Collator, label: string, query: string, anchored: boolean) =>
  findMatch(collator, label, query, anchored);

export function createFilter({ locale, sensitivity = 'base' }: FilterOptions = {}): Filter {
  const collator = new Intl.Collator(locale, { sensitivity, usage: 'search' });

  return {
    contains: (label, query) => query === '' || scan(collator, label, query, false) !== null,
    startsWith: (label, query) => query === '' || scan(collator, label, query, true) !== null,
    equals: (label, query) => collator.compare(label, query) === 0,
  };
}

/**
 * The spans of `label` that `query` matched, in the label's own code units, so
 * a caller can mark them. Every occurrence since wave 10, which is what the
 * `highlight` family marks by default; a caller wanting one span per query
 * asks `@slotted/core/highlight` for `occurrences: 'first'`.
 *
 * The same collator finds them, which is the point: an `indexOf` beside a
 * locale-sensitive filter marks nothing on the row it just matched, and the
 * reader is left asking why an option with no visible match is in the list.
 */
export function matchRanges(
  label: string,
  query: string,
  options: FilterOptions = {},
): readonly HighlightRange[] {
  return allRanges(label, query, options);
}

/**
 * The label split into the runs a caller renders: the ones the query matched
 * and the ones it did not, in order, with no empty run between them. It is
 * `highlightRuns` from `@slotted/core/highlight` under the name the hosts
 * knew it by, kept so a consumer that imported it here still resolves.
 */
export function splitByMatch(
  label: string,
  query: string,
  options: FilterOptions = {},
): readonly { text: string; matched: boolean }[] {
  return highlightRuns(label, { ...options, query }).map(({ text, matched }) => ({
    text,
    matched,
  }));
}

/**
 * How well a label and its keywords answer a query, or `null` when they do not.
 *
 * A filter says yes or no; a command palette has to say which of thirty yeses
 * goes first, and `docs/component-features.md` §5 asks that the ranking be an
 * adapter with a default. The default is here rather than in the family for
 * the reason `createFilter` is: the comparison is the reader's locale's, made
 * by the same collator, so an item cannot pass the ranker and show no mark.
 *
 * Four strengths, strongest first — the whole label, a prefix of it, the start
 * of a word inside it, a run inside a word — and a keyword answers one step
 * below the weakest of those. A tie is the caller's to break, by the order the
 * consumer wrote the items in; the score never encodes that order. cmdk's
 * `command-score` and kbar's `match-sorter` both fold to ASCII first, which is
 * how `résumé` fails to answer `resume` in either.
 *
 * `packages/core/src/typeahead` is not this: it matches a growing prefix with
 * a reset window and a cycle, and it does not score.
 */
export type Ranker = (query: string, label: string, keywords: readonly string[]) => number | null;

export const RANK_EXACT = 5;
export const RANK_PREFIX = 4;
export const RANK_WORD = 3;
export const RANK_SUBSTRING = 2;
export const RANK_KEYWORD = 1;

const WORD_START = /[\p{Letter}\p{Number}]+/gu;

function strength(collator: Intl.Collator, text: string, query: string): number | null {
  if (collator.compare(text, query) === 0) return RANK_EXACT;
  const found = scan(collator, text, query, false);
  if (found === null) return null;
  if (found[0] === 0) return RANK_PREFIX;
  for (const word of text.matchAll(WORD_START)) {
    if (word.index === found[0]) return RANK_WORD;
  }
  return RANK_SUBSTRING;
}

export function createRanker({ locale, sensitivity = 'base' }: FilterOptions = {}): Ranker {
  const collator = new Intl.Collator(locale, { sensitivity, usage: 'search' });

  return (query, label, keywords) => {
    const trimmed = query.trim();
    if (trimmed === '') return 0;

    const own = strength(collator, label, trimmed);
    if (own !== null) return own;

    for (const keyword of keywords) {
      if (strength(collator, keyword, trimmed) !== null) return RANK_KEYWORD;
    }
    return null;
  };
}
