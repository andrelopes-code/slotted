import { keyedProps } from '@slotted/core/selector-key';

import type { CardBodyProps, CardRegionRootProps } from './card.types';

/** The content. It takes whatever a card stretched to a row height has left. */
export function CardBody({ bleed = false, render, ...nativeProps }: CardBodyProps) {
  const rootProps: CardRegionRootProps = keyedProps({
    ...nativeProps,
    ...(bleed ? { 'data-bleed': '' } : {}),
    'data-part': 'body',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
