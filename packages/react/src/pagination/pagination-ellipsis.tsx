import type { PaginationEllipsisProps } from './pagination.types';

/**
 * Hidden from assistive technology: a gap between two page numbers is not a
 * destination, and reading "ellipsis" between four and nine helps nobody.
 */
export function PaginationEllipsis({
  'aria-hidden': ariaHidden,
  children,
  ...nativeProps
}: PaginationEllipsisProps) {
  return (
    <span {...nativeProps} aria-hidden={ariaHidden ?? 'true'} data-part="ellipsis">
      {children ?? '…'}
    </span>
  );
}
