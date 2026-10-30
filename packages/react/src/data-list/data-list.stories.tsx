import { COMPACT_BELOW, createWidthGate } from '@slotted/core/measure';
import { emptyQuery, type GridQuery } from '@slotted/core/grid';
import type { FilterGroup } from '@slotted/core/filter';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ellipsis } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, IconButton } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { FilterBar } from '../filter-bar';
import type { FilterBarField } from '../filter-bar';
import { SlottedProvider } from '../i18n';
import { Segment, SegmentedControl } from '../segmented-control';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
  TableSelect,
  TableSelectAll,
  TableSort,
} from '../table';
import type { TableSortDescriptor } from '../table';
import { DataList } from './data-list';
import {
  ACCOUNTS,
  AccountAvatar,
  COLUMNS,
  money,
  Phone,
  StatusBadge,
  Tablet,
  type Account,
} from './data-list-demo';
import { REACT_DATA_LIST_DOCS, REACT_DATA_LIST_TOKENS } from './data-list.docs';
import type {
  DataListCellContext,
  DataListHandle,
  DataListProps,
  DataListSelection,
} from './data-list.types';

/** Status as a badge and the row's menu as a glyph button: what an application draws. */
function renderCell({ column, row }: DataListCellContext<Account>) {
  if (column.id === 'status') return <StatusBadge status={row.status} />;
  if (column.id === 'actions') {
    return (
      <IconButton aria-label={`Actions for ${row.name}`} size="sm" tone="secondary" variant="ghost">
        <Ellipsis aria-hidden size={16} />
      </IconButton>
    );
  }
  return undefined;
}

const LIST: Pick<
  DataListProps<Account>,
  'columns' | 'label' | 'locale' | 'renderCell' | 'rowKey' | 'rows' | 'subtitle' | 'trailing'
> = {
  columns: COLUMNS,
  label: 'Accounts',
  locale: 'en-US',
  renderCell,
  rowKey: 'id',
  rows: ACCOUNTS,
  subtitle: 'email',
  trailing: 'balance',
};

const describeQuery = (query: GridQuery) =>
  [
    query.sort.length > 0
      ? `sort ${query.sort.map((key) => `${key.column} ${key.direction}`).join(', ')}`
      : 'no sort',
    query.search === '' ? null : `search “${query.search}”`,
    query.filter === null ? null : 'a filter',
  ]
    .filter(Boolean)
    .join(' · ');

const describeSelection = (value: DataListSelection) =>
  Array.isArray(value) && value.length > 0 ? `chosen: ${value.join(', ')}` : 'nothing chosen';

