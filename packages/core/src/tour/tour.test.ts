import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  cardFits,
  keepOverTarget,
  compactSide,
  isTextEntry,
  resolveStep,
  resolveTarget,
  tourKey,
  tourProgress,
  watchTarget,
  writeTargetRect,
} from './index';
import type { TourStepShape } from './index';

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

function target(id: string): HTMLElement {
  const node = document.createElement('button');
  node.id = id;
  document.body.append(node);
  return node;
}

describe('resolveTarget', () => {
  it('reads an element, a selector, a ref and a function', () => {
    const node = target('share');
    expect(resolveTarget(node)).toBe(node);
    expect(resolveTarget('#share')).toBe(node);
    expect(resolveTarget({ current: node })).toBe(node);
    expect(resolveTarget(() => node)).toBe(node);
  });

  it('answers null for an absent target, an unmatched selector and a detached element', () => {
    expect(resolveTarget(undefined)).toBeNull();
    expect(resolveTarget('#nothing')).toBeNull();
    expect(resolveTarget(document.createElement('div'))).toBeNull();
  });

  /** A selector a consumer mistyped is a missing target, not a thrown error on the page. */
  it('answers null for a selector the document refuses', () => {
    expect(resolveTarget('[[')).toBeNull();
  });
});

describe('tourProgress', () => {
  const steps: TourStepShape[] = [
    { id: 'a' },
    { id: 'b', when: () => false },
    { id: 'c' },
    { id: 'd' },
  ];

  it('counts only the steps that are available', () => {
    expect(tourProgress(steps, 'c')).toEqual({ position: 2, total: 3, first: false, last: false });
    expect(tourProgress(steps, 'a')).toMatchObject({ position: 1, first: true });
    expect(tourProgress(steps, 'd')).toMatchObject({ position: 3, last: true });
  });

  it('answers position zero for a step it does not hold', () => {
    expect(tourProgress(steps, 'zz')).toEqual({ position: 0, total: 3, first: false, last: false });
  });
});

describe('tourKey', () => {
  it('maps the arrows to next and previous, and mirrors them right to left', () => {
    expect(tourKey('ArrowRight', 'ltr')).toBe('next');
    expect(tourKey('ArrowLeft', 'ltr')).toBe('prev');
    expect(tourKey('ArrowRight', 'rtl')).toBe('prev');
    expect(tourKey('ArrowLeft', 'rtl')).toBe('next');
    expect(tourKey('ArrowDown', 'ltr')).toBeNull();
  });
});

describe('isTextEntry', () => {
  it('tells a field an arrow moves the caret in from a button', () => {
    const input = document.createElement('input');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    expect(isTextEntry(input)).toBe(true);
    expect(isTextEntry(document.createElement('textarea'))).toBe(true);
    expect(isTextEntry(editable)).toBe(true);
    expect(isTextEntry(checkbox)).toBe(false);
    expect(isTextEntry(document.createElement('button'))).toBe(false);
    expect(isTextEntry(null)).toBe(false);
  });
});

