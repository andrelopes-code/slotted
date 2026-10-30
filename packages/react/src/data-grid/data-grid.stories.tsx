import type { FilterGroup } from '@slotted/core/filter';
import {
  emptyQuery,
  serializeColumnState,
  withColumnFilter,
  withFilter,
  withPageIndex,
  withPageSize,
  withColumnHidden,
  withSearch,
  type GridCell,
  type GridColumn,
  type GridColumnState,
  type GridDensity,
  type GridOutOfSpace,
  type GridQuery,
  type GridRange,
} from '@slotted/core/grid';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Image } from '../image';
import { Inline } from '../inline';
import { FilterBar } from '../filter-bar';
import {
  Pagination,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationStatus,
} from '../pagination';
import { Text } from '../typography';
import { TextField } from '../text-field';
import { createToaster, ToasterProvider, ToastRegion } from '../toast';
import { DataGrid } from './data-grid';
import { usePersistedGridView } from './use-persisted-grid-view';
import { REACT_DATA_GRID_DOCS, REACT_DATA_GRID_TOKENS } from './data-grid.docs';
import type {
  DataGridColumn,
  DataGridDataSource,
  DataGridHandle,
  DataGridProps,
} from './data-grid.types';

/* ── The domain: shipments ─────────────────────────────────────────────── */

interface Shipment {
  id: string;
  customer: string;
  destination: string;
  carrier: string;
  weight: number | null;
  status: string;
  shipped: string;
  eta: string;
  cost: number;
  priority: boolean;
}

const CUSTOMERS = [
  'Aurora Textiles',
  'Bloom & Co.',
  'Nordwind Logistik GmbH',
  'Casa Verde',
  'Helios Solar',
  'Ondina Marine',
  'Midwest Pharmaceutical Distribution and Hospital Logistics Co.',
  'Kestrel Aerospace',
  'Zafiro Cerámica',
  'Mól & Fils',
  'Vesta Foods',
  'Ærøskøbing Bryggeri',
];
const DESTINATIONS = [
  'Porto, PT',
  'Lyon, FR',
  'Hamburg, DE',
  'Sevilla, ES',
  'Athens, GR',
  'Genova, IT',
  'Tacoma, US',
  'Reykjavík, IS',
  'Kraków, PL',
  'Dublin, IE',
];
const CARRIERS = ['DHL', 'UPS', 'FedEx', 'Maersk', 'DB Schenker'];
const STATUSES = ['In transit', 'Delivered', 'Delayed', 'Customs', 'Returned'];

/** A deterministic generator, so every render of a scene is the same picture. */
function shipments(count: number, seed = 7): Shipment[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
  return Array.from({ length: count }, (_unused, index) => {
    const day = 1 + Math.floor(random() * 28);
    const hour = Math.floor(random() * 24);
    const weight = random() < 0.06 ? null : Math.round(random() * 20000) / 10;
    return {
      id: `SHP-${20481 + index}`,
      customer: pick(CUSTOMERS),
      destination: pick(DESTINATIONS),
      carrier: pick(CARRIERS),
      weight,
      status: pick(STATUSES),
      shipped: `2026-09-${String(day).padStart(2, '0')}`,
      eta: `2026-09-${String(Math.min(28, day + 3 + Math.floor(random() * 6))).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`,
      cost: Math.round((weight ?? 40) * (4 + random() * 8) * 100) / 100,
      priority: random() < 0.3,
    };
  });
}

const EIGHT = shipments(8);
const FIFTY = shipments(50);
const TEN_THOUSAND = shipments(10_000, 3);

const money = (value: unknown) =>
  typeof value === 'number'
    ? `€ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
const kilograms = (value: unknown) =>
  typeof value === 'number'
    ? `${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
    : '—';

const StatusBadge = ({ status }: { status: string }) => (
  <Badge
    tone={
      status === 'Delivered'
        ? 'success'
        : status === 'Delayed'
          ? 'danger'
          : status === 'Customs'
            ? 'warning'
            : 'secondary'
    }
    variant="soft"
  >
    {status}
  </Badge>
);

const columns: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Tracking', rowHeader: true, width: 132, text: 'nowrap' },
  { id: 'customer', label: 'Customer', width: 200, editable: true },
  { id: 'destination', label: 'Destination', width: 160, editable: true },
  {
    id: 'carrier',
    label: 'Carrier',
    kind: 'set',
    width: 130,
    options: CARRIERS.map((value) => ({ value, label: value })),
    editable: true,
  },
  {
    id: 'weight',
    label: 'Weight',
    kind: 'number',
    width: 120,
    format: kilograms,
    aggregate: 'sum',
    editable: true,
    validate: (value) =>
      typeof value === 'number' && value < 0 ? 'A weight is not negative' : null,
  },
  {
    id: 'status',
    label: 'Status',
    kind: 'set',
    width: 130,
    options: STATUSES.map((value) => ({ value, label: value })),
  },
  { id: 'shipped', label: 'Shipped', kind: 'date', width: 150 },
  { id: 'eta', label: 'ETA', kind: 'datetime', width: 210 },
  { id: 'cost', label: 'Cost', kind: 'number', width: 130, format: money, aggregate: 'sum' },
  { id: 'priority', label: 'Priority', kind: 'boolean', width: 100 },
];

const withStatusBadges = {
  status: ({ value }: { value: unknown }) => <StatusBadge status={String(value)} />,
};

/* ── Scaffolding ───────────────────────────────────────────────────────── */

/** What the stories' mock server writes for a boolean when it searches: its own words, not the grid's. */
const SERVER_BOOLEANS = { true: 'Yes', false: 'No' };

const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

/**
 * A grid owns a screen's worth of decisions, and its picture depends on its
 * width: it stands on a stage, in a desktop-wide room, in a screen- or
 * card-sized viewport, and takes the viewport's height. What a demonstration
 * says beside the grid — a status line, a control — stands on the same stage
 * above the room, so the stage owns the gap between the two.
 */
const Screen = ({
  before,
  children,
  room = 'desktop',
  size = 'screen',
}: {
  before?: ReactNode;
  children: ReactNode;
  room?: 'desktop' | 'phone';
  size?: 'screen' | 'tall';
}) => (
  <div className="slotted-demo-stage" data-layout="block">
    {before}
    <div className="slotted-demo-room" data-room={room}>
      <div className="slotted-demo-viewport" data-size={size}>
        {children}
      </div>
    </div>
  </div>
);

const Shipments = (props: Partial<DataGridProps<Shipment>>) => (
  <DataGrid<Shipment>
    cellRenderers={withStatusBadges}
    columns={columns}
    height="100%"
    aria-label="Shipments"
    rowKey="id"
    rows={FIFTY}
    variant="framed"
    {...props}
  />
);

