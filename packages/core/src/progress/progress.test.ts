import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  PROGRESS_WAVE_BAR_INDETERMINATE_PATH,
  PROGRESS_WAVE_BAR_PATH,
  PROGRESS_WAVE_BAR_REACH,
  PROGRESS_WAVE_RING_PATH,
  progressGeometry,
  progressValueText,
  progressWaveBarPath,
} from './progress';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('progress geometry', () => {
  it('measures a value against the default nought-to-hundred range', () => {
    expect(progressGeometry({ value: 40 })).toEqual({
      indeterminate: false,
      percent: 40,
      buffer: null,
      valueNow: 40,
      complete: false,
      min: 0,
      max: 100,
    });
  });

  it('measures a value against a range of the consumer’s own', () => {
    const geometry = progressGeometry({ value: 100, min: 50, max: 150 });
    expect(geometry.percent).toBe(50);
    expect(geometry.valueNow).toBe(100);
  });

  /**
   * The absence of a number is the absence of a claim. Reporting nought per
   * cent for an indicator nobody gave a value to is the defect `loading-bar`
   * recorded: a page-level bar rarely knows how much is left.
   */
  it('is indeterminate when nobody stated a value', () => {
    for (const value of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY]) {
      const geometry = progressGeometry({ value });
      expect(geometry.indeterminate).toBe(true);
      expect(geometry.valueNow).toBeNull();
      expect(geometry.percent).toBe(0);
      expect(geometry.complete).toBe(false);
    }
  });

  /**
   * Clamped, not rejected, and the clamped value is what the announcement
   * reads: progress is computed from numbers an application does not fully
   * control, and a bar painting a hundred while announcing a hundred and forty
   * would be wrong twice.
   */
  it('clamps a value outside the range, and announces what it painted', () => {
    expect(progressGeometry({ value: 140 })).toMatchObject({
      percent: 100,
      valueNow: 100,
      complete: true,
    });
    expect(progressGeometry({ value: -20 })).toMatchObject({
      percent: 0,
      valueNow: 0,
      complete: false,
    });
  });

  it('answers nought per cent for a range with nothing in it', () => {
    expect(progressGeometry({ value: 5, min: 10, max: 10 }).percent).toBe(0);
    expect(progressGeometry({ value: 5, min: 10, max: 0 }).percent).toBe(0);
  });

  it('reads a non-numeric bound as the default rather than as a value', () => {
    expect(progressGeometry({ value: 25, min: Number.NaN, max: undefined })).toMatchObject({
      min: 0,
      max: 100,
      percent: 25,
    });
  });

  it('is complete only at the top of the range', () => {
    expect(progressGeometry({ value: 99.9 }).complete).toBe(false);
    expect(progressGeometry({ value: 100 }).complete).toBe(true);
    expect(progressGeometry({ value: 7, min: 0, max: 7 }).complete).toBe(true);
  });

  /**
   * A buffer that had fallen behind the value would paint a lighter band
   * inside the indicator, which reads as a rendering fault rather than as a
   * download that has not caught up.
   */
  it('never lets the buffer fall behind the value it buffers', () => {
    expect(progressGeometry({ value: 60, buffer: 30 }).buffer).toBe(60);
    expect(progressGeometry({ value: 30, buffer: 60 }).buffer).toBe(60);
    expect(progressGeometry({ value: 30, buffer: null }).buffer).toBeNull();
  });

  /** A buffered wait can be indeterminate: the bytes arrive before the plan does. */
  it('keeps a buffer on an indeterminate indicator', () => {
    expect(progressGeometry({ value: null, buffer: 40 })).toMatchObject({
      indeterminate: true,
      buffer: 40,
    });
  });
});

