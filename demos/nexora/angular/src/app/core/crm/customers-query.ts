import type { FilterDescriptor, FilterGroup } from '@slotted/core/filter';
import type { GridColumnState, GridQuery } from '@slotted/core/grid';
import type { SavedView } from '@slotted/demo-nexora-backend';

import {
  fromViewFilters as fromFilters,
  fromViewState as fromState,
  LIST_PAGE_SIZE,
  LIST_PAGE_SIZES,
  toListQuery,
  toViewFilters as toFilters,
  toViewState as toState,
  type ListRequest,
  type ScaleMap,
} from '../backend/list-query';

export const CUSTOMER_PAGE_SIZES = LIST_PAGE_SIZES;
export const CUSTOMER_PAGE_SIZE = LIST_PAGE_SIZE;

/**
 * Two values the list shows in a unit the backend does not store: credit
 * utilization is basis points and money is minor units.
 */
const SCALE: ScaleMap = {
  creditUtilizationBps: 100,
  overdueReceivables: 100,
  grossReceivables: 100,
  creditExposure: 100,
  lifetimeRevenue: 100,
  creditLimit: 100,
};

export type CustomerListRequest = ListRequest;

export function toCustomerListQuery(query: GridQuery): ListRequest {
  return toListQuery(query, SCALE);
}

export function toViewState(
  query: GridQuery,
  columnState: Partial<GridColumnState> | undefined,
  columnIds: readonly string[],
): { state: SavedView['state']; lossy: boolean } {
  return toState(query, columnState, columnIds, SCALE);
}

export function fromViewState(
  state: SavedView['state'],
  kinds: Readonly<Record<string, FilterDescriptor['kind']>>,
  columnIds: readonly string[],
): { query: GridQuery; columnState: Partial<GridColumnState> } {
  return fromState(state, kinds, columnIds, SCALE);
}

export function toViewFilters(filter: FilterGroup | null): ReturnType<typeof toFilters> {
  return toFilters(filter, SCALE);
}

export function fromViewFilters(
  filters: Parameters<typeof fromFilters>[0],
  kinds: Readonly<Record<string, FilterDescriptor['kind']>>,
): FilterGroup | null {
  return fromFilters(filters, kinds, SCALE);
}
