import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/**
 * Media that bleeds to the card's edge and rounds the corners it touches. It
 * clips itself, because a card that clipped its own content would cut off an
 * overlay opened inside it.
 */
export function CardMedia({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'media' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
