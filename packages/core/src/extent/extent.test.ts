import { describe, expect, it } from 'vitest';

import {
  anchorsAtStart,
  EXTENT_LARGE_STEP_PX,
  EXTENT_STEP_PX,
  holdResizeGesture,
  stepAmountFromPixels,
  extentBounds,
  extentAtPoint,
  extentFromLength,
  extentVelocity,
  isInlineSide,
  measureLength,
  nearestSnap,
  orderSnapPoints,
  projectExtent,
  stepExtent,
} from './index';

/** A 400 × 200 layer whose top-left corner is at the origin. */
const rect = { x: 0, y: 0, width: 400, height: 200 };

describe('isInlineSide', () => {
  it('names the two sides the reading direction can mirror', () => {
    expect(isInlineSide('start')).toBe(true);
    expect(isInlineSide('end')).toBe(true);
    expect(isInlineSide('top')).toBe(false);
    expect(isInlineSide('bottom')).toBe(false);
  });
});

describe('anchorsAtStart', () => {
  it('reads start and end against the document direction', () => {
    expect(anchorsAtStart('start')).toBe(true);
    expect(anchorsAtStart('start', true)).toBe(false);
    expect(anchorsAtStart('end')).toBe(false);
    expect(anchorsAtStart('end', true)).toBe(true);
  });

  /** A block axis has no reading direction, so the two sides never swap. */
  it('leaves the block sides alone', () => {
    expect(anchorsAtStart('top')).toBe(true);
    expect(anchorsAtStart('top', true)).toBe(true);
    expect(anchorsAtStart('bottom')).toBe(false);
    expect(anchorsAtStart('bottom', true)).toBe(false);
  });
});

describe('extentAtPoint', () => {
  it('measures an end panel from the far edge, so dragging inward grows it', () => {
    expect(extentAtPoint({ point: { x: 300, y: 0 }, rect, side: 'end' })).toBe(0.25);
    expect(extentAtPoint({ point: { x: 100, y: 0 }, rect, side: 'end' })).toBe(0.75);
  });

  it('measures a start panel from the near edge', () => {
    expect(extentAtPoint({ point: { x: 100, y: 0 }, rect, side: 'start' })).toBe(0.25);
  });

  /**
   * `start` is the left edge in a left-to-right document and the right edge in
   * a mirrored one, so the same pointer position names the opposite fraction.
   */
  it('swaps the two inline sides in a mirrored document', () => {
    expect(extentAtPoint({ point: { x: 100, y: 0 }, rect, rtl: true, side: 'start' })).toBe(0.75);
    expect(extentAtPoint({ point: { x: 100, y: 0 }, rect, rtl: true, side: 'end' })).toBe(0.25);
  });

  it('leaves the block sides alone in a mirrored document', () => {
    const ltr = extentAtPoint({ point: { x: 0, y: 50 }, rect, side: 'bottom' });
    const rtl = extentAtPoint({ point: { x: 0, y: 50 }, rect, rtl: true, side: 'bottom' });
    expect(ltr).toBe(0.75);
    expect(rtl).toBe(ltr);
  });

  it('measures a top panel down and a bottom panel up', () => {
    expect(extentAtPoint({ point: { x: 0, y: 50 }, rect, side: 'top' })).toBe(0.25);
    expect(extentAtPoint({ point: { x: 0, y: 150 }, rect, side: 'bottom' })).toBe(0.25);
  });

  it('counts from the layer rather than from the viewport', () => {
    const offset = { x: 100, y: 40, width: 400, height: 200 };
    expect(extentAtPoint({ point: { x: 200, y: 0 }, rect: offset, side: 'start' })).toBe(0.25);
  });

  it('holds the fraction inside its own range when the pointer leaves the layer', () => {
    expect(extentAtPoint({ point: { x: -800, y: 0 }, rect, side: 'start' })).toBe(0);
    expect(extentAtPoint({ point: { x: 900, y: 0 }, rect, side: 'start' })).toBe(1);
  });

  /** A layer with no width has no fraction, and a division by zero is not one. */
  it('answers nought for a layer that has not been laid out', () => {
    const empty = { x: 0, y: 0, width: 0, height: 0 };
    expect(extentAtPoint({ point: { x: 10, y: 10 }, rect: empty, side: 'end' })).toBe(0);
    expect(extentAtPoint({ point: { x: 10, y: 10 }, rect: empty, side: 'top' })).toBe(0);
  });
});

