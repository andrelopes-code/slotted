import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
  SlTableSelect,
  SlTableSelectAll,
  SlTableSort,
} from '@slotted/angular/table';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { emptyQuery, type GridColumn, type GridQuery } from '@slotted/core/grid';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlDataList, SlDataListFooter } from './data-list';
import {
  type DataListQueryRequest,
  type DataListSelection,
  type DataListSelectionMode,
} from './data-list-defaults';
import { SlDataListCellTemplate, SlDataListMediaTemplate } from './data-list-templates';
import { ANGULAR_DATA_LIST_DOCS, ANGULAR_DATA_LIST_TOKENS } from './data-list.docs';

/* ── The domain: the accounts of a sales desk ────────────────────────── */

interface Account {
  id: string;
  name: string;
  email: string;
  balance: number;
  status: 'Active' | 'On hold' | 'Churned';
  owner: string | null;
  region: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  lastOrder: string;
  created: string;
}

const ACCOUNTS: Account[] = [
  {
    id: 'acme',
    name: 'Acme Logistics',
    email: 'ops@acme.example',
    balance: 12480,
    status: 'Active',
    owner: 'Marta Silva',
    region: 'Lisbon',
    plan: 'Pro',
    lastOrder: '2026-09-12',
    created: '2024-01-04',
  },
  {
    id: 'borealis',
    name: 'Borealis Foods',
    email: 'buying@borealis.example',
    balance: 3902.15,
    status: 'On hold',
    owner: null,
    region: 'Porto',
    plan: 'Free',
    lastOrder: '2026-08-30',
    created: '2023-06-10',
  },
  {
    id: 'cobalt',
    name: 'Cobalt Studio',
    email: 'hello@cobalt.example',
    balance: 48120.4,
    status: 'Active',
    owner: 'John Reed',
    region: 'Madrid',
    plan: 'Enterprise',
    lastOrder: '2026-09-20',
    created: '2022-02-01',
  },
  {
    id: 'dunmore',
    name: 'Dunmore Freight',
    email: 'accounts@dunmore.example',
    balance: 0,
    status: 'Churned',
    owner: 'Rui Neves',
    region: 'Seville',
    plan: 'Pro',
    lastOrder: '2025-11-02',
    created: '2021-09-15',
  },
  {
    id: 'star',
    name: 'Star Pharma',
    email: 'purchases@star.example',
    balance: 27650.9,
    status: 'Active',
    owner: 'Ana Costa',
    region: 'Lisbon',
    plan: 'Enterprise',
    lastOrder: '2026-09-18',
    created: '2023-03-22',
  },
  {
    id: 'fjord',
    name: 'Fjord Outdoor',
    email: 'orders@fjord.example',
    balance: 815,
    status: 'On hold',
    owner: 'Marta Silva',
    region: 'Bilbao',
    plan: 'Free',
    lastOrder: '2026-07-04',
    created: '2025-05-09',
  },
];

const LONG: Account[] = [
  {
    id: 'cgda',
    name: 'General Northern Distribution and Warehousing Company',
    email: 'procurement.department.northern-region@general-northern-distribution.example',
    balance: 1204880,
    status: 'Active',
    owner: 'Maria Madalena Albuquerque de Vasconcelos',
    region: 'الدار البيضاء',
    plan: 'Enterprise',
    lastOrder: '2026-09-21',
    created: '2019-04-02',
  },
  { ...ACCOUNTS[1]!, id: 'ivo', name: 'Ivo', email: '', owner: null },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const COLUMNS: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', rowHeader: true },
  { id: 'email', label: 'Email' },
  {
    id: 'balance',
    label: 'Balance',
    kind: 'number',
    format: (value) => currency.format(value as number),
  },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'region', label: 'Region', priority: 3 },
  { id: 'lastOrder', label: 'Last order', kind: 'date', priority: 4 },
  { id: 'plan', label: 'Plan' },
  { id: 'created', label: 'Created', kind: 'date', sortable: false },
  { id: 'actions', label: 'Actions', kind: 'actions' },
];

const TONES = { Active: 'success', 'On hold': 'warning', Churned: 'secondary' } as const;

const describeQuery = (query: GridQuery) =>
  query.sort.length > 0
    ? `sort ${query.sort.map((key) => `${key.column} ${key.direction}`).join(', ')}`
    : 'no sort';

/**
 * The account list every scene draws: the columns, the badge and the row's
 * menu as an application writes them, and every input the scene varies.
 */
