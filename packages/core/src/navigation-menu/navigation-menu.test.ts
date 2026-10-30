import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clippingBox,
  createHoverIntent,
  focusTarget,
  motionBetween,
  viewportGeometry,
  writeGeometry,
} from './navigation-menu';

const order = ['products', 'solutions', 'company'];

describe('motionBetween', () => {
  it('moves toward the end when the next section follows in reading order', () => {
    expect(motionBetween(order, 'products', 'company')).toEqual({
      enter: 'from-end',
      exit: 'to-start',
    });
  });

  it('moves toward the start when the next section comes before', () => {
    expect(motionBetween(order, 'company', 'solutions')).toEqual({
      enter: 'from-start',
      exit: 'to-end',
    });
  });

  /** Opening from nothing and closing to nothing are the surface's own motion, not a crossing. */
  it('names no crossing when either side is closed', () => {
    expect(motionBetween(order, null, 'company')).toEqual({ enter: null, exit: null });
    expect(motionBetween(order, 'company', null)).toEqual({ enter: null, exit: null });
  });
});

describe('viewportGeometry', () => {
  const root = { top: 10, left: 100, right: 500, bottom: 44, width: 400, height: 34 };

  it('opens under the trigger with the arrow on its center', () => {
    const geometry = viewportGeometry({
      orientation: 'horizontal',
      dir: 'ltr',
      root,
      trigger: { top: 10, left: 180, right: 260, bottom: 44, width: 80, height: 34 },
      content: { width: 300, height: 200 },
      windowWidth: 1280,
      gutter: 8,
    });
    expect(geometry).toEqual({
      placement: 'below',
      inlineSize: 300,
      blockSize: 200,
      inlineStart: 80,
      blockStart: 0,
      arrowOffset: 40,
      available: 1264,
    });
  });

  /** A panel wider than the room after its trigger moves toward the start until it fits. */
  it('moves the surface toward the start until it fits, the arrow still on the trigger', () => {
    const geometry = viewportGeometry({
      orientation: 'horizontal',
      dir: 'ltr',
      root,
      trigger: { top: 10, left: 420, right: 500, bottom: 44, width: 80, height: 34 },
      content: { width: 500, height: 200 },
      windowWidth: 800,
      gutter: 8,
    });
    expect(geometry.inlineStart).toBe(192);
    expect(geometry.arrowOffset).toBe(420 - 100 + 40 - 192);
  });

  it('measures from the inline start of a right-to-left root', () => {
    const geometry = viewportGeometry({
      orientation: 'horizontal',
      dir: 'rtl',
      root,
      trigger: { top: 10, left: 400, right: 480, bottom: 44, width: 80, height: 34 },
      content: { width: 200, height: 100 },
      windowWidth: 1280,
      gutter: 8,
    });
    expect(geometry.inlineStart).toBe(20);
    expect(geometry.arrowOffset).toBe(40);
  });

  it('opens beside a vertical column, level with the trigger', () => {
    const geometry = viewportGeometry({
      orientation: 'vertical',
      dir: 'ltr',
      root: { top: 0, left: 0, right: 200, bottom: 300, width: 200, height: 300 },
      trigger: { top: 68, left: 0, right: 200, bottom: 102, width: 200, height: 34 },
      content: { width: 300, height: 160 },
      windowWidth: 1000,
      gutter: 8,
    });
    expect(geometry).toMatchObject({
      placement: 'beside',
      inlineStart: 200,
      blockStart: 68,
      arrowOffset: 17,
    });
    expect(geometry.available).toBe(1000 - 200 - 8);
  });

  /** A column with no room at its end drops the panel under the trigger instead of clipping it. */
  it('drops under the trigger when the column has no room beside it', () => {
    const geometry = viewportGeometry({
      orientation: 'vertical',
      dir: 'ltr',
      root: { top: 0, left: 0, right: 200, bottom: 300, width: 200, height: 300 },
      trigger: { top: 68, left: 0, right: 200, bottom: 102, width: 200, height: 34 },
      content: { width: 300, height: 160 },
      windowWidth: 360,
      gutter: 8,
    });
    expect(geometry).toMatchObject({
      placement: 'below',
      inlineStart: 8,
      blockStart: 102,
      arrowOffset: 92,
      inlineSize: 300,
    });
  });

  it('writes whole pixels on the root under the names the stylesheet reads', () => {
    const element = document.createElement('nav');
    writeGeometry(element, {
      placement: 'below',
      inlineSize: 300.4,
      blockSize: 199.6,
      inlineStart: 80,
      blockStart: 0,
      arrowOffset: 40.5,
      available: 1264,
    });
    expect(element.style.getPropertyValue('--slotted-navigation-menu-viewport-inline-size')).toBe(
      '300px',
    );
    expect(element.style.getPropertyValue('--slotted-navigation-menu-viewport-block-size')).toBe(
      '200px',
    );
    expect(element.style.getPropertyValue('--slotted-navigation-menu-arrow-offset')).toBe('40.5px');
    expect(element.dataset['placement']).toBe('below');
  });
});

