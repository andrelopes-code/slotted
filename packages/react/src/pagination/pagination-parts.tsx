import { keyedProps, selectorKeyProps } from '@slotted/core/selector-key';
import { useId, type ReactNode, type Ref } from 'react';

import { Glyph, Icon } from '../icon';
import { usePagination } from './pagination';
import type {
  PaginationItemsProps,
  PaginationItemsRootProps,
  PaginationPageSizeProps,
  PaginationPageSizeRootProps,
  PaginationStatusProps,
  PaginationStatusRootProps,
  PaginationTriggerProps,
  PaginationTriggerRootProps,
} from './pagination.types';

type TriggerPart = 'first' | 'previous' | 'next' | 'last';

/**
 * One chevron for a step and two for an end. Every one points along the
 * reading direction and mirrors with it; the stylesheet turns the two that
 * point back.
 */
const TRIGGER_GLYPH = {
  first: 'chevrons-right',
  previous: 'chevron-right',
  next: 'chevron-right',
  last: 'chevrons-right',
} as const;

/**
 * A control that moves the page, in whichever element `itemHref` decided.
 *
 * A button that cannot move takes the native `disabled`. An anchor cannot: it
 * has no such attribute, and one that kept its `href` would still navigate on
 * a middle click. So an unavailable link renders without a destination and
 * says `aria-disabled`, which is the shape the `link` family already ships and
 * the reason both leave `data-disabled` behind for the stylesheet.
 */
function Trigger({
  children,
  part,
  target,
  usable,
  label,
  onClick,
  render,
  ref,
  ...nativeProps
}: PaginationTriggerProps & {
  label: string;
  part: TriggerPart;
  target: number;
  usable: boolean;
}) {
  const pagination = usePagination();
  const href = pagination.itemHref?.(target);
  const unavailable = !usable;

  const rootProps: PaginationTriggerRootProps = keyedProps({
    'aria-label': label,
    ...nativeProps,
    children: children ?? (
      <Icon directional>
        <Glyph name={TRIGGER_GLYPH[part]} />
      </Icon>
    ),
    'data-disabled': unavailable && !pagination.loading ? '' : undefined,
    'data-loading': pagination.loading ? '' : undefined,
    'data-part': part,
    onClick: (event) => {
      onClick?.(event);
      if (event.defaultPrevented || unavailable) return;
      pagination.goToPage(target, 'pointer', event);
    },
  });

  if (render !== undefined) return render(rootProps);

  if (href !== undefined) {
    return (
      <a
        {...rootProps}
        aria-disabled={unavailable ? true : undefined}
        {...(unavailable ? {} : { href })}
        ref={ref as Ref<HTMLAnchorElement>}
      />
    );
  }

  return (
    <button
      {...rootProps}
      disabled={unavailable}
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
    />
  );
}

export function PaginationFirst(props: PaginationTriggerProps) {
  const pagination = usePagination();
  return (
    <Trigger
      {...props}
      label={props['aria-label'] ?? pagination.t('first')}
      part="first"
      target={1}
      usable={pagination.canGoPrevious}
    />
  );
}

export function PaginationPrevious(props: PaginationTriggerProps) {
  const pagination = usePagination();
  return (
    <Trigger
      {...props}
      label={props['aria-label'] ?? pagination.t('previous')}
      part="previous"
      target={pagination.page - 1}
      usable={pagination.canGoPrevious}
    />
  );
}

export function PaginationNext(props: PaginationTriggerProps) {
  const pagination = usePagination();
  return (
    <Trigger
      {...props}
      label={props['aria-label'] ?? pagination.t('next')}
      part="next"
      target={pagination.page + 1}
      usable={pagination.canGoNext}
    />
  );
}

export function PaginationLast(props: PaginationTriggerProps) {
  const pagination = usePagination();
  return (
    <Trigger
      {...props}
      label={props['aria-label'] ?? pagination.t('last')}
      part="last"
      target={pagination.pages}
      usable={pagination.canGoNext}
    />
  );
}

/**
 * The row of page numbers, and the sentence that replaces it below the
 * family's own breakpoint. Both are rendered and exactly one is displayed, so
 * neither is announced twice.
 *
 * A paginator over a collection whose total the server does not know renders
 * nothing here: there are no page numbers to draw and the family invents none.
 */
