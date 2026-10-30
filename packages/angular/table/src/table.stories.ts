import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import { createFilterPredicate, createRowPredicate, setFilter } from '@slotted/core/filter';
import type {
  BooleanFilter,
  DateFilter,
  DateTimeFilter,
  NumberFilter,
  SetFilter,
  TextFilter,
  TimeFilter,
} from '@slotted/core/filter';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlIconButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlDateRangePickerPreset } from '@slotted/angular/date-range-picker';
import { SlDateTimeRangePickerPreset } from '@slotted/angular/datetime-range-picker';
import { SlLink } from '@slotted/angular/link';
import { SlNumberField, SlNumberFieldInput } from '@slotted/angular/number-field';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import {
  SlPagination,
  SlPaginationItems,
  SlPaginationNext,
  SlPaginationPrevious,
} from '@slotted/angular/pagination';
import {
  SlPopover,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import { SlProgressBar } from '@slotted/angular/progress-indicator';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';
import { SlSwitch } from '@slotted/angular/switch';
import { SlTag, SlTagBody } from '@slotted/angular/tag';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlTimeRangePickerPreset } from '@slotted/angular/time-range-picker';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTable } from './table';
import type { TableSortDescriptor } from './table-defaults';
import { SlTableContent } from './table-content';
import {
  SlTableBooleanFilter,
  SlTableDateFilter,
  SlTableDateTimeFilter,
  SlTableNumberFilter,
  SlTableSetFilter,
  SlTableTextFilter,
  SlTableTimeFilter,
} from './table-filter';
import { SL_TABLE_PARTS } from './table-parts';
import { ANGULAR_TABLE_DOCS, ANGULAR_TABLE_TOKENS } from './table.docs';

