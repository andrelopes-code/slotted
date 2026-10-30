import {
  createFilterGroupPredicate,
  createSearchPredicate,
  fromFilterBarParams,
  setFilter,
  toFilterBarParams,
} from '@slotted/core/filter';
import type { FilterGroup } from '@slotted/core/filter';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Badge } from '../badge';
import { Button } from '../button';
import { Layer } from '../drawer/drawer-demo';
import { CodeBlock } from '../code-block';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '../table';
import { FilterBar } from './filter-bar';
import { REACT_FILTER_BAR_DOCS, REACT_FILTER_BAR_TOKENS } from './filter-bar.docs';
import type { FilterBarField, FilterBarHandle, FilterBarProps } from './filter-bar.types';

/* ── The listing: orders of a Brazilian marketplace ──────────────────────── */

interface Order {
  id: string;
  customer: string;
  status: 'paid' | 'pending' | 'refunded' | 'cancelled';
  amount: number;
  channel: 'web' | 'app' | 'marketplace';
  created: string;
  priority: boolean;
  company: 'acme' | 'solaris';
}

const ORDERS: Order[] = [
  {
    id: 'PED-48211',
    customer: 'Ana Souza',
    status: 'paid',
    amount: 1250.9,
    channel: 'web',
    created: '2026-09-12',
    company: 'acme',
    priority: true,
  },
  {
    id: 'PED-48212',
    customer: 'Bruno Lima',
    status: 'pending',
    amount: 89.9,
    channel: 'app',
    created: '2026-09-12',
    company: 'acme',
    priority: false,
  },
  {
    id: 'PED-48219',
    customer: 'Mariana Costa',
    status: 'refunded',
    amount: 412,
    channel: 'marketplace',
    created: '2026-09-11',
    company: 'solaris',
    priority: false,
  },
  {
    id: 'PED-48223',
    customer: 'Solaris Fretes',
    status: 'paid',
    amount: 18240,
    channel: 'web',
    created: '2026-09-10',
    company: 'solaris',
    priority: true,
  },
  {
    id: 'PED-48230',
    customer: 'Carla Menezes',
    status: 'cancelled',
    amount: 59.9,
    channel: 'app',
    created: '2026-09-09',
    company: 'acme',
    priority: false,
  },
  {
    id: 'PED-48231',
    customer: 'Diana Ferreira',
    status: 'paid',
    amount: 320,
    channel: 'marketplace',
    created: '2026-09-08',
    company: 'solaris',
    priority: false,
  },
  {
    id: 'PED-48237',
    customer: 'Eduardo Ramos',
    status: 'pending',
    amount: 2380.5,
    channel: 'web',
    created: '2026-09-07',
    company: 'acme',
    priority: true,
  },
  {
    id: 'PED-48240',
    customer: 'Fernanda Alves',
    status: 'paid',
    amount: 148,
    channel: 'app',
    created: '2026-09-05',
    company: 'acme',
    priority: false,
  },
];

const STATUSES = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
];

const CHANNELS = [
  { label: 'Web', value: 'web' },
  { label: 'App', value: 'app' },
  { label: 'Marketplace', value: 'marketplace' },
];

const FIELDS: FilterBarField[] = [
  { icon: 'circle', key: 'status', kind: 'set', label: 'Status', options: STATUSES, pinned: true },
  { icon: 'person', key: 'customer', kind: 'text', label: 'Customer', pinned: true },
  { key: 'amount', kind: 'number', label: 'Amount', min: 0, step: 0.01 },
  { key: 'channel', kind: 'set', label: 'Channel', options: CHANNELS },
  { icon: 'calendar', key: 'created', kind: 'date', label: 'Created', section: 'Dates' },
  { icon: 'star', key: 'priority', kind: 'boolean', label: 'Priority' },
];

const PAID_OVER_100: FilterGroup = {
  join: 'and',
  rules: [
    { field: 'status', filter: setFilter(['paid']) },
    {
      field: 'amount',
      filter: {
        kind: 'number',
        join: 'and',
        conditions: [{ operator: 'greaterThan', value: 100 }],
      },
    },
  ],
};

