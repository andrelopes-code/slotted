import type { FilterGroup } from '@slotted/core/filter';
import {
  applyQuery,
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
import type { ChangeRequest } from '@slotted/core/state';
import { Component, inject, signal, viewChild, type TemplateRef } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlImage } from '@slotted/angular/image';
import { SlInline } from '@slotted/angular/inline';
import { SlFilterBar } from '@slotted/angular/filter-bar';
import type { FilterBarField } from '@slotted/angular/filter-bar';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import { SlToastRegion, SlToastService } from '@slotted/angular/toast';
import type { ToastMessage, ToastContent } from '@slotted/angular/toast';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlDataGrid } from './data-grid';
import { persistedGridView } from './persisted-grid-view';
import type {
  DataGridColumnStateRequest,
  DataGridDataSource,
  DataGridEditCommit,
  DataGridRowsReorderEvent,
  DataGridSelection,
} from './data-grid-defaults';
import {
  SlDataGridCellTemplate,
  SlDataGridColumnHelp,
  SlDataGridDetailTemplate,
  SlDataGridFooter,
} from './data-grid-templates';
import { ANGULAR_DATA_GRID_DOCS, ANGULAR_DATA_GRID_TOKENS } from './data-grid.docs';

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

/** What the stories' mock server writes for a boolean when it searches: its own words, not the grid's. */
const SERVER_BOOLEANS = { true: 'Yes', false: 'No' };

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
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
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
const statusTone = (status: unknown) =>
  status === 'Delivered'
    ? 'success'
    : status === 'Delayed'
      ? 'danger'
      : status === 'Customs'
        ? 'warning'
        : 'secondary';

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

const FIELDS: FilterBarField[] = [
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
];

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

/* ── Scaffolding ───────────────────────────────────────────────────────── */

/**
 * A grid owns a screen's worth of decisions, and its picture depends on its
 * width: it stands on a stage, in a desktop-wide room, in a screen- or
 * card-sized viewport, and takes the viewport's height. What a demonstration
 * says beside the grid — a status line, a control — stands on the same stage
 * above the room, so the stage owns the gap between the two.
 */
const screen = (
  body: string,
  options: { before?: string; size?: 'screen' | 'tall'; room?: 'desktop' | 'phone' } = {},
) => `
<div class="slotted-demo-stage" data-layout="block">
  ${options.before ?? ''}
  <div class="slotted-demo-room" data-room="${options.room ?? 'desktop'}">
    <div class="slotted-demo-viewport" data-size="${options.size ?? 'screen'}">${body}</div>
  </div>
</div>`;

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

/** The status badge every scene draws in the status column. */
const STATUS_TEMPLATE = `
  <ng-template slDataGridCell="status" let-value="value">
    <span slBadge variant="soft" [tone]="statusTone(value)">{{ value }}</span>
  </ng-template>`;

/** One grid of shipments, framed, filling its viewport; `extra` adds bindings. */
const grid = (extra = '', content = '', options: { grow?: boolean } = {}) => `
    <sl-data-grid
      aria-label="Shipments"
      rowKey="id"
      ${options.grow ? '' : 'height="100%"'}
      variant="framed"
      [columns]="columns"
      ${extra}
    >${STATUS_TEMPLATE}${content}
    </sl-data-grid>`;

const note = (text: string) => `<p slText size="sm" tone="muted">${text}</p>`;

/* A story's props are written onto the grid instance by Storybook's Angular
   renderer, inputs or not: a prop named after a member of `SlDataGrid` —
   `status`, `setFilter` — replaced that member. Read live, the server scene
   drew "No rows" under its rows. Story props take names the grid has not. */
const base = () => ({ columns, statusTone, rows: FIFTY });

/* ── Stories ───────────────────────────────────────────────────────────── */

