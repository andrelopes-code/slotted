import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fromPlacement, oppositeSide, resolveSide, toPlacement, transformOrigin } from './geometry';
import * as surface from './index';
import { POSITIONER_PROPERTIES, createPositioner } from './positioner';
import { submenuOffsets } from './submenu';

const VIEWPORT = { width: 1024, height: 768 };

function viewport() {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT.width);
  vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT.height);
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rect(element: Element, box: Box) {
  const value: DOMRect = {
    x: box.x,
    y: box.y,
    left: box.x,
    top: box.y,
    right: box.x + box.width,
    bottom: box.y + box.height,
    width: box.width,
    height: box.height,
    toJSON: () => ({}),
  };
  element.getBoundingClientRect = () => value;
}

/**
 * The engine reads the floating element's own size from its box, not from its
 * rectangle, and a headless document reports every box as zero. Both are stated
 * so the arithmetic under test is the module's rather than the environment's.
 */
function sized(element: HTMLElement, width: number, height: number) {
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  Object.defineProperty(element, 'offsetWidth', { get: () => width, configurable: true });
  Object.defineProperty(element, 'offsetHeight', { get: () => height, configurable: true });
  rect(element, { x: 0, y: 0, width, height });
}

function scene(anchorBox: Box, floatingSize = { width: 200, height: 80 }) {
  document.body.innerHTML = '<button id="anchor"></button><div id="floating"></div>';
  const anchor = document.getElementById('anchor') as HTMLElement;
  const floating = document.getElementById('floating') as HTMLElement;
  rect(anchor, anchorBox);
  sized(floating, floatingSize.width, floatingSize.height);
  return { anchor, floating };
}

const ANCHOR = { x: 100, y: 100, width: 50, height: 20 };

describe('geometry', () => {
  it('resolves a physical side to itself in both directions', () => {
    for (const direction of ['ltr', 'rtl'] as const) {
      expect(resolveSide('top', direction)).toBe('top');
      expect(resolveSide('right', direction)).toBe('right');
    }
  });

  /** The capability every surveyed positioner leaves to the consumer. */
  it('mirrors a logical side with the writing direction', () => {
    expect(resolveSide('inline-start', 'ltr')).toBe('left');
    expect(resolveSide('inline-end', 'ltr')).toBe('right');
    expect(resolveSide('inline-start', 'rtl')).toBe('right');
    expect(resolveSide('inline-end', 'rtl')).toBe('left');
  });

  it('writes the center alignment as no alignment at all', () => {
    expect(toPlacement('bottom', 'center')).toBe('bottom');
    expect(toPlacement('bottom', 'start')).toBe('bottom-start');
    expect(fromPlacement('bottom')).toEqual({ side: 'bottom', align: 'center' });
    expect(fromPlacement('left-end')).toEqual({ side: 'left', align: 'end' });
  });

  it('names the side across from each side', () => {
    expect(oppositeSide('top')).toBe('bottom');
    expect(oppositeSide('left')).toBe('right');
  });

  describe('the transform origin', () => {
    it('grows from the edge nearest the anchor', () => {
      expect(transformOrigin('bottom', 'center')).toBe('center top');
      expect(transformOrigin('top', 'center')).toBe('center bottom');
      expect(transformOrigin('right', 'center')).toBe('left center');
      expect(transformOrigin('left', 'center')).toBe('right center');
    });

    it('follows the alignment along the other axis', () => {
      expect(transformOrigin('bottom', 'start')).toBe('left top');
      expect(transformOrigin('bottom', 'end')).toBe('right top');
      expect(transformOrigin('right', 'start')).toBe('left top');
      expect(transformOrigin('right', 'end')).toBe('left bottom');
    });

    /** `start` is the left edge in one direction and the right edge in the other. */
    it('mirrors the alignment of a vertical side in a right-to-left document', () => {
      expect(transformOrigin('bottom', 'start', 'rtl')).toBe('right top');
      expect(transformOrigin('bottom', 'end', 'rtl')).toBe('left top');
    });

    it('leaves the alignment of a horizontal side alone in either direction', () => {
      expect(transformOrigin('right', 'start', 'rtl')).toBe('left top');
    });

    it('grows from the arrow tip where there is an arrow', () => {
      expect(transformOrigin('bottom', 'start', 'ltr', { x: 20, width: 8, height: 8 })).toBe(
        '24px top',
      );
      expect(transformOrigin('right', 'start', 'ltr', { y: 30, width: 8, height: 8 })).toBe(
        'left 34px',
      );
    });
  });
});

/**
 * `docs/component-features.md` §3: the contract exposes neither Floating UI nor
 * any other engine. Types vanish at run time, so what can be held is the
 * surface itself — the engine is replaceable exactly as long as nothing of it
 * has leaked into this list.
 */