describe('orderSnapPoints', () => {
  it('sorts, deduplicates and drops anything outside the layer', () => {
    expect(orderSnapPoints([0.9, 0.25, 0.25, 1.4, -0.2, 0])).toEqual([0, 0.25, 0.9]);
  });

  it('leaves the caller’s array alone', () => {
    const points = [0.8, 0.2];
    orderSnapPoints(points);
    expect(points).toEqual([0.8, 0.2]);
  });
});

describe('nearestSnap', () => {
  it('lands on the closest stop', () => {
    expect(nearestSnap(0.34, [0.25, 0.5, 1])).toBe(0.25);
    expect(nearestSnap(0.4, [0.25, 0.5, 1])).toBe(0.5);
  });

  /** No stops is a continuous range, not an empty one. */
  it('leaves a fraction alone when there is nothing to land on', () => {
    expect(nearestSnap(0.37, [])).toBe(0.37);
  });
});

describe('stepExtent', () => {
  const range = { min: 0.2, max: 1 };

  it('moves by the amount given when the range is continuous', () => {
    expect(stepExtent({ ...range, amount: 0.05, direction: 1, fraction: 0.5 })).toBe(0.55);
    expect(stepExtent({ ...range, amount: 0.05, direction: -1, fraction: 0.5 })).toBe(0.45);
  });

  it('holds the result inside the limits', () => {
    expect(stepExtent({ ...range, amount: 0.5, direction: 1, fraction: 0.9 })).toBe(1);
    expect(stepExtent({ ...range, amount: 0.5, direction: -1, fraction: 0.3 })).toBe(0.2);
  });

  it('moves to the adjacent stop rather than by the amount', () => {
    const snapPoints = [0.25, 0.5, 1];
    expect(stepExtent({ ...range, amount: 0.05, direction: 1, fraction: 0.25, snapPoints })).toBe(
      0.5,
    );
    expect(stepExtent({ ...range, amount: 0.05, direction: -1, fraction: 0.5, snapPoints })).toBe(
      0.25,
    );
  });

  /**
   * A drag can end between two stops. The next press goes to the stop it is
   * travelling toward rather than skipping one, so the pointer and the keyboard
   * never disagree about where the panel is.
   */
  it('takes the stop it is travelling toward from between two of them', () => {
    const snapPoints = [0.25, 0.5, 1];
    expect(stepExtent({ ...range, amount: 0.05, direction: 1, fraction: 0.37, snapPoints })).toBe(
      0.5,
    );
    expect(stepExtent({ ...range, amount: 0.05, direction: -1, fraction: 0.37, snapPoints })).toBe(
      0.25,
    );
  });

  it('stays where it is at the last stop in the direction of travel', () => {
    const snapPoints = [0.25, 0.5, 1];
    expect(stepExtent({ ...range, amount: 0.05, direction: 1, fraction: 1, snapPoints })).toBe(1);
    expect(stepExtent({ ...range, amount: 0.05, direction: -1, fraction: 0.25, snapPoints })).toBe(
      0.25,
    );
  });

  it('ignores a stop the limits put out of reach', () => {
    expect(
      stepExtent({
        amount: 0.05,
        direction: -1,
        fraction: 0.5,
        max: 1,
        min: 0.4,
        snapPoints: [0.1, 0.5, 1],
      }),
    ).toBe(0.5);
  });
});

describe('extentBounds', () => {
  it('takes the limits as given when the range is continuous', () => {
    expect(extentBounds([], 0.2, 0.8)).toEqual({ min: 0.2, max: 0.8 });
  });

  /** A range whose ends no stop can reach has two values nothing produces. */
  it('takes the first and last stop as the limits', () => {
    expect(extentBounds([0.5, 0.25, 1], 0.1, 0.9)).toEqual({ min: 0.25, max: 1 });
  });

  it('holds a limit inside the layer', () => {
    expect(extentBounds([], -1, 4)).toEqual({ min: 0, max: 1 });
  });
});

