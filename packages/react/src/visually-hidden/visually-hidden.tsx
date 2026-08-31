import '@slotted/styles/visually-hidden/visually-hidden.css';

import type { VisuallyHiddenProps, VisuallyHiddenRootProps } from './visually-hidden.types';

/**
 * Content that assistive technology reaches and sight does not. `focusable`
 * describes the skip-link case, where the content has to become visible for
 * the sighted keyboard user who lands on it.
 */
export function VisuallyHidden({
  className,
  focusable = false,
  render,
  ...nativeProps
}: VisuallyHiddenProps) {
  const rootProps: VisuallyHiddenRootProps = {
    ...nativeProps,
    className: ['slotted-visually-hidden', className].filter(Boolean).join(' '),
    'data-focusable': focusable ? '' : undefined,
    'data-part': 'root',
    'data-slotted-component': 'visually-hidden',
  };

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