/* ── Stories ───────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATA_GRID_DOCS['data-grid'].scenes, {
    accessibility: Accessibility,
    activation: Activation,
    'column-groups': ColumnGroups,
    'column-help': ColumnHelp,
    'column-menu': ColumnMenu,
    'column-state': ColumnState,
    columns: Columns,
    content: Content,
    density: Density,
    detail: Detail,
    editing: Editing,
    'editing-row': EditingRow,
    'empty-and-loading': EmptyAndLoading,
    'filter-bar': WithFilterBar,
    'filter-panel': FilterPanel,
    'filter-row': FilterRow,
    grouping: Grouping,
    keyboard: Keyboard,
    'load-more': LoadMore,
    pagination: PaginationScene,
    pinning: Pinning,
    playground: Playground,
    range: Range,
    reorder: Reorder,
    resize: Resize,
    'responsive-priority': ResponsivePriority,
    search: Search,
    selection: Selection,
    server: Server,
    sorting: Sorting,
    summary: Summary,
    text: TextTreatment,
    'undo-hide': UndoHide,
    validation: Validation,
    variant: Variant,
    virtualization: Virtualization,
  });

const meta = {
  title: 'Components/Data grid',
  args: { columns, rowKey: 'id', rows: FIFTY } as never,
  component: DataGrid,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Data grid',
        description:
          'The composite widget for large, interactive tabular data: one cursor over every cell, a query the grid applies or a server answers, columns the reader arranges, and editing in place.',
        framework: 'React',
        ...REACT_DATA_GRID_DOCS['data-grid'],
        tokens: REACT_DATA_GRID_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DataGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    selectionMode: 'multiple',
    striped: false,
    variant: 'framed',
    filterRow: false,
    editMode: 'cell',
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Screen>
      <Shipments {...(args as Partial<DataGridProps<Shipment>>)} />
    </Screen>
  ),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => (
    <Screen size="tall">
      <Shipments rows={EIGHT} />
    </Screen>
  ),
};

export const ColumnGroups: Story = {
  parameters: scenario('column-groups'),
  render: () => (
    <Screen size="tall">
      <Shipments
        columnGroups={[
          { id: 'shipment', label: 'Shipment', columns: ['id', 'customer', 'destination'] },
          { id: 'timing', label: 'Timing', columns: ['shipped', 'eta'] },
          { id: 'money', label: 'Charges', columns: ['weight', 'cost'] },
        ]}
        rows={EIGHT}
      />
    </Screen>
  ),
};

const SortingDemo = () => {
  const [query, setQuery] = useState<GridQuery>({
    ...emptyQuery(),
    sort: [
      { column: 'carrier', direction: 'ascending' },
      { column: 'weight', direction: 'descending' },
    ],
  });
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          Order: {query.sort.map((key) => `${key.column} ${key.direction}`).join(', ') || 'none'}
        </Text>
      }
    >
      <Shipments onQueryChange={setQuery} query={query} rows={FIFTY.slice(0, 12)} />{' '}
    </Screen>
  );
};

export const Sorting: Story = { parameters: scenario('sorting'), render: () => <SortingDemo /> };

export const FilterPanel: Story = {
  parameters: scenario('filter-panel'),
  render: () => (
    <Screen size="tall">
      <Shipments
        defaultCurrent={{ row: 'header', column: 'customer' }}
        defaultQuery={
          withColumnFilter(emptyQuery(), 'customer', {
            kind: 'text',
            join: 'or',
            conditions: [
              { operator: 'contains', value: 'nord' },
              { operator: 'startsWith', value: 'B' },
            ],
          }).query
        }
      />
    </Screen>
  ),
};

export const FilterRow: Story = {
  parameters: scenario('filter-row'),
  render: () => (
    <Screen>
      <Shipments
        defaultQuery={
          withColumnFilter(emptyQuery(), 'status', {
            kind: 'set',
            join: 'and',
            conditions: [{ operator: 'anyOf', value: ['Delayed', 'Customs'] }],
          }).query
        }
        filterRow
      />
    </Screen>
  ),
};

const FilterBarDemo = () => {
  const [query, setQuery] = useState<GridQuery>(
    withColumnFilter(emptyQuery(), 'carrier', {
      kind: 'set',
      join: 'and',
      conditions: [{ operator: 'anyOf', value: ['DHL', 'UPS'] }],
    }).query,
  );
  return (
    <Screen
      size="tall"
      before={
        <FilterBar
          fields={[
            { key: 'customer', label: 'Customer', kind: 'text' },
            {
              key: 'carrier',
              label: 'Carrier',
              kind: 'set',
              options: CARRIERS.map((value) => ({ value, label: value })),
            },
            {
              key: 'status',
              label: 'Status',
              kind: 'set',
              options: STATUSES.map((value) => ({ value, label: value })),
            },
            { key: 'weight', label: 'Weight', kind: 'number' },
            { key: 'shipped', label: 'Shipped', kind: 'date' },
          ]}
          onQueryChange={(text) => setQuery(withSearch(query, text).query)}
          onValueChange={(filter: FilterGroup | null) => setQuery(withFilter(query, filter).query)}
          query={query.search}
          value={query.filter}
        />
      }
    >
      <Shipments onQueryChange={setQuery} query={query} />{' '}
    </Screen>
  );
};

export const WithFilterBar: Story = {
  parameters: scenario('filter-bar'),
  render: () => <FilterBarDemo />,
};

const SearchDemo = () => {
  const [query, setQuery] = useState<GridQuery>({ ...emptyQuery(), search: 'gaia' });
  return (
    <Screen
      size="tall"
      before={
        <TextField
          aria-label="Search shipments"
          onValueChange={(text) => setQuery(withSearch(query, text).query)}
          placeholder="Search shipments"
          value={query.search}
        />
      }
    >
      <Shipments onQueryChange={setQuery} query={query} />{' '}
    </Screen>
  );
};

export const Search: Story = { parameters: scenario('search'), render: () => <SearchDemo /> };

const SelectionDemo = () => {
  const [value, setValue] = useState<string | readonly string[] | null>(['SHP-20482', 'SHP-20483']);
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          Selected: {Array.isArray(value) ? value.join(', ') || 'nothing' : String(value)}
        </Text>
      }
    >
      <Shipments
        onValueChange={setValue}
        rows={FIFTY.slice(0, 12)}
        selectionMode="multiple"
        value={value}
      />{' '}
    </Screen>
  );
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => <SelectionDemo />,
};

/** The keys of the shipments at these one-based positions. */
const nth = (...positions: number[]) => positions.map((position) => `SHP-${20480 + position}`);