interface DataGridStoryArgs {
  selectionMode: 'none' | 'single' | 'multiple' | 'range';
  striped: boolean;
  variant: 'plain' | 'ruled' | 'framed';
  filterRow: boolean;
  editMode: 'cell' | 'row';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATA_GRID_DOCS['data-grid'].scenes, {
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

/* The view lives in the browser's own storage, under one key, so a reload
   of this story brings the arrangement back; the field mirrors the entry.
   `persistedGridView` runs an effect, so it is called where an injection
   context exists: a component of the story's own. */
const VIEW_KEY = 'slotted-demo:data-grid-view';

@Component({
  selector: 'sl-data-grid-saved-view-demo',
  standalone: true,
  imports: [SlDataGrid, SlDataGridCellTemplate, SlBadge, SlButton, SlTextField, SlTextFieldInput],
  /* The story's own frame, written out: a component's template is a literal
     for the compiler. */
  template: ` <div class="slotted-demo-stage" data-layout="block">
    <div class="slotted-demo-row">
      <div slTextField mono>
        <input
          slTextFieldInput
          aria-label="Saved view"
          readonly
          [value]="entry() || '(nothing saved)'"
        />
      </div>
      <button
        slButton
        size="sm"
        tone="secondary"
        variant="outline"
        type="button"
        (click)="view.reset()"
      >
        Reset view
      </button>
    </div>
    <div class="slotted-demo-room" data-room="desktop">
      <div class="slotted-demo-viewport" data-size="tall">
        <sl-data-grid
          aria-label="Shipments"
          rowKey="id"
          height="100%"
          variant="framed"
          [columns]="columns"
          [rows]="rows"
          [(query)]="view.query"
          [(columnState)]="view.columnState"
          [density]="view.density()"
        >
          <ng-template slDataGridCell="status" let-value="value">
            <span slBadge variant="soft" [tone]="statusTone(value)">{{ value }}</span>
          </ng-template>
        </sl-data-grid>
      </div>
    </div>
  </div>`,
})
export class SavedViewDemo {
  readonly columns = columns;
  readonly statusTone = statusTone;
  readonly rows = FIFTY.slice(0, 8);
  readonly entry = signal('');
  readonly view = persistedGridView({
    key: VIEW_KEY,
    columns,
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => {
        localStorage.setItem(key, value);
        this.entry.set(value);
      },
      removeItem: (key) => {
        localStorage.removeItem(key);
        this.entry.set('');
      },
    },
    defaultColumnState: { pinned: { start: ['id'], end: [] }, hidden: ['eta', 'priority'] },
  });
  constructor() {
    try {
      this.entry.set(localStorage.getItem(VIEW_KEY) ?? '');
    } catch {
      /* No store: the field stays empty. */
    }
  }
}

/* The undo is the application's: the toast's action shows the hidden
   column again. A component of the story's own, for the toast service
   it provides and the action template it holds. */
@Component({
  selector: 'sl-data-grid-undo-hide-demo',
  standalone: true,
  imports: [SlDataGrid, SlDataGridCellTemplate, SlBadge, SlButton, SlText, SlToastRegion],
  providers: [SlToastService],
  template: ` <div class="slotted-demo-stage" data-layout="block">
    <p slText size="sm" tone="muted">
      Hide a column from its menu; the toast’s Undo puts it back where it stood
    </p>
    <div class="slotted-demo-room" data-room="desktop">
      <div class="slotted-demo-viewport" data-size="tall">
        <sl-data-grid
          aria-label="Shipments"
          rowKey="id"
          height="100%"
          variant="framed"
          [columns]="columns"
          [rows]="rows"
          [(columnState)]="columnState"
          (columnStateChangeRequest)="onRequest($event)"
        >
          <ng-template slDataGridCell="status" let-value="value">
            <span slBadge variant="soft" [tone]="statusTone(value)">{{ value }}</span>
          </ng-template>
        </sl-data-grid>
        <sl-toast-region attach="inline" />
      </div>
    </div>
    <ng-template #undo let-message>
      <button slButton size="sm" type="button" variant="outline" (click)="restore(message.id)">
        Undo
      </button>
    </ng-template>
  </div>`,
})
export class UndoHideDemo {
  readonly columns = columns;
  readonly statusTone = statusTone;
  readonly rows = FIFTY.slice(0, 8);
  readonly columnState = signal<GridColumnState>({
    order: [],
    widths: {},
    hidden: ['eta', 'priority'],
    pinned: { start: ['id'], end: [] },
  });
  private readonly undo =
    viewChild.required<TemplateRef<{ $implicit: ToastMessage<ToastContent> }>>('undo');
  /** The columns each toast's Undo shows again, by the toast. */
  private readonly hidden = new Map<string, readonly string[]>();
  private readonly toasts = inject(SlToastService);
  onRequest(request: DataGridColumnStateRequest) {
    if (request.change !== 'hidden') return;
    const shown = request.value.hidden.filter((id) => !request.previous.hidden.includes(id));
    const toast = this.toasts.show({
      title: 'Column hidden',
      description: 'The column comes back to its place and its width.',
      tone: 'secondary',
      actions: this.undo(),
    });
    this.hidden.set(toast, shown);
  }
  restore(id: string) {
    const shown = this.hidden.get(id) ?? [];
    this.hidden.delete(id);
    this.columnState.update((state) =>
      shown.reduce((next, column) => withColumnHidden(next, column, false), state),
    );
    this.toasts.dismiss(id, 'pointer');
  }
}

const meta: Meta<DataGridStoryArgs> = {
  title: 'Components/Data grid',
  component: SlDataGrid,
  excludeStories: ['SavedViewDemo', 'UndoHideDemo'],
  decorators: [
    moduleMetadata({
      imports: [
        SlDataGrid,
        SlDataGridCellTemplate,
        SlDataGridColumnHelp,
        SlDataGridDetailTemplate,
        SlDataGridFooter,
        SlAvatar,
        SlBadge,
        SlButton,
        SlFilterBar,
        SlImage,
        SlInline,
        SlPagination,
        SlPaginationNext,
        SlPaginationPageSize,
        SlPaginationPrevious,
        SlPaginationStatus,
        SlText,
        SlTextField,
        SlTextFieldInput,
        SavedViewDemo,
        UndoHideDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Data grid',
        description:
          'The composite widget for large, interactive tabular data: one cursor over every cell, a query the grid applies or a server answers, columns the reader arranges, and editing in place.',
        framework: 'Angular',
        ...ANGULAR_DATA_GRID_DOCS['data-grid'],
        tokens: ANGULAR_DATA_GRID_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<DataGridStoryArgs>;

export const Playground: Story = {
  args: {
    selectionMode: 'multiple',
    striped: false,
    variant: 'framed',
    filterRow: false,
    editMode: 'cell',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...base(), ...args },
    template: screen(
      grid(
        '[rows]="rows" [selectionMode]="selectionMode" [striped]="striped" [variant]="variant" [filterRow]="filterRow" [editMode]="editMode"',
      ),
    ),
  }),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: () => ({
    props: { ...base(), rows: EIGHT },
    template: screen(grid('[rows]="rows"'), { size: 'tall' }),
  }),
};

export const ColumnGroups: Story = {
  parameters: scenario('column-groups'),
  render: () => ({
    props: {
      ...base(),
      rows: EIGHT,
      groups: [
        { id: 'shipment', label: 'Shipment', columns: ['id', 'customer', 'destination'] },
        { id: 'timing', label: 'Timing', columns: ['shipped', 'eta'] },
        { id: 'money', label: 'Charges', columns: ['weight', 'cost'] },
      ],
    },
    template: screen(grid('[rows]="rows" [columnGroups]="groups"'), { size: 'tall' }),
  }),
};

export const Sorting: Story = {
  parameters: scenario('sorting'),
  render: () => {
    const query = signal<GridQuery>({
      ...emptyQuery(),
      sort: [
        { column: 'carrier', direction: 'ascending' },
        { column: 'weight', direction: 'descending' },
      ],
    });
    return {
      props: {
        ...base(),
        rows: FIFTY.slice(0, 12),
        query,
        order: () =>
          query()
            .sort.map((key) => `${key.column} ${key.direction}`)
            .join(', ') || 'none',
      },
      template: screen(grid('[rows]="rows" [(query)]="query"'), {
        size: 'tall',
        before: note('Order: {{ order() }}'),
      }),
    };
  },
};

export const FilterPanel: Story = {
  parameters: scenario('filter-panel'),
  render: () => ({
    props: {
      ...base(),
      current: { row: 'header', column: 'customer' },
      query: withColumnFilter(emptyQuery(), 'customer', {
        kind: 'text',
        join: 'or',
        conditions: [
          { operator: 'contains', value: 'nord' },
          { operator: 'startsWith', value: 'B' },
        ],
      }).query,
    },
    template: screen(grid('[rows]="rows" [query]="query" [current]="current"'), { size: 'tall' }),
  }),
};

export const FilterRow: Story = {
  parameters: scenario('filter-row'),
  render: () => ({
    props: {
      ...base(),
      query: withColumnFilter(emptyQuery(), 'status', {
        kind: 'set',
        join: 'and',
        conditions: [{ operator: 'anyOf', value: ['Delayed', 'Customs'] }],
      }).query,
    },
    template: screen(grid('[rows]="rows" [query]="query" filterRow')),
  }),
};

export const WithFilterBar: Story = {
  parameters: scenario('filter-bar'),
  render: () => {
    const query = signal<GridQuery>(
      withColumnFilter(emptyQuery(), 'carrier', {
        kind: 'set',
        join: 'and',
        conditions: [{ operator: 'anyOf', value: ['DHL', 'UPS'] }],
      }).query,
    );
    return {
      props: {
        ...base(),
        query,
        fields: FIELDS,
        applyFilter: (filter: FilterGroup | null | undefined) =>
          query.set(withFilter(query(), filter ?? null).query),
        setSearch: (text: string | undefined) => query.set(withSearch(query(), text ?? '').query),
      },
      template: screen(grid('[rows]="rows" [(query)]="query"'), {
        size: 'tall',
        before: `<div
    slFilterBar
    [fields]="fields"
    [value]="query().filter"
    [query]="query().search"
    (valueChange)="applyFilter($event)"
    (queryChange)="setSearch($event)"
  ></div>`,
      }),
    };
  },
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () => {
    const query = signal<GridQuery>({ ...emptyQuery(), search: 'gaia' });
    return {
      props: {
        ...base(),
        query,
        setSearch: (request: ChangeRequest<string>) =>
          query.set(withSearch(query(), request.value).query),
      },
      template: screen(grid('[rows]="rows" [(query)]="query"'), {
        size: 'tall',
        before: `<div slTextField>
    <input
      slTextFieldInput
      aria-label="Search shipments"
      placeholder="Search shipments"
      [value]="query().search"
      (valueChange)="setSearch($event)"
    />
  </div>`,
      }),
    };
  },
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => {
    const value = signal<DataGridSelection>(['SHP-20482', 'SHP-20483']);
    return {
      props: {
        ...base(),
        rows: FIFTY.slice(0, 12),
        value,
        selected: () => {
          const held = value();
          return Array.isArray(held) ? held.join(', ') || 'nothing' : String(held);
        },
      },
      template: screen(grid('[rows]="rows" selectionMode="multiple" [(value)]="value"'), {
        size: 'tall',
        before: note('Selected: {{ selected() }}'),
      }),
    };
  },
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => {
    const range = signal<GridRange | null>({
      anchor: { row: 'SHP-20482', column: 'customer' },
      focus: { row: 'SHP-20484', column: 'weight' },
    });
    return {
      props: {
        ...base(),
        rows: FIFTY.slice(0, 12),
        range,
        current: { row: 'SHP-20484', column: 'weight' },
        said: () => {
          const held = range();
          return held
            ? `${held.anchor.row}/${held.anchor.column} → ${held.focus.row}/${held.focus.column}`
            : 'No range';
        },
      },
      template: screen(
        grid('[rows]="rows" selectionMode="range" [(range)]="range" [current]="current"'),
        { size: 'tall', before: note('{{ said() }}') },
      ),
    };
  },
};

const editing = (editMode: 'cell' | 'row') => {
  const rows = signal(FIFTY.slice(0, 8));
  const log = signal<string[]>([]);
  return {
    props: {
      ...base(),
      rows,
      editMode,
      current: { row: 'SHP-20481', column: 'customer' },
      summary: () => (log().length === 0 ? 'Nothing committed yet' : log().slice(-3).join(' · ')),
      commit: (event: DataGridEditCommit<Shipment>) =>
        event.wait(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              rows.update((current) =>
                current.map((row) => (row.id === event.key ? { ...row, ...event.changes } : row)),
              );
              log.update((current) => [
                ...current,
                `${event.key}: ${Object.keys(event.changes).join(', ')}`,
              ]);
              resolve();
            }, 300);
          }),
        ),
    },
    template: screen(
      grid(
        '[rows]="rows()" [editMode]="editMode" [current]="current" (editCommit)="commit($event)"',
      ),
      { size: 'tall', before: note('{{ summary() }}') },
    ),
  };
};

