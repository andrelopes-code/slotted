import type { PaginationPageProps, PaginationPageRootProps } from './pagination.types';

/**
 * A button by default, and an anchor through `render` when the pages have
 * addresses. A page a reader can bookmark or open in a new tab should be a
 * link; a page that only changes what a client-side list is showing should not
 * pretend to be one.
 */
export function PaginationPage({
  'aria-current': ariaCurrent,
  current = false,
  disabled = false,
  render,
  type = 'button',
  ...nativeProps
}: PaginationPageProps) {
  const rootProps: PaginationPageRootProps = {
    ...nativeProps,
    'aria-current': ariaCurrent ?? (current ? 'page' : undefined),
    'data-current': current ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'data-part': 'page',
  };

  return render === undefined ? (
    <button {...rootProps} disabled={disabled} type={type} />
  ) : (
    render(rootProps)
  );
}
