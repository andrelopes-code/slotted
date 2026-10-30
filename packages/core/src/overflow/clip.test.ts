import { describe, expect, it } from 'vitest';

import { isClipped } from './clip';

function mount(sizes: { client: number; scroll: number; overflow?: string }) {
  /* jsdom does not expand the `overflow` shorthand, so the axis is written. */
  document.body.innerHTML = `<span id="name" style="overflow-x: ${sizes.overflow ?? 'hidden'}">Open orders</span>`;
  const element = document.getElementById('name') as HTMLElement;
  size(element, sizes);
  return element;
}

function size(element: HTMLElement, sizes: { client: number; scroll: number }) {
  Object.defineProperty(element, 'clientWidth', { value: sizes.client, configurable: true });
  Object.defineProperty(element, 'scrollWidth', { value: sizes.scroll, configurable: true });
}

describe('isClipped', () => {
  it('reads a box narrower than its own text as cut', () => {
    expect(isClipped(mount({ client: 48, scroll: 120 }))).toBe(true);
  });

  /**
   * A cell that lets its text spill over the next one shows every word, so
   * nothing is cut however much wider than its box the text is.
   */
  it('reads a box that hides nothing as cutting nothing', () => {
    expect(isClipped(mount({ client: 48, scroll: 120, overflow: 'visible' }))).toBe(false);
  });

  /** Sub-pixel layout leaves a name that fits a fraction wider than its box. */
  it('counts a fraction over as a fit', () => {
    expect(isClipped(mount({ client: 120, scroll: 120.5 }))).toBe(false);
    expect(isClipped(mount({ client: 120, scroll: 124 }))).toBe(true);
  });
});
