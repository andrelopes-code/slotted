import type { PaginationItemProps } from './pagination.types';

export function PaginationItem(props: PaginationItemProps) {
  return <li {...props} data-part="item" />;
}
