/**
 * Cutting a string in the middle so that its start and its end both survive.
 *
 * An end cut makes two names that differ only at the end one name:
 * `Monthly report · February` and `Monthly report · October` both become
 * `Monthly report…`. Keeping the tail is what keeps them apart, and it is what
 * a file browser does to a long file name. `side-navigation` is the first
 * family to hold the rule; a tab strip and a breadcrumb trail are the next.
 *
 * Nothing here measures. The caller says what fits — a canvas `measureText`
 * against the box's width, a probe element's `scrollWidth` — and this module
 * finds, by bisection, the longest head that fits beside the tail. Grapheme
 * clusters are the unit, so an emoji or a combining accent is never split.
 */

export interface MiddleTruncationOptions {
  /**
   * How many graphemes of the end to keep. The default keeps the last word
   * when it is short and the last six graphemes otherwise: a month, a number,
   * an extension, a city — the part of a name that tells it from its
   * neighbour is usually at the end and usually short.
   */
  keepTail?: number;
  /** The mark written where the middle was. */
  ellipsis?: string;
}

const ELLIPSIS = '…';
const TAIL_WORD_LIMIT = 12;
const TAIL_GRAPHEMES = 6;

/** The string as grapheme clusters, or code points where the segmenter is absent. */
export function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map((segment) => segment.segment);
  }
  return [...text];
}

/**
 * The tail worth keeping: the last word when it is short, and otherwise the
 * last `TAIL_GRAPHEMES` clusters. Trailing whitespace is never a tail.
 */
export function defaultTail(text: string): number {
  const trimmed = text.trimEnd();
  const lastSpace = Math.max(trimmed.lastIndexOf(' '), trimmed.lastIndexOf(' '));
  const lastWord = lastSpace === -1 ? trimmed : trimmed.slice(lastSpace + 1);
  const clusters = graphemes(lastWord).length;
  return clusters > 0 && clusters <= TAIL_WORD_LIMIT ? clusters : TAIL_GRAPHEMES;
}

/**
 * `text` when it fits, and otherwise the longest `head…tail` that does.
 *
 * `fits` is called with each candidate; a caller that measures in a canvas
 * pays one `measureText` per call, and the bisection asks for about
 * `log2(length)` of them. When even the ellipsis and the tail do not fit, the
 * tail is given up one cluster at a time; when nothing at all fits, the
 * ellipsis alone is returned, because an empty label is a row with no name.
 */
export function truncateMiddle(
  text: string,
  fits: (candidate: string) => boolean,
  options: MiddleTruncationOptions = {},
): string {
  if (fits(text)) return text;

  const ellipsis = options.ellipsis ?? ELLIPSIS;
  const clusters = graphemes(text);
  let tail = Math.min(options.keepTail ?? defaultTail(text), clusters.length);

  for (; tail >= 0; tail -= 1) {
    const end = clusters.slice(clusters.length - tail).join('');
    const headLimit = clusters.length - tail;
    let low = 0;
    let high = headLimit;
    /* The longest head, by bisection: `low` always fits, `high` may not. */
    if (!fits(clusters.slice(0, low).join('').trimEnd() + ellipsis + end)) continue;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const candidate = clusters.slice(0, middle).join('').trimEnd() + ellipsis + end;
      if (fits(candidate)) low = middle;
      else high = middle - 1;
    }
    return clusters.slice(0, low).join('').trimEnd() + ellipsis + end;
  }

  return ellipsis;
}