function PlaygroundList(props: Partial<DataListProps<Account>>) {
  const [query, setQuery] = useState<GridQuery>(emptyQuery());
  const [value, setValue] = useState<DataListSelection>([]);
  return (
    <Phone>
      <DataList
        {...LIST}
        onQueryChange={setQuery}
        onValueChange={setValue}
        query={query}
        renderMedia={(account) => <AccountAvatar account={account} />}
        selectionMode="multiple"
        value={value}
        {...props}
      />
      <p className="slotted-demo-scene__note">
        {describeQuery(query)} — {describeSelection(value)}
      </p>
    </Phone>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATA_LIST_DOCS.dataList.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    fields: Fields,
    activation: Activation,
    selection: Selection,
    sorting: Sorting,
    filtering: Filtering,
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

const meta = {
  title: 'Components/DataList',
  args: { columns: COLUMNS, rowKey: 'id', rows: ACCOUNTS } as never,
  component: DataList,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Data List',
        description:
          'A small tabular set drawn as records where a table does not fit: a phone, a drawer, the master column of a master–detail. Each record is a list item with a title, a subtitle, a trailing figure and its fields by priority as labelled pairs. It reads the column model and the query data-grid reads, and it binds no arrow key.',
        framework: 'React',
        ...REACT_DATA_LIST_DOCS.dataList,
        tokens: REACT_DATA_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => <PlaygroundList />,
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Phone>
      <DataList
        {...LIST}
        defaultValue={['acme']}
        href={(account) => `#accounts/${account.id}`}
        renderMedia={(account) => <AccountAvatar account={account} />}
        rows={ACCOUNTS.slice(0, 2)}
        selectionMode="multiple"
      />
    </Phone>
  ),
};

export const Fields: Story = {
  parameters: scenario('fields'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="375 pixels"
        note="One pair a line: the label beside the value, the priority order top to bottom."
      >
        <Phone>
          <DataList {...LIST} fields={6} rows={ACCOUNTS.slice(2, 3)} />
        </Phone>
      </Scene>
      <Scene
        label="640 pixels"
        note="Two and three columns of label over value, under the title and the balance alike."
      >
        <Tablet>
          <DataList {...LIST} fields={6} rows={ACCOUNTS.slice(2, 3)} />
        </Tablet>
      </Scene>
    </Grid>
  ),
};

export const Activation: Story = {
  parameters: scenario('activation'),
  render: function Render() {
    const [open, setOpen] = useState<string | null>('cobalt');
    return (
      <Grid columns={1}>
        <Scene
          label="A link"
          note="The whole record is the link’s target; the current record is the one open beside the list."
        >
          <Phone>
            <DataList
              {...LIST}
              current={open}
              href={(account) => `#accounts/${account.id}`}
              rows={ACCOUNTS.slice(0, 3)}
            />
          </Phone>
        </Scene>
        <Scene
          label="A command"
          note="activatable makes the title a button; pressing a record makes it current here."
        >
          <Phone>
            <DataList
              {...LIST}
              activatable
              current={open}
              onActivate={({ key }) => setOpen(key)}
              rows={ACCOUNTS.slice(0, 3)}
            />
          </Phone>
        </Scene>
        <Scene
          label="Only read"
          note="Neither href nor activatable: the title is text and the record answers no pointer."
        >
          <Phone>
            <DataList {...LIST} rows={ACCOUNTS.slice(0, 2)} />
          </Phone>
        </Scene>
      </Grid>
    );
  },
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Multiple"
        note="Select one, then Shift and another: every record between them joins. Select-all covers the six."
      >
        <PlaygroundList />
      </Scene>
      <Scene label="Single" note="One key or none; no select-all, the same checkbox table draws.">
        <Phone>
          <DataList
            {...LIST}
            defaultValue="estrela"
            rows={ACCOUNTS.slice(3, 6)}
            selectionMode="single"
          />
        </Phone>
      </Scene>
    </Grid>
  ),
};

export const Sorting: Story = {
  parameters: scenario('sorting'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="From the menu"
        note="Open Sort and choose Balance, then Descending: the records reorder and the trigger names the key."
      >
        <PlaygroundList />
      </Scene>
      <Scene
        label="Two keys from data-grid"
        note="A query sorted by status then balance: the trigger reads +1 and its name says the whole order."
      >
        <Phone>
          <DataList
            {...LIST}
            defaultQuery={{
              ...emptyQuery(),
              sort: [
                { column: 'status', direction: 'ascending' },
                { column: 'balance', direction: 'descending' },
              ],
            }}
          />
        </Phone>
      </Scene>
    </Grid>
  ),
};

const FILTER_FIELDS: FilterBarField[] = [
  {
    key: 'status',
    label: 'Status',
    kind: 'set',
    pinned: true,
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'On hold', label: 'On hold' },
      { value: 'Churned', label: 'Churned' },
    ],
  },
  { key: 'region', label: 'Region', kind: 'text' },
  { key: 'balance', label: 'Balance', kind: 'number' },
];

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: function Render() {
    const [query, setQuery] = useState<GridQuery>(emptyQuery());
    return (
      <Phone>
        <FilterBar
          fields={FILTER_FIELDS}
          onQueryChange={(search) => setQuery((current) => ({ ...current, search }))}
          onValueChange={(filter: FilterGroup | null) =>
            setQuery((current) => ({ ...current, filter }))
          }
          query={query.search}
          value={query.filter}
        />
        <DataList {...LIST} onQueryChange={setQuery} query={query} />
      </Phone>
    );
  },
};