describe('the public surface', () => {
  it('is its own, and holds nothing of the engine', async () => {
    const engine = await import('@floating-ui/dom');

    expect(Object.keys(surface).sort()).toEqual([
      'POSITIONER_PROPERTIES',
      'createPositioner',
      'fromPlacement',
      'isVertical',
      'oppositeSide',
      'resolveSide',
      'submenuOffsets',
      'toPlacement',
      'transformOrigin',
    ]);
    for (const exported of Object.keys(engine)) {
      expect(surface).not.toHaveProperty(exported);
    }
  });
});

describe('submenuOffsets', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function surfaces() {
    document.body.innerHTML =
      '<div id="parent"><button id="item"></button></div><div id="surface"><button data-part="item" data-part-item="" id="first"></button></div>';
    const parent = document.getElementById('parent') as HTMLElement;
    const item = document.getElementById('item') as HTMLElement;
    const surface = document.getElementById('surface') as HTMLElement;
    const first = document.getElementById('first') as HTMLElement;
    return { parent, item, surface, first };
  }

  it('moves the submenu out to the parent edge and its first item up to the item that opened it', () => {
    const { parent, item, surface, first } = surfaces();
    rect(parent, { x: 0, y: 0, width: 200, height: 120 });
    rect(item, { x: 5, y: 40, width: 190, height: 32 });
    rect(surface, { x: 0, y: 0, width: 160, height: 90 });
    rect(first, { x: 5, y: 5, width: 150, height: 32 });

    expect(submenuOffsets({ parentSurface: parent, item, surface })).toEqual({
      sideOffset: 5,
      alignOffset: -5,
    });
  });

  it('adds nothing for a menu with no parent and a surface with no items', () => {
    const { item, surface, first } = surfaces();
    first.remove();
    rect(item, { x: 5, y: 40, width: 190, height: 32 });
    rect(surface, { x: 0, y: 0, width: 160, height: 90 });

    expect(submenuOffsets({ parentSurface: null, item, surface })).toEqual({
      sideOffset: 0,
      alignOffset: 0,
    });
  });
});