@Component({
  selector: 'sl-dl-accounts',
  standalone: true,
  imports: [
    NgIcon,
    SlAvatar,
    SlBadge,
    SlDataList,
    SlDataListCellTemplate,
    SlDataListMediaTemplate,
    SlIconButton,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  template: `<sl-data-list
      #list="slDataList"
      locale="en-US"
      rowKey="id"
      subtitle="email"
      trailing="balance"
      [label]="labelledBy() ? undefined : 'Accounts'"
      [labelledBy]="labelledBy()"
      [columns]="columns()"
      [rows]="rows()"
      [fields]="fields()"
      [selectionMode]="selectionMode()"
      [disabledKeys]="disabledKeys()"
      [loadingKeys]="loadingKeys()"
      [current]="current()"
      [href]="linked() ? hrefOf : undefined"
      [activatable]="activatable()"
      [loading]="loading()"
      [loadingDelay]="0"
      [error]="error()"
      [hasMore]="hasMore()"
      [totalCount]="totalCount()"
      [skeletonRows]="skeletonRows()"
      [(query)]="query"
      [(value)]="value"
      [(expanded)]="expanded"
      (activate)="current.set($event.key)"
      (loadMore)="loadMore()"
    >
      @if (media()) {
        <ng-template slDataListMedia let-account>
          <span slAvatar size="sm" [name]="nameOf(account)"></span>
        </ng-template>
      }
      <ng-template slDataListCell="status" let-row>
        <span slBadge size="sm" variant="soft" [tone]="toneOf(row)">{{ statusOf(row) }}</span>
      </ng-template>
      <ng-template slDataListCell="actions" let-row>
        <button
          slIconButton
          size="sm"
          tone="secondary"
          variant="ghost"
          [attr.aria-label]="'Actions for ' + nameOf(row)"
        >
          <ng-icon aria-hidden="true" name="lucideEllipsis"></ng-icon>
        </button>
      </ng-template>
    </sl-data-list>
    @if (echo()) {
      <p class="slotted-demo-scene__note">{{ describe() }}</p>
    }`,
})
class Accounts {
  readonly list = viewChild.required<SlDataList<Account>>('list');
  readonly columns = input<readonly GridColumn<Account>[]>(COLUMNS);
  readonly rows = signal<readonly Account[]>(ACCOUNTS);
  readonly initialRows = input<readonly Account[] | undefined>(undefined);
  readonly fields = input<number | undefined>(undefined);
  readonly selectionMode = input<DataListSelectionMode>('none');
  readonly disabledKeys = input<readonly string[]>([]);
  readonly loadingKeys = input<readonly string[]>([]);
  readonly current = signal<string | null>(null);
  readonly initialCurrent = input<string | null>(null);
  readonly linked = input(false);
  readonly activatable = input(false);
  readonly loading = signal(false);
  readonly initialLoading = input(false);
  readonly error = input<boolean>(false);
  readonly paged = input(false);
  readonly skeletonRows = input<number | undefined>(undefined);
  readonly media = input(false);
  readonly echo = input(false);
  readonly labelledBy = input<string | undefined>(undefined);
  readonly initialQuery = input<GridQuery | undefined>(undefined);
  readonly initialValue = input<DataListSelection>(null);
  readonly initialExpanded = input<readonly string[]>([]);

  readonly hasMore = signal(false);
  readonly totalCount = signal<number | undefined>(undefined);
  query: GridQuery = emptyQuery();
  value: DataListSelection = null;
  expanded: readonly string[] = [];
  protected readonly hrefOf = (row: Account) => `#accounts/${row.id}`;

  protected nameOf(row: unknown) {
    return (row as Account).name;
  }

  protected statusOf(row: unknown) {
    return (row as Account).status;
  }

  protected toneOf(row: unknown) {
    return TONES[(row as Account).status];
  }

  ngOnInit() {
    this.query = this.initialQuery() ?? emptyQuery();
    this.value = this.initialValue();
    this.expanded = this.initialExpanded();
    this.current.set(this.initialCurrent());
    this.loading.set(this.initialLoading());
    const rows = this.initialRows();
    if (rows !== undefined) this.rows.set(rows);
    if (this.paged()) {
      this.rows.set(ACCOUNTS.slice(0, 2));
      this.hasMore.set(true);
      this.totalCount.set(ACCOUNTS.length);
    }
  }

  describe() {
    const chosen = Array.isArray(this.value) ? this.value.join(', ') : (this.value ?? '');
    return `${describeQuery(this.query)} — ${chosen === '' ? 'nothing chosen' : `chosen: ${chosen}`}`;
  }

  loadMore() {
    this.loading.set(true);
    setTimeout(() => {
      const next = ACCOUNTS.slice(0, this.rows().length + 2);
      this.rows.set(next);
      this.hasMore.set(next.length < ACCOUNTS.length);
      this.loading.set(false);
    }, 900);
  }
}

/** A search field and the list on one query. */
@Component({
  selector: 'sl-dl-filtering',
  standalone: true,
  imports: [SlDataList, SlTextField, SlTextFieldInput],
  template: `<div slTextField>
      <input
        slTextFieldInput
        aria-label="Search accounts"
        placeholder="Search accounts"
        [value]="query.search"
        (input)="search($event)"
      />
    </div>
    <sl-data-list
      label="Accounts"
      locale="en-US"
      rowKey="id"
      subtitle="email"
      trailing="balance"
      [columns]="columns"
      [rows]="rows"
      [(query)]="query"
    />`,
})
class Filtering {
  readonly columns = COLUMNS;
  readonly rows = ACCOUNTS;
  query: GridQuery = emptyQuery();

  search(event: Event) {
    this.query = { ...this.query, search: (event.target as HTMLInputElement).value };
  }
}

/** The table on a wide room, the list on a narrow one, over one sort and one selection. */
@Component({
  selector: 'sl-dl-with-table',
  standalone: true,
  imports: [
    SlBadge,
    SlDataList,
    SlSegment,
    SlSegmentedControl,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
    SlTableSelect,
    SlTableSelectAll,
    SlTableSort,
  ],
  template: `<div
      slSegmentedControl
      aria-label="Room"
      [value]="room()"
      (valueChange)="room.set($any($event.value))"
    >
      <label slSegment value="laptop">Laptop, 900 pixels</label>
      <label slSegment value="phone">Phone, 375 pixels</label>
    </div>
    <div class="slotted-demo-room" [attr.data-room]="room()">
      <div #frame>
        @if (compact()) {
          <sl-data-list
            label="Accounts"
            locale="en-US"
            rowKey="id"
            selectionMode="multiple"
            subtitle="email"
            trailing="balance"
            [columns]="columns"
            [rows]="rows"
            [query]="asQuery()"
            [(value)]="chosen"
            (queryChangeRequest)="fromQuery($event)"
          />
        } @else {
          <div slTable selectionMode="multiple" [columns]="5" [(sort)]="sort" [(value)]="chosen">
            <div slTableContent>
              <thead slTableHead>
                <tr slTableRow>
                  <th slTableSelectAll></th>
                  <th slTableColumnHeader column="name"><button slTableSort>Account</button></th>
                  <th slTableColumnHeader>Status</th>
                  <th slTableColumnHeader>Owner</th>
                  <th slTableColumnHeader column="balance" numeric>
                    <button slTableSort>Balance</button>
                  </th>
                </tr>
              </thead>
              <tbody slTableBody>
                @for (account of sorted(); track account.id) {
                  <tr slTableRow [value]="account.id">
                    <td slTableSelect></td>
                    <th slTableRowHeader>{{ account.name }}</th>
                    <td slTableCell>
                      <span slBadge size="sm" variant="soft" [tone]="tones[account.status]">{{
                        account.status
                      }}</span>
                    </td>
                    <td slTableCell>{{ account.owner ?? '—' }}</td>
                    <td slTableCell numeric>{{ money(account.balance) }}</td>
                  </tr>
                }
              </tbody>
            </div>
          </div>
        }
      </div>
    </div>`,
})
class WithTableDemo {
  readonly columns = COLUMNS;
  readonly rows = ACCOUNTS;
  readonly room = signal<'laptop' | 'phone'>('laptop');
  readonly compact = signal(false);
  readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  protected readonly tones = TONES;
  sort: { column: string; direction: 'ascending' | 'descending' } | null = {
    column: 'balance',
    direction: 'descending',
  };
  chosen: readonly string[] = ['cobalt'];

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const gate = createWidthGate(this.frame().nativeElement, {
        at: COMPACT_BELOW,
        onChange: (narrow) => this.compact.set(narrow),
      });
      destroy.onDestroy(gate.destroy);
    });
  }

  asQuery(): GridQuery {
    return { ...emptyQuery(), sort: this.sort ? [this.sort] : [] };
  }

  fromQuery(request: DataListQueryRequest) {
    this.sort = request.value.sort[0] ?? null;
  }

  sorted() {
    const sort = this.sort;
    return [...ACCOUNTS].sort((a, b) => {
      if (sort === null) return 0;
      const key = sort.column as keyof Account;
      const order = String(a[key]).localeCompare(String(b[key]), 'en', { numeric: true });
      return sort.direction === 'ascending' ? order : -order;
    });
  }

  money(value: number) {
    return currency.format(value);
  }
}