export const Grouping: Story = {
  parameters: scenario('grouping'),
  render: () => (
    <Phone>
      <DataList {...LIST} defaultQuery={{ ...emptyQuery(), group: ['status'] }} />
    </Phone>
  ),
};

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: function Render() {
    const [open, setOpen] = useState<readonly string[]>(['cobalt']);
    return (
      <Phone>
        <DataList
          {...LIST}
          expanded={open}
          fields={2}
          onExpandedChange={setOpen}
          rows={ACCOUNTS.slice(0, 3)}
        />
        <p className="slotted-demo-scene__note">
          open: {open.length === 0 ? 'none' : open.join(', ')}
        </p>
      </Phone>
    );
  },
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Phone>
      <DataList
        {...LIST}
        activatable
        current="cobalt"
        defaultValue={['acme']}
        disabledKeys={['dunmore']}
        loadingKeys={['borealis']}
        rows={ACCOUNTS.slice(0, 4)}
        selectionMode="multiple"
      />
    </Phone>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The first load"
        note="No rows yet: two records drawn as their anatomy, the field labels real and the bars uneven."
      >
        <Phone>
          <DataList {...LIST} loading loadingDelay={0} rows={[]} skeletonRows={2} />
        </Phone>
      </Scene>
      <Scene
        label="A refresh"
        note="Rows already shown stay and recede while the new ones load; nothing moves."
      >
        <Phone>
          <DataList {...LIST} loading rows={ACCOUNTS.slice(0, 2)} />
        </Phone>
      </Scene>
    </Grid>
  ),
};

export const EmptyAndError: Story = {
  parameters: scenario('empty-and-error'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Empty"
        note="No accounts at all: the state says so and offers nothing to clear."
      >
        <Phone>
          <DataList {...LIST} rows={[]} />
        </Phone>
      </Scene>
      <Scene
        label="No results"
        note="The search left nothing: Clear filters empties the filter and the search in one change."
      >
        <Phone>
          <DataList {...LIST} defaultQuery={{ ...emptyQuery(), search: 'Oslo' }} />
        </Phone>
      </Scene>
      <Scene
        label="Error"
        note="The request failed: Try again calls onRetry; rows already shown would stay under the message."
      >
        <Phone>
          <DataList {...LIST} error onRetry={() => undefined} rows={[]} />
        </Phone>
      </Scene>
    </Grid>
  ),
};

export const LoadMore: Story = {
  parameters: scenario('load-more'),
  render: function Render() {
    const [count, setCount] = useState(2);
    const [loading, setLoading] = useState(false);
    const more = () => {
      setLoading(true);
      window.setTimeout(() => {
        setCount((current) => Math.min(current + 2, ACCOUNTS.length));
        setLoading(false);
      }, 900);
    };
    return (
      <Phone>
        <DataList
          {...LIST}
          hasMore={count < ACCOUNTS.length}
          loading={loading}
          onLoadMore={more}
          rows={ACCOUNTS.slice(0, count)}
          totalCount={ACCOUNTS.length}
        />
      </Phone>
    );
  },
};

