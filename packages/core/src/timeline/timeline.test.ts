import { describe, expect, it } from 'vitest';

import {
  connectorOf,
  feedFocusTarget,
  formatTimestamp,
  isComplete,
  isInstant,
  isPast,
  relativeUnit,
  revealFocusIndex,
  setSizeOf,
  sideOf,
  timestampOf,
  zonedEpoch,
} from './timeline';

const plain = {
  date: { year: 2026, month: 9, day: 14 },
  time: { hour: 10, minute: 32, second: 0 },
};

describe('timestampOf', () => {
  it('reads a string with a zone designator as an instant', () => {
    expect(isInstant('2026-09-14T10:32:00Z')).toBe(true);
    expect(isInstant('2026-09-14T10:32:00-03:00')).toBe(true);
    expect(isInstant('2026-09-14T10:32')).toBe(false);
    const stamp = timestampOf('2026-09-14T10:32:00Z');
    expect(stamp.epoch).toBe(Date.UTC(2026, 8, 14, 10, 32));
    expect(stamp.plain).toBeNull();
    expect(stamp.dateTime).toBe('2026-09-14T10:32:00Z');
  });

  it('reads a string without one as the wall-clock value it writes', () => {
    const stamp = timestampOf('2026-09-14T10:32');
    expect(stamp.epoch).toBeNull();
    expect(stamp.plain).toEqual(plain);
    expect(stamp.dateTime).toBe('2026-09-14T10:32');
  });

  it('writes a PlainDateTime as its ISO form', () => {
    expect(timestampOf(plain).dateTime).toBe('2026-09-14T10:32:00');
  });

  it('keeps an unreadable string as itself', () => {
    const stamp = timestampOf('yesterday');
    expect(stamp.epoch).toBeNull();
    expect(stamp.plain).toBeNull();
    expect(formatTimestamp('yesterday').text).toBe('yesterday');
  });
});

describe('formatTimestamp', () => {
  it('writes an instant in the zone it is given', () => {
    const utc = formatTimestamp('2026-09-14T10:32:00Z', { locale: 'en-GB', timeZone: 'UTC' });
    const saoPaulo = formatTimestamp('2026-09-14T10:32:00Z', {
      locale: 'en-GB',
      timeZone: 'America/Sao_Paulo',
    });
    expect(utc.text).toMatch(/10:32/);
    expect(saoPaulo.text).toMatch(/07:32/);
    expect(utc.title).toBeNull();
  });

  /** The value the date chain holds is never converted. */
  it('writes a wall-clock value without conversion, whatever the zone', () => {
    const text = formatTimestamp(plain, { locale: 'en-GB', timeZone: 'Pacific/Kiritimati' }).text;
    expect(text).toMatch(/10:32/);
    expect(formatTimestamp('2026-09-14T10:32', { locale: 'en-GB' }).text).toMatch(/10:32/);
  });

  it('counts a relative reading from now and keeps the absolute one for title', () => {
    const now = Date.UTC(2026, 8, 14, 12, 32);
    const read = formatTimestamp('2026-09-14T10:32:00Z', {
      format: 'relative',
      locale: 'en',
      now,
      timeZone: 'UTC',
    });
    expect(read.text).toBe('2 hours ago');
    expect(read.title).toMatch(/10:32/);
  });

  it('measures a wall-clock value against the zone for a relative reading', () => {
    const now = Date.UTC(2026, 8, 14, 13, 32); /* 10:32 in Sao Paulo. */
    const read = formatTimestamp(plain, {
      format: 'relative',
      locale: 'en',
      now,
      timeZone: 'America/Sao_Paulo',
    });
    expect(read.text).toBe('now');
  });
});

describe('zonedEpoch', () => {
  it('resolves a wall clock in a zone with a fixed offset', () => {
    expect(zonedEpoch(plain, 'America/Sao_Paulo')).toBe(Date.UTC(2026, 8, 14, 13, 32));
    expect(zonedEpoch(plain, 'UTC')).toBe(Date.UTC(2026, 8, 14, 10, 32));
  });

  it('corrects the offset across a daylight boundary', () => {
    /* 2026-03-29 03:30 in Lisbon is after the spring jump: UTC+1. */
    const after = {
      date: { year: 2026, month: 3, day: 29 },
      time: { hour: 3, minute: 30, second: 0 },
    };
    expect(zonedEpoch(after, 'Europe/Lisbon')).toBe(Date.UTC(2026, 2, 29, 2, 30));
  });
});

describe('relativeUnit', () => {
  it('takes the largest whole unit', () => {
    expect(relativeUnit(-45 * 1000)).toEqual({ unit: 'second', value: -45 });
    expect(relativeUnit(-90 * 60 * 1000)).toEqual({ unit: 'hour', value: -1 });
    expect(relativeUnit(-9 * 24 * 3600 * 1000)).toEqual({ unit: 'week', value: -1 });
    expect(relativeUnit(400 * 24 * 3600 * 1000)).toEqual({ unit: 'year', value: 1 });
  });
});