const APPLIED: FilterGroup = {
  join: 'and',
  rules: [
    { field: 'status', filter: setFilter(['paid', 'refunded']) },
    {
      field: 'amount',
      filter: {
        kind: 'number',
        join: 'and',
        conditions: [{ operator: 'greaterThan', value: 100 }],
      },
    },
    {
      field: 'created',
      filter: {
        kind: 'date',
        join: 'and',
        conditions: [{ operator: 'between', value: '2026-09-01', end: '2026-09-14' }],
      },
    },
    { field: 'channel', filter: setFilter(['web', 'app']) },
  ],
};

const NESTED: FilterGroup = {
  join: 'and',
  rules: [
    { field: 'status', filter: setFilter(['paid']) },
    {
      join: 'or',
      rules: [
        {
          field: 'amount',
          filter: {
            kind: 'number',
            join: 'and',
            conditions: [{ operator: 'greaterThan', value: 1000 }],
          },
        },
        {
          field: 'priority',
          filter: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },
        },
      ],
    },
  ],
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_FILTER_BAR_DOCS.filterBar.scenes, {
    playground: Playground,
    listing: Listing,
    pinned: Pinned,
    chips: Chips,
    builder: Builder,
    groups: Groups,
    manual: Manual,
    required: Required,
    presets: Presets,
    query: Query,
    url: Url,
    count: Count,
    narrow: Narrow,
    sticky: Sticky,
    states: States,
    content: Content,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/FilterBar',
  component: FilterBar,
  args: { fields: FIELDS },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FilterBar',
        description:
          'A bar over a listing that edits a condition tree — search, pinned pills, applied chips, AND/OR builder, presets, count, and the state in a URL — on top of the @slotted/core/filter engine.',
        framework: 'React',
        ...REACT_FILTER_BAR_DOCS.filterBar,
        tokens: REACT_FILTER_BAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The bar with the builder's drawer opened inside the theme root the workbench
 * draws under. An application carries `data-slotted-theme` on the document,
 * so the shared portal root is inside it; a reference page carries it on the
 * preview, and a drawer portalled to the body would fall outside the theme.
 */
function ThemedFilterBar({ ref, ...props }: FilterBarProps) {
  const [container, setContainer] = useState<Element | null>(null);
  const attach = useCallback(
    (handle: FilterBarHandle | null) => {
      setContainer(handle?.root?.closest('[data-slotted-theme]') ?? null);
      if (typeof ref === 'function') ref(handle);
      else if (ref) ref.current = handle;
    },
    [ref],
  );
  return <FilterBar {...props} container={props.container ?? container} ref={attach} />;
}

const read = (row: Order, field: string) => row[field as keyof Order];
const money = new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' });

/** The bar, the rows it keeps, and the count — the three things every scene shares. */
function useKept(initial: FilterGroup | null, initialQuery = '') {
  const [filter, setFilterValue] = useState<FilterGroup | null>(initial);
  const [query, setQuery] = useState(initialQuery);
  const kept = useMemo(() => {
    const keep = createFilterGroupPredicate(filter, read);
    const find = createSearchPredicate(query, read, ['customer', 'id']);
    return ORDERS.filter((row) => keep(row) && find(row));
  }, [filter, query]);
  return { filter, kept, query, setFilter: setFilterValue, setQuery };
}

function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <Table columns={5} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Order</TableColumnHeader>
            <TableColumnHeader>Customer</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader>Channel</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id} value={order.id}>
              <TableRowHeader>{order.id}</TableRowHeader>
              <TableCell>{order.customer}</TableCell>
              <TableCell>
                <Badge
                  tone={
                    order.status === 'paid'
                      ? 'success'
                      : order.status === 'cancelled'
                        ? 'danger'
                        : 'secondary'
                  }
                >
                  {STATUSES.find((entry) => entry.value === order.status)?.label}
                </Badge>
              </TableCell>
              <TableCell>
                {CHANNELS.find((entry) => entry.value === order.channel)?.label}
              </TableCell>
              <TableCell numeric>{money.format(order.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

function Orders(
  props: Partial<FilterBarProps> & { initial?: FilterGroup | null; withTable?: boolean },
) {
  const { initial = PAID_OVER_100, withTable = false, ...rest } = props;
  const { filter, kept, query, setFilter: set, setQuery } = useKept(initial);
  return (
    <>
      <ThemedFilterBar
        count={kept.length}
        fields={FIELDS}
        onQueryChange={setQuery}
        onValueChange={set}
        query={query}
        total={ORDERS.length}
        value={filter}
        {...rest}
      />
      {withTable ? <OrdersTable rows={kept} /> : null}
    </>
  );
}

export const Playground: Story = {
  args: { apply: 'live', chipLimit: 6, disabled: false, loading: false, size: 'md', sticky: false },
  argTypes: {
    apply: { control: 'radio', options: ['live', 'manual'] },
    chipLimit: { control: 'number' },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Orders {...args} fields={FIELDS} initial={APPLIED} withTable />
    </div>
  ),
};

export const Listing: Story = {
  parameters: scenario('listing'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The bar and the table over the same rows"
        note="The tree is applied by the consumer; the table shrinks and the count says 3 of 8. Open the Status pill and change the values."
      >
        <Orders withTable />
      </Scene>
    </Grid>
  ),
};

export const Pinned: Story = {
  parameters: scenario('pinned'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="pinned: Status with a condition, Customer empty"
        note="Status, pinned and with a condition, is a chip in its place; Customer, pinned and empty, is a dashed pill — press it and it becomes a chip, with the value open. Amount, not pinned, is a chip after the pinned ones."
      >
        <Orders />
      </Scene>
    </Grid>
  ),
};

export const Chips: Story = {
  parameters: scenario('chips'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="chipLimit={2} with four conditions applied"
        note="Each chip in segments: the operator opens a menu, the value a popover with only the operand, the X removes. Two chips in view and the others behind +2 more; a field the application does not declare becomes invalid and removable. Add filter creates a dashed chip until it has a value."
      >
        <Orders
          chipLimit={2}
          initial={{
            ...APPLIED,
            rules: [...APPLIED.rules, { field: 'region', filter: setFilter(['south']) }],
          }}
        />
      </Scene>
    </Grid>
  ),
};

function BuilderDemo({ container }: { container: Element }) {
  const bar = useRef<FilterBarHandle | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Orders
        container={container}
        defaultOpen={false}
        onOpenChange={setOpen}
        open={open}
        ref={bar}
        withTable
      />
      <div className="slotted-demo-row">
        <Button onClick={() => bar.current?.open()} variant="outline">
          Open the builder through the handle
        </Button>
      </div>
    </>
  );
}

export const Builder: Story = {
  parameters: scenario('builder'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The builder"
        note="Filters (n), below 36rem, a group chip and the handle open the whole tree in the drawer: one row per rule, the nested group in a box. In an application the drawer covers the page; here, the dashed box."
      >
        <Layer>{(container) => <BuilderDemo container={container} />}</Layer>
      </Scene>
    </Grid>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Status paid and (Amount > 1000 or Priority)"
        note="The nested group is a chip with the phrase in parentheses; open it and the builder shows the second level in a box with the Any join, inside the dashed box."
      >
        <Layer>{(container) => <Orders container={container} initial={NESTED} withTable />}</Layer>
      </Scene>
    </Grid>
  ),
};

export const Manual: Story = {
  parameters: scenario('manual'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='apply="manual"'
        note="Remove a chip or type in the search: the root becomes dirty and the table does not change until Apply. Reset discards."
      >
        <Orders apply="manual" initial={APPLIED} withTable />
      </Scene>
    </Grid>
  ),
};

const COMPANY: FilterBarField = {
  defaultValue: setFilter(['acme']),
  key: 'company',
  kind: 'set',
  label: 'Company',
  options: [
    { label: 'Acme', value: 'acme' },
    { label: 'Solaris', value: 'solaris' },
  ],
  required: true,
};

export const Required: Story = {
  parameters: scenario('required'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Company is required, with default Acme"
        note="Clear all returns Company to Acme and erases the rest; open the pill and Clear is off. In manual, an empty Company refuses Apply."
      >
        <Orders
          apply="manual"
          fields={[COMPANY, ...FIELDS]}
          initial={{
            join: 'and',
            rules: [{ field: 'company', filter: setFilter(['acme']) }, ...PAID_OVER_100.rules],
          }}
        />
      </Scene>
    </Grid>
  ),
};

function PresetsDemo() {
  const [preset, setPreset] = useState<string | null>('paid');
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <>
      <Orders
        onPresetChange={setPreset}
        onPresetSave={(value) => setSaved(JSON.stringify(value))}
        preset={preset}
        presets={[
          { key: 'paid', label: 'Paid over R$ 100', value: PAID_OVER_100 },
          { key: 'urgent', label: 'Urgent this month', value: NESTED },
        ]}
        initial={PAID_OVER_100}
      />
      {saved ? <p>Request to save: {saved}</p> : null}
    </>
  );
}

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two saved views"
        note="Choose Urgent this month and the tree swaps; remove a chip and the root becomes dirty with the view still chosen. Save as view… in the builder hands the tree to the application."
      >
        <PresetsDemo />
      </Scene>
    </Grid>
  ),
};