describe('createPositioner', () => {
  beforeEach(() => {
    viewport();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  /**
   * Every measurement walks the anchor's scrolling ancestors and reads a style
   * from each, so its cost grows with the depth of the anchor: a trigger in a
   * table cell has six more ancestors than one in the page. The first watch and
   * the family's own first `update()` arrive in the same task, and one
   * measurement answers both.
   */
  it('measures once for every request made in the same task', async () => {
    const { anchor, floating } = scene(ANCHOR);
    let reads = 0;
    const read = anchor.getBoundingClientRect.bind(anchor);
    anchor.getBoundingClientRect = () => {
      reads += 1;
      return read();
    };

    const positioner = createPositioner(anchor, floating);
    await Promise.all([positioner.update(), positioner.update()]);
    const opening = reads;

    reads = 0;
    await positioner.update();
    expect(opening).toBe(reads);
    expect(floating.style.top).toBe('120px');
    positioner.destroy();
  });

  it('places the layer under its anchor and says where it went', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);

    await positioner.update();

    expect(floating.style.position).toBe('absolute');
    expect(floating.style.top).toBe('120px');
    expect(floating.style.left).toBe('25px');
    expect(floating.getAttribute('data-side')).toBe('bottom');
    expect(floating.getAttribute('data-align')).toBe('center');
    positioner.destroy();
  });

  it('marks the layer as positioned once it has been placed, and not before', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);
    expect(floating.hasAttribute('data-positioned')).toBe(false);

    await positioner.update();

    expect(floating.hasAttribute('data-positioned')).toBe(true);
    positioner.destroy();
  });

  it('leaves the transform alone for the family that animates with it', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);

    await positioner.update();

    expect(floating.style.transform).toBe('');
    positioner.destroy();
  });

  it('keeps the offsets the consumer asked for', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating, { sideOffset: 8, alignOffset: 4 });

    await positioner.update();

    expect(floating.style.top).toBe('128px');
    positioner.destroy();
  });

  it('flips to the opposite side when this one has no room', async () => {
    const { anchor, floating } = scene({ ...ANCHOR, y: 700 });
    const positioner = createPositioner(anchor, floating);

    await positioner.update();

    expect(floating.getAttribute('data-side')).toBe('top');
    expect(floating.style.top).toBe('620px');
    positioner.destroy();
  });

  it('stays on its side when the consumer refuses the flip', async () => {
    const { anchor, floating } = scene({ ...ANCHOR, y: 700 });
    const positioner = createPositioner(anchor, floating, { flip: false });

    await positioner.update();

    expect(floating.getAttribute('data-side')).toBe('bottom');
    positioner.destroy();
  });

  /** Flipping alone leaves a wide layer clipped at the inline edge. */
  it('slides along the side to stay inside the boundary', async () => {
    const { anchor, floating } = scene({ ...ANCHOR, x: 0 });
    const positioner = createPositioner(anchor, floating);

    await positioner.update();

    expect(floating.style.left).toBe('0px');
    positioner.destroy();
  });

  it('does not slide when the consumer refuses it', async () => {
    const { anchor, floating } = scene({ ...ANCHOR, x: 0 });
    const positioner = createPositioner(anchor, floating, { shift: false });

    await positioner.update();

    expect(floating.style.left).toBe('-75px');
    positioner.destroy();
  });

  it('resolves a logical side against the direction the layer is written in', async () => {
    document.body.innerHTML =
      '<div dir="rtl"><button id="anchor"></button><div id="floating"></div></div>';
    const anchor = document.getElementById('anchor') as HTMLElement;
    const floating = document.getElementById('floating') as HTMLElement;
    rect(anchor, { x: 400, y: 300, width: 50, height: 20 });
    sized(floating, 100, 40);

    const positioner = createPositioner(anchor, floating, { side: 'inline-start' });
    await positioner.update();

    expect(floating.getAttribute('data-side')).toBe('right');
    positioner.destroy();
  });

  describe('what the stylesheet is told', () => {
    it('publishes the anchor size, so a layer can be the width of its input', async () => {
      const { anchor, floating } = scene(ANCHOR);
      const positioner = createPositioner(anchor, floating);

      await positioner.update();

      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.anchorWidth)).toBe('50px');
      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.anchorHeight)).toBe('20px');
      positioner.destroy();
    });

    it('publishes the space that is left, so a menu can scroll instead of overflow', async () => {
      const { anchor, floating } = scene(ANCHOR);
      const positioner = createPositioner(anchor, floating);

      await positioner.update();

      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.availableHeight)).toBe('648px');
      positioner.destroy();
    });

    it('publishes the origin an animation grows from', async () => {
      const { anchor, floating } = scene(ANCHOR);
      const positioner = createPositioner(anchor, floating, { align: 'start' });

      await positioner.update();

      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.transformOrigin)).toBe(
        'left top',
      );
      positioner.destroy();
    });

    it('publishes where the arrow goes, and moves the arrow itself nowhere', async () => {
      const { anchor, floating } = scene(ANCHOR);
      const arrow = document.createElement('span');
      sized(arrow, 8, 8);
      floating.append(arrow);

      const positioner = createPositioner(anchor, floating, { arrow });
      await positioner.update();

      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.arrowX)).toMatch(/px$/);
      expect(arrow.style.left).toBe('');
      positioner.destroy();
    });
  });

  /**
   * SL1 and P1. A layer as wide as its anchor is placed inside a clipping
   * container that leaves no room for the boundary padding on either side.
   * The shift middleware resolved the start edge first and slid the layer past
   * its anchor; the layer then overflowed the container, a hover scrolled the
   * container to reveal the option, the anchor moved and the positioner slid
   * the layer again. Every hover moved the popup one step further from the
   * control it belongs to.
   */
  describe('a layer as wide as its anchor', () => {
    const CONTAINER = { x: 0, y: 0, width: 400, height: 300 };
    const FIELD = { x: 1, y: 40, width: 398, height: 32 };

    function clippedScene() {
      document.body.innerHTML =
        '<div id="container"><button id="anchor"></button><div id="floating"></div></div>';
      const container = document.getElementById('container') as HTMLElement;
      const anchor = document.getElementById('anchor') as HTMLElement;
      const floating = document.getElementById('floating') as HTMLElement;
      container.style.position = 'relative';
      container.style.overflow = 'hidden';
      rect(container, CONTAINER);
      for (const [name, value] of Object.entries({
        clientWidth: CONTAINER.width,
        clientHeight: CONTAINER.height,
        clientLeft: 0,
        clientTop: 0,
      })) {
        Object.defineProperty(container, name, { get: () => value, configurable: true });
      }
      rect(anchor, FIELD);
      sized(floating, FIELD.width, 120);
      return { container, anchor, floating };
    }

    it('sits on the anchor rather than on the boundary padding', async () => {
      const { anchor, floating } = clippedScene();
      const positioner = createPositioner(anchor, floating, {
        align: 'start',
        boundaryPadding: 8,
        matchWidth: true,
      });

      await positioner.update();

      expect(floating.style.left).toBe(`${FIELD.x}px`);
      expect(floating.style.getPropertyValue(POSITIONER_PROPERTIES.anchorWidth)).toBe(
        `${FIELD.width}px`,
      );
      positioner.destroy();
    });

    it('lands in the same place on every measurement, whatever a hover scrolls', async () => {
      const { anchor, floating } = clippedScene();
      const positioner = createPositioner(anchor, floating, {
        align: 'start',
        boundaryPadding: 8,
        matchWidth: true,
      });
      const field = { ...FIELD };
      const positions: string[] = [];

      for (let step = 0; step < 10; step += 1) {
        await positioner.update();
        positions.push(floating.style.left);
        /**
         * What the page does between two measurements: a highlighted option
         * is scrolled into view, and a container the layer overflows scrolls
         * by the overflow, which carries the anchor with it.
         */
        const overflow = parseFloat(floating.style.left) + FIELD.width - CONTAINER.width;
        if (overflow > 0) {
          field.x -= overflow;
          rect(anchor, field);
        }
      }

      expect(positions).toEqual(Array.from({ length: 10 }, () => `${FIELD.x}px`));
      positioner.destroy();
    });

    it('centers a frame wider than the anchor, so the panel inside it shares the anchor edge', async () => {
      const { anchor, floating } = clippedScene();
      sized(floating, FIELD.width + 16, 120);
      const positioner = createPositioner(anchor, floating, {
        align: 'start',
        boundaryPadding: 8,
        matchWidth: true,
      });

      await positioner.update();

      expect(floating.style.left).toBe(`${FIELD.x - 8}px`);
      expect(floating.getAttribute('data-align')).toBe('start');
      positioner.destroy();
    });

    it('still slides along a side the width does not run along', async () => {
      const { anchor, floating } = clippedScene();
      rect(anchor, { ...FIELD, y: 250 });
      sized(floating, 100, 120);
      const positioner = createPositioner(anchor, floating, {
        align: 'start',
        boundaryPadding: 8,
        flip: false,
        matchWidth: true,
        side: 'right',
      });

      await positioner.update();

      /* 250 + 120 runs past 300 − 8, so the layer slides up to 172. */
      expect(floating.style.top).toBe('172px');
      positioner.destroy();
    });
  });

  describe('an anchor that is no longer there', () => {
    it('reports the anchor scrolled out of its clipper', async () => {
      const { anchor, floating } = scene({ ...ANCHOR, y: -400 });
      const positioner = createPositioner(anchor, floating, { hideWhenDetached: true });

      await positioner.update();

      expect(floating.hasAttribute('data-detached')).toBe(true);
      positioner.destroy();
    });

    it('says nothing about it unless the family asked', async () => {
      const { anchor, floating } = scene({ ...ANCHOR, y: -400 });
      const positioner = createPositioner(anchor, floating);

      await positioner.update();

      expect(floating.hasAttribute('data-detached')).toBe(false);
      positioner.destroy();
    });

    /** A row deleted under an open menu. The node cannot come back as itself. */
    it('stops measuring an anchor that left the document', async () => {
      const { anchor, floating } = scene(ANCHOR);
      const positioner = createPositioner(anchor, floating);
      await positioner.update();

      anchor.remove();
      floating.style.top = '999px';
      await positioner.update();

      expect(floating.hasAttribute('data-detached')).toBe(true);
      expect(floating.style.top).toBe('999px');
      positioner.destroy();
    });
  });

  it('measures the anchor the consumer swapped in', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);
    await positioner.update();

    positioner.setAnchor({
      getBoundingClientRect: () =>
        ({ ...anchor.getBoundingClientRect(), y: 300, top: 300, bottom: 320 }) as DOMRect,
    });
    await positioner.update();

    expect(floating.style.top).toBe('320px');
    positioner.destroy();
  });

  it('takes a new option without being rebuilt', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);
    await positioner.update();

    positioner.setOptions({ side: 'top' });
    await positioner.update();

    expect(floating.getAttribute('data-side')).toBe('top');
    positioner.destroy();
  });

  it('reports the resolved position to the consumer', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const onPositioned = vi.fn();
    const positioner = createPositioner(anchor, floating, { onPositioned });

    await positioner.update();

    expect(onPositioned).toHaveBeenCalledWith(
      expect.objectContaining({
        side: 'bottom',
        align: 'center',
        anchorWidth: 50,
        detached: false,
      }),
    );
    positioner.destroy();
  });

  it('writes nothing once it is destroyed', async () => {
    const { anchor, floating } = scene(ANCHOR);
    const positioner = createPositioner(anchor, floating);
    await positioner.update();

    positioner.destroy();
    floating.style.top = '999px';
    await positioner.update();

    expect(floating.style.top).toBe('999px');
  });
});