describe('isComplete', () => {
  it('takes the consumer word over the derivation', () => {
    expect(
      isComplete({
        index: 0,
        currentIndex: 2,
        order: 'oldest-first',
        complete: false,
        autoComplete: true,
      }),
    ).toBe(false);
    expect(isComplete({ index: 4, currentIndex: 2, order: 'oldest-first', complete: true })).toBe(
      true,
    );
  });

  it('derives nothing unless asked', () => {
    expect(isComplete({ index: 0, currentIndex: 2, order: 'oldest-first' })).toBe(false);
  });

  /** The order is what says where the past is. */
  it('reads the past from the declared order', () => {
    expect(isPast({ index: 0, currentIndex: 2, order: 'oldest-first' })).toBe(true);
    expect(isPast({ index: 3, currentIndex: 2, order: 'oldest-first' })).toBe(false);
    expect(isPast({ index: 3, currentIndex: 2, order: 'newest-first' })).toBe(true);
    expect(isPast({ index: 0, currentIndex: 2, order: 'newest-first' })).toBe(false);
    expect(isPast({ index: 2, currentIndex: 2, order: 'newest-first' })).toBe(false);
    expect(isPast({ index: 0, currentIndex: -1, order: 'oldest-first' })).toBe(false);
  });
});

describe('connectorOf', () => {
  it('dashes the future side of the current event', () => {
    const oldest = { currentIndex: 2, order: 'oldest-first' as const, autoComplete: true };
    expect(connectorOf({ index: 1, ...oldest })).toBe('solid');
    expect(connectorOf({ index: 2, ...oldest })).toBe('dashed');
    expect(connectorOf({ index: 3, ...oldest })).toBe('dashed');
    const newest = { currentIndex: 2, order: 'newest-first' as const, autoComplete: true };
    expect(connectorOf({ index: 1, ...newest })).toBe('dashed');
    expect(connectorOf({ index: 2, ...newest })).toBe('solid');
  });

  it('keeps the consumer word and stays solid without autoComplete', () => {
    expect(
      connectorOf({ index: 2, currentIndex: 2, order: 'oldest-first', connector: 'none' }),
    ).toBe('none');
    expect(connectorOf({ index: 2, currentIndex: 2, order: 'oldest-first' })).toBe('solid');
  });
});

describe('sideOf', () => {
  it('takes turns in alternate and keeps to one side otherwise', () => {
    expect(sideOf('end', 1)).toBe('end');
    expect(sideOf('start', 0)).toBe('start');
    expect(sideOf('alternate', 0)).toBe('end');
    expect(sideOf('alternate', 1)).toBe('start');
    expect(sideOf('alternate', 1, 'end')).toBe('end');
  });
});

describe('setSizeOf', () => {
  it('states the total, the loaded count, or that it does not know', () => {
    expect(setSizeOf({ count: 120, loaded: 20, growing: 'scroll' })).toBe(120);
    expect(setSizeOf({ loaded: 20, growing: 'none' })).toBe(20);
    expect(setSizeOf({ loaded: 20, growing: 'button' })).toBe(-1);
    expect(setSizeOf({ count: Infinity, loaded: 20, growing: 'scroll' })).toBe(-1);
  });
});

describe('feedFocusTarget', () => {
  it('moves between articles on the page keys', () => {
    expect(feedFocusTarget({ from: 0, key: 'PageDown', count: 3 })).toBe(1);
    expect(feedFocusTarget({ from: 2, key: 'PageDown', count: 3 })).toBe(2);
    expect(feedFocusTarget({ from: 2, key: 'PageUp', count: 3 })).toBe(1);
    expect(feedFocusTarget({ from: 0, key: 'PageUp', count: 3 })).toBe(0);
  });

  it('reaches the first article from a control inside the feed', () => {
    expect(feedFocusTarget({ from: -1, key: 'PageDown', count: 3 })).toBe(0);
    expect(feedFocusTarget({ from: -1, key: 'PageUp', count: 3 })).toBeNull();
  });

  it('leaves the feed on Control+End and Control+Home, and only with the modifier', () => {
    expect(feedFocusTarget({ from: 1, key: 'End', ctrlKey: true, count: 3 })).toBe('after');
    expect(feedFocusTarget({ from: 1, key: 'Home', metaKey: true, count: 3 })).toBe('before');
    expect(feedFocusTarget({ from: 1, key: 'End', count: 3 })).toBeNull();
    expect(feedFocusTarget({ from: 1, key: 'ArrowDown', count: 3 })).toBeNull();
  });
});

describe('revealFocusIndex', () => {
  it('lands on the first revealed event at the top of a newest-first list', () => {
    expect(revealFocusIndex({ loaded: 8, revealed: 3, order: 'newest-first' })).toBe(0);
  });

  it('lands on the first revealed event after the old ones in an oldest-first list', () => {
    expect(revealFocusIndex({ loaded: 8, revealed: 3, order: 'oldest-first' })).toBe(5);
  });

  it('answers nothing when there is nothing to land on', () => {
    expect(revealFocusIndex({ loaded: 0, revealed: 3, order: 'newest-first' })).toBeNull();
    expect(revealFocusIndex({ loaded: 8, revealed: 0, order: 'oldest-first' })).toBeNull();
  });

  it('keeps inside the list when the consumer revealed fewer than it counted', () => {
    expect(revealFocusIndex({ loaded: 2, revealed: 3, order: 'oldest-first' })).toBe(0);
  });
});
