import {
  emptyGridView,
  serializeGridView,
  type GridColumn,
  type GridView,
  type GridViewStorage,
  type SavedViewsState,
} from '@slotted/core/grid';
import { useMemo, useState } from 'react';

import { Button } from '../button';
import { DataGrid } from '../data-grid';
import { usePersistedGridView } from '../data-grid/use-persisted-grid-view';
import { Inline } from '../inline';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { SavedViews } from './saved-views';
import type { SavedViewsProps } from './saved-views.types';
import { usePersistedSavedViews } from './use-persisted-saved-views';

/* ── The domain: an orders listing ──────────────────────────────────────── */

export interface Order {
  id: string;
  customer: string;
  region: string;
  status: string;
  total: number;
  due: string;
}

export const ORDERS: Order[] = [
  {
    id: 'SO-2026-01842',
    customer: 'Northwind Fabrication',
    region: 'Midwest',
    status: 'Late',
    total: 12480,
    due: '2026-09-15',
  },
  {
    id: 'SO-2026-01843',
    customer: 'Helios Automation GmbH',
    region: 'Europe',
    status: 'Open',
    total: 4120,
    due: '2026-09-28',
  },
  {
    id: 'SO-2026-01844',
    customer: 'Meridian Controls Group',
    region: 'Midwest',
    status: 'Open',
    total: 18900,
    due: '2026-10-02',
  },
  {
    id: 'SO-2026-01845',
    customer: 'Aurora Textiles',
    region: 'Northeast',
    status: 'Late',
    total: 2310,
    due: '2026-09-12',
  },
  {
    id: 'SO-2026-01846',
    customer: 'Columbus Tool & Die',
    region: 'Midwest',
    status: 'Shipped',
    total: 7640,
    due: '2026-09-20',
  },
  {
    id: 'SO-2026-01847',
    customer: 'Pacific Rim Logistics',
    region: 'West',
    status: 'Late',
    total: 31200,
    due: '2026-09-18',
  },
  {
    id: 'SO-2026-01848',
    customer: 'Blue Ridge Components',
    region: 'Southeast',
    status: 'Open',
    total: 960,
    due: '2026-10-06',
  },
  {
    id: 'SO-2026-01849',
    customer: 'Great Lakes Hydraulics',
    region: 'Midwest',
    status: 'Late',
    total: 15325,
    due: '2026-09-10',
  },
];