export const Editing: Story = { parameters: scenario('editing'), render: () => editing('cell') };
export const EditingRow: Story = {
  parameters: scenario('editing-row'),
  render: () => editing('row'),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => ({
    props: {
      ...base(),
      rows: FIFTY.slice(0, 8),
      current: { row: 'SHP-20481', column: 'weight' },
      commit: (event: DataGridEditCommit<Shipment>) => {
        if (event.column === 'destination') {
          event.wait(Promise.reject(new Error('The shipping service is offline')));
        }
      },
    },
    template: screen(grid('[rows]="rows" [current]="current" (editCommit)="commit($event)"'), {
      size: 'tall',
    }),
  }),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => {
    const opened = signal<string | null>(null);
    return {
      props: {
        ...base(),
        rows: FIFTY.slice(0, 8),
        opened,
        current: { row: 'SHP-20481', column: 'id' },
      },
      template: screen(
        grid('[rows]="rows" activatable [current]="current" (activate)="opened.set($event.key)"'),
        {
          size: 'tall',
          before: note(
            `{{ opened() ? 'Opened ' + opened() : 'Double press a row, or Enter on its tracking cell' }}`,
          ),
        },
      ),
    };
  },
};

export const Pinning: Story = {
  parameters: scenario('pinning'),
  render: () => ({
    props: { ...base(), state: { pinned: { start: ['id'], end: ['priority'] } } },
    template: screen(grid('[rows]="rows" selectionMode="multiple" [columnState]="state"'), {
      size: 'tall',
    }),
  }),
};