describe('stepAmountFromPixels', () => {
  const rect = { x: 0, y: 0, width: 1200, height: 800 };

  it('reads a keyboard step as a distance and not as a proportion', () => {
    expect(stepAmountFromPixels({ pixels: EXTENT_STEP_PX, rect, side: 'end' })).toBeCloseTo(
      16 / 1200,
    );
    expect(stepAmountFromPixels({ pixels: EXTENT_LARGE_STEP_PX, rect, side: 'end' })).toBeCloseTo(
      64 / 1200,
    );
  });

  it('measures a block side against the block axis', () => {
    expect(stepAmountFromPixels({ pixels: EXTENT_STEP_PX, rect, side: 'bottom' })).toBeCloseTo(
      16 / 800,
    );
  });

  /** Sixteen pixels and sixty-four, which is what the two presses move. */
  it('states the two distances the pattern moves by', () => {
    expect(EXTENT_STEP_PX).toBe(16);
    expect(EXTENT_LARGE_STEP_PX).toBe(64);
  });

  it('answers nought for a layer with no size to measure against', () => {
    expect(stepAmountFromPixels({ pixels: 16, rect: { ...rect, width: 0 }, side: 'end' })).toBe(0);
  });
});

describe('holdResizeGesture', () => {
  /**
   * The cursor has to survive the pointer leaving the separator, and a drag
   * across text must not select it. Both are the document's, not the family's.
   */
  it('holds the cursor and suspends selection, and puts back what was there', () => {
    document.body.style.cursor = 'progress';
    const release = holdResizeGesture(document, 'col-resize');

    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.documentElement.style.userSelect).toBe('none');

    release();
    expect(document.body.style.cursor).toBe('progress');
    expect(document.documentElement.style.userSelect).toBe('');
    document.body.style.cursor = '';
  });

  it('releases once, however many times it is asked', () => {
    const release = holdResizeGesture(document, 'row-resize');
    release();
    document.body.style.cursor = 'progress';
    release();
    expect(document.body.style.cursor).toBe('progress');
    document.body.style.cursor = '';
  });

  it('answers a document it has not got with a release that does nothing', () => {
    expect(() => holdResizeGesture(undefined, 'col-resize')()).not.toThrow();
  });
});

describe('extentFromLength', () => {
  it('answers the share of the span a length takes', () => {
    expect(extentFromLength({ pixels: 200, span: 800 })).toBe(0.25);
  });

  /**
   * The case the family exists for: a two-hundred-pixel floor in a container
   * narrower than two hundred pixels. Every surveyed splitter is percentage-only
   * and cannot reach this question at all.
   */
  it('clamps a floor larger than the container to one rather than past it', () => {
    expect(extentFromLength({ pixels: 200, span: 160 })).toBe(1);
  });

  it('clamps a negative length to nought', () => {
    expect(extentFromLength({ pixels: -40, span: 800 })).toBe(0);
  });

  /** A container with no measure answers nought, never infinity. */
  it('answers a span it has not got with nought', () => {
    expect(extentFromLength({ pixels: 200, span: 0 })).toBe(0);
    expect(extentFromLength({ pixels: 200, span: -1 })).toBe(0);
  });
});

