import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/table/table.css';

import { nextSelection } from '@slotted/core/collection';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { tableMessages } from '@slotted/core/i18n';
import { createControllable } from '@slotted/core/state';
import { createContext, useCallback, useContext, useId, useRef, useState } from 'react';

import { useMessages } from '../i18n';
import { useTableDefaults } from './table-defaults';
import type {
  TableContextValue,
  TableProps,
  TableRootProps,
  TableSelectionReason,
  TableSortDescriptor,
} from './table.types';

export const TABLE_ROW_SELECTOR = '[data-part="body"] > [data-part="row"][data-value]';

const TableContext = createContext<TableContextValue | undefined>(undefined);

/**
 * What the table around this part says. A cell outside one has no table to
 * belong to, so this throws rather than rendering markup that looks right and
 * announces nothing.
 */
export function useTable(): TableContextValue {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('Every Table part must be rendered inside Table.');
  }
  return context;
}

/** The same context, for a part that is optional inside a table. */
export function useOptionalTable(): TableContextValue | undefined {
  return useContext(TableContext);
}

/**
 * A table of moderate data: the platform's own structure, with sorting,
 * selection, expansion and a place for a paging control.
 *
 * **The role is `table`, not `grid`.** The APG is explicit — a table "is not an
 * interactive widget. Thus, its cells are not focusable or selectable" — so
 * every control inside it is its own tab stop and the family binds no key of
 * its own. `data-grid` is the composite widget with a cell cursor, and the four
 * capabilities that need one are deferred to it.
 *
 * **The family holds the sort and reorders nothing.** The rows are the
 * consumer's own children; reordering them would mean owning the data, which is
 * the line between this family and `data-grid`. It asks, and the consumer
 * applies the descriptor to its own array or its own query.
 *
 * **The root is the frame and the scroller is inside it.** A sticky header
 * resolves against the nearest scrolling ancestor, and what the frame holds is
 * everything that must not move when the table scrolls sideways: the border,
 * the radius and the footer where a paged listing puts its control.
 */