export const Query: Story = {
  parameters: scenario('query'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='queryDelay={120} · shortcut="/"'
        note="Type ana: the table responds 120ms after the last key. Escape clears. Press / outside a field and focus comes to the search."
      >
        <Orders initial={null} queryDelay={120} shortcut="/" withTable />
      </Scene>
    </Grid>
  ),
};

function UrlDemo() {
  const { filter, kept, query, setFilter: set, setQuery } = useKept(PAID_OVER_100, 'ana');
  const params = toFilterBarParams({ filter, query }).toString();
  const restored = fromFilterBarParams(params);
  return (
    <>
      <ThemedFilterBar
        count={kept.length}
        fields={FIELDS}
        onQueryChange={setQuery}
        onValueChange={set}
        query={query}
        total={ORDERS.length}
        value={filter}
      />
      <CodeBlock code={`?${params}`} copy={false} defaultWrap language="text" />
      <p>
        Lido de volta: {restored.filter ? `${restored.filter.rules.length} regras` : 'sem filtro'},
        query "{restored.query}"
      </p>
    </>
  );
}

export const Url: Story = {
  parameters: scenario('url'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The query string under the bar"
        note="Each edit rewrites ?f=and(…)&q=; the line below is what fromFilterBarParams reads back."
      >
        <UrlDemo />
      </Scene>
    </Grid>
  ),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="128 de 3.412"
        note="The figures follow the language in force — pt-BR separates thousands with a period. The part is aria-live: a change in the filter is heard as its effect."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <ThemedFilterBar count={128} fields={FIELDS} total={3412} value={PAID_OVER_100} />
        </SlottedProvider>
      </Scene>
      <Scene
        label="loading"
        note="The count gives way to the spinner and aria-busy; the controls stay, Apply turns off."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <ThemedFilterBar count={128} fields={FIELDS} loading total={3412} value={PAID_OVER_100} />
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The bar on a phone"
        note="In a 375px room the bar is a sliding row: Filters (n), the chips — each with the field, the value with the operator's words and the X — and the empty pills. The chip cut at the edge says the row continues; tapping a value opens the builder with that rule's card open."
      >
        <div className="slotted-demo-room" data-room="phone">
          <div className="slotted-demo-viewport" data-scroll data-size="tall">
            <Orders initial={APPLIED} withTable />
          </div>
        </div>
      </Scene>
      <Scene
        label="The builder on a phone"
        note="Below 30rem the builder lists cards: each rule's phrase and the X; tapping the phrase opens the card and stacks field, operator and value at full width, one at a time. A nested group is a rail on the edge, not a box."
      >
        <div className="slotted-demo-room" data-room="phone">
          <Layer size="screen">
            {(container) => <Orders container={container} defaultOpen initial={NESTED} />}
          </Layer>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sticky over a long list"
        note="Scroll inside the stage: the bar sticks to the top of the scroller and the table passes underneath it."
      >
        <div className="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
          <>
            <Orders initial={null} sticky />
            <OrdersTable rows={[...ORDERS, ...ORDERS, ...ORDERS]} />
          </>
        </div>
      </Scene>
    </Grid>
  ),
};

