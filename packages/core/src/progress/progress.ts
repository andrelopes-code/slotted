/**
 * What a progress indicator draws and says, from the numbers a consumer
 * states.
 *
 * Three decisions live here rather than in either binding, because all three
 * have to give the same answer twice — once in React and once in Angular —
 * and a difference between them would be invisible from either side. The
 * painted percentage and `aria-valuenow` come from one call, so the picture
 * and the announcement cannot disagree. The value text is one formatter, so a
 * bar written in `pt-BR` reads the same in both. And the completion flag is
 * one comparison, so `data-complete` appears at the same value in both.
 *
 * Nothing here touches the DOM or a framework. The arithmetic itself belongs
 * to `@slotted/core/measure`, which this module calls rather than repeats.
 */

import { clamp, percentOf } from '../measure/measure';

export interface ProgressRange {
  /** The quantity. `null` or absent is indeterminate. */
  readonly value?: number | null | undefined;
  /** The bottom of the range. */
  readonly min?: number | undefined;
  /** The top of the range. */
  readonly max?: number | undefined;
  /** A second, further quantity: received but not yet processed. */
  readonly buffer?: number | null | undefined;
}

export interface ProgressGeometry {
  /** Whether the family has a number to draw at all. */
  readonly indeterminate: boolean;
  /** Where the value sits in the range, as a percentage. Nought when indeterminate. */
  readonly percent: number;
  /** Where the buffer sits, as a percentage, or `null` when there is none. */
  readonly buffer: number | null;
  /** The clamped value, and what `aria-valuenow` reports. `null` when indeterminate. */
  readonly valueNow: number | null;
  /** Whether the clamped value has reached the top of the range. */
  readonly complete: boolean;
  /** The clamped bounds, and what `aria-valuemin` and `aria-valuemax` report. */
  readonly min: number;
  readonly max: number;
}

const PROGRESS_MIN = 0;
const PROGRESS_MAX = 100;

/**
 * A number a range can be measured against, or `null`. A string from a
 * template, an empty input and `NaN` from a division all arrive here, and all
 * three mean "nobody said" rather than nought: reporting nought per cent is a
 * claim, and an indicator nobody gave a number to has not made one.
 */
