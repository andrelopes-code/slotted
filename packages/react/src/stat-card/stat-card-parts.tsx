import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stat-card/stat-card.css';

import { Skeleton } from '../skeleton';
import { SparklineDefaultsProvider, useSparklineDefaults } from '../sparkline';
import { useStatCard } from './stat-card-context';
import type {
  StatCardActionProps,
  StatCardComparisonProps,
  StatCardFigureProps,
  StatCardHeaderProps,
  StatCardLabelProps,
  StatCardMessageProps,
  StatCardPeriodProps,
  StatCardStatusProps,
  StatCardTrendProps,
  StatCardUnitProps,
} from './stat-card.types';

/** The row with the name, a status beside it and an action at the end. */
export function StatCardHeader({ render, ...nativeProps }: StatCardHeaderProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'header' });
  return render === undefined ? <div {...props} /> : render(props);
}

/**
 * The name of the metric. It is the element the root is named by, so it
 * carries the id the root points at; a consumer's own `id` wins and the
 * root then names nothing, which is the consumer's decision to make.
 */
export function StatCardLabel({ children, render, ...nativeProps }: StatCardLabelProps) {
  const { labelId, loading } = useStatCard();
  const props = keyedProps({
    id: labelId,
    ...nativeProps,
    children: loading && children === undefined ? <Skeleton inlineSize="8em" /> : children,
    'data-part': 'label',
  });
  return render === undefined ? <span {...props} /> : render(props);
}

/** A slot beside the name for a badge or a status indicator. */
export function StatCardStatus({ render, ...nativeProps }: StatCardStatusProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'status' });
  return render === undefined ? <span {...props} /> : render(props);
}

/** The place at the end of the header for the consumer's link or button. */
export function StatCardAction({ render, ...nativeProps }: StatCardActionProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'action' });
  return render === undefined ? <span {...props} /> : render(props);
}

/** The value with its unit and its delta on one line, and the comparison under them. */
export function StatCardFigure({ render, ...nativeProps }: StatCardFigureProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'figure' });
  return render === undefined ? <div {...props} /> : render(props);
}

/** The unit, wherever the consumer puts it inside the value: `$` before, `%` after. */
export function StatCardUnit({ render, ...nativeProps }: StatCardUnitProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'unit' });
  return render === undefined ? <span {...props} /> : render(props);
}

/**
 * The prose under the figure: what the value was, and the period. Rendered
 * only while there is a value to compare; a placeholder while loading.
 */
export function StatCardComparison({ children, render, ...nativeProps }: StatCardComparisonProps) {
  const { loading, status } = useStatCard();
  if (!loading && status !== 'ready') return null;
  const props = keyedProps({
    ...nativeProps,
    children: loading ? <Skeleton inlineSize="10em" /> : children,
    'data-part': 'comparison',
  });
  return render === undefined ? <p {...props} /> : render(props);
}

export function StatCardPeriod({ render, ...nativeProps }: StatCardPeriodProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'period' });
  return render === undefined ? <span {...props} /> : render(props);
}

/**
 * Where a sparkline goes. The stylesheet hands it the card's tone, the card's
 * ground and its box; while loading it holds a block in that box, so the card
 * does not change size when the line arrives.
 *
 * A line here is smoothed and washed unless the application or the sparkline
 * says otherwise: a card's trend is read as a shape, and twelve points joined
 * by straight segments read as a jagged edge at this size.
 */
export function StatCardTrend({ children, render, ...nativeProps }: StatCardTrendProps) {
  const { loading, status } = useStatCard();
  const inherited = useSparklineDefaults();
  if (!loading && status !== 'ready') return null;
  const props = keyedProps({
    ...nativeProps,
    children: loading ? (
      <Skeleton shape="block" />
    ) : (
      <SparklineDefaultsProvider
        area={inherited.area ?? true}
        curve={inherited.curve ?? 'monotone'}
      >
        {children}
      </SparklineDefaultsProvider>
    ),
    'data-part': 'trend',
  });
  return render === undefined ? <div {...props} /> : render(props);
}

/** What is said in place of a value that is missing or failed. Rendered only then. */
export function StatCardMessage({ render, ...nativeProps }: StatCardMessageProps) {
  const { loading, status } = useStatCard();
  if (loading || status === 'ready') return null;
  const props = keyedProps({ ...nativeProps, 'data-part': 'message' });
  return render === undefined ? <p {...props} /> : render(props);
}