const COMPANY_EMPTY: FilterGroup = {
  join: 'and',
  rules: [
    {
      field: 'company',
      filter: { kind: 'set', join: 'and', conditions: [{ operator: 'anyOf', value: [] }] },
    },
  ],
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene label="disabled" note="All controls off; the width holds.">
        <ThemedFilterBar count={128} disabled fields={FIELDS} total={3412} value={PAID_OVER_100} />
      </Scene>
      <Scene label="loading" note="The controls stay; the count is a spinner.">
        <ThemedFilterBar count={128} fields={FIELDS} loading total={3412} value={PAID_OVER_100} />
      </Scene>
      <Scene
        label="readOnly"
        note="Each condition reachable by the arrows and readable; none changes. No X, add, clear or empty pills; the segments carry aria-disabled and the toolbar says Read only."
      >
        <ThemedFilterBar count={128} fields={FIELDS} readOnly total={3412} value={PAID_OVER_100} />
      </Scene>
      <Scene
        label="Required without a value"
        note="Company, required, is a dashed chip without an X while it has no value; press Apply and it refuses, carries data-invalid and the danger edge, and the refusal is announced."
      >
        <ThemedFilterBar
          apply="manual"
          fields={[{ ...COMPANY, defaultValue: undefined }, ...FIELDS]}
          value={COMPANY_EMPTY}
        />
      </Scene>
    </Grid>
  ),
};

