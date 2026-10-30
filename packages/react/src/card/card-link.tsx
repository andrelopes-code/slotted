import { definedProps, keyedProps } from '@slotted/core/selector-key';
import type { CardLinkProps, CardLinkRootProps } from './card.types';

/**
 * The one destination a card resolves to. Its hit area covers the whole
 * surface, so the card is clickable without the root becoming a link: the
 * accessible name stays the title rather than every string in the card, and
 * `Enter`, the context menu and middle-click stay the platform's.
 *
 * A card carries at most one. Two would be two destinations for one surface.
 */
export function CardLink({ render, ...nativeProps }: CardLinkProps) {
  const rootProps: CardLinkRootProps = keyedProps({ ...nativeProps, 'data-part': 'link' });

  return render === undefined ? <a {...rootProps} /> : render(definedProps(rootProps));
}