export function PaginationItems({ ref, render, ...nativeProps }: PaginationItemsProps) {
  const pagination = usePagination();
  if (pagination.count === undefined) return null;

  const rootProps: PaginationItemsRootProps = keyedProps({
    ...nativeProps,
    children: pagination.items.map((item) =>
      item.type === 'ellipsis' ? (
        <li data-part="item" data-part-item="" key={`ellipsis-${item.side}`}>
          <span aria-hidden="true" data-part="ellipsis" data-part-ellipsis="">
            {'…'}
          </span>
        </li>
      ) : (
        <li data-part="item" data-part-item="" key={item.value}>
          <Page page={item.value} />
        </li>
      ),
    ),
    'data-part': 'list',
  });

  return (
    <>
      {render === undefined ? <ul {...rootProps} ref={ref} /> : render(rootProps)}
      <span data-part="summary" data-part-summary="">
        {pagination.t('summary', { page: pagination.page, pages: pagination.pages })}
      </span>
    </>
  );
}

/**
 * One page. `aria-current="page"` is the value the ARIA specification names for
 * a link within a set of pagination links, and it is what paints the fill — so
 * what a reader hears and what the eye sees are one fact rather than two.
 */
function Page({ page }: { page: number }) {
  const pagination = usePagination();
  const current = page === pagination.page;
  const href = pagination.itemHref?.(page);
  const unavailable = pagination.disabled || pagination.loading;

  const shared = {
    'aria-current': current ? ('page' as const) : undefined,
    'aria-label': pagination.t('page', { page }),
    children: page,
    'data-disabled': pagination.disabled ? '' : undefined,
    'data-loading': pagination.loading ? '' : undefined,
    'data-part': 'page',
    ...selectorKeyProps('part', 'page'),
    onClick: (event: { defaultPrevented: boolean }) => {
      if (event.defaultPrevented) return;
      pagination.goToPage(page, 'pointer', event);
    },
  };

  if (href !== undefined) {
    return (
      <a
        {...shared}
        aria-disabled={unavailable ? true : undefined}
        {...(unavailable ? {} : { href })}
      />
    );
  }
  return <button {...shared} disabled={unavailable} type="button" />;
}

/**
 * "21–40 of 482", and the polite live region that announces a page change.
 * One region announcing one sentence is the whole of the announcement: a
 * paginator that also announced the label would say the same thing twice.
 */
export function PaginationStatus({ children, ref, render, ...nativeProps }: PaginationStatusProps) {
  const pagination = usePagination();

  const rootProps: PaginationStatusRootProps = keyedProps({
    ...nativeProps,
    'aria-live': pagination.live,
    children:
      children ??
      pagination.t('range', {
        start: pagination.range.start,
        end: pagination.range.end,
        count: pagination.count ?? 0,
      }),
    'data-part': 'status',
  });

  return render === undefined ? <p {...rootProps} ref={ref} /> : render(rootProps);
}

/**
 * How many items a page holds.
 *
 * A native `select`, wrapped by its own label. `select` in a later wave owns
 * the styled listbox; a paginator that could not change its page size until
 * then is not one a table can use, and the native control is what section 2.8
 * of the feature guide asks for first. Wrapping rather than pointing gives the
 * control its accessible name from the platform, with no generated id.
 */
export function PaginationPageSize({
  label,
  onChange,
  ref,
  render,
  ...nativeProps
}: PaginationPageSizeProps) {
  const pagination = usePagination();
  const generatedId = useId();

  const rootProps: PaginationPageSizeRootProps = keyedProps({
    ...nativeProps,
    children: pagination.pageSizeOptions.map((size) => (
      <option key={size} value={size}>
        {size}
      </option>
    )),
    'data-part': 'page-size',
    disabled: nativeProps.disabled ?? (pagination.disabled || pagination.loading),
    id: nativeProps.id ?? generatedId,
    onChange: (event) => {
      onChange?.(event);
      if (event.defaultPrevented) return;
      pagination.setPageSize(Number(event.currentTarget.value), 'select', event);
    },
    value: nativeProps.value ?? pagination.pageSize,
  });

  const control: ReactNode =
    render === undefined ? <select {...rootProps} ref={ref} /> : render(rootProps);

  return (
    <label data-part="page-size-label" data-part-page-size-label="">
      {label ?? pagination.t('pageSize')}
      {control}
      <Icon>
        <Glyph name="chevron-down" />
      </Icon>
    </label>
  );
}