const columnState = (initial: Partial<GridColumnState>, fit = false) => {
  const state = signal<Partial<GridColumnState> | undefined>(initial);
  const last = signal('');
  return {
    props: {
      ...base(),
      rows: FIFTY.slice(0, 8),
      state,
      last,
      current: { row: 'header', column: 'customer' },
      report: (request: DataGridColumnStateRequest) =>
        last.set(
          `${request.change} by ${request.reason}: ${serializeColumnState(request.value, columns)}`,
        ),
    },
    template: screen(
      grid(
        '#grid="slDataGrid" [rows]="rows" [(columnState)]="state" [current]="current" (columnStateChangeRequest)="report($event)"',
      ),
      {
        size: 'tall',
        before: `<div class="slotted-demo-row">
    ${note(`{{ last() || 'Drag a handle, or a header; or use the keyboard on the header cell' }}`)}
    ${
      fit
        ? `<button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.autofit()">
      Fit columns
    </button>`
        : ''
    }
  </div>`,
      },
    ),
  };
};

export const Resize: Story = {
  parameters: scenario('resize'),
  render: () => columnState({ widths: { customer: 260 } }, true),
};
export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => columnState({ order: ['id', 'carrier', 'customer'] }),
};

export const ColumnMenu: Story = {
  parameters: scenario('column-menu'),
  render: () => {
    const managing = signal(false);
    return {
      props: {
        ...base(),
        rows: FIFTY.slice(0, 8),
        managing,
        current: { row: 'header', column: 'carrier' },
      },
      template: screen(
        grid('[rows]="rows" [current]="current" manageable (manageColumns)="managing.set(true)"'),
        {
          size: 'tall',
          before: note(
            `{{ managing() ? 'Manage columns asked for: the application opens its column-manager here' : 'Hover a header, or Ctrl+Enter on it' }}`,
          ),
        },
      ),
    };
  },
};

const helpColumns: GridColumn<Shipment>[] = columns.map((column) =>
  column.id === 'weight'
    ? { ...column, description: 'Gross weight at pickup, in kilograms, packaging included' }
    : column.id === 'cost'
      ? { ...column, description: 'Freight cost billed by the carrier, before VAT' }
      : column,
);

export const ColumnHelp: Story = {
  parameters: scenario('column-help'),
  render: () => ({
    props: {
      ...base(),
      columns: helpColumns,
      rows: FIFTY.slice(0, 8),
      current: { row: 'header', column: 'weight' },
    },
    template: screen(
      grid(
        '[rows]="rows" [current]="current"',
        `<ng-template slDataGridColumnHelp="status">
          <p slText size="sm">
            Customs means the shipment is held at a border for inspection; Returned means the
            consignee refused it. Delayed is set by the carrier, not by us.
          </p>
        </ng-template>`,
      ),
      { size: 'tall' },
    ),
  }),
};

