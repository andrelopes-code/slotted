import type { BreadcrumbItemProps } from './breadcrumb.types';

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  return <li {...props} data-part="item" />;
}