describe('createHoverIntent', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    let value: string | null = null;
    const open = vi.fn((next: string) => (value = next));
    const close = vi.fn(() => (value = null));
    const intent = createHoverIntent({
      openDelay: 200,
      closeDelay: 300,
      isOpen: () => value !== null,
      open,
      close,
    });
    return { intent, open, close };
  }

  it('opens after the delay and not before', () => {
    const { intent, open } = setup();
    intent.enter('products', 'mouse');
    vi.advanceTimersByTime(199);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledWith('products');
  });

  it('switches without the delay while a section is open', () => {
    const { intent, open } = setup();
    intent.enter('products', 'mouse');
    vi.advanceTimersByTime(200);
    intent.enter('company', 'mouse');
    expect(open).toHaveBeenLastCalledWith('company');
  });

  it('never opens by hover on touch', () => {
    const { intent, open } = setup();
    intent.enter('products', 'touch');
    vi.advanceTimersByTime(1000);
    expect(open).not.toHaveBeenCalled();
  });

  it('closes after the delay once the pointer leaves, and stays when it returns', () => {
    const { intent, close } = setup();
    intent.enter('products', 'mouse');
    vi.advanceTimersByTime(200);
    intent.leave();
    vi.advanceTimersByTime(299);
    intent.stay();
    vi.advanceTimersByTime(1000);
    expect(close).not.toHaveBeenCalled();
    intent.leave();
    vi.advanceTimersByTime(300);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('forgets a pending open when the pointer leaves first', () => {
    const { intent, open } = setup();
    intent.enter('products', 'mouse');
    vi.advanceTimersByTime(100);
    intent.leave();
    vi.advanceTimersByTime(1000);
    expect(open).not.toHaveBeenCalled();
  });
});

describe('focusTarget', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <nav data-ui="navigation-menu" data-ui-navigation-menu="" data-orientation="horizontal">
        <ul data-part="list" data-part-list="">
          <li data-part="item" data-part-item="" data-value="products">
            <button data-part="trigger" data-part-trigger="" aria-expanded="true">Products</button>
            <div data-part="content" data-part-content="" data-open>
              <a data-part="link" data-part-link="" href="#a">A</a>
              <a data-part="link" data-part-link="" href="#b">B</a>
            </div>
          </li>
          <li data-part="item" data-part-item="" data-value="docs"><a data-part="link" data-part-link="" href="#docs">Docs</a></li>
          <li data-part="item" data-part-item="" data-value="off">
            <button data-part="trigger" data-part-trigger="" disabled>Off</button>
            <div data-part="content" data-part-content="" hidden></div>
          </li>
          <li data-part="item" data-part-item="" data-value="company">
            <button data-part="trigger" data-part-trigger="" aria-expanded="false">Company</button>
            <div data-part="content" data-part-content="" hidden><a data-part="link" data-part-link="" href="#c">C</a></div>
          </li>
        </ul>
      </nav>`;
    root = document.querySelector('nav')!;
  });

  const at = (selector: string) => document.querySelector<HTMLElement>(selector)!;
  const go = (from: string, key: string, dir: 'ltr' | 'rtl' = 'ltr') =>
    focusTarget(root, at(from), key, { orientation: 'horizontal', dir })?.textContent;

  it('walks the top-level controls along the row, skipping a disabled one and wrapping', () => {
    expect(go('[data-value="products"] > button', 'ArrowRight')).toBe('Docs');
    expect(go('[data-value="docs"] > a', 'ArrowRight')).toBe('Company');
    expect(go('[data-value="company"] > button', 'ArrowRight')).toBe('Products');
    expect(go('[data-value="products"] > button', 'ArrowLeft')).toBe('Company');
  });

  it('mirrors the row in a right-to-left root', () => {
    expect(go('[data-value="products"] > button', 'ArrowLeft', 'rtl')).toBe('Docs');
  });

  it('enters an open section with ArrowDown and leaves a closed one alone', () => {
    expect(go('[data-value="products"] > button', 'ArrowDown')).toBe('A');
    expect(go('[data-value="company"] > button', 'ArrowDown')).toBeUndefined();
  });

  it('walks the panel and returns to its trigger from the first link', () => {
    expect(go('a[href="#a"]', 'ArrowDown')).toBe('B');
    expect(go('a[href="#b"]', 'ArrowUp')).toBe('A');
    expect(go('a[href="#a"]', 'ArrowUp')).toBe('Products');
    expect(go('a[href="#a"]', 'End')).toBe('B');
  });

  it('reaches the ends of the row with Home and End', () => {
    expect(go('[data-value="docs"] > a', 'Home')).toBe('Products');
    expect(go('[data-value="docs"] > a', 'End')).toBe('Company');
  });
});

describe('clippingBox', () => {
  it('is the nearest ancestor that clips its inline overflow, or the window', () => {
    document.body.innerHTML = `<div id="frame" style="overflow-x: hidden"><nav id="root"></nav></div>`;
    const frame = document.getElementById('frame')!;
    frame.getBoundingClientRect = () => ({ left: 40 }) as DOMRect;
    Object.defineProperty(frame, 'clientWidth', { value: 676 });
    expect(clippingBox(document.getElementById('root')!)).toEqual({ left: 40, width: 676 });
    frame.style.overflowX = 'visible';
    expect(clippingBox(document.getElementById('root')!).left).toBe(0);
  });
});
