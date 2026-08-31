import '@slotted/styles/card/card.css';

import type { CardProps, CardRootProps } from './card.types';

/**
 * A surface with three optional regions and no configuration. Everything that
 * differs between one card and another in an application is a token, so the
 * component has nothing to decide.
 */
export function Card({ className, render, ...nativeProps }: CardProps) {
  const rootProps: CardRootProps = {
    ...nativeProps,
    className: ['slotted-card', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-slotted-component': 'card',
  };

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
