/**
 * Which spans of a text a query found, and the runs a binding renders them as.
 *
 * The HTML Standard defines `mark` for the term searched for inside a result,
 * and four families render one — `combobox`, `select`, `multi-select` and
 * `command-palette` — each of them in two bindings. The boundary of a run was
 * decided in every one of those eight places before this module; it is decided
 * here, once, and the bindings only paint what it returns.
 *
 * The comparison is the reader's locale's, at `base` sensitivity, which is what
 * `typeahead` and `createFilter` compare at: `resume` finds `Resumé`, `ss`
 * finds `ß`. Chakra and Mantine match by a case-insensitive regex and find
 * neither; react-highlight-words hands the folding to the consumer. The same
 * scan that finds a match here is the one `createFilter` and `createRanker`
 * decide with, so an option that passes a filter shows the mark the filter
 * found.
 *
 * Nothing here touches the DOM or a framework.
 */

/** A span of the text, in its own code units: `[start, end)`. */
export type HighlightRange = readonly [start: number, end: number];

export interface HighlightRun {
  text: string;
  matched: boolean;
  /** Which match this is, counting matched runs only; `-1` on the others. */
  index: number;
}

export interface HighlightMatchOptions {
  /**
   * BCP 47. Undefined asks the runtime, which is what a component with no
   * locale provider does.
   */
  locale?: string | undefined;
  /**
   * `base` treats `a`, `á` and `A` as one letter, which is what a reader typing
   * `resume` into a list holding `Resumé` expects. `accent` keeps accents apart
   * and folds case; `case` the reverse; `variant` keeps both.
   */
  sensitivity?: 'base' | 'accent' | 'case' | 'variant' | undefined;
  /**
   * `all` marks every place a query appears, which is what Mantine and
   * react-highlight-words do and what Chakra does under `matchAll`. `first`
   * marks one span per query, for a host that reads the mark as "why this
   * option is here".
   */
  occurrences?: 'all' | 'first' | undefined;
}

/**
 * Finds the spans a consumer wants marked. It receives the queries already
 * trimmed of empties, so a matcher never has to ask whether there is anything
 * to look for, and what it returns goes through `normalizeRanges` like any
 * other set.
 */
export type HighlightMatcher = (
  text: string,
  queries: readonly string[],
) => readonly HighlightRange[];

export interface HighlightInput extends HighlightMatchOptions {
  /** One query or several. Empty and whitespace-only entries find nothing. */
  query?: string | readonly string[] | undefined;
  /** Spans already found — by a server, by a fuzzy engine. Wins over everything. */
  ranges?: readonly HighlightRange[] | undefined;
  /** Replaces the default matcher. Loses to `ranges`. */
  matcher?: HighlightMatcher | undefined;
}

/**
 * `Intl.Collator` compares two whole strings and cannot be asked whether one
 * appears inside the other, so a substring search is a scan of every window of
 * the query's length. Two strings can also differ in length and still be equal
 * to the collator — `ß` against `ss` at base sensitivity — so windows one
 * shorter and one longer are tried as well. The alternative, folding both
 * strings with `normalize('NFD')` and stripping combining marks, is an English
 * answer wearing a Unicode one: it turns `ø` into `ø` and leaves `ß` alone.
 *
 * `from` is where the scan starts, so a caller looking for every occurrence
 * resumes after the last one it found.
 */
export function findMatch(
  collator: Intl.Collator,
  text: string,
  query: string,
  anchored: boolean,
  from = 0,
): HighlightRange | null {
  const span = query.length;
  const last = anchored ? from : text.length - span;
  for (let start = from; start <= Math.max(last, from); start += 1) {
    for (const width of [span, span - 1, span + 1]) {
      if (width <= 0 || start + width > text.length) continue;
      if (collator.compare(text.slice(start, start + width), query) === 0) {
        return [start, start + width];
      }
    }
    if (anchored) break;
  }
  return null;
}

export function createCollator(options: HighlightMatchOptions = {}): Intl.Collator {
  return new Intl.Collator(options.locale, {
    sensitivity: options.sensitivity ?? 'base',
    usage: 'search',
  });
}

/** The queries worth looking for: trimmed, and with nothing left empty. */
export function queriesOf(query: string | readonly string[] | undefined): string[] {
  const list = query === undefined ? [] : typeof query === 'string' ? [query] : query;
  return list.map((entry) => entry.trim()).filter((entry) => entry !== '');
}

/**
 * The spans of `text` that `query` matched, in the text's own code units, so
 * a caller can mark them. Every occurrence by default; one per query under
 * `occurrences: 'first'`. The result is not yet normalized: two queries may
 * overlap, and `normalizeRanges` is where they become one run.
 */
