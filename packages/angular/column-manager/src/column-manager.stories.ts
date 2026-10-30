import { Component, input, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlDataGrid } from '@slotted/angular/data-grid';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import type { GridColumn, GridColumnState, GridOutOfSpace } from '@slotted/core/grid';
import { normalizeColumnState } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlColumnManager, SlColumnManagerTrigger } from './column-manager';
import {
  type ColumnManagerApply,
  type ColumnManagerPresentation,
  type ColumnManagerRequest,
} from './column-manager-defaults';
import { ANGULAR_COLUMN_MANAGER_DOCS, ANGULAR_COLUMN_MANAGER_TOKENS } from './column-manager.docs';

/* ── An orders listing ─────────────────────────────────────────────────── */

interface Order {
  id: string;
  number: string;
  customer: string;
  status: string;
  total: number;
  due: string;
  owner: string;
  region: string;
  notes: string;
}

const COLUMNS: GridColumn<Order>[] = [
  { id: 'number', label: 'Order', hideable: false, width: 130 },
  { id: 'customer', label: 'Customer', width: 200, priority: 1 },
  {
    id: 'status',
    label: 'Status',
    description: 'Fulfilment stage, updated when the ship date is confirmed',
    width: 130,
  },
  {
    id: 'total',
    label: 'Total',
    kind: 'number',
    description: 'Order value with tax, in the order’s currency',
    width: 120,
  },
  { id: 'due', label: 'Due date', description: 'The date promised to the customer', width: 130 },
  { id: 'owner', label: 'Owner', width: 150, priority: 3 },
  // language: pt-BR
  { id: 'region', label: 'Região', width: 130, priority: 4 },
  // language: en-US
  { id: 'notes', label: 'Notes', width: 220, priority: 5 },
  { id: 'actions', label: 'Actions', kind: 'actions', reorderable: false, width: 90 },
];

const DEFAULTS: Partial<GridColumnState> = {
  hidden: ['notes'],
  pinned: { start: ['number'], end: ['actions'] },
};

const ORDERS: Order[] = [
  {
    id: 'o1',
    number: 'SO-2026-01842',
    customer: 'Northwind Fabrication',
    status: 'Partial',
    total: 12480,
    due: '2026-09-24',
    owner: 'Marta Silva',
    region: 'Ohio',
    notes: 'Six servo motors back-ordered',
  },
  {
    id: 'o2',
    number: 'SO-2026-01843',
    customer: 'Helios Automation GmbH',
    status: 'Approval',
    total: 4120,
    due: '2026-09-26',
    owner: 'Daniel Okafor',
    region: 'Bavaria',
    notes: 'Prepaid',
  },
  {
    id: 'o3',
    number: 'SO-2026-01844',
    customer: 'Pacific Rail Supply',
    status: 'Shipped',
    total: 31900,
    due: '2026-09-19',
    owner: 'Ana Ribeiro',
    region: 'Oregon',
    notes: '',
  },
  {
    id: 'o4',
    number: 'SO-2026-01847',
    customer: 'Casa Verde Mercado',
    status: 'Picking',
    total: 2745,
    due: '2026-09-25',
    owner: 'Anna Rivers',
    region: 'Seattle',
    notes: 'Split delivery',
  },
];

const normalize = (state: Partial<GridColumnState>) =>
  normalizeColumnState(state, COLUMNS as GridColumn<never>[]);

