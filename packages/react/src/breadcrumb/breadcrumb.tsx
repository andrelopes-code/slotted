import '@slotted/styles/breadcrumb/breadcrumb.css';

import type { BreadcrumbProps, BreadcrumbRootProps } from './breadcrumb.types';

/**
 * A nav needs a name: a page usually has more than one, and "navigation" twice
 * in a landmark list tells a reader nothing. The default names this one after
 * what it is, and a consumer with two breadcrumbs on a page replaces it.
 */
export function Breadcrumb({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  render,
  ...nativeProps
}: BreadcrumbProps) {
  const rootProps: BreadcrumbRootProps = {
    ...nativeProps,
    'aria-label': ariaLabelledBy === undefined ? (ariaLabel ?? 'Breadcrumb') : ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className: ['slotted-breadcrumb', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-slotted-component': 'breadcrumb',
  };

  return render === undefined ? <nav {...rootProps} /> : render(rootProps);
}