function AccountsTable({
  onSortChange,
  onValueChange,
  sort,
  value,
}: {
  onSortChange: (sort: TableSortDescriptor | null) => void;
  onValueChange: (value: readonly string[]) => void;
  sort: TableSortDescriptor | null;
  value: readonly string[];
}) {
  const rows = [...ACCOUNTS].sort((a, b) => {
    if (sort === null) return 0;
    const key = sort.column as keyof Account;
    const order = String(a[key]).localeCompare(String(b[key]), 'en', { numeric: true });
    return sort.direction === 'ascending' ? order : -order;
  });
  return (
    <Table
      columns={5}
      onSortChange={onSortChange}
      onValueChange={(next) => onValueChange(next as readonly string[])}
      selectionMode="multiple"
      sort={sort}
      value={value}
    >
      <TableContent>
        <TableHead>
          <TableRow>
            <TableSelectAll />
            <TableColumnHeader column="name">
              <TableSort>Account</TableSort>
            </TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader>Owner</TableColumnHeader>
            <TableColumnHeader column="balance" numeric>
              <TableSort>Balance</TableSort>
            </TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((account) => (
            <TableRow key={account.id} value={account.id}>
              <TableSelect />
              <TableRowHeader>{account.name}</TableRowHeader>
              <TableCell>
                <StatusBadge status={account.status} />
              </TableCell>
              <TableCell>{account.owner ?? '—'}</TableCell>
              <TableCell numeric>{money(account.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}

export const WithTable: Story = {
  parameters: scenario('with-table'),
  render: function Render() {
    const frame = useRef<HTMLDivElement>(null);
    const [room, setRoom] = useState<'laptop' | 'phone'>('laptop');
    const [compact, setCompact] = useState(false);
    const [sort, setSort] = useState<TableSortDescriptor | null>({
      column: 'balance',
      direction: 'descending',
    });
    const [chosen, setChosen] = useState<readonly string[]>(['cobalt']);
    useEffect(() => {
      if (!frame.current) return undefined;
      const gate = createWidthGate(frame.current, { at: COMPACT_BELOW, onChange: setCompact });
      return gate.destroy;
    }, []);
    return (
      <>
        <SegmentedControl
          aria-label="Room"
          onValueChange={(next) => setRoom(next as 'laptop' | 'phone')}
          value={room}
        >
          <Segment value="laptop">Laptop, 900 pixels</Segment>
          <Segment value="phone">Phone, 375 pixels</Segment>
        </SegmentedControl>
        <div className="slotted-demo-room" data-room={room}>
          <div ref={frame}>
            {compact ? (
              <DataList
                {...LIST}
                onQueryChange={(query) => setSort(query.sort[0] ?? null)}
                onValueChange={(value) => setChosen(value as readonly string[])}
                query={{ ...emptyQuery(), sort: sort ? [sort] : [] }}
                selectionMode="multiple"
                value={chosen}
              />
            ) : (
              <AccountsTable
                onSortChange={setSort}
                onValueChange={setChosen}
                sort={sort}
                value={chosen}
              />
            )}
          </div>
        </div>
      </>
    );
  },
};

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

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
      <Phone>
        <DataList
          {...LIST}
          columns={COLUMNS.map((column) =>
            column.id === 'owner' ? { ...column, label: 'Account manager' } : column,
          )}
          messages={{ count: '{count, plural, one {# account} other {# accounts}}' }}
          rows={LONG}
        />
      </Phone>
    </SlottedProvider>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: function Render() {
    const list = useRef<DataListHandle>(null);
    return (
      <Phone>
        <Button onClick={() => list.current?.focusKey('cobalt')} size="sm" variant="outline">
          Focus Cobalt Studio
        </Button>
        <DataList
          {...LIST}
          fields={2}
          href={(account) => `#accounts/${account.id}`}
          ref={list}
          rows={ACCOUNTS.slice(0, 3)}
          selectionMode="multiple"
        />
      </Phone>
    );
  },
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Phone>
      <h2 className="slotted-demo-scene__label" id="accounts-heading">
        Accounts in Lisbon
      </h2>
      <DataList
        {...LIST}
        href={(account) => `#accounts/${account.id}`}
        labelledBy="accounts-heading"
        rows={ACCOUNTS.filter((account) => account.region === 'Lisbon')}
        selectionMode="multiple"
      />
    </Phone>
  ),
};
