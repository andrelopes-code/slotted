import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/**
 * Actions and metadata. The footer sits above the hit area a card action
 * stretches, so a secondary action inside it stays operable.
 */
export function CardFooter({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'footer' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
