import { figureRuns } from '@slotted/core/number';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stat-card/stat-card.css';

import { useMemo } from 'react';

import { Skeleton } from '../skeleton';
import { useStatCard } from './stat-card-context';
import { StatCardUnit } from './stat-card-parts';
import type { StatCardValueProps } from './stat-card.types';

/**
 * The number. A numeric `value` is formatted with the card's locale and
 * `formatOptions` — `notation: 'compact'` is how 12,900 becomes 12.9K — and
 * `children` is the consumer's own rendering, unit and all. A missing or
 * failed value is the `empty` message, a dash; a loading one is a placeholder
 * five figures wide, on the value's own line. `emphasis="whole"` draws the
 * symbol, the decimals and the suffix in the `unit` part.
 */
export function StatCardValue({
  children,
  emphasis = 'none',
  formatOptions,
  render,
  value,
  ...nativeProps
}: StatCardValueProps) {
  const card = useStatCard();
  const options = formatOptions ?? card.formatOptions;
  const formatted = useMemo(() => {
    if (typeof value !== 'number') return value;
    const format = new Intl.NumberFormat(card.locale, options);
    if (emphasis === 'none') return format.format(value);
    return figureRuns(format.formatToParts(value)).map((run, index) =>
      run.secondary ? <StatCardUnit key={index}>{run.text}</StatCardUnit> : run.text,
    );
  }, [value, card.locale, options, emphasis]);

  const content = card.loading ? (
    <Skeleton inlineSize="5ch" />
  ) : card.status !== 'ready' ? (
    card.t('empty')
  ) : (
    (children ?? formatted)
  );

  const props = keyedProps({ ...nativeProps, children: content, 'data-part': 'value' });
  return render === undefined ? <span {...props} /> : render(props);
}