export function Table({
  children,
  columns,
  defaultExpanded,
  defaultSort,
  defaultValue,
  edges,
  expanded,
  layout,
  loading,
  messages,
  onExpandedChange,
  onSortChange,
  onValueChange,
  ref,
  render,
  selectionMode,
  sort,
  cellAlign,
  stickyFooter,
  stickyHeader,
  stickyTo,
  striped,
  value,
  variant,
  ...nativeProps
}: TableProps) {
  const defaults = useTableDefaults();
  const t = useMessages(tableMessages, messages);
  const id = useId();

  const [ownSort, setOwnSort] = useState<TableSortDescriptor | null>(defaultSort ?? null);
  const [ownValue, setOwnValue] = useState<readonly string[]>(defaultValue ?? []);
  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(defaultExpanded ?? []);
  const root = useRef<HTMLDivElement | null>(null);
  /** Where a range starts: the row of the last press that held no modifier. */
  const anchor = useRef<string | undefined>(undefined);

  const currentSort = sort !== undefined ? sort : ownSort;
  const currentValue = value ?? ownValue;
  const currentExpanded = expanded ?? ownExpanded;

  const resolvedColumns = columns ?? defaults.columns ?? 1;
  const resolvedEdges = edges ?? defaults.edges ?? 'inset';
  const resolvedLayout = layout ?? defaults.layout ?? 'auto';
  const resolvedMode = selectionMode ?? defaults.selectionMode ?? 'none';
  const resolvedSticky = (stickyHeader ?? defaults.stickyHeader ?? false) === true;
  const resolvedStickyFooter = (stickyFooter ?? defaults.stickyFooter ?? false) === true;
  const resolvedCellAlign = cellAlign ?? defaults.cellAlign ?? 'center';
  const resolvedStickyTo = stickyTo ?? defaults.stickyTo ?? 'scroll';
  const resolvedStriped = (striped ?? defaults.striped ?? false) === true;
  const resolvedVariant = variant ?? defaults.variant ?? 'ruled';

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref !== null && ref !== undefined) ref.current = node;
    },
    [ref],
  );

  /**
   * Every selectable row's value, in the order the body renders them, read at
   * the moment it is needed rather than kept in a registry. A registry built
   * during render holds the order rows were mounted in, and a sorted table
   * renders the same rows in a new order without remounting one of them — so
   * the range and the select-all would run against the order before the sort.
   * Reading here is inside an event handler, never during render, so nothing
   * about it reaches the server.
   */
  const rows = useCallback(
    () =>
      [...(root.current?.querySelectorAll(TABLE_ROW_SELECTOR) ?? [])]
        .filter((row) => !row.hasAttribute('data-disabled'))
        .map((row) => row.getAttribute('data-value') ?? ''),
    [],
  );

  function requestValue(next: readonly string[], reason: TableSelectionReason, source: unknown) {
    const state = createControllable<readonly string[]>({
      controlled: value,
      initial: currentValue,
      equals: (a, b) => a.length === b.length && a.every((key, index) => key === b[index]),
      onRequest: (request) => onValueChange?.(request.value, request),
    });
    if (state.request(next, reason, source)) setOwnValue(next);
  }

  const context: TableContextValue = {
    columns: resolvedColumns,
    expanded: currentExpanded,
    id,
    isExpanded: (key) => currentExpanded.includes(key),
    isSelected: (key) => currentValue.includes(key),
    loading: loading === true,
    rows,

    requestSort(column, source) {
      /**
       * Ascending, descending, then none — the third state Material and Ant
       * both ship and Carbon does not. A reader who sorted a column by accident
       * has no other way back.
       */
      const next: TableSortDescriptor | null =
        currentSort?.column !== column
          ? { column, direction: 'ascending' }
          : currentSort.direction === 'ascending'
            ? { column, direction: 'descending' }
            : null;

      const state = createControllable<TableSortDescriptor | null>({
        controlled: sort,
        initial: currentSort,
        equals: (a, b) => a?.column === b?.column && a?.direction === b?.direction,
        onRequest: (request) => onSortChange?.(request.value, request),
      });
      const reason = next === null ? 'clear' : 'pointer';
      const moved = state.request(next, reason, source);

      /**
       * `aria-sort` is a property, and a property that changes silently is a
       * change no reader hears. None of the six surveyed implementations says
       * it out loud.
       */
      const heading =
        (
          source as { currentTarget?: { textContent?: string | null } } | undefined
        )?.currentTarget?.textContent?.trim() ?? column;
      const said =
        next === null
          ? t('sortCleared', { column: heading })
          : next.direction === 'ascending'
            ? t('sortedAscending', { column: heading })
            : t('sortedDescending', { column: heading });
      getLiveAnnouncer(root.current?.ownerDocument).announce(said);

      if (moved) setOwnSort(next);
    },

    selectionMode: resolvedMode,
    sort: currentSort,
    stickyTo: resolvedStickyTo,

    toggleExpanded(key, source) {
      const next = currentExpanded.includes(key)
        ? currentExpanded.filter((held) => held !== key)
        : [...currentExpanded, key];
      const state = createControllable<readonly string[]>({
        controlled: expanded,
        initial: currentExpanded,
        equals: (a, b) => a.length === b.length && a.every((held, index) => held === b[index]),
        onRequest: (request) => onExpandedChange?.(request.value, request),
      });
      if (state.request(next, 'pointer', source)) setOwnExpanded(next);
    },

    toggleSelected(key, { range, source }) {
      /**
       * One reducer for every collection in the library, so `listbox`, `select`,
       * `tree` and this family cannot disagree about what `multiple` means. The
       * anchor is the last press that held no modifier, which is what makes a
       * range a range.
       */
      const result = nextSelection({
        action: range && resolvedMode === 'multiple' ? 'range' : 'toggle',
        anchor: anchor.current,
        behavior: 'toggle',
        key,
        keys: rows(),
        mode: resolvedMode,
        selected: currentValue,
      });
      if (!range) anchor.current = key;
      requestValue(result.selected, range ? 'select' : 'pointer', source);
    },

    toggleSelectAll(source) {
      const result = nextSelection({
        action: 'all',
        keys: rows(),
        mode: resolvedMode,
        selected: currentValue,
      });
      requestValue(result.selected, result.selected.length === 0 ? 'clear' : 'select', source);
    },

    t,
    value: currentValue,
  };

  const rootProps: TableRootProps = keyedProps({
    ...nativeProps,
    children,
    'data-cell-align': resolvedCellAlign,
    'data-edges': resolvedEdges,
    'data-layout': resolvedLayout,
    ...(loading === true ? { 'data-loading': '' } : {}),
    'data-part': 'root',
    ...(resolvedSticky ? { 'data-sticky-header': '' } : {}),
    ...(resolvedStickyFooter ? { 'data-sticky-footer': '' } : {}),
    'data-sticky-to': resolvedStickyTo,
    ...(resolvedStriped ? { 'data-striped': '' } : {}),
    'data-ui': 'table',
    'data-variant': resolvedVariant,
    ref: attach,
  });

  return (
    <TableContext.Provider value={context}>
      {render === undefined ? <div {...rootProps} /> : render(rootProps)}
    </TableContext.Provider>
  );
}
