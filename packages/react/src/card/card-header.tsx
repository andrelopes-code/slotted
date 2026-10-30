import { keyedProps } from '@slotted/core/selector-key';
import type { CardRegionProps, CardRegionRootProps } from './card.types';

/** A title and the line that supports it. Both of them are Typography. */
export function CardHeader({ render, ...nativeProps }: CardRegionProps) {
  const rootProps: CardRegionRootProps = keyedProps({ ...nativeProps, 'data-part': 'header' });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
