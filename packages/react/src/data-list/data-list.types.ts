import type {
  GridColumn,
  GridColumnState,
  GridQuery,
  GridQueryChange,
  SortDirection,
} from '@slotted/core/grid';
import type { DataListMessages, PartialMessages } from '@slotted/core/i18n';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

import type { ListVariant } from '../list';

export type DataListVariant = Extract<ListVariant, 'plain' | 'ruled' | 'framed'>;
export type DataListSize = 'sm' | 'md' | 'lg';
export type DataListSelectionMode = 'none' | 'single' | 'multiple';
export type DataListMode = 'client' | 'server';

/** `string | null` in `single` and `none`, the keys in `multiple`: the union `table` holds. */
export type DataListSelection = string | null | readonly string[];

export type DataListReason = Extract<
  ChangeReason,
  'pointer' | 'keyboard' | 'select' | 'clear' | 'programmatic'
>;

export interface DataListQueryRequest extends ChangeRequest<GridQuery> {
  /** Which part of the query moved, so a consumer refetches on sort and debounces on search. */
  readonly change: GridQueryChange;
}

export interface DataListExpandedRequest extends ChangeRequest<readonly string[]> {
  /** The record whose disclosure was pressed. */
  readonly key: string;
}

export interface DataListActivateEvent<Row> {
  readonly key: string;
  readonly row: Row;
  readonly reason: 'pointer' | 'keyboard';
  readonly event: unknown;
}

/** What a field, the title, the subtitle or the trailing value is drawn with. */
export interface DataListCellContext<Row> {
  readonly column: GridColumn<Row>;
  readonly row: Row;
  readonly key: string;
  readonly value: unknown;
  /** The formatted text; `''` for an absent value. */
  readonly text: string;
  readonly place: 'title' | 'subtitle' | 'trailing' | 'field' | 'actions';
}

export type DataListEmptyStatus = 'empty' | 'no-results' | 'error';

export interface DataListHandle {
  /** The root element. */
  readonly root: HTMLDivElement | null;
  /** Focus goes to the first control of the first record, or to the empty state. */
  focus(): void;
  /** Focus goes to the first control of the record with this key. Returns whether it was found. */
  focusKey(key: string): boolean;
  /** Scrolls the record into view. Returns whether it was found. */
  scrollToKey(key: string): boolean;
}

export interface DataListDefaults {
  variant: DataListVariant;
  size: DataListSize;
  fields: number;
  selectionMode: DataListSelectionMode;
  skeletonRows: number;
  loadingDelay: number;
  loadingMinDuration: number;
}

export interface DataListDefaultsProviderProps extends Partial<DataListDefaults> {
  children?: ReactNode;
}

export interface DataListProps<Row> extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'defaultValue' | 'onChange'
> {
  rows: readonly Row[];
  /** A field name or a function of the row; every state model names rows by it. */
  rowKey: keyof Row | ((row: Row) => string);
  /** The column model `data-grid`, `column-manager` and `saved-views` read. */
  columns: readonly GridColumn<Row>[];
  /** Order and hidden columns, as `column-manager` writes them. */
  columnState?: Partial<GridColumnState> | undefined;

  /** The title's column. Default: the first visible `rowHeader`, else the first data column. */
  title?: string | undefined;
  subtitle?: string | undefined;
  trailing?: string | undefined;
  /** How many fields a closed record shows. Default 4. */
  fields?: number | undefined;

  /** The set's name, on the list. One of `label` and `labelledBy` is required by a reader. */
  label?: string | undefined;
  labelledBy?: string | undefined;

  query?: GridQuery | undefined;
  defaultQuery?: GridQuery | undefined;
  onQueryChange?: ((query: GridQuery, request: DataListQueryRequest) => void) | undefined;
  /** `client` applies the query; `server` draws the rows it is given. Default: `server` with `totalCount`. */
  mode?: DataListMode | undefined;
  totalCount?: number | undefined;

  selectionMode?: DataListSelectionMode | undefined;
  value?: DataListSelection | undefined;
  defaultValue?: DataListSelection | undefined;
  onValueChange?:
    ((value: DataListSelection, request: ChangeRequest<DataListSelection>) => void) | undefined;

  expanded?: readonly string[] | undefined;
  defaultExpanded?: readonly string[] | undefined;
  onExpandedChange?:
    ((expanded: readonly string[], request: DataListExpandedRequest) => void) | undefined;

  disabledKeys?: readonly string[] | undefined;
  loadingKeys?: readonly string[] | undefined;
  /** The record open beside the list. The family never moves it. */
  current?: string | null | undefined;

  /** Makes the title a link to the record. */
  href?: ((row: Row) => string) | undefined;
  /** Makes the title a button that emits `onActivate`. */
  activatable?: boolean | undefined;
  onActivate?: ((event: DataListActivateEvent<Row>) => void) | undefined;

  loading?: boolean | undefined;
  /** A message, or `true` for the family's own. Rows already shown stay. */
  error?: boolean | string | null | undefined;
  onRetry?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;

  variant?: DataListVariant | undefined;
  size?: DataListSize | undefined;
  /** Words laid over the catalog of the language in force, key by key. */
  messages?: PartialMessages<DataListMessages> | undefined;
  /** Formats the fields and counts; the provider's locale otherwise. */
  locale?: string | undefined;
  skeletonRows?: number | undefined;
  loadingDelay?: number | undefined;
  loadingMinDuration?: number | undefined;

  /** Draws a value; `undefined` keeps the formatted text. */
  renderCell?: ((context: DataListCellContext<Row>) => ReactNode) | undefined;
  /** The picture at the start of a record: an avatar, a thumbnail. */
  renderMedia?: ((row: Row) => ReactNode) | undefined;
  /** Replaces the empty, no-results or error state. */
  renderEmpty?: ((status: DataListEmptyStatus) => ReactNode) | undefined;
  /** Under the list, beside load-more: a `Pagination` bound to the same query. */
  footer?: ReactNode | undefined;

  ref?: Ref<DataListHandle> | undefined;
}

export type { SortDirection };
