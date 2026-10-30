import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stat-card/stat-card.css';

import { useMemo } from 'react';

import { Glyph, Icon } from '../icon';
import { Skeleton } from '../skeleton';
import { VisuallyHidden } from '../visually-hidden';
import { toneOf, trendOf, useStatCard } from './stat-card-context';
import type { StatCardDeltaProps, StatCardDeltaRootProps } from './stat-card.types';

/**
 * The change, with the mark that says which way and the word a screen reader
 * hears before the number. `value` is the root's `delta` unless the part
 * states its own, so a second delta on one card — month over month beside
 * year over year — is one more part with one more value.
 *
 * `percent` reads the value as a fraction, which is what a division gives;
 * the sign is always shown except on nought, so `+12.4%` and `−2.1%` read as
 * a change and `0%` as none. The tone is derived from the direction and from
 * `goodWhen`, never from the sign, and an explicit `tone` wins.
 */
export function StatCardDelta({
  children,
  format = 'percent',
  formatOptions,
  goodWhen,
  render,
  tone,
  value,
  ...nativeProps
}: StatCardDeltaProps) {
  const card = useStatCard();
  const change = value ?? card.delta;
  const trend = trendOf(change);
  const resolvedTone = tone ?? toneOf(trend, goodWhen ?? card.goodWhen);

  const formatted = useMemo(() => {
    if (typeof change !== 'number') return undefined;
    return new Intl.NumberFormat(card.locale, {
      signDisplay: 'exceptZero',
      ...(format === 'percent' ? { style: 'percent', maximumFractionDigits: 1 } : {}),
      ...card.formatOptions,
      ...formatOptions,
    }).format(change);
  }, [change, card.locale, card.formatOptions, format, formatOptions]);

  if (card.loading) {
    const props: StatCardDeltaRootProps = keyedProps({
      ...nativeProps,
      children: <Skeleton inlineSize="3.5em" />,
      'data-part': 'delta',
      'data-tone': 'neutral',
      'data-trend': 'flat',
    });
    return render === undefined ? <span {...props} /> : render(props);
  }
  if (card.status !== 'ready' || (children === undefined && formatted === undefined)) return null;

  const props: StatCardDeltaRootProps = keyedProps({
    ...nativeProps,
    children: (
      <>
        {/* One glyph for a rise and a fall, turned over by the sheet for a fall. */}
        <span aria-hidden="true" data-part="indicator" data-part-indicator="">
          <Icon directional={trend !== 'flat'}>
            <Glyph name={trend === 'flat' ? 'minus' : 'trending-up'} />
          </Icon>
        </span>
        <VisuallyHidden>{card.t(trend)} </VisuallyHidden>
        {children ?? formatted}
      </>
    ),
    'data-part': 'delta',
    'data-tone': resolvedTone,
    'data-trend': trend,
  });
  return render === undefined ? <span {...props} /> : render(props);
}
