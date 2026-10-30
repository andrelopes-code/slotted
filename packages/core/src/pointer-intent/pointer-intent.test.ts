import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPointerIntent, headingTo } from './pointer-intent';

/** A submenu 120 pixels to the inline end of the parent item, 100 tall. */
const submenu = { top: 100, right: 320, bottom: 200, left: 200 };

/** The item that opened it: the pointer starts here. */
const parent = { top: 100, right: 190, bottom: 130, left: 0 };

const move = (x: number, y: number) =>
  document.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));

describe('headingTo', () => {
  it('reads a pointer already inside the target as heading there', () => {
    expect(headingTo({ x: 100, y: 110 }, { x: 250, y: 150 }, submenu)).toBe(true);
  });

  /**
   * The diagonal is the whole point: the pointer leaves the parent item, cuts
   * across two items it has no interest in, and arrives at the submenu.
   */
  it('holds the grace while the pointer cuts diagonally toward the target', () => {
    expect(headingTo({ x: 100, y: 110 }, { x: 160, y: 140 }, submenu)).toBe(true);
    expect(headingTo({ x: 100, y: 110 }, { x: 180, y: 170 }, submenu)).toBe(true);
  });

  it('ends the grace when the pointer turns away from the target', () => {
    expect(headingTo({ x: 100, y: 110 }, { x: 100, y: 260 }, submenu)).toBe(false);
    expect(headingTo({ x: 100, y: 110 }, { x: 20, y: 115 }, submenu)).toBe(false);
  });

  /**
   * A submenu that collided with the edge of the screen flips to the other
   * side, and the cone has to flip with it — which is why the near edge is
   * computed from the pointer rather than assumed to be the left one.
   */
  it('follows a target that sits on the other side of the pointer', () => {
    const flipped = { top: 100, right: 90, bottom: 200, left: 0 };

    expect(headingTo({ x: 200, y: 110 }, { x: 150, y: 140 }, flipped)).toBe(true);
    expect(headingTo({ x: 200, y: 110 }, { x: 260, y: 140 }, flipped)).toBe(false);
  });

  it('follows a target below the pointer as readily as one beside it', () => {
    const below = { top: 200, right: 300, bottom: 300, left: 100 };

    expect(headingTo({ x: 200, y: 100 }, { x: 205, y: 150 }, below)).toBe(true);
    expect(headingTo({ x: 200, y: 100 }, { x: 205, y: 40 }, below)).toBe(false);
  });
});

describe('createPointerIntent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds while the pointer travels toward the submenu', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({
      target: () => submenu,
      origin: () => parent,
      onSettled,
    });

    move(100, 110);
    move(160, 140);
    move(190, 160);

    expect(onSettled).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('settles as soon as the pointer turns away', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({
      target: () => submenu,
      origin: () => parent,
      onSettled,
    });

    move(100, 110);
    move(60, 400);

    expect(onSettled).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  /** A pointer parked on another item sends nothing more, and says nothing. */
  it('settles when the pointer stops moving at all', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({
      target: () => submenu,
      origin: () => parent,
      onSettled,
    });

    move(160, 140);
    expect(onSettled).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(onSettled).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  it('holds while the pointer is still on the item that opened the submenu', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({
      target: () => submenu,
      origin: () => parent,
      onSettled,
    });

    move(20, 110);
    move(10, 125);

    expect(onSettled).not.toHaveBeenCalled();
    handle.destroy();
  });

  it('settles once and no more', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({ target: () => submenu, onSettled });

    move(100, 110);
    move(60, 400);
    move(50, 500);
    vi.advanceTimersByTime(1000);

    expect(onSettled).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  it('settles when the submenu it was watching has gone', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({ target: () => null, onSettled });

    move(100, 110);

    expect(onSettled).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  it('can be ended from outside, as a submenu closing for another reason is', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({ target: () => submenu, onSettled });

    handle.cancel();

    expect(onSettled).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  it('leaves no listener and no timer behind', () => {
    const onSettled = vi.fn();
    const handle = createPointerIntent({ target: () => submenu, onSettled });

    handle.destroy();
    move(60, 400);
    vi.advanceTimersByTime(1000);

    expect(onSettled).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