export const UndoHide: Story = {
  parameters: scenario('undo-hide'),
  render: () => ({
    props: {},
    template: '<sl-data-grid-undo-hide-demo></sl-data-grid-undo-hide-demo>',
  }),
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

export const ResponsivePriority: Story = {
  parameters: scenario('responsive-priority'),
  render: () => {
    const out = signal<GridOutOfSpace>({ popin: [], hidden: [] });
    return {
      props: {
        ...base(),
        columns: priorityColumns,
        rows: FIFTY.slice(0, 8),
        out,
        labelOf,
      },
      template: screen(grid('[rows]="rows" (outOfSpaceChange)="out.set($event)"'), {
        room: 'phone',
        size: 'tall',
        before: note(
          `{{ out().popin.length + out().hidden.length === 0 ? 'Every column fits' : 'In each row: ' + out().popin.map(labelOf).join(', ') + (out().hidden.length > 0 ? '. Hidden: ' + out().hidden.map(labelOf).join(', ') : '') }}`,
        ),
      }),
    };
  },
};

export const ColumnState: Story = {
  parameters: scenario('column-state'),
  render: () => ({
    props: {},
    template: '<sl-data-grid-saved-view-demo></sl-data-grid-saved-view-demo>',
  }),
};

export const Grouping: Story = {
  parameters: scenario('grouping'),
  render: () => ({
    props: {
      ...base(),
      rows: FIFTY.slice(0, 24),
      query: {
        ...emptyQuery(),
        group: ['carrier', 'status'],
        sort: [{ column: 'id', direction: 'ascending' }],
      },
    },
    template: screen(grid('[rows]="rows" [query]="query"')),
  }),
};

export const Summary: Story = {
  parameters: scenario('summary'),
  render: () => ({
    props: { ...base(), rows: FIFTY.slice(0, 10) },
    template: screen(grid('[rows]="rows"'), { size: 'tall' }),
  }),
};

export const Detail: Story = {
  parameters: scenario('detail'),
  render: () => ({
    props: { ...base(), rows: FIFTY.slice(0, 8), kilograms, money, expanded: ['SHP-20481'] },
    template: screen(
      grid(
        '[rows]="rows" [expanded]="expanded"',
        `
      <ng-template slDataGridDetail let-row>
        <div class="slotted-demo-stack">
          <p slText size="sm">{{ row.customer }} · {{ row.destination }} · {{ row.carrier }}</p>
          <p slText size="sm" tone="muted">
            Shipped {{ row.shipped }}, expected {{ row.eta.replace('T', ' ') }}.
            {{ kilograms(row.weight) }} at {{ money(row.cost) }}.
          </p>
        </div>
      </ng-template>`,
      ),
      { size: 'tall' },
    ),
  }),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => ({
    props: { ...base(), rows: TEN_THOUSAND },
    template: screen(grid('#grid="slDataGrid" [rows]="rows" selectionMode="multiple"'), {
      before: `<div class="slotted-demo-row">
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.scrollToRow('SHP-25480', 'center')">
      Scroll to row 5,000
    </button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.focusCell({ row: 'SHP-30480', column: 'customer' })">
      Focus the last row
    </button>
  </div>`,
    }),
  }),
};

/** A server that answers a query in 400 milliseconds, from the ten thousand rows. */
function shipmentServer(size: number) {
  const query = signal<GridQuery>(emptyQuery({ index: 0, size }));
  const page = signal<{ rows: Shipment[]; total: number }>({ rows: [], total: 0 });
  const pending = signal(true);
  const failing = signal(false);
  let request = 0;
  const fetchPage = () => {
    const id = (request += 1);
    pending.set(true);
    setTimeout(() => {
      if (id !== request) return;
      if (failing()) {
        pending.set(false);
        return;
      }
      const applied = applyQuery(TEN_THOUSAND, columns, query(), {
        rowKey: (row) => row.id,
        booleans: SERVER_BOOLEANS,
      });
      page.set({
        rows: applied.nodes.flatMap((node) => (node.kind === 'row' ? [node.row] : [])),
        total: applied.total,
      });
      pending.set(false);
    }, 400);
  };
  fetchPage();
  return {
    query,
    page,
    pending,
    failing,
    setQuery: (next: GridQuery) => {
      query.set(next);
      fetchPage();
    },
    retry: () => {
      failing.set(false);
      fetchPage();
    },
  };
}

export const Server: Story = {
  parameters: scenario('server'),
  render: () => {
    const server = shipmentServer(25);
    return {
      props: {
        ...base(),
        server,
        summary: () =>
          server.pending()
            ? 'Fetching…'
            : `${server.page().total.toLocaleString('en-US')} shipments on the server`,
      },
      template: screen(
        grid(
          `[rows]="server.page().rows" selectionMode="multiple" [query]="server.query()" (queryChange)="server.setQuery($event)" [totalCount]="server.page().total" [loading]="server.pending()" [error]="server.failing() ? 'The shipments service timed out' : null" (retry)="server.retry()"`,
        ),
        { before: note('{{ summary() }}') },
      ),
    };
  },
};

/* The same server as a data source: the grid asks, aborts, keeps and
   retries by itself; the page the reader comes back to is on screen at once. */
export const DataSource: Story = {
  parameters: scenario('data-source'),
  render: () => {
    const query = signal<GridQuery>(emptyQuery({ index: 0, size: 25 }));
    const total = signal<number | undefined>(undefined);
    const source: DataGridDataSource<Shipment> = {
      async getRows(asked, { signal }) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 400);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
        if (asked.search.trim().toLowerCase() === 'fail')
          throw new Error('The shipments service timed out');
        const applied = applyQuery(TEN_THOUSAND, columns, asked, {
          rowKey: (row) => row.id,
          booleans: SERVER_BOOLEANS,
        });
        total.set(applied.total);
        return {
          rows: applied.nodes.flatMap((node) => (node.kind === 'row' ? [node.row] : [])),
          total: applied.total,
        };
      },
    };
    return {
      props: {
        ...base(),
        query,
        total,
        source,
        page: () => {
          const held = query().page;
          return (held && 'index' in held ? held.index : 0) + 1;
        },
        setPage: (request: ChangeRequest<number>) =>
          query.set(withPageIndex(query(), request.value - 1).query),
      },
      template: screen(
        grid(
          '#grid="slDataGrid" [dataSource]="source" [(query)]="query" selectionMode="multiple" [showRange]="false"',
          `
      <nav slDataGridFooter slPagination [count]="total()" [pageSize]="25" [page]="page()" (pageChange)="setPage($event)">
        <p slPaginationStatus></p>
        <button slPaginationPrevious type="button"></button>
        <button slPaginationNext type="button"></button>
      </nav>`,
        ),
        {
          before: `<div class="slotted-demo-row">
    ${note('Sort, filter or page: each query is one request; search “fail” for the error')}
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.reload()">
      Reload
    </button>
  </div>`,
        },
      ),
    };
  },
};

