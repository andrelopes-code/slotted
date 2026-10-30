import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/visually-hidden/visually-hidden.css';

import type { VisuallyHiddenProps, VisuallyHiddenRootProps } from './visually-hidden.types';

/**
 * Content that assistive technology reaches and sight does not. The element is
 * removed from view and left in the accessibility tree, and it takes no space:
 * a control that gains an accessible name this way is the same size it was.
 *
 * The family paints nothing. `focusable` stops the hiding while focus is
 * inside, and what appears is the consumer's own element, rendered as they
 * wrote it — a skip link's appearance belongs to the link, not to a hiding
 * rule.
 */
export function VisuallyHidden({ focusable = false, render, ...nativeProps }: VisuallyHiddenProps) {
  const rootProps: VisuallyHiddenRootProps = keyedProps({
    ...nativeProps,
    'data-focusable': focusable ? '' : undefined,
    'data-part': 'root',
    'data-ui': 'visually-hidden',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
