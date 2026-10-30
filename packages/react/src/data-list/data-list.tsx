import { withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/data-list/data-list.css';

import {
  dataListFieldText,
  dataListKeys,
  dataListNodes,
  describeDataListSort,
  resolveDataListLayout,
  withDataListSortColumn,
  withDataListSortDirection,
  type DataListNode,
} from '@slotted/core/data-list';
import {
  applyQuery,
  cellValue,
  emptyQuery,
  isQueryActive,
  sameQuery,
  type GridColumn,
  type GridQuery,
  type GridQueryChange,
  type SortDirection,
} from '@slotted/core/grid';
import { nextSelection } from '@slotted/core/collection';
import { dataListMessages } from '@slotted/core/i18n';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import type { ChangeReason, ChangeRequest } from '@slotted/core/state';
import {
  Fragment,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FocusEvent, ReactNode } from 'react';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { useLocale, useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { List, ListSection, type ListSectionLevel } from '../list';
import {
  ListItem,
  ListItemActions,
  ListItemBody,
  ListItemContent,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemStart,
} from '../list-item';
import {
  Menu,
  MenuContent,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '../menu';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateTitle,
} from '../result-state';
import { Skeleton, SkeletonRegion } from '../skeleton';
import { VisuallyHidden } from '../visually-hidden';
import { useDataListDefaults } from './data-list-defaults';
import type {
  DataListCellContext,
  DataListEmptyStatus,
  DataListExpandedRequest,
  DataListProps,
  DataListQueryRequest,
  DataListSelection,
} from './data-list.types';

/** The value that stands for "no sort" in the column group, a string no column id can be. */
const NO_SORT = '\u0000none';

/** Varied lengths, so a skeleton reads as text rather than as a stack of equal bars. */
const BAR_WIDTHS = ['9rem', '7rem', '8rem', '6.5rem', '9.5rem'];
const FIELD_WIDTHS = ['3.5rem', '5.5rem', '4rem', '5rem', '4.5rem', '6rem'];

/** A click the keyboard produced has no pointer detail. */
const pressReason = (event: { detail?: number } | undefined): 'pointer' | 'keyboard' =>
  event?.detail === 0 ? 'keyboard' : 'pointer';

function asKeys(value: DataListSelection): readonly string[] {
  if (Array.isArray(value)) return value as readonly string[];
  return value === null || value === undefined ? [] : [value as string];
}

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}

function makeRequest<T>(
  value: T,
  previous: T,
  reason: ChangeReason,
  source: unknown,
  extra: object = {},
) {
  let cancelled = false;
  return {
    value,
    previous,
    reason,
    source,
    ...extra,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** The record with this key, found without `CSS.escape`, which not every document has. */
function recordOf(root: HTMLElement | null, key: string): Element | null {
  for (const item of root?.querySelectorAll('[data-ui="list-item"][data-key]') ?? []) {
    if (item.getAttribute('data-key') === key) return item;
  }
  return null;
}

/** The first control a record holds, where focus lands on that record. */
function firstControl(item: Element | null): HTMLElement | null {
  return (
    item?.querySelector<HTMLElement>(
      'input:not(:disabled), a[href][data-part="title"], button[data-part="title"]:not(:disabled), button[data-part="more"], [data-part="actions"] :is(a[href], button:not(:disabled))',
    ) ?? null
  );
}

/**
 * A small tabular set drawn as a list of records. Each record is a
 * `ListItem`: the title, a subtitle, a trailing value, and the fields of
 * highest priority as pairs of a label and a value. The family reads the
 * column model and the query `DataGrid` reads, and it has no keyboard of its
 * own: every control is a native one in the page's tab order.
 */
export function DataList<Row>({
  activatable,
  className,
  columnState,
  columns,
  current,
  defaultExpanded,
  defaultQuery,
  defaultValue,
  disabledKeys,
  error,
  expanded: expandedProp,
  fields,
  footer,
  hasMore,
  href,
  label,
  labelledBy,
  loading = false,
  loadingDelay,
  loadingKeys,
  loadingMinDuration,
  locale: localeProp,
  messages,
  mode: modeProp,
  onActivate,
  onExpandedChange,
  onLoadMore,
  onQueryChange,
  onRetry,
  onValueChange,
  query: queryProp,
  ref,
  renderCell,
  renderEmpty,
  renderMedia,
  rowKey,
  rows,
  selectionMode: selectionModeProp,
  size: sizeProp,
  skeletonRows,
  subtitle,
  title,
  totalCount,
  trailing,
  value: valueProp,
  variant: variantProp,
  ...rest
}: DataListProps<Row>) {
  const defaults = useDataListDefaults();
  const t = useMessages(dataListMessages, messages);
  const providedLocale = useLocale();
  const locale = localeProp ?? providedLocale;
  const yes = t('true');
  const no = t('false');
  /* What a boolean field says, kept by its words: an inline `messages`
     makes a new translator on every render. */
  const booleans = useMemo(() => ({ true: yes, false: no }), [yes, no]);
  const variant = variantProp ?? defaults.variant;
  const size = sizeProp ?? defaults.size;
  const selectionMode = selectionModeProp ?? defaults.selectionMode;
  const mode = modeProp ?? (totalCount === undefined ? 'client' : 'server');

  const base = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* ── State ─────────────────────────────────────────────────────────── */

  const [ownQuery, setOwnQuery] = useState<GridQuery>(() => defaultQuery ?? emptyQuery());
  const query = queryProp ?? ownQuery;
  const [ownValue, setOwnValue] = useState<DataListSelection>(() =>
    defaultValue === undefined ? (selectionMode === 'multiple' ? [] : null) : defaultValue,
  );
  const value = valueProp === undefined ? ownValue : valueProp;
  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(() => defaultExpanded ?? []);
  const expanded = expandedProp ?? ownExpanded;
  const anchor = useRef<string | undefined>(undefined);
  /** Whether the press that toggles a checkbox held Shift: the change event does not say. */
  const shift = useRef(false);
  /** Whether the wait in progress is for the next page, which dims nothing. */
  const loadingMore = useRef(false);

  function requestQuery(
    next: GridQuery,
    change: GridQueryChange,
    reason: ChangeReason,
    source?: unknown,
  ) {
    if (sameQuery(next, query)) return false;
    const request = makeRequest(next, query, reason, source, { change }) as DataListQueryRequest;
    onQueryChange?.(next, request);
    if (request.cancelled) return false;
    if (queryProp === undefined) setOwnQuery(next);
    return true;
  }

  function requestValue(next: DataListSelection, reason: ChangeReason, source?: unknown) {
    if (sameKeys(asKeys(next), asKeys(value))) return;
    const request = makeRequest(next, value, reason, source) as ChangeRequest<DataListSelection>;
    onValueChange?.(next, request);
    if (request.cancelled) return;
    if (valueProp === undefined) setOwnValue(next);
  }

  function requestExpanded(key: string, reason: ChangeReason, source?: unknown) {
    const next = expanded.includes(key)
      ? expanded.filter((entry) => entry !== key)
      : [...expanded, key];
    const request = makeRequest(next, expanded, reason, source, { key }) as DataListExpandedRequest;
    onExpandedChange?.(next, request);
    if (request.cancelled) return;
    if (expandedProp === undefined) setOwnExpanded(next);
  }

  /* ── The model ─────────────────────────────────────────────────────── */

  const keyOf = useMemo(
    () =>
      typeof rowKey === 'function'
        ? rowKey
        : (row: Row) => String((row as Record<PropertyKey, unknown>)[rowKey as PropertyKey]),
    [rowKey],
  );

  const layout = resolveDataListLayout(columns, {
    title,
    subtitle,
    trailing,
    fields: fields ?? defaults.fields,
    columnState,
  });

  const applied = useMemo(() => {
    if (mode === 'server') {
      return {
        nodes: rows.map((row, index) => ({ kind: 'row' as const, key: keyOf(row), row, index })),
        visible: rows,
        total: totalCount ?? rows.length,
      };
    }
    const result = applyQuery(rows, columns, query, { rowKey: keyOf, locale, booleans });
    return { nodes: dataListNodes(result.nodes), visible: result.rows, total: result.total };
  }, [booleans, columns, keyOf, locale, mode, query, rows, totalCount]);

  const nodes: readonly DataListNode<Row>[] = applied.nodes;
  const drawnKeys = dataListKeys(nodes);
  const disabled = new Set(disabledKeys ?? []);
  const busy = new Set(loadingKeys ?? []);
  const selected = asKeys(value);
  const selectedSet = new Set(selected);

  /* ── Loading and the three states beside it ────────────────────────── */

  const firstLoad = loading && rows.length === 0;
  const [holding, setHolding] = useState(firstLoad);
  useEffect(() => {
    if (firstLoad) setHolding(true);
  }, [firstLoad]);
  const showLoader = firstLoad || holding;

  const emptyStatus: DataListEmptyStatus | null = showLoader
    ? null
    : error && rows.length === 0
      ? 'error'
      : drawnKeys.length > 0
        ? null
        : rows.length === 0 && !isQueryActive(query)
          ? 'empty'
          : 'no-results';

  /* ── Announcements ─────────────────────────────────────────────────── */

  function announce(text: string) {
    getLiveAnnouncer(rootRef.current?.ownerDocument).announce(text);
  }

  /* ── Sorting ───────────────────────────────────────────────────────── */

  const firstKey = query.sort[0];
  const sortColumn = firstKey
    ? (columns.find((column) => column.id === firstKey.column) ?? null)
    : null;

  function sortTo(next: GridQuery, reason: ChangeReason, source: unknown) {
    if (!requestQuery(next, 'sort', reason, source) && queryProp === undefined) return;
    announce(
      next.sort.length === 0
        ? t('sortCleared')
        : t('sortedBy', { order: describeDataListSort(next.sort, columns, t) }),
    );
  }

  /* ── Selection ─────────────────────────────────────────────────────── */

  const selectable = drawnKeys.filter((key) => !disabled.has(key));
  const allKeys =
    mode === 'client' ? applied.visible.map(keyOf).filter((key) => !disabled.has(key)) : selectable;
  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedSet.has(key));
  const someSelected = allKeys.some((key) => selectedSet.has(key));

  function pressRecord(key: string, shiftKey: boolean, reason: ChangeReason, event: unknown) {
    if (selectionMode === 'none' || disabled.has(key)) return;
    if (selectionMode === 'single') {
      requestValue(selectedSet.has(key) ? null : key, reason, event);
      anchor.current = key;
      return;
    }
    if (shiftKey && anchor.current !== undefined) {
      const result = nextSelection({
        action: 'range',
        mode: 'multiple',
        selected,
        keys: selectable,
        key,
        anchor: anchor.current,
        disabled: (entry) => disabled.has(entry),
      });
      const outside = selected.filter((entry) => !selectable.includes(entry));
      requestValue([...outside, ...result.selected], 'select', event);
      return;
    }
    anchor.current = key;
    requestValue(
      selectedSet.has(key) ? selected.filter((entry) => entry !== key) : [...selected, key],
      reason,
      event,
    );
  }

  function pressAll(event: unknown) {
    const covered = new Set(allKeys);
    const next = allSelected
      ? selected.filter((key) => !covered.has(key))
      : [...selected, ...allKeys.filter((key) => !selectedSet.has(key))];
    requestValue(next, allSelected ? 'clear' : 'select', event);
  }

  /* ── Focus that survives a removal ─────────────────────────────────── */

  const focusedKey = useRef<string | null>(null);
  const previousKeys = useRef<readonly string[]>(drawnKeys);

  useLayoutEffect(() => {
    const before = previousKeys.current;
    previousKeys.current = drawnKeys;
    const lost = focusedKey.current;
    if (lost === null || drawnKeys.includes(lost)) return;
    const root = rootRef.current;
    const active = root?.ownerDocument.activeElement;
    if (active && active !== root?.ownerDocument.body && root?.contains(active)) return;
    const at = before.indexOf(lost);
    const next = before.slice(at + 1).find((key) => drawnKeys.includes(key));
    const previous = before
      .slice(0, Math.max(at, 0))
      .reverse()
      .find((key) => drawnKeys.includes(key));
    const target = next ?? previous;
    focusedKey.current = target ?? null;
    if (target !== undefined) {
      firstControl(recordOf(root ?? null, target))?.focus();
    } else {
      root?.querySelector<HTMLElement>('[data-part="empty"] [data-ui="result-state"]')?.focus();
    }
  });

  function onRecordFocus(key: string) {
    return () => {
      focusedKey.current = key;
    };
  }

  function onRootBlur(event: FocusEvent<HTMLDivElement>) {
    rest.onBlur?.(event);
    const next = event.relatedTarget as Node | null;
    if (next === null) return;
    if (!rootRef.current?.contains(next)) focusedKey.current = null;
  }

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return rootRef.current;
      },
      focus() {
        const root = rootRef.current;
        const first = root?.querySelector('[data-ui="list-item"][data-key]') ?? null;
        const control = firstControl(first);
        if (control) control.focus();
        else
          root?.querySelector<HTMLElement>('[data-part="empty"] [data-ui="result-state"]')?.focus();
      },
      focusKey(key: string) {
        const control = firstControl(recordOf(rootRef.current, key));
        control?.focus();
        return control !== null;
      },
      scrollToKey(key: string) {
        const item = recordOf(rootRef.current, key);
        item?.scrollIntoView({ block: 'nearest' });
        return item !== null;
      },
    }),
    [],
  );

  /* ── Drawing one value ─────────────────────────────────────────────── */

  function draw(
    column: GridColumn<Row>,
    row: Row,
    key: string,
    place: DataListCellContext<Row>['place'],
  ): ReactNode {
    const text = dataListFieldText(column, row, { locale, booleans });
    const context: DataListCellContext<Row> = {
      column,
      row,
      key,
      value: cellValue(column, row),
      text: text ?? '',
      place,
    };
    const custom = renderCell?.(context);
    if (custom !== undefined) return custom;
    if (text === null) {
      return (
        <span data-part="field-empty" data-part-field-empty="">
          <span aria-hidden="true">—</span>
          <VisuallyHidden>{t('empty')}</VisuallyHidden>
        </span>
      );
    }
    return text;
  }

  /* ── One record ────────────────────────────────────────────────────── */

  function renderRecord(key: string, row: Row) {
    const isDisabled = disabled.has(key);
    const isBusy = busy.has(key);
    const isSelected = selectionMode !== 'none' && selectedSet.has(key);
    const isCurrent = current !== undefined && current !== null && current === key;
    const isExpanded = expanded.includes(key);
    const fieldsId = `${base}-${key}-fields`;
    const titleText = layout.title
      ? (dataListFieldText(layout.title, row, { locale, booleans }) ?? '')
      : key;
    const visibleFields = isExpanded ? layout.fields : layout.fields.slice(0, layout.shown);
    const hiddenCount = layout.fields.length - layout.shown;
    const destination = href?.(row);
    const blocked = isDisabled || isBusy;

    const titleContent = layout.title ? draw(layout.title, row, key, 'title') : key;
    let titleElement: ReactNode;
    if (destination !== undefined) {
      titleElement = (
        <a
          aria-disabled={blocked || undefined}
          data-part="title"
          data-part-title=""
          href={destination}
          onClick={(event) => {
            if (blocked) {
              event.preventDefault();
              return;
            }
            onActivate?.({ key, row, reason: pressReason(event), event });
          }}
        >
          {titleContent}
        </a>
      );
    } else if (activatable === true) {
      titleElement = (
        <button
          data-part="title"
          data-part-title=""
          disabled={blocked}
          onClick={(event) => onActivate?.({ key, row, reason: pressReason(event), event })}
          type="button"
        >
          {titleContent}
        </button>
      );
    } else {
      titleElement = (
        <span data-part="title" data-part-title="">
          {titleContent}
        </span>
      );
    }

    const media = renderMedia?.(row);
    const hasStart = selectionMode !== 'none' || media !== undefined;

    return (
      <ListItem
        align="start"
        current={isCurrent ? (destination === undefined ? true : 'page') : false}
        data-expanded={isExpanded ? '' : undefined}
        data-key={key}
        disabled={isDisabled}
        key={key}
        loading={isBusy}
        onFocus={onRecordFocus(key)}
        selected={isSelected}
        size={size}
        variant={variant}
      >
        <ListItemContent>
          {hasStart ? (
            <ListItemStart>
              {selectionMode === 'none' ? null : (
                <span data-part="selection" data-part-selection="">
                  <Checkbox
                    aria-label={t('selectRow', { title: titleText })}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={(_checked, request) =>
                      pressRecord(key, shift.current, request.reason, request.source)
                    }
                    onClick={(event) => {
                      shift.current = event.shiftKey;
                    }}
                    size={size}
                  />
                </span>
              )}
              {media === undefined ? null : (
                <span data-part="media" data-part-media="">
                  {media}
                </span>
              )}
            </ListItemStart>
          ) : null}
          <ListItemBody>
            <ListItemLabel>{titleElement}</ListItemLabel>
            {layout.subtitle ? (
              <ListItemDescription>
                {draw(layout.subtitle, row, key, 'subtitle')}
              </ListItemDescription>
            ) : null}
          </ListItemBody>
          {layout.trailing ? (
            <ListItemEnd>
              <span data-part="trailing" data-part-trailing="">
                {draw(layout.trailing, row, key, 'trailing')}
              </span>
            </ListItemEnd>
          ) : null}
          {visibleFields.length > 0 ? (
            <dl data-part="fields" data-part-fields="" id={fieldsId}>
              {visibleFields.map((column) => (
                <div data-part="field" data-part-field="" key={column.id}>
                  <dt data-part="field-label" data-part-field-label="">
                    {column.label}
                  </dt>
                  <dd
                    data-numeric={
                      column.kind === 'number' || column.numeric === true ? '' : undefined
                    }
                    data-part="field-value"
                    data-part-field-value=""
                  >
                    {draw(column, row, key, 'field')}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {hiddenCount > 0 ? (
            <button
              aria-controls={fieldsId}
              aria-expanded={isExpanded}
              data-part="more"
              data-part-more=""
              onClick={(event) => requestExpanded(key, pressReason(event), event)}
              type="button"
            >
              {isExpanded ? t('less') : t('more', { count: hiddenCount })}
              <Icon size="sm">
                <Glyph name="chevron-down" />
              </Icon>
            </button>
          ) : null}
        </ListItemContent>
        {layout.actions.length > 0 ? (
          <ListItemActions>
            {layout.actions.map((column) => (
              <Fragment key={column.id}>{draw(column, row, key, 'actions')}</Fragment>
            ))}
          </ListItemActions>
        ) : null}
      </ListItem>
    );
  }

  function renderNodes(list: readonly DataListNode<Row>[]): ReactNode[] {
    return list.map((node) => {
      if (node.kind === 'row') return renderRecord(node.key, node.row);
      const column = columns.find((entry) => entry.id === node.column);
      return (
        <ListSection
          key={node.key}
          label={`${column?.label ?? node.column}: ${node.text} · ${new Intl.NumberFormat(locale).format(node.count)}`}
          level={String(Math.min(node.level + 2, 6)) as ListSectionLevel}
        >
          {renderNodes(node.children)}
        </ListSection>
      );
    });
  }

  /* ── The bar above the set ─────────────────────────────────────────── */

  const countText =
    selectionMode !== 'none' && selected.length > 0
      ? t('selectedCount', { selected: selected.length, count: applied.total })
      : t('count', { count: applied.total });

  const sortTrigger = (
    <MenuTrigger
      render={({ ref: triggerRef, ...props }) => (
        <Button
          {...props}
          aria-label={
            firstKey
              ? t('sortNamed', { order: describeDataListSort(query.sort, columns, t) })
              : t('sort')
          }
          disabled={showLoader}
          end={
            /* The direction's chevron, turned by the stylesheet for ascending;
               without a key there is nothing to point at. */
            firstKey ? (
              <Icon size="sm">
                <Glyph name="chevron-down" />
              </Icon>
            ) : (
              <span />
            )
          }
          ref={triggerRef}
          size="sm"
          tone="secondary"
          variant="ghost"
        >
          {sortColumn
            ? t('sortSummary', { column: sortColumn.label, more: query.sort.length - 1 })
            : t('sort')}
        </Button>
      )}
    />
  );

  const header = (
    <div data-part="header" data-part-header="">
      {selectionMode === 'multiple' && !showLoader ? (
        <span data-part="select-all" data-part-select-all="">
          <Checkbox
            aria-label={t('selectAll', { count: allKeys.length })}
            checked={allSelected}
            disabled={allKeys.length === 0}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={(_checked, request) => pressAll(request.source)}
            size={size}
          />
        </span>
      ) : null}
      <output aria-live="polite" data-part="count" data-part-count="">
        {showLoader ? '' : countText}
      </output>
      {layout.sortable.length > 0 ? (
        <span data-direction={firstKey?.direction} data-part="sort" data-part-sort="">
          <Menu align="end">
            {sortTrigger}
            <MenuContent aria-label={t('sort')}>
              <MenuRadioGroup
                aria-labelledby={`${base}-sort-column`}
                onValueChange={(next, request) =>
                  sortTo(
                    withDataListSortColumn(query, next === NO_SORT ? null : next),
                    request.reason,
                    request.source,
                  )
                }
                value={firstKey?.column ?? NO_SORT}
              >
                <MenuGroupLabel id={`${base}-sort-column`}>{t('sortColumn')}</MenuGroupLabel>
                <MenuRadioItem value={NO_SORT}>{t('sortNone')}</MenuRadioItem>
                {layout.sortable.map((column) => (
                  <MenuRadioItem key={column.id} value={column.id}>
                    {column.label}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
              <MenuSeparator />
              <MenuRadioGroup
                aria-labelledby={`${base}-sort-direction`}
                onValueChange={(next, request) =>
                  sortTo(
                    withDataListSortDirection(query, next as SortDirection),
                    request.reason,
                    request.source,
                  )
                }
                value={firstKey?.direction ?? ''}
              >
                <MenuGroupLabel id={`${base}-sort-direction`}>{t('sortDirection')}</MenuGroupLabel>
                <MenuRadioItem disabled={!firstKey} value="ascending">
                  {t('ascending')}
                </MenuRadioItem>
                <MenuRadioItem disabled={!firstKey} value="descending">
                  {t('descending')}
                </MenuRadioItem>
              </MenuRadioGroup>
            </MenuContent>
          </Menu>
        </span>
      ) : null}
    </div>
  );

  /* ── Loader ────────────────────────────────────────────────────────── */

  const skeletonCount = skeletonRows ?? defaults.skeletonRows;
  const loader = showLoader ? (
    <div data-part="loader" data-part-loader="">
      <SkeletonRegion
        delay={loadingDelay ?? defaults.loadingDelay}
        messages={{ label: t('loading') }}
        loading={firstLoad}
        minDuration={loadingMinDuration ?? defaults.loadingMinDuration}
        onReveal={() => setHolding(false)}
      >
        <List aria-hidden inert size={size} variant={variant}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <ListItem align="start" key={index} size={size} variant={variant}>
              <ListItemContent>
                <ListItemBody>
                  <ListItemLabel>
                    <Skeleton inlineSize={BAR_WIDTHS[index % BAR_WIDTHS.length]} />
                  </ListItemLabel>
                  {layout.subtitle ? (
                    <ListItemDescription>
                      <Skeleton inlineSize={BAR_WIDTHS[(index + 2) % BAR_WIDTHS.length]} />
                    </ListItemDescription>
                  ) : null}
                </ListItemBody>
                {layout.trailing ? (
                  <ListItemEnd>
                    <Skeleton inlineSize={FIELD_WIDTHS[(index + 3) % FIELD_WIDTHS.length]} />
                  </ListItemEnd>
                ) : null}
                {layout.shown > 0 ? (
                  <dl data-part="fields" data-part-fields="">
                    {layout.fields.slice(0, layout.shown).map((column, field) => (
                      <div data-part="field" data-part-field="" key={column.id}>
                        <dt data-part="field-label" data-part-field-label="">
                          {column.label}
                        </dt>
                        <dd data-part="field-value" data-part-field-value="">
                          <Skeleton
                            inlineSize={FIELD_WIDTHS[(index + field) % FIELD_WIDTHS.length]}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </ListItemContent>
            </ListItem>
          ))}
        </List>
      </SkeletonRegion>
    </div>
  ) : null;

  /* ── Empty, no results, error ──────────────────────────────────────── */

  function renderEmptyState(status: DataListEmptyStatus) {
    const custom = renderEmpty?.(status);
    if (custom !== undefined)
      return (
        <div data-part="empty" data-part-empty="">
          {custom}
        </div>
      );
    const titleText =
      status === 'error'
        ? typeof error === 'string'
          ? error
          : t('errorTitle')
        : status === 'no-results'
          ? t('noResultsTitle')
          : t('emptyTitle');
    return (
      <div data-part="empty" data-part-empty="">
        <ResultState reach="section" status={status} tabIndex={-1}>
          <ResultStateContent>
            <ResultStateTitle>{titleText}</ResultStateTitle>
          </ResultStateContent>
          {status === 'no-results' ? (
            <ResultStateActions>
              <Button
                onClick={(event) =>
                  requestQuery(
                    {
                      ...query,
                      filter: null,
                      search: '',
                      page:
                        query.page && 'index' in query.page
                          ? { ...query.page, index: 0 }
                          : query.page,
                    },
                    'filter',
                    'clear',
                    event,
                  )
                }
                size="md"
                tone="secondary"
                variant="outline"
              >
                {t('clearFilters')}
              </Button>
            </ResultStateActions>
          ) : status === 'error' && onRetry ? (
            <ResultStateActions>
              <Button onClick={() => onRetry()} size="md" tone="secondary" variant="outline">
                {t('retry')}
              </Button>
            </ResultStateActions>
          ) : null}
        </ResultState>
      </div>
    );
  }

  if (!loading) loadingMore.current = false;
  const refreshing = loading && !showLoader && rows.length > 0 && !loadingMore.current;
  const errorOverRows = error && rows.length > 0 && !showLoader;

  return (
    <div
      {...withSelectorKey(rest, 'part', 'root')}
      aria-busy={refreshing || undefined}
      className={className}
      data-loading={refreshing ? '' : undefined}

      data-size={size}
      data-ui="data-list"
      data-ui-data-list=""
      data-variant={variant}
      onBlur={onRootBlur}
      ref={rootRef}
    >
      {header}
      {errorOverRows ? renderEmptyState('error') : null}
      {loader}
      {showLoader || emptyStatus !== null ? null : (
        <List
          aria-label={labelledBy === undefined ? label : undefined}
          aria-labelledby={labelledBy}
          size={size}
          variant={variant}
        >
          {renderNodes(nodes)}
        </List>
      )}
      {emptyStatus === null ? null : renderEmptyState(emptyStatus)}
      {hasMore || footer !== undefined ? (
        <div data-part="footer" data-part-footer="">
          {hasMore && !showLoader ? (
            <span data-part="load-more" data-part-load-more="">
              <Button
                loading={loading && loadingMore.current}
                onClick={() => {
                  loadingMore.current = true;
                  onLoadMore?.();
                }}
                size="sm"
                tone="secondary"
                variant="outline"
              >
                {t('loadMore')}
              </Button>
            </span>
          ) : null}
          {footer}
        </div>
      ) : null}
    </div>
  );
}
