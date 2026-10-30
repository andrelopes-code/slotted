import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/** The content. It takes whatever a card stretched to a row height has left. */
export function CardBody({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'body' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
