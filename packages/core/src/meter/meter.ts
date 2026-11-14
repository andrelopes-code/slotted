/**
 * A static value within a known range, as the HTML `meter` element reads it:
 * the share of the track the indicator covers, the region the value falls in
 * when the range has a low and a high mark, and the text a reader hears.
 */

export type MeterTone = 'success' | 'warning' | 'danger';

export interface MeterRange {
  readonly value: number;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly low?: number | undefined;
  readonly high?: number | undefined;
  readonly optimum?: number | undefined;
}

type Region = 'low' | 'middle' | 'high';

/** The share of the track the indicator covers, from 0 to 1. An empty or inverted range is 0. */
export function meterRatio({ value, min = 0, max = 100 }: MeterRange): number {
  if (!(max > min) || !Number.isFinite(value)) return 0;

  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The tone of the region the value falls in, by the HTML standard's rule for
 * `meter`: the region that holds `optimum` is good, the one beside it is
 * suboptimal, and the far one is even less good. With no `low`, `high` or
 * `optimum` there are no regions, and the value has no tone of its own.
 */
export function meterRegionTone(range: MeterRange): MeterTone | undefined {
  const { low: lowMark, high: highMark, optimum: optimumMark } = range;
  if (lowMark === undefined && highMark === undefined && optimumMark === undefined) {
    return undefined;
  }

  const min = range.min ?? 0;
  const max = Math.max(min, range.max ?? 100);
  const clamp = (mark: number) => Math.min(max, Math.max(min, mark));
  const low = clamp(lowMark ?? min);
  const high = Math.max(low, clamp(highMark ?? max));
  const optimum = clamp(optimumMark ?? (min + max) / 2);
  const value = clamp(range.value);

  const best = regionOf(optimum, low, high);
  const current = regionOf(value, low, high);
  if (current === best) return 'success';
  if (best === 'middle' || current === 'middle') return 'warning';

  return 'danger';
}

/** The text a reader hears: the share of the range, in the locale. */
export function meterValueText(
  range: MeterRange,
  locale?: string,
  options: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 2 },
): string {
  return new Intl.NumberFormat(locale, options).format(meterRatio(range));
}

function regionOf(value: number, low: number, high: number): Region {
  if (value < low) return 'low';
  if (value > high) return 'high';

  return 'middle';
}
