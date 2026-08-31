import '@slotted/styles/pagination/pagination.css';

import type { PaginationProps, PaginationRootProps } from './pagination.types';

/**
 * A nav needs a name, and a page with a pagination control usually has other
 * navigation on it. The default names this one; a consumer pointing at visible
 * text with aria-labelledby suppresses it, so the two never both appear.
 */
export function Pagination({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  render,
  ...nativeProps
}: PaginationProps) {
  const rootProps: PaginationRootProps = {
    ...nativeProps,
    'aria-label': ariaLabelledBy === undefined ? (ariaLabel ?? 'Pagination') : ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className: ['slotted-pagination', className].filter(Boolean).join(' '),
    'data-part': 'root',
    'data-slotted-component': 'pagination',
  };

  return render === undefined ? <nav {...rootProps} /> : render(rootProps);
}