function measurable(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * The geometry, from the numbers.
 *
 * A value outside the range is clamped rather than rejected, and the clamped
 * value is what both the paint and the announcement read. Progress is usually
 * computed from numbers an application does not fully control — a total that
 * arrives late, a byte count that overshoots — and a bar that painted 140 per
 * cent while announcing 140 would be wrong twice.
 *
 * An inverted or empty range collapses to `min`, which `percentOf` answers as
 * nought: a bar measured against nothing has made no progress. That is also
 * the only division this family could have performed by zero.
 */
export function progressGeometry({ value, min, max, buffer }: ProgressRange): ProgressGeometry {
  const bottom = measurable(min) ?? PROGRESS_MIN;
  const top = measurable(max) ?? PROGRESS_MAX;
  const stated = measurable(value);
  const statedBuffer = measurable(buffer);

  if (stated === null) {
    return {
      indeterminate: true,
      percent: 0,
      buffer: statedBuffer === null ? null : percentOf(statedBuffer, bottom, top),
      valueNow: null,
      complete: false,
      min: bottom,
      max: top,
    };
  }

  const valueNow = clamp(stated, bottom, top);
  const percent = percentOf(stated, bottom, top);

  return {
    indeterminate: false,
    percent,
    /**
     * The buffer is never behind the value. A second quantity that had fallen
     * behind the first would paint a lighter band *inside* the indicator,
     * which reads as a defect rather than as a buffer that has not caught up.
     */
    buffer: statedBuffer === null ? null : Math.max(percent, percentOf(statedBuffer, bottom, top)),
    valueNow,
    complete: valueNow >= Math.max(bottom, top),
    min: bottom,
    max: top,
  };
}

export interface ProgressTextRequest {
  readonly geometry: ProgressGeometry;
  /** A string the family cannot compute: “3 of 7 files”, “about a minute left”. */
  readonly valueText?: string | undefined;
  /** How the number is written. Absent, the ratio is written as a percentage. */
  readonly format?: Intl.NumberFormatOptions | undefined;
  /** BCP 47. Absent, the runtime's own default writes the digits. */
  readonly locale?: string | undefined;
}

/**
 * One formatter per locale and option set. A dashboard renders a column of
 * bars, each re-rendering on every tick of its own upload, and
 * `Intl.NumberFormat` is expensive enough to construct that building one per
 * bar per frame is measurable — the finding `count` recorded for badges.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string | undefined, options: Intl.NumberFormatOptions) {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (cached === undefined) {
    cached = new Intl.NumberFormat(locale, options);
    formatters.set(key, cached);
  }
  return cached;
}

/**
 * What the reader hears and what the value part shows, or `undefined` when
 * there is nothing to say.
 *
 * Three routes, in the order a consumer expects: their own string wins, then
 * their own format applied to the value, then the ratio as a percentage. The
 * default is a percentage because that is what assistive technology would
 * compute from `aria-valuenow` anyway — ARIA says so in as many words — and
 * writing it out is what lets `aria-valuetext` be the *same* string as the
 * one on screen rather than a second opinion about it.
 *
 * A stated `format` is applied to the value rather than to the ratio, because
 * a consumer who asks for megabytes means the megabytes they passed in. That
 * is the one place this differs from a percentage, and it is why the two are
 * not the same call.
 */
export function progressValueText({
  geometry,
  valueText,
  format,
  locale,
}: ProgressTextRequest): string | undefined {
  if (valueText !== undefined) return valueText;
  if (geometry.indeterminate || geometry.valueNow === null) return undefined;
  if (format !== undefined) return formatter(locale, format).format(geometry.valueNow);
  return formatter(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    geometry.percent / 100,
  );
}

/**
 * The wavy ring, as one closed path in the circular indicator's own `48 48`
 * user space.
 *
 * It is M3's own geometry. `CircularProgressIndicatorTokens` states a 48dp
 * container, a 4dp stroke, a 1.6dp amplitude and a 15dp wavelength, which on
 * the ring's own radius of 20.4dp is eight crests; this is a sine wound around
 * a circle at radius 20 with an amplitude of 1.6 and eight crests, drawn as
 * one cubic per half-crest with the two control points at a third and two
 * thirds of the span, each holding the radius of the end it belongs to. That
 * is the standard cubic approximation of a sine half-wave. Sampling the sine
 * at four points per crest and smoothing the samples drew a spiked star, and
 * one quadratic per half-crest drew a rounded hexagon, because a quadratic
 * whose control point sits on the base radius is nearly a chord at a small
 * angular step.
 *
 * The stylesheet carries the same sixteen cubics once more, re-fitted at
 * amplitude nought, because `d` transitions only between two paths with the
 * same command list and the amplitude ramp is that transition.
 * `progress.test.ts` is what holds the copies together.
 *
 * The viewBox scales it, so one path is every size of wavy ring, and
 * `pathLength="100"` makes the dash arithmetic the percentage itself — the
 * same two declarations that draw the plain ring.
 *
 * It starts at three o'clock, which is where an SVG angle of nought is and
 * where a `circle` element's own dash starts. Both shapes therefore need the
 * same one rotation on the box to begin at twelve, and the stylesheet writes
 * it once.
 *
 * It lives here for the reason the rest of this module does: React, Angular
 * and the harness fragment each write the markup, and three copies of five
 * hundred characters of path data would agree until one of them was edited.
 *
 * To change the wave, change the amplitude and the crest count and re-fit; the
 * crests may pass the viewBox by the tenth of a unit the stroke needs, because
 * the stylesheet lets the box overflow, but not by more than the box's own
 * margin.
 */
export const PROGRESS_WAVE_RING_PATH =
  'M45.6 24C45.6 26.83 41.92 28.82 41 31.04C40.08 33.27 41.27 37.27 39.27 39.27C37.27 41.27 33.27 40.08 31.04 41C28.82 41.92 26.83 45.6 24 45.6C21.17 45.6 19.18 41.92 16.96 41C14.73 40.08 10.73 41.27 8.73 39.27C6.73 37.27 7.92 33.27 7 31.04C6.08 28.82 2.4 26.83 2.4 24C2.4 21.17 6.08 19.18 7 16.96C7.92 14.73 6.73 10.73 8.73 8.73C10.73 6.73 14.73 7.92 16.96 7C19.18 6.08 21.17 2.4 24 2.4C26.83 2.4 28.82 6.08 31.04 7C33.27 7.92 37.27 6.73 39.27 8.73C41.27 10.73 40.08 14.73 41 16.96C41.92 19.18 45.6 21.17 45.6 24Z';

/**
 * The wavy bar, as one open path in a user space where one unit is one
 * thickness of the track.
 *
 * It is M3's geometry restated against the thickness so it holds at every
 * size: `LinearProgressIndicatorTokens` states a 4dp stroke, a 3dp amplitude
 * and a 40dp wavelength when the value is known, and a 20dp wavelength while
 * it is not. A crest therefore rises three quarters of a thickness either side
 * of the centre line, one wavelength is ten thicknesses, and the indeterminate
 * wave is twice as tight.
 *
 * Each half-crest is one cubic with its control points at 0.364 and 0.636 of
 * the span, each holding the height of the end it belongs to — the standard
 * cubic approximation of a sine half-wave, and the same fit the ring uses.
 * After the first cubic the path continues with `s`, whose first control point
 * is the reflection of the previous one; every reflection lands on the centre
 * line, so the shorthand draws the same curve in half the characters.
 *
 * The path is drawn in full and the stylesheet shows a window of it with a
 * dash: the window's start is the wave's phase and its end is the value, both
 * measured along the path with round caps, which is how M3's
 * `LinearWavyProgressModifiers` cuts its own segment with a `PathMeasure`.
 * `pathLength` is declared as the path's extent along the inline axis, so a
 * dash of one unit is one thickness of travel whatever the amplitude: the
 * arc length of a sine is longer than its span, and normalising the length to
 * the span is what lets the stylesheet place the end at the value without
 * knowing the amplitude the path currently has.
 *
 * The reach is the same for both waves and is stated once. Twelve hundred
 * thicknesses is 2,400 pixels at the thinnest step and 4,800 at the default,
 * which covers a page-level bar across any display in use; a track longer
 * than that shows a flat remainder past the last crest.
 */
export const PROGRESS_WAVE_BAR_REACH = 1200;

/**
 * One sine, as `M` and cubics, from nought to `reach` along the inline axis.
 * The stylesheet's flat bar is the same call at amplitude nought.
 */
export function progressWaveBarPath(wavelength: number, amplitude: number): string {
  const half = wavelength / 2;
  const first = Number((0.364 * half).toFixed(2));
  const second = Number((0.636 * half).toFixed(2));
  const cycles = PROGRESS_WAVE_BAR_REACH / wavelength;
  /* The path starts in a trough, so the centre line is `y = 0` and the crests
     reach half the amplitude either side of it. */
  let d = `M0 ${-amplitude / 2}c${first} 0 ${second} ${amplitude} ${half} ${amplitude}`;
  for (let i = 1; i < cycles * 2; i += 1) {
    const y = i % 2 === 1 ? -amplitude : amplitude;
    d += `s${second} ${y} ${half} ${y}`;
  }
  return d.replaceAll(' -', '-');
}

export const PROGRESS_WAVE_BAR_PATH = progressWaveBarPath(10, 1.5);
export const PROGRESS_WAVE_BAR_INDETERMINATE_PATH = progressWaveBarPath(5, 1.5);