const SELECTION_SCENES: {
  label: string;
  note: string;
  props: Partial<DataGridProps<Shipment>>;
  room?: 'desktop' | 'phone';
}[] = [
  {
    label: 'ruled: a run and a lone row',
    note: 'Rows 2–4 are one block; row 7 stands alone; row 10, the last, closes on its own edge.',
    props: { defaultValue: nth(2, 3, 4, 7, 10), rows: FIFTY.slice(0, 10), variant: 'ruled' },
  },
  {
    label: 'framed: runs at both ends',
    note: 'The head closes the top run and the frame closes the bottom one.',
    props: { defaultValue: nth(1, 2, 7, 8), rows: EIGHT, variant: 'framed' },
  },
  {
    label: 'framed, striped',
    note: 'A run over even and odd rows: one ground for both.',
    props: { defaultValue: nth(3, 4, 5), rows: EIGHT, striped: true },
  },
  {
    label: 'plain',
    note: 'No rules to tint: the ground alone.',
    props: { defaultValue: nth(2, 3, 6), rows: EIGHT, variant: 'plain' },
  },
  {
    label: 'pinned zones, scrolled',
    note: 'Scroll sideways: the zone edges inside the block take the inner tint, the shadow stays.',
    props: {
      defaultColumnState: { pinned: { start: ['id'], end: ['priority'] } },
      defaultValue: nth(2, 3, 4),
      rows: EIGHT,
    },
    room: 'phone',
  },
  {
    label: 'every row',
    note: 'The whole body is one block.',
    props: { defaultValue: nth(1, 2, 3, 4, 5, 6), rows: FIFTY.slice(0, 6), variant: 'ruled' },
  },
  {
    label: 'single',
    note: 'One selected row; press another to move it.',
    props: { defaultValue: 'SHP-20483', rows: EIGHT, selectionMode: 'single' },
  },
  {
    label: 'the cursor in a selected row',
    note: 'The cursor rests on Customer of row 3; Enter edits it inside the block.',
    props: {
      defaultCurrent: { row: 'SHP-20483', column: 'customer' },
      defaultValue: nth(2, 3, 4),
      rows: EIGHT,
    },
  },
  {
    label: 'compact',
    note: 'The block at the compact density.',
    props: { defaultValue: nth(2, 3, 4), density: 'compact', rows: EIGHT },
  },
  {
    label: 'dense',
    note: 'The block at the dense density.',
    props: { defaultValue: nth(2, 3, 4), density: 'dense', rows: EIGHT },
  },
  {
    label: 'grouped',
    note: 'A group row between two selected rows ends one block and starts the next.',
    props: {
      defaultQuery: { ...emptyQuery(), group: ['carrier'] },
      defaultValue: nth(1, 2, 3, 4, 5, 6, 7, 8),
      rows: FIFTY.slice(0, 12),
    },
  },
  {
    label: 'a detail open under a selected row',
    note: 'Row 2 is selected and expanded; the detail is outside the block.',
    props: {
      defaultExpanded: ['SHP-20482'],
      defaultValue: nth(2, 3),
      renderDetail: (row) => (
        <Text size="sm" tone="muted">
          {row.customer} · {row.destination} · {row.carrier}
        </Text>
      ),
      rows: EIGHT,
    },
  },
  {
    label: 'pinned rows',
    note: 'Row 1 pinned to the top and row 8 to the bottom, both selected with their neighbours.',
    props: {
      defaultValue: nth(1, 2, 8, 7),
      pinnedRows: { top: ['SHP-20481'], bottom: ['SHP-20488'] },
      rows: FIFTY.slice(0, 20),
    },
  },
  {
    label: 'a disabled row inside a run',
    note: 'Row 4 is disabled and unselected; it splits the run in two.',
    props: { defaultValue: nth(2, 3, 5, 6), disabledKeys: nth(4), rows: EIGHT },
  },
  {
    label: 'ten thousand rows, windowed',
    note: 'Two rows in every three selected; scroll to see the blocks enter and leave the window.',
    props: {
      defaultValue: TEN_THOUSAND.filter((_row, index) => index % 3 !== 2).map((row) => row.id),
      rows: TEN_THOUSAND,
    },
  },
];

/** Every arrangement a selected row meets, on one page, for review in both schemes. */
export const SelectionLab: Story = {
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      {SELECTION_SCENES.map(({ label, note, props, room = 'desktop' }) => (
        <Scene key={label} label={label} note={note}>
          <Screen room={room} size="tall">
            <Shipments selectionMode="multiple" {...props} />
          </Screen>
        </Scene>
      ))}
    </div>
  ),
};

const RangeDemo = () => {
  const [range, setRange] = useState<GridRange | null>({
    anchor: { row: 'SHP-20482', column: 'customer' },
    focus: { row: 'SHP-20484', column: 'weight' },
  });
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {range
            ? `${range.anchor.row}/${range.anchor.column} → ${range.focus.row}/${range.focus.column}`
            : 'No range'}
        </Text>
      }
    >
      <Shipments
        defaultCurrent={{ row: 'SHP-20484', column: 'weight' }}
        onRangeChange={setRange}
        range={range}
        rows={FIFTY.slice(0, 12)}
        selectionMode="range"
      />{' '}
    </Screen>
  );
};

export const Range: Story = { parameters: scenario('range'), render: () => <RangeDemo /> };

const EditingDemo = ({ editMode }: { editMode: 'cell' | 'row' }) => {
  const [rows, setRows] = useState(() => FIFTY.slice(0, 8));
  const [log, setLog] = useState<string[]>([]);
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {log.length === 0 ? 'Nothing committed yet' : log.slice(-3).join(' · ')}
        </Text>
      }
    >
      <Shipments
        defaultCurrent={{ row: 'SHP-20481', column: 'customer' }}
        editMode={editMode}
        onEditCommit={async ({ key, changes }) => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setRows((current) =>
            current.map((row) => (row.id === key ? { ...row, ...changes } : row)),
          );
          setLog((current) => [...current, `${key}: ${Object.keys(changes).join(', ')}`]);
        }}
        rows={rows}
      />{' '}
    </Screen>
  );
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => <EditingDemo editMode="cell" />,
};
export const EditingRow: Story = {
  parameters: scenario('editing-row'),
  render: () => <EditingDemo editMode="row" />,
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => (
    <Screen size="tall">
      <Shipments
        defaultCurrent={{ row: 'SHP-20481', column: 'weight' }}
        onEditCommit={({ column }) =>
          column === 'destination'
            ? Promise.reject(new Error('The shipping service is offline'))
            : undefined
        }
        rows={FIFTY.slice(0, 8)}
      />
    </Screen>
  ),
};

const ActivationDemo = () => {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {opened ? `Opened ${opened}` : 'Double press a row, or Enter on its tracking cell'}
        </Text>
      }
    >
      <Shipments
        activatable
        defaultCurrent={{ row: 'SHP-20481', column: 'id' }}
        onActivate={({ key }) => setOpened(key)}
        rows={FIFTY.slice(0, 8)}
      />{' '}
    </Screen>
  );
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => <ActivationDemo />,
};

