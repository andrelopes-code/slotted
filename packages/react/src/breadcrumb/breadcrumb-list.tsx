import type { BreadcrumbListProps } from './breadcrumb.types';

/**
 * An ordered list, because the crumbs are a path and their order is the
 * information. A ul would say these are siblings.
 */
export function BreadcrumbList(props: BreadcrumbListProps) {
  return <ol {...props} data-part="list" />;
}
