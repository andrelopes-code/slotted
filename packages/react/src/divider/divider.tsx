import '@slotted/styles/divider/divider.css';

import type { DividerProps, DividerRootProps } from './divider.types';

/**
 * An `hr` already means separation, so nothing here announces a role in the
 * common case. Only the two departures from the element's own semantics are
 * written: `role="none"` when the rule is decoration, and `aria-orientation`
 * when it runs the other way, which a separator does not otherwise imply.
 */
export function Divider({
  className,
  decorative = false,
  orientation = 'horizontal',
  render,
  role,
  ...nativeProps
}: DividerProps) {
  const rootProps: DividerRootProps = {
    ...nativeProps,
    'aria-orientation': orientation === 'vertical' ? 'vertical' : undefined,
    className: ['slotted-divider', className].filter(Boolean).join(' '),
    'data-orientation': orientation,
    'data-part': 'root',
    'data-slotted-component': 'divider',
    role: role ?? (decorative ? 'none' : undefined),
  };

  return render === undefined ? <hr {...rootProps} /> : render(rootProps);
}
