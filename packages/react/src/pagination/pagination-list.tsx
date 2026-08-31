import type { PaginationListProps } from './pagination.types';

/**
 * An unordered list, where Breadcrumb uses an ordered one. The pages are
 * siblings a reader may visit in any order, and numbering them twice tells a
 * screen reader nothing it cannot already read on the controls.
 */
export function PaginationList(props: PaginationListProps) {
  return <ul {...props} data-part="list" />;
}
