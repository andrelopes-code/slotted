import {
  applyQuery,
  emptyQuery,
  withFilter,
  withPageIndex,
  withPageSize,
  withSearch,
  type GridColumn,
  type GridQuery,
} from '@slotted/core/grid';
import type { FilterGroup } from '@slotted/core/filter';
import { useMemo, useState, type ReactNode } from 'react';

import {
  ActionBar,
  ActionBarActions,
  ActionBarOverflow,
  ActionBarStatus,
} from '@slotted/react/action-bar';
import { Button } from '@slotted/react/button';
import { DataGrid, type DataGridCellContext } from '@slotted/react/data-grid';
import { FilterBar, type FilterBarField } from '@slotted/react/filter-bar';
import { Page, PageBody } from '@slotted/react/page';
import {
  Pagination,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationStatus,
} from '@slotted/react/pagination';
import { Text } from '@slotted/react/typography';

import { ScreenHeader, type ScreenView } from './ScreenHeader';

export interface ListView<Row> extends ScreenView {
  /** The rows the view keeps; absent, every row. */
  keep?: ((row: Row) => boolean) | undefined;
}

export interface ListPageProps<Row> {
  title: string;
  subheading: ReactNode;
  actions?: ReactNode;
  /** The record's name, one and many, for every count on the screen (LP-08). */
  noun: [string, string];
  rows: readonly Row[];
  views?: readonly Omit<ListView<Row>, 'count'>[] | undefined;
  columns: GridColumn<Row>[];
  rowKey: keyof Row & string;
  fields: FilterBarField[];
  cellRenderers?: Readonly<Record<string, (context: DataGridCellContext<Row>) => ReactNode>>;
  initialQuery?: GridQuery | undefined;
  /** Opens a record when the screen has somewhere to show it. */
  onOpen?: ((key: string) => void) | undefined;
  /** The actions a selection allows, in the page's footer (LP-03). */
  bulk?: ((selected: readonly string[]) => ReactNode) | undefined;
}

const PAGE_SIZES = [25, 50, 100];

/**
 * A list screen: the views as the header's tabs, a filter bar over a grid that
 * fills the body and scrolls its own rows, the pager under the rows and the
 * selection's actions in the page's footer.
 */
export function ListPage<Row>({
  title,
  subheading,
  actions,
  noun,
  rows,
  views,
  columns,
  rowKey,
  fields,
  cellRenderers,
  initialQuery,
  onOpen,
  bulk,
}: ListPageProps<Row>) {
  const [view, setView] = useState(views?.[0]?.value);
  const [query, setQuery] = useState<GridQuery>(
    initialQuery ?? emptyQuery({ index: 0, size: PAGE_SIZES[0]! }),
  );
  const [selected, setSelected] = useState<readonly string[]>([]);

  const counted = useMemo(
    () =>
      views?.map((entry) => ({
        ...entry,
        count: entry.keep ? rows.filter(entry.keep).length : rows.length,
      })),
    [rows, views],
  );
  const scoped = useMemo(() => {
    const keep = views?.find((entry) => entry.value === view)?.keep;
    return keep ? rows.filter(keep) : rows;
  }, [rows, view, views]);
  const kept = useMemo(
    () =>
      applyQuery(scoped, columns, query, {
        rowKey: (row) => String(row[rowKey]),
        booleans: { true: 'Yes', false: 'No' },
      }).total,
    [columns, query, rowKey, scoped],
  );

  const [one, many] = noun;

  return (
    <Page
      landmark="none"
      width="bleed"
      inset={5}
      fill
      scroll="self"
      footer={
        bulk && selected.length > 0 ? (
          <ActionBar aria-label={`Actions on the selected ${many}`} present variant="raised">
            <ActionBarStatus>
              <Text size="sm" weight="semibold">
                {selected.length} {selected.length === 1 ? one : many} selected
              </Text>
              <Button size="sm" variant="ghost" tone="secondary" onClick={() => setSelected([])}>
                Clear
              </Button>
            </ActionBarStatus>
            <ActionBarActions>
              {bulk(selected)}
              <ActionBarOverflow />
            </ActionBarActions>
          </ActionBar>
        ) : undefined
      }
    >
      <ScreenHeader
        title={title}
        subheading={subheading}
        actions={actions}
        views={counted}
        view={view}
        onView={(next) => {
          setView(next);
          setSelected([]);
          setQuery((current) => withPageIndex(current, 0).query);
        }}
      />
      <PageBody>
        <div className="console-listing">
          <FilterBar
            aria-label={`${title} filters`}
            fields={fields}
            query={query.search}
            onQueryChange={(text) => setQuery(withSearch(query, text).query)}
            value={query.filter}
            onValueChange={(filter: FilterGroup | null) =>
              setQuery(withFilter(query, filter).query)
            }
            count={kept}
            total={kept === scoped.length ? undefined : scoped.length}
            messages={{
              count: `{count} of {total} ${many}`,
              countOnly: `{count, plural, one {# ${one}} other {# ${many}}}`,
            }}
          />
          <DataGrid<Row>
            aria-label={title}
            rowKey={rowKey}
            rows={scoped}
            columns={columns}
            variant="framed"
            query={query}
            onQueryChange={setQuery}
            selectionMode="multiple"
            value={selected}
            onValueChange={(next) =>
              setSelected(Array.isArray(next) ? next : next ? [next as string] : [])
            }
            {...(cellRenderers ? { cellRenderers } : {})}
            {...(onOpen
              ? { activatable: true, onActivate: (event: { key: string }) => onOpen(event.key) }
              : {})}
            showRange={false}
            footer={
              <Pagination
                aria-label={`${title} pages`}
                count={kept}
                page={(query.page && 'index' in query.page ? query.page.index : 0) + 1}
                pageSize={query.page?.size ?? PAGE_SIZES[0]}
                pageSizeOptions={PAGE_SIZES}
                onPageChange={(page) => setQuery(withPageIndex(query, page - 1).query)}
                onPageSizeChange={(size) => setQuery(withPageSize(query, size).query)}
                messages={{
                  range: `{count, plural, =0 {No ${many}} other {{start}–{end} of {count} ${many}}}`,
                  pageSize: `${title} per page`,
                }}
              >
                <PaginationPageSize />
                <PaginationStatus />
                <PaginationPrevious />
                <PaginationNext />
              </Pagination>
            }
          />
        </div>
      </PageBody>
    </Page>
  );
}
