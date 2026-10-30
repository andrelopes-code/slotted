import { afterEach, describe, expect, it } from 'vitest';

import { createIndicator } from './indicator';
import type { IndicatorHandle } from './indicator';

const handles: IndicatorHandle[] = [];

/** `jsdom` lays nothing out, so each box is whatever the test says it is. */
function place(element: Element, left: number, top: number, width: number, height: number) {
  element.getBoundingClientRect = () =>
    ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;
}

function row() {
  document.body.innerHTML =
    '<div id="list"><div data-part="item" data-part-item="" data-selected><button>A</button></div><div data-part="item" data-part-item=""><button>B</button></div></div>';
  const list = document.getElementById('list')!;
  const [a, b] = [...list.querySelectorAll('button')];
  place(list, 100, 50, 400, 40);
  place(a!, 110, 50, 60, 40);
  place(b!, 180, 50, 90, 40);
  return { list, a: a!, b: b! };
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createIndicator', () => {
  afterEach(() => {
    handles.splice(0).forEach((handle) => handle.destroy());
    document.body.innerHTML = '';
  });

  it('appends one hidden mark and places it on the target, in the container’s coordinates', async () => {
    const { list } = row();
    const handle = createIndicator(list, {
      orientation: () => 'horizontal',
      part: 'marker',
      target: () => list.querySelector('[data-selected] > button'),
    });
    handles.push(handle);

    expect(list.lastElementChild).toBe(handle.element);
    expect(handle.element.getAttribute('data-part')).toBe('marker');
    expect(handle.element.getAttribute('aria-hidden')).toBe('true');
    expect(handle.element.hidden).toBe(false);
    expect(handle.element.style.getPropertyValue('--_indicator-start')).toBe('10px');
    expect(handle.element.style.getPropertyValue('--_indicator-length')).toBe('60px');
    expect(handle.element.hasAttribute('data-moving')).toBe(false);
  });

  it('follows the selection when it moves, and adds the scroll the row has taken', async () => {
    const { list } = row();
    list.scrollLeft = 25;
    const handle = createIndicator(list, {
      orientation: () => 'horizontal',
      target: () => list.querySelector('[data-selected] > button'),
    });
    handles.push(handle);

    const [first, second] = list.querySelectorAll('[data-part="item"]');
    first!.removeAttribute('data-selected');
    second!.setAttribute('data-selected', '');
    await settled();

    expect(handle.element.style.getPropertyValue('--_indicator-start')).toBe(
      `${180 - 100 + list.scrollLeft}px`,
    );
    expect(handle.element.style.getPropertyValue('--_indicator-length')).toBe('90px');
    expect(handle.element.hasAttribute('data-moving')).toBe(true);
  });

  /**
   * The mark stands on its new tab at once and is drawn from the box it was
   * in: the shift and the scale between the two boxes, which the stylesheet
   * animates back to nought on the compositor.
   */
  it('writes the shift and the scale from the box the mark was drawn in', async () => {
    const { list } = row();
    const handle = createIndicator(list, {
      orientation: () => 'horizontal',
      target: () => list.querySelector('[data-selected] > button'),
    });
    handles.push(handle);
    const boxes = [
      { left: 110, top: 50, width: 60, height: 2 },
      { left: 180, top: 50, width: 90, height: 2 },
    ];
    handle.element.getBoundingClientRect = () => ({ ...boxes.shift()! }) as DOMRect;

    const [first, second] = list.querySelectorAll('[data-part="item"]');
    first!.removeAttribute('data-selected');
    second!.setAttribute('data-selected', '');
    await settled();

    expect(handle.element.style.getPropertyValue('--_indicator-shift')).toBe('-70px 0px');
    expect(handle.element.style.getPropertyValue('--_indicator-scale')).toBe(`${60 / 90} 1`);
    expect(handle.element.hasAttribute('data-moving')).toBe(true);
  });

  it('places the same target measured again without motion', async () => {
    const { list, a } = row();
    const handle = createIndicator(list, {
      orientation: () => 'horizontal',
      target: () => list.querySelector('[data-selected] > button'),
    });
    handles.push(handle);

    place(a, 110, 50, 72, 40);
    handle.update();

    expect(handle.element.style.getPropertyValue('--_indicator-length')).toBe('72px');
    expect(handle.element.hasAttribute('data-moving')).toBe(false);
  });

  it('measures the block axis of a vertical row, and hides the mark with no target', async () => {
    const { list, a } = row();
    place(a, 100, 80, 120, 30);
    const handle = createIndicator(list, {
      orientation: () => 'vertical',
      target: () => list.querySelector('[data-selected] > button'),
    });
    handles.push(handle);

    expect(handle.element.style.getPropertyValue('--_indicator-start')).toBe('30px');
    expect(handle.element.style.getPropertyValue('--_indicator-length')).toBe('30px');

    list.querySelector('[data-selected]')!.removeAttribute('data-selected');
    await settled();
    expect(handle.element.hidden).toBe(true);
  });

  it('removes the mark on destroy', () => {
    const { list } = row();
    const handle = createIndicator(list, { orientation: () => 'horizontal', target: () => null });
    handle.destroy();
    expect(list.querySelector('[data-part="indicator"]')).toBeNull();
  });
});
