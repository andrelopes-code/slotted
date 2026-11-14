import { describe, expect, it, vi } from 'vitest';

import { decimals, playCount } from './transition';

describe('playCount', () => {
  it('moves to the final number in one step when the duration is 1ms', () => {
    const element = document.createElement('div');
    const frames: number[] = [];

    element.style.setProperty('--slotted-duration-long', '1ms');
    document.body.append(element);
    playCount({ element, from: 100, to: 200, onFrame: (value) => frames.push(value) });

    expect(frames).toEqual([200]);
    element.remove();
  });

  it('moves in one step where the platform has no Web Animations', () => {
    const element = document.createElement('div');
    const onFrame = vi.fn();

    element.style.setProperty('--slotted-duration-long', '320ms');
    Object.defineProperty(element, 'animate', { value: undefined });
    playCount({ element, from: 100, to: 200, onFrame });

    expect(onFrame).toHaveBeenCalledExactlyOnceWith(200);
  });
});

describe('decimals', () => {
  it.each([
    [200, 0],
    [12.5, 1],
    [0.125, 3],
  ])('writes %d with %d places', (value, places) => {
    expect(decimals(value)).toBe(places);
  });
});
