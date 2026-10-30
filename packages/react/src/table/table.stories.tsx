import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { createFilterPredicate, createRowPredicate, setFilter } from '@slotted/core/filter';
import type {
  DateFilter,
  DateTimeFilter,
  FilterDescriptor,
  NumberFilter,
  SetFilter,
  TimeFilter,
} from '@slotted/core/filter';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';

import { Avatar } from '../avatar';
import { IconButton } from '../button';
import { DateRangePickerPreset } from '../date-range-picker';
import { DateTimeRangePickerPreset } from '../datetime-range-picker';
import { Link } from '../link';
import { NumberField } from '../number-field';
import { ProgressBar } from '../progress-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { StatusIndicator } from '../status-indicator';
import { Switch } from '../switch';
import { TextField } from '../text-field';
import { TimeRangePickerPreset } from '../time-range-picker';
import { Pagination, PaginationItems, PaginationNext, PaginationPrevious } from '../pagination';
import { ResultState, ResultStateContent, ResultStateTitle } from '../result-state';
import { Tag } from '../tag';
import { VisuallyHidden } from '../visually-hidden';
import { Table } from './table';
import {
  TableBooleanFilter,
  TableDateFilter,
  TableDateTimeFilter,
  TableNumberFilter,
  TableSetFilter,
  TableTextFilter,
  TableTimeFilter,
} from './table-filter';
import { TableContent } from './table-content';
import { TableDefaultsProvider } from './table-defaults';
import {
  TableBody,
  TableCaption,
  TableCell,
  TableColumnActions,
  TableColumnHeader,
  TableDetail,
  TableEmpty,
  TableExpander,
  TableFooter,
  TableHead,
  TableLoader,
  TableRow,
  TableRowHeader,
  TableSelect,
  TableSelectAll,
  TableSort,
  TableSummary,
} from './table-parts';
import type {
  TableFilterOption,
  TableFilterRequest,
  TableSetFilterProps,
  TableSortDescriptor,
} from './table.types';
import { REACT_TABLE_DOCS, REACT_TABLE_TOKENS } from './table.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TABLE_DOCS.table.scenes, {
    playground: Playground,
    variant: Variant,
    striped: Striped,
    sorting: Sorting,
    'column-controls': ColumnControls,
    filter: Filter,
    'filter-types': FilterTypes,
    'filter-conditions': FilterConditions,
    'filter-time': FilterTime,
    'filter-datetime': FilterDateTime,
    'filter-range': FilterRange,
    'filter-tags': FilterTags,
    editing: Editing,
    selection: Selection,
    expansion: Expansion,
    sticky: Sticky,
    listing: Listing,
    scroll: Scroll,
    alignment: Alignment,
    text: Text,
    footer: Footer,
    'empty-and-loading': EmptyAndLoading,
    density: Density,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Table',
        description:
          'The platform tabular structure, with sorting, selection, expansion and a place for a paging control. The listing screen of a dense application.',
        framework: 'React',
        ...REACT_TABLE_DOCS.table,
        tokens: REACT_TABLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Invoice {
  amount: number;
  client: string;
  /** What the reader sees. */
  due: string;
  /** What the sort answers, because '11 Sep' orders alphabetically and a date does not. */
  dueAt: string;
  id: string;
  issued: string;
  owner: string;
  paid: number;
  region: 'EU' | 'US' | 'APAC';
  seats: number;
  service: 'operational' | 'degraded' | 'down';
  status: 'Paid' | 'Overdue' | 'Draft';
}

const INVOICES: Invoice[] = [
  {
    amount: 1240,
    client: 'Northwind Trading',
    due: '11 Sep',
    dueAt: '2026-09-11',
    id: 'INV-1042',
    issued: '12 Aug',
    owner: 'Alina Marchetti',
    paid: 100,
    region: 'EU',
    seats: 24,
    service: 'operational',
    status: 'Paid',
  },
  {
    amount: 18.5,
    client: 'Cascade Logistics',
    due: '18 Sep',
    dueAt: '2026-09-18',
    id: 'INV-1043',
    issued: '19 Aug',
    owner: 'Paul Okonkwo',
    paid: 0,
    region: 'US',
    seats: 3,
    service: 'degraded',
    status: 'Overdue',
  },
  {
    amount: 9802.75,
    client: 'Bright Harbor Media',
    due: '27 Sep',
    dueAt: '2026-09-27',
    id: 'INV-1044',
    issued: '28 Aug',
    owner: 'Luiza Ferreira',
    paid: 45,
    region: 'APAC',
    seats: 180,
    service: 'operational',
    status: 'Draft',
  },
  {
    amount: 430,
    client: 'Halcyon Press',
    due: '3 Oct',
    dueAt: '2026-10-03',
    id: 'INV-1045',
    issued: '3 Sep',
    owner: 'Sora Nakamura',
    paid: 100,
    region: 'EU',
    seats: 12,
    service: 'operational',
    status: 'Paid',
  },
  {
    amount: 2015.4,
    client: 'Orchard Foods',
    due: '6 Oct',
    dueAt: '2026-10-06',
    id: 'INV-1046',
    issued: '6 Sep',
    owner: 'Marie Dubois',
    paid: 60,
    region: 'EU',
    seats: 46,
    service: 'down',
    status: 'Overdue',
  },
  {
    amount: 77.9,
    client: 'Lantern Health',
    due: '9 Oct',
    dueAt: '2026-10-09',
    id: 'INV-1047',
    issued: '9 Sep',
    owner: 'Ravi Chandra',
    paid: 100,
    region: 'APAC',
    seats: 8,
    service: 'operational',
    status: 'Paid',
  },
  {
    amount: 15400,
    client: 'Vireo Industrial',
    due: '12 Oct',
    dueAt: '2026-10-12',
    id: 'INV-1048',
    issued: '12 Sep',
    owner: 'Ines Almeida',
    paid: 20,
    region: 'US',
    seats: 640,
    service: 'degraded',
    status: 'Draft',
  },
  {
    amount: 320.15,
    client: 'Pallas Analytics',
    due: '15 Oct',
    dueAt: '2026-10-15',
    id: 'INV-1049',
    issued: '15 Sep',
    owner: 'Tomas Novak',
    paid: 100,
    region: 'EU',
    seats: 19,
    service: 'operational',
    status: 'Paid',
  },
  {
    amount: 6410,
    client: 'Meridian Freight',
    due: '18 Oct',
    dueAt: '2026-10-18',
    id: 'INV-1050',
    issued: '18 Sep',
    owner: 'Grace Mensah',
    paid: 0,
    region: 'US',
    seats: 205,
    service: 'operational',
    status: 'Overdue',
  },
  {
    amount: 89.99,
    client: 'Blue Ridge Studio',
    due: '21 Oct',
    dueAt: '2026-10-21',
    id: 'INV-1051',
    issued: '21 Sep',
    owner: 'Jonas Weber',
    paid: 100,
    region: 'EU',
    seats: 4,
    service: 'operational',
    status: 'Paid',
  },
  {
    amount: 1180.5,
    client: 'Cobalt Robotics',
    due: '24 Oct',
    dueAt: '2026-10-24',
    id: 'INV-1052',
    issued: '24 Sep',
    owner: 'Yuki Tanaka',
    paid: 75,
    region: 'APAC',
    seats: 58,
    service: 'degraded',
    status: 'Draft',
  },
  {
    amount: 44300,
    client: 'Sable Energy Group',
    due: '27 Oct',
    dueAt: '2026-10-27',
    id: 'INV-1053',
    issued: '27 Sep',
    owner: 'Hannah Olsen',
    paid: 30,
    region: 'US',
    seats: 1240,
    service: 'operational',
    status: 'Overdue',
  },
];