describe('resolveStep', () => {
  it('goes forward past a step whose condition is false', async () => {
    target('a');
    target('c');
    const steps: TourStepShape[] = [
      { id: 'a', target: '#a' },
      { id: 'b', target: '#a', when: () => false },
      { id: 'c', target: '#c' },
    ];
    const result = await resolveStep(steps, { from: 'a', direction: 1 });
    expect(result?.step.id).toBe('c');
    expect(result?.target?.id).toBe('c');
    expect(result?.missing).toBe(false);
  });

  it('goes backward past a step whose condition is false', async () => {
    const steps: TourStepShape[] = [{ id: 'a' }, { id: 'b', when: () => false }, { id: 'c' }];
    const result = await resolveStep(steps, { from: 'c', direction: -1 });
    expect(result?.step.id).toBe('a');
  });

  it('starts at the first available step when there is nowhere to start from', async () => {
    const steps: TourStepShape[] = [{ id: 'a', when: () => false }, { id: 'b' }];
    expect((await resolveStep(steps, { from: null, direction: 1 }))?.step.id).toBe('b');
  });

  it('lands exactly on a named step, and on the next available one when it is unavailable', async () => {
    const steps: TourStepShape[] = [{ id: 'a' }, { id: 'b', when: () => false }, { id: 'c' }];
    expect((await resolveStep(steps, { at: 'a', direction: 1 }))?.step.id).toBe('a');
    expect((await resolveStep(steps, { at: 'b', direction: 1 }))?.step.id).toBe('c');
  });

  it('answers null when no step is left in that direction', async () => {
    const steps: TourStepShape[] = [{ id: 'a' }, { id: 'b', when: () => false }];
    expect(await resolveStep(steps, { from: 'a', direction: 1 })).toBeNull();
    expect(await resolveStep(steps, { from: 'a', direction: -1 })).toBeNull();
  });

  it('shows a step without a target centerd, and is not missing anything', async () => {
    const result = await resolveStep([{ id: 'welcome' }], { from: null, direction: 1 });
    expect(result).toMatchObject({ target: null, missing: false });
  });

  it('centers a step whose target cannot be found, under the center policy', async () => {
    const result = await resolveStep([{ id: 'a', target: '#gone' }], {
      from: null,
      direction: 1,
      missing: 'center',
    });
    expect(result).toMatchObject({ target: null, missing: true });
  });

  it('passes over a step whose target cannot be found, under the skip policy', async () => {
    target('c');
    const steps: TourStepShape[] = [
      { id: 'a', target: '#gone' },
      { id: 'c', target: '#c' },
    ];
    const result = await resolveStep(steps, { from: null, direction: 1, missing: 'skip' });
    expect(result?.step.id).toBe('c');
  });

  it('waits for a target that arrives inside the timeout', async () => {
    setTimeout(() => target('late'), 20);
    const result = await resolveStep([{ id: 'a', target: '#late' }], {
      from: null,
      direction: 1,
      targetTimeout: 500,
    });
    expect(result?.target?.id).toBe('late');
    expect(result?.missing).toBe(false);
  });

  it('gives up on a target that does not arrive inside the timeout', async () => {
    const result = await resolveStep([{ id: 'a', target: '#never' }], {
      from: null,
      direction: 1,
      targetTimeout: 30,
    });
    expect(result?.missing).toBe(true);
  });

  it('awaits prepare before looking for the target, so prepare can render it', async () => {
    const prepare = vi.fn(async (signal: AbortSignal) => {
      if (!signal.aborted) target('drawn');
    });
    const result = await resolveStep([{ id: 'a', target: '#drawn', prepare }], {
      from: null,
      direction: 1,
    });
    expect(prepare).toHaveBeenCalledOnce();
    expect(prepare.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
    expect(result?.target?.id).toBe('drawn');
  });

  it('treats a prepare that rejects as a missing target', async () => {
    const result = await resolveStep(
      [{ id: 'a', target: '#a', prepare: () => Promise.reject(new Error('offline')) }],
      { from: null, direction: 1 },
    );
    expect(result).toMatchObject({ missing: true, target: null });
  });

  it('answers null once the navigation is aborted', async () => {
    const controller = new AbortController();
    const pending = resolveStep([{ id: 'a', target: '#never' }], {
      from: null,
      direction: 1,
      targetTimeout: 1000,
      signal: controller.signal,
    });
    controller.abort();
    expect(await pending).toBeNull();
  });
});

describe('writeTargetRect', () => {
  it('writes the rectangle in pixels, and clears it', () => {
    const node = document.createElement('div');
    writeTargetRect(node, { x: 10, y: 20, width: 30, height: 40 });
    expect(node.style.getPropertyValue('--slotted-tour-target-x')).toBe('10px');
    expect(node.style.getPropertyValue('--slotted-tour-target-height')).toBe('40px');
    writeTargetRect(node, null);
    expect(node.style.getPropertyValue('--slotted-tour-target-x')).toBe('');
  });
});

describe('watchTarget', () => {
  it('reports the rectangle at once, and reports removal from the document', async () => {
    const node = target('watched');
    const onRect = vi.fn();
    const onRemoved = vi.fn();
    const stop = watchTarget(node, { onRect, onRemoved });
    expect(onRect).toHaveBeenCalledOnce();
    node.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onRemoved).toHaveBeenCalledOnce();
    stop();
  });
});