export const COLUMNS: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', rowHeader: true, width: 150 },
  { id: 'customer', label: 'Customer', width: 220 },
  {
    id: 'region',
    label: 'Region',
    kind: 'set',
    options: [
      { value: 'Midwest', label: 'Midwest' },
      { value: 'Northeast', label: 'Northeast' },
      { value: 'Southeast', label: 'Southeast' },
      { value: 'West', label: 'West' },
      { value: 'Europe', label: 'Europe' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    options: [
      { value: 'Open', label: 'Open' },
      { value: 'Late', label: 'Late' },
      { value: 'Shipped', label: 'Shipped' },
    ],
  },
  {
    id: 'total',
    label: 'Total',
    kind: 'number',
    format: (value) => `US$ ${Number(value).toLocaleString('en-US')}`,
  },
  { id: 'due', label: 'Due', kind: 'date' },
];

const MODEL = COLUMNS as unknown as readonly GridColumn<never>[];

/** The application's defaults: every column, sorted by order number. */
export const BUILT_IN: GridView = {
  ...emptyGridView(),
  query: { ...emptyGridView().query, sort: [{ column: 'id', direction: 'ascending' }] },
};

export const LATE: GridView = {
  ...BUILT_IN,
  query: { ...BUILT_IN.query, search: 'Late', sort: [{ column: 'due', direction: 'ascending' }] },
};

export const REGION: GridView = {
  ...BUILT_IN,
  columns: { ...BUILT_IN.columns, hidden: ['region'] },
  query: { ...BUILT_IN.query, search: 'Midwest' },
};

export const HIGH: GridView = {
  ...BUILT_IN,
  density: 'compact',
  query: { ...BUILT_IN.query, sort: [{ column: 'total', direction: 'descending' }] },
};

const line = (view: GridView) => serializeGridView(view, MODEL);

export const VIEWS: SavedViewsState = {
  views: [
    { id: 'late', name: 'Late orders', view: line(LATE) },
    { id: 'region', name: 'My region', view: line(REGION) },
    { id: 'high', name: 'High value', view: line(HIGH) },
  ],
  defaultId: null,
  activeId: 'late',
};

/** What the reader changes on the grid, as one press: the sort on the total. */
export function sortedByTotal(view: GridView): GridView {
  const descending =
    view.query.sort[0]?.column === 'total' && view.query.sort[0].direction === 'descending';
  return {
    ...view,
    query: {
      ...view.query,
      sort: [{ column: 'total', direction: descending ? 'ascending' : 'descending' }],
    },
  };
}

/**
 * The control over a stand-in for the grid: the current view as the line of
 * text it is kept as, and one press that changes it. Every scene without a
 * grid is this, so each one shows the request and the view it produced.
 */
export function ViewsBar({
  initialView = LATE,
  ...props
}: Partial<SavedViewsProps> & { initialView?: GridView }) {
  const [current, setCurrent] = useState<GridView>(initialView);
  const [log, setLog] = useState('');
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <SavedViews
          builtIn={BUILT_IN}
          columns={MODEL}
          current={current}
          defaultState={VIEWS}
          onStateChange={(_, request) => setLog(`${request.action} · ${request.reason}`)}
          onViewApply={(view) => setCurrent(view)}
          {...props}
        />
        <Button
          onClick={() => setCurrent(sortedByTotal(current))}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Sort by total
        </Button>
      </Inline>
      <TextField
        aria-label="The view in use, as it is kept"
        mono
        readOnly
        value={line(current) || '(the built-in view)'}
      />
      <Text size="sm" tone="muted">
        {log === '' ? 'No request yet' : `Last request: ${log}`}
      </Text>
    </Stack>
  );
}

/** A store in memory that says what it holds, so a scene shows the entry written. */
export function useMemoryStore(initial: Record<string, string> = {}) {
  const [data, setData] = useState(initial);
  const storage = useMemo<GridViewStorage>(() => {
    const held = { ...initial };
    return {
      getItem: (key) => held[key] ?? null,
      setItem: (key, value) => {
        held[key] = value;
        setData({ ...held });
      },
      removeItem: (key) => {
        delete held[key];
        setData({ ...held });
      },
    };
  }, []);
  return { data, storage };
}

/** The whole desk: the saved views above a grid, both kept in one store. */
export function OrdersDesk() {
  const { storage } = useMemoryStore({
    'orders:views': JSON.stringify({ v: 1, ...VIEWS, activeId: null, defaultId: 'late' }),
  });
  const views = usePersistedSavedViews({ key: 'orders:views', storage, columns: MODEL });
  const grid = usePersistedGridView({
    key: 'orders:grid',
    columns: COLUMNS,
    storage,
    defaultQuery: (views.openedDefault ?? BUILT_IN).query,
    defaultColumnState: (views.openedDefault ?? BUILT_IN).columns,
    defaultDensity: (views.openedDefault ?? BUILT_IN).density,
  });
  const current: GridView = { columns: grid.columnState, query: grid.query, density: grid.density };
  return (
    <Stack gap={4}>
      <SavedViews
        builtIn={BUILT_IN}
        columns={MODEL}
        current={current}
        onStateChange={views.onStateChange}
        onViewApply={grid.setView}
        state={views.state}
      />
      <DataGrid
        columnState={grid.columnState}
        columns={COLUMNS}
        density={grid.density}
        height="22rem"
        aria-label="Orders"
        onColumnStateChange={grid.onColumnStateChange}
        onQueryChange={grid.onQueryChange}
        query={grid.query}
        rowKey="id"
        rows={ORDERS}
      />
    </Stack>
  );
}
