import { describe, expect, it } from 'vitest';

import {
  clampZoom,
  fitScale,
  mediaKind,
  readableText,
  swipeIntent,
  TEXT_LIMIT,
  turned,
  wheelZoom,
  zoomAround,
} from './view';

describe('fitScale', () => {
  it('fits a wide picture to the stage width, whole', () => {
    expect(fitScale({ width: 2000, height: 1000 }, { width: 1440, height: 800 }, 0)).toBe(0.72);
  });

  it('never enlarges a picture smaller than the stage', () => {
    expect(fitScale({ width: 300, height: 200 }, { width: 1440, height: 800 }, 0)).toBe(1);
  });

  it('swaps the axes at a quarter turn', () => {
    expect(turned({ width: 800, height: 1200 }, 90)).toEqual({ width: 1200, height: 800 });
    expect(fitScale({ width: 800, height: 1200 }, { width: 600, height: 600 }, 90)).toBe(0.5);
  });

  it('answers 1 for a picture or a stage of no size', () => {
    expect(fitScale({ width: 0, height: 0 }, { width: 600, height: 600 }, 0)).toBe(1);
  });
});

describe('wheelZoom', () => {
  const step = 0.25;

  /** The finding's acceptance: twelve events of -25 pixels are three steps. */
  it('sums the distance of a trackpad gesture rather than counting its events', () => {
    let zoom = 1;
    for (let index = 0; index < 12; index++) {
      zoom = wheelZoom(zoom, { deltaY: -25, deltaMode: 0, ctrlKey: false }, step, 800);
    }

    expect(zoom).toBeCloseTo(1.75);
  });

  it('counts a line as sixteen pixels and a page as the stage', () => {
    expect(wheelZoom(1, { deltaY: -1, deltaMode: 1, ctrlKey: false }, step, 800)).toBeCloseTo(1.04);
    expect(wheelZoom(1, { deltaY: -1, deltaMode: 2, ctrlKey: false }, step, 800)).toBeCloseTo(3);
  });

  it('multiplies under a pinch, so the pinch is proportional at every level', () => {
    expect(wheelZoom(2, { deltaY: -100, deltaMode: 0, ctrlKey: true }, step, 800)).toBeCloseTo(4);
    expect(wheelZoom(2, { deltaY: 100, deltaMode: 0, ctrlKey: true }, step, 800)).toBeCloseTo(1);
  });

  it('is clamped by the caller', () => {
    expect(clampZoom(5, 1, 4)).toBe(4);
    expect(clampZoom(0.5, 1, 4)).toBe(1);
  });
});

describe('zoomAround', () => {
  it('keeps the point under the pointer over the same spot of the picture', () => {
    const before = { left: 100, top: 50, width: 400, height: 200 };
    const after = { left: 0, top: 0, width: 800, height: 400 };
    const point = { x: 300, y: 150 };
    const scroll = zoomAround(point, { x: 0, y: 0 }, before, after);

    /* The spot was half across and half down; it is there again, under the point. */
    expect((scroll.x + point.x - after.left) / after.width).toBeCloseTo(0.5);
    expect((scroll.y + point.y - after.top) / after.height).toBeCloseTo(0.5);
    expect(scroll).toEqual({ x: 100, y: 50 });
  });

  it('reads the scroll the stage already had', () => {
    const box = { left: 0, top: 0, width: 1000, height: 1000 };
    const after = { left: 0, top: 0, width: 2000, height: 2000 };

    expect(zoomAround({ x: 0, y: 0 }, { x: 200, y: 100 }, box, after)).toEqual({ x: 400, y: 200 });
  });
});

describe('swipeIntent', () => {
  it('steps to the next item when the finger goes toward the inline start', () => {
    expect(swipeIntent(-80, 4, 200, 800, false)).toBe('next');
    expect(swipeIntent(80, 4, 200, 800, false)).toBe('previous');
    expect(swipeIntent(80, 4, 200, 800, true)).toBe('next');
  });

  it('takes a short, fast flick as a step', () => {
    expect(swipeIntent(-30, 2, 40, 800, false)).toBe('next');
    expect(swipeIntent(-30, 2, 400, 800, false)).toBeNull();
  });

  it('closes on a pull down past a quarter of the stage', () => {
    expect(swipeIntent(10, 220, 300, 800, false)).toBe('close');
    expect(swipeIntent(10, 150, 300, 800, false)).toBeNull();
  });
});

describe('mediaKind', () => {
  it('draws a picture, a PDF, text, a film and a sound, and nothing else', () => {
    expect(mediaKind('image/png')).toBe('image');
    expect(mediaKind('Application/PDF')).toBe('pdf');
    expect(mediaKind('text/plain; charset=utf-8')).toBe('text');
    expect(mediaKind('application/json')).toBe('text');
    expect(mediaKind('application/vnd.api+json')).toBe('text');
    expect(mediaKind('application/x-yaml')).toBe('text');
    expect(mediaKind('video/mp4')).toBe('video');
    expect(mediaKind('audio/mpeg')).toBe('audio');
    expect(mediaKind('application/vnd.ms-excel')).toBe('other');
    expect(mediaKind('')).toBe('other');
  });
});

describe('mediaKind by name', () => {
  it('reads the extension when the type is absent or generic', () => {
    expect(mediaKind('', 'settings.json')).toBe('text');
    expect(mediaKind('application/octet-stream', 'deploy.yml')).toBe('text');
    expect(mediaKind('', 'report.PDF')).toBe('pdf');
    expect(mediaKind('', 'budget.xlsx')).toBe('other');
    expect(mediaKind('application/vnd.ms-excel', 'notes.txt')).toBe('other');
  });
});

describe('readableText', () => {
  it('indents JSON that parses and leaves the rest as written', () => {
    expect(readableText('{"a":1,"b":[2]}', 'application/json').text).toBe(
      '{\n  "a": 1,\n  "b": [\n    2\n  ]\n}',
    );
    expect(readableText('{"a":', 'application/json').text).toBe('{"a":');
    expect(readableText('a,b\n1,2', 'text/csv').text).toBe('a,b\n1,2');
  });

  it('cuts a file past the limit and says so', () => {
    const long = readableText('x'.repeat(TEXT_LIMIT + 5), 'text/plain');

    expect(long.text).toHaveLength(TEXT_LIMIT);
    expect(long.truncated).toBe(true);
  });
});
