import { describe, expect, it } from 'vitest';

import {
  createCollator,
  findMatch,
  highlightRuns,
  matchRanges,
  normalizeRanges,
  queriesOf,
  splitRanges,
} from './index';

describe('findMatch', () => {
  const collator = createCollator();

  it('finds the first window the collator equals, from where it is told', () => {
    expect(findMatch(collator, 'Ana Banana', 'an', false)).toEqual([0, 2]);
    expect(findMatch(collator, 'Ana Banana', 'an', false, 2)).toEqual([5, 7]);
    expect(findMatch(collator, 'Ana Banana', 'an', false, 8)).toBeNull();
  });

  it('anchors at the start when asked, and only there', () => {
    expect(findMatch(collator, 'Blueberry', 'blue', true)).toEqual([0, 4]);
    expect(findMatch(collator, 'Blueberry', 'berry', true)).toBeNull();
  });

  it('tries a window one unit narrower and one wider, for ß and ss', () => {
    expect(findMatch(collator, 'Straße', 'strasse', false)).toEqual([0, 6]);
    expect(findMatch(collator, 'Strasse', 'straße', false)).toEqual([0, 7]);
  });
});

describe('queriesOf', () => {
  it('trims, drops empties, and takes one string as one query', () => {
    expect(queriesOf('  berry ')).toEqual(['berry']);
    expect(queriesOf(['an', '', '   ', 'na'])).toEqual(['an', 'na']);
    expect(queriesOf(undefined)).toEqual([]);
  });
});

describe('matchRanges', () => {
  it('marks every occurrence by default', () => {
    expect(matchRanges('Ana Banana', 'an')).toEqual([
      [0, 2],
      [5, 7],
      [7, 9],
    ]);
  });

  it('marks one span per query under first', () => {
    expect(matchRanges('Ana Banana', 'an', { occurrences: 'first' })).toEqual([[0, 2]]);
    expect(matchRanges('Ana Banana', ['an', 'na'], { occurrences: 'first' })).toEqual([
      [0, 2],
      [1, 3],
    ]);
  });

  it('compares in the reader’s locale at base sensitivity', () => {
    expect(matchRanges('Resumé', 'resume')).toEqual([[0, 6]]);
    expect(matchRanges('résumé', 'RESUME', { sensitivity: 'accent' })).toEqual([]);
  });

  it('finds nothing for an empty or whitespace query, or an empty text', () => {
    expect(matchRanges('Blueberry', '')).toEqual([]);
    expect(matchRanges('Blueberry', '   ')).toEqual([]);
    expect(matchRanges('', 'berry')).toEqual([]);
  });

  it('treats a query as text, never as a pattern', () => {
    expect(matchRanges('C++ and a.b', 'c++')).toEqual([[0, 3]]);
    expect(matchRanges('C++ and a.b', 'a.b')).toEqual([[8, 11]]);
    expect(matchRanges('acb', 'a.b')).toEqual([]);
  });

  it('answers a long text with a short query in bounded time', () => {
    const text = 'x'.repeat(10_000);
    const started = performance.now();
    expect(matchRanges(text, 'x')).toHaveLength(10_000);
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe('normalizeRanges', () => {
  it('orders, merges overlapping and touching spans, and drops empty ones', () => {
    expect(
      normalizeRanges('Ana Banana', [
        [7, 9],
        [5, 7],
        [1, 3],
        [0, 2],
        [4, 4],
      ]),
    ).toEqual([
      [0, 3],
      [5, 9],
    ]);
  });

  it('turns an inverted span round and clips one past the text', () => {
    expect(normalizeRanges('Blueberry', [[9, 4]])).toEqual([[4, 9]]);
    expect(normalizeRanges('Blueberry', [[4, 40]])).toEqual([[4, 9]]);
    expect(normalizeRanges('Blueberry', [[-3, 4]])).toEqual([[0, 4]]);
  });

  it('drops a span that is not a pair of numbers, and reads Infinity as the end', () => {
    const hostile = [[Number.NaN, 4], [2], 'x', null, [1, Number.POSITIVE_INFINITY]] as unknown as [
      number,
      number,
    ][];
    expect(normalizeRanges('Blueberry', hostile)).toEqual([[1, 9]]);
  });

  it('widens a span to the grapheme it cuts', () => {
    /* A flag is two regional indicators, four code units; `è` here is `e` plus
       a combining grave, two code units. */
    const text = '🇧🇷 Crème';
    expect(normalizeRanges(text, [[1, 2]])).toEqual([[0, 4]]);
    expect(normalizeRanges(text, [[7, 8]])).toEqual([[7, 9]]);
    expect(normalizeRanges(text, [[8, 9]])).toEqual([[7, 9]]);
  });
});

describe('splitRanges', () => {
  it('yields the runs in order, numbering the matched ones', () => {
    expect(
      splitRanges('Ana Banana', [
        [0, 2],
        [5, 9],
      ]),
    ).toEqual([
      { text: 'An', matched: true, index: 0 },
      { text: 'a B', matched: false, index: -1 },
      { text: 'anan', matched: true, index: 1 },
      { text: 'a', matched: false, index: -1 },
    ]);
  });

  it('yields one unmarked run for no ranges, and no empty run for a whole match', () => {
    expect(splitRanges('Blueberry', [])).toEqual([
      { text: 'Blueberry', matched: false, index: -1 },
    ]);
    expect(splitRanges('Blueberry', [[0, 9]])).toEqual([
      { text: 'Blueberry', matched: true, index: 0 },
    ]);
  });
});

describe('highlightRuns', () => {
  it('takes ranges over a matcher over the default', () => {
    const matcher = () => [[0, 1]] as const;
    expect(highlightRuns('Blueberry', { query: 'berry', matcher, ranges: [[4, 5]] })).toEqual([
      { text: 'Blue', matched: false, index: -1 },
      { text: 'b', matched: true, index: 0 },
      { text: 'erry', matched: false, index: -1 },
    ]);
    expect(highlightRuns('Blueberry', { query: 'berry', matcher })).toEqual([
      { text: 'B', matched: true, index: 0 },
      { text: 'lueberry', matched: false, index: -1 },
    ]);
    expect(highlightRuns('Blueberry', { query: 'berry' })).toEqual([
      { text: 'Blue', matched: false, index: -1 },
      { text: 'berry', matched: true, index: 0 },
    ]);
  });

  it('hands the matcher only the queries worth looking for', () => {
    const seen: string[][] = [];
    highlightRuns('Blueberry', {
      query: ['', ' berry ', '  '],
      matcher: (_text, queries) => {
        seen.push([...queries]);
        return [];
      },
    });
    expect(seen).toEqual([['berry']]);
  });

  it('renders the text alone when nothing is asked for', () => {
    expect(highlightRuns('Blueberry')).toEqual([{ text: 'Blueberry', matched: false, index: -1 }]);
    expect(highlightRuns('Blueberry', { query: '  ' })).toEqual([
      { text: 'Blueberry', matched: false, index: -1 },
    ]);
    expect(highlightRuns('Blueberry', { ranges: [] })).toEqual([
      { text: 'Blueberry', matched: false, index: -1 },
    ]);
  });

  it('merges two queries that overlap into one run', () => {
    expect(highlightRuns('banana', { query: ['an', 'na'] })).toEqual([
      { text: 'b', matched: false, index: -1 },
      { text: 'anana', matched: true, index: 0 },
    ]);
  });
});
