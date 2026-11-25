import { describe, expect, it } from 'vitest';

import {
  closingMoments,
  isPastRunLimit,
  missingHalf,
  momentRunDraft,
  momentRunFor,
  momentRunOf,
  refusalOfMoments,
  runDayRefusal,
  stepMomentRun,
  withRunDays,
} from './moment-run';
import type { MomentRunRules } from './moment-run';
import { momentDraft } from './moment';
import { plainDate } from './plain-date';
import { plainDateTime } from './plain-date-time';
import { plainTime } from './plain-time';

const DAY = 86_400;
const day = (date: number) => plainDate(2026, 11, date);
const at = (date: number, hour: number, minute = 0) =>
  plainDateTime(day(date), plainTime(hour, minute));
const RUN = { start: at(27, 17), end: at(30, 10, 30) };
const RULES: MomentRunRules = { maxLength: 4 * DAY, minLength: DAY / 2, step: 900 };

describe('a draft of four halves', () => {
  it('is a run once an end is whole', () => {
    const draft = momentRunDraft(RUN);

    expect(momentRunOf(draft)).toEqual(RUN);
    expect(momentRunOf({ ...draft, end: { date: day(30), time: null } })).toEqual({
      ...RUN,
      end: null,
    });
    expect(momentRunOf(momentRunDraft(null))).toBeNull();
  });

  it('names the half to choose next, its own end first', () => {
    const empty = momentRunDraft(null);
    const started = withRunDays(empty, { start: day(27), end: null });
    const whole = momentRunDraft({ ...RUN, end: null });

    expect(missingHalf(empty, 'start')).toEqual({ part: 'day', position: 'start' });
    expect(missingHalf(started, 'start')).toEqual({ part: 'time', position: 'start' });
    expect(missingHalf(whole, 'start')).toEqual({ part: 'day', position: 'end' });
    expect(missingHalf(started, 'end')).toEqual({ part: 'day', position: 'end' });
    expect(missingHalf(momentRunDraft(RUN), 'start')).toBeNull();
  });

  it('keeps the time of each end under new days', () => {
    const moved = withRunDays(momentRunDraft(RUN), { start: day(20), end: day(22) });

    expect(momentRunOf(moved)).toEqual({ start: at(20, 17), end: at(22, 10, 30) });
  });
});

describe('the days that close a run', () => {
  it('stop at an unavailable one, unless the run may cross it', () => {
    const unavailableDay = ({ day: date }: { day: number }) => date === 29;
    const refuses = (rules: MomentRunRules) =>
      runDayRefusal(momentDraft(RUN.start), rules)(day(30));

    expect(refuses({ step: 900, unavailableDay })).toBe(true);
    expect(refuses({ contiguous: false, step: 900, unavailableDay })).toBe(false);
  });

  it('stay within reach of the limits', () => {
    const refuses = runDayRefusal(momentDraft(at(20, 17)), RULES);

    expect([21, 24, 25].map((date) => refuses(day(date)))).toEqual([false, false, true]);
    expect(refuses(day(20))).toBe(false);
  });

  it('are the ones the bounds and the predicate leave, with no run open', () => {
    const refuses = runDayRefusal(momentDraft(null), { min: at(20, 9), step: 900 });

    expect([19, 20].map((date) => refuses(day(date)))).toEqual([true, false]);
  });

  it('are past the limit from the one it falls on', () => {
    const draft = momentRunDraft({ start: at(20, 17), end: at(26, 9) });
    const past = (date: number) => isPastRunLimit(draft, day(date), RULES);

    expect([20, 23, 24, 25, 26].map(past)).toEqual([false, false, false, true, true]);
  });
});

describe('the times that close a run', () => {
  const refuses = (date: number, hour: number) =>
    closingMoments(at(20, 17), day(date), RULES).isTimeUnavailable?.(plainTime(hour));

  it('come after the start on its own day, and inside the limits on every other', () => {
    expect([refuses(20, 16), refuses(20, 20)]).toEqual([true, true]);
    expect([refuses(21, 4), refuses(21, 5)]).toEqual([true, false]);
    expect([refuses(24, 17), refuses(24, 18)]).toEqual([false, true]);
    expect(refuses(19, 10)).toBe(true);
  });

  it('are the ones of the day before a start is chosen', () => {
    expect(closingMoments(null, day(20), { ...RULES, minTime: plainTime(8) })).toMatchObject({
      isTimeUnavailable: undefined,
      min: plainTime(8),
    });
  });
});

describe('the length of a run', () => {
  it('steps its end by one day, inside the limits', () => {
    const draft = momentRunDraft(RUN);

    expect(momentRunOf(stepMomentRun(draft, 1, RULES)!)?.end).toEqual(
      plainDateTime(plainDate(2026, 12, 1), plainTime(10, 30)),
    );
    expect(stepMomentRun(momentRunDraft({ ...RUN, end: at(28, 9) }), -1, RULES)).toBeNull();
    expect(
      stepMomentRun(momentRunDraft({ start: at(20, 17), end: at(26, 9) }), -1, RULES),
    ).not.toBeNull();
    expect(stepMomentRun(momentRunDraft({ ...RUN, end: null }), 1, RULES)).toBeNull();
  });

  it('is set from its start', () => {
    expect(momentRunFor(momentRunDraft(RUN), DAY, RULES)).toEqual({
      start: RUN.start,
      end: at(28, 17),
    });
    expect(momentRunFor(momentRunDraft(RUN), 5 * DAY, RULES)).toBeNull();
    expect(momentRunFor(momentRunDraft(null), DAY, RULES)).toBeNull();
  });

  it('says what refuses it', () => {
    expect(refusalOfMoments(RUN, RULES)).toBeNull();
    expect(refusalOfMoments({ start: RUN.end, end: RUN.start }, RULES)).toEqual({
      reason: 'order',
    });
    expect(refusalOfMoments({ start: at(20, 17), end: at(25, 17) }, RULES)).toEqual({
      by: DAY,
      reason: 'over',
    });
  });
});