export const PaginationScene: Story = {
  parameters: scenario('pagination'),
  render: () => {
    const query = signal<GridQuery>(emptyQuery({ index: 0, size: 8 }));
    return {
      props: {
        ...base(),
        query,
        count: FIFTY.length,
        page: () => {
          const held = query().page;
          return (held && 'index' in held ? held.index : 0) + 1;
        },
        pageSize: () => {
          const held = query().page;
          return held && 'index' in held ? held.size : 8;
        },
        setPage: (request: ChangeRequest<number>) =>
          query.set(withPageIndex(query(), request.value - 1).query),
        setPageSize: (request: ChangeRequest<number>) =>
          query.set(withPageSize(query(), request.value).query),
      },
      /* The bar a table carries: a page size, the range and the two
         triggers, at the inline end. The status states the range, so the
         grid's own is off. */
      template: screen(
        grid(
          '[rows]="rows" [(query)]="query" [showRange]="false"',
          `
      <nav
        slDataGridFooter
        slPagination
        [count]="count"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[8, 16, 32]"
        [page]="page()"
        (pageChange)="setPage($event)"
        (pageSizeChange)="setPageSize($event)"
      >
        <sl-pagination-page-size></sl-pagination-page-size>
        <p slPaginationStatus></p>
        <button slPaginationPrevious type="button"></button>
        <button slPaginationNext type="button"></button>
      </nav>`,
          /* A paged grid is as tall as its page: a frame taller than eight
             rows left the room under them empty. */
          { grow: true },
        ),
      ),
    };
  },
};

export const LoadMore: Story = {
  parameters: scenario('load-more'),
  render: () => {
    const count = signal(20);
    const pending = signal(false);
    return {
      props: {
        ...base(),
        count,
        pending,
        rows: () => TEN_THOUSAND.slice(0, count()),
        query: () => ({ ...emptyQuery(), page: { cursor: String(count()), size: 20 } }),
        loadMore: () => {
          if (pending()) return;
          pending.set(true);
          setTimeout(() => {
            count.update((current) => Math.min(TEN_THOUSAND.length, current + 20));
            pending.set(false);
          }, 400);
        },
      },
      template: screen(
        grid(
          '[rows]="rows()" [hasMore]="count() < 200" [loading]="pending()" [query]="query()" [virtualize]="false" (loadMore)="loadMore()"',
        ),
        { size: 'tall' },
      ),
    };
  },
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => ({
    props: { ...base(), none: [], filtered: { ...emptyQuery(), search: 'no such shipment' } },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Nothing yet',
    'A grid before the first shipment exists: the empty result-state under the header, held to the frame.',
    screen(grid('[rows]="none"'), { size: 'tall' }),
  )}
  ${scene(
    'Nothing after the filter',
    'The query left nothing; Clear filters empties filter and search in one request with the reason clear.',
    screen(grid('[rows]="rows" [query]="filtered"'), { size: 'tall' }),
  )}
  ${scene(
    'A failed load',
    'The message and Try again, which emits retry.',
    screen(grid('[rows]="none" error="The shipments service timed out after 30 seconds"'), {
      size: 'tall',
    }),
  )}
  ${scene(
    'A first load',
    'Skeleton rows the visible columns wide; a refresh over rows already shown would dim them instead.',
    screen(grid('[rows]="none" loading'), { size: 'tall' }),
  )}
</div>`,
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    props: { ...base(), rows: EIGHT },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'plain',
    'No band under the header and no rules: the grid reads as part of the page it stands on.',
    screen(grid('[rows]="rows" variant="plain"'), { size: 'tall' }),
  )}
  ${scene(
    'ruled',
    'A rule between rows and the band under the header; no frame.',
    screen(grid('[rows]="rows" variant="ruled"'), { size: 'tall' }),
  )}
  ${scene(
    'framed, striped',
    'The border, the radius and every second row tinted under every state.',
    screen(grid('[rows]="rows" striped'), { size: 'tall' }),
  )}
</div>`,
  }),
};

export const TextTreatment: Story = {
  parameters: scenario('text'),
  render: () => ({
    props: {
      ...base(),
      rows: AWKWARD,
      columns: columns.map((column) =>
        column.id === 'customer'
          ? { ...column, text: 'wrap' as const, width: 260 }
          : column.id === 'destination'
            ? { ...column, text: 'nowrap' as const, width: 120 }
            : column,
      ),
    },
    template: screen(grid('[rows]="rows" rowHeight="auto"'), { size: 'tall' }),
  }),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => {
    const chosen = signal<GridDensity | null>(null);
    const densities: readonly (GridDensity | null)[] = [null, 'comfortable', 'compact', 'dense'];
    return {
      props: { ...base(), rows: FIFTY.slice(0, 10), chosen, densities },
      template: screen(grid('[rows]="rows" [density]="chosen()" selectionMode="multiple"'), {
        size: 'tall',
        before: `<div class="slotted-demo-row">
          @for (value of densities; track value) {
            <button
              slButton
              size="sm"
              tone="secondary"
              type="button"
              [variant]="chosen() === value ? 'solid' : 'outline'"
              [attr.aria-pressed]="chosen() === value"
              (click)="chosen.set(value)"
            >
              {{ value ?? 'The page’s' }}
            </button>
          }
        </div>`,
      }),
    };
  },
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { ...base(), rows: AWKWARD, disabled: ['SHP-20492'] },
    template: screen(grid('[rows]="rows" selectionMode="multiple" [disabledKeys]="disabled"'), {
      size: 'tall',
    }),
  }),
};

/* A picture per shipment, drawn on the spot: a crate in the carrier's hue,
   so the scene needs no network and a window that mounts the row again draws
   the same one. */
