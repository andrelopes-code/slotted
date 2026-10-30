import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/**
 * The corner of the header: a badge, a status, a menu button. It stays on the
 * first row, so a title that wraps to two lines does not drag it down, and it
 * sits above the hit area a card link stretches, so it stays operable.
 */
export function CardActions({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'actions' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