export const Pinning: Story = {
  parameters: scenario('pinning'),
  render: () => (
    <Screen size="tall">
      <Shipments
        defaultColumnState={{ pinned: { start: ['id'], end: ['priority'] } }}
        selectionMode="multiple"
      />
    </Screen>
  ),
};

const ColumnStateDemo = ({ scenarioId }: { scenarioId: string }) => {
  const [state, setState] = useState<Partial<GridColumnState> | undefined>(
    scenarioId === 'reorder'
      ? { order: ['id', 'carrier', 'customer'] }
      : { widths: { customer: 260 } },
  );
  const [last, setLast] = useState('');
  const handle = useRef<DataGridHandle | null>(null);
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          <Text size="sm" tone="muted">
            {last || 'Drag a handle, or a header; or use the keyboard on the header cell'}
          </Text>
          {scenarioId === 'resize' ? (
            <Button
              onClick={() => handle.current?.autofit()}
              size="sm"
              tone="secondary"
              variant="outline"
            >
              Fit columns
            </Button>
          ) : null}
        </div>
      }
    >
      <Shipments
        columnState={state as GridColumnState}
        defaultCurrent={{ row: 'header', column: 'customer' }}
        handle={handle}
        onColumnStateChange={(next, request) => {
          setState(next);
          setLast(`${request.change} by ${request.reason}: ${serializeColumnState(next, columns)}`);
        }}
        rows={FIFTY.slice(0, 8)}
      />{' '}
    </Screen>
  );
};

export const Resize: Story = {
  parameters: scenario('resize'),
  render: () => <ColumnStateDemo scenarioId="resize" />,
};
export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => <ColumnStateDemo scenarioId="reorder" />,
};

const ColumnMenuDemo = () => {
  const [managing, setManaging] = useState(false);
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {managing
            ? 'Manage columns asked for: the application opens its column-manager here'
            : 'Hover a header, or Ctrl+Enter on it'}
        </Text>
      }
    >
      <Shipments
        defaultCurrent={{ row: 'header', column: 'carrier' }}
        onManageColumns={() => setManaging(true)}
        rows={FIFTY.slice(0, 8)}
      />{' '}
    </Screen>
  );
};

export const ColumnMenu: Story = {
  parameters: scenario('column-menu'),
  render: () => <ColumnMenuDemo />,
};

/* The view lives in the browser's own storage, under one key, so a reload
   of this story brings the arrangement back; the field mirrors the entry. */
const VIEW_KEY = 'slotted-demo:data-grid-view';
const SavedViewDemo = () => {
  const [entry, setEntry] = useState(() => {
    try {
      return localStorage.getItem(VIEW_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const storage = useMemo(
    () => ({
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        setEntry(value);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        setEntry('');
      },
    }),
    [],
  );
  const {
    reset,
    onDensityChange: _density,
    setView: _setView,
    ...view
  } = usePersistedGridView({
    key: VIEW_KEY,
    columns,
    storage,
    defaultColumnState: { pinned: { start: ['id'], end: [] }, hidden: ['eta', 'priority'] },
  });
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          <TextField aria-label="Saved view" mono readOnly value={entry || '(nothing saved)'} />
          <Button onClick={reset} size="sm" tone="secondary" variant="outline">
            Reset view
          </Button>
        </div>
      }
    >
      <Shipments {...view} rows={FIFTY.slice(0, 8)} />
    </Screen>
  );
};

/* ── Explaining, undoing, yielding ───────────────────────────────────── */

const helpColumns: DataGridColumn<Shipment>[] = columns.map((column) =>
  column.id === 'weight'
    ? { ...column, description: 'Gross weight at pickup, in kilograms, packaging included' }
    : column.id === 'cost'
      ? { ...column, description: 'Freight cost billed by the carrier, before VAT' }
      : column.id === 'status'
        ? {
            ...column,
            help: (
              <Text size="sm">
                Customs means the shipment is held at a border for inspection; Returned means the
                consignee refused it. Delayed is set by the carrier, not by us.
              </Text>
            ),
          }
        : column,
);

export const ColumnHelp: Story = {
  parameters: scenario('column-help'),
  render: () => (
    <Screen size="tall">
      <Shipments
        columns={helpColumns}
        defaultCurrent={{ row: 'header', column: 'weight' }}
        rows={FIFTY.slice(0, 8)}
      />
    </Screen>
  ),
};

const UndoHideDemo = () => {
  const [toaster] = useState(() => createToaster());
  const [state, setState] = useState<Partial<GridColumnState>>({
    order: [],
    widths: {},
    hidden: ['eta', 'priority'],
    pinned: { start: ['id'], end: [] },
  });
  return (
    <ToasterProvider value={toaster}>
      <Screen
        size="tall"
        before={
          <Text size="sm" tone="muted">
            Hide a column from its menu; the toast’s Undo puts it back where it stood
          </Text>
        }
      >
        <Shipments
          columnState={state as GridColumnState}
          onColumnStateChange={(next, request) => {
            setState(next);
            if (request.change !== 'hidden') return;
            const shown = next.hidden.filter((column) => !request.previous.hidden.includes(column));
            const id = toaster.show({
              title: 'Column hidden',
              description: 'The column comes back to its place and its width.',
              tone: 'secondary',
              actions: (
                <Button
                  onClick={() => {
                    setState((current) =>
                      shown.reduce(
                        (state, column) =>
                          withColumnHidden(state as GridColumnState, column, false),
                        current as GridColumnState,
                      ),
                    );
                    toaster.dismiss(id, 'pointer');
                  }}
                  size="sm"
                  variant="outline"
                >
                  Undo
                </Button>
              ),
            });
          }}
          rows={FIFTY.slice(0, 8)}
        />
      </Screen>
      <ToastRegion attach="inline" />
    </ToasterProvider>
  );
};

export const UndoHide: Story = {
  parameters: scenario('undo-hide'),
  render: () => <UndoHideDemo />,
};

const PRIORITIES: Readonly<Record<string, number>> = {
  status: 1,
  eta: 2,
  weight: 3,
  carrier: 4,
  destination: 5,
  cost: 6,
};
/* Cost declines the pop-in: without room it is hidden, not moved into the row. */
const priorityColumns: GridColumn<Shipment>[] = columns.map((column) => {
  const priority = PRIORITIES[column.id];
  if (priority === undefined) return column;
  return column.id === 'cost' ? { ...column, priority, popin: false } : { ...column, priority };
});
const labelOf = (id: string) => columns.find((column) => column.id === id)?.label ?? id;

const ResponsivePriorityDemo = () => {
  const [out, setOut] = useState<GridOutOfSpace>({ popin: [], hidden: [] });
  return (
    <Screen
      room="phone"
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {out.popin.length + out.hidden.length === 0
            ? 'Every column fits'
            : `In each row: ${out.popin.map(labelOf).join(', ')}${
                out.hidden.length > 0 ? `. Hidden: ${out.hidden.map(labelOf).join(', ')}` : ''
              }`}
        </Text>
      }
    >
      <Shipments columns={priorityColumns} onOutOfSpaceChange={setOut} rows={FIFTY.slice(0, 8)} />
    </Screen>
  );
};

