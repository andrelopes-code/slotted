/**
 * Two or three values compared as bars on one signed axis: a bar from zero to
 * each value, a zero line when the domain crosses it, and a tick at each step.
 * Every position is a share of the axis from 0 to 1, so roots that state the
 * same domain draw the same axis.
 */
export interface CompareRow {
  readonly label: string;
  readonly value: number;
  /** A hatched fill, to tell a reference from the subject without color. */
  readonly texture?: boolean | undefined;
}

export interface CompareDomain {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  /** The distance between two ticks. Without it, no tick is drawn. */
  readonly step?: number | undefined;
}

export interface CompareBar {
  readonly index: number;
  /** Where the bar starts and ends along the axis, start ≤ end. */
  readonly from: number;
  readonly to: number;
  readonly negative: boolean;
}

export interface CompareLayout {
  readonly low: number;
  readonly high: number;
  readonly bars: readonly CompareBar[];
  readonly zero: number | null;
  readonly ticks: readonly { readonly value: number; readonly at: number }[];
}

export function layoutCompare(
  rows: readonly CompareRow[],
  domain: CompareDomain = {},
): CompareLayout {
  const values = rows.map((row) => row.value).filter(Number.isFinite);
  const low = Math.min(0, domain.min ?? 0, ...values);
  const high = Math.max(0, domain.max ?? 0, ...values);
  const at = (point: number) => (high === low ? 0 : (point - low) / (high - low));
  const base = at(0);

  const step = domain.step !== undefined && domain.step > 0 ? domain.step : null;
  const ticks: { value: number; at: number }[] = [];
  if (step !== null) {
    for (let value = Math.ceil(low / step) * step; value <= high + step / 1e6; value += step) {
      ticks.push({ value, at: at(value) });
    }
  }

  return {
    low,
    high,
    bars: rows.map((row, index) => {
      const end = at(Number.isFinite(row.value) ? row.value : 0);

      return { index, from: Math.min(base, end), to: Math.max(base, end), negative: row.value < 0 };
    }),
    zero: low < 0 && high > 0 ? base : null,
    ticks,
  };
}

/** The accessible name: each row's label and value, in order. */
export function describeCompare(rows: readonly CompareRow[], format: (value: number) => string) {
  return rows.map((row) => `${row.label}: ${format(row.value)}`).join('; ');
}