/** A manager over a state this demo owns, with the last request written under it. */
@Component({
  selector: 'sl-column-manager-orders-demo',
  standalone: true,
  imports: [SlButton, SlColumnManager, SlColumnManagerTrigger, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      @if (trigger()) {
        <div slInline>
          <button
            slButton
            tone="secondary"
            variant="outline"
            slColumnManagerTrigger
            [slColumnManagerTriggerFor]="manager"
            type="button"
          >
            Columns
          </button>
        </div>
      }
      <div [class.slotted-demo-measure]="presentation() === 'inline'">
        <sl-column-manager
          #manager="slColumnManager"
          [columns]="columns"
          [defaultColumnState]="defaults"
          [outOfSpace]="outOfSpace()"
          [presentation]="presentation()"
          [apply]="apply()"
          [columnState]="state()"
          (columnStateChangeRequest)="onRequest($event)"
        />
      </div>
      <p slText size="sm" tone="muted">{{ log() }}</p>
    </div>
  `,
})
class OrdersDemo {
  readonly presentation = input<ColumnManagerPresentation>('inline');
  readonly apply = input<ColumnManagerApply>('live');
  readonly outOfSpace = input<GridOutOfSpace>({ popin: [], hidden: [] });
  readonly trigger = input(false);
  readonly initial = input<Partial<GridColumnState>>(DEFAULTS);
  readonly lockOrder = input(true);

  protected readonly defaults = DEFAULTS;
  protected get columns() {
    return (
      this.lockOrder()
        ? COLUMNS
        : COLUMNS.map((column) => (column.id === 'number' ? { ...column, hideable: true } : column))
    ) as GridColumn<never>[];
  }

  protected readonly state = signal<GridColumnState | undefined>(undefined);
  protected readonly log = signal('No request yet.');

  ngOnInit() {
    this.state.set(normalize(this.initial()));
  }

  protected onRequest(request: ColumnManagerRequest) {
    this.log.set(
      `columnStateChangeRequest — change: ${request.change}, changes: [${request.changes.join(', ')}], reason: ${request.reason}`,
    );
    this.state.set(request.value);
  }
}

/** The grid and the manager over one state. */
@Component({
  selector: 'sl-column-manager-listing-demo',
  standalone: true,
  imports: [SlButton, SlColumnManager, SlColumnManagerTrigger, SlDataGrid, SlInline, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slInline>
        <button
          slButton
          tone="secondary"
          variant="outline"
          slColumnManagerTrigger
          [slColumnManagerTriggerFor]="manager"
          type="button"
        >
          Columns
        </button>
      </div>
      <div class="slotted-demo-viewport" data-size="tall">
        <sl-data-grid
          #grid="slDataGrid"
          aria-label="Orders"
          manageable
          rowKey="id"
          height="100%"
          variant="framed"
          [columns]="columns"
          [rows]="rows"
          [columnState]="state()"
          (columnStateChangeRequest)="state.set($event.value)"
          (manageColumns)="manager.show()"
        />
      </div>
      <sl-column-manager
        #manager="slColumnManager"
        [columns]="columns"
        [defaultColumnState]="defaults"
        [outOfSpace]="grid.outOfSpace()"
        [columnState]="state()"
        (columnStateChangeRequest)="state.set($event.value)"
      />
    </div>
  `,
})
class ListingDemo {
  protected readonly columns = COLUMNS as GridColumn<never>[];
  protected readonly rows = ORDERS as never[];
  protected readonly defaults = DEFAULTS;
  protected readonly state = signal<GridColumnState>(normalize(DEFAULTS));
}

/** One trigger with a count, over a popover manager. */
@Component({
  selector: 'sl-column-manager-counted-demo',
  standalone: true,
  imports: [SlButton, SlColumnManager, SlColumnManagerTrigger],
  template: `
    <button
      slButton
      size="sm"
      tone="secondary"
      variant="ghost"
      slColumnManagerTrigger
      [slColumnManagerTriggerFor]="manager"
      type="button"
    >
      Columns
    </button>
    <sl-column-manager
      #manager="slColumnManager"
      [columns]="columns"
      [defaultColumnState]="{ pinned: { start: ['number'], end: ['actions'] }, hidden: hidden() }"
    />
  `,
})
class CountedDemo {
  readonly hidden = input<string[]>([]);
  protected readonly columns = COLUMNS as GridColumn<never>[];
}

@Component({
  selector: 'sl-column-manager-provided-demo',
  standalone: true,
  imports: [OrdersDemo],
  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
  template: `<sl-column-manager-orders-demo
    presentation="popover"
    [trigger]="true"
    [outOfSpace]="{ popin: ['owner'], hidden: ['region'] }"
  />`,
})
class ProvidedDemo {}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

const one = (label: string, note: string, body: string) => ({
  template: grid(scene(label, note, body)),
});

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_COLUMN_MANAGER_DOCS.columnManager.scenes, {
    playground: Playground,
    popover: InPopover,
    drawer: InDrawer,
    confirm: Confirm,
    search: Search,
    locked: Locked,
    'hidden-by-space': HiddenBySpace,
    reorder: Reorder,
    pinning: Pinning,
    'reset-and-show-all': ResetAndShowAll,
    'trigger-count': TriggerCount,
    'with-data-grid': WithDataGrid,
    keyboard: Keyboard,
    accessibility: Accessibility,
  });

interface ColumnManagerStoryArgs {
  presentation: ColumnManagerPresentation;
  apply: ColumnManagerApply;
}