export const ResponsivePriority: Story = {
  parameters: scenario('responsive-priority'),
  render: () => <ResponsivePriorityDemo />,
};

export const ColumnState: Story = {
  parameters: scenario('column-state'),
  render: () => <SavedViewDemo />,
};

export const Grouping: Story = {
  parameters: scenario('grouping'),
  render: () => (
    <Screen>
      <Shipments
        defaultQuery={{
          ...emptyQuery(),
          group: ['carrier', 'status'],
          sort: [{ column: 'id', direction: 'ascending' }],
        }}
        rows={FIFTY.slice(0, 24)}
      />
    </Screen>
  ),
};

export const Summary: Story = {
  parameters: scenario('summary'),
  render: () => (
    <Screen size="tall">
      <Shipments rows={FIFTY.slice(0, 10)} />
    </Screen>
  ),
};

export const Detail: Story = {
  parameters: scenario('detail'),
  render: () => (
    <Screen size="tall">
      <Shipments
        defaultExpanded={['SHP-20481']}
        renderDetail={(row) => (
          <div className="slotted-demo-stack">
            <Text size="sm">
              {row.customer} · {row.destination} · {row.carrier}
            </Text>
            <Text size="sm" tone="muted">
              Shipped {row.shipped}, expected {row.eta.replace('T', ' ')}. {kilograms(row.weight)}{' '}
              at {money(row.cost)}.
            </Text>
          </div>
        )}
        rows={FIFTY.slice(0, 8)}
      />
    </Screen>
  ),
};

const VirtualizationDemo = () => {
  const handle = useRef<DataGridHandle | null>(null);
  return (
    <Screen
      before={
        <div className="slotted-demo-row">
          <Button
            onClick={() => handle.current?.scrollToRow('SHP-25480', 'center')}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            Scroll to row 5,000
          </Button>
          <Button
            onClick={() => handle.current?.focusCell({ row: 'SHP-30480', column: 'customer' })}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            Focus the last row
          </Button>
        </div>
      }
    >
      <Shipments handle={handle} rows={TEN_THOUSAND} selectionMode="multiple" />{' '}
    </Screen>
  );
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => <VirtualizationDemo />,
};

/** A server that answers a query in 400 milliseconds, from the ten thousand rows. */
function useShipmentServer(size: number) {
  const [query, setQuery] = useState<GridQuery>(emptyQuery({ index: 0, size }));
  const [page, setPage] = useState<{ rows: Shipment[]; total: number }>({ rows: [], total: 0 });
  const [pending, setPending] = useState(true);
  const [failing, setFailing] = useState(false);
  const request = useRef(0);
  useEffect(() => {
    const id = (request.current += 1);
    setPending(true);
    const timer = setTimeout(async () => {
      const { applyQuery } = await import('@slotted/core/grid');
      if (id !== request.current) return;
      if (failing) {
        setPending(false);
        return;
      }
      const applied = applyQuery(TEN_THOUSAND, columns, query, {
        rowKey: (row) => row.id,
        booleans: SERVER_BOOLEANS,
      });
      setPage({
        rows: applied.nodes.flatMap((node) => (node.kind === 'row' ? [node.row] : [])),
        total: applied.total,
      });
      setPending(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, failing]);
  return { query, setQuery, page, pending, failing, setFailing };
}

const ServerDemo = () => {
  const server = useShipmentServer(25);
  return (
    <Screen
      before={
        <Text size="sm" tone="muted">
          {server.pending
            ? 'Fetching…'
            : `${server.page.total.toLocaleString('en-US')} shipments on the server`}
        </Text>
      }
    >
      <Shipments
        error={server.failing ? 'The shipments service timed out' : null}
        loading={server.pending}
        onQueryChange={server.setQuery}
        onRetry={() => server.setFailing(false)}
        query={server.query}
        rows={server.page.rows}
        selectionMode="multiple"
        totalCount={server.page.total}
      />{' '}
    </Screen>
  );
};

export const Server: Story = { parameters: scenario('server'), render: () => <ServerDemo /> };

/* The same server as a data source: the grid asks, aborts, keeps and
   retries by itself; the page the reader comes back to is on screen at once. */
const shipmentSource: DataGridDataSource<Shipment> = {
  async getRows(query, { signal }) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 400);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
    if (query.search.trim().toLowerCase() === 'fail')
      throw new Error('The shipments service timed out');
    const { applyQuery } = await import('@slotted/core/grid');
    const applied = applyQuery(TEN_THOUSAND, columns, query, {
      rowKey: (row) => row.id,
      booleans: SERVER_BOOLEANS,
    });
    return {
      rows: applied.nodes.flatMap((node) => (node.kind === 'row' ? [node.row] : [])),
      total: applied.total,
    };
  },
};

const DataSourceDemo = () => {
  const [query, setQuery] = useState<GridQuery>(emptyQuery({ index: 0, size: 25 }));
  const [total, setTotal] = useState<number | undefined>(undefined);
  const handle = useRef<DataGridHandle | null>(null);
  const page = query.page && 'index' in query.page ? query.page : { index: 0, size: 25 };
  /* The pager needs the count the source answered: the source is the
     consumer's, so the consumer reads it on the way through. */
  const source = useMemo<DataGridDataSource<Shipment>>(
    () => ({
      getRows: async (asked, options) => {
        const result = await shipmentSource.getRows(asked, options);
        setTotal(result.total);
        return result;
      },
    }),
    [],
  );
  return (
    <Screen
      before={
        <div className="slotted-demo-row">
          <Text size="sm" tone="muted">
            Sort, filter or page: each query is one request; search “fail” for the error
          </Text>
          <Button
            onClick={() => handle.current?.reload()}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            Reload
          </Button>
        </div>
      }
    >
      <Shipments
        dataSource={source}
        footer={
          <Pagination
            count={total}
            onPageChange={(index) => setQuery(withPageIndex(query, index - 1).query)}
            page={page.index + 1}
            pageSize={page.size}
          >
            <PaginationStatus />
            <PaginationPrevious />
            <PaginationNext />
          </Pagination>
        }
        handle={handle}
        onQueryChange={setQuery}
        query={query}
        rows={undefined}
        selectionMode="multiple"
        showRange={false}
      />
    </Screen>
  );
};

export const DataSource: Story = {
  parameters: scenario('data-source'),
  render: () => <DataSourceDemo />,
};

const PaginationDemo = () => {
  const [query, setQuery] = useState<GridQuery>(emptyQuery({ index: 0, size: 8 }));
  const page = query.page && 'index' in query.page ? query.page : { index: 0, size: 8 };
  return (
    <Screen>
      <Shipments
        /* The bar a table carries: a page size, the range and the two
           triggers, at the inline end. The status states the range, so the
           grid's own is off. */
        footer={
          <Pagination
            count={FIFTY.length}
            onPageChange={(index) => setQuery(withPageIndex(query, index - 1).query)}
            onPageSizeChange={(size) => setQuery(withPageSize(query, size).query)}
            page={page.index + 1}
            pageSize={page.size}
            pageSizeOptions={[8, 16, 32]}
          >
            <PaginationPageSize />
            <PaginationStatus />
            <PaginationPrevious />
            <PaginationNext />
          </Pagination>
        }
        /* A paged grid is as tall as its page: a frame taller than eight
           rows left the room under them empty. */
        height={undefined}
        onQueryChange={setQuery}
        query={query}
        showRange={false}
      />
    </Screen>
  );
};

export const PaginationScene: Story = {
  parameters: scenario('pagination'),
  render: () => <PaginationDemo />,
};

const LoadMoreDemo = () => {
  const [count, setCount] = useState(20);
  const [pending, setPending] = useState(false);
  const rows = useMemo(() => TEN_THOUSAND.slice(0, count), [count]);
  const loadMore = useCallback(() => {
    if (pending) return;
    setPending(true);
    setTimeout(() => {
      setCount((current) => Math.min(TEN_THOUSAND.length, current + 20));
      setPending(false);
    }, 400);
  }, [pending]);
  return (
    <Screen size="tall">
      <Shipments
        hasMore={count < 200}
        loading={pending}
        onLoadMore={loadMore}
        query={{ ...emptyQuery(), page: { cursor: String(count), size: 20 } }}
        rows={rows}
        virtualize={false}
      />
    </Screen>
  );
};

export const LoadMore: Story = {
  parameters: scenario('load-more'),
  render: () => <LoadMoreDemo />,
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Nothing yet"
        note="A grid before the first shipment exists: the empty result-state under the header, held to the frame."
      >
        <Screen size="tall">
          <Shipments rows={[]} />
        </Screen>
      </Scene>
      <Scene
        label="Nothing after the filter"
        note="The query left nothing; Clear filters empties filter and search in one request with the reason clear."
      >
        <Screen size="tall">
          <Shipments defaultQuery={{ ...emptyQuery(), search: 'no such shipment' }} />
        </Screen>
      </Scene>
      <Scene label="A failed load" note="The message and Try again, which calls onRetry.">
        <Screen size="tall">
          <Shipments
            error="The shipments service timed out after 30 seconds"
            onRetry={() => undefined}
            rows={[]}
          />
        </Screen>
      </Scene>
      <Scene
        label="A first load"
        note="Skeleton rows the visible columns wide; a refresh over rows already shown would dim them instead."
      >
        <Screen size="tall">
          <Shipments loading rows={[]} />
        </Screen>
      </Scene>
    </div>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="plain"
        note="No band under the header and no rules: the grid reads as part of the page it stands on."
      >
        <Screen size="tall">
          <Shipments rows={EIGHT} variant="plain" />
        </Screen>
      </Scene>
      <Scene label="ruled" note="A rule between rows and the band under the header; no frame.">
        <Screen size="tall">
          <Shipments rows={EIGHT} variant="ruled" />
        </Screen>
      </Scene>
      <Scene
        label="framed, striped"
        note="The border, the radius and every second row tinted under every state."
      >
        <Screen size="tall">
          <Shipments rows={EIGHT} striped variant="framed" />
        </Screen>
      </Scene>
    </div>
  ),
};

