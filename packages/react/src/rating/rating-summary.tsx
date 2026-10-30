import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import '@slotted/styles/rating/rating.css';

import { ratingMessages } from '@slotted/core/i18n';
import { formatRating, formatShare, summariseRatings } from '@slotted/core/rating';
import type { RatingInsight } from '@slotted/core/rating';
import { createControllable } from '@slotted/core/state';
import { useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

import { useLocale, useMessages } from '../i18n';
import { useRatingDefaults } from './rating-defaults';
import { RatingDisplay, RatingStar, shareValue } from './rating-display';
import type { RatingRootProps, RatingSummaryProps } from './rating.types';

/** The tone each conclusion is drawn in, as the contract declares it. */
const INSIGHT_TONE: Record<RatingInsight, string> = {
  divided: 'warning',
  few: 'secondary',
  consensus: 'success',
  mixed: 'secondary',
};

/** A written message with its share set in `strong`, the way the sentiment line reads. */
/** Stands in for the share while a message is written, so the share can be set apart. */
const SHARE_MARK = '\uE000';

function withStrongShare(written: string, share: string): ReactNode {
  const [before = '', ...after] = written.split(SHARE_MARK);
  return (
    <>
      {before}
      <strong>{share}</strong>
      {after.join(share)}
    </>
  );
}

const sameLevels = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((level, index) => level === b[index]);

/**
 * The aggregate of many ratings.
 *
 * `bars` is the summary a product page leads with: the mean as a figure, the
 * scale beside it, the stars that draw it and the count, then one bar per
 * level, highest first, each the level's share of the total. `spectrum` reads
 * the same counts as a histogram on the axis of the scale, lowest first, with
 * the mean, its 95% interval and the one conclusion `summariseRatings` draws:
 * divided, too few, a consensus, or mixed.
 *
 * With `filterable`, each level is a `button` with `aria-pressed`, disabled
 * where nobody rated, and the pressed levels are a state model of their own.
 * With nothing rated, the aggregate writes no figure and no scale: an absent
 * mean is not a nought.
 */
export function RatingSummary({
  className,
  counts,
  defaultSelectedLevels,
  filterable,
  insightThresholds,
  locale,
  max,
  messages,
  onSelectedLevelsChange,
  ref,
  render,
  selectedLevels,
  showInsight,
  size,
  style,
  tone,
  variant,
  ...nativeProps
}: RatingSummaryProps) {
  const defaults = useRatingDefaults();
  const resolvedMax = Math.max(1, Math.floor(max ?? defaults.max));
  const resolvedVariant = variant ?? 'bars';
  const resolvedTone = tone ?? defaults.tone;
  const t = useMessages(ratingMessages, messages);
  const appLocale = useLocale();
  const resolvedLocale = locale ?? appLocale;
  const levelCounts = Array.from({ length: resolvedMax }, (_, index) => counts[index] ?? 0);
  const thresholds = { ...defaults.insightThresholds, ...insightThresholds };
  const summary = summariseRatings(levelCounts, thresholds);
  const rated = summary.total > 0;

  const numbers = new Intl.NumberFormat(resolvedLocale);
  /* The margin is a figure to two places, not a message or a share. */
  const margin = new Intl.NumberFormat(resolvedLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [own, setOwn] = useState<readonly number[]>(defaultSelectedLevels ?? []);
  const pressed = selectedLevels ?? own;

  const toggle = (level: number, event: MouseEvent<HTMLButtonElement>) => {
    const next = pressed.includes(level)
      ? pressed.filter((candidate) => candidate !== level)
      : [...pressed, level].sort((a, b) => a - b);
    let cancelled = false;
    const state = createControllable<readonly number[]>({
      controlled: selectedLevels,
      initial: pressed,
      equals: sameLevels,
      onRequest: (request) => {
        onSelectedLevelsChange?.(request.value, request);
        cancelled = request.cancelled;
      },
    });
    const moved = state.request(next, event.detail === 0 ? 'keyboard' : 'pointer', event);
    if (!cancelled && moved) setOwn(next);
  };

  const levelName = (level: number, count: number, share: number) =>
    t('levelLabel', { level, count, share: formatShare(share, resolvedLocale) });

  /** A level or a column: a pressed button while filtering, a named group otherwise. */
  const level = (
    part: 'level' | 'column',
    entry: { level: number; count: number; share: number },
    children: ReactNode,
    shareStyle?: CSSProperties,
  ) => {
    const name = levelName(entry.level, entry.count, entry.share);
    if (filterable !== true) {
      return (
        <div
          aria-label={name}
          data-part={part}
          {...selectorKeyProps('part', part)}
          key={entry.level}
          role="group"
          style={shareStyle}
        >
          {children}
        </div>
      );
    }
    const on = pressed.includes(entry.level);
    return (
      <button
        aria-label={name}
        aria-pressed={on}
        data-part={part}
        {...selectorKeyProps('part', part)}
        disabled={entry.count === 0}
        key={entry.level}
        onClick={(event) => toggle(entry.level, event)}
        style={shareStyle}
        type="button"
        {...(on ? { 'data-pressed': '' } : {})}
      >
        {children}
      </button>
    );
  };

  const levelLabel = (value: number) => (
    <span
      data-part={resolvedVariant === 'spectrum' ? 'tick-label' : 'level-label'}
      {...selectorKeyProps('part', resolvedVariant === 'spectrum' ? 'tick-label' : 'level-label')}
    >
      <span>{numbers.format(value)}</span>
      <RatingStar />
    </span>
  );

  const figure = rated ? (
    <>
      <span data-part="value" data-part-value="">
        {formatRating(summary.average ?? 0, resolvedLocale)}
      </span>
      <span data-part="scale" data-part-scale="">
        {t('scale', { max: resolvedMax })}
      </span>
    </>
  ) : null;

  const bars = (
    <>
      <div data-part="aggregate" data-part-aggregate="">
        {figure}
        <RatingDisplay
          locale={resolvedLocale}
          max={resolvedMax}
          messages={messages}
          showValue={false}
          size="sm"
          tone={resolvedTone}
          value={summary.average ?? 0}
        />
        <span data-part="count" data-part-count="">
          {rated ? t('summaryCount', { count: summary.total }) : t('summaryEmpty')}
        </span>
      </div>
      <ul aria-label={t('distributionLabel')} data-part="distribution" data-part-distribution="">
        {summary.levels.map((entry) => (
          <li key={entry.level}>
            {level(
              'level',
              entry,
              <>
                {levelLabel(entry.level)}
                <span aria-hidden="true" data-part="track" data-part-track="">
                  <span
                    data-part="indicator"
                    data-part-indicator=""
                    style={{ '--slotted-rating-share': shareValue(entry.share) } as CSSProperties}
                  />
                </span>
                <span data-part="level-count" data-part-level-count="">
                  {numbers.format(entry.count)}
                </span>
              </>,
            )}
          </li>
        ))}
      </ul>
    </>
  );

  const ascending = [...summary.levels].reverse();
  const largest = Math.max(0, ...ascending.map((entry) => entry.count));
  const spectrumCount = !rated
    ? t('summaryEmpty')
    : (summary.margin ?? 0) >= thresholds.margin
      ? t('spectrumUncertain', {
          count: summary.total,
          low: formatRating(summary.interval?.[0] ?? 0, resolvedLocale),
          high: formatRating(summary.interval?.[1] ?? 0, resolvedLocale),
        })
      : t('spectrumCount', { count: summary.total, margin: margin.format(summary.margin ?? 0) });

  const spectrum = (
    <>
      <div data-part="aggregate" data-part-aggregate="">
        {figure}
        {showInsight !== false && summary.insight !== null ? (
          <span data-part="insight" data-part-insight="" data-tone={INSIGHT_TONE[summary.insight]}>
            {t(summary.insight)}
          </span>
        ) : null}
        <span data-part="count" data-part-count="">
          {spectrumCount}
        </span>
      </div>
      <div data-part="plot" data-part-plot="">
        <div data-part="field" data-part-field="">
          <div data-part="columns" data-part-columns="">
            {ascending.map((entry) =>
              level('column', entry, <span data-part="bar" data-part-bar="" />, {
                '--slotted-rating-share': shareValue(largest === 0 ? 0 : entry.count / largest),
              } as CSSProperties),
            )}
          </div>
          {rated ? (
            <>
              <span aria-hidden="true" data-part="interval" data-part-interval="" />
              <span aria-hidden="true" data-part="mean" data-part-mean="">
                <span data-part="mean-label" data-part-mean-label="">
                  {formatRating(summary.average ?? 0, resolvedLocale)}
                </span>
              </span>
            </>
          ) : null}
        </div>
        <div aria-hidden="true" data-part="axis" data-part-axis="">
          {ascending.map((entry) => (
            <span data-part="tick" data-part-tick="" key={entry.level}>
              {levelLabel(entry.level)}
              <span data-part="tick-share" data-part-tick-share="">
                {formatShare(entry.share, resolvedLocale)}
              </span>
            </span>
          ))}
        </div>
      </div>
      {rated ? (
        <p data-part="sentiment" data-part-sentiment="">
          {(
            [
              ['positive', 'success'],
              ['neutral', 'secondary'],
              ['negative', 'danger'],
            ] as const
          ).map(([bucket, bucketTone]) => (
            <span data-part="bucket" data-part-bucket="" data-tone={bucketTone} key={bucket}>
              <span aria-hidden="true" data-part="swatch" data-part-swatch="" />
              {withStrongShare(
                t(bucket, { share: SHARE_MARK }),
                formatShare(summary.buckets[bucket], resolvedLocale),
              )}
            </span>
          ))}
        </p>
      ) : null}
    </>
  );

  const meanStyle: CSSProperties | undefined =
    resolvedVariant === 'spectrum' && summary.mean !== null && summary.interval !== null
      ? ({
          '--slotted-rating-mean': String(summary.mean),
          '--slotted-rating-low': String(summary.interval[0]),
          '--slotted-rating-high': String(summary.interval[1]),
        } as CSSProperties)
      : undefined;

  const rootProps: RatingRootProps = keyedProps({
    ...nativeProps,
    children: resolvedVariant === 'spectrum' ? spectrum : bars,
    className,
    'data-part': 'root',
    'data-size': size ?? defaults.size,
    'data-tone': resolvedTone,
    'data-ui': 'rating',
    'data-variant': resolvedVariant === 'spectrum' ? 'spectrum' : 'summary',
    style: meanStyle === undefined ? style : { ...meanStyle, ...style },
  });

  return render === undefined ? <section {...rootProps} ref={ref} /> : render(rootProps);
}