const meta: Meta<ColumnManagerStoryArgs> = {
  title: 'Components/ColumnManager',
  decorators: [
    moduleMetadata({
      imports: [SlColumnManager, SlInline, OrdersDemo, ListingDemo, CountedDemo, ProvidedDemo],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Column Manager',
        description:
          'The panel that edits a grid’s column state: which columns are shown, in which order and pinned to which edge, with search, required columns, columns the grid hid for room, and a count on the trigger. Every change is a request carrying the reason and every key that moved.',
        framework: 'Angular',
        ...ANGULAR_COLUMN_MANAGER_DOCS.columnManager,
        tokens: ANGULAR_COLUMN_MANAGER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ColumnManagerStoryArgs>;

export const Playground: Story = {
  args: { presentation: 'popover', apply: 'live' },
  argTypes: {
    presentation: { control: 'inline-radio', options: ['popover', 'drawer', 'inline'] },
    apply: { control: 'inline-radio', options: ['live', 'confirm'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    ...one(
      'Nine columns of an orders listing',
      'Open Columns, hide Customer and watch the count; the request is written under the trigger.',
      `<sl-column-manager-orders-demo [presentation]="presentation" [apply]="apply" [trigger]="presentation !== 'inline'" />`,
    ),
  }),
};

export const InPopover: Story = {
  name: 'Popover',
  parameters: scenario('popover'),
  render: () =>
    one(
      'Anchored on the trigger',
      'Press Columns: the search takes focus. Escape or a press outside closes and focus returns to the trigger.',
      `<sl-column-manager-orders-demo presentation="popover" [trigger]="true" />`,
    ),
};

export const InDrawer: Story = {
  name: 'Drawer',
  parameters: scenario('drawer'),
  render: () =>
    one(
      'At the end of the page',
      'Press Columns: a drawer at side end holds the whole list, uncapped, with the footer at its foot.',
      `<sl-column-manager-orders-demo presentation="drawer" [trigger]="true" />`,
    ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () =>
    one(
      'A draft, applied once',
      'Hide Owner, move Status: nothing is asked. Apply asks once with the reason submit; Cancel discards.',
      `<sl-column-manager-orders-demo apply="confirm" />`,
    ),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () =>
    one(
      'By name and by description',
      'Type date, then regiao: descriptions are searched and accents fall away. The grips are disabled while a query stands.',
      `<sl-column-manager-orders-demo />`,
    ),
};

export const Locked: Story = {
  parameters: scenario('locked'),
  render: () => ({
    template: grid(
      scene(
        'A required column',
        'Order is hideable: false — ticked, disabled and marked Required, and its status is part of its name.',
        `<sl-column-manager-orders-demo />`,
      ) +
        scene(
          'The last shown column',
          'Every column but Order and Customer is hidden and Order may be hidden here; hide Order and Customer’s box is the last one and stays disabled.',
          `<sl-column-manager-orders-demo [lockOrder]="false" [initial]="{ pinned: { start: ['number'], end: ['actions'] }, hidden: ['status', 'total', 'due', 'owner', 'region', 'notes', 'actions'] }" />`,
        ),
    ),
  }),
};

export const HiddenBySpace: Story = {
  parameters: scenario('hidden-by-space'),
  render: () =>
    one(
      'Taken out by the grid for room',
      // language: pt-BR
      'Owner moved into the grid’s rows and Região was hidden by the grid’s width, not by the reader: their boxes keep the reader’s value and their status says where they are.',
      // language: en-US
      `<sl-column-manager-orders-demo [outOfSpace]="{ popin: ['owner'], hidden: ['region'] }" [initial]="{ pinned: { start: ['number'], end: ['actions'] }, hidden: [] }" />`,
    ),
};

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () =>
    one(
      'Drag a grip, or Alt+Arrow on it',
      'The dragged row dims and a line marks the landing place inside its zone. Alt+ArrowDown moves one place and announces the new position.',
      `<sl-column-manager-orders-demo />`,
    ),
};

export const Pinning: Story = {
  parameters: scenario('pinning'),
  render: () =>
    one(
      'Three zones',
      'Order is pinned to the start and Actions to the end. Pin Due date to the end from its menu: it leaves the middle section for the last.',
      `<sl-column-manager-orders-demo />`,
    ),
};

export const ResetAndShowAll: Story = {
  parameters: scenario('reset-and-show-all'),
  render: () =>
    one(
      'Four hidden against a default of one',
      'Show all asks for none hidden; Restore defaults asks for the default with the reason clear. Each is disabled when it would change nothing.',
      `<sl-column-manager-orders-demo [initial]="{ pinned: { start: ['number'], end: ['actions'] }, hidden: ['notes', 'owner', 'region', 'total'] }" />`,
    ),
};

export const TriggerCount: Story = {
  parameters: scenario('trigger-count'),
  render: () =>
    one(
      'Zero, one and seven',
      'No chip at zero. The chip is aria-hidden; the trigger is named Columns 1 hidden column, and so on, by a visually hidden sentence.',
      `<div slInline [gap]="4">
        <sl-column-manager-counted-demo [hidden]="[]" />
        <sl-column-manager-counted-demo [hidden]="['notes']" />
        <sl-column-manager-counted-demo [hidden]="['customer', 'status', 'total', 'due', 'owner', 'region', 'notes']" />
      </div>`,
    ),
};

export const WithDataGrid: Story = {
  parameters: scenario('with-data-grid'),
  render: () =>
    one(
      'One state, two editors',
      'Hide a column here and it leaves the grid; Manage columns… in a column menu opens this manager. Narrow the window and Shown in row appears beside the columns the grid moved into its rows.',
      `<sl-column-manager-listing-demo />`,
    ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () =>
    one(
      'Native order, three stops a row',
      'Tab to Customer’s grip, press Alt+ArrowDown twice, then Space on a box and Enter on a pin.',
      `<sl-column-manager-orders-demo />`,
    ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () =>
    one(
      'In Portuguese, from the provider',
      'Every word comes from the language in force: the group, the zones, the statuses, the trigger’s sentence and the announcement.',
      `<sl-column-manager-provided-demo />`,
    ),
};