/** A button outside the list that asks the instance to focus one record. */
@Component({
  selector: 'sl-dl-keyboard',
  standalone: true,
  imports: [SlButton, SlDataList, SlDataListFooter],
  template: `<button slButton size="sm" variant="outline" (click)="accounts.focusKey('cobalt')">
      Focus Cobalt Studio
    </button>
    <sl-data-list
      #accounts="slDataList"
      label="Accounts"
      locale="en-US"
      rowKey="id"
      selectionMode="multiple"
      subtitle="email"
      trailing="balance"
      [columns]="columns"
      [fields]="2"
      [href]="hrefOf"
      [rows]="rows"
    />`,
})
class KeyboardDemo {
  readonly columns = COLUMNS;
  readonly rows = ACCOUNTS.slice(0, 3);
  protected readonly hrefOf = (row: Account) => `#accounts/${row.id}`;
}

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

const grid = (body: string) => `<div class="slotted-demo-grid" data-columns="1">${body}</div>`;
const phone = (body: string) => `<div class="slotted-demo-room" data-room="phone">${body}</div>`;
const tablet = (body: string) => `<div class="slotted-demo-room" data-room="tablet">${body}</div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_DATA_LIST_DOCS.dataList.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    fields: Fields,
    activation: Activation,
    selection: Selection,
    sorting: Sorting,
    filtering: FilteringScene,
    grouping: Grouping,
    expansion: Expansion,
    states: States,
    loading: Loading,
    'empty-and-error': EmptyAndError,
    'load-more': LoadMore,
    'with-table': WithTable,
    content: Content,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta: Meta = {
  title: 'Components/DataList',
  decorators: [moduleMetadata({ imports: [Accounts, Filtering, WithTableDemo, KeyboardDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Data List',
        description:
          'A small tabular set drawn as records where a table does not fit: a phone, a drawer, the master column of a master–detail. Each record is a list item with a title, a subtitle, a trailing figure and its fields by priority as labelled pairs. It reads the column model and the query sl-data-grid reads, and it binds no arrow key.',
        framework: 'Angular',
        ...ANGULAR_DATA_LIST_DOCS.dataList,
        tokens: ANGULAR_DATA_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

const GROUPED: GridQuery = { ...emptyQuery(), group: ['status'] };
const TWO_KEYS: GridQuery = {
  ...emptyQuery(),
  sort: [
    { column: 'status', direction: 'ascending' },
    { column: 'balance', direction: 'descending' },
  ],
};
const NO_MATCH: GridQuery = { ...emptyQuery(), search: 'Oslo' };

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    template: phone(`<sl-dl-accounts echo media selectionMode="multiple" />`),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(0, 2), chosen: ['acme'] },
    template: phone(
      `<sl-dl-accounts linked media selectionMode="multiple" [initialRows]="rows" [initialValue]="chosen" />`,
    ),
  }),
};

export const Fields: Story = {
  parameters: scenario('fields'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(2, 3) },
    template: grid(
      scene(
        '375 pixels',
        'One pair a line: the label beside the value, the priority order top to bottom.',
        phone(`<sl-dl-accounts [fields]="6" [initialRows]="rows" />`),
      ) +
        scene(
          '640 pixels',
          'Two and three columns of label over value, under the title and the balance alike.',
          tablet(`<sl-dl-accounts [fields]="6" [initialRows]="rows" />`),
        ),
    ),
  }),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(0, 3) },
    template: grid(
      scene(
        'A link',
        'The whole record is the link’s target; the current record is the one open beside the list.',
        phone(`<sl-dl-accounts linked initialCurrent="cobalt" [initialRows]="rows" />`),
      ) +
        scene(
          'A command',
          'activatable makes the title a button; pressing a record makes it current here.',
          phone(`<sl-dl-accounts activatable initialCurrent="cobalt" [initialRows]="rows" />`),
        ) +
        scene(
          'Only read',
          'Neither href nor activatable: the title is text and the record answers no pointer.',
          phone(`<sl-dl-accounts [initialRows]="rows" />`),
        ),
    ),
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(3, 6) },
    template: grid(
      scene(
        'Multiple',
        'Select one, then Shift and another: every record between them joins. Select-all covers the six.',
        phone(`<sl-dl-accounts echo selectionMode="multiple" />`),
      ) +
        scene(
          'Single',
          'One key or none; no select-all, the same checkbox table draws.',
          phone(
            `<sl-dl-accounts selectionMode="single" initialValue="estrela" [initialRows]="rows" />`,
          ),
        ),
    ),
  }),
};

export const Sorting: Story = {
  parameters: scenario('sorting'),
  render: () => ({
    props: { twoKeys: TWO_KEYS },
    template: grid(
      scene(
        'From the menu',
        'Open Sort and choose Balance, then Descending: the records reorder and the trigger names the key.',
        phone(`<sl-dl-accounts echo />`),
      ) +
        scene(
          'Two keys from the grid',
          'A query sorted by status then balance: the trigger reads +1 and its name says the whole order.',
          phone(`<sl-dl-accounts [initialQuery]="twoKeys" />`),
        ),
    ),
  }),
};

export const FilteringScene: Story = {
  name: 'Filtering',
  parameters: scenario('filtering'),
  render: () => ({ template: phone(`<sl-dl-filtering />`) }),
};

export const Grouping: Story = {
  parameters: scenario('grouping'),
  render: () => ({
    props: { grouped: GROUPED },
    template: phone(`<sl-dl-accounts [initialQuery]="grouped" />`),
  }),
};

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(0, 3), open: ['cobalt'] },
    template: phone(
      `<sl-dl-accounts [fields]="2" [initialRows]="rows" [initialExpanded]="open" />`,
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { rows: ACCOUNTS.slice(0, 4), chosen: ['acme'], off: ['dunmore'], busy: ['borealis'] },
    template: phone(
      `<sl-dl-accounts activatable initialCurrent="cobalt" selectionMode="multiple" [disabledKeys]="off" [initialRows]="rows" [initialValue]="chosen" [loadingKeys]="busy" />`,
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: { none: [], rows: ACCOUNTS.slice(0, 2) },
    template: grid(
      scene(
        'The first load',
        'No rows yet: two records drawn as their anatomy, the field labels real and the bars uneven.',
        phone(`<sl-dl-accounts initialLoading [initialRows]="none" [skeletonRows]="2" />`),
      ) +
        scene(
          'A refresh',
          'Rows already shown stay and recede while the new ones load; nothing moves.',
          phone(`<sl-dl-accounts initialLoading [initialRows]="rows" />`),
        ),
    ),
  }),
};

export const EmptyAndError: Story = {
  parameters: scenario('empty-and-error'),
  render: () => ({
    props: { none: [], noMatch: NO_MATCH },
    template: grid(
      scene(
        'Empty',
        'No accounts at all: the state says so and offers nothing to clear.',
        phone(`<sl-dl-accounts [initialRows]="none" />`),
      ) +
        scene(
          'No results',
          'The search left nothing: Clear filters empties the filter and the search in one change.',
          phone(`<sl-dl-accounts [initialQuery]="noMatch" />`),
        ) +
        scene(
          'Error',
          'The request failed: Try again emits retry; rows already shown would stay under the message.',
          phone(`<sl-dl-accounts error [initialRows]="none" />`),
        ),
    ),
  }),
};

export const LoadMore: Story = {
  parameters: scenario('load-more'),
  render: () => ({ template: phone(`<sl-dl-accounts paged />`) }),
};

export const WithTable: Story = {
  parameters: scenario('with-table'),
  render: () => ({ template: `<sl-dl-with-table />` }),
};

export const Content: Story = {
  parameters: scenario('content'),
  decorators: [
    applicationConfig({
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  render: () => ({
    props: {
      rows: LONG,
      columns: COLUMNS.map((column) =>
        column.id === 'owner' ? { ...column, label: 'Account manager' } : column,
      ),
    },
    template: phone(`<sl-dl-accounts [columns]="columns" [initialRows]="rows" />`),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({ template: phone(`<sl-dl-keyboard />`) }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { rows: ACCOUNTS.filter((account) => account.region === 'Lisbon') },
    template: phone(
      `<h2 class="slotted-demo-scene__label" id="accounts-heading">Accounts in Lisbon</h2>
      <sl-dl-accounts labelledBy="accounts-heading" linked selectionMode="multiple" [initialRows]="rows" />`,
    ),
  }),
};
