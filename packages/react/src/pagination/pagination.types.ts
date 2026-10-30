import type { FamilyTranslator, PaginationMessages, PartialMessages } from '@slotted/core/i18n';
import type { PageItem } from '@slotted/core/pagination';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

export type PaginationPageReason = 'pointer' | 'keyboard' | 'programmatic';
export type PaginationPageSizeReason = 'select' | 'programmatic';

export type PaginationPageRequest = ChangeRequest<number>;
export type PaginationPageSizeRequest = ChangeRequest<number>;

export interface PaginationDefaults {
  boundaryCount?: number | undefined;
  defaultPageSize?: number | undefined;
  live?: PaginationLive | undefined;
  pageSizeOptions?: readonly number[] | undefined;
  siblingCount?: number | undefined;
}

export interface PaginationDefaultsProviderProps extends PaginationDefaults {
  children?: ReactNode;
}

export type PaginationLive = 'polite' | 'off';

export interface PaginationRootProps extends ComponentPropsWithRef<'nav'> {
  'data-disabled': '' | undefined;
  'data-loading': '' | undefined;
  'data-part': string;
  'data-ui': string;
}

export interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  /** How many items the collection holds. Unknown totals pass nothing. */
  count?: number | undefined;
  /** The page an uncontrolled paginator starts from, read once. */
  defaultPage?: number | undefined;
  /** The page size it starts from, read once. */
  defaultPageSize?: number | undefined;
  /** Takes every control away, without taking the row out of the page. */
  disabled?: boolean | undefined;
  /**
   * Turns every page and every trigger into an anchor with a real destination.
   * Without it they are buttons, and a middle click does nothing.
   */
  itemHref?: ((page: number) => string) | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * landmark's name (`label`), the controls, and the sentences.
   */
  messages?: PartialMessages<PaginationMessages> | undefined;
  /** Whether the range announces a page change. `off` silences it. */
  live?: PaginationLive | undefined;
  /** A page change in flight: the controls refuse, and the row keeps its size. */
  loading?: boolean | undefined;
  /** Called before the page moves, with the request that carries the reason. */
  onPageChange?: ((page: number, request: PaginationPageRequest) => void) | undefined;
  onPageSizeChange?: ((size: number, request: PaginationPageSizeRequest) => void) | undefined;
  /** Present means controlled, for the life of the component. */
  page?: number | undefined;
  pageSize?: number | undefined;
  /** What the page-size control offers. */
  pageSizeOptions?: readonly number[] | undefined;
  render?: ((props: PaginationRootProps) => ReactNode) | undefined;
  /** Pages drawn at each end of the row. */
  boundaryCount?: number | undefined;
  /** Pages drawn either side of the current one. */
  siblingCount?: number | undefined;
}

/** What the paginator tells the parts inside it, and what `usePagination` returns. */
export interface PaginationContextValue {
  count: number | undefined;
  disabled: boolean;
  /** The row of numbers and ellipses, from `@slotted/core/pagination`. */
  items: readonly PageItem[];
  itemHref: ((page: number) => string) | undefined;
  /** The family's words in the language in force, with this paginator's `messages` laid over them. */
  t: FamilyTranslator<PaginationMessages>;
  live: PaginationLive;
  loading: boolean;
  page: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  /** The one-based inclusive range this page covers. Nought to nought if empty. */
  range: { start: number; end: number };
  /** How many pages the count and the page size make. */
  pages: number;
  /** Asks to move. Returns whether anything was asked at all. */
  goToPage: (page: number, reason?: PaginationPageReason, source?: unknown) => void;
  next: (reason?: PaginationPageReason, source?: unknown) => void;
  previous: (reason?: PaginationPageReason, source?: unknown) => void;
  setPageSize: (size: number, reason?: PaginationPageSizeReason, source?: unknown) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * A trigger is a `button` or an `a`, and which one is a runtime decision
 * `itemHref` takes. The two elements' prop types disagree on every event
 * handler — a `ClipboardEventHandler<HTMLButtonElement>` is not one for an
 * anchor — so the shared surface is what both accept. Anything specific to one
 * of them, a `rel` or a `download`, reaches the element through `render`.
 */
export interface PaginationTriggerRootProps extends HTMLAttributes<HTMLElement> {
  'aria-label'?: string | undefined;
  'data-disabled': '' | undefined;
  'data-loading': '' | undefined;
  'data-part': string;
}

export interface PaginationTriggerProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement> | undefined;
  render?: ((props: PaginationTriggerRootProps) => ReactNode) | undefined;
}

export interface PaginationItemsProps extends ComponentPropsWithRef<'ul'> {
  render?: ((props: PaginationItemsRootProps) => ReactNode) | undefined;
}

export interface PaginationItemsRootProps extends ComponentPropsWithRef<'ul'> {
  'data-part': string;
}

export interface PaginationStatusProps extends ComponentPropsWithRef<'p'> {
  render?: ((props: PaginationStatusRootProps) => ReactNode) | undefined;
}

export interface PaginationStatusRootProps extends ComponentPropsWithRef<'p'> {
  'aria-live': 'polite' | 'off';
  'data-part': string;
}

export interface PaginationPageSizeProps extends ComponentPropsWithRef<'select'> {
  /** The visible name beside the control. */
  label?: ReactNode | undefined;
  render?: ((props: PaginationPageSizeRootProps) => ReactNode) | undefined;
}

export interface PaginationPageSizeRootProps extends ComponentPropsWithRef<'select'> {
  'data-part': string;
}