interface TableStoryArgs {
  layout: 'auto' | 'fixed';
  striped: boolean;
  variant: 'plain' | 'ruled' | 'framed';
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TABLE_DOCS.table.scenes, {
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

const meta: Meta<TableStoryArgs> = {
  title: 'Components/Table',
  component: SlTable,
  decorators: [
    moduleMetadata({
      imports: [
        SlTable,
        SlTableContent,
        ...SL_TABLE_PARTS,
        SlDateRangePickerPreset,
        SlDateTimeRangePickerPreset,
        SlTimeRangePickerPreset,
        SlSelect,
        SlSelectItem,
        SlTableBooleanFilter,
        SlTableDateFilter,
        SlTableDateTimeFilter,
        SlTableNumberFilter,
        SlTableSetFilter,
        SlTableTextFilter,
        SlTableTimeFilter,
        SlLink,
        SlPagination,
        SlPaginationItems,
        SlPaginationNext,
        SlPaginationPrevious,
        SlResultState,
        SlResultStateContent,
        SlResultStateTitle,
        SlIconButton,
        SlTag,
        SlTagBody,
        SlAvatar,
        SlCheckbox,
        SlPopover,
        SlPopoverBody,
        SlPopoverContent,
        SlPopoverLayer,
        SlPopoverTrigger,
        SlProgressBar,
        SlStatusIndicator,
        SlSwitch,
        SlNumberField,
        SlNumberFieldInput,
        SlTextField,
        SlTextFieldInput,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Table',
        description:
          'The platform tabular structure, with sorting, selection, expansion and a place for a paging control. The listing screen of a dense application.',
        framework: 'Angular',
        ...ANGULAR_TABLE_DOCS.table,
        tokens: ANGULAR_TABLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TableStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples end up against each other
 * and no story reaches for an inline style.
 */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="block">${body}</div>
  </section>`;

const INVOICES = [
  {
    amount: '1,240.00',
    client: 'Northwind Trading',
    due: '11 Sep',
    dueAt: '2026-09-11',
    id: 'INV-1042',
    issued: '12 Aug',
    owner: 'Alina Marchetti',
    paid: 100,
    region: 'EU',
    seats: 24,
    service: 'success',
    status: 'Paid',
    tone: 'success',
  },
  {
    amount: '18.50',
    client: 'Cascade Logistics',
    due: '18 Sep',
    dueAt: '2026-09-18',
    id: 'INV-1043',
    issued: '19 Aug',
    owner: 'Paul Okonkwo',
    paid: 0,
    region: 'US',
    seats: 3,
    service: 'warning',
    status: 'Overdue',
    tone: 'danger',
  },
  {
    amount: '9,802.75',
    client: 'Bright Harbor Media',
    due: '27 Sep',
    dueAt: '2026-09-27',
    id: 'INV-1044',
    issued: '28 Aug',
    owner: 'Luiza Ferreira',
    paid: 45,
    region: 'APAC',
    seats: 180,
    service: 'success',
    status: 'Draft',
    tone: 'secondary',
  },
  {
    amount: '430.00',
    client: 'Halcyon Press',
    due: '3 Oct',
    dueAt: '2026-10-03',
    id: 'INV-1045',
    issued: '3 Sep',
    owner: 'Sora Nakamura',
    paid: 100,
    region: 'EU',
    seats: 12,
    service: 'success',
    status: 'Paid',
    tone: 'success',
  },
  {
    amount: '2,015.40',
    client: 'Orchard Foods',
    due: '6 Oct',
    dueAt: '2026-10-06',
    id: 'INV-1046',
    issued: '6 Sep',
    owner: 'Marie Dubois',
    paid: 60,
    region: 'EU',
    seats: 46,
    service: 'danger',
    status: 'Overdue',
    tone: 'danger',
  },
  {
    amount: '77.90',
    client: 'Lantern Health',
    due: '9 Oct',
    dueAt: '2026-10-09',
    id: 'INV-1047',
    issued: '9 Sep',
    owner: 'Ravi Chandra',
    paid: 100,
    region: 'APAC',
    seats: 8,
    service: 'success',
    status: 'Paid',
    tone: 'success',
  },
  {
    amount: '15,400.00',
    client: 'Vireo Industrial',
    due: '12 Oct',
    dueAt: '2026-10-12',
    id: 'INV-1048',
    issued: '12 Sep',
    owner: 'Ines Almeida',
    paid: 20,
    region: 'US',
    seats: 640,
    service: 'warning',
    status: 'Draft',
    tone: 'secondary',
  },
  {
    amount: '320.15',
    client: 'Pallas Analytics',
    due: '15 Oct',
    dueAt: '2026-10-15',
    id: 'INV-1049',
    issued: '15 Sep',
    owner: 'Tomas Novak',
    paid: 100,
    region: 'EU',
    seats: 19,
    service: 'success',
    status: 'Paid',
    tone: 'success',
  },
  {
    amount: '6,410.00',
    client: 'Meridian Freight',
    due: '18 Oct',
    dueAt: '2026-10-18',
    id: 'INV-1050',
    issued: '18 Sep',
    owner: 'Grace Mensah',
    paid: 0,
    region: 'US',
    seats: 205,
    service: 'success',
    status: 'Overdue',
    tone: 'danger',
  },
  {
    amount: '89.99',
    client: 'Blue Ridge Studio',
    due: '21 Oct',
    dueAt: '2026-10-21',
    id: 'INV-1051',
    issued: '21 Sep',
    owner: 'Jonas Weber',
    paid: 100,
    region: 'EU',
    seats: 4,
    service: 'success',
    status: 'Paid',
    tone: 'success',
  },
  {
    amount: '1,180.50',
    client: 'Cobalt Robotics',
    due: '24 Oct',
    dueAt: '2026-10-24',
    id: 'INV-1052',
    issued: '24 Sep',
    owner: 'Yuki Tanaka',
    paid: 75,
    region: 'APAC',
    seats: 58,
    service: 'warning',
    status: 'Draft',
    tone: 'secondary',
  },
  {
    amount: '44,300.00',
    client: 'Sable Energy Group',
    due: '27 Oct',
    dueAt: '2026-10-27',
    id: 'INV-1053',
    issued: '27 Sep',
    owner: 'Hannah Olsen',
    paid: 30,
    region: 'US',
    seats: 1240,
    service: 'success',
    status: 'Overdue',
    tone: 'danger',
  },
];

const HEAD = `
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Invoice</th>
          <th slTableColumnHeader>Client</th>
          <th slTableColumnHeader>Status</th>
          <th slTableColumnHeader numeric>Amount</th>
        </tr>
      </thead>`;

const BODY = `
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader>{{ invoice.id }}</th>
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell>{{ invoice.status }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>`;

const table = (attributes: string, inner = HEAD + BODY) => `
  <div slTable [columns]="4" ${attributes}>
    <div slTableContent>${inner}</div>
  </div>`;

/**
 * The family's own filter: a trigger in the column-actions slot and the panel
 * behind it. The panel edits a draft and nothing reaches the story until Apply,
 * which is why the rows below only change once.
 */
const FILTER = (column: string, options: string, value: string) => `
  <span slTableColumnActions>
    <span slTableSetFilter columnLabel="${column}" [options]="${options}" [(value)]="${value}"></span>
  </span>`;

interface Invoice {
  amount: string;
  client: string;
  due: string;
  dueAt: string;
  id: string;
  issued: string;
  owner: string;
  paid: number;
  region: string;
  seats: number;
  service: string;
  status: string;
  tone: string;
}

/** The one formatter the demonstrations share, so a total reads like a total. */
const MONEY = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2 });

/** Three statuses and their counts, which are the story's own fact. */
const STATUSES = ['Paid', 'Overdue', 'Draft'].map((status) => ({
  count: INVOICES.filter((invoice) => invoice.status === status).length,
  value: status,
}));

/** Every client on the page, so the filter has enough values to earn a search. */
const CLIENTS = INVOICES.map((invoice) => ({ value: invoice.client }));

/**
 * The descriptor applied to your own array, which is the whole of client
 * sorting. The date column orders by the value behind it rather than the one on
 * screen, because '11 Sep' sorts alphabetically and a date does not.
 */
const SORT_KEY: Record<string, keyof Invoice> = { due: 'dueAt' };

function sortRows(rows: readonly Invoice[], sort: TableSortDescriptor | null) {
  if (sort === null) return rows;
  const direction = sort.direction === 'ascending' ? 1 : -1;
  const key = SORT_KEY[sort.column] ?? (sort.column as keyof Invoice);
  return [...rows].sort(
    (left, right) => String(left[key]).localeCompare(String(right[key])) * direction,
  );
}

/**
 * The filter's own state, kept beside the story rather than inside the family:
 * a table holds no filter, and what a header's trigger does to the rows is the
 * consumer's query.
 */
function filterProps(source: readonly Invoice[]) {
  return {
    clients: null as SetFilter | null,
    statuses: null as SetFilter | null,
    clientOptions: CLIENTS,
    statusOptions: STATUSES,
    sort: null as TableSortDescriptor | null,
    visible(this: {
      clients: SetFilter | null;
      statuses: SetFilter | null;
      sort: TableSortDescriptor | null;
    }) {
      /* One predicate over both columns, which is what the engine is for: the
         story writes no comparison and no switch of its own. */
      const keep = createRowPredicate<Invoice>(
        { client: this.clients, status: this.statuses },
        (row, column) => row[column as 'client' | 'status'],
      );
      return sortRows(source.filter(keep), this.sort);
    },
  };
}

export const Playground: Story = {
  args: { layout: 'auto', striped: false, variant: 'ruled' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, invoices: INVOICES },
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div slTable [columns]="4" [variant]="variant" [layout]="layout" [striped]="striped">
    <div slTableContent>
      <caption slTableCaption>Invoices issued this quarter</caption>${HEAD}${BODY}
    </div>
  </div>
</div>`,
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 2) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'variant="plain"',
    'No frame and no rules: the form that belongs inside a card, where the card already draws the box and a second edge would be two boxes.',
    table('variant="plain"'),
  )}
  ${scene(
    'variant="ruled"',
    'The default. A hairline between records and none around the set, so a table in a page of prose reads as a table rather than as a panel.',
    table('variant="ruled"'),
  )}
  ${scene(
    'variant="framed"',
    'The set is one object: a border, a radius that clips the corners, and the footer bar inside it. This is the listing screen form.',
    table('variant="framed"'),
  )}
</div>`,
  }),
};

export const Striped: Story = {
  parameters: scenario('striped'),
  render: () => ({
    props: { invoices: INVOICES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'striped',
    'Mixed from the ink at five per cent, one step under the header band, so the stripe carries the eye across a wide row without becoming a second header.',
    table('variant="framed" striped'),
  )}
  ${scene(
    'striped, with a record chosen',
    'Every state is painted over the stripe rather than under it: the second record is striped and chosen, and it reads as chosen.',
    table('variant="framed" striped selectionMode="multiple" [value]="[\'INV-1043\']"'),
  )}
</div>`,
  }),
};

export const Sorting: Story = {
  parameters: scenario('sorting'),
  render: () => ({
    props: { invoices: INVOICES, sort: { column: 'client', direction: 'ascending' } },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Three presses, three answers',
    'Ascending, then descending, then none — the third state a reader who sorted by accident needs. The mark is drawn on the sorted column and revealed on the others under the pointer or under focus.',
    `
  <div slTable [columns]="4" variant="framed" [(sort)]="sort">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader column="id"><button slTableSort>Invoice</button></th>
          <th slTableColumnHeader column="client"><button slTableSort>Client</button></th>
          <th slTableColumnHeader>Status</th>
          <th slTableColumnHeader column="amount" numeric><button slTableSort>Amount</button></th>
        </tr>
      </thead>${BODY}
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const ColumnControls: Story = {
  parameters: scenario('column-controls'),
  render: () => ({
    props: filterProps(INVOICES),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A column that sorts, and a column that filters',
    'Two filters and a sort. Both panels edit a draft: tick four values and one query runs, on Apply — Escape and a press outside put back the set you opened with. Twelve clients bring a search with them and three statuses do not, and the checkbox at the top covers exactly what the search left.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader column="id"><button slTableSort>Invoice</button></th>
          <th slTableColumnHeader column="client">
            <button slTableSort>Client</button>${FILTER('client', 'clientOptions', 'clients')}
          </th>
          <th slTableColumnHeader>Status${FILTER('status', 'statusOptions', 'statuses')}</th>
          <th slTableColumnHeader numeric>Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of visible(); track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader>{{ invoice.id }}</th>
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell><span slTag [tone]="invoice.tone"><span slTagBody>{{ invoice.status }}</span></span></td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No invoices match this filter</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

/**
 * One table per panel, so each scene is one thing to look at: the same
 * component with a short list, with a long one, already filtered, and with a
 * search that matches nothing. Each panel reads its own state, which is why the
 * scope is written into every binding.
 */
const FILTERED = (scope: string, column: string, options: string, extra = '') => {
  const filter = `
              <span slTableColumnActions>
                <span
                  slTableSetFilter
                  columnLabel="${column}"
                  ${extra}
                  [options]="${scope}.${options}"
                  [(value)]="${scope}.${column === 'status' ? 'statuses' : 'clients'}"
                ></span>
              </span>`;

  /* The filter stands in the header of the column it filters, which is the
     whole of what the slot is for: a panel over the client values above a
     Status column would be a demonstration of the wrong thing. */
  return `
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">
            Client${column === 'client' ? filter : ''}
          </th>
          <th slTableColumnHeader text="nowrap">
            Status${column === 'status' ? filter : ''}
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of ${scope}.visible().slice(0, 4); track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">{{ invoice.id }}</th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell>
              <span slTag [tone]="invoice.tone"><span slTagBody>{{ invoice.status }}</span></span>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;
};

export const Filter: Story = {
  parameters: scenario('filter'),
  render: () => ({
    props: {
      short: filterProps(INVOICES),
      long: filterProps(INVOICES),
      already: Object.assign(filterProps(INVOICES), { statuses: setFilter(['Overdue']) }),
      blank: filterProps(INVOICES),
    },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Three values, and no search',
    'Press the funnel. A short list opens as a list: the chooser above it offers is any of and is none of, the checkbox over the rule covers the three under it, the counts are yours to supply, and Apply is the only thing that reaches your query — tick two and one query runs.',
    FILTERED('short', 'status', 'statusOptions'),
  )}
  ${scene(
    'Twelve values, and a search',
    'Past searchThreshold — eight unless you say otherwise — the panel brings a field. It compares through the locale collator, so cafe finds Café and strasse finds Straße, and the covering checkbox then answers for exactly what the search left rather than for the twelve behind it.',
    FILTERED('long', 'client', 'clientOptions'),
  )}
  ${scene(
    'A column already filtered',
    'The trigger marks itself and states what is applied in its own accessible name — Filter status: is any of Overdue — so a filter a reader set and forgot is still readable. Clear empties it and closes; a reader who wants their set back opens the panel again, because Clear is a decision and not a slip.',
    FILTERED('already', 'status', 'statusOptions'),
  )}
  ${scene(
    'A search you asked for, over three values',
    'searchable states it outright, under the threshold or over it. Type something no value carries and the panel says so rather than showing an empty box — and the two actions stay, because Clear still empties a set the search cannot see.',
    FILTERED('blank', 'status', 'statusOptions', 'searchable'),
  )}
</div>`,
  }),
};

/** Four columns of four kinds, filtered by one predicate and no switch. */
const TYPED_ROWS = INVOICES.map((invoice) => ({
  ...invoice,
  overdue: invoice.status === 'Overdue',
  total: Number(invoice.amount.replace(/,/g, '')),
}));

function typedProps() {
  return {
    client: null as TextFilter | null,
    total: null as NumberFilter | null,
    dueAt: null as DateFilter | null,
    overdue: null as BooleanFilter | null,
    visible(this: {
      client: TextFilter | null;
      total: NumberFilter | null;
      dueAt: DateFilter | null;
      overdue: BooleanFilter | null;
    }) {
      const keep = createRowPredicate<(typeof TYPED_ROWS)[number]>(
        { client: this.client, dueAt: this.dueAt, overdue: this.overdue, total: this.total },
        (row, column) => row[column as keyof (typeof TYPED_ROWS)[number]],
      );
      return TYPED_ROWS.filter(keep).slice(0, 5);
    },
  };
}

const TYPED = `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">
            Client
            <span slTableColumnActions>
              <span slTableTextFilter columnLabel="client" [(value)]="client"></span>
            </span>
          </th>
          <th slTableColumnHeader numeric text="nowrap">
            Amount
            <span slTableColumnActions>
              <span slTableNumberFilter columnLabel="amount" [(value)]="total"></span>
            </span>
          </th>
          <th slTableColumnHeader text="nowrap">
            Due
            <span slTableColumnActions>
              <span slTableDateFilter columnLabel="due" [(value)]="dueAt"></span>
            </span>
          </th>
          <th slTableColumnHeader text="nowrap">
            Overdue
            <span slTableColumnActions>
              <span slTableBooleanFilter columnLabel="overdue" [(value)]="overdue"></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of visible(); track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">{{ invoice.client }}</th>
            <td slTableCell numeric>{{ invoice.amount }}</td>
            <td slTableCell text="nowrap">{{ invoice.due }}</td>
            <td slTableCell>{{ invoice.overdue ? 'Yes' : 'No' }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No invoices match this filter</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterTypes: Story = {
  parameters: scenario('filter-types'),
  render: () => ({
    props: typedProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Text, number, date and boolean, filtered together',
    'Each column takes the component its type names, and each one is typed as itself: a slTableTextFilter value is a TextFilter signal, never a union to unwrap. createRowPredicate joins the four into one call, so the screen filters four kinds without writing a switch of its own.',
    TYPED,
  )}
</div>`,
  }),
};

function conditionProps() {
  return {
    amount: {
      conditions: [{ end: 2500, operator: 'between', value: 100 }, { operator: 'empty' }],
      join: 'or',
      kind: 'number',
    } as NumberFilter,
    client: null as TextFilter | null,
    visible(this: { amount: NumberFilter | null }) {
      const keep = createFilterPredicate(this.amount);
      return TYPED_ROWS.filter((row) => keep(row.total)).slice(0, 4);
    },
  };
}

const CONDITIONS = `
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader numeric text="nowrap">
            Amount
            <span slTableColumnActions>
              <span slTableNumberFilter columnLabel="amount" [(value)]="amount"></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of visible(); track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">{{ invoice.id }}</th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

const ONE_CONDITION = `
  <div slTable [columns]="2" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">
            Client
            <span slTableColumnActions>
              <span slTableTextFilter columnLabel="client" [conditions]="1" [(value)]="client"></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices.slice(0, 3); track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">{{ invoice.id }}</th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterConditions: Story = {
  parameters: scenario('filter-conditions'),
  render: () => ({
    props: { ...conditionProps(), invoices: INVOICES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Between, is empty, and the join between two conditions',
    'Between takes two operands and is empty takes none, so the panel grows a field or loses both — and announces the change, because a form that changes shape under a reader who cannot see it says nothing otherwise. The second condition appears once the first is complete; And and Or are the same two words the range reads between its ends.',
    CONDITIONS,
  )}
  ${scene(
    'One condition only',
    'conditions of 1 is AG Grid maxNumConditions, and it removes the join and the reveal together. Past two conditions a rule set needs an expression tree and an editor for it, which is Filter Bar in wave 8.',
    ONE_CONDITION,
  )}
</div>`,
  }),
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

function timeProps() {
  return {
    cutoff: {
      conditions: [{ end: '02:00', operator: 'between', value: '22:00' }],
      join: 'and',
      kind: 'time',
    } as TimeFilter | null,
    /** The range picker's presets: the desk's own shifts, in its own words. */
    morning: { end: plainTime(14), start: plainTime(6) },
    afternoon: { end: plainTime(22), start: plainTime(14) },
    visible(this: { cutoff: TimeFilter | null }) {
      const keep = createFilterPredicate(this.cutoff);
      return DELIVERIES.filter((row) => keep(row.cutoff));
    },
  };
}

const TIME = `
  <ng-template #shifts>
    <button slTimeRangePickerPreset [range]="morning">Morning</button>
    <button slTimeRangePickerPreset [range]="afternoon">Afternoon</button>
  </ng-template>
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">
            Cut-off
            <span slTableColumnActions>
              <span
                slTableTimeFilter
                columnLabel="cut-off"
                [hourCycle]="24"
                [presets]="shifts"
                [(value)]="cutoff"
              ></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (row of visible(); track row.id) {
          <tr slTableRow [value]="row.id">
            <th slTableRowHeader text="nowrap">{{ row.id }}</th>
            <td slTableCell text="nowrap">{{ row.client }}</td>
            <td slTableCell text="nowrap">{{ row.cutoff }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No pickups in this window</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterTime: Story = {
  parameters: scenario('filter-time'),
  render: () => ({
    props: timeProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A time column, filtered to the overnight window',
    "The operand is the time picker, and between is one time range picker with the desk's shifts as presets; the descriptor holds the ISO text either writes at the column's granularity — 22:00, not a PlainTime. A between whose start is later than its end wraps at midnight: 22:00 to 02:00 keeps 23:30 and 01:15 and drops 08:00. The range picker marks that pair as out of order until its wrap capability lands; the filter applies it as the window. Compared at the operand's own precision, so is 09:00 matches every second of that minute.",
    TIME,
  )}
</div>`,
  }),
};

function dateTimeProps() {
  return {
    scheduled: {
      conditions: [{ end: '2026-10-15T18:00', operator: 'between', value: '2026-10-01T08:00' }],
      join: 'and',
      kind: 'datetime',
    } as DateTimeFilter | null,
    earlyOctober: {
      end: plainDateTime(plainDate(2026, 10, 15), plainTime(18)),
      start: plainDateTime(plainDate(2026, 10, 1), plainTime(8)),
    },
    slot: (value: string) => SLOT.format(new Date(value)),
    visible(this: { scheduled: DateTimeFilter | null }) {
      const keep = createFilterPredicate(this.scheduled);
      return DELIVERIES.filter((row) => keep(row.scheduledAt));
    },
  };
}

const DATE_TIME = `
  <ng-template #windows>
    <button slDateTimeRangePickerPreset [range]="earlyOctober">Early October</button>
  </ng-template>
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">
            Scheduled
            <span slTableColumnActions>
              <span
                slTableDateTimeFilter
                columnLabel="scheduled"
                [hourCycle]="24"
                [presets]="windows"
                [(value)]="scheduled"
              ></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (row of visible(); track row.id) {
          <tr slTableRow [value]="row.id">
            <th slTableRowHeader text="nowrap">{{ row.id }}</th>
            <td slTableCell text="nowrap">{{ row.client }}</td>
            <td slTableCell text="nowrap">{{ slot(row.scheduledAt) }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>Nothing scheduled after that</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterDateTime: Story = {
  parameters: scenario('filter-datetime'),
  render: () => ({
    props: dateTimeProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A date-time column, filtered to the first half of October',
    "The operand is the date-time picker — seven segments and two surfaces — and between is one date-time range picker: a month beside two lists, the run's length said while it is drawn, and the desk's own fortnight as a preset. The descriptor holds 2026-10-01T08:00 as text either way. A condition whose operand has one half missing is inactive until both halves exist, so Apply reports nothing for a date without a time.",
    DATE_TIME,
  )}
</div>`,
  }),
};