const AWKWARD: Shipment[] = [
  {
    ...EIGHT[0]!,
    id: 'SHP-20490',
    customer: 'Midwest Pharmaceutical Distribution and Hospital Logistics Co.',
    destination: 'Tacoma, US',
  },
  {
    ...EIGHT[1]!,
    id: 'SHP-20491',
    customer: 'https://example.com/customers/0a8f1c2d-very-long-unbroken-identifier-token',
    weight: null,
  },
  {
    ...EIGHT[2]!,
    id: 'SHP-20492',
    customer: 'مؤسسة النور للتجارة العامة',
    destination: 'Dubai, AE',
  },
  { ...EIGHT[3]!, id: 'SHP-20493', customer: '', destination: 'Reykjavík, IS', cost: 0 },
];

export const TextTreatment: Story = {
  parameters: scenario('text'),
  render: () => (
    <Screen size="tall">
      <Shipments
        columns={columns.map((column) =>
          column.id === 'customer'
            ? { ...column, text: 'wrap', width: 260 }
            : column.id === 'destination'
              ? { ...column, text: 'nowrap', width: 120 }
              : column,
        )}
        rowHeight="auto"
        rows={AWKWARD}
      />
    </Screen>
  ),
};

const DENSITIES: readonly (GridDensity | null)[] = [null, 'comfortable', 'compact', 'dense'];

const DensityDemo = () => {
  const [density, setDensity] = useState<GridDensity | null>(null);
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          {DENSITIES.map((value) => (
            <Button
              aria-pressed={density === value}
              key={value ?? 'page'}
              onClick={() => setDensity(value)}
              size="sm"
              tone="secondary"
              variant={density === value ? 'solid' : 'outline'}
            >
              {value ?? 'The page’s'}
            </Button>
          ))}
        </div>
      }
    >
      <Shipments density={density} rows={FIFTY.slice(0, 10)} selectionMode="multiple" />
    </Screen>
  );
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => <DensityDemo />,
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Screen size="tall">
      <Shipments disabledKeys={['SHP-20492']} rows={AWKWARD} selectionMode="multiple" />
    </Screen>
  ),
};

/* ── Media ─────────────────────────────────────────────────────────────── */

/* A picture per shipment, drawn on the spot: a crate in the carrier's hue,
   so the scene needs no network and a window that mounts the row again draws
   the same one. */
