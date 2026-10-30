import { Component, computed, input, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { persistedGridView, SlDataGrid } from '@slotted/angular/data-grid';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import {
  emptyGridView,
  serializeGridView,
  serializeSavedViews,
  type GridColumn,
  type GridView,
  type GridViewStorage,
  type SavedViewsState,
} from '@slotted/core/grid';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { persistedSavedViews } from './persisted-saved-views';
import { SlSavedViews } from './saved-views';
import type { SavedViewsRequest } from './saved-views-defaults';
import { ANGULAR_SAVED_VIEWS_DOCS, ANGULAR_SAVED_VIEWS_TOKENS } from './saved-views.docs';

/* ── The domain: an orders listing ──────────────────────────────────────── */

interface Order {
  id: string;
  customer: string;
  region: string;
  status: string;
  total: number;
  due: string;
}

const option = (value: string) => ({ value, label: value });

const ORDERS: Order[] = [
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

const COLUMNS: GridColumn<Order>[] = [
  { id: 'id', label: 'Order', rowHeader: true, width: 150 },
  { id: 'customer', label: 'Customer', width: 220 },
  {
    id: 'region',
    label: 'Region',
    kind: 'set',
    options: ['Midwest', 'Northeast', 'Southeast', 'West', 'Europe'].map(option),
  },
  { id: 'status', label: 'Status', kind: 'set', options: ['Open', 'Late', 'Shipped'].map(option) },
  {
    id: 'total',
    label: 'Total',
    kind: 'number',
    format: (value) => `US$ ${Number(value).toLocaleString('en-US')}`,
  },
  { id: 'due', label: 'Due', kind: 'date' },
];

const MODEL = COLUMNS as unknown as readonly GridColumn<never>[];

const BUILT_IN: GridView = {
  ...emptyGridView(),
  query: { ...emptyGridView().query, sort: [{ column: 'id', direction: 'ascending' }] },
};
const LATE: GridView = {
  ...BUILT_IN,
  query: { ...BUILT_IN.query, search: 'Late', sort: [{ column: 'due', direction: 'ascending' }] },
};
const REGION: GridView = {
  ...BUILT_IN,
  columns: { ...BUILT_IN.columns, hidden: ['region'] },
  query: { ...BUILT_IN.query, search: 'Midwest' },
};
const HIGH: GridView = {
  ...BUILT_IN,
  density: 'compact',
  query: { ...BUILT_IN.query, sort: [{ column: 'total', direction: 'descending' }] },
};

const line = (view: GridView) => serializeGridView(view, MODEL);

const VIEWS: SavedViewsState = {
  views: [
    { id: 'late', name: 'Late orders', view: line(LATE) },
    { id: 'region', name: 'My region', view: line(REGION) },
    { id: 'high', name: 'High value', view: line(HIGH) },
  ],
  defaultId: null,
  activeId: 'late',
};

const LONG: SavedViewsState = {
  views: [
    {
      id: 'mw',
      name: 'Late orders from the Midwest distributors awaiting carrier confirmation',
      view: line(LATE),
    },
    {
      id: 'ref',
      name: 'SO-2026-Q3-HELIOS-AUTOMATION-GMBH-PREPAID-OVER-10000-USD',
      view: line(HIGH),
    },
  ],
  defaultId: 'mw',
  activeId: 'mw',
};

/** What the reader changes on the grid, as one press: the sort on the total. */
function sortedByTotal(view: GridView): GridView {
  const first = view.query.sort[0];
  const descending = first?.column === 'total' && first.direction === 'descending';
  return {
    ...view,
    query: {
      ...view.query,
      sort: [{ column: 'total', direction: descending ? 'ascending' : 'descending' }],
    },
  };
}

/** A store in memory that says what it holds. */
function memoryStore(initial: Record<string, string>, entry = signal('')) {
  const held = { ...initial };
  const storage: GridViewStorage = {
    getItem: (key) => held[key] ?? null,
    setItem: (key, value) => {
      held[key] = value;
      entry.set(value);
    },
    removeItem: (key) => {
      delete held[key];
      entry.set('');
    },
  };
  return { storage, entry };
}

/* ── The scenes' components ─────────────────────────────────────────────── */

/**
 * The control over a stand-in for the grid: the current view as the line of
 * text it is kept as, and one press that changes it.
 */
@Component({
  selector: 'sl-sv-bar',
  standalone: true,
  imports: [SlSavedViews, SlButton, SlInline, SlStack, SlTextField, SlTextFieldInput],
  template: `<div slStack [gap]="4">
    <div slInline [gap]="3">
      <sl-saved-views
        [builtIn]="builtIn"
        [columns]="model"
        [current]="current()"
        [defaultState]="state()"
        [messages]="messages()"
        (stateChangeRequest)="log.set($event.action + ' · ' + $event.reason)"
        (viewApply)="current.set($event.view)"
      />
      <button slButton size="sm" tone="secondary" variant="outline" (click)="sortByTotal()">
        Sort by total
      </button>
    </div>
    <div slTextField mono>
      <input
        slTextFieldInput
        aria-label="The view in use, as it is kept"
        readonly
        [value]="text()"
      />
    </div>
    <span>{{ log() === '' ? 'No request yet' : 'Last request: ' + log() }}</span>
  </div>`,
})
class ViewsBar {
  readonly initial = input<GridView>(LATE);
  readonly state = input<SavedViewsState>(VIEWS);
  readonly label = input<string | undefined>(undefined);
  protected readonly messages = computed(() => {
    const label = this.label();
    return label === undefined ? undefined : { label };
  });
  readonly builtIn = BUILT_IN;
  readonly model = MODEL;
  readonly current = signal<GridView>(LATE);
  readonly log = signal('');
  readonly text = computed(() => line(this.current()) || '(the built-in view)');

  ngOnInit() {
    this.current.set(this.initial());
  }

  sortByTotal() {
    this.current.set(sortedByTotal(this.current()));
  }
}

@Component({
  selector: 'sl-sv-persisted',
  standalone: true,
  imports: [SlSavedViews, SlStack, SlTextField, SlTextFieldInput],
  template: `<div slStack [gap]="4">
    <sl-saved-views [builtIn]="builtIn" [current]="current" [(state)]="views.state" />
    <div slTextField mono>
      <input slTextFieldInput aria-label="The stored entry" readonly [value]="store.entry()" />
    </div>
  </div>`,
})
class PersistedDemo {
  readonly builtIn = BUILT_IN;
  readonly current = LATE;
  readonly store = memoryStore(
    { 'orders:views': serializeSavedViews(VIEWS) },
    signal(serializeSavedViews(VIEWS)),
  );
  readonly views = persistedSavedViews({ key: 'orders:views', storage: this.store.storage });
}

@Component({
  selector: 'sl-sv-desk',
  standalone: true,
  imports: [SlSavedViews, SlDataGrid, SlStack],
  template: `<div slStack [gap]="4">
    <sl-saved-views
      [builtIn]="builtIn"
      [columns]="model"
      [current]="current()"
      [(state)]="views.state"
      (viewApply)="write($event.view)"
    />
    <div class="slotted-demo-viewport" data-size="tall">
      <sl-data-grid
        aria-label="Orders"
        rowKey="id"
        height="100%"
        [columns]="columns"
        [rows]="orders"
        [(query)]="grid.query"
        [(columnState)]="grid.columnState"
        [density]="grid.density()"
      />
    </div>
  </div>`,
})
class OrdersDesk {
  readonly builtIn = BUILT_IN;
  readonly model = MODEL;
  readonly columns = COLUMNS;
  readonly orders = ORDERS;
  private readonly store = memoryStore({
    'orders:views': serializeSavedViews({ ...VIEWS, activeId: null, defaultId: 'late' }),
  }).storage;
  readonly views = persistedSavedViews({
    key: 'orders:views',
    storage: this.store,
    columns: MODEL,
  });
  private readonly opened = this.views.openedDefault ?? BUILT_IN;
  readonly grid = persistedGridView({
    key: 'orders:grid',
    columns: COLUMNS,
    storage: this.store,
    defaultQuery: this.opened.query,
    defaultColumnState: this.opened.columns,
    defaultDensity: this.opened.density,
  });
  readonly current = computed<GridView>(() => ({
    columns: this.grid.columnState(),
    query: this.grid.query(),
    density: this.grid.density(),
  }));

  write(view: GridView) {
    this.grid.query.set(view.query);
    this.grid.columnState.set(view.columns);
    this.grid.density.set(view.density);
  }
}

@Component({
  selector: 'sl-sv-handled',
  standalone: true,
  imports: [SlSavedViews, SlButton, SlStack],
  template: `<div slStack [gap]="4">
    <button slButton size="sm" tone="secondary" variant="outline" (click)="views.show()">
      Open the views
    </button>
    <sl-saved-views
      #views="slSavedViews"
      [builtIn]="builtIn"
      [current]="current"
      [defaultState]="state"
      (stateChangeRequest)="last = $event"
    />
  </div>`,
})
class HandledDemo {
  readonly builtIn = BUILT_IN;
  readonly current = LATE;
  readonly state = VIEWS;
  last: SavedViewsRequest | null = null;
}

@Component({
  selector: 'sl-sv-translated',
  standalone: true,
  imports: [ViewsBar],
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
  template: `<sl-sv-bar [initial]="initial" label="Order views" />`,
})
class TranslatedDemo {
  readonly initial = sortedByTotal(LATE);
}

/* ── The page ──────────────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<div class="slotted-demo-grid" data-columns="1"><section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section></div>`;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_SAVED_VIEWS_DOCS.savedViews.scenes, {
    playground: Playground,
    'modified-and-revert': ModifiedAndRevert,
    'save-as': SaveAs,
    rename: Rename,
    delete: Delete,
    'default-view': DefaultView,
    'built-in': BuiltIn,
    persistence: Persistence,
    'with-data-grid': WithDataGrid,
    keyboard: Keyboard,
    accessibility: Accessibility,
    'long-names': LongNames,
  }) as never;

const meta: Meta = {
  title: 'Components/SavedViews',
  decorators: [
    moduleMetadata({
      imports: [ViewsBar, PersistedDemo, OrdersDesk, HandledDemo, TranslatedDemo],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Saved Views',
        description:
          'The named arrangements of a grid a reader keeps: the view in use on a trigger, a mark and a revert while the grid differs from it, and a panel to apply, save, save as, rename, delete and choose the view a visit opens on. The family applies nothing to the grid — it hands the consumer the view to write.',
        framework: 'Angular',
        ...ANGULAR_SAVED_VIEWS_DOCS.savedViews,
        tokens: ANGULAR_SAVED_VIEWS_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

const MODIFIED = sortedByTotal(LATE);

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: () => ({ template: `<sl-sv-bar />` }),
};

export const ModifiedAndRevert: Story = {
  parameters: scenario('modified-and-revert'),
  render: () => ({
    props: { initial: MODIFIED },
    template: scene(
      'Late orders, sorted by total',
      'The dot and the word on the trigger, Revert beside it. Revert, or apply Late orders again, and the line goes back to the saved form.',
      `<sl-sv-bar [initial]="initial" />`,
    ),
  }),
};

export const SaveAs: Story = {
  parameters: scenario('save-as'),
  render: () => ({
    props: { initial: MODIFIED },
    template: scene(
      'From the view in use',
      'Open the panel and press Save as new view…; submit it empty, then as “my region”, then as “Midwest backlog”.',
      `<sl-sv-bar [initial]="initial" />`,
    ),
  }),
};

export const Rename: Story = {
  parameters: scenario('rename'),
  render: () => ({
    template: scene(
      'Rename My region',
      'The row’s menu, then Rename. Enter submits; Escape cancels the form and keeps the panel open.',
      `<sl-sv-bar />`,
    ),
  }),
};

export const Delete: Story = {
  parameters: scenario('delete'),
  render: () => ({
    template: scene(
      'Delete the view in use',
      'Delete Late orders from its menu and confirm: the trigger falls back to Default, and the line keeps the late-orders arrangement, now modified.',
      `<sl-sv-bar />`,
    ),
  }),
};

export const DefaultView: Story = {
  parameters: scenario('default-view'),
  render: () => ({
    props: { initial: HIGH, state: { ...VIEWS, activeId: 'high', defaultId: 'high' } },
    template: scene(
      'High value opens every visit',
      'The pin sits after High value. Choose Set as default on another row and the pin moves; the built-in view can take it back.',
      `<sl-sv-bar [initial]="initial" [state]="state" />`,
    ),
  }),
};

export const BuiltIn: Story = {
  parameters: scenario('built-in'),
  render: () => ({
    props: { initial: BUILT_IN, state: { ...VIEWS, activeId: null } },
    template: scene(
      'On the application’s defaults',
      'Default is in use: Save is disabled, the menu holds only Set as default. Sort by total, then Save as new view… to keep it.',
      `<sl-sv-bar [initial]="initial" [state]="state" />`,
    ),
  }),
};

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => ({
    template: scene(
      'The entry, as it is written',
      'Rename, delete or move the default: the JSON below is what the store holds after each change.',
      `<sl-sv-persisted />`,
    ),
  }),
};

export const WithDataGrid: Story = {
  parameters: scenario('with-data-grid'),
  render: () => ({
    template: scene(
      'Orders',
      'The store opens on Late orders, the default. Sort, hide a column or search, then Revert or Save.',
      `<sl-sv-desk />`,
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: scene(
      'From the keyboard, and from the application',
      'Tab to the trigger and press Enter, or press Open the views, which opens it through show().',
      `<sl-sv-handled />`,
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: scene(
      'Translated once, named in context',
      'provideSlotted sets the Portuguese words for the component; its own label message names the group Order views.',
      `<sl-sv-translated />`,
    ),
  }),
};

export const LongNames: Story = {
  parameters: scenario('long-names'),
  render: () => ({
    props: { initial: MODIFIED, state: LONG },
    template: scene(
      'At 360 pixels',
      'The trigger cuts the name with an ellipsis and keeps it whole in title; the list wraps both names.',
      `<div class="slotted-demo-measure"><sl-sv-bar [initial]="initial" [state]="state" /></div>`,
    ),
  }),
};
