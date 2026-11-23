/**
 * A linear scale for a word-sized mark an application draws itself — a
 * comparison bar, a position strip, a split bar. Every position is a share of
 * the domain from 0 to 1, written as a percentage of the mark's own track, so
 * the mark needs no measuring, and marks that state the same `min` and `max`
 * draw the same axis.
 */
export interface LinearScaleRequest {
  /** The ends of the domain, when the data's own are not the ones to draw. */
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  /** The values the domain widens to hold; it never narrows below `min` and `max`. */
  readonly values?: readonly number[] | undefined;
  /** Holds zero inside the domain, for bars that start at zero. */
  readonly includeZero?: boolean | undefined;
}

export interface LinearScaleTick {
  readonly value: number;
  readonly at: number;
}

export interface LinearScale {
  readonly low: number;
  readonly high: number;
  /** The share of zero, or `null` when the domain does not cross it. */
  readonly zero: number | null;
  /** A value's share of the domain: 0 at `low`, 1 at `high`, 0.5 when the two are one. */
  at(value: number): number;
  /** A tick at each multiple of `step` inside the domain; none for a step of 0 or less. */
  ticks(step: number): LinearScaleTick[];
}

export function linearScale({
  min,
  max,
  values = [],
  includeZero = false,
}: LinearScaleRequest = {}): LinearScale {
  const points = [
    ...values.filter(Number.isFinite),
    ...(min === undefined ? [] : [min]),
    ...(max === undefined ? [] : [max]),
    ...(includeZero ? [0] : []),
  ];
  const low = points.length > 0 ? Math.min(...points) : 0;
  const high = points.length > 0 ? Math.max(...points) : 0;
  const at = (value: number) => (high === low ? 0.5 : (value - low) / (high - low));

  return {
    low,
    high,
    zero: low < 0 && high > 0 ? at(0) : null,
    at,
    ticks: (step) => ticksOf(low, high, step, at),
  };
}

function ticksOf(low: number, high: number, step: number, at: (value: number) => number) {
  if (!(step > 0)) return [];

  /* Counting by index does not drift; the tolerance keeps a tick that stands on an end. */
  const first = Math.ceil(low / step - 1e-9);
  const last = Math.floor(high / step + 1e-9);
  const ticks: LinearScaleTick[] = [];

  for (let index = first; index <= last; index += 1) {
    /* Adding 0 turns the -0 that Math.ceil returns into 0. */
    const value = index * step + 0;
    ticks.push({ value, at: at(value) });
  }

  return ticks;
}
