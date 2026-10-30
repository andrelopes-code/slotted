import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/card/card.css';

import { useCardDefaults } from './card-defaults';
import type { CardProps, CardRootProps } from './card.types';

/**
 * A bounded surface that groups one subject. It claims nothing about what that
 * subject is: the element is a `div` with no role, and the page substitutes an
 * `article`, a `section`, an `li` or a `label` through `render` when the
 * content warrants it.
 *
 * The card holds no state. `selected` and `disabled` mirror state that belongs
 * to the control inside it, which is also what announces them.
 */
export function Card({
  disabled = false,
  fill,
  orientation,
  render,
  selected = false,
  size,
  ...nativeProps
}: CardProps) {
  const defaults = useCardDefaults();

  const rootProps: CardRootProps = keyedProps({
    ...nativeProps,
    ...(disabled ? { 'data-disabled': '' } : {}),
    ...(selected ? { 'data-selected': '' } : {}),
    'data-fill': fill ?? defaults.fill,
    'data-orientation': orientation ?? defaults.orientation,
    'data-part': 'root',
    'data-size': size ?? defaults.size,
    'data-ui': 'card',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
