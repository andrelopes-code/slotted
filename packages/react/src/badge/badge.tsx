import '@slotted/styles/badge/badge.css';

import type { BadgeProps, BadgeRootProps } from './badge.types';

/**
 * A badge states an appearance and nothing else. It carries no role: what a
 * badge means comes from where it sits, and a role invented here would be
 * wrong more often than it was right.
 */
export function Badge({
  className,
  fill = 'solid',
  render,
  size = 'md',
  variant = 'secondary',
  ...nativeProps
}: BadgeProps) {
  const rootProps: BadgeRootProps = {
    ...nativeProps,
    className: ['slotted-badge', className].filter(Boolean).join(' '),
    'data-fill': fill,
    'data-part': 'root',
    'data-size': size,
    'data-slotted-component': 'badge',
    'data-variant': variant,
  };

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
