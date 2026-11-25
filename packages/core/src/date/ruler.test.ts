import { describe, expect, it } from 'vitest';

import { clockModel } from './clock';
import { plainTime, toISOTime } from './plain-time';
import { rulerKeyTarget, rulerShare, rulerTimeAt } from './ruler';

const model = clockModel({ step: 900, min: plainTime(8), max: plainTime(18) });
const NINE = plainTime(9);

describe('a handle of the ruler', () => {
  const move = (key: string, rtl = false) => {
    const time = rulerKeyTarget({ key, rtl }, NINE, model, 900);

    return time && toISOTime(time, 'minute');
  };

  it('moves one step, one hour, or to an end of the day', () => {
    expect(move('ArrowRight')).toBe('09:15');
    expect(move('ArrowLeft')).toBe('08:45');
    expect(move('PageUp')).toBe('10:00');
    expect(move('PageDown')).toBe('08:00');
    expect(move('Home')).toBe('08:00');
    expect(move('End')).toBe('18:00');
  });

  it('mirrors the arrows, and leaves every other key alone', () => {
    expect(move('ArrowLeft', true)).toBe('09:15');
    expect(move('a')).toBeNull();
  });

  it('stays where it is past the last accepted time', () => {
    expect(rulerKeyTarget({ key: 'ArrowRight', rtl: false }, plainTime(18), model, 900)).toBeNull();
  });
});

it('reads a share of the day, and says one', () => {
  expect(rulerTimeAt(0.5, model)).toEqual(plainTime(12));
  expect(rulerTimeAt(0, model)).toEqual(plainTime(8));
  expect(rulerShare(plainTime(6))).toBe(25);
});
