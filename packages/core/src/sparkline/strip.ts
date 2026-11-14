import type { FamilyTranslator, SparklineMessages } from '../i18n';
import type { SparklineDatum } from './sparkline';

/**
 * Where one value stands among its own recent values, on one axis: a dot per
 * period, the span of the periods as a band, the current value as a larger
 * dot, an optional reference tick, the zero tick when the extent crosses it,
 * and the extremes at the two ends. Every position is a share of the axis
 * from 0 to 1, so a strip needs no measuring and rows that state the same
 * `min` and `max` line up.
 */
export interface StripRequest {
  /** The current value. `null` while it is not known: the dot is not drawn. */
  readonly value: number | null | undefined;
  /** The periods the value is read against. `null` is a gap. */
  readonly values: readonly SparklineDatum[];
  readonly reference?: number | undefined;
  /** The extent, when the data's own is not the one to draw. The data widens it, never narrows it. */
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

export interface StripDot {
  readonly at: number;
  readonly index: number;
  readonly value: number;
}

export interface StripLayout {
  /** The two ends of the axis, or `null` when nothing is drawn. */
  readonly low: number | null;
  readonly high: number | null;
  readonly dots: readonly StripDot[];
  /** The span of the periods, smallest to largest. */
  readonly band: { readonly from: number; readonly to: number } | null;
  readonly value: number | null;
  readonly reference: number | null;
  readonly zero: number | null;
  /** The periods' own smallest and largest values. */
  readonly smallest: number | null;
  readonly largest: number | null;
}

export interface StripDescriptionRequest {
  readonly t: FamilyTranslator<SparklineMessages>;
  readonly format: (value: number) => string;
  readonly label?: string | undefined;
}

export function layoutStrip({ value, values, reference, min, max }: StripRequest): StripLayout {
  const known = values.flatMap((entry, index) =>
    typeof entry === 'number' && Number.isFinite(entry) ? [{ index, value: entry }] : [],
  );
  const current = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const all = [
    ...known.map((entry) => entry.value),
    ...(current === null ? [] : [current]),
    ...(reference === undefined ? [] : [reference]),
    ...(min === undefined ? [] : [min]),
    ...(max === undefined ? [] : [max]),
  ];
  if (all.length === 0) return EMPTY;

  const low = Math.min(...all);
  const high = Math.max(...all);
  const at = (point: number) => (high === low ? 0.5 : (point - low) / (high - low));
  const smallest = known.length > 0 ? Math.min(...known.map((entry) => entry.value)) : null;
  const largest = known.length > 0 ? Math.max(...known.map((entry) => entry.value)) : null;

  return {
    low,
    high,
    dots: known.map((entry) => ({ ...entry, at: at(entry.value) })),
    band: smallest === null || largest === null ? null : { from: at(smallest), to: at(largest) },
    value: current === null ? null : at(current),
    reference: reference === undefined ? null : at(reference),
    zero: low < 0 && high > 0 ? at(0) : null,
    smallest,
    largest,
  };
}

/** The strip's accessible name: the value, the span of the periods, and the reference. */
export function describeStrip(
  request: StripRequest,
  { t, format, label }: StripDescriptionRequest,
) {
  const layout = layoutStrip(request);
  const prefix = label ? `${label}: ` : '';
  if (layout.smallest === null || layout.largest === null) return `${prefix}${t('noData')}`;

  const span = { low: format(layout.smallest), high: format(layout.largest) };
  const current = request.value;
  const sentence =
    typeof current === 'number' && Number.isFinite(current)
      ? t('strip', { value: format(current), ...span })
      : t('stripPending', span);
  const reference =
    request.reference === undefined
      ? ''
      : `, ${t('stripReference', { reference: format(request.reference) })}`;

  return `${prefix}${sentence}${reference}`;
}

const EMPTY: StripLayout = {
  low: null,
  high: null,
  dots: [],
  band: null,
  value: null,
  reference: null,
  zero: null,
  smallest: null,
  largest: null,
};
