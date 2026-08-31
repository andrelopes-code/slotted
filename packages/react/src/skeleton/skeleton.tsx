import '@slotted/styles/skeleton/skeleton.css';

import type { SkeletonProps, SkeletonRootProps } from './skeleton.types';

/**
 * Hidden from assistive technology by default. A placeholder stands for
 * content that has not arrived, and reading out the absence of something is
 * noise. Announcing the wait is the job of the region the skeletons are in,
 * through aria-busy or a status message the application owns.
 */
export function Skeleton({
  'aria-hidden': ariaHidden,
  className,
  render,
  shape = 'text',
  ...nativeProps
}: SkeletonProps) {
  const rootProps: SkeletonRootProps = {
    ...nativeProps,
    'aria-hidden': ariaHidden ?? 'true',
    className: ['slotted-skeleton', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-shape': shape,
    'data-slotted-component': 'skeleton',
  };

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