const photoOf = (row: Shipment) => {
  const hue = (CARRIERS.indexOf(row.carrier) * 67 + Number(row.id.slice(4))) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64"><rect width="96" height="64" fill="hsl(${hue} 40% 38%)"/><rect x="20" y="14" width="56" height="40" rx="3" fill="hsl(${hue} 45% 62%)"/><path d="M20 26h56M48 14v40" stroke="hsl(${hue} 40% 30%)" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const mediaColumns: GridColumn<Shipment>[] = [
  columns[0]!,
  { id: 'photo', label: 'Cargo', kind: 'custom', width: 96, sortable: false, resizable: false },
  { id: 'customer', label: 'Customer', width: 240 },
  ...columns.filter((column) => ['destination', 'carrier', 'status', 'cost'].includes(column.id)),
];

export const Media: Story = {
  parameters: scenario('media'),
  render: () => ({
    props: { ...base(), columns: mediaColumns, rows: TEN_THOUSAND, photoOf },
    /* A cell with a picture and a name is one flex row of its own: the grid
       lays a template's first element out as the value, and what follows it
       would not share the line. */
    template: screen(
      grid(
        '[rows]="rows" [rowHeight]="56" selectionMode="multiple"',
        `
      <ng-template slDataGridCell="customer" let-row="row">
        <span slInline align="center" wrap="nowrap">
          <span slAvatar [name]="row.customer" size="sm"></span>
          <span slText truncate>{{ row.customer }}</span>
        </span>
      </ng-template>
      <ng-template slDataGridCell="photo" let-row="row">
        <div slImage alt="" height="36" radius="sm" [src]="photoOf(row)" width="48"></div>
      </ng-template>`,
      ),
      { size: 'tall' },
    ),
  }),
};

/* A feed that moves twenty shipments every 400 milliseconds: a weight, a
   status or a cost, on rows anywhere in the ten thousand. The rows array is
   new each tick and every untouched row keeps its identity. */