export function matchRanges(
  text: string,
  query: string | readonly string[],
  options: HighlightMatchOptions = {},
): HighlightRange[] {
  const queries = queriesOf(query);
  if (queries.length === 0 || text === '') return [];
  const collator = createCollator(options);
  const found: HighlightRange[] = [];
  for (const entry of queries) {
    let from = 0;
    while (from <= text.length) {
      const range = findMatch(collator, text, entry, false, from);
      if (range === null) break;
      found.push(range);
      if (options.occurrences === 'first') break;
      /* A zero-width match cannot happen — a window is at least one unit — so
         the scan always moves. */
      from = range[1];
    }
  }
  return found;
}

/**
 * One segmenter, built on first use. Its segmentation does not vary by
 * locale, and building one per call was measurable in `identity` with a
 * hundred avatars on one page.
 */
let segmenter: Intl.Segmenter | null | undefined;

function graphemeBoundaries(text: string): Set<number> | null {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null;
  }
  const boundaries = new Set<number>([0, text.length]);
  if (segmenter === null) {
    /* Code-point aware, which keeps a surrogate pair whole; a combining mark
       still separates, and that is the most a runtime without a segmenter can
       be asked for. */
    let index = 0;
    for (const point of text) {
      index += point.length;
      boundaries.add(index);
    }
    return boundaries;
  }
  for (const segment of segmenter.segment(text)) boundaries.add(segment.index);
  return boundaries;
}

/** Whether the text can hold a boundary inside a cluster at all. */
const MULTI_UNIT = /[^\u0020-\u007e]/;

/**
 * The set a binding can render: clipped to the text, ordered, merged where two
 * spans overlap or touch, emptied of zero-width spans, and widened so no span
 * starts or ends inside a grapheme cluster — a range cutting a surrogate pair
 * or a combining sequence would put half a character in a mark, and none of
 * the surveyed implementations guards it.
 *
 * A malformed range degrades to no mark rather than to an exception: an
 * inverted pair is turned round, a span past the end is clipped — so `Infinity`
 * reads as "to the end" — and one that is not a pair of numbers is dropped. A bookmark written by an older
 * version of an application, or a server that counted in bytes, should not
 * break the first paint.
 */
export function normalizeRanges(text: string, ranges: readonly HighlightRange[]): HighlightRange[] {
  const boundaries = MULTI_UNIT.test(text) ? graphemeBoundaries(text) : null;
  const snapStart = (index: number) => {
    if (boundaries === null) return index;
    let at = index;
    while (at > 0 && !boundaries.has(at)) at -= 1;
    return at;
  };
  const snapEnd = (index: number) => {
    if (boundaries === null) return index;
    let at = index;
    while (at < text.length && !boundaries.has(at)) at += 1;
    return at;
  };

  const clipped: [number, number][] = [];
  for (const range of ranges) {
    if (!Array.isArray(range) || range.length !== 2) continue;
    const [a, b] = range;
    if (typeof a !== 'number' || typeof b !== 'number' || Number.isNaN(a) || Number.isNaN(b)) {
      continue;
    }
    const start = Math.max(0, Math.min(text.length, Math.floor(Math.min(a, b))));
    const end = Math.max(0, Math.min(text.length, Math.ceil(Math.max(a, b))));
    if (end <= start) continue;
    clipped.push([snapStart(start), snapEnd(end)]);
  }
  clipped.sort((left, right) => left[0] - right[0] || left[1] - right[1]);

  const merged: [number, number][] = [];
  for (const [start, end] of clipped) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/**
 * The text split into the runs a binding renders: the ones to mark and the
 * ones not to, in order, with no empty run between them. Expects a normalized
 * set; hand it `normalizeRanges` first, or use `highlightRuns`.
 */
export function splitRanges(text: string, ranges: readonly HighlightRange[]): HighlightRun[] {
  const runs: HighlightRun[] = [];
  let cursor = 0;
  let index = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) runs.push({ text: text.slice(cursor, start), matched: false, index: -1 });
    runs.push({ text: text.slice(start, end), matched: true, index });
    index += 1;
    cursor = end;
  }
  if (cursor < text.length || runs.length === 0) {
    runs.push({ text: text.slice(cursor), matched: false, index: -1 });
  }
  return runs;
}

/**
 * The one call a binding makes. `ranges` wins over `matcher`, which wins over
 * the default matcher; every one of the three is normalized the same way, and
 * a text with nothing to mark comes back as a single unmarked run.
 */
export function highlightRuns(text: string, input: HighlightInput = {}): HighlightRun[] {
  let ranges: readonly HighlightRange[];
  if (input.ranges !== undefined) {
    ranges = input.ranges;
  } else {
    const queries = queriesOf(input.query);
    if (queries.length === 0 || text === '') {
      return [{ text, matched: false, index: -1 }];
    }
    ranges =
      input.matcher === undefined
        ? matchRanges(text, queries, input)
        : input.matcher(text, queries);
  }
  return splitRanges(text, normalizeRanges(text, ranges));
}
