import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Inline } from '../inline';
import { Stack } from '../stack';
import { Text } from '../typography';
import { DashboardGrid } from './dashboard-grid';
import { DashboardGridDefaultsProvider } from './dashboard-grid-defaults';
import { salesWidgets, TopProductsSkeleton } from './dashboard-grid-demo';
import { REACT_DASHBOARD_GRID_DOCS, REACT_DASHBOARD_GRID_TOKENS } from './dashboard-grid.docs';
import type {
  DashboardGridHandle,
  DashboardGridProps,
  DashboardLayout,
  DashboardLayoutRequest,
} from './dashboard-grid.types';
import { usePersistedDashboardLayout } from './use-persisted-dashboard-layout';

function describe(request: DashboardLayoutRequest | null): string {
  if (!request) return 'No change yet.';
  const { kind, key } = request.change;
  return `onLayoutChange — kind: ${kind}, key: ${key ?? 'null'}, reason: ${request.reason}`;
}

/** The ground a dashboard stands on: the page's sunken surface. */
function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-surface" data-surface="sunken" data-flow="stack">
      {children}
    </div>
  );
}

/** A room of a stated width, for the scene that shows the three size classes. */
function Room({ room, children }: { room: 'wide' | 'tablet' | 'phone'; children: ReactNode }) {
  return (
    <div className="slotted-demo-room" data-room={room}>
      <div className="slotted-demo-viewport" data-size="content">
        {children}
      </div>
    </div>
  );
}

function One({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        <Ground>{children}</Ground>
      </Scene>
    </Grid>
  );
}

/**
 * The sales overview over a layout and a mode this story owns, with the page's
 * own Edit layout button above it and the last request written under it.
 */
function Sales({
  children,
  defaultEditing = false,
  initial = [],
  ...props
}: Partial<DashboardGridProps> & { initial?: DashboardLayout }) {
  const [layout, setLayout] = useState<DashboardLayout>(initial);
  const [editing, setEditing] = useState(defaultEditing);
  const [last, setLast] = useState<DashboardLayoutRequest | null>(null);
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button
          disabled={editing}
          onClick={() => setEditing(true)}
          size="sm"
          tone="secondary"
          variant="outline"
        >
          Edit layout
        </Button>
      </Inline>
      <DashboardGrid
        aria-label="Sales overview"
        editing={editing}
        layout={layout}
        onEditingChange={setEditing}
        onLayoutChange={(next, request) => {
          setLast(request);
          setLayout(next);
        }}
        {...props}
      >
        {children ?? salesWidgets()}
      </DashboardGrid>
      <Text size="sm" tone="muted">
        {describe(last)}
      </Text>
    </Stack>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DASHBOARD_GRID_DOCS['dashboard-grid'].scenes, {
    playground: Playground,
    anatomy: Anatomy,
    editing: Editing,
    keyboard: Keyboard,
    constraints: Constraints,
    states: States,
    responsive: Responsive,
    persistence: Persistence,
    labels: Labels,
    accessibility: Accessibility,
  });

const meta = {
  title: 'Components/Dashboard Grid',
  component: DashboardGrid,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Dashboard Grid',
        description:
          'A surface of widgets the reader places and sizes. Each widget is a card with a title, its states and a way to its own page; an explicit edit mode lifts a widget to carry it to any cell, pulls it by its sides and corners, and does both from the keyboard and from a menu. The layout is kept by the application and serves every width: a grid of cells on a wide screen, a flow of halves on a tablet, one column on a phone.',
        framework: 'React',
        ...REACT_DASHBOARD_GRID_DOCS['dashboard-grid'],
        tokens: REACT_DASHBOARD_GRID_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DashboardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { columns: 12, editBar: true } as never,
  argTypes: {
    columns: { control: 'inline-radio', options: [6, 8, 12] },
    editBar: { control: 'boolean' },
  } as never,
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <One
      label="Trailhead’s sales overview"
      note="Press Edit layout, pick up a card and carry it to another cell, pull a side or a corner, then Done; each request is written under the grid."
    >
      <Sales {...(args as Partial<DashboardGridProps>)} />
    </One>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <One
      label="Every part, while editing"
      note="The pill on each card’s top edge is its handle; its sides and bottom corners take a pull; Revenue by week carries a description, a footer and the detail link; Top products carries Export."
    >
      <Sales
        defaultEditing
        children={salesWidgets({
          trend: {
            footer: (
              <Text size="sm" tone="muted">
                Updated 4 minutes ago
              </Text>
            ),
          },
        })}
      />
    </One>
  ),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => (
    <One
      label="Rearranging, with a hidden widget"
      note="Refunds was hidden earlier, so Add widget lists it. Carry a card and the others make room; Cancel returns the layout editing started from."
    >
      <Sales defaultEditing initial={[{ key: 'refunds', x: 6, y: 0, w: 3, h: 2, hidden: true }]} />
    </One>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <One
      label="Moving and resizing without a pointer"
      note="Tab to the handle of Orders: Alt+ArrowRight moves it a column, Alt+ArrowDown trades places with the widget below, Shift+ArrowRight makes it wider, Enter opens the same choices as a menu."
    >
      <Sales defaultEditing />
    </One>
  ),
};

