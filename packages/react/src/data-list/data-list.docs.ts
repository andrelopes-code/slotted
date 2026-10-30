import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import dataListTokens from '@slotted/styles/data-list/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATA_LIST_TOKENS = dataListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned DataList decision',
}));

const imports: ReferenceImport = {
  source:
    "import { DataList, DataListDefaultsProvider } from '@slotted/react';\nimport type { GridColumn, GridQuery } from '@slotted/core/grid';",
};

export const DATA_LIST_ANATOMY: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'data-ui="data-list", data-variant, data-size; the query container the fields answer. aria-busy and data-loading while rows already shown are refreshed.',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose:
      'The bar above the set: select-all, the count and the sort control, on the row’s own inset.',
  },
  {
    part: 'select-all',
    element: 'span holding a Checkbox',
    required: false,
    purpose:
      'In selectionMode multiple. Covers every record the query left, indeterminate while some are chosen, with the count in its name.',
  },
  {
    part: 'count',
    element: 'output aria-live="polite"',
    required: true,
    purpose:
      'messages.count, or messages.selectedCount while a selection exists; empty during the first load.',
  },
  {
    part: 'sort',
    element: 'span holding a Button, the Menu trigger',
    required: false,
    purpose:
      'Present when a visible column is sortable. data-direction names the first key’s direction; the chevron turns for ascending.',
  },
  {
    part: 'selection',
    element: 'span in ListItemStart holding a Checkbox',
    required: false,
    purpose:
      'The record’s checkbox, named “Select {title}”. It announces the selection the row paints.',
  },
  {
    part: 'media',
    element: 'span in ListItemStart',
    required: false,
    purpose: 'renderMedia(row): an avatar or a thumbnail, after the checkbox.',
  },
  {
    part: 'title',
    element: 'a | button | span in ListItemLabel',
    required: true,
    purpose:
      'The title column. A link with href, a button with activatable; its ::after covers the record, so the whole row is the target.',
  },
  {
    part: 'fields',
    element: 'dl',
    required: false,
    purpose:
      'The fields by priority, placed in the row’s grid from the text column to its end. Two columns of pairs from 18rem; the label beside the value between 12 and 19rem; over it below 12rem.',
  },
  {
    part: 'field',
    element: 'div',
    required: false,
    purpose: 'One pair: the grouping HTML allows inside a dl.',
  },
  { part: 'field-label', element: 'dt', required: false, purpose: 'The column’s label.' },
  {
    part: 'field-value',
    element: 'dd',
    required: false,
    purpose:
      'renderCell or the formatted text. Wraps, never truncates; data-numeric sets tabular figures.',
  },
  {
    part: 'field-empty',
    element: 'span',
    required: false,
    purpose: 'An absent value: an em dash for the eye and messages.empty for a screen reader.',
  },
  {
    part: 'more',
    element: 'button',
    required: false,
    purpose:
      'When fields past fields exist: “Show 3 more” or “Show less”, aria-expanded, aria-controls naming the dl.',
  },
  {
    part: 'trailing',
    element: 'span in ListItemEnd',
    required: false,
    purpose:
      'The trailing column: the figure read at a glance, in the row’s ink and tabular figures.',
  },
  {
    part: 'empty',
    element: 'div holding a ResultState',
    required: false,
    purpose: 'empty, no-results with Clear filters, or error with Try again.',
  },
  {
    part: 'loader',
    element: 'div holding a SkeletonRegion',
    required: false,
    purpose:
      'The first load: skeletonRows records with the item’s anatomy, real field labels and bars of varied length.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'Under the list, when hasMore or footer is given: load-more and the consumer’s own content.',
  },
  {
    part: 'load-more',
    element: 'span holding a Button',
    required: false,
    purpose: 'With hasMore: calls onLoadMore, and waits with the button’s own loading.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'An account list at a phone’s width: select two records, sort by balance from the menu, open the fields of a record. The line under the list shows the query and the selection the family asked for.',
    snippet: defineSnippet({
      id: 'data-list-react-playground',
      language: 'tsx',
      label: 'Uncontrolled, over the rows and the columns',
      source: `<DataList
  columns={columns}
  label="Accounts"
  rowKey="id"
  rows={accounts}
  selectionMode="multiple"
  subtitle="email"
  trailing="balance"
/>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Anatomy',
    note: 'Every part on one record: the checkbox and the avatar at the start, the title as a link, the subtitle, the balance at the end, four fields, the disclosure for two more, and the row’s actions.',
    snippet: defineSnippet({
      id: 'data-list-react-anatomy',
      language: 'tsx',
      label: 'The columns decide the places',
      source: `const columns: GridColumn<Account>[] = [
  { id: 'name', label: 'Account', rowHeader: true },
  { id: 'email', label: 'Email' },
  { id: 'balance', label: 'Balance', kind: 'number' },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'owner', label: 'Owner', priority: 2 },
  { id: 'actions', label: 'Actions', kind: 'actions' },
];`,
    }),
  },
  {
    id: 'fields',
    title: 'Fields by priority, at three widths',
    note: 'The same record at 375, 640 and 1024 pixels. Priority orders the pairs; a phone gives one pair a line with the label beside the value, a tablet two and three columns of label over value.',
    snippet: defineSnippet({
      id: 'data-list-react-fields',
      language: 'tsx',
      label: 'How many a closed record shows',
      source: `<DataList columns={columns} fields={6} rows={accounts} rowKey="id" label="Accounts" />;`,
    }),
  },
  {
    id: 'activation',
    title: 'A link, a command, or text',
    note: 'With href the title is a link and the whole record is its target; with activatable it is a button that emits onActivate; with neither the record is only read. The current record, open beside the list, carries the neutral ground.',
    snippet: defineSnippet({
      id: 'data-list-react-activation',
      language: 'tsx',
      label: 'One destination per record',
      source: `<DataList current={openId} href={(account) => \`/accounts/\${account.id}\`} {...list} />;
<DataList activatable onActivate={({ key }) => setOpenId(key)} {...list} />;`,
    }),
  },
  {
    id: 'selection',
    title: 'Selection',
    note: 'Multiple: the checkbox in each record, Shift to extend from the anchor, select-all over every record the query left and the count saying how many are chosen. Single holds one key, as table does.',
    snippet: defineSnippet({
      id: 'data-list-react-selection',
      language: 'tsx',
      label: 'The union table holds',
      source: `const [chosen, setChosen] = useState<DataListSelection>([]);

<DataList selectionMode="multiple" value={chosen} onValueChange={setChosen} {...list} />;`,
    }),
  },
  {
    id: 'sorting',
    title: 'Sorting without a header',
    note: 'The sort control is a menu of the sortable columns and a direction. The trigger names the first key; a query sorted by several keys in data-grid shows +1 and the announcement reads the whole order.',
    snippet: defineSnippet({
      id: 'data-list-react-sorting',
      language: 'tsx',
      label: 'The query data-grid holds',
      source: `const [query, setQuery] = useState<GridQuery>(emptyQuery());

<DataList query={query} onQueryChange={(next) => setQuery(next)} {...list} />;`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering with filter-bar and a search field',
    note: 'The list applies query.filter and query.search; the controls that write them are FilterBar and a TextField bound to the same query. Type “lis” to keep the Lisbon accounts.',
    snippet: defineSnippet({
      id: 'data-list-react-filtering',
      language: 'tsx',
      label: 'One query, three families',
      source: `<TextField
  label="Search accounts"
  value={query.search}
  onValueChange={(search) => setQuery({ ...query, search })}
/>;
<DataList query={query} onQueryChange={setQuery} {...list} />;`,
    }),
  },
  {
    id: 'grouping',
    title: 'Groups',
    note: 'query.group becomes list sections, each named by the column, the value and the count. The groups stay open: a list has no collapsible group row.',
    snippet: defineSnippet({
      id: 'data-list-react-grouping',
      language: 'tsx',
      label: 'Grouped by status',
      source: `<DataList defaultQuery={{ ...emptyQuery(), group: ['status'] }} {...list} />;`,
    }),
  },
  {
    id: 'expansion',
    title: 'The fields past the first few',
    note: 'fields sets how many a closed record shows. Show 3 more opens the rest in the same grid, and the expansion is a controlled set of keys like data-grid’s detail.',
    snippet: defineSnippet({
      id: 'data-list-react-expansion',
      language: 'tsx',
      label: 'Controlled expansion',
      source: `<DataList expanded={open} fields={2} onExpandedChange={(keys) => setOpen(keys)} {...list} />;`,
    }),
  },
  {
    id: 'states',
    title: 'Record states',
    note: 'Selected, current, disabled and loading on four records: selected is the accent ground with its edge, current the neutral one, disabled and loading recede and refuse the activation while keeping their width.',
    snippet: defineSnippet({
      id: 'data-list-react-states',
      language: 'tsx',
      label: 'States by key',
      source: `<DataList
  activatable
  current="cobalt"
  disabledKeys={['dunmore']}
  loadingKeys={['borealis']}
  value={['acme']}
  selectionMode="multiple"
  {...list}
/>;`,
    }),
  },
  {
    id: 'loading',
    title: 'The first load, and a refresh',
    note: 'With no rows the loader draws the record’s anatomy: title, subtitle, balance and four fields with their real labels. Over rows already shown a refresh keeps them and dims them; nothing moves.',
    snippet: defineSnippet({
      id: 'data-list-react-loading',
      language: 'tsx',
      label: 'One prop, two waits',
      source: `<DataList loading={isFetching} rows={data ?? []} {...list} />;`,
    }),
  },
  {
    id: 'empty-and-error',
    title: 'Empty, no results, error',
    note: 'Three states, each with its own next step: nothing yet, a query that left nothing and offers Clear filters, and a failure that offers Try again.',
    snippet: defineSnippet({
      id: 'data-list-react-empty',
      language: 'tsx',
      label: 'The family knows which of the three it is',
      source: `<DataList error={failed} onRetry={refetch} rows={rows} {...list} />;`,
    }),
  },
  {
    id: 'load-more',
    title: 'Load more',
    note: 'With hasMore the footer asks for the next page through onLoadMore; the button carries the wait and the list stays readable. The count says how many exist when the server gives totalCount.',
    snippet: defineSnippet({
      id: 'data-list-react-load-more',
      language: 'tsx',
      label: 'A server page at a time',
      source: `<DataList
  hasMore={page.hasMore}
  loading={isFetching}
  onLoadMore={fetchNext}
  rows={page.rows}
  totalCount={page.total}
  {...list}
/>;`,
    }),
  },
  {
    id: 'with-table',
    title: 'Beside table, on one state',
    note: 'createWidthGate at COMPACT_BELOW swaps table and data-list over the same sort and selection. Resize the room: under 600 pixels the list takes over and the chosen accounts stay chosen.',
    snippet: defineSnippet({
      id: 'data-list-react-with-table',
      language: 'tsx',
      label: 'The table’s single sort key is the query’s first',
      source: `useEffect(() => {
  const gate = createWidthGate(frame.current!, { at: COMPACT_BELOW, onChange: setCompact });
  return gate.destroy;
}, []);

return (
  <div ref={frame}>
    {compact ? (
      <DataList query={{ ...query, sort: sort ? [sort] : [] }} value={chosen} {...list} />
    ) : (
      <Table selectionMode="multiple" sort={sort} value={chosen}>
        {rows}
      </Table>
    )}
  </div>
);`,
    }),
  },
  {
    id: 'content',
    title: 'Content the columns did not plan for',
    note: 'A title in two lines, an address with no break in it, labels a translation made long and a value in another script: the pairs wrap, nothing is cut, and the Arabic value takes its own direction.',
    snippet: defineSnippet({
      id: 'data-list-react-content',
      language: 'tsx',
      label: 'Words and plurals in the application’s language',
      // language: pt-BR
      source: `<SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
  <DataList {...list} messages={{ count: '{count, plural, one {# conta} other {# contas}}' }} />
</SlottedProvider>;`,
      // language: en-US
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab moves through select-all, the sort trigger, then each record’s checkbox, title, disclosure and actions. Space toggles a checkbox, Shift+Space extends from the anchor, Enter follows the title. No arrow key is bound.',
    snippet: defineSnippet({
      id: 'data-list-react-keyboard',
      language: 'tsx',
      label: 'Focus a record from outside',
      source: `const list = useRef<DataListHandle>(null);

list.current?.focusKey('cobalt');`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The list is named Accounts; each record is a list item whose title is its link; the checkbox is named Select and the title; the count and the sort order are announced politely.',
    snippet: defineSnippet({
      id: 'data-list-react-accessibility',
      language: 'tsx',
      label: 'A name for the set',
      source: `<h2 id="accounts-heading">Accounts</h2>;
<DataList labelledBy="accounts-heading" {...list} />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onQueryChange',
    payload: '(query: GridQuery, request: { value, previous, reason, change, source, cancel() })',
    when: 'Before the query moves: sort from the menu (pointer, keyboard), filter from Clear filters (clear). change names the part: sort | filter | search | page | group. cancel() refuses it; not emitted for an equal query.',
  },
  {
    name: 'onValueChange',
    payload: '(value: string | null | readonly string[], request: ChangeRequest)',
    when: 'Before the selection moves: a checkbox (pointer, keyboard), Shift from the anchor or select-all (select), select-all clearing (clear).',
  },
  {
    name: 'onExpandedChange',
    payload: '(expanded: readonly string[], request: { key, reason, … })',
    when: 'Before a record’s fields open or close, from its more button.',
  },
  {
    name: 'onActivate',
    payload: '({ key, row, reason: "pointer" | "keyboard", event })',
    when: 'After the title is pressed: a button with activatable, or a link with href before it navigates. Not for a disabled or loading record.',
  },
  { name: 'onLoadMore', payload: '()', when: 'The load-more button in the footer was pressed.' },
  { name: 'onRetry', payload: '()', when: 'Try again in the error state was pressed.' },
];

export const REACT_DATA_LIST_DOCS = {
  dataList: {
    imports,
    anatomy: DATA_LIST_ANATOMY,
    scenes,
    events,
    api: apiRows([
      ['rows', 'readonly Row[]', '—', 'DataList', 'The consumer’s array, read every render'],
      [
        'rowKey',
        'keyof Row | (row) => string',
        '—',
        'DataList',
        'Names every record in every state model',
      ],
      [
        'columns',
        'readonly GridColumn<Row>[]',
        '—',
        'DataList',
        'The model data-grid, column-manager and saved-views read',
      ],
      [
        'columnState',
        'Partial<GridColumnState>',
        '—',
        'DataList',
        'Order and hidden columns; widths and pins are ignored',
      ],
      ['title', 'string', 'rowHeader column', 'DataList', 'The title’s column'],
      ['subtitle', 'string', '—', 'DataList', 'The column under the title'],
      ['trailing', 'string', '—', 'DataList', 'The column at the end of the row'],
      [
        'fields',
        'number',
        '4',
        'DataList, DataListDefaultsProvider',
        'How many fields a closed record shows',
      ],
      ['label', 'string', '—', 'DataList', 'The list’s accessible name'],
      ['labelledBy', 'string', '—', 'DataList', 'The id of the element that names the list'],
      [
        'query',
        'GridQuery',
        '—',
        'DataList',
        'Present means the consumer owns sort, filter, search, page and group',
      ],
      [
        'defaultQuery',
        'GridQuery',
        'emptyQuery()',
        'DataList',
        'The query an uncontrolled instance starts from, read once',
      ],
      [
        'mode',
        '"client" | "server"',
        'client',
        'DataList',
        'client applies the query; server draws the rows given. server when totalCount is given',
      ],
      [
        'totalCount',
        'number',
        '—',
        'DataList',
        'The server’s total, for the count and server mode',
      ],
      [
        'selectionMode',
        '"none" | "single" | "multiple"',
        'none',
        'DataList, DataListDefaultsProvider',
        'A checkbox per record in single and multiple',
      ],
      [
        'value',
        'string | null | readonly string[]',
        '—',
        'DataList',
        'Present means the consumer owns the selection',
      ],
      [
        'defaultValue',
        'string | null | readonly string[]',
        'null or []',
        'DataList',
        'The selection an uncontrolled instance starts from',
      ],
      [
        'expanded',
        'readonly string[]',
        '—',
        'DataList',
        'Present means the consumer owns which records show every field',
      ],
      [
        'defaultExpanded',
        'readonly string[]',
        '[]',
        'DataList',
        'The expansion an uncontrolled instance starts from',
      ],
      [
        'disabledKeys',
        'readonly string[]',
        '[]',
        'DataList',
        'Records that refuse selection and activation',
      ],
      [
        'loadingKeys',
        'readonly string[]',
        '[]',
        'DataList',
        'Records busy with an action: aria-busy, activation refused',
      ],
      [
        'current',
        'string | null',
        '—',
        'DataList',
        'The record open beside the list; aria-current on its row',
      ],
      ['href', '(row) => string', '—', 'DataList', 'Makes the title a link'],
      [
        'activatable',
        'boolean',
        'false',
        'DataList',
        'Makes the title a button that emits onActivate',
      ],
      [
        'loading',
        'boolean',
        'false',
        'DataList',
        'The skeleton with no rows, a dimmed refresh over rows, the load-more wait',
      ],
      [
        'error',
        'boolean | string | null',
        '—',
        'DataList',
        'The error state; a string replaces messages.errorTitle',
      ],
      ['hasMore', 'boolean', 'false', 'DataList', 'Shows load-more in the footer'],
      [
        'variant',
        '"plain" | "ruled" | "framed"',
        'ruled',
        'DataList, DataListDefaultsProvider',
        'The list’s variant, handed to every record',
      ],
      [
        'size',
        '"sm" | "md" | "lg"',
        'md',
        'DataList, DataListDefaultsProvider',
        'The record’s control step',
      ],
      [
        'skeletonRows',
        'number',
        '5',
        'DataList, DataListDefaultsProvider',
        'Records the first-load skeleton draws',
      ],
      [
        'loadingDelay',
        'number',
        '200',
        'DataList, DataListDefaultsProvider',
        'Milliseconds before the skeleton appears',
      ],
      [
        'loadingMinDuration',
        'number',
        '400',
        'DataList, DataListDefaultsProvider',
        'Milliseconds the skeleton stays once drawn',
      ],
      [
        'messages',
        'Partial<DataListMessages>',
        '—',
        'DataList',
        'Words laid over the language in force, key by key; count and selectAll are plural messages',
      ],
      [
        'locale',
        'string',
        'the provider’s',
        'DataList',
        'Formats values, group counts and the sort',
      ],
      [
        'renderCell',
        '(context) => ReactNode',
        '—',
        'DataList',
        'Draws a value: { column, row, key, value, text, place }; undefined keeps the text',
      ],
      [
        'renderMedia',
        '(row) => ReactNode',
        '—',
        'DataList',
        'The picture at the start of a record',
      ],
      [
        'renderEmpty',
        '(status) => ReactNode',
        '—',
        'DataList',
        'Replaces empty, no-results or error',
      ],
      [
        'footer',
        'ReactNode',
        '—',
        'DataList',
        'Under the list, beside load-more: a Pagination on the same query',
      ],
      [
        'ref',
        'Ref<DataListHandle>',
        '—',
        'DataList',
        'root, focus(), focusKey(key), scrollToKey(key)',
      ],
      [
        'native props',
        'ComponentPropsWithoutRef<"div">',
        '—',
        'DataList',
        'id, className, data-*, aria-* and handlers reach the root; onBlur composes with the family’s own',
      ],
    ]),
    accessibility: [
      'No Authoring Practices pattern covers a list of records, so the family is list’s role="list" of list items, named by label or labelledBy, and every control in it is native: a checkbox, a link or a button, the disclosure pattern for more and the menu button pattern for sort.',
      'The title is the record’s link or button and its name is the title alone; the fields sit outside it as a dl, because a dl may not sit inside a button and a link named by every field is a sentence. The checkbox is named “Select {title}” and announces the selection the row paints — aria-selected is not valid on listitem.',
      'No arrow key is bound: role="list" admits none and the scope refuses grid navigation. Tab reaches each control in reading order; data-grid is the family for a cell cursor. When the focused record is removed, focus moves to the next record, the previous one, or the empty state.',
      'The count is an output announced politely; a sort announces the whole order through the shared live announcer. The first load is a skeleton region with one polite announcement and aria-busy, and an absent value reads messages.empty beside the dash a sighted reader sees.',
    ],
    snippets: [
      defineSnippet({
        id: 'data-list-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="data-list" data-part="root" data-variant="ruled" data-size="md">
  <div data-part="header">
    <span data-part="select-all">…</span>
    <output data-part="count">1 of 6 selected</output>
    <span data-part="sort" data-direction="ascending">
      …
    </span>
  </div>
  <ul data-ui="list" role="list" aria-label="Accounts">
    <li data-ui="list-item" data-part="root" data-align="start" data-selected>
      <div data-part="content">
        <div data-part="start">
          <span data-part="selection">…</span>
          <span data-part="media">…</span>
        </div>
        <div data-part="body">
          <div data-part="label">
            <a data-part="title" href="/accounts/acme">
              Acme Logistics
            </a>
          </div>
          <div data-part="description">ops@acme.example</div>
        </div>
        <div data-part="end">
          <span data-part="trailing">$12,480.00</span>
        </div>
        <dl data-part="fields" id="…">
          <div data-part="field">
            <dt data-part="field-label">Owner</dt>
            <dd data-part="field-value">Marta Silva</dd>
          </div>
        </dl>
        <button data-part="more" aria-expanded="false" aria-controls="…">
          Show 2 more
        </button>
      </div>
      <div data-part="actions">…</div>
    </li>
  </ul>
</div>;`,
      }),
      defineSnippet({
        id: 'data-list-theming',
        language: 'css',
        label: 'Retuning the records for an application',
        source: `[data-ui='data-list'] {
  --slotted-control-padding-inline-md: var(--slotted-space-6);
}`,
      }),
    ],
  },
} as const;
