import { describe, expect, it } from 'vitest';

import {
  boundSegment,
  clearSegment,
  commitTyping,
  createDateFormat,
  dateOf,
  EMPTY_SEGMENTS,
  isComplete,
  plainDate,
  segmentsOf,
  stepSegment,
  typeDigit,
} from './index';
import type { SegmentState } from './index';

const format = createDateFormat({ locale: 'pt-BR' });
const REFERENCE = plainDate(2026, 9, 9);

const type = (segments: SegmentState, field: 'year' | 'month' | 'day', digits: string) =>
  [...digits].reduce<SegmentState>(
    (state, digit) => typeDigit(state, field, Number(digit), format, REFERENCE).segments,
    segments,
  );

describe('a date being typed', () => {
  /**
   * The gap the inventory names: every surveyed segmented field holds a whole
   * date or nothing, so a day and a month with no year has no state of its own.
   */
  it('is not a value until every segment is filled', () => {
    let segments = type(EMPTY_SEGMENTS, 'day', '09');
    expect(dateOf(segments)).toBe(null);
    expect(isComplete(segments)).toBe(false);

    segments = type(segments, 'month', '09');
    expect(dateOf(segments)).toBe(null);

    segments = type(segments, 'year', '2026');
    expect(dateOf(segments)).toEqual(REFERENCE);
    expect(isComplete(segments)).toBe(true);
  });

  it('reads a date into segments and back out unchanged', () => {
    expect(dateOf(segmentsOf(REFERENCE))).toEqual(REFERENCE);
    expect(dateOf(segmentsOf(null))).toBe(null);
  });

  /**
   * `03` needs no wait and `30` is not a month, so the run ends as soon as no
   * further digit could fit under the maximum.
   */
  it('advances when the segment can hold no further digit', () => {
    expect(typeDigit(EMPTY_SEGMENTS, 'month', 3, format, REFERENCE).advance).toBe(true);
    expect(typeDigit(EMPTY_SEGMENTS, 'month', 1, format, REFERENCE).advance).toBe(false);

    const one = typeDigit(EMPTY_SEGMENTS, 'month', 1, format, REFERENCE);
    const twelve = typeDigit(one.segments, 'month', 2, format, REFERENCE);
    expect(twelve.segments.month).toBe(12);
    expect(twelve.advance).toBe(true);
  });

  it('starts a new run when the next digit would pass the maximum', () => {
    const one = typeDigit(EMPTY_SEGMENTS, 'month', 1, format, REFERENCE);
    const four = typeDigit(one.segments, 'month', 4, format, REFERENCE);
    expect(four.segments.month).toBe(4);
  });

  it('empties one segment without touching the others', () => {
    const whole = segmentsOf(REFERENCE);
    const cleared = clearSegment(whole, 'month');
    expect(cleared.month).toBe(null);
    expect(cleared.day).toBe(9);
    expect(dateOf(cleared)).toBe(null);
  });
});

describe('the two-digit year', () => {
  /**
   * `en-US` short format writes `9/9/26`, and a reader who types `26` means
   * 2026. The rule is stated rather than guessed: up to twenty years ahead is
   * this century, and everything above it is the last.
   */
  it('resolves through the pivot when the run ends short', () => {
    const short = type(segmentsOf(REFERENCE), 'year', '26');
    expect(short.year).toBe(26);
    expect(commitTyping(short, format).year).toBe(2026);

    const eighty = type(segmentsOf(REFERENCE), 'year', '80');
    expect(commitTyping(eighty, format).year).toBe(1980);
  });

  it('leaves a four-digit year exactly as typed', () => {
    const typed = type(segmentsOf(REFERENCE), 'year', '1848');
    expect(commitTyping(typed, format).year).toBe(1848);
  });

  /**
   * A birth-date field allows nothing ahead of this year. The current year
   * itself is not ahead of it, so `26` is still 2026 and only `27` moves back.
   */
  it('sends a two-digit year in the future into the past when the product says so', () => {
    const birth = createDateFormat({ locale: 'pt-BR', yearPivot: 0 });
    expect(commitTyping(type(segmentsOf(REFERENCE), 'year', '26'), birth).year).toBe(2026);
    expect(commitTyping(type(segmentsOf(REFERENCE), 'year', '27'), birth).year).toBe(1927);
  });
});