describe('compactSide', () => {
  it('turns a lateral side into a vertical one on a compact viewport, and leaves the rest', () => {
    expect(compactSide('inline-end', true)).toBe('bottom');
    expect(compactSide('left', true)).toBe('bottom');
    expect(compactSide('top', true)).toBe('top');
    expect(compactSide('inline-start', false)).toBe('inline-start');
  });
});

describe('cardFits', () => {
  const viewport = { width: 1280, height: 800 };

  it('finds room above, below or beside an ordinary target', () => {
    expect(cardFits({ x: 40, y: 40, width: 120, height: 36 }, viewport)).toBe(true);
    expect(cardFits({ x: 1200, y: 760, width: 60, height: 30 }, viewport)).toBe(true);
  });

  /** A target that fills the screen — a chart, a whole editor — leaves no side to stand on. */
  it('finds no room beside a target that fills the viewport', () => {
    expect(cardFits({ x: 0, y: 40, width: 1280, height: 740 }, viewport)).toBe(false);
  });

  it('measures only what is on screen of a target taller than the viewport', () => {
    expect(cardFits({ x: 0, y: -2000, width: 1280, height: 4000 }, viewport)).toBe(false);
  });

  it('asks for less room beside than above on a compact viewport', () => {
    const phone = { width: 375, height: 667 };
    expect(cardFits({ x: 0, y: 100, width: 375, height: 420 }, phone)).toBe(true);
    expect(cardFits({ x: 0, y: 40, width: 375, height: 600 }, phone)).toBe(false);
  });
});

describe('keepOverTarget', () => {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  /**
   * A dialog a step opened is drawn, and only then takes the stack: its layer
   * is added after the tour's and makes it inert a moment after the tour first
   * rose over it. The tour is raised again every time that happens.
   */
  it('raises the layer whenever a layer holding the target stands over it or makes it inert', async () => {
    document.body.innerHTML = '<div id="portals"><div id="tour"></div></div>';
    const portals = document.getElementById('portals') as HTMLElement;
    const tour = document.getElementById('tour') as HTMLElement;
    const dialog = document.createElement('div');
    dialog.innerHTML = '<input id="email" />';
    portals.append(dialog);
    const target = document.getElementById('email') as HTMLElement;

    let raised = 0;
    const raise = () => {
      raised += 1;
      portals.append(tour);
      tour.removeAttribute('inert');
    };
    const stop = keepOverTarget(tour, target, raise);
    expect(raised).toBe(1);
    expect(portals.lastElementChild).toBe(tour);

    tour.setAttribute('inert', '');
    await flush();
    expect(raised).toBe(2);
    expect(tour.hasAttribute('inert')).toBe(false);

    stop();
    tour.setAttribute('inert', '');
    await flush();
    expect(raised).toBe(2);
  });

  it('leaves a layer alone whose target is on the page under it', async () => {
    document.body.innerHTML =
      '<button id="page"></button><div id="portals"><div id="tour"></div></div>';
    let raised = 0;
    const stop = keepOverTarget(
      document.getElementById('tour') as HTMLElement,
      document.getElementById('page') as HTMLElement,
      () => (raised += 1),
    );
    await flush();
    expect(raised).toBe(0);
    stop();
  });
});