export const Constraints: Story = {
  parameters: scenario('constraints'),
  render: () => (
    <One
      label="Pinned, bounded, fixed and permanent"
      note="Revenue is pinned: carry Orders onto it and Orders goes around. Revenue by week stops at four columns and three rows; Conversion has no edges to pull; Top products has no Hide."
    >
      <Sales
        defaultEditing
        children={salesWidgets({
          revenue: { movable: false, description: 'Pinned by finance' },
          trend: { minColumns: 4, minRows: 3 },
          conversion: { resizable: false },
          products: { removable: false },
        })}
      />
    </One>
  ),
};

function StatesDemo() {
  const [failed, setFailed] = useState(true);
  return (
    <DashboardGrid aria-label="Sales overview">
      {salesWidgets({
        revenue: { loading: true },
        orders: { busy: true },
        refunds: {
          defaultRows: 3,
          status: 'empty',
          emptyDescription: 'No refund was issued this month.',
          emptyAction: (
            <Button size="sm" tone="secondary" variant="outline">
              Record a refund
            </Button>
          ),
        },
        conversion: {
          status: failed ? 'error' : 'ready',
          errorDescription: 'The analytics service did not answer in time.',
          onRetry: () => setFailed(false),
        },
        products: { loading: true, skeleton: <TopProductsSkeleton /> },
      })}
    </DashboardGrid>
  );
}

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <One
      label="A month that has not fully arrived"
      note="Revenue waits under one block; Top products waits under its own rows; Orders refreshes under a moving line; Refunds is empty with its next step; Conversion failed — Try again brings it back."
    >
      <StatesDemo />
    </One>
  ),
};

export const Responsive: Story = {
  parameters: scenario('responsive'),
  render: () => (
    <Grid columns={1}>
      {(
        [
          [
            'wide',
            'Desktop, 1280 pixels',
            'Twelve columns: every widget at its own cell, four figures on a row, the chart beside the table.',
          ],
          [
            'tablet',
            'Tablet, 640 pixels',
            'The same order flowed in halves and wholes: two figures a row, the chart across, the table at half.',
          ],
          [
            'phone',
            'Phone, 375 pixels',
            'One column in the reading order, each widget as tall as its content; only the order can change here.',
          ],
        ] as const
      ).map(([room, label, note]) => (
        <Scene key={room} label={label} note={note}>
          <Room room={room}>
            <Ground>
              <DashboardGrid aria-label="Sales overview">{salesWidgets()}</DashboardGrid>
            </Ground>
          </Room>
        </Scene>
      ))}
    </Grid>
  ),
};

function PersistenceDemo() {
  const persisted = usePersistedDashboardLayout({ key: 'trailhead-sales' });
  const [editing, setEditing] = useState(true);
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button
          disabled={editing}
          onClick={() => setEditing(true)}
          size="sm"
          variant="outline"
          tone="secondary"
        >
          Edit layout
        </Button>
        <Button onClick={persisted.clear} size="sm" tone="danger" variant="ghost">
          Forget layout
        </Button>
      </Inline>
      <DashboardGrid
        aria-label="Sales overview"
        editing={editing}
        layout={persisted.layout}
        onEditingChange={setEditing}
        onLayoutChange={persisted.onLayoutChange}
      >
        {salesWidgets()}
      </DashboardGrid>
    </Stack>
  );
}

export const Persistence: Story = {
  parameters: scenario('persistence'),
  render: () => (
    <One
      label="Stored under trailhead-sales"
      note="Move or hide a widget and reload the page: the layout returns. Forget layout removes the entry and the defaults come back."
    >
      <PersistenceDemo />
    </One>
  ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => (
    <One
      label="The sales dashboard, in Portuguese"
      note="The language in force sets the bar, the handle’s name, the menu and the announcements once; the provider makes the titles h2."
    >
      <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
        <DashboardGridDefaultsProvider headingLevel={2}>
          <Sales
            defaultEditing
            children={salesWidgets({
              revenue: { title: 'Receita' },
              orders: { title: 'Encomendas' },
              refunds: { title: 'Reembolsos' },
              // language: pt-BR
              conversion: { title: 'Conversão' },
              // language: en-US
              trend: {
                title: 'Revenue by week',
                // language: pt-BR
                description: 'Últimas doze semanas, todos os canais',
                // language: en-US
              },
              products: { title: 'Top-selling products' },
            })}
          />
        </DashboardGridDefaultsProvider>
      </SlottedProvider>
    </One>
  ),
};

function AccessibilityDemo() {
  const grid = useRef<DashboardGridHandle>(null);
  const [editing, setEditing] = useState(true);
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button
          onClick={() => (editing ? grid.current?.commitEditing() : setEditing(true))}
          size="sm"
          tone={editing ? 'accent' : 'secondary'}
          variant={editing ? 'solid' : 'outline'}
        >
          {editing ? 'Done' : 'Edit layout'}
        </Button>
      </Inline>
      <DashboardGrid
        aria-label="Sales overview"
        editBar={false}
        editing={editing}
        onEditingChange={setEditing}
        ref={grid}
      >
        {salesWidgets()}
      </DashboardGrid>
    </Stack>
  );
}

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <One
      label="The page owns the controls"
      note="With editBar off the instructions stay as each handle’s description; Done here calls commitEditing, and every change is still announced."
    >
      <AccessibilityDemo />
    </One>
  ),
};
