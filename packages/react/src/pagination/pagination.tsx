import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/pagination/pagination.css';

import { paginationMessages } from '@slotted/core/i18n';
import { clampPage, itemRange, pageItems, totalPages } from '@slotted/core/pagination';
import { createControllable } from '@slotted/core/state';
import { createContext, useContext, useEffect, useState } from 'react';

import { useMessages } from '../i18n';
import { usePaginationDefaults } from './pagination-defaults';
import type {
  PaginationContextValue,
  PaginationPageReason,
  PaginationPageSizeReason,
  PaginationProps,
  PaginationRootProps,
} from './pagination.types';

const PaginationContext = createContext<PaginationContextValue | undefined>(undefined);

/**
 * What the paginator around this part says, and the imperative surface a
 * consumer cannot express as a prop: `goToPage`, `next` and `previous`, plus
 * the arithmetic they were derived from.
 */
export function usePagination(): PaginationContextValue {
  const context = useContext(PaginationContext);
  if (context === undefined) {
    throw new Error('Pagination parts must be rendered inside a Pagination.');
  }
  return context;
}

/**
 * Moving between pages of a collection the consumer owns.
 *
 * **It never fetches and never slices.** The collection is the consumer's, and
 * a family that held a copy of it would hold a stale one. `count` and
 * `pageSize` are all the arithmetic needs, and `@slotted/core/pagination` does
 * the arithmetic once for both bindings.
 *
 * **It never invents a total.** A collection whose total the server does not
 * know passes no `count`; the row of numbers is then not drawn at all, and the
 * two triggers plus a sentence are the whole paginator. Section 7 of the
 * feature guide asks for exactly that.
 *
 * **The page can move by itself, once.** A collection that shrinks under a
 * reader on page forty leaves them past the end, so the family clamps and
 * emits the clamped value with the reason `programmatic` — a consumer holding
 * the value follows instead of rendering an empty page.
 */
export function Pagination({
  boundaryCount,
  children,
  count,
  defaultPage,
  defaultPageSize,
  disabled,
  itemHref,
  live,
  messages,
  loading,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  render,
  siblingCount,
  ...nativeProps
}: PaginationProps) {
  const defaults = usePaginationDefaults();
  const t = useMessages(paginationMessages, messages);

  const [ownPage, setOwnPage] = useState(defaultPage ?? 1);
  const [ownSize, setOwnSize] = useState(defaultPageSize ?? defaults.defaultPageSize ?? 20);

  const currentSize = pageSize ?? ownSize;
  const requestedPage = page ?? ownPage;
  const pages =
    count === undefined ? Number.POSITIVE_INFINITY : totalPages({ count, pageSize: currentSize });
  const currentPage =
    count === undefined ? Math.max(1, Math.trunc(requestedPage)) : clampPage(requestedPage, pages);

  const resolvedDisabled = disabled ?? false;
  const resolvedLoading = loading ?? false;
  const inert = resolvedDisabled || resolvedLoading;

  const requestPage = (next: number, reason: PaginationPageReason, source?: unknown) => {
    const state = createControllable<number>({
      controlled: page,
      initial: currentPage,
      onRequest: (request) => onPageChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwnPage(next);
  };

  /**
   * The one move the family makes on its own. It runs after render rather than
   * during it, because a request is an event and a component that emitted one
   * while rendering would emit it again on every re-render of the same state.
   */
  useEffect(() => {
    if (count === undefined || requestedPage === currentPage) return;
    requestPage(currentPage, 'programmatic');
    /* The clamp is the only dependency that matters here; the request closure
       changes every render and would run this on each one. */
  }, [count, currentPage, requestedPage]);

  const goToPage = (next: number, reason: PaginationPageReason = 'pointer', source?: unknown) => {
    if (inert) return;
    const target = count === undefined ? Math.max(1, Math.trunc(next)) : clampPage(next, pages);
    requestPage(target, reason, source);
  };

  /**
   * Changing how many rows a page holds moves the reader, and where they land
   * is a decision. Clamping leaves someone on page seven of twenty-five at the
   * end of the collection; resetting to page one throws away where they were.
   * Angular Material takes the third answer and this family takes it too: the
   * first item of the current page stays visible, so the reader is looking at
   * the same rows in a different-sized window.
   *
   * The page that follows is a second request carrying `programmatic`, because
   * nobody asked for it directly and a consumer holding both values has to be
   * told about both.
   */
  const setPageSize = (
    next: number,
    reason: PaginationPageSizeReason = 'select',
    source?: unknown,
  ) => {
    if (inert) return;
    const size = Math.max(1, Math.trunc(next));
    const state = createControllable<number>({
      controlled: pageSize,
      initial: currentSize,
      onRequest: (request) => onPageSizeChange?.(request.value, request),
    });
    if (!state.request(size, reason, source)) return;
    setOwnSize(size);

    const firstItem = (currentPage - 1) * currentSize;
    const keptPage =
      count === undefined
        ? currentPage
        : clampPage(Math.floor(firstItem / size) + 1, totalPages({ count, pageSize: size }));
    if (keptPage !== currentPage) requestPage(keptPage, 'programmatic', source);
  };

  const context: PaginationContextValue = {
    canGoNext: !inert && (count === undefined || currentPage < pages),
    canGoPrevious: !inert && currentPage > 1,
    count,
    disabled: resolvedDisabled,
    goToPage,
    itemHref,
    items:
      count === undefined
        ? []
        : pageItems({
            boundaryCount: boundaryCount ?? defaults.boundaryCount ?? 1,
            count,
            page: currentPage,
            pageSize: currentSize,
            siblingCount: siblingCount ?? defaults.siblingCount ?? 1,
          }),
    live: live ?? defaults.live ?? 'polite',
    loading: resolvedLoading,
    next: (reason, source) => goToPage(currentPage + 1, reason, source),
    page: currentPage,
    pages,
    pageSize: currentSize,
    pageSizeOptions: pageSizeOptions ?? defaults.pageSizeOptions ?? [10, 20, 50, 100],
    previous: (reason, source) => goToPage(currentPage - 1, reason, source),
    range:
      count === undefined
        ? { start: 0, end: 0 }
        : itemRange({ count, page: currentPage, pageSize: currentSize }),
    setPageSize,
    t,
  };

  const rootProps: PaginationRootProps = keyedProps({
    'aria-label': t('label'),
    ...nativeProps,
    'aria-busy': resolvedLoading ? true : nativeProps['aria-busy'],
    children,
    'data-disabled': resolvedDisabled ? '' : undefined,
    'data-loading': resolvedLoading ? '' : undefined,
    'data-part': 'root',
    'data-ui': 'pagination',
  });

  return (
    <PaginationContext.Provider value={context}>
      {render === undefined ? <nav {...rootProps} /> : render(rootProps)}
    </PaginationContext.Provider>
  );
}