function rangeProps() {
  return {
    dueAt: {
      conditions: [{ end: '2026-09-30', operator: 'between', value: '2026-09-01' }],
      join: 'and',
      kind: 'date',
    } as DateFilter | null,
    /** The range picker's presets: the application's own periods, in its own words. */
    september: { end: plainDate(2026, 9, 30), start: plainDate(2026, 9, 1) },
    quarter: { end: plainDate(2026, 12, 31), start: plainDate(2026, 10, 1) },
    visible(this: { dueAt: DateFilter | null }) {
      const keep = createFilterPredicate(this.dueAt);
      return INVOICES.filter((row) => keep(row.dueAt));
    },
  };
}

const RANGE = `
  <ng-template #presets>
    <button slDateRangePickerPreset [range]="september">September</button>
    <button slDateRangePickerPreset [range]="quarter">Q4</button>
  </ng-template>
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">
            Due
            <span slTableColumnActions>
              <span slTableDateFilter columnLabel="due" [presets]="presets" [(value)]="dueAt"></span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (row of visible(); track row.id) {
          <tr slTableRow [value]="row.id">
            <th slTableRowHeader text="nowrap">{{ row.id }}</th>
            <td slTableCell text="nowrap">{{ row.client }}</td>
            <td slTableCell text="nowrap">{{ row.due }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>Nothing due in this period</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterRange: Story = {
  parameters: scenario('filter-range'),
  render: () => ({
    props: rangeProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Between two dates, drawn as one range picker',
    "Where two date pickers stood, one date-range-picker: it says the run's length while it is drawn, takes the ends in either order, and carries the application's presets — September and Q4 here, as a template of slDateRangePickerPreset buttons. The descriptor is unchanged: between, an ISO day and another, whichever control produced them.",
    RANGE,
  )}
</div>`,
  }),
};