describe('stepping a segment', () => {
  it('wraps inside the segment and never carries into the next', () => {
    const december = { ...segmentsOf(plainDate(2026, 12, 9)) };
    const stepped = stepSegment(december, 'month', 1, REFERENCE);
    expect(stepped.month).toBe(1);
    expect(stepped.year).toBe(2026);

    const first = stepSegment(segmentsOf(plainDate(2026, 9, 1)), 'day', -1, REFERENCE);
    expect(first.day).toBe(30);
  });

  it('does not wrap the year, because there is no year after the last', () => {
    const stepped = stepSegment(segmentsOf(plainDate(9999, 9, 9)), 'year', 1, REFERENCE);
    expect(stepped.year).toBe(9999);
  });

  it('starts an empty segment near the reference rather than at its minimum', () => {
    expect(stepSegment(EMPTY_SEGMENTS, 'year', 1, REFERENCE).year).toBe(2026);
    expect(stepSegment(EMPTY_SEGMENTS, 'month', -1, REFERENCE).month).toBe(9);
  });

  it('goes to the ends of the segment', () => {
    const whole = segmentsOf(REFERENCE);
    expect(boundSegment(whole, 'day', 'min', REFERENCE).day).toBe(1);
    expect(boundSegment(whole, 'day', 'max', REFERENCE).day).toBe(30);
    expect(boundSegment(whole, 'month', 'max', REFERENCE).month).toBe(12);
  });

  /**
   * The behavior no surveyed implementation has. Everywhere else the 31 is
   * gone the moment February takes it, so stepping forward again lands on the
   * 28th of March.
   */
  it('gives back the day the month could not hold', () => {
    let segments = segmentsOf(plainDate(2026, 1, 31));
    segments = stepSegment(segments, 'month', 1, REFERENCE);
    expect(dateOf(segments)).toEqual(plainDate(2026, 2, 28));

    segments = stepSegment(segments, 'month', 1, REFERENCE);
    expect(dateOf(segments)).toEqual(plainDate(2026, 3, 31));
  });

  /**
   * A month halfway through being typed is not a month. Clamping the day
   * against the first digit of `03` asked for the length of month zero and got
   * a nought, so a day the reader had already finished became `00` and then
   * came back on the next keystroke — a real browser showed it and a jsdom
   * spec did not.
   */
  it('leaves a finished day alone while a month is being typed', () => {
    let segments = segmentsOf(plainDate(2026, 9, 15));

    segments = typeDigit(segments, 'month', 0, format, REFERENCE).segments;
    expect(segments.day).toBe(15);
    expect(segments.month).toBe(0);

    segments = typeDigit(segments, 'month', 3, format, REFERENCE).segments;
    expect(dateOf(segments)).toEqual(plainDate(2026, 3, 15));
  });

  it('clamps the day when the typed month turns out to be a short one', () => {
    let segments = segmentsOf(plainDate(2026, 1, 31));

    segments = typeDigit(segments, 'month', 0, format, REFERENCE).segments;
    segments = typeDigit(segments, 'month', 2, format, REFERENCE).segments;
    expect(dateOf(segments)).toEqual(plainDate(2026, 2, 28));

    /* And the day the reader asked for comes back in a month that holds it. */
    segments = typeDigit(segments, 'month', 0, format, REFERENCE).segments;
    segments = typeDigit(segments, 'month', 3, format, REFERENCE).segments;
    expect(dateOf(segments)).toEqual(plainDate(2026, 3, 31));
  });

  /**
   * The other end of the same rule. A month cannot leave a run open and be
   * short — `2` can only be February and ends its run at once — so the case
   * that reaches `commitTyping` is a year: 29 February typed into a year that
   * turns out not to be a leap one.
   */
  it('clamps the day when a run ends by leaving the field', () => {
    let segments = segmentsOf(plainDate(2024, 2, 29));

    segments = type(segments, 'year', '202');
    expect(segments.typing).not.toBe(null);
    expect(segments.day).toBe(29);

    segments = commitTyping(segments, format, REFERENCE);
    expect(dateOf(segments)).toEqual(plainDate(202, 2, 28));
  });

  it('forgets the held day once the reader states one', () => {
    let segments = segmentsOf(plainDate(2026, 1, 31));
    segments = stepSegment(segments, 'month', 1, REFERENCE);
    segments = type(segments, 'day', '05');
    segments = stepSegment(segments, 'month', 1, REFERENCE);
    expect(dateOf(segments)).toEqual(plainDate(2026, 3, 5));
  });
});
