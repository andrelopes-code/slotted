import { afterEach, describe, expect, it } from 'vitest';

import { revealWithin } from './reveal';

const box = (top: number, height: number) =>
  ({ top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top }) as DOMRect;

function popup() {
  const surface = document.createElement('div');
  const list = document.createElement('div');
  list.style.overflowY = 'auto';
  const option = document.createElement('div');
  list.append(option);
  surface.append(list);
  document.body.append(surface);
  Object.defineProperty(list, 'clientHeight', { value: 100 });
  list.getBoundingClientRect = () => box(200, 100);
  surface.getBoundingClientRect = () => box(190, 120);
  return { surface, list, option };
}

afterEach(() => document.body.replaceChildren());

describe('revealWithin', () => {
  it('scrolls the nearest scrolling box down by the least distance that shows the row', () => {
    const { surface, list, option } = popup();
    option.getBoundingClientRect = () => box(320, 30);
    revealWithin(option, surface);
    expect(list.scrollTop).toBe(50);
    expect(surface.scrollTop).toBe(0);
  });

  it('scrolls up to a row above the view, and leaves a row in view alone', () => {
    const { surface, list, option } = popup();
    list.scrollTop = 80;
    option.getBoundingClientRect = () => box(170, 30);
    revealWithin(option, surface);
    expect(list.scrollTop).toBe(50);
    option.getBoundingClientRect = () => box(230, 30);
    revealWithin(option, surface);
    expect(list.scrollTop).toBe(50);
  });

  it('keeps the box’s scroll padding clear', () => {
    const { surface, list, option } = popup();
    list.style.setProperty('scroll-padding-block-start', '24px');
    list.scrollTop = 80;
    option.getBoundingClientRect = () => box(210, 30);
    revealWithin(option, surface);
    expect(list.scrollTop).toBe(66);
  });

  it('scrolls the surface itself when nothing between scrolls', () => {
    const surface = document.createElement('div');
    const option = document.createElement('div');
    surface.append(option);
    document.body.append(surface);
    Object.defineProperty(surface, 'clientHeight', { value: 100 });
    surface.getBoundingClientRect = () => box(0, 100);
    option.getBoundingClientRect = () => box(130, 20);
    revealWithin(option, surface);
    expect(surface.scrollTop).toBe(50);
  });
});