function tagsProps() {
  return {
    client: setFilter(['Northwind Trading', 'Bright Harbor Media']) as SetFilter | null,
    clients: CLIENTS,
    invoice: null as SetFilter | null,
    byClient(this: { client: SetFilter | null }) {
      const keep = createFilterPredicate(this.client);
      return INVOICES.filter((row) => keep(row.client));
    },
    byInvoice(this: { invoice: SetFilter | null }) {
      const keep = createFilterPredicate(this.invoice);
      return INVOICES.filter((row) => keep(row.id));
    },
  };
}

const TAGS = `
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">
            Client
            <span slTableColumnActions>
              <span
                slTableSetFilter
                columnLabel="client"
                operand="tags"
                [options]="clients"
                [(value)]="client"
              ></span>
            </span>
          </th>
          <th slTableColumnHeader numeric text="nowrap">Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (row of byClient(); track row.id) {
          <tr slTableRow [value]="row.id">
            <th slTableRowHeader text="nowrap">{{ row.id }}</th>
            <td slTableCell text="nowrap">{{ row.client }}</td>
            <td slTableCell numeric>{{ row.amount }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No invoices match</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

const FREE_TAGS = `
  <div slTable [columns]="3" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">
            Invoice
            <span slTableColumnActions>
              <span slTableSetFilter columnLabel="invoice" operand="tags" [(value)]="invoice"></span>
            </span>
          </th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader numeric text="nowrap">Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (row of byInvoice(); track row.id) {
          <tr slTableRow [value]="row.id">
            <th slTableRowHeader text="nowrap">{{ row.id }}</th>
            <td slTableCell text="nowrap">{{ row.client }}</td>
            <td slTableCell numeric>{{ row.amount }}</td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No invoices match</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

export const FilterTags: Story = {
  parameters: scenario('filter-tags'),
  render: () => ({
    props: tagsProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    "A set typed as chips, held to the column's values",
    'operand of tags draws tags-input where the checkbox list stood: for a list too long to tick. With options, the values are a native datalist of suggestions and a typed value outside them is refused and announced; the chips hold the same list the checkboxes held, so a saved view is read by either. Enter with text adds a chip; Enter on the empty field applies.',
    TAGS,
  )}
  ${scene(
    'Without options, any value is admitted',
    'A column of identifiers is often a list the page does not hold in full — an invoice number, an SKU, an e-mail. Without options the field takes whatever is typed or pasted, split on commas and line breaks, and the query decides what matches.',
    FREE_TAGS,
  )}
</div>`,
  }),
};

const SELECTABLE = `
  <div slTable [columns]="5" variant="framed" selectionMode="multiple" [(value)]="chosen">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableSelectAll></th>
          <th slTableColumnHeader>Invoice</th>
          <th slTableColumnHeader>Client</th>
          <th slTableColumnHeader>Status</th>
          <th slTableColumnHeader numeric>Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id) {
          <tr slTableRow [value]="invoice.id" [disabled]="invoice.status === 'Draft'">
            <td slTableSelect></td>
            <th slTableRowHeader>{{ invoice.id }}</th>
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell>{{ invoice.status }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
    <div slTableFooter><span>{{ chosen.length }} chosen</span></div>
  </div>`;

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    props: { chosen: ['INV-1043'], invoices: INVOICES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Shift takes the span between',
    'Press one checkbox, then hold Shift and press another: everything between the two joins the set. The draft record is disabled, so it stays out of the set the header covers.',
    SELECTABLE,
  )}
</div>`,
  }),
};

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 3) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A record with more to say',
    'The expander sits in a gutter of its own, so every identifier stands in one column whether or not its record has a detail. Control flow in the template keeps a closed detail out of the DOM entirely.',
    `
  <div slTable [columns]="5" variant="framed" [expanded]="['INV-1043']">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader></th>
          <th slTableColumnHeader>Invoice</th>
          <th slTableColumnHeader>Client</th>
          <th slTableColumnHeader>Status</th>
          <th slTableColumnHeader numeric>Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id) {
          <tr slTableRow [value]="invoice.id" #row="slTableRow">
            <td slTableCell><button slTableExpander></button></td>
            <th slTableRowHeader>{{ invoice.id }}</th>
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell>{{ invoice.status }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
          @if (row.expanded()) {
            <tr slTableDetail [value]="invoice.id">
              Issued {{ invoice.issued }} by {{ invoice.owner }}. Two reminders sent.
            </tr>
          }
        }
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

const WIDE = `
  <div slTable [columns]="5" variant="framed" [stickyHeader]="sticky">
    <div slTableContent scrollLabel="Invoices, scrollable">
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader sticky="start" text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">Owner</th>
          <th slTableColumnHeader text="nowrap">Issued</th>
          <th slTableColumnHeader numeric text="nowrap">Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id + invoice.issued) {
          <tr slTableRow [value]="invoice.id + invoice.issued">
            <th slTableRowHeader sticky="start" text="nowrap">{{ invoice.id }}</th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell text="nowrap">{{ invoice.owner }}</td>
            <td slTableCell text="nowrap">{{ invoice.issued }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`;

const LEDGER = (options: { stickyFooter?: boolean; stickyTo?: 'page' } = {}) => `
  <div slTable [columns]="5" variant="framed" stickyHeader ${options.stickyFooter ? 'stickyFooter' : ''} ${options.stickyTo ? `stickyTo="${options.stickyTo}"` : ''}>
    <div slTableContent ${options.stickyTo === 'page' ? '' : 'class="slotted-demo-bound"'}>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader sticky="start" text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">Owner</th>
          <th slTableColumnHeader text="nowrap">Due</th>
          <th slTableColumnHeader numeric text="nowrap">Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of ledger; track $index) {
          <tr slTableRow [value]="invoice.id + $index">
            <th slTableRowHeader sticky="start" text="nowrap">{{ invoice.id }}</th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell text="nowrap">{{ invoice.owner }}</td>
            <td slTableCell text="nowrap">{{ invoice.due }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
      <tfoot slTableSummary>
        <tr slTableRow>
          <td slTableCell [colSpan]="4" sticky="start" text="nowrap">{{ ledger.length }} invoices</td>
          <td slTableCell numeric>{{ ledgerTotal }}</td>
        </tr>
      </tfoot>
    </div>
  </div>`;

/** Forty-eight records, so a bounded box always has far more table than room. */
const LEDGER_ROWS = [INVOICES, INVOICES, INVOICES, INVOICES].flat();

const LEDGER_TOTAL = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2 }).format(
  LEDGER_ROWS.reduce((sum, invoice) => sum + Number(invoice.amount.replace(/,/g, '')), 0),
);

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => ({
    props: { ledger: LEDGER_ROWS, ledgerTotal: LEDGER_TOTAL },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'stickyTo="scroll" — a panel with a height of its own',
    "Scroll inside the box: the header stays against the table's own scroller, which is what keeps it right in a drawer, a dialog or a split pane. The pinned first column darkens its edge while something is hidden under it, and the summary here scrolls away with the rows.",
    LEDGER(),
  )}
  ${scene(
    'stickyFooter — the total stays where the header does',
    'The same box with both ends held: the tfoot is pinned to the bottom the way the thead is pinned to the top, so the number the reader came for is on screen at row one and at row forty-eight. It pins the summary and not the footer bar, which never scrolls in the first place.',
    LEDGER({ stickyFooter: true }),
  )}
  ${scene(
    'stickyTo="page" — the header stays while the page moves',
    'A page, not a stage: scroll the dashed box and the heading and the paragraphs above the table leave while the header stays. The table owns no scroller here, so it sticks to what scrolls outside it. Where it stops is --slotted-table-sticky-offset: nought against a bare page, and here the shell sets it to the height of its own bar, so the header stops under the bar rather than behind it.',
    `
  <div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
    <div class="slotted-demo-page">
      <div class="slotted-demo-page__bar">
        <span>Acme Billing</span>
        <span>September</span>
      </div>
      <h3>Billing — September</h3>
      <p>
        Every invoice raised this month, newest first. Amounts are gross and the collection figures
        come from the payment provider rather than from the ledger, so a settled invoice can lag a
        day behind the bank.
      </p>
      <p>
        The finance team reconciles on the fifth working day. Anything still overdue after that
        goes to the escalation list, and the owner named on the row is the person who takes it.
      </p>
      ${LEDGER({ stickyTo: 'page' })}
      <p>
        Rows are exported as CSV with the same columns and the same order. The export follows the
        filter, not the page: filtering to one region and exporting gives that region in full
        rather than the twelve rows on screen.
      </p>
      <p>
        Questions about a specific invoice go to the owner first, then to billing operations.
        Credit notes are raised against the original invoice and never by editing it.
      </p>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Scroll: Story = {
  parameters: scenario('scroll'),
  render: () => ({
    props: { invoices: INVOICES, sticky: false },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A table wider than its box',
    'Tab into the page: the scroller takes a stop of its own, named, and the arrow keys scroll it. Widen the window until the table fits and the stop disappears, because a table that fits needs none.',
    WIDE,
  )}
</div>`,
  }),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => ({
    props: { invoices: INVOICES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'align, and numeric',
    'The first column stands at the start, the second in the middle, the third at the end, and the fourth is numeric: tabular figures, and the end edge inferred. Switch the toolbar to RTL and every one of them mirrors.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Client</th>
          <th slTableColumnHeader align="center">Region</th>
          <th slTableColumnHeader align="end">Issued</th>
          <th slTableColumnHeader numeric>Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell align="center">EU</td>
            <td slTableCell align="end">{{ invoice.issued }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Text: Story = {
  parameters: scenario('text'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'text="wrap", "truncate" and "nowrap"',
    'The hash breaks inside its column rather than setting the column width. The note ends in an ellipsis with every character still in the DOM. The timestamp is never broken, because a broken date is a wrong date.',
    `
  <div slTable [columns]="3" variant="framed" layout="fixed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Commit</th>
          <th slTableColumnHeader>Note</th>
          <th slTableColumnHeader>Recorded</th>
        </tr>
      </thead>
      <tbody slTableBody>
        <tr slTableRow value="commit">
          <td slTableCell text="wrap">9f2c1ab84de07615c3b9a0d5e8471fca2b6d09e3</td>
          <td slTableCell text="truncate">Quarterly reconciliation for the Northwind Trading account, prepared by the finance team and approved on the fourteenth.</td>
          <td slTableCell text="nowrap">12 Aug 2026, 09:41</td>
        </tr>
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Footer: Story = {
  parameters: scenario('footer'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 3) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A summary inside, a paginator under',
    'The total sits in a tfoot beside the column it totals, and the paging control sits in a bar outside the table and inside the frame — where it does not scroll sideways with the columns.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent [totalRowCount]="128">
      ${HEAD}${BODY}
      <tfoot slTableSummary>
        <tr slTableRow>
          <td slTableCell [attr.colspan]="3">3 of 128 invoices</td>
          <td slTableCell numeric>11,061.25</td>
        </tr>
      </tfoot>
    </div>
    <div slTableFooter>
      <span>Page 1 of 43</span>
      <nav slPagination [count]="128" [pageSize]="3">
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items></sl-pagination-items>
        <button slPaginationNext type="button"></button>
      </nav>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 2) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A first load',
    'Skeleton rows draw the table shape before its content, so the page does not jump when the rows arrive. Nothing here is announced: the rows are aria-hidden until they are real.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent>${HEAD}
      <tbody slTableLoader [skeletonRows]="3"></tbody>
    </div>
  </div>`,
  )}
  ${scene(
    'A refresh over rows already read',
    'aria-busy on the table and the body dimmed: every column keeps its width and the reader keeps their place. Swapping these rows for skeletons would take both.',
    table('variant="framed" loading'),
  )}
  ${scene(
    'Nothing to show',
    'The empty cell spans the table and takes a result state, which already tells an empty set from a set a filter emptied — so this family owns no word for either.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent>${HEAD}
      <tbody slTableBody>
        <tr>
          <td slTableEmpty>
            <section slResultState status="no-results">
              <div slResultStateContent>
                <h3 slResultStateTitle>No invoices match this filter</h3>
              </div>
            </section>
          </td>
        </tr>
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Density: Story = {
  parameters: scenario('density'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 2) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'comfortable, compact and dense',
    'Each region states its own density. The row height, the cell inset and the type step all come from the control scale, so one theme decision moves the rows, the buttons and the fields together.',
    `
  <div class="slotted-demo-stack">
    <div data-slotted-density="comfortable">${table('variant="framed"')}</div>
    <div data-slotted-density="compact">${table('variant="framed"')}</div>
    <div data-slotted-density="dense">${table('variant="framed"')}</div>
  </div>`,
  )}
</div>`,
  }),
};

/**
 * The stock take: every row is a count a reader corrects in place. A `plain`
 * control in a cell takes the cell's own inset and the row's own height, so
 * the corrected value stands where the read value stood and the row does not
 * grow when it is edited.
 */
function editingProps() {
  return {
    aisles: ['Aisle 4', 'Aisle 7', 'Aisle 12'],
    stock: [
      { counted: 1200, description: 'Hex bolt M8', location: 'Aisle 4', sku: 'PRD-0412' },
      { counted: 3400, description: 'Flat washer M8', location: 'Aisle 4', sku: 'PRD-0413' },
      { counted: 0, description: '', location: 'Aisle 7', sku: 'PRD-0414' },
      { counted: 860, description: 'Spring washer M8', location: 'Aisle 7', sku: 'PRD-0415' },
    ],
    describe(item: { description: string }, event: Event) {
      item.description = (event.target as HTMLInputElement).value;
    },
  };
}

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => ({
    props: editingProps(),
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A plain control in a cell',
    'A text field, a number field and a select, each variant="plain", each standing in a body cell. The cell gives up its inset and the control takes it, so the edited value sits under the column\'s name where the read value sat; the control is the row\'s height, so a row being edited is as tall as the rows around it. The invalid edge stays, square.',
    `
  <div slTable [columns]="4" variant="ruled">
    <div slTableContent>
      <caption slTableCaption>Stock take</caption>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">SKU</th>
          <th slTableColumnHeader>Description</th>
          <th slTableColumnHeader numeric>Counted</th>
          <th slTableColumnHeader>Location</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (item of stock; track item.sku) {
          <tr slTableRow [value]="item.sku">
            <th slTableRowHeader text="nowrap">{{ item.sku }}</th>
            <td slTableCell>
              <div slTextField size="sm" variant="plain">
                <input slTextFieldInput placeholder="Required" [invalid]="item.description === ''" [value]="item.description" [attr.aria-label]="'Description of ' + item.sku" (input)="describe(item, $event)" />
              </div>
            </td>
            <td slTableCell numeric>
              <div slNumberField size="sm" variant="plain" stepper="none">
                <input slNumberFieldInput min="0" [value]="item.counted" [attr.aria-label]="'Counted for ' + item.sku" />
              </div>
            </td>
            <td slTableCell>
              <sl-select size="sm" variant="plain" [(value)]="item.location" [attr.aria-label]="'Location of ' + item.sku">
                @for (aisle of aisles; track aisle) {
                  <sl-select-item [value]="aisle">{{ aisle }}</sl-select-item>
                }
              </sl-select>
            </td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: {
      invoices: INVOICES.slice(0, 6),
      editable: INVOICES.slice(0, 4).map((invoice) => ({ ...invoice, note: '', renew: true })),
      total: (invoice: Invoice & { seats: number }) =>
        MONEY.format(Number(invoice.amount.replace(/,/g, '')) * invoice.seats),
      seatsOf: (invoice: Invoice, event: Event) => {
        invoice.seats = Number((event.target as HTMLInputElement).value) || 1;
      },
      noteOf: (invoice: Invoice & { note: string }, event: Event) => {
        invoice.note = (event.target as HTMLInputElement).value;
      },
    },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A cell is a slot, not a string',
    'A link and a tag on the identifier, an avatar beside the owner, a status indicator on the service, a bar for what has been collected, and an amount in tabular figures. Every one of them is another family standing in a cell this one lays out.',
    `
  <div slTable [columns]="5" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Owner</th>
          <th slTableColumnHeader text="nowrap">Service</th>
          <th slTableColumnHeader text="nowrap">Collected</th>
          <th slTableColumnHeader numeric text="nowrap">Amount</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">
              <a slLink [href]="'#' + invoice.id">{{ invoice.id }}</a>
              <br />
              <span slTag size="sm" [tone]="invoice.tone"><span slTagBody>{{ invoice.status }}</span></span>
            </th>
            <td slTableCell text="nowrap">
              <span class="slotted-demo-row">
                <span slAvatar size="sm" [name]="invoice.owner"></span>
                {{ invoice.owner }}
              </span>
            </td>
            <td slTableCell text="nowrap">
              <span slStatusIndicator [status]="invoice.service">{{ invoice.region }}</span>
            </td>
            <td slTableCell>
              <div slProgressBar size="sm" showValue hideLabel [label]="'Collected on ' + invoice.id" [value]="invoice.paid"></div>
            </td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
  ${scene(
    'Controls inside the cells',
    'A row a reader edits in place: a number field for seats, a text field for a note, a switch for auto-renew, and a total that answers them. Each control is its own tab stop, which is what the table role means — and what a grid would take away.',
    `
  <div slTable [columns]="6" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader text="nowrap">Invoice</th>
          <th slTableColumnHeader text="nowrap">Client</th>
          <th slTableColumnHeader text="nowrap">Seats</th>
          <th slTableColumnHeader text="nowrap">Note</th>
          <th slTableColumnHeader align="center" text="nowrap">Auto-renew</th>
          <th slTableColumnHeader numeric text="nowrap">Total</th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of editable; track invoice.id) {
          <tr slTableRow [value]="invoice.id">
            <th slTableRowHeader text="nowrap">
              <a slLink [href]="'#' + invoice.id">{{ invoice.id }}</a>
            </th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell>
              <div slNumberField size="sm">
                <input slNumberFieldInput min="1" [value]="invoice.seats" [attr.aria-label]="'Seats on ' + invoice.id" (input)="seatsOf(invoice, $event)" />
              </div>
            </td>
            <td slTableCell>
              <div slTextField size="sm">
                <input slTextFieldInput placeholder="Add a note" [value]="invoice.note" [attr.aria-label]="'Note on ' + invoice.id" (input)="noteOf(invoice, $event)" />
              </div>
            </td>
            <td slTableCell align="center">
              <span slSwitch size="sm" [checked]="invoice.renew" [attr.aria-label]="'Auto-renew ' + invoice.id"></span>
            </td>
            <td slTableCell numeric>{{ total(invoice) }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
  ${scene(
    'Content the table did not choose',
    'A translated header twice as long as its English, a forty-character hash that breaks inside its column, and a note that truncates with every character still in the DOM. The three treatments are the answer to content the family does not control.',
    `
  <div slTable [columns]="3" layout="fixed" variant="framed">
    <div slTableContent>
      <thead slTableHead>
        <tr slTableRow>
          <th slTableColumnHeader>Rechnungsnummer</th>
          <th slTableColumnHeader>Prufsumme</th>
          <th slTableColumnHeader>Bemerkung</th>
        </tr>
      </thead>
      <tbody slTableBody>
        <tr slTableRow value="INV-1044">
          <th slTableRowHeader>INV-1044</th>
          <td slTableCell text="wrap">9f2c1ab84de07615c3b9a0d5e8471fca2b6d09e3</td>
          <td slTableCell text="truncate">
            Quarterly reconciliation for the Bright Harbor Media account, prepared by the finance
            team and approved on the fourteenth.
          </td>
        </tr>
        <tr slTableRow value="INV-1053">
          <th slTableRowHeader>INV-1053</th>
          <td slTableCell text="wrap">Rechnungsprufungsausschusssitzung</td>
          <td slTableCell text="nowrap">
            One line, whatever it costs: the column widens and the table scrolls rather than the
            words breaking.
          </td>
        </tr>
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Listing: Story = {
  parameters: scenario('listing'),
  render: () => ({
    props: {
      ...filterProps(INVOICES),
      chosen: [] as string[],
      sort: { column: 'due', direction: 'ascending' } as TableSortDescriptor | null,
      pageTotal: MONEY.format(
        INVOICES.reduce((sum, invoice) => sum + Number(invoice.amount.replace(/,/g, '')), 0),
      ),
    },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A billing screen, whole',
    'Ten columns and twelve of four hundred and twelve records: sorting by due date, a status filter in the status header, the checkbox and the identifier pinned together at the start, actions pinned at the end, a total in the tfoot, and paging in the footer. Draft records cannot be chosen, so the header checkbox covers nine and says so.',
    `
  <div slTable [columns]="10" variant="framed" stickyHeader stickyFooter selectionMode="multiple" [(value)]="chosen" [(sort)]="sort">
    <div slTableContent [totalRowCount]="412" class="slotted-demo-bound slotted-demo-bound--tall">
      <thead slTableHead>
        <tr slTableRow>
          <th slTableSelectAll sticky="start"></th>
          <th slTableColumnHeader column="id" sticky="start" stickyOffset="3rem" text="nowrap"><button slTableSort>Invoice</button></th>
          <th slTableColumnHeader column="client" text="nowrap"><button slTableSort>Client</button></th>
          <th slTableColumnHeader text="nowrap">Status${FILTER('status', 'statusOptions', 'statuses')}</th>
          <th slTableColumnHeader text="nowrap">Owner</th>
          <th slTableColumnHeader text="nowrap">Service</th>
          <th slTableColumnHeader column="due" text="nowrap"><button slTableSort>Due</button></th>
          <th slTableColumnHeader text="nowrap">Collected</th>
          <th slTableColumnHeader column="amount" numeric text="nowrap"><button slTableSort>Amount</button></th>
          <th slTableColumnHeader sticky="end" align="center">
            <span data-ui="visually-hidden" data-ui-visually-hidden="" data-part="root" data-part-root="">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody slTableBody>
        @for (invoice of visible(); track invoice.id; let index = $index) {
          <tr slTableRow [value]="invoice.id" [rowIndex]="index + 1" [disabled]="invoice.status === 'Draft'">
            <td slTableSelect sticky="start"></td>
            <th slTableRowHeader sticky="start" stickyOffset="3rem" text="nowrap">
              <a slLink [href]="'#' + invoice.id">{{ invoice.id }}</a>
            </th>
            <td slTableCell text="nowrap">{{ invoice.client }}</td>
            <td slTableCell text="nowrap">
              <span slTag [tone]="invoice.tone"><span slTagBody>{{ invoice.status }}</span></span>
            </td>
            <td slTableCell text="nowrap">
              <span class="slotted-demo-row">
                <span slAvatar size="sm" [name]="invoice.owner"></span>
                {{ invoice.owner }}
              </span>
            </td>
            <td slTableCell text="nowrap">
              <span slStatusIndicator [status]="invoice.service">{{ invoice.region }}</span>
            </td>
            <td slTableCell text="nowrap">{{ invoice.due }}</td>
            <td slTableCell>
              <div slProgressBar size="sm" showValue hideLabel [label]="'Collected on ' + invoice.id" [value]="invoice.paid"></div>
            </td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
            <td slTableCell sticky="end" align="center">
              <button slIconButton variant="ghost" tone="secondary" size="sm" type="button" [attr.aria-label]="'Actions for ' + invoice.id">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </td>
          </tr>
        } @empty {
          <tr>
            <td slTableEmpty>
              <section slResultState status="no-results">
                <div slResultStateContent>
                  <h3 slResultStateTitle>No invoices match this filter</h3>
                </div>
              </section>
            </td>
          </tr>
        }
      </tbody>
      <tfoot slTableSummary>
        <tr slTableRow>
          <td slTableCell [colSpan]="2" sticky="start" text="nowrap">This page</td>
          <td slTableCell [colSpan]="6">{{ visible().length }} invoices</td>
          <td slTableCell numeric>{{ pageTotal }}</td>
          <td slTableCell sticky="end"></td>
        </tr>
      </tfoot>
    </div>
    <div slTableFooter>
      <span>{{ chosen.length === 0 ? visible().length + ' of 412 invoices' : chosen.length + ' chosen — export, send a reminder, or write one off' }}</span>
      <nav slPagination [count]="412" [pageSize]="12">
        <button slPaginationPrevious type="button"></button>
        <sl-pagination-items></sl-pagination-items>
        <button slPaginationNext type="button"></button>
      </nav>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 2) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Reaching the instance from the template',
    'exportAs gives the template the row, the table and the scroller: a row knows whether it is expanded, and the scroller can bring a record into view. provideTableDefaults sets the frame once for the whole application, and provideSlotted the language.',
    `
  <div slTable [columns]="4" variant="framed" #table="slTable">
    <div slTableContent #content="slTableContent">${HEAD}${BODY}</div>
    <div slTableFooter>
      <span>{{ table.rows().length }} records in the DOM</span>
      <button type="button" (click)="content.scrollToRow('INV-1042')">Show INV-1042</button>
    </div>
  </div>`,
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { chosen: [], invoices: INVOICES },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, and nothing else to learn',
    'A table is not a composite widget, so each control is its own stop: the scroller, then every sort button, checkbox and expander in DOM order. Hold Shift with Space on a checkbox to take the range.',
    SELECTABLE,
  )}
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { invoices: INVOICES.slice(0, 3) },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A page of a larger set',
    'aria-rowcount says how large the whole set is and aria-rowindex says where each record sits in it, so row two of four is heard as row forty-two of a hundred and twenty-eight. Both are written only because this table states a total.',
    `
  <div slTable [columns]="4" variant="framed">
    <div slTableContent [totalRowCount]="128">
      <caption slTableCaption>Invoices, page 11 of 32</caption>${HEAD}
      <tbody slTableBody>
        @for (invoice of invoices; track invoice.id; let index = $index) {
          <tr slTableRow [value]="invoice.id" [rowIndex]="41 + index">
            <th slTableRowHeader>{{ invoice.id }}</th>
            <td slTableCell>{{ invoice.client }}</td>
            <td slTableCell>{{ invoice.status }}</td>
            <td slTableCell numeric>{{ invoice.amount }}</td>
          </tr>
        }
      </tbody>
    </div>
  </div>`,
  )}
</div>`,
  }),
};