describe('progress value text', () => {
  const geometry = progressGeometry({ value: 72 });

  it('writes the ratio as a percentage when nobody asked for anything else', () => {
    expect(progressValueText({ geometry, locale: 'en-US' })).toBe('72%');
  });

  /**
   * The locale writes the digits *and* the punctuation. German puts a
   * non-breaking space before the sign, which is why the percentage is
   * formatted rather than concatenated: a family that appended `%` itself
   * would be wrong in every locale that does not.
   */
  it('writes the digits and the sign in the locale it was given', () => {
    expect(progressValueText({ geometry, locale: 'pt-BR' })).toBe('72%');
    expect(progressValueText({ geometry: progressGeometry({ value: 7.5 }), locale: 'de-DE' })).toBe(
      '8 %',
    );
  });

  /**
   * A stated format applies to the value rather than to the ratio, because a
   * consumer who asks for megabytes means the megabytes they passed in.
   */
  it('applies a stated format to the value, not to the ratio', () => {
    expect(
      progressValueText({
        geometry: progressGeometry({ value: 128, max: 512 }),
        format: { style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' },
        locale: 'en-US',
      }),
    ).toBe('128MB');
  });

  it('lets a consumer say what the family cannot compute', () => {
    expect(progressValueText({ geometry, valueText: '3 of 7 files' })).toBe('3 of 7 files');
  });

  it('says nothing at all about an indeterminate wait', () => {
    expect(progressValueText({ geometry: progressGeometry({ value: null }) })).toBeUndefined();
  });

  /** An explicit string wins even where the family could have computed one. */
  it('prefers the consumer’s string to its own formatter', () => {
    expect(progressValueText({ geometry, valueText: 'almost there', locale: 'en-US' })).toBe(
      'almost there',
    );
  });
});

describe('the wavy ring', () => {
  /**
   * The path is artwork, and the one thing a test can hold is that it stays
   * inside the box that scales it: a crest outside `0 0 48 48` is clipped, and
   * the clip is invisible in a capture of a rotating ring.
   */
  /**
   * The crests reach 21.6 either side of the center, and with half a 5-unit
   * stroke on top of that they pass the 48-unit box by a tenth — which the
   * stylesheet allows by letting the box overflow, and no more than that.
   */
  it('keeps every crest inside the circular indicator’s own user space', () => {
    const numbers = [...PROGRESS_WAVE_RING_PATH.matchAll(/-?\d+(?:\.\d+)?/g)].map(([n]) =>
      Number(n),
    );

    /* Sixteen half-crests, six numbers each, plus the two the move carries. */
    expect(numbers).toHaveLength(98);
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(24 - 21.6);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(24 + 21.6);
  });

  it('closes, so the ring has no seam to catch a rounded cap on', () => {
    expect(PROGRESS_WAVE_RING_PATH.startsWith('M')).toBe(true);
    expect(PROGRESS_WAVE_RING_PATH.endsWith('Z')).toBe(true);
  });

  /**
   * Three files draw this ring — this module, the harness fragment and the
   * flat fitting in the stylesheet — and the copies agreed until one of them
   * was edited. They did not: the harness carried a superseded fitting while
   * this constant already held the current one, and only a capture found it.
   * This is the assertion that finds it instead.
   */
  it('is the same path in the harness fragment', () => {
    const harness = read('../../../styles/src/progress-indicator/progress-indicator.harness.html');

    /* Every ring the fragment draws is this ring, and there is at least one. */
    const drawn = [...harness.matchAll(/d="(M[^"]*Z)"/g)].map(([, path]) => path);
    expect(drawn.length).toBeGreaterThan(0);
    for (const path of drawn) expect(path).toBe(PROGRESS_WAVE_RING_PATH);
  });

  /**
   * The flat ring is the wavy one at amplitude nought, and `d` interpolates
   * only between two paths with the same command list. Same commands, and
   * every *anchor* on the circle the wave is wound about, to the two decimals
   * the path is written at — the two control points of each cubic sit on the
   * tangent rather than on the circle, which is what makes the fit a fit
   * rather than a chord.
   */
  it('scrubs to a flat ring of the same command list', () => {
    const css = read('../../../styles/src/progress-indicator/progress-indicator.css');
    const keyframes =
      /@keyframes slotted-progress-indicator-flatten-ring \{\s+from \{\s+d: path\(\s*'([^']+)'\s*\);\s+\}\s+to \{\s+d: path\(\s*'([^']+)'/.exec(
        css,
      );
    const flat = keyframes?.[2];

    expect(keyframes?.[1]).toBe(PROGRESS_WAVE_RING_PATH);
    expect(flat).toBeDefined();
    expect(commands(flat ?? '')).toBe(commands(PROGRESS_WAVE_RING_PATH));

    const anchors = [...(flat ?? '').matchAll(/[MC](?:[-\d.]+ [-\d.]+ ){0,2}([-\d.]+) ([-\d.]+)/g)];
    expect(anchors).toHaveLength(17);
    for (const [, x, y] of anchors) {
      expect(Math.hypot(Number(x) - 24, Number(y) - 24)).toBeCloseTo(20, 2);
    }
  });
});

/** The command letters of a path, which is what two paths must share to interpolate. */
function commands(path: string): string {
  return path.replace(/[-\d.\s]+/g, '');
}

describe('the wavy bar', () => {
  /**
   * M3's proportions, in thicknesses: a 40dp wavelength and a 3dp amplitude
   * on a 4dp stroke, and a 20dp wavelength while the value is unknown. The
   * path is centerd on `y = 0`, so the crests reach three quarters of a
   * thickness either side of the center line and the viewBox the markup
   * states — `0 -1.25 1200 2.5` — holds them with half a stroke to spare.
   */
  it('winds M3’s sine along the reach, centerd on the track', () => {
    for (const [path, wavelength] of [
      [PROGRESS_WAVE_BAR_PATH, 10],
      [PROGRESS_WAVE_BAR_INDETERMINATE_PATH, 5],
    ] as const) {
      const cubics = path.split(/(?=[cs])/).slice(1);
      expect(cubics).toHaveLength((2 * PROGRESS_WAVE_BAR_REACH) / wavelength);

      let x = 0;
      let y = -0.75;
      expect(path.startsWith(`M${x} ${y}`.replace(' -', '-'))).toBe(true);
      for (const cubic of cubics) {
        const numbers = cubic
          .slice(1)
          .split(/(?=-)|\s+/)
          .map(Number);
        const [dx, dy] = numbers.slice(-2);
        x += dx ?? 0;
        y += dy ?? 0;
        expect(Math.abs(y)).toBeCloseTo(0.75, 5);
      }
      expect(x).toBeCloseTo(PROGRESS_WAVE_BAR_REACH, 5);
    }
  });

  /**
   * The stylesheet's keyframes run from the wavy bar to the same call at
   * amplitude nought, and the two must share a command list for `d` to
   * interpolate between them. The
   * reach is stated once here and once in the stylesheet's box, and the
   * fragment carries both waves with `pathLength` equal to the reach.
   */
  it('is the same path in the harness fragment and flattens in the stylesheet', () => {
    const harness = read('../../../styles/src/progress-indicator/progress-indicator.harness.html');
    const css = read('../../../styles/src/progress-indicator/progress-indicator.css');

    const drawn = [...harness.matchAll(/d="(M0-0\.75[^"]*)"\s+pathLength="(\d+)"/g)];
    expect(drawn.length).toBeGreaterThan(1);
    for (const [, path, length] of drawn) {
      expect([PROGRESS_WAVE_BAR_PATH, PROGRESS_WAVE_BAR_INDETERMINATE_PATH]).toContain(path);
      expect(Number(length)).toBe(PROGRESS_WAVE_BAR_REACH);
    }
    expect(harness).toContain(`viewBox="0 -1.25 ${PROGRESS_WAVE_BAR_REACH} 2.5"`);

    expect(css).toMatch(
      new RegExp(
        `@keyframes slotted-progress-indicator-flatten-bar \\{\\s+from \\{\\s+d: path\\(\\s*'${PROGRESS_WAVE_BAR_PATH}'\\s*\\);\\s+\\}\\s+to \\{\\s+d: path\\(\\s*'${progressWaveBarPath(10, 0)}'\\s*\\);`,
      ),
    );
    expect(css).toContain(`inline-size: calc(${PROGRESS_WAVE_BAR_REACH} * var(--_thickness));`);
    expect(commands(progressWaveBarPath(10, 0))).toBe(commands(PROGRESS_WAVE_BAR_PATH));
  });
});