const photoOf = (row: Shipment) => {
  const hue = (CARRIERS.indexOf(row.carrier) * 67 + Number(row.id.slice(4))) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64"><rect width="96" height="64" fill="hsl(${hue} 40% 38%)"/><rect x="20" y="14" width="56" height="40" rx="3" fill="hsl(${hue} 45% 62%)"/><path d="M20 26h56M48 14v40" stroke="hsl(${hue} 40% 30%)" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* A cell with a picture and a name is one flex row of its own: the grid
   lays a renderer's first element out as the value, and what follows it
   would not share the line. */
const CustomerCell = ({ row }: { row: Shipment }) => (
  <Inline align="center" wrap="nowrap">
    <Avatar name={row.customer} size="sm" />
    <Text truncate>{row.customer}</Text>
  </Inline>
);

/* `width` and `height` reserve the 4:3 box the way `ratio` would, at the
   thumbnail's own size instead of the column's. */
const PhotoCell = ({ row }: { row: Shipment }) => (
  <Image alt="" height={36} radius="sm" src={photoOf(row)} width={48} />
);

const mediaColumns: GridColumn<Shipment>[] = [
  columns[0]!,
  { id: 'photo', label: 'Cargo', kind: 'custom', width: 96, sortable: false, resizable: false },
  { id: 'customer', label: 'Customer', width: 240 },
  ...columns.filter((column) => ['destination', 'carrier', 'status', 'cost'].includes(column.id)),
];

const mediaRenderers = {
  ...withStatusBadges,
  customer: ({ row }: { row: Shipment }) => <CustomerCell row={row} />,
  photo: ({ row }: { row: Shipment }) => <PhotoCell row={row} />,
};

export const Media: Story = {
  parameters: scenario('media'),
  render: () => (
    <Screen size="tall">
      <Shipments
        cellRenderers={mediaRenderers}
        columns={mediaColumns}
        rowHeight={56}
        rows={TEN_THOUSAND}
        selectionMode="multiple"
      />
    </Screen>
  ),
};

/* ── Realtime ──────────────────────────────────────────────────────────── */

/* A feed that moves twenty shipments every 400 milliseconds: a weight, a
   status or a cost, on rows anywhere in the ten thousand. The rows array is
   new each tick and every untouched row keeps its identity. */
const RealtimeDemo = () => {
  const [rows, setRows] = useState(TEN_THOUSAND);
  const [live, setLive] = useState(true);
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!live) return;
    let seed = 11;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const timer = setInterval(() => {
      setRows((current) => {
        const next = current.slice();
        for (let n = 0; n < 20; n += 1) {
          /* Mostly the first screen, so the change is seen; some anywhere. */
          const index = Math.floor(random() * (n < 14 ? 24 : next.length));
          const row = next[index]!;
          const pick = random();
          next[index] =
            pick < 0.4
              ? {
                  ...row,
                  weight: Math.round((row.weight ?? 500) * (0.9 + random() * 0.2) * 10) / 10,
                }
              : pick < 0.7
                ? { ...row, status: STATUSES[Math.floor(random() * STATUSES.length)]! }
                : { ...row, cost: Math.round(row.cost * (0.95 + random() * 0.1) * 100) / 100 };
        }
        return next;
      });
      setTicks((count) => count + 1);
    }, 400);
    return () => clearInterval(timer);
  }, [live]);
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          <Text size="sm" tone="muted">
            {ticks} updates, twenty cells each
          </Text>
          <Button onClick={() => setLive((on) => !on)} size="sm" tone="secondary" variant="outline">
            {live ? 'Pause' : 'Resume'}
          </Button>
        </div>
      }
    >
      <Shipments highlightChanges rows={rows} selectionMode="multiple" />
    </Screen>
  );
};

export const Realtime: Story = {
  parameters: scenario('realtime'),
  render: () => <RealtimeDemo />,
};

/* ── Tree ──────────────────────────────────────────────────────────────── */

interface Site {
  id: string;
  parent: string | null;
  name: string;
  kind: 'country' | 'warehouse' | 'zone';
  stock: number;
  updated: string;
}

const SITE_COLUMNS: GridColumn<Site>[] = [
  { id: 'name', label: 'Site', rowHeader: true, width: 280 },
  {
    id: 'kind',
    label: 'Kind',
    kind: 'set',
    width: 130,
    options: [
      { value: 'country', label: 'Country' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'zone', label: 'Zone' },
    ],
  },
  { id: 'stock', label: 'Stock', kind: 'number', width: 120, aggregate: 'sum' },
  { id: 'updated', label: 'Updated', kind: 'date', width: 150 },
];

/* Countries, their warehouses, the zones in each: one warehouse (Porto) has
   zones that arrive only when it is opened. */
const SITES: Site[] = [
  { id: 'pt', parent: null, name: 'Portugal', kind: 'country', stock: 0, updated: '2026-09-12' },
  {
    id: 'pt-lis',
    parent: 'pt',
    name: 'Lisboa',
    kind: 'warehouse',
    stock: 0,
    updated: '2026-09-12',
  },
  {
    id: 'pt-lis-a',
    parent: 'pt-lis',
    name: 'Zona A',
    kind: 'zone',
    stock: 1240,
    updated: '2026-09-12',
  },
  {
    id: 'pt-lis-b',
    parent: 'pt-lis',
    name: 'Zona B',
    kind: 'zone',
    stock: 860,
    updated: '2026-09-10',
  },
  { id: 'pt-por', parent: 'pt', name: 'Porto', kind: 'warehouse', stock: 0, updated: '2026-09-11' },
  { id: 'es', parent: null, name: 'España', kind: 'country', stock: 0, updated: '2026-09-09' },
  {
    id: 'es-mad',
    parent: 'es',
    name: 'Madrid',
    kind: 'warehouse',
    stock: 0,
    updated: '2026-09-09',
  },
  {
    id: 'es-mad-a',
    parent: 'es-mad',
    name: 'Zona A',
    kind: 'zone',
    stock: 2210,
    updated: '2026-09-09',
  },
  {
    id: 'es-bcn',
    parent: 'es',
    name: 'Barcelona',
    kind: 'warehouse',
    stock: 0,
    updated: '2026-09-08',
  },
  {
    id: 'es-bcn-a',
    parent: 'es-bcn',
    name: 'Zona A',
    kind: 'zone',
    stock: 430,
    updated: '2026-09-08',
  },
  {
    id: 'es-bcn-b',
    parent: 'es-bcn',
    name: 'Zona B',
    kind: 'zone',
    stock: 970,
    updated: '2026-09-07',
  },
  { id: 'de', parent: null, name: 'Deutschland', kind: 'country', stock: 0, updated: '2026-09-06' },
  {
    id: 'de-ham',
    parent: 'de',
    name: 'Hamburg',
    kind: 'warehouse',
    stock: 0,
    updated: '2026-09-06',
  },
  {
    id: 'de-ham-a',
    parent: 'de-ham',
    name: 'Zone A',
    kind: 'zone',
    stock: 1520,
    updated: '2026-09-06',
  },
];
const PORTO_ZONES: Site[] = [
  {
    id: 'pt-por-a',
    parent: 'pt-por',
    name: 'Zona A',
    kind: 'zone',
    stock: 610,
    updated: '2026-09-11',
  },
  {
    id: 'pt-por-b',
    parent: 'pt-por',
    name: 'Zona B',
    kind: 'zone',
    stock: 340,
    updated: '2026-09-11',
  },
];

