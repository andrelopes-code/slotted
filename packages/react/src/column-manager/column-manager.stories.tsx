import type { GridColumn, GridColumnState, GridOutOfSpace } from '@slotted/core/grid';
import { normalizeColumnState } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';

import { Button } from '../button';
import { DataGrid } from '../data-grid';
import { Grid, Measure, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Inline } from '../inline';
import { Stack } from '../stack';
import { Text } from '../typography';
import { ColumnManager, ColumnManagerRoot, ColumnManagerTrigger } from './column-manager';
import { REACT_COLUMN_MANAGER_DOCS, REACT_COLUMN_MANAGER_TOKENS } from './column-manager.docs';
import type {
  ColumnManagerApply,
  ColumnManagerHandle,
  ColumnManagerPresentation,
  ColumnManagerProps,
  ColumnManagerRequest,
} from './column-manager.types';

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
  [
    'SO-2026-01842',
    'Northwind Fabrication',
    'Partial',
    12480,
    '2026-09-24',
    'Marta Silva',
    'Ohio',
    'Six servo motors back-ordered',
  ],
  [
    'SO-2026-01843',
    'Helios Automation GmbH',
    'Approval',
    4120,
    '2026-09-26',
    'Daniel Okafor',
    'Bavaria',
    'Prepaid',
  ],
  [
    'SO-2026-01844',
    'Pacific Rail Supply',
    'Shipped',
    31900,
    '2026-09-19',
    'Ana Ribeiro',
    'Oregon',
    '',
  ],
  [
    'SO-2026-01845',
    'Tannery Row Leather',
    'Draft',
    860,
    '2026-10-02',
    'Marta Silva',
    'Porto',
    'Awaiting samples',
  ],
  ['SO-2026-01846', 'Lumen Optics', 'Delivered', 15230, '2026-09-12', 'Kenji Mori', 'Osaka', ''],
  [
    'SO-2026-01847',
    'Casa Verde Mercado',
    'Picking',
    2745,
    '2026-09-25',
    'Anna Rivers',
    'Seattle',
    'Split delivery',
  ],
].map(([number, customer, status, total, due, owner, region, notes], index) => ({
  id: `o${index}`,
  number: number as string,
  customer: customer as string,
  status: status as string,
  total: total as number,
  due: due as string,
  owner: owner as string,
  region: region as string,
  notes: notes as string,
}));

const normalize = (state: Partial<GridColumnState>) => normalizeColumnState(state, COLUMNS);

function describe(request: ColumnManagerRequest | null): string {
  if (!request) return 'No request yet.';
  return `onColumnStateChange — change: ${request.change}, changes: [${request.changes.join(', ')}], reason: ${request.reason}`;
}

/** A manager over a state this story owns, with the last request written under it. */
function Orders({
  initial = DEFAULTS,
  trigger = false,
  ...props
}: Partial<ColumnManagerProps<Order>> & {
  initial?: Partial<GridColumnState>;
  trigger?: boolean;
}) {
  const manager = useRef<ColumnManagerHandle>(null);
  const [state, setState] = useState(() => normalize(initial));
  const [last, setLast] = useState<ColumnManagerRequest | null>(null);
  const body = (
    <ColumnManager<Order>
      columnState={state}
      columns={COLUMNS}
      defaultColumnState={DEFAULTS}
      onColumnStateChange={(next, request) => {
        setLast(request);
        setState(next);
      }}
      presentation="inline"
      ref={manager}
      {...props}
    />
  );
  return (
    <Stack gap={4}>
      {trigger ? (
        <Inline>
          <ColumnManagerTrigger manager={manager}>Columns</ColumnManagerTrigger>
        </Inline>
      ) : null}
      {props.presentation && props.presentation !== 'inline' ? body : <Measure>{body}</Measure>}
      <Text size="sm" tone="muted">
        {describe(last)}
      </Text>
    </Stack>
  );
}

