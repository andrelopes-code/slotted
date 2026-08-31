import type { BreadcrumbLinkProps } from './breadcrumb.types';

/**
 * The current page stays a link to itself and carries aria-current="page",
 * which is what the Authoring Practices breadcrumb example does. Removing the
 * href would take the last crumb out of the tab order and out of the list a
 * screen reader reads as links.
 */
export function BreadcrumbLink({
  'aria-current': ariaCurrent,
  current = false,
  ...nativeProps
}: BreadcrumbLinkProps) {
  return (
    <a
      {...nativeProps}
      aria-current={ariaCurrent ?? (current ? 'page' : undefined)}
      data-current={current ? '' : undefined}
      data-part="link"
    />
  );
}