const TreeDemo = () => {
  const [rows, setRows] = useState(SITES);
  const [loads, setLoads] = useState(0);
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {loads === 0
            ? 'Open Portugal, then Porto: its zones are fetched on demand'
            : `Porto’s zones fetched ${loads === 1 ? 'once' : `${loads} times`}`}
        </Text>
      }
    >
      <DataGrid<Site>
        columns={SITE_COLUMNS}
        defaultCurrent={{ row: 'pt', column: 'name' }}
        defaultExpanded={['es']}
        height="100%"
        aria-label="Sites"
        onLoadChildren={({ key }) => {
          setLoads((count) => count + 1);
          setTimeout(() => setRows((current) => [...current, ...PORTO_ZONES]), 700);
          void key;
        }}
        rowKey="id"
        rows={rows}
        selectionMode="multiple"
        tree={{ parentKey: (row) => row.parent, hasChildren: (row) => row.id === 'pt-por' }}
        variant="framed"
      />
    </Screen>
  );
};

export const Tree: Story = { parameters: scenario('tree'), render: () => <TreeDemo /> };

/* ── Pinned rows ───────────────────────────────────────────────────────── */

const PinnedRowsDemo = () => {
  const [pinnedRows, setPinnedRows] = useState<{ top: string[]; bottom: string[] }>({
    top: ['SHP-20487'],
    bottom: ['SHP-20481'],
  });
  const [current, setCurrent] = useState<GridCell | null>({ row: 'SHP-20482', column: 'customer' });
  const pin = (edge: 'top' | 'bottom' | null) => {
    if (!current || current.row === 'header') return;
    const key = current.row;
    setPinnedRows((held) => ({
      top: [...held.top.filter((entry) => entry !== key), ...(edge === 'top' ? [key] : [])],
      bottom: [
        ...held.bottom.filter((entry) => entry !== key),
        ...(edge === 'bottom' ? [key] : []),
      ],
    }));
  };
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          <Text size="sm" tone="muted">
            {current ? `Cursor on ${current.row}` : 'Held rows sit out of the sort and the pages'}
          </Text>
          <Button onClick={() => pin('top')} size="sm" tone="secondary" variant="outline">
            Pin to top
          </Button>
          <Button onClick={() => pin('bottom')} size="sm" tone="secondary" variant="outline">
            Pin to bottom
          </Button>
          <Button onClick={() => pin(null)} size="sm" tone="secondary" variant="outline">
            Unpin
          </Button>
        </div>
      }
    >
      <Shipments
        current={current}
        defaultQuery={{ ...emptyQuery(), sort: [{ column: 'weight', direction: 'descending' }] }}
        onCurrentChange={setCurrent}
        pinnedRows={pinnedRows}
        rows={FIFTY}
        selectionMode="multiple"
      />
    </Screen>
  );
};

export const PinnedRows: Story = {
  parameters: scenario('pinned-rows'),
  render: () => <PinnedRowsDemo />,
};

/* ── Reordering rows ───────────────────────────────────────────────────── */

const ReorderRowsDemo = () => {
  const [rows, setRows] = useState(() => FIFTY.slice(0, 8));
  const [query, setQuery] = useState<GridQuery>(emptyQuery());
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {query.sort.length > 0
            ? 'Sorted: the handles are disabled until the sort is cleared'
            : `Drag a handle, or Alt+↑/↓ on a row — ${rows.map((row) => row.id.slice(4)).join(', ')}`}
        </Text>
      }
    >
      <Shipments
        onQueryChange={setQuery}
        onRowsReorder={({ from, to }) =>
          setRows((current) => {
            const next = current.slice();
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved!);
            return next;
          })
        }
        query={query}
        rows={rows}
        rowsReorderable
        selectionMode="multiple"
      />
    </Screen>
  );
};

export const ReorderRows: Story = {
  parameters: scenario('reorder-rows'),
  render: () => <ReorderRowsDemo />,
};

/* ── Export ────────────────────────────────────────────────────────────── */

const ExportDemo = () => {
  const handle = useRef<DataGridHandle | null>(null);
  const [preview, setPreview] = useState('');
  return (
    <Screen
      size="tall"
      before={
        <div className="slotted-demo-row">
          <Button
            onClick={() => handle.current?.exportCsv({ filename: 'shipments.csv' })}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            CSV
          </Button>
          <Button
            onClick={() =>
              handle.current?.exportCsv({ filename: 'selected.csv', rows: 'selected' })
            }
            size="sm"
            tone="secondary"
            variant="outline"
          >
            CSV, selected rows
          </Button>
          <Button
            onClick={() => setPreview(handle.current?.toCsv({ bom: false }).slice(0, 160) ?? '')}
            size="sm"
            tone="secondary"
            variant="outline"
          >
            Preview
          </Button>
          <Button onClick={() => window.print()} size="sm" tone="secondary" variant="outline">
            Print
          </Button>
          {preview ? (
            <Text size="sm" tone="muted">
              <code>{preview}…</code>
            </Text>
          ) : null}
        </div>
      }
    >
      <Shipments
        defaultQuery={{ ...emptyQuery(), sort: [{ column: 'weight', direction: 'descending' }] }}
        defaultValue={['SHP-20482', 'SHP-20484']}
        handle={handle}
        rows={FIFTY}
        selectionMode="multiple"
      />
    </Screen>
  );
};

export const Export: Story = {
  parameters: scenario('export'),
  render: () => <ExportDemo />,
};

const KeyboardDemo = () => {
  const [cell, setCell] = useState<GridCell | null>({ row: 'SHP-20481', column: 'customer' });
  return (
    <Screen
      size="tall"
      before={
        <Text size="sm" tone="muted">
          {cell ? `Cursor on ${cell.row}, ${cell.column}` : 'No cursor'}
        </Text>
      }
    >
      <Shipments
        current={cell}
        onCurrentChange={setCell}
        renderDetail={(row) => <Text size="sm">{row.customer}</Text>}
        rows={FIFTY.slice(0, 8)}
        selectionMode="multiple"
      />{' '}
    </Screen>
  );
};

export const Keyboard: Story = { parameters: scenario('keyboard'), render: () => <KeyboardDemo /> };

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Screen size="tall">
      <Shipments
        aria-label={undefined}
        defaultQuery={{
          ...emptyQuery(),
          sort: [
            { column: 'carrier', direction: 'ascending' },
            { column: 'cost', direction: 'descending' },
          ],
        }}
        defaultValue={['SHP-20482']}
        messages={{
          grid: 'Shipments',
          selectAllFiltered:
            '{count, plural, one {Select the # shipment} other {Select all # shipments}}',
        }}
        rows={FIFTY.slice(0, 8)}
        selectionMode="multiple"
      />
    </Screen>
  ),
};
