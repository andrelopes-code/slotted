import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCodeBlock } from '@slotted/angular/code-block';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlSelect, SlSelectItem } from '@slotted/angular/select';
import {
  SlTable,
  SlTableBody,
  SlTableCell,
  SlTableColumnHeader,
  SlTableContent,
  SlTableHead,
  SlTableRow,
  SlTableRowHeader,
} from '@slotted/angular/table';
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
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlFilterBar, SlFilterBarEnd, SlFilterBarOperand } from './filter-bar';
import type { FilterBarApply, FilterBarField, FilterBarSize } from './filter-bar.constants';
import { ANGULAR_FILTER_BAR_DOCS, ANGULAR_FILTER_BAR_TOKENS } from './filter-bar.docs';

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

const WITH_UNKNOWN: FilterGroup = {
  ...APPLIED,
  rules: [...APPLIED.rules, { field: 'region', filter: setFilter(['south']) }],
};

const COMPANY_FIRST: FilterGroup = {
  join: 'and',
  rules: [{ field: 'company', filter: setFilter(['acme']) }, ...PAID_OVER_100.rules],
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

const PRESETS = [
  { key: 'paid', label: 'Paid over R$ 100', value: PAID_OVER_100 },
  { key: 'urgent', label: 'Urgent this month', value: NESTED },
];

const read = (row: Order, field: string) => row[field as keyof Order];
const money = new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' });

const themeRootOf = (host: ElementRef<HTMLElement>) =>
  host.nativeElement.closest('[data-slotted-theme]');

/** A bare bar on the page: the same theme root for its drawer, read from the page once. */
@Component({
  selector: 'sl-filter-bar-themed',
  standalone: true,
  imports: [SlFilterBar],
  template: `<div
    slFilterBar
    [apply]="apply()"
    [container]="themeRoot"
    [count]="count()"
    [disabled]="disabled()"
    [fields]="fields()"
    [loading]="loading()"
    [readOnly]="readOnly()"
    [total]="total()"
    [value]="value()"
  ></div>`,
})
class ThemedBar {
  readonly fields = input.required<readonly FilterBarField[]>();
  readonly value = input<FilterGroup | null>(null);
  readonly apply = input<FilterBarApply | undefined>(undefined);
  readonly count = input<number | undefined>(undefined);
  readonly total = input<number | undefined>(undefined);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly readOnly = input(false);
  readonly themeRoot = themeRootOf(inject<ElementRef<HTMLElement>>(ElementRef));
}

/** The rows a table draws: the listing after the tree and the query. */
@Component({
  selector: 'sl-filter-bar-orders-table',
  standalone: true,
  imports: [
    SlBadge,
    SlTable,
    SlTableBody,
    SlTableCell,
    SlTableColumnHeader,
    SlTableContent,
    SlTableHead,
    SlTableRow,
    SlTableRowHeader,
  ],
  template: `
    <div slTable [columns]="5" variant="framed" [stickyHeader]="stickyHeader()">
      <div slTableContent>
        <thead slTableHead>
          <tr slTableRow>
            <th slTableColumnHeader>Order</th>
            <th slTableColumnHeader>Customer</th>
            <th slTableColumnHeader>Status</th>
            <th slTableColumnHeader>Channel</th>
            <th slTableColumnHeader numeric>Amount</th>
          </tr>
        </thead>
        <tbody slTableBody>
          @for (order of rows(); track $index) {
            <tr slTableRow [value]="order.id">
              <th slTableRowHeader>{{ order.id }}</th>
              <td slTableCell>{{ order.customer }}</td>
              <td slTableCell>
                <span slBadge [tone]="tone(order)">{{ statusLabel(order) }}</span>
              </td>
              <td slTableCell>{{ channelLabel(order) }}</td>
              <td slTableCell numeric>{{ money.format(order.amount) }}</td>
            </tr>
          }
        </tbody>
      </div>
    </div>
  `,
})
class OrdersTable {
  readonly rows = input.required<readonly Order[]>();
  readonly stickyHeader = input(false);
  protected readonly money = money;
  protected tone(order: Order) {
    return order.status === 'paid'
      ? 'success'
      : order.status === 'cancelled'
        ? 'danger'
        : 'secondary';
  }
  protected statusLabel(order: Order) {
    return STATUSES.find((entry) => entry.value === order.status)?.label;
  }
  protected channelLabel(order: Order) {
    return CHANNELS.find((entry) => entry.value === order.channel)?.label;
  }
}

/**
 * The bar, the rows it keeps, and the count — the three things every scene
 * shares. The tree and the query are the component's own signals; the bar
 * asks, the component moves them, and the predicates from `@slotted/core/filter`
 * shrink the listing.
 */
@Component({
  selector: 'sl-filter-bar-orders',
  standalone: true,
  imports: [OrdersTable, SlCodeBlock, SlFilterBar],
  template: `
    <div class="slotted-demo-stack">
      <div
        slFilterBar
        #bar="slFilterBar"
        [apply]="apply()"
        [chipLimit]="chipLimit()"
        [container]="container() ?? themeRoot"
        [count]="kept().length"
        [disabled]="disabled()"
        [fields]="fields()"
        [loading]="loading()"
        [(open)]="open"
        [(preset)]="preset"
        [presets]="presets()"
        [(query)]="query"
        [queryDelay]="queryDelay()"
        [savePresetEnabled]="savePresetEnabled()"
        [shortcut]="shortcut()"
        [size]="size()"
        [sticky]="sticky()"
        [total]="orders.length"
        [(value)]="filter"
        (savePreset)="saved.set($event)"
      ></div>
      @if (withTable()) {
        <sl-filter-bar-orders-table [rows]="kept()" [stickyHeader]="sticky()" />
      }
      @if (withParams()) {
        <div slCodeBlock [code]="'?' + params()" [copy]="false" defaultWrap language="text"></div>
        <p>Lido de volta: {{ restored() }}</p>
      }
      @if (saved(); as tree) {
        <p>Request to save: {{ json(tree) }}</p>
      }
    </div>
  `,
})
class Orders implements OnInit {
  readonly fields = input<readonly FilterBarField[]>(FIELDS);
  readonly initial = input<FilterGroup | null>(PAID_OVER_100);
  readonly initialQuery = input('');
  readonly apply = input<FilterBarApply | undefined>(undefined);
  readonly chipLimit = input<number | undefined>(undefined);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly presets = input<typeof PRESETS | undefined>(undefined);
  readonly initialPreset = input<string | null>(null);
  readonly queryDelay = input<number | undefined>(undefined);
  readonly savePresetEnabled = input(false);
  readonly shortcut = input<string | null | undefined>(undefined);
  readonly size = input<FilterBarSize | undefined>(undefined);
  readonly sticky = input(false);
  readonly withTable = input(false);
  readonly withParams = input(false);
  readonly initialOpen = input(false);

  readonly orders = ORDERS;
  /**
   * The theme root the workbench draws under, for the builder's drawer. An
   * application carries `data-slotted-theme` on the document, so the shared
   * portal root is inside it; a reference page carries it on the preview.
   */
  readonly themeRoot = themeRootOf(inject<ElementRef<HTMLElement>>(ElementRef));
  /** A box of the scene's own for the drawer, instead of the theme root. */
  readonly container = input<Element | null>(null);
  readonly filter = signal<FilterGroup | null>(null);
  readonly query = signal('');
  readonly preset = signal<string | null>(null);
  readonly open = signal(false);
  readonly saved = signal<FilterGroup | null>(null);

  readonly kept = computed(() => {
    const keep = createFilterGroupPredicate(this.filter(), read);
    const find = createSearchPredicate(this.query(), read, ['customer', 'id']);
    return ORDERS.filter((row) => keep(row) && find(row));
  });
  readonly params = computed(() =>
    toFilterBarParams({ filter: this.filter(), query: this.query() }).toString(),
  );
  readonly restored = computed(() => {
    const back = fromFilterBarParams(this.params());
    return `${back.filter ? `${back.filter.rules.length} regras` : 'sem filtro'}, query "${back.query}"`;
  });

  /* Where the scene starts; the bar owns every move after that. */
  ngOnInit() {
    this.filter.set(this.initial());
    this.query.set(this.initialQuery());
    this.preset.set(this.initialPreset());
    this.open.set(this.initialOpen());
  }

  json(tree: FilterGroup) {
    return JSON.stringify(tree);
  }
}

interface FilterBarStoryArgs {
  apply: FilterBarApply;
  chipLimit: number;
  disabled: boolean;
  loading: boolean;
  size: FilterBarSize;
  sticky: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_FILTER_BAR_DOCS.filterBar.scenes, {
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
  }) as never;

const IMPORTS = [
  Orders,
  OrdersTable,
  ThemedBar,
  SlButton,
  SlFilterBar,
  SlFilterBarEnd,
  SlFilterBarOperand,
  SlSelect,
  SlSelectItem,
];

/** Every scene reads the same fields and trees. */
const DATA = {
  applied: APPLIED,
  arabic: ARABIC,
  arabicFields: [
    CITIES,
    { key: 'created', kind: 'date', label: 'تاريخ الإنشاء' },
  ] as FilterBarField[],
  companyEmpty: COMPANY_EMPTY,
  companyEmptyFields: [{ ...COMPANY, defaultValue: undefined }, ...FIELDS] as FilterBarField[],
  companyFields: [COMPANY, ...FIELDS] as FilterBarField[],
  companyFirst: COMPANY_FIRST,
  fields: FIELDS,
  longAndUnknown: LONG_AND_UNKNOWN,
  longFields: [...FIELDS, TAGS] as FilterBarField[],
  nested: NESTED,
  paidOver100: PAID_OVER_100,
  presets: PRESETS,
  tripled: [...ORDERS, ...ORDERS, ...ORDERS],
  withUnknown: WITH_UNKNOWN,
};

const meta: Meta<FilterBarStoryArgs> = {
  title: 'Components/FilterBar',
  component: SlFilterBar,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FilterBar',
        description:
          'A bar over a listing that edits a tree of conditions — search, pinned pills, applied chips, AND/OR builder, presets, count, and the state in a URL — over the engine of @slotted/core/filter.',
        framework: 'Angular',
        ...ANGULAR_FILTER_BAR_DOCS.filterBar,
        tokens: ANGULAR_FILTER_BAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FilterBarStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it.
 */
const scene = (label: string, note: string, body: string, layout = 'block') => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const one = (label: string, note: string, body: string, layout = 'block') =>
  `<div class="slotted-demo-grid" data-columns="1">${scene(label, note, body, layout)}</div>`;

export const Playground: Story = {
  args: { apply: 'live', chipLimit: 6, disabled: false, loading: false, size: 'md', sticky: false },
  argTypes: {
    apply: { control: 'radio', options: ['live', 'manual'] },
    chipLimit: { control: 'number' },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, ...DATA },
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <sl-filter-bar-orders
    [apply]="apply"
    [chipLimit]="chipLimit"
    [disabled]="disabled"
    [initial]="applied"
    [loading]="loading"
    [size]="size"
    [sticky]="sticky"
    [withTable]="true"
  />
</div>`,
  }),
};

export const Listing: Story = {
  parameters: scenario('listing'),
  render: () => ({
    props: DATA,
    template: one(
      'The bar and the table over the same rows',
      'The tree is applied by the consumer; the table shrinks and the count says 3 of 8. Open the Status pill and change the values.',
      `<sl-filter-bar-orders [withTable]="true" />`,
    ),
  }),
};

export const Pinned: Story = {
  parameters: scenario('pinned'),
  render: () => ({
    props: DATA,
    template: one(
      'pinned: Status full, Customer empty',
      'The full pill takes the border and the accent background with the phrase; the empty one is an outline. Amount, not pinned, is a chip.',
      `<sl-filter-bar-orders />`,
    ),
  }),
};

export const Chips: Story = {
  parameters: scenario('chips'),
  render: () => ({
    props: DATA,
    template: one(
      'chipLimit="2" with four rules applied',
      'Two chips in view, the other two behind +2 more; a chip for a field the application does not declare becomes invalid and removable.',
      `<sl-filter-bar-orders [chipLimit]="2" [initial]="withUnknown" />`,
    ),
  }),
};

export const Builder: Story = {
  parameters: scenario('builder'),
  render: () => ({
    props: DATA,
    template: one(
      'The builder',
      'Filters (n), below 36rem, a group chip and the handle open the whole tree in the drawer: one row per rule, the nested group in a box. In an application the drawer covers the page; here, the dashed box.',
      `<div class="slotted-demo-viewport" data-size="tall" #box>
        <div class="slotted-demo-stack">
          <sl-filter-bar-orders #orders [container]="box" [withTable]="true" />
          <div class="slotted-demo-row">
            <button slButton variant="outline" type="button" (click)="orders.open.set(true)">Open the builder from outside</button>
          </div>
        </div>
      </div>`,
    ),
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    props: DATA,
    template: one(
      'Status paid and (Amount > 1000 or Priority)',
      'The nested group is a chip with the phrase in parentheses; open it and the builder shows the second level in a box with the Any join, inside the dashed box.',
      `<div class="slotted-demo-viewport" data-size="tall" #box>
        <sl-filter-bar-orders [container]="box" [initial]="nested" [withTable]="true" />
      </div>`,
    ),
  }),
};

export const Manual: Story = {
  parameters: scenario('manual'),
  render: () => ({
    props: DATA,
    template: one(
      'apply="manual"',
      'Remove a chip or type in the search: the root becomes dirty and the table does not change until Apply. Reset discards.',
      `<sl-filter-bar-orders apply="manual" [initial]="applied" [withTable]="true" />`,
    ),
  }),
};

export const Required: Story = {
  parameters: scenario('required'),
  render: () => ({
    props: DATA,
    template: one(
      'Company is required, with default Acme',
      'Clear all returns Company to Acme and clears the rest; open the pill and Clear is off. In manual, an empty Company refuses Apply.',
      `<sl-filter-bar-orders apply="manual" [fields]="companyFields" [initial]="companyFirst" />`,
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => ({
    props: DATA,
    template: one(
      'Two saved views',
      'Choose Urgent this month and the tree switches; remove a chip and the root becomes dirty with the view still chosen. Save as view… in the builder hands the tree to the application.',
      `<sl-filter-bar-orders initialPreset="paid" [presets]="presets" [savePresetEnabled]="true" />`,
    ),
  }),
};

export const Query: Story = {
  parameters: scenario('query'),
  render: () => ({
    props: DATA,
    template: one(
      'queryDelay="120" · shortcut="/"',
      'Type ana: the table responds 120ms after the last key. Escape clears. Press / outside a field and focus goes to the search.',
      `<sl-filter-bar-orders [initial]="null" [queryDelay]="120" shortcut="/" [withTable]="true" />`,
    ),
  }),
};

export const Url: Story = {
  parameters: scenario('url'),
  render: () => ({
    props: DATA,
    template: one(
      'The query string under the bar',
      'Each edit rewrites ?f=and(…)&q=; the line below is what fromFilterBarParams reads back.',
      `<sl-filter-bar-orders initialQuery="ana" [withParams]="true" />`,
    ),
  }),
};

export const Count: Story = {
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: scenario('count'),
  render: () => ({
    props: DATA,
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        '128 de 3.412',
        'The figures follow the language in force — pt-BR separates thousands with a dot. The part is aria-live: a change in the filter is heard as its effect.',
        `<sl-filter-bar-themed [count]="128" [fields]="fields" [total]="3412" [value]="paidOver100" />`,
      )}
      ${scene(
        'loading',
        'The count gives way to the spinner and aria-busy; the controls stay, Apply turns off.',
        `<sl-filter-bar-themed [count]="128" [fields]="fields" [loading]="true" [total]="3412" [value]="paidOver100" />`,
      )}
    </div>`,
  }),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => ({
    props: DATA,
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'The bar on a phone',
        'In a 375px room the bar is a sliding row: Filters (n), the chips — each with the field, the value with the words of the operator and the X — and the empty pills. The chip cut at the edge says the row continues; tapping a value opens the builder with the card of that rule open.',
        `<div class="slotted-demo-room" data-room="phone">
          <div class="slotted-demo-viewport" data-scroll data-size="tall">
            <sl-filter-bar-orders [initial]="applied" [withTable]="true" />
          </div>
        </div>`,
      )}
      ${scene(
        'The builder on a phone',
        'Under 30rem the builder lists cards: the phrase of each rule and the X; tapping the phrase opens the card and stacks field, operator and value at full width, one at a time. A nested group is a rail on the edge, not a box.',
        `<div class="slotted-demo-room" data-room="phone">
          <div class="slotted-demo-viewport" data-size="screen" #phone>
            <sl-filter-bar-orders [container]="phone" [initial]="nested" [initialOpen]="true" />
          </div>
        </div>`,
      )}
    </div>`,
  }),
};

export const Sticky: Story = {
  parameters: scenario('sticky'),
  render: () => ({
    props: DATA,
    template: one(
      'sticky over a long list',
      'Scroll inside the stage: the bar sticks to the top of the scroller and the table passes under it.',
      `<div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
        <div class="slotted-demo-stack">
          <sl-filter-bar-orders [initial]="null" [sticky]="true" />
          <sl-filter-bar-orders-table [rows]="tripled" />
        </div>
      </div>`,
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: DATA,
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'disabled',
        'All controls off; the width is kept.',
        `<sl-filter-bar-themed [count]="128" [disabled]="true" [fields]="fields" [total]="3412" [value]="paidOver100" />`,
      )}
      ${scene(
        'loading',
        'The controls stay; the count is a spinner.',
        `<sl-filter-bar-themed [count]="128" [fields]="fields" [loading]="true" [total]="3412" [value]="paidOver100" />`,
      )}
      ${scene(
        'readOnly',
        'Every condition reachable by the arrows and readable; none can be changed. No X, add, clear or empty pills; the segments carry aria-disabled and the toolbar says Read only.',
        `<sl-filter-bar-themed [count]="128" [fields]="fields" [readOnly]="true" [total]="3412" [value]="paidOver100" />`,
      )}
      ${scene(
        'Required without value',
        'Company, required, is a dashed chip with no X while it has no value; press Apply and it refuses, carries data-invalid and the danger edge, and the refusal is announced.',
        `<sl-filter-bar-themed apply="manual" [fields]="companyEmptyFields" [value]="companyEmpty" />`,
      )}
    </div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: DATA,
    template: `<div class="slotted-demo-grid" data-columns="1">
      ${scene(
        'A sentence of eleven values, and an unknown field',
        'The Tags chip truncates at 18rem and carries the whole sentence in the title; the region chip, a field the application does not declare, becomes invalid and removable.',
        `<sl-filter-bar-themed [fields]="longFields" [value]="longAndUnknown" />`,
      )}
      ${scene(
        'dir=rtl',
        'The Arabic label sits beside the ISO date without reordering it: name and phrase are two isolated runs.',
        `<div dir="rtl"><sl-filter-bar-themed [fields]="arabicFields" [value]="arabic" /></div>`,
      )}
    </div>`,
  }),
};

export const Keyboard: Story = {
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],
    }),
  ],
  parameters: scenario('keyboard'),
  render: () => ({
    props: {
      ...DATA,
      /* Read when the bar binds, once the preview that carries the theme is on the page. */
      get themeRoot() {
        return document.querySelector('[data-slotted-theme]');
      },
    },
    template: one(
      'Tab three times, arrows, Delete',
      'Tab: search, toolbar, chips. Arrows between the pills; Enter opens; on the chips, Delete removes and focus moves to the next.',
      `<div slFilterBar [container]="themeRoot" count="3" [fields]="fields" total="8" [value]="applied" [messages]="{ search: 'Search orders' }">
        <sl-select slFilterBarEnd aria-label="Sort" size="md" value="recent" [items]="[{ label: 'Most recent', value: 'recent' }]">
          <sl-select-item value="recent">Mais recentes</sl-select-item>
        </sl-select>
      </div>`,
    ),
  }),
};