function One({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        {children}
      </Scene>
    </Grid>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_COLUMN_MANAGER_DOCS.columnManager.scenes, {
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

interface PlaygroundArgs {
  presentation: ColumnManagerPresentation;
  apply: ColumnManagerApply;
}

const meta = {
  title: 'Components/ColumnManager',
  component: ColumnManager,
  args: { columns: COLUMNS as never },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Column Manager',
        description:
          'The panel that edits a grid’s column state: which columns are shown, in which order and pinned to which edge, with search, required columns, columns the grid hid for room, and a count on the trigger. Every change is a request carrying the reason and every key that moved.',
        framework: 'React',
        ...REACT_COLUMN_MANAGER_DOCS.columnManager,
        tokens: REACT_COLUMN_MANAGER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ColumnManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { presentation: 'popover', apply: 'live' } as never,
  argTypes: {
    presentation: { control: 'inline-radio', options: ['popover', 'drawer', 'inline'] },
    apply: { control: 'inline-radio', options: ['live', 'confirm'] },
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => {
    const { presentation, apply } = args as unknown as PlaygroundArgs;
    return (
      <One
        label="Nine columns of an orders listing"
        note="Open Columns, hide Customer and watch the count; the request is written under the trigger."
      >
        <Orders apply={apply} presentation={presentation} trigger={presentation !== 'inline'} />
      </One>
    );
  },
};

export const InPopover: Story = {
  name: 'Popover',
  parameters: scenario('popover'),
  render: () => (
    <One
      label="Anchored on the trigger"
      note="Press Columns: the search takes focus. Escape or a press outside closes and focus returns to the trigger."
    >
      <Orders presentation="popover" trigger />
    </One>
  ),
};

export const InDrawer: Story = {
  name: 'Drawer',
  parameters: scenario('drawer'),
  render: () => (
    <One
      label="At the end of the page"
      note="Press Columns: a drawer at side end holds the whole list, uncapped, with the footer at its foot."
    >
      <Orders presentation="drawer" trigger />
    </One>
  ),
};

export const Confirm: Story = {
  parameters: scenario('confirm'),
  render: () => (
    <One
      label="A draft, applied once"
      note="Hide Owner, move Status: nothing is asked. Apply asks once with the reason submit; Cancel discards."
    >
      <Orders apply="confirm" />
    </One>
  ),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: () => (
    <One
      label="By name and by description"
      note="Type date, then regiao: descriptions are searched and accents fall away. The grips are disabled while a query stands."
    >
      <Orders />
    </One>
  ),
};

export const Locked: Story = {
  parameters: scenario('locked'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A required column"
        note="Order is hideable: false — ticked, disabled and marked Required, and its status is part of its name."
      >
        <Orders />
      </Scene>
      <Scene
        label="The last shown column"
        note="Every column but Order and Customer is hidden; Order is required, so Customer’s box is the last one and stays disabled."
      >
        <Orders
          initial={{
            ...DEFAULTS,
            hidden: ['status', 'total', 'due', 'owner', 'region', 'notes', 'actions'],
          }}
          columns={COLUMNS.map((column) =>
            column.id === 'number' ? { ...column, hideable: true } : column,
          )}
        />
      </Scene>
    </Grid>
  ),
};

export const HiddenBySpace: Story = {
  parameters: scenario('hidden-by-space'),
  render: () => (
    <One
      label="Taken out by the grid for room"
      // language: pt-BR
      note="Owner moved into the grid’s rows and Região was hidden by the grid’s width, not by the reader: their boxes keep the reader’s value and their status says where they are."
      // language: en-US
    >
      <Orders
        initial={{ ...DEFAULTS, hidden: [] }}
        outOfSpace={{ popin: ['owner'], hidden: ['region'] }}
      />
    </One>
  ),
};

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => (
    <One
      label="Drag a grip, or Alt+Arrow on it"
      note="The dragged row dims and a line marks the landing place inside its zone. Alt+ArrowDown moves one place and announces the new position."
    >
      <Orders />
    </One>
  ),
};

export const Pinning: Story = {
  parameters: scenario('pinning'),
  render: () => (
    <One
      label="Three zones"
      note="Order is pinned to the start and Actions to the end. Pin Due date to the end from its menu: it leaves the middle section for the last."
    >
      <Orders />
    </One>
  ),
};

export const ResetAndShowAll: Story = {
  parameters: scenario('reset-and-show-all'),
  render: () => (
    <One
      label="Four hidden against a default of one"
      note="Show all asks for none hidden; Restore defaults asks for the default with the reason clear. Each is disabled when it would change nothing."
    >
      <Orders initial={{ ...DEFAULTS, hidden: ['notes', 'owner', 'region', 'total'] }} />
    </One>
  ),
};

function Counted({ hidden, label }: { hidden: string[]; label: string }) {
  const manager = useRef<ColumnManagerHandle>(null);
  return (
    <>
      <ColumnManagerTrigger
        manager={manager}
        render={({ children, ...props }) => (
          <Button {...props} size="sm" tone="secondary" variant="ghost">
            {children}
          </Button>
        )}
      >
        {label}
      </ColumnManagerTrigger>
      <ColumnManager<Order>
        columns={COLUMNS}
        defaultColumnState={{ ...DEFAULTS, hidden }}
        ref={manager}
      />
    </>
  );
}

export const TriggerCount: Story = {
  parameters: scenario('trigger-count'),
  render: () => (
    <One
      label="Zero, one and twelve"
      note="No chip at zero. The chip is aria-hidden; the trigger is named Columns 1 hidden column, and so on, by a visually hidden sentence."
    >
      <Inline gap={4}>
        <Counted hidden={[]} label="Columns" />
        <Counted hidden={['notes']} label="Columns" />
        <ColumnManagerRoot>
          <ColumnManagerTrigger>Columns</ColumnManagerTrigger>
          <ColumnManager<Order>
            columns={COLUMNS}
            defaultColumnState={{
              ...DEFAULTS,
              hidden: ['customer', 'status', 'total', 'due', 'owner', 'region', 'notes'],
            }}
          />
        </ColumnManagerRoot>
      </Inline>
    </One>
  ),
};

function Listing() {
  const manager = useRef<ColumnManagerHandle>(null);
  const [state, setState] = useState(() => normalize(DEFAULTS));
  const [outOfSpace, setOutOfSpace] = useState<GridOutOfSpace>({ popin: [], hidden: [] });
  return (
    <Stack gap={4}>
      <Inline>
        <ColumnManagerTrigger manager={manager}>Columns</ColumnManagerTrigger>
      </Inline>
      <div className="slotted-demo-viewport" data-size="tall">
        <DataGrid<Order>
          columnState={state}
          columns={COLUMNS}
          height="100%"
          aria-label="Orders"
          onColumnStateChange={(next) => setState(next)}
          onManageColumns={() => manager.current?.show()}
          onOutOfSpaceChange={setOutOfSpace}
          rowKey="id"
          rows={ORDERS}
          variant="framed"
        />
      </div>
      <ColumnManager<Order>
        columnState={state}
        columns={COLUMNS}
        defaultColumnState={DEFAULTS}
        onColumnStateChange={(next) => setState(next)}
        outOfSpace={outOfSpace}
        ref={manager}
      />
    </Stack>
  );
}

export const WithDataGrid: Story = {
  parameters: scenario('with-data-grid'),
  render: () => (
    <One
      label="One state, two editors"
      note="Hide a column here and it leaves the grid; Manage columns… in a column menu opens this manager. Narrow the window and Shown in row appears."
    >
      <Listing />
    </One>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <One
      label="Native order, three stops a row"
      note="Tab to Customer’s grip, press Alt+ArrowDown twice, then Space on a box and Enter on a pin."
    >
      <Orders />
    </One>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <One
      label="In Portuguese, from the provider"
      note="Every word comes from the language in force: the group, the zones, the statuses, the trigger’s sentence and the announcement."
    >
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <Orders
          outOfSpace={{ popin: ['owner'], hidden: ['region'] }}
          presentation="popover"
          trigger
        />
      </SlottedProvider>
    </One>
  ),
};