const MONEY = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2 });

const TONE = { Draft: 'secondary', Overdue: 'danger', Paid: 'success' } as const;

const SERVICE = { degraded: 'warning', down: 'danger', operational: 'success' } as const;

function Ellipsis() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

/**
 * Every stage here is `block`: the table fills the box it is given, and a stage
 * that shrink-wrapped it would report a width no consumer imposes.
 */
function Scene({
  children,
  label,
  note,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout="block">
        {children}
      </div>
    </section>
  );
}

/**
 * The descriptor applied to your own array, which is the whole of client
 * sorting. The date column orders by the value behind it rather than the one on
 * screen, because `11 Sep` sorts alphabetically and a date does not.
 */
const SORT_KEY: Record<string, keyof Invoice> = { due: 'dueAt' };

function sortRows(rows: readonly Invoice[], sort: TableSortDescriptor | null): readonly Invoice[] {
  if (sort === null) return rows;
  const direction = sort.direction === 'ascending' ? 1 : -1;
  const key = SORT_KEY[sort.column] ?? (sort.column as keyof Invoice);
  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
    return String(a).localeCompare(String(b)) * direction;
  });
}

function Invoices({
  rows = INVOICES,
  ...props
}: React.ComponentProps<typeof Table> & { rows?: readonly Invoice[] }) {
  return (
    <Table columns={4} {...props}>
      <TableContent>
        <TableCaption>Invoices issued this quarter</TableCaption>
        <TableHead>
          <TableRow>
            <TableColumnHeader>Invoice</TableColumnHeader>
            <TableColumnHeader>Client</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader>{invoice.id}</TableRowHeader>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const Playground: Story = {
  args: { layout: 'auto', striped: false, variant: 'ruled' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Invoices {...args} />
    </div>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='variant="plain"'
        note="No frame and no rules: the form that belongs inside a card, where the card already draws the box and a second edge would be two boxes."
      >
        <Invoices variant="plain" rows={INVOICES.slice(0, 2)} />
      </Scene>
      <Scene
        label='variant="ruled"'
        note="The default. A hairline between records and none around the set, so a table in a page of prose reads as a table rather than as a panel."
      >
        <Invoices variant="ruled" rows={INVOICES.slice(0, 2)} />
      </Scene>
      <Scene
        label='variant="framed"'
        note="The set is one object: a border, a radius that clips the corners, and the footer bar inside it. This is the listing screen form."
      >
        <Invoices variant="framed" rows={INVOICES.slice(0, 2)} />
      </Scene>
    </div>
  ),
};

export const Striped: Story = {
  parameters: scenario('striped'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="striped"
        note="Mixed from the ink at five per cent, one step under the header band, so the stripe carries the eye across a wide row without becoming a second header."
      >
        <Invoices striped variant="framed" />
      </Scene>
      <Scene
        label="striped, with a record chosen"
        note="Every state is painted over the stripe rather than under it: the second record is striped and chosen, and it reads as chosen."
      >
        <Invoices defaultValue={['INV-1043']} selectionMode="multiple" striped variant="framed">
          {null}
        </Invoices>
      </Scene>
    </div>
  ),
};

function SortingDemo() {
  const [sort, setSort] = useState<TableSortDescriptor | null>({
    column: 'client',
    direction: 'ascending',
  });
  const rows = useMemo(() => sortRows(INVOICES, sort), [sort]);

  return (
    <Table columns={3} onSortChange={setSort} sort={sort} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader column="id">
              <TableSort>Invoice</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="client">
              <TableSort>Client</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="amount" numeric>
              <TableSort>Amount</TableSort>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader>{invoice.id}</TableRowHeader>
              <TableCell>{invoice.client}</TableCell>
              <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const Sorting: Story = {
  parameters: scenario('sorting'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Three presses, three answers"
        note="Ascending, then descending, then none — the third state a reader who sorted by accident needs. The mark is drawn on the sorted column and revealed on the others under the pointer or under focus."
      >
        <SortingDemo />
      </Scene>
    </div>
  ),
};

/**
 * The trigger, the surface it opens and the rules it applies are three
 * different owners. This family holds the place; `popover` holds the layer, its
 * dismissal and its focus; and the rules are the consumer's own state — which
 * is what makes the demonstration a demonstration rather than a dead button.
 */
/** The values the status column can be filtered to, and how many carry each. */
const STATUSES: readonly TableFilterOption[] = [
  { count: INVOICES.filter((invoice) => invoice.status === 'Paid').length, value: 'Paid' },
  { count: INVOICES.filter((invoice) => invoice.status === 'Overdue').length, value: 'Overdue' },
  { count: INVOICES.filter((invoice) => invoice.status === 'Draft').length, value: 'Draft' },
];

/** Every client on the page, so the filter has enough values to earn a search. */
const CLIENTS: readonly TableFilterOption[] = INVOICES.map((invoice) => ({
  value: invoice.client,
}));

function ColumnControlsDemo() {
  const [status, setStatus] = useState<SetFilter | null>(null);
  const [client, setClient] = useState<SetFilter | null>(null);
  const rows = useMemo(() => {
    const keep = createRowPredicate<Invoice>(
      { client, status },
      (invoice, column) => invoice[column as 'client' | 'status'],
    );
    return INVOICES.filter(keep);
  }, [client, status]);

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader column="id">
              <TableSort>Invoice</TableSort>
            </TableColumnHeader>
            <TableColumnHeader>
              Client
              <TableColumnActions>
                <TableSetFilter
                  columnLabel="client"
                  onValueChange={setClient}
                  options={CLIENTS}
                  value={client}
                />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader>
              Status
              <TableColumnActions>
                <TableSetFilter
                  columnLabel="status"
                  onValueChange={setStatus}
                  options={STATUSES}
                  value={status}
                />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(0, 4).map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
              <TableCell text="nowrap">{invoice.client}</TableCell>
              <TableCell>
                <Tag tone={TONE[invoice.status]}>{invoice.status}</Tag>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const ColumnControls: Story = {
  parameters: scenario('column-controls'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A column that sorts, and a column that filters"
        note="Two filters and a sort. Both panels edit a draft: tick four values and one query runs, on Apply — Escape and a press outside put back the set you opened with. Twelve clients bring a search with them and three statuses do not, and the checkbox at the top covers exactly what the search left. The counts are the consumer's own fact about their query."
      >
        <ColumnControlsDemo />
      </Scene>
    </div>
  ),
};

/**
 * One table per panel, so each scene is one thing to look at. The set filter is
 * the only kind whose operand is a list, and it is the kind a listing reaches
 * for first.
 */
function SetFilterDemo({
  heading,
  options,
  value,
  onValueChange,
  ...filterProps
}: Omit<TableSetFilterProps, 'value' | 'onValueChange'> & {
  heading: string;
  onValueChange?: (value: SetFilter | null, request: TableFilterRequest) => void;
  value?: SetFilter | null;
}) {
  const [own, setOwn] = useState<SetFilter | null>(value ?? null);
  const keep = useMemo(() => createFilterPredicate(own), [own]);
  const kept = INVOICES.filter((invoice) =>
    keep(heading === 'Client' ? invoice.client : invoice.status),
  );

  const filter = (
    <TableSetFilter
      {...filterProps}
      onValueChange={(next, request) => {
        setOwn(next);
        onValueChange?.(next, request);
      }}
      options={options}
      value={own}
    />
  );

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
            {/* The filter stands in the header of the column it filters, which
                is the whole of what the slot is for: a panel over the client
                values above a Status column demonstrates the wrong thing. */}
            <TableColumnHeader text="nowrap">
              Client
              {heading === 'Client' ? <TableColumnActions>{filter}</TableColumnActions> : null}
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Status
              {heading === 'Status' ? <TableColumnActions>{filter}</TableColumnActions> : null}
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {kept.slice(0, 4).map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
              <TableCell text="nowrap">{invoice.client}</TableCell>
              <TableCell>
                <Tag tone={TONE[invoice.status]}>{invoice.status}</Tag>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const Filter: Story = {
  parameters: scenario('filter'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Three values, and no search"
        note="Press the funnel. A short list opens as a list: the chooser above it offers is any of and is none of, the checkbox over the rule covers the three under it, the counts are yours to supply, and Apply is the only thing that reaches your query — tick two and one query runs."
      >
        <SetFilterDemo columnLabel="status" heading="Status" options={STATUSES} />
      </Scene>
      <Scene
        label="Twelve values, and a search"
        note="Past searchThreshold — eight unless you say otherwise — the panel brings a field. It compares through the locale collator, so 'cafe' finds 'Café' and 'strasse' finds 'Straße', and the covering checkbox then answers for exactly what the search left rather than for the twelve behind it."
      >
        <SetFilterDemo columnLabel="client" heading="Client" options={CLIENTS} />
      </Scene>
      <Scene
        label="A column already filtered"
        note="The trigger marks itself and states what is applied in its own accessible name — 'Filter status: is any of Overdue' — so a filter a reader set and forgot is still readable. Clear empties it and closes; a reader who wants their set back opens the panel again, because Clear is a decision and not a slip."
      >
        <SetFilterDemo
          columnLabel="status"
          heading="Status"
          options={STATUSES}
          value={setFilter(['Overdue'])}
        />
      </Scene>
      <Scene
        label="A search you asked for, over three values"
        note="searchable states it outright, under the threshold or over it. Type something no value carries and the panel says so rather than showing an empty box — and the two actions stay, because Clear still empties a set the search cannot see."
      >
        <SetFilterDemo columnLabel="status" heading="Status" options={STATUSES} searchable />
      </Scene>
    </div>
  ),
};

/**
 * Four columns of four kinds, filtered by one predicate and no switch. The
 * boolean column is derived here rather than held in the data, because what a
 * listing filters on is often a fact about the row rather than a field of it.
 */
const TYPED_ROWS = INVOICES.map((invoice) => ({
  ...invoice,
  overdue: invoice.status === 'Overdue',
}));

function TypedFilterDemo() {
  const [filters, setFilters] = useState<Record<string, FilterDescriptor | null>>({});
  const set = (column: string) => (value: FilterDescriptor | null) =>
    setFilters((held) => ({ ...held, [column]: value }));

  const rows = useMemo(() => {
    const keep = createRowPredicate<(typeof TYPED_ROWS)[number]>(
      filters,
      (invoice, column) => invoice[column as keyof (typeof TYPED_ROWS)[number]],
    );
    return TYPED_ROWS.filter(keep);
  }, [filters]);

  return (
    <Table columns={4} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">
              Client
              <TableColumnActions>
                <TableTextFilter columnLabel="client" onValueChange={set('client')} />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Amount
              <TableColumnActions>
                <TableNumberFilter columnLabel="amount" onValueChange={set('amount')} />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Due
              <TableColumnActions>
                <TableDateFilter columnLabel="due" onValueChange={set('dueAt')} />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Overdue
              <TableColumnActions>
                <TableBooleanFilter columnLabel="overdue" onValueChange={set('overdue')} />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results" title="No invoices match this filter" />
            </TableEmpty>
          ) : (
            rows.slice(0, 5).map((invoice) => (
              <TableRow key={invoice.id} value={invoice.id}>
                <TableRowHeader text="nowrap">{invoice.client}</TableRowHeader>
                <TableCell numeric>{invoice.amount.toFixed(2)}</TableCell>
                <TableCell text="nowrap">{invoice.due}</TableCell>
                <TableCell>{invoice.overdue ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterTypes: Story = {
  parameters: scenario('filter-types'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Text, number, date and boolean, filtered together"
        note="Each column takes the component its type names, and each one is typed as itself: a TableTextFilter value is a TextFilter, never a union to unwrap. createRowPredicate joins the four into one call, so the screen filters four kinds without writing a switch of its own."
      >
        <TypedFilterDemo />
      </Scene>
    </div>
  ),
};

/** The two operators that change the panel's shape, and the join. */
function ConditionsDemo() {
  const [amount, setAmount] = useState<NumberFilter | null>({
    conditions: [{ end: 2500, operator: 'between', value: 100 }, { operator: 'empty' }],
    join: 'or',
    kind: 'number',
  });
  const keep = useMemo(() => createFilterPredicate(amount), [amount]);
  const rows = INVOICES.filter((invoice) => keep(invoice.amount));

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Amount
              <TableColumnActions>
                <TableNumberFilter columnLabel="amount" onValueChange={setAmount} value={amount} />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.slice(0, 4).map((invoice) => (
            <TableRow key={invoice.id} value={invoice.id}>
              <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
              <TableCell text="nowrap">{invoice.client}</TableCell>
              <TableCell numeric>{invoice.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterConditions: Story = {
  parameters: scenario('filter-conditions'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Between, is empty, and the join between two conditions"
        note="Between takes two operands and is empty takes none, so the panel grows a field or loses both — and announces the change, because a form that changes shape under a reader who cannot see it says nothing otherwise. The second condition appears once the first is complete; And and Or are the same two words the range reads between its ends."
      >
        <ConditionsDemo />
      </Scene>
      <Scene
        label="One condition only"
        note="conditions={1} is AG Grid's maxNumConditions, and it removes the join and the reveal together. Past two conditions a rule set needs an expression tree and an editor for it, which is Filter Bar in wave 8."
      >
        <SetFilterDemo columnLabel="status" heading="Status" options={STATUSES} />
      </Scene>
    </div>
  ),
};

/**
 * The dispatch desk: every invoice has a pickup cut-off and a scheduled slot,
 * which is what a time column and a date-time column are for. Four of the
 * cut-offs fall in the night, so the overnight window has rows to keep.
 */
const CUTOFFS = ['08:00', '12:30', '17:45', '22:00', '23:30', '01:15', '06:00', '15:00'];
const DELIVERIES = INVOICES.map((invoice, index) => ({
  ...invoice,
  cutoff: CUTOFFS[index % CUTOFFS.length] as string,
  scheduledAt: `${invoice.dueAt}T${CUTOFFS[(index + 2) % CUTOFFS.length] as string}`,
}));
const SLOT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** The range pickers' presets: the desk's own shifts and windows, in its own words. */
const MORNING_SHIFT = { end: plainTime(14), start: plainTime(6) };
const AFTERNOON_SHIFT = { end: plainTime(22), start: plainTime(14) };
const EARLY_OCTOBER = {
  end: plainDateTime(plainDate(2026, 10, 15), plainTime(18)),
  start: plainDateTime(plainDate(2026, 10, 1), plainTime(8)),
};

function TimeFilterDemo() {
  const [cutoff, setCutoff] = useState<TimeFilter | null>({
    conditions: [{ end: '02:00', operator: 'between', value: '22:00' }],
    join: 'and',
    kind: 'time',
  });
  const keep = useMemo(() => createFilterPredicate(cutoff), [cutoff]);
  const rows = DELIVERIES.filter((delivery) => keep(delivery.cutoff));

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Cut-off
              <TableColumnActions>
                <TableTimeFilter
                  columnLabel="cut-off"
                  hourCycle={24}
                  onValueChange={setCutoff}
                  presets={
                    <>
                      <TimeRangePickerPreset value={MORNING_SHIFT}>Morning</TimeRangePickerPreset>
                      <TimeRangePickerPreset value={AFTERNOON_SHIFT}>
                        Afternoon
                      </TimeRangePickerPreset>
                    </>
                  }
                  value={cutoff}
                />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results" title="No pickups in this window" />
            </TableEmpty>
          ) : (
            rows.map((delivery) => (
              <TableRow key={delivery.id} value={delivery.id}>
                <TableRowHeader text="nowrap">{delivery.id}</TableRowHeader>
                <TableCell text="nowrap">{delivery.client}</TableCell>
                <TableCell text="nowrap">{delivery.cutoff}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterTime: Story = {
  parameters: scenario('filter-time'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A time column, filtered to the overnight window"
        note="The operand is the time picker, and between is one time range picker with the desk's shifts as presets; the descriptor holds the ISO text either writes at the column's granularity — 22:00, not a PlainTime. A between whose start is later than its end wraps at midnight: 22:00 to 02:00 keeps 23:30 and 01:15 and drops 08:00. The range picker marks that pair as out of order until its wrap capability lands; the filter applies it as the window. Compared at the operand's own precision, so is 09:00 matches every second of that minute."
      >
        <TimeFilterDemo />
      </Scene>
    </div>
  ),
};

function DateTimeFilterDemo() {
  const [scheduled, setScheduled] = useState<DateTimeFilter | null>({
    conditions: [{ end: '2026-10-15T18:00', operator: 'between', value: '2026-10-01T08:00' }],
    join: 'and',
    kind: 'datetime',
  });
  const keep = useMemo(() => createFilterPredicate(scheduled), [scheduled]);
  const rows = DELIVERIES.filter((delivery) => keep(delivery.scheduledAt));

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Scheduled
              <TableColumnActions>
                <TableDateTimeFilter
                  columnLabel="scheduled"
                  hourCycle={24}
                  onValueChange={setScheduled}
                  presets={
                    <DateTimeRangePickerPreset value={EARLY_OCTOBER}>
                      Early October
                    </DateTimeRangePickerPreset>
                  }
                  value={scheduled}
                />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results" title="Nothing scheduled after that" />
            </TableEmpty>
          ) : (
            rows.map((delivery) => (
              <TableRow key={delivery.id} value={delivery.id}>
                <TableRowHeader text="nowrap">{delivery.id}</TableRowHeader>
                <TableCell text="nowrap">{delivery.client}</TableCell>
                <TableCell text="nowrap">{SLOT.format(new Date(delivery.scheduledAt))}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterDateTime: Story = {
  parameters: scenario('filter-datetime'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A date-time column, filtered to the first half of October"
        note="The operand is the date-time picker — seven segments and two surfaces — and between is one date-time range picker: a month beside two lists, the run's length said while it is drawn, and the desk's own fortnight as a preset. The descriptor holds 2026-10-01T08:00 as text either way. A condition whose operand has one half missing is inactive until both halves exist, so Apply reports nothing for a date without a time."
      >
        <DateTimeFilterDemo />
      </Scene>
    </div>
  ),
};

/** The range picker's presets: the application's own periods, in its own words. */
const SEPTEMBER = { end: plainDate(2026, 9, 30), start: plainDate(2026, 9, 1) };
const FOURTH_QUARTER = { end: plainDate(2026, 12, 31), start: plainDate(2026, 10, 1) };

function RangeFilterDemo() {
  const [due, setDue] = useState<DateFilter | null>({
    conditions: [{ end: '2026-09-30', operator: 'between', value: '2026-09-01' }],
    join: 'and',
    kind: 'date',
  });
  const keep = useMemo(() => createFilterPredicate(due), [due]);
  const rows = INVOICES.filter((invoice) => keep(invoice.dueAt));

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Due
              <TableColumnActions>
                <TableDateFilter
                  columnLabel="due"
                  onValueChange={setDue}
                  presets={
                    <>
                      <DateRangePickerPreset value={SEPTEMBER}>September</DateRangePickerPreset>
                      <DateRangePickerPreset value={FOURTH_QUARTER}>Q4</DateRangePickerPreset>
                    </>
                  }
                  value={due}
                />
              </TableColumnActions>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results" title="Nothing due in this period" />
            </TableEmpty>
          ) : (
            rows.map((invoice) => (
              <TableRow key={invoice.id} value={invoice.id}>
                <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
                <TableCell text="nowrap">{invoice.client}</TableCell>
                <TableCell text="nowrap">{invoice.due}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterRange: Story = {
  parameters: scenario('filter-range'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Between two dates, drawn as one range picker"
        note="Where two date pickers stood, one date-range-picker: it says the run's length while it is drawn, takes the ends in either order, and carries the application's presets — September and Q4 here. The descriptor is unchanged: between, an ISO day and another, whichever control produced them."
      >
        <RangeFilterDemo />
      </Scene>
    </div>
  ),
};

function TagsFilterDemo({ constrained }: { constrained: boolean }) {
  const [chosen, setChosen] = useState<SetFilter | null>(
    constrained ? setFilter(['Northwind Trading', 'Bright Harbor Media']) : null,
  );
  const keep = useMemo(() => createFilterPredicate(chosen), [chosen]);
  const rows = INVOICES.filter((invoice) => keep(constrained ? invoice.client : invoice.id));

  return (
    <Table columns={3} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader text="nowrap">
              Invoice
              {constrained ? null : (
                <TableColumnActions>
                  <TableSetFilter columnLabel="invoice" onValueChange={setChosen} operand="tags" />
                </TableColumnActions>
              )}
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Client
              {constrained ? (
                <TableColumnActions>
                  <TableSetFilter
                    columnLabel="client"
                    onValueChange={setChosen}
                    operand="tags"
                    options={CLIENTS}
                    value={chosen}
                  />
                </TableColumnActions>
              ) : null}
            </TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Amount
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results" title="No invoices match" />
            </TableEmpty>
          ) : (
            rows.map((invoice) => (
              <TableRow key={invoice.id} value={invoice.id}>
                <TableRowHeader text="nowrap">{invoice.id}</TableRowHeader>
                <TableCell text="nowrap">{invoice.client}</TableCell>
                <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const FilterTags: Story = {
  parameters: scenario('filter-tags'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A set typed as chips, held to the column's values"
        note='operand="tags" draws tags-input where the checkbox list stood: for a list too long to tick. With options, the values are a native datalist of suggestions and a typed value outside them is refused and announced; the chips hold the same list the checkboxes held, so a saved view is read by either. Enter with text adds a chip; Enter on the empty field applies.'
      >
        <TagsFilterDemo constrained />
      </Scene>
      <Scene
        label="Without options, any value is admitted"
        note="A column of identifiers is often a list the page does not hold in full — an invoice number, an SKU, an e-mail. Without options the field takes whatever is typed or pasted, split on commas and line breaks, and the query decides what matches."
      >
        <TagsFilterDemo constrained={false} />
      </Scene>
    </div>
  ),
};

function SelectionDemo() {
  const [chosen, setChosen] = useState<readonly string[]>(['INV-1043']);

  return (
    <Table
      columns={4}
      onValueChange={setChosen}
      selectionMode="multiple"
      value={chosen}
      variant="framed"
    >
      <TableContent>
        <TableHead>
          <TableRow>
            <TableSelectAll />
            <TableColumnHeader>Invoice</TableColumnHeader>
            <TableColumnHeader>Client</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {INVOICES.map((invoice) => (
            <TableRow disabled={invoice.status === 'Draft'} key={invoice.id} value={invoice.id}>
              <TableSelect />
              <TableRowHeader>{invoice.id}</TableRowHeader>
              <TableCell>{invoice.client}</TableCell>
              <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
      <TableFooter>
        <span>{chosen.length} chosen</span>
      </TableFooter>
    </Table>
  );
}

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Shift takes the span between"
        note="Press one checkbox, then hold Shift and press another: everything between the two joins the set. The draft record is disabled, so it stays out of the set the header covers."
      >
        <SelectionDemo />
      </Scene>
    </div>
  ),
};

function ExpansionDemo() {
  return (
    <Table columns={4} defaultExpanded={['INV-1043']} variant="framed">
      <TableContent>
        <TableHead>
          <TableRow>
            <TableColumnHeader />
            <TableColumnHeader>Invoice</TableColumnHeader>
            <TableColumnHeader>Client</TableColumnHeader>
            <TableColumnHeader numeric>Amount</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {INVOICES.slice(0, 3).map((invoice) => (
            <>
              <TableRow key={invoice.id} value={invoice.id}>
                <TableCell>
                  <TableExpander />
                </TableCell>
                <TableRowHeader>{invoice.id}</TableRowHeader>
                <TableCell>{invoice.client}</TableCell>
                <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
              </TableRow>
              <TableDetail key={`${invoice.id}-detail`} value={invoice.id}>
                Issued {invoice.issued} by {invoice.owner}. Two reminders sent.
              </TableDetail>
            </>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A record with more to say"
        note="The expander sits in a gutter of its own, so every identifier stands in one column whether or not its record has a detail. A closed detail is not in the DOM at all."
      >
        <ExpansionDemo />
      </Scene>
    </div>
  ),
};

function Wide({ children, ...props }: React.ComponentProps<typeof Table>) {
  return (
    <Table columns={5} variant="framed" {...props}>
      <TableContent scrollProps={{ className: 'slotted-demo-bound' }}>
        <TableHead>
          <TableRow>
            <TableColumnHeader sticky="start" text="nowrap">
              Invoice
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader text="nowrap">Owner</TableColumnHeader>
            <TableColumnHeader text="nowrap">Issued</TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Amount
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...INVOICES, ...INVOICES].map((invoice, index) => (
            <TableRow key={`${invoice.id}-${index}`} value={`${invoice.id}-${index}`}>
              <TableRowHeader sticky="start" text="nowrap">
                {invoice.id}
              </TableRowHeader>
              <TableCell text="nowrap">{invoice.client}</TableCell>
              <TableCell text="nowrap">{invoice.owner}</TableCell>
              <TableCell text="nowrap">{invoice.issued}</TableCell>
              <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
      {children}
    </Table>
  );
}

/** Forty-eight records, so a bounded box always has far more table than room. */
const LONG = Array.from({ length: 4 }, () => INVOICES).flat();

function Ledger({
  stickyFooter,
  stickyTo,
}: {
  stickyFooter?: boolean;
  stickyTo?: 'scroll' | 'page';
}) {
  const total = LONG.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <Table
      columns={5}
      stickyHeader
      variant="framed"
      {...(stickyFooter ? { stickyFooter } : {})}
      {...(stickyTo ? { stickyTo } : {})}
    >
      <TableContent
        {...(stickyTo === 'page' ? {} : { scrollProps: { className: 'slotted-demo-bound' } })}
      >
        <TableHead>
          <TableRow>
            <TableColumnHeader sticky="start" text="nowrap">
              Invoice
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">Client</TableColumnHeader>
            <TableColumnHeader text="nowrap">Owner</TableColumnHeader>
            <TableColumnHeader text="nowrap">Due</TableColumnHeader>
            <TableColumnHeader numeric text="nowrap">
              Amount
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {LONG.map((invoice, index) => (
            <TableRow key={`${invoice.id}-${index}`} value={`${invoice.id}-${index}`}>
              <TableRowHeader sticky="start" text="nowrap">
                {invoice.id}
              </TableRowHeader>
              <TableCell text="nowrap">{invoice.client}</TableCell>
              <TableCell text="nowrap">{invoice.owner}</TableCell>
              <TableCell text="nowrap">{invoice.due}</TableCell>
              <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableSummary>
          <TableRow>
            <TableCell colSpan={4} sticky="start" text="nowrap">
              {LONG.length} invoices
            </TableCell>
            <TableCell numeric>{MONEY.format(total)}</TableCell>
          </TableRow>
        </TableSummary>
      </TableContent>
    </Table>
  );
}

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='stickyTo="scroll" — a panel with a height of its own'
        note="Scroll inside the box: the header stays against the table's own scroller, which is what keeps it right in a drawer, a dialog or a split pane. The pinned first column darkens its edge while something is hidden under it, and the summary here scrolls away with the rows."
      >
        <Ledger />
      </Scene>
      <Scene
        label="stickyFooter — the total stays where the header does"
        note="The same box with both ends held: the tfoot is pinned to the bottom the way the thead is pinned to the top, so the number the reader came for is on screen at row one and at row forty-eight. It pins the summary and not the footer bar, which never scrolls in the first place."
      >
        <Ledger stickyFooter />
      </Scene>
      <Scene
        label='stickyTo="page" — the header stays while the page moves'
        note="A page, not a stage: scroll the dashed box and the heading and the paragraphs above the table leave while the header stays. The table owns no scroller here, so it sticks to what scrolls outside it. Where it stops is --slotted-table-sticky-offset: nought against a bare page, and here the shell sets it to the height of its own bar, so the header stops under the bar rather than behind it."
      >
        <div className="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
          <div className="slotted-demo-page">
            <div className="slotted-demo-page__bar">
              <span>Acme Billing</span>
              <span>September</span>
            </div>
            <h3>Billing — September</h3>
            <p>
              Every invoice raised this month, newest first. Amounts are gross and the collection
              figures come from the payment provider rather than from the ledger, so a settled
              invoice can lag a day behind the bank.
            </p>
            <p>
              The finance team reconciles on the fifth working day. Anything still overdue after
              that goes to the escalation list, and the owner named on the row is the person who
              takes it.
            </p>
            <Ledger stickyTo="page" />
            <p>
              Rows are exported as CSV with the same columns and the same order. The export follows
              the filter, not the page: filtering to one region and exporting gives that region in
              full rather than the twelve rows on screen.
            </p>
            <p>
              Questions about a specific invoice go to the owner first, then to billing operations.
              Credit notes are raised against the original invoice and never by editing it.
            </p>
          </div>
        </div>
      </Scene>
    </div>
  ),
};

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A table wider than its box"
        note="Tab into the page: the scroller takes a stop of its own, named, and the arrow keys scroll it. Widen the window until the table fits and the stop disappears, because a table that fits needs none."
      >
        <Wide />
      </Scene>
    </div>
  ),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="align, and numeric"
        note="The first column stands at the start, the second in the middle, the third at the end, and the fourth is numeric: tabular figures, and the end edge inferred. Switch the toolbar to RTL and every one of them mirrors."
      >
        <Table columns={4} variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Client</TableColumnHeader>
                <TableColumnHeader align="center">Region</TableColumnHeader>
                <TableColumnHeader align="end">Issued</TableColumnHeader>
                <TableColumnHeader numeric>Amount</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.map((invoice) => (
                <TableRow key={invoice.id} value={invoice.id}>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell align="center">EU</TableCell>
                  <TableCell align="end">{invoice.issued}</TableCell>
                  <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};

export const Text: Story = {
  parameters: scenario('text'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label='text="wrap", "truncate" and "nowrap"'
        note="The hash breaks inside its column rather than setting the column width. The note ends in an ellipsis with every character still in the DOM. The timestamp is never broken, because a broken date is a wrong date."
      >
        <Table columns={3} layout="fixed" variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Commit</TableColumnHeader>
                <TableColumnHeader>Note</TableColumnHeader>
                <TableColumnHeader>Recorded</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow value="commit">
                <TableCell text="wrap">9f2c1ab84de07615c3b9a0d5e8471fca2b6d09e3</TableCell>
                <TableCell text="truncate">
                  Quarterly reconciliation for the Northwind Trading account, prepared by the
                  finance team and approved on the fourteenth.
                </TableCell>
                <TableCell text="nowrap">12 Aug 2026, 09:41</TableCell>
              </TableRow>
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A summary inside, a paginator under"
        note="The total sits in a tfoot beside the column it totals, and the paging control sits in a bar outside the table and inside the frame — where it does not scroll sideways with the columns."
      >
        <Table columns={3} variant="framed">
          <TableContent totalRowCount={128}>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Invoice</TableColumnHeader>
                <TableColumnHeader>Client</TableColumnHeader>
                <TableColumnHeader numeric>Amount</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.slice(0, 3).map((invoice, index) => (
                <TableRow key={invoice.id} rowIndex={index + 1} value={invoice.id}>
                  <TableRowHeader>{invoice.id}</TableRowHeader>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableSummary>
              <TableRow>
                <TableCell colSpan={2}>3 of 128 invoices</TableCell>
                <TableCell numeric>{MONEY.format(11061.25)}</TableCell>
              </TableRow>
            </TableSummary>
          </TableContent>
          <TableFooter>
            <span>Page 1 of 43</span>
            <Pagination count={128} defaultPage={1} pageSize={3}>
              <PaginationPrevious />
              <PaginationItems />
              <PaginationNext />
            </Pagination>
          </TableFooter>
        </Table>
      </Scene>
    </div>
  ),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A first load"
        note="Skeleton rows draw the table shape before its content, so the page does not jump when the rows arrive. Nothing here is announced: the rows are aria-hidden until they are real."
      >
        <Table columns={3} variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Invoice</TableColumnHeader>
                <TableColumnHeader>Client</TableColumnHeader>
                <TableColumnHeader numeric>Amount</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableLoader skeletonRows={3} />
          </TableContent>
        </Table>
      </Scene>
      <Scene
        label="A refresh over rows already read"
        note="aria-busy on the table and the body dimmed: every column keeps its width and the reader keeps their place. Swapping these rows for skeletons would take both."
      >
        <Invoices loading rows={INVOICES.slice(0, 2)} variant="framed" />
      </Scene>
      <Scene
        label="Nothing to show"
        note="The empty cell spans the table and takes a ResultState, which already tells an empty set from a set a filter emptied — so this family owns no word for either."
      >
        <Table columns={3} variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Invoice</TableColumnHeader>
                <TableColumnHeader>Client</TableColumnHeader>
                <TableColumnHeader numeric>Amount</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableEmpty>
                <ResultState status="no-results">
                  <ResultStateContent>
                    <ResultStateTitle>No invoices match this filter</ResultStateTitle>
                  </ResultStateContent>
                </ResultState>
              </TableEmpty>
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="comfortable, compact and dense"
        note="Each region states its own density. The row height, the cell inset and the type step all come from the control scale, so one theme decision moves the rows, the buttons and the fields together."
      >
        <div className="slotted-demo-stack">
          {(['comfortable', 'compact', 'dense'] as const).map((density) => (
            <div data-slotted-density={density} key={density}>
              <Invoices rows={INVOICES.slice(0, 2)} variant="framed" />
            </div>
          ))}
        </div>
      </Scene>
    </div>
  ),
};

/**
 * The stock take: every row is a count a reader corrects in place. A `plain`
 * control in a cell takes the cell's own inset and the row's own height, so
 * the corrected value stands where the read value stood and the row does not
 * grow when it is edited.
 */
const AISLES = ['Aisle 4', 'Aisle 7', 'Aisle 12'];
const STOCK = [
  { counted: 1200, description: 'Hex bolt M8', location: 'Aisle 4', sku: 'PRD-0412' },
  { counted: 3400, description: 'Flat washer M8', location: 'Aisle 4', sku: 'PRD-0413' },
  { counted: 0, description: '', location: 'Aisle 7', sku: 'PRD-0414' },
  { counted: 860, description: 'Spring washer M8', location: 'Aisle 7', sku: 'PRD-0415' },
];

function StockRow({ item }: { item: (typeof STOCK)[number] }) {
  const [description, setDescription] = useState(item.description);
  const [counted, setCounted] = useState<number | null>(item.counted);
  const [location, setLocation] = useState(item.location);

  return (
    <TableRow value={item.sku}>
      <TableRowHeader text="nowrap">{item.sku}</TableRowHeader>
      <TableCell>
        <TextField
          aria-label={`Description of ${item.sku}`}
          invalid={description === ''}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Required"
          size="sm"
          value={description}
          variant="plain"
        />
      </TableCell>
      <TableCell numeric>
        <NumberField
          aria-label={`Counted for ${item.sku}`}
          min={0}
          onValueChange={setCounted}
          size="sm"
          stepper="none"
          value={counted}
          variant="plain"
        />
      </TableCell>
      <TableCell>
        <Select
          onValueChange={(next) => setLocation(next as string)}
          size="sm"
          value={location}
          variant="plain"
        >
          <SelectTrigger aria-label={`Location of ${item.sku}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AISLES.map((aisle) => (
              <SelectItem key={aisle} value={aisle}>
                {aisle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A plain control in a cell"
        note="A text field, a number field and a select, each variant=&quot;plain&quot;, each standing in a body cell. The cell gives up its inset and the control takes it, so the edited value sits under the column's name where the read value sat; the control is the row's height, so a row being edited is as tall as the rows around it. The invalid edge stays, square."
      >
        <Table columns={4} variant="ruled">
          <TableContent>
            <TableCaption>Stock take</TableCaption>
            <TableHead>
              <TableRow>
                <TableColumnHeader text="nowrap">SKU</TableColumnHeader>
                <TableColumnHeader>Description</TableColumnHeader>
                <TableColumnHeader numeric>Counted</TableColumnHeader>
                <TableColumnHeader>Location</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {STOCK.map((item) => (
                <StockRow item={item} key={item.sku} />
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};

function EditableRow({ invoice }: { invoice: Invoice }) {
  const [seats, setSeats] = useState(invoice.seats);
  const [note, setNote] = useState('');
  const [active, setActive] = useState(invoice.status !== 'Draft');

  return (
    <TableRow value={invoice.id}>
      <TableRowHeader text="nowrap">
        <Link href={`#${invoice.id}`}>{invoice.id}</Link>
      </TableRowHeader>
      <TableCell text="nowrap">{invoice.client}</TableCell>
      <TableCell>
        <NumberField
          aria-label={`Seats on ${invoice.id}`}
          min={1}
          onValueChange={(value) => setSeats(value ?? 1)}
          size="sm"
          value={seats}
        />
      </TableCell>
      <TableCell>
        <TextField
          aria-label={`Note on ${invoice.id}`}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note"
          size="sm"
          value={note}
        />
      </TableCell>
      <TableCell align="center">
        <Switch
          aria-label={`Auto-renew ${invoice.id}`}
          checked={active}
          onCheckedChange={setActive}
          size="sm"
        />
      </TableCell>
      <TableCell numeric>{MONEY.format(invoice.amount * seats)}</TableCell>
    </TableRow>
  );
}

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A cell is a slot, not a string"
        note="A link and a tag on the identifier, an avatar beside the owner, a status indicator on the service, a bar for what has been collected, and an amount in tabular figures. Every one of them is another family standing in a cell this one lays out."
      >
        <Table columns={5} variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
                <TableColumnHeader text="nowrap">Owner</TableColumnHeader>
                <TableColumnHeader text="nowrap">Service</TableColumnHeader>
                <TableColumnHeader text="nowrap">Collected</TableColumnHeader>
                <TableColumnHeader numeric text="nowrap">
                  Amount
                </TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.slice(0, 6).map((invoice) => (
                <TableRow key={invoice.id} value={invoice.id}>
                  <TableRowHeader text="nowrap">
                    <Link href={`#${invoice.id}`}>{invoice.id}</Link>
                    <br />
                    <Tag size="sm" tone={TONE[invoice.status]}>
                      {invoice.status}
                    </Tag>
                  </TableRowHeader>
                  <TableCell text="nowrap">
                    <span className="slotted-demo-row">
                      <Avatar name={invoice.owner} size="sm" />
                      {invoice.owner}
                    </span>
                  </TableCell>
                  <TableCell text="nowrap">
                    <StatusIndicator status={SERVICE[invoice.service]}>
                      {invoice.region}
                    </StatusIndicator>
                  </TableCell>
                  <TableCell>
                    <ProgressBar
                      hideLabel
                      label={`Collected on ${invoice.id}`}
                      showValue
                      size="sm"
                      value={invoice.paid}
                    />
                  </TableCell>
                  <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
      <Scene
        label="Controls inside the cells"
        note="A row a reader edits in place: a number field for seats, a text field for a note, a switch for auto-renew, and a total that answers them. Each control is its own tab stop, which is what the table role means — and what a grid would take away."
      >
        <Table columns={6} variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader text="nowrap">Invoice</TableColumnHeader>
                <TableColumnHeader text="nowrap">Client</TableColumnHeader>
                <TableColumnHeader text="nowrap">Seats</TableColumnHeader>
                <TableColumnHeader text="nowrap">Note</TableColumnHeader>
                <TableColumnHeader align="center" text="nowrap">
                  Auto-renew
                </TableColumnHeader>
                <TableColumnHeader numeric text="nowrap">
                  Total
                </TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.slice(0, 4).map((invoice) => (
                <EditableRow invoice={invoice} key={invoice.id} />
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
      <Scene
        label="Content the table did not choose"
        note="A translated header twice as long as its English, a forty-character hash that breaks inside its column, and a note that truncates with every character still in the DOM. The three treatments are the family's answer to content it does not control."
      >
        <Table columns={3} layout="fixed" variant="framed">
          <TableContent>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Rechnungsnummer</TableColumnHeader>
                <TableColumnHeader>Prüfsumme</TableColumnHeader>
                <TableColumnHeader>Bemerkung</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow value="INV-1044">
                <TableRowHeader>INV-1044</TableRowHeader>
                <TableCell text="wrap">9f2c1ab84de07615c3b9a0d5e8471fca2b6d09e3</TableCell>
                <TableCell text="truncate">
                  Quarterly reconciliation for the Bright Harbor Media account, prepared by the
                  finance team and approved on the fourteenth.
                </TableCell>
              </TableRow>
              <TableRow value="INV-1053">
                <TableRowHeader>INV-1053</TableRowHeader>
                <TableCell text="wrap">Rechnungsprufungsausschusssitzung</TableCell>
                <TableCell text="nowrap">
                  One line, whatever it costs: the column widens and the table scrolls rather than
                  the words breaking.
                </TableCell>
              </TableRow>
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};

function ListingDemo() {
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const [sort, setSort] = useState<TableSortDescriptor | null>({
    column: 'due',
    direction: 'ascending',
  });
  const [status, setStatus] = useState<SetFilter | null>(null);

  const rows = useMemo(() => {
    const keep = createFilterPredicate(status);
    return sortRows(
      INVOICES.filter((invoice) => keep(invoice.status)),
      sort,
    );
  }, [sort, status]);

  return (
    <Table
      columns={10}
      onSortChange={setSort}
      onValueChange={setChosen}
      selectionMode="multiple"
      sort={sort}
      stickyFooter
      stickyHeader
      value={chosen}
      variant="framed"
    >
      <TableContent
        scrollProps={{ className: 'slotted-demo-bound slotted-demo-bound--tall' }}
        totalRowCount={412}
      >
        <TableHead>
          <TableRow>
            <TableSelectAll sticky="start" />
            <TableColumnHeader column="id" sticky="start" stickyOffset="3rem" text="nowrap">
              <TableSort>Invoice</TableSort>
            </TableColumnHeader>
            <TableColumnHeader column="client" text="nowrap">
              <TableSort>Client</TableSort>
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">
              Status
              <TableColumnActions>
                <TableSetFilter
                  columnLabel="status"
                  onValueChange={setStatus}
                  options={STATUSES}
                  value={status}
                />
              </TableColumnActions>
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">Owner</TableColumnHeader>
            <TableColumnHeader text="nowrap">Service</TableColumnHeader>
            <TableColumnHeader column="due" text="nowrap">
              <TableSort>Due</TableSort>
            </TableColumnHeader>
            <TableColumnHeader text="nowrap">Collected</TableColumnHeader>
            <TableColumnHeader column="amount" numeric text="nowrap">
              <TableSort>Amount</TableSort>
            </TableColumnHeader>
            <TableColumnHeader align="center" sticky="end">
              <VisuallyHidden>Actions</VisuallyHidden>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty>
              <ResultState status="no-results">
                <ResultStateContent>
                  <ResultStateTitle>No invoices match this filter</ResultStateTitle>
                </ResultStateContent>
              </ResultState>
            </TableEmpty>
          ) : (
            rows.map((invoice, index) => (
              <TableRow
                disabled={invoice.status === 'Draft'}
                key={invoice.id}
                rowIndex={index + 1}
                value={invoice.id}
              >
                <TableSelect sticky="start" />
                <TableRowHeader sticky="start" stickyOffset="3rem" text="nowrap">
                  <Link href={`#${invoice.id}`}>{invoice.id}</Link>
                </TableRowHeader>
                <TableCell text="nowrap">{invoice.client}</TableCell>
                <TableCell text="nowrap">
                  <Tag tone={TONE[invoice.status]}>{invoice.status}</Tag>
                </TableCell>
                <TableCell text="nowrap">
                  <span className="slotted-demo-row">
                    <Avatar name={invoice.owner} size="sm" />
                    {invoice.owner}
                  </span>
                </TableCell>
                <TableCell text="nowrap">
                  <StatusIndicator status={SERVICE[invoice.service]}>
                    {invoice.region}
                  </StatusIndicator>
                </TableCell>
                <TableCell text="nowrap">{invoice.due}</TableCell>
                <TableCell>
                  <ProgressBar
                    hideLabel
                    label={`Collected on ${invoice.id}`}
                    showValue
                    size="sm"
                    value={invoice.paid}
                  />
                </TableCell>
                <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
                <TableCell align="center" sticky="end">
                  <IconButton
                    aria-label={`Actions for ${invoice.id}`}
                    size="sm"
                    tone="secondary"
                    variant="ghost"
                  >
                    <Ellipsis />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableSummary>
          <TableRow>
            <TableCell colSpan={2} sticky="start" text="nowrap">
              This page
            </TableCell>
            <TableCell colSpan={6}>{rows.length} invoices</TableCell>
            <TableCell numeric>
              {MONEY.format(rows.reduce((total, invoice) => total + invoice.amount, 0))}
            </TableCell>
            <TableCell sticky="end" />
          </TableRow>
        </TableSummary>
      </TableContent>
      <TableFooter>
        <span>
          {chosen.length === 0
            ? `${rows.length} of 412 invoices`
            : `${chosen.length} chosen — export, send a reminder, or write one off`}
        </span>
        <Pagination count={412} defaultPage={1} pageSize={12}>
          <PaginationPrevious />
          <PaginationItems />
          <PaginationNext />
        </Pagination>
      </TableFooter>
    </Table>
  );
}

export const Listing: Story = {
  parameters: scenario('listing'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A billing screen, whole"
        note="Ten columns and twelve of four hundred and twelve records: sorting by due date, a status filter in the status header, the checkbox and the identifier pinned together at the start, actions pinned at the end, a total in the tfoot, and paging in the footer. Draft records cannot be chosen, so the header checkbox covers nine and says so."
      >
        <ListingDemo />
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="An application deciding once"
        note="The provider sets the frame and the words for everything below it. The second table states its own variant, and an explicit prop is never overridden by context."
      >
        <TableDefaultsProvider striped variant="framed">
          <div className="slotted-demo-stack">
            <Invoices rows={INVOICES.slice(0, 2)} />
            <Invoices rows={INVOICES.slice(0, 2)} variant="plain" />
          </div>
        </TableDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Tab, and nothing else to learn"
        note="A table is not a composite widget, so each control is its own stop: the scroller, then every sort button, checkbox and expander in DOM order. Hold Shift with Space on a checkbox to take the range."
      >
        <SelectionDemo />
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A page of a larger set"
        note="aria-rowcount says how large the whole set is and aria-rowindex says where each record sits in it, so row two of four is heard as row forty-two of a hundred and twenty-eight. Both are written only because this table states a total."
      >
        <Table columns={3} variant="framed">
          <TableContent totalRowCount={128}>
            <TableCaption>Invoices, page 11 of 32</TableCaption>
            <TableHead>
              <TableRow>
                <TableColumnHeader>Invoice</TableColumnHeader>
                <TableColumnHeader>Client</TableColumnHeader>
                <TableColumnHeader numeric>Amount</TableColumnHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {INVOICES.slice(0, 3).map((invoice, index) => (
                <TableRow key={invoice.id} rowIndex={41 + index} value={invoice.id}>
                  <TableRowHeader>{invoice.id}</TableRowHeader>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell numeric>{MONEY.format(invoice.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContent>
        </Table>
      </Scene>
    </div>
  ),
};