describe('measureLength', () => {
  /**
   * jsdom performs no layout, so `getBoundingClientRect` answers nought here
   * for every length and the number this function returns cannot be asserted in
   * this environment. What can be asserted is the decision the function is
   * *for*: the probe carries the consumer's value verbatim and is measured
   * inside the element it was given, which is what makes `25%`, `em` and `rem`
   * resolve the way the consumer's own stylesheet resolves them. A probe
   * measured in the document would answer a percentage of the page.
   *
   * The resolved number is exercised where there is layout: the harness page at
   * `tools/harness/out/splitter.html` and both reference pages.
   */
  it('measures inside the element it was given, carrying the value verbatim', () => {
    const host = document.createElement('div');
    document.body.append(host);

    let measured: HTMLElement | undefined;
    const append = host.append.bind(host);
    host.append = (...nodes: (Node | string)[]) => {
      measured = nodes[0] as HTMLElement;
      append(...nodes);
    };

    measureLength('18rem', host);

    expect(measured?.style.inlineSize).toBe('18rem');
    expect(measured?.parentElement).toBe(null);
    host.remove();
  });

  it('leaves nothing behind in the element it measured in', () => {
    const host = document.createElement('div');
    document.body.append(host);
    measureLength('10rem', host);
    expect(host.childElementCount).toBe(0);
    host.remove();
  });

  it('takes the probe out of flow and out of sight while it is there', () => {
    const host = document.createElement('div');
    document.body.append(host);

    let measured: HTMLElement | undefined;
    const append = host.append.bind(host);
    host.append = (...nodes: (Node | string)[]) => {
      measured = nodes[0] as HTMLElement;
      append(...nodes);
    };

    measureLength('200px', host);

    expect(measured?.style.position).toBe('absolute');
    expect(measured?.style.visibility).toBe('hidden');
    expect(measured?.style.pointerEvents).toBe('none');
    host.remove();
  });

  /**
   * A probe out of flow resolves a percentage against its containing block,
   * the nearest positioned ancestor, and not against the element it was put in:
   * "25%" and "calc(100% - 36rem)" of a splitter's container came out against
   * whatever box happened to be positioned above it. Given the length a
   * percentage is of, the probe is measured inside a box of that length.
   */
  it('resolves a percentage against the basis it is given', () => {
    const host = document.createElement('div');
    document.body.append(host);

    let wrapper: HTMLElement | undefined;
    const append = host.append.bind(host);
    host.append = (...nodes: (Node | string)[]) => {
      wrapper = nodes[0] as HTMLElement;
      append(...nodes);
    };

    measureLength('calc(100% - 36rem)', host, 1000);

    expect(wrapper?.style.position).toBe('absolute');
    expect(wrapper?.style.inlineSize).toBe('1000px');
    const probe = wrapper?.firstElementChild as HTMLElement | null;
    expect(probe?.style.inlineSize).toBe('calc(100% - 36rem)');
    expect(probe?.style.position).toBe('');
    expect(host.childElementCount).toBe(0);
    host.remove();
  });
});

describe('extentVelocity', () => {
  it('answers fractions per second from the last three samples', () => {
    const samples = [
      { fraction: 0.2, at: 0 },
      { fraction: 0.3, at: 100 },
      { fraction: 0.4, at: 200 },
    ];
    expect(extentVelocity(samples)).toBeCloseTo(1);
  });

  /**
   * The case three samples exist for. A hand that flicks and then rests for one
   * frame before lifting meant to end where it is; a two-sample reading would
   * report that pause as the whole gesture and lose the flick before it, and a
   * longer window would report the flick and ignore the pause.
   */
  it('keeps a pause before the release honest without erasing the flick', () => {
    const flicked = extentVelocity([
      { fraction: 0.2, at: 0 },
      { fraction: 0.5, at: 60 },
      { fraction: 0.5, at: 80 },
    ]);
    expect(flicked).toBeGreaterThan(0);
    expect(flicked).toBeCloseTo(((0.5 - 0.2) / 80) * 1000);
  });

  it('falls back to no velocity when a stream delivered too little', () => {
    expect(extentVelocity([])).toBe(0);
    expect(extentVelocity([{ fraction: 0.4, at: 10 }])).toBe(0);
  });

  /** Two samples in the same millisecond are a division by nought. */
  it('answers nought rather than infinity for samples with no time between them', () => {
    expect(
      extentVelocity([
        { fraction: 0.2, at: 40 },
        { fraction: 0.6, at: 40 },
      ]),
    ).toBe(0);
  });
});

describe('projectExtent', () => {
  it('looks ahead by the horizon at the velocity given', () => {
    expect(projectExtent({ fraction: 0.4, velocity: 1, horizon: 0.15 })).toBeCloseTo(0.55);
  });

  /**
   * The whole reason it exists: a short fast flick reaches the stop the hand
   * was aiming at, where the instantaneous position would have missed it.
   */
  it('carries a short fast flick past the stop the instant position would take', () => {
    const instant = 0.42;
    const projected = projectExtent({ fraction: instant, velocity: -2 });
    expect(projected).toBeLessThan(0.2);
  });

  it('stands still when the hand did', () => {
    expect(projectExtent({ fraction: 0.4, velocity: 0 })).toBe(0.4);
  });

  it('projects to the end of the range and never past it', () => {
    expect(projectExtent({ fraction: 0.9, velocity: 40 })).toBe(1);
    expect(projectExtent({ fraction: 0.1, velocity: -40 })).toBe(0);
  });
});