const CITIES: FilterBarField = {
  key: 'city',
  kind: 'set',
  label: 'المدينة',
  options: [
    { label: 'الرياض', value: 'riyadh' },
    { label: 'جدة', value: 'jeddah' },
  ],
};

const TAGS: FilterBarField = {
  key: 'tags',
  kind: 'set',
  label: 'Tags',
  options: Array.from({ length: 11 }, (_, index) => ({
    label: `tag-${index + 1}`,
    value: `tag-${index + 1}`,
  })),
};

const LONG_AND_UNKNOWN: FilterGroup = {
  join: 'and',
  rules: [
    {
      field: 'tags',
      filter: setFilter(Array.from({ length: 11 }, (_, index) => `tag-${index + 1}`)),
    },
    { field: 'region', filter: setFilter(['south']) },
  ],
};

const ARABIC: FilterGroup = {
  join: 'and',
  rules: [
    { field: 'city', filter: setFilter(['riyadh']) },
    {
      field: 'created',
      filter: {
        kind: 'date',
        join: 'and',
        conditions: [{ operator: 'after', value: '2026-09-01' }],
      },
    },
  ],
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A phrase of eleven values, and an unknown field"
        note="The Tags chip writes two values and +9, and carries the whole list in the title and in the name; the region chip, a field the application does not declare, becomes invalid and removable."
      >
        <ThemedFilterBar fields={[...FIELDS, TAGS]} value={LONG_AND_UNKNOWN} />
      </Scene>
      <Scene
        label="dir=rtl"
        note="The Arabic label sits beside the ISO date without reordering it: name and phrase are two isolated runs."
      >
        <div dir="rtl">
          <ThemedFilterBar
            fields={[CITIES, { key: 'created', kind: 'date', label: 'تاريخ الإنشاء' }]}
            value={ARABIC}
          />
        </div>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Tab three times, arrows, Delete"
        note="Tab: search, toolbar, chips. Arrows between the pills; Enter opens; on chips, Delete removes and focus moves to the next."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <Orders initial={APPLIED} messages={{ search: 'Search orders' }}>
            <Select items={[{ label: 'Most recent', value: 'recent' }]} size="md" value="recent">
              <SelectTrigger aria-label="Sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
              </SelectContent>
            </Select>
          </Orders>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};
