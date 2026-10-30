import { describe, expect, it } from 'vitest';

import { createFilter, createRanker, matchRanges, splitByMatch } from './index';

describe('createFilter', () => {
  const filter = createFilter();

  it('matches a substring anywhere in the label', () => {
    expect(filter.contains('Blueberry', 'berry')).toBe(true);
    expect(filter.contains('Blueberry', 'cherry')).toBe(false);
  });

  it('anchors startsWith to the opening of the label', () => {
    expect(filter.startsWith('Blueberry', 'Blue')).toBe(true);
    expect(filter.startsWith('Blueberry', 'berry')).toBe(false);
  });

  /** §2.9: comparison is locale-sensitive, not an English fold. */
  it('reads an accent and a capital as the same letter at base sensitivity', () => {
    expect(filter.contains('Resumé', 'resume')).toBe(true);
    expect(filter.contains('ÅNGSTRÖM', 'angstrom')).toBe(true);
  });

  it('keeps them apart when asked to', () => {
    expect(createFilter({ sensitivity: 'variant' }).contains('Resumé', 'resume')).toBe(false);
  });

  it('treats an empty query as matching everything', () => {
    expect(filter.contains('Blueberry', '')).toBe(true);
    expect(filter.startsWith('Blueberry', '')).toBe(true);
  });

  it('compares two whole words for equality', () => {
    expect(filter.equals('Resumé', 'resume')).toBe(true);
    expect(filter.equals('Resumés', 'resume')).toBe(false);
  });
});

describe('matchRanges', () => {
  it('reports the span the filter matched, in the label’s own code units', () => {
    expect(matchRanges('Blueberry', 'berry')).toEqual([[4, 9]]);
  });

  it('reports the span an accented label matched', () => {
    expect(matchRanges('Resumé', 'resume')).toEqual([[0, 6]]);
  });

  it('reports nothing for an empty or blank query', () => {
    expect(matchRanges('Blueberry', '')).toEqual([]);
    expect(matchRanges('Blueberry', '   ')).toEqual([]);
  });

  it('reports nothing when the label does not match', () => {
    expect(matchRanges('Blueberry', 'cherry')).toEqual([]);
  });
});

describe('splitByMatch', () => {
  it('splits a label into the runs a caller marks', () => {
    expect(splitByMatch('Blueberry', 'berry')).toEqual([
      { text: 'Blue', matched: false },
      { text: 'berry', matched: true },
    ]);
  });

  it('opens with a matched run when the query is a prefix', () => {
    expect(splitByMatch('Blueberry', 'blue')).toEqual([
      { text: 'Blue', matched: true },
      { text: 'berry', matched: false },
    ]);
  });

  it('returns one unmatched run when nothing matched', () => {
    expect(splitByMatch('Blueberry', 'cherry')).toEqual([{ text: 'Blueberry', matched: false }]);
  });

  it('never emits an empty run', () => {
    for (const run of splitByMatch('Blueberry', 'Blueberry')) expect(run.text).not.toBe('');
  });
});

describe('createRanker', () => {
  const rank = createRanker();

  it('answers null when nothing in the label or the keywords holds the query', () => {
    expect(rank('deploy', 'Open settings', [])).toBeNull();
    expect(rank('deploy', 'Open settings', ['preferences'])).toBeNull();
  });

  it('scores a prefix of the label above the start of a later word', () => {
    expect(rank('set', 'Settings', [])).toBeGreaterThan(rank('set', 'Open settings', []) ?? 0);
  });

  it('scores the start of a word above a substring inside one', () => {
    expect(rank('set', 'Open settings', [])).toBeGreaterThan(rank('set', 'Reset', []) ?? 0);
  });

  it('scores a substring of the label above a keyword', () => {
    expect(rank('set', 'Reset', [])).toBeGreaterThan(rank('set', 'Preferences', ['settings']) ?? 0);
  });

  it('answers a keyword with the lowest score above nothing', () => {
    expect(rank('prefs', 'Settings', ['prefs', 'options'])).toBeGreaterThan(0);
  });

  /** §2.9: the comparison is the locale's, not an English fold. */
  it('reads an accent and a capital as the same letter', () => {
    expect(rank('resume', 'Résumé', [])).toBe(rank('Resume', 'Resume', []));
  });

  it('treats an empty query as a match of no particular strength', () => {
    expect(rank('', 'Anything', [])).toBe(0);
    expect(rank('   ', 'Anything', [])).toBe(0);
  });

  it('ranks a whole word above a prefix of a longer one', () => {
    expect(rank('go', 'Go', [])).toBeGreaterThan(rank('go', 'Google', []) ?? 0);
  });
});
