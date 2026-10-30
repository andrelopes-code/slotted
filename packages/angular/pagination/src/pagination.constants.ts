import { InjectionToken, inject } from '@angular/core';

export type PaginationPageReason = 'pointer' | 'keyboard' | 'programmatic';
export type PaginationPageSizeReason = 'select' | 'programmatic';
export type PaginationLive = 'polite' | 'off';

export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface PaginationDefaults {
  boundaryCount?: number;
  defaultPageSize?: number;
  live?: PaginationLive;
  pageSizeOptions?: readonly number[];
  siblingCount?: number;
}

export const PAGINATION_DEFAULTS_TOKEN = new InjectionToken<PaginationDefaults>(
  'slotted pagination defaults',
  { providedIn: 'root', factory: (): PaginationDefaults => ({}) },
);

/**
 * An application decides once how wide its rows of pages are, how many items a
 * page holds, and whether a page change is announced. A paginator that states
 * any of those itself still wins: an explicit input is never overridden by the
 * token. Its words come from the language in force (`provideSlotted`).
 */
export function providePaginationDefaults(defaults: PaginationDefaults) {
  return { provide: PAGINATION_DEFAULTS_TOKEN, useValue: defaults };
}

export function injectPaginationDefaults(): PaginationDefaults {
  return inject(PAGINATION_DEFAULTS_TOKEN);
}