export const Realtime: Story = {
  parameters: scenario('realtime'),
  render: () => {
    const rows = signal(TEN_THOUSAND);
    const live = signal(true);
    const ticks = signal(0);
    let seed = 11;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const tick = () => {
      if (!live()) return;
      rows.update((current) => {
        const next = current.slice();
        for (let n = 0; n < 20; n += 1) {
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
      ticks.update((count) => count + 1);
    };
    /* The interval runs while the story's grid is on the page; leaving the
       story detaches the grid, and the next tick stops the clock. */
    const timer = setInterval(() => {
      if (!document.querySelector('[data-ui="data-grid"]')) clearInterval(timer);
      else tick();
    }, 400);
    return {
      props: { ...base(), rows, live, ticks, toggle: () => live.update((on) => !on) },
      template: screen(grid('[rows]="rows()" highlightChanges selectionMode="multiple"'), {
        size: 'tall',
        before: `<div class="slotted-demo-row">
    ${note('{{ ticks() }} updates, twenty cells each')}
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="toggle()">
      {{ live() ? 'Pause' : 'Resume' }}
    </button>
  </div>`,
      }),
    };
  },
};

/* Countries, their warehouses, the zones in each: one warehouse (Porto) has
   zones that arrive only when it is opened. */
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
const site = (
  id: string,
  parent: string | null,
  name: string,
  kind: Site['kind'],
  stock: number,
  updated: string,
): Site => ({ id, parent, name, kind, stock, updated });
const SITES: Site[] = [
  site('pt', null, 'Portugal', 'country', 0, '2026-09-12'),
  site('pt-lis', 'pt', 'Lisboa', 'warehouse', 0, '2026-09-12'),
  site('pt-lis-a', 'pt-lis', 'Zona A', 'zone', 1240, '2026-09-12'),
  site('pt-lis-b', 'pt-lis', 'Zona B', 'zone', 860, '2026-09-10'),
  site('pt-por', 'pt', 'Porto', 'warehouse', 0, '2026-09-11'),
  site('es', null, 'España', 'country', 0, '2026-09-09'),
  site('es-mad', 'es', 'Madrid', 'warehouse', 0, '2026-09-09'),
  site('es-mad-a', 'es-mad', 'Zona A', 'zone', 2210, '2026-09-09'),
  site('es-bcn', 'es', 'Barcelona', 'warehouse', 0, '2026-09-08'),
  site('es-bcn-a', 'es-bcn', 'Zona A', 'zone', 430, '2026-09-08'),
  site('es-bcn-b', 'es-bcn', 'Zona B', 'zone', 970, '2026-09-07'),
  site('de', null, 'Deutschland', 'country', 0, '2026-09-06'),
  site('de-ham', 'de', 'Hamburg', 'warehouse', 0, '2026-09-06'),
  site('de-ham-a', 'de-ham', 'Zone A', 'zone', 1520, '2026-09-06'),
];
const PORTO_ZONES: Site[] = [
  site('pt-por-a', 'pt-por', 'Zona A', 'zone', 610, '2026-09-11'),
  site('pt-por-b', 'pt-por', 'Zona B', 'zone', 340, '2026-09-11'),
];

export const Tree: Story = {
  parameters: scenario('tree'),
  render: () => {
    const rows = signal<readonly Site[]>(SITES);
    const loads = signal(0);
    return {
      props: {
        siteColumns: SITE_COLUMNS,
        rows,
        loads,
        expanded: signal<readonly string[]>(['es']),
        tree: {
          parentKey: (row: Site) => row.parent,
          hasChildren: (row: Site) => row.id === 'pt-por',
        },
        fetchZones: () => {
          loads.update((count) => count + 1);
          setTimeout(() => rows.update((current) => [...current, ...PORTO_ZONES]), 700);
        },
      },
      template: screen(
        `
    <sl-data-grid
      aria-label="Sites"
      rowKey="id"
      height="100%"
      variant="framed"
      selectionMode="multiple"
      [columns]="siteColumns"
      [rows]="rows()"
      [tree]="tree"
      [(expanded)]="expanded"
      [current]="{ row: 'pt', column: 'name' }"
      (loadChildren)="fetchZones()"
    ></sl-data-grid>`,
        {
          size: 'tall',
          before: note(
            `{{ loads() === 0 ? 'Open Portugal, then Porto: its zones are fetched on demand' : 'Porto’s zones fetched ' + (loads() === 1 ? 'once' : loads() + ' times') }}`,
          ),
        },
      ),
    };
  },
};

export const PinnedRows: Story = {
  parameters: scenario('pinned-rows'),
  render: () => {
    const pinnedRows = signal<{ top: string[]; bottom: string[] }>({
      top: ['SHP-20487'],
      bottom: ['SHP-20481'],
    });
    const current = signal<GridCell | null>({ row: 'SHP-20482', column: 'customer' });
    const pin = (edge: 'top' | 'bottom' | null) => {
      const cell = current();
      if (!cell || cell.row === 'header') return;
      const key = cell.row;
      pinnedRows.update((held) => ({
        top: [...held.top.filter((entry) => entry !== key), ...(edge === 'top' ? [key] : [])],
        bottom: [
          ...held.bottom.filter((entry) => entry !== key),
          ...(edge === 'bottom' ? [key] : []),
        ],
      }));
    };
    return {
      props: {
        ...base(),
        pinnedRows,
        current,
        query: signal<GridQuery>({
          ...emptyQuery(),
          sort: [{ column: 'weight', direction: 'descending' }],
        }),
        pin,
      },
      template: screen(
        grid(
          '[rows]="rows" [pinnedRows]="pinnedRows()" [(current)]="current" [(query)]="query" selectionMode="multiple"',
        ),
        {
          size: 'tall',
          before: `<div class="slotted-demo-row">
    ${note(`{{ current() ? 'Cursor on ' + current()!.row : 'Held rows sit out of the sort and the pages' }}`)}
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="pin('top')">Pin to top</button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="pin('bottom')">Pin to bottom</button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="pin(null)">Unpin</button>
  </div>`,
        },
      ),
    };
  },
};

export const ReorderRows: Story = {
  parameters: scenario('reorder-rows'),
  render: () => {
    const rows = signal<readonly Shipment[]>(FIFTY.slice(0, 8));
    const query = signal<GridQuery>(emptyQuery());
    return {
      props: {
        ...base(),
        rows,
        query,
        order: () =>
          rows()
            .map((row) => row.id.slice(4))
            .join(', '),
        sorted: () => query().sort.length > 0,
        move: ({ from, to }: DataGridRowsReorderEvent) =>
          rows.update((current) => {
            const next = current.slice();
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved!);
            return next;
          }),
      },
      template: screen(
        grid(
          '[rows]="rows()" [(query)]="query" rowsReorderable selectionMode="multiple" (rowsReorder)="move($event)"',
        ),
        {
          size: 'tall',
          before: note(
            `{{ sorted() ? 'Sorted: the handles are disabled until the sort is cleared' : 'Drag a handle, or Alt+↑/↓ on a row — ' + order() }}`,
          ),
        },
      ),
    };
  },
};

export const Export: Story = {
  parameters: scenario('export'),
  render: () => {
    const preview = signal('');
    return {
      props: {
        ...base(),
        preview,
        show: (text: string) => preview.set(text.slice(0, 160)),
        print: () => window.print(),
        value: ['SHP-20482', 'SHP-20484'],
        query: { ...emptyQuery(), sort: [{ column: 'weight', direction: 'descending' as const }] },
      },
      template: screen(
        grid(
          '#grid="slDataGrid" [rows]="rows" [query]="query" [value]="value" selectionMode="multiple"',
        ),
        {
          size: 'tall',
          before: `<div class="slotted-demo-row">
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.exportCsv({ filename: 'shipments.csv' })">
      CSV
    </button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="grid.exportCsv({ filename: 'selected.csv', rows: 'selected' })">
      CSV, selected rows
    </button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="show(grid.toCsv())">
      Preview
    </button>
    <button slButton size="sm" tone="secondary" variant="outline" type="button" (click)="print()">
      Print
    </button>
    @if (preview()) {
      <p slText size="sm" tone="muted"><code>{{ preview() }}…</code></p>
    }
  </div>`,
        },
      ),
    };
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    const cell = signal<GridCell | null>({ row: 'SHP-20481', column: 'customer' });
    return {
      props: { ...base(), rows: FIFTY.slice(0, 8), cell },
      template: screen(
        grid(
          '[rows]="rows" selectionMode="multiple" [(current)]="cell"',
          `
      <ng-template slDataGridDetail let-row>
        <p slText size="sm">{{ row.customer }}</p>
      </ng-template>`,
        ),
        {
          size: 'tall',
          before: note(
            `{{ cell() ? 'Cursor on ' + cell()!.row + ', ' + cell()!.column : 'No cursor' }}`,
          ),
        },
      ),
    };
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: {
      ...base(),
      messages: {
        grid: 'Shipments',
        selectAllFiltered:
          '{count, plural, one {Select the # shipment} other {Select all # shipments}}',
      },
      rows: FIFTY.slice(0, 8),
      value: ['SHP-20482'],
      query: {
        ...emptyQuery(),
        sort: [
          { column: 'carrier', direction: 'ascending' },
          { column: 'cost', direction: 'descending' },
        ],
      },
    },
    template: screen(
      `
    <sl-data-grid
      rowKey="id"
      height="100%"
      variant="framed"
      selectionMode="multiple"
      [columns]="columns"
      [rows]="rows"
      [query]="query"
      [value]="value"
      [messages]="messages"
    >${STATUS_TEMPLATE}
    </sl-data-grid>`,
      { size: 'tall' },
    ),
  }),
};
