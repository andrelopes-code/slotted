import { figureRuns } from '@slotted/core/number';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/stat-card/stat-card.css';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import { useCallback, useMemo, useState } from 'react';

import { Skeleton } from '../skeleton';
import { useStatCard } from './stat-card-context';
import { StatCardUnit } from './stat-card-parts';
import type { StatCardValueProps } from './stat-card.types';
import { useCountTransition } from './use-count-transition';

/**
 * The number. A numeric `value` is formatted with the card's locale and
 * `formatOptions` — `notation: 'compact'` is how 12,900 becomes 12.9K — and
 * `children` is the consumer's own rendering, unit and all. A missing or
 * failed value is the `empty` message, a dash; a loading one is a placeholder
 * five figures wide, on the value's own line. `emphasis="whole"` draws the
 * symbol, the decimals and the suffix in the `unit` part.
 *
 * `transition="count"` moves a changed numeric value from the number it
 * showed, each frame drawn by the same formatter. The moving figure is hidden
 * from assistive technology and the final one is said instead, so a reader
 * hears one number.
 */
export function StatCardValue({
  children,
  emphasis = 'none',
  formatOptions,
  ref,
  render,
  transition = 'none',
  value,
  ...nativeProps
}: StatCardValueProps) {
  const card = useStatCard();
  const [node, setNode] = useState<HTMLSpanElement | null>(null);
  const options = formatOptions ?? card.formatOptions;
  const counting =
    transition === 'count' &&
    typeof value === 'number' &&
    !card.loading &&
    card.status === 'ready' &&
    children === undefined;
  const shown = useCountTransition(typeof value === 'number' ? value : 0, {
    enabled: counting,
    source: node,
  });
  const format = useMemo(() => new Intl.NumberFormat(card.locale, options), [card.locale, options]);
  const formatted = useMemo(() => {
    if (typeof value !== 'number') return value;
    if (emphasis === 'none') return format.format(value);
    return figureRuns(format.formatToParts(value)).map((run, index) =>
      run.secondary ? <StatCardUnit key={index}>{run.text}</StatCardUnit> : run.text,
    );
  }, [value, format, emphasis]);
  const moving = counting && shown !== value;

  const attach = useCallback(
    (element: HTMLSpanElement | null) => {
      setNode(element);
      if (typeof ref === 'function') ref(element);
      else if (ref !== null && ref !== undefined) ref.current = element;
    },
    [ref],
  );

  const content = card.loading ? (
    <Skeleton inlineSize="5ch" />
  ) : card.status !== 'ready' ? (
    card.t('empty')
  ) : (
    (children ?? formatted)
  );
  const finalText = typeof value === 'number' ? format.format(value) : '';

  const props = keyedProps({
    ...nativeProps,
    children: moving ? (
      <>
        <span aria-hidden="true">{format.format(shown)}</span>
        <span data-ui="visually-hidden" data-ui-visually-hidden="">
          {finalText}
        </span>
      </>
    ) : (
      content
    ),
    'data-part': 'value',
    ref: attach,
  });
  return render === undefined ? <span {...props} /> : render(props);
}
