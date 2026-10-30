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

export const ANGULAR_DATA_LIST_TOKENS = dataListTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlDataList decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlDataList,\n  SlDataListCellTemplate,\n  SlDataListFooter,\n  SlDataListMediaTemplate,\n  provideDataListDefaults,\n} from '@slotted/angular/data-list';\nimport type { GridColumn, GridQuery } from '@slotted/core/grid';",
  selector: 'sl-data-list',
  exportAs: 'slDataList',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-data-list',
    required: true,
    purpose:
      'The host: data-ui="data-list", data-variant, data-size; the query container the fields answer. aria-busy and data-loading while rows already shown are refreshed.',
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
    element: 'span holding [slCheckbox]',
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
    element: 'span holding button[slButton][slMenuTriggerFor]',
    required: false,
    purpose:
      'Present when a visible column is sortable. data-direction names the first key’s direction; the chevron turns for ascending.',
  },
  {
    part: 'selection',
    element: 'span in [slListItemStart] holding [slCheckbox]',
    required: false,
    purpose:
      'The record’s checkbox, named “Select {title}”. It announces the selection the row paints.',
  },
  {
    part: 'media',
    element: 'span in [slListItemStart]',
    required: false,
    purpose:
      'ng-template[slDataListMedia] for the row: an avatar or a thumbnail, after the checkbox.',
  },
  {
    part: 'title',
    element: 'a | button | span in [slListItemLabel]',
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
      'ng-template[slDataListCell] or the formatted text. Wraps, never truncates; data-numeric sets tabular figures.',
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
    element: 'span in [slListItemEnd]',
    required: false,
    purpose:
      'The trailing column: the figure read at a glance, in the row’s ink and tabular figures.',
  },
  {
    part: 'empty',
    element: 'div holding section[slResultState]',
    required: false,
    purpose:
      'empty, no-results with Clear filters, or error with Try again; ng-template[slDataListEmpty] replaces it.',
  },
  {
    part: 'loader',
    element: 'div holding div[slSkeletonRegion]',
    required: false,
    purpose:
      'The first load: skeletonRows records with the item’s anatomy, real field labels and bars of varied length.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'Under the list, when hasMore or [slDataListFooter] content is given: load-more and that content.',
  },
  {
    part: 'load-more',
    element: 'span holding button[slButton]',
    required: false,
    purpose: 'With hasMore: emits loadMore, and waits with the button’s own loading.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'An account list at a phone’s width: select two records, sort by balance from the menu, open the fields of a record. The line under the list shows the query and the selection bound in both directions.',
    snippet: defineSnippet({
      id: 'data-list-angular-playground',
      language: 'angular',
      label: 'Two-way over the query and the selection',
      source: `<sl-data-list
  label="Accounts"
  rowKey="id"
  selectionMode="multiple"
  subtitle="email"
  trailing="balance"
  [columns]="columns"
  [rows]="accounts"
  [(query)]="query"
  [(value)]="chosen"
/>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Anatomy',
    note: 'Every part on one record: the checkbox and the avatar at the start, the title as a link, the subtitle, the balance at the end, four fields, the disclosure for more, and the row’s actions.',
    snippet: defineSnippet({
      id: 'data-list-angular-anatomy',
      language: 'angular',
      label: 'Templates draw a value, the columns decide where',
      source: `<sl-data-list label="Accounts" rowKey="id" [columns]="columns" [rows]="accounts">
  <ng-template slDataListMedia let-account>
    <span slAvatar size="sm" [name]="account.name"></span>
  </ng-template>
  <ng-template slDataListCell="status" let-row>
    <span slBadge size="sm">{{ row.status }}</span>
  </ng-template>
</sl-data-list>`,
    }),
  },
  {
    id: 'fields',
    title: 'Fields by priority, at two widths',
    note: 'The same record at 375 and 640 pixels. Priority orders the pairs; a phone gives one pair a line with the label beside the value, a tablet two and three columns of label over value.',
    snippet: defineSnippet({
      id: 'data-list-angular-fields',
      language: 'angular',
      label: 'How many a closed record shows',
      source: `<sl-data-list label="Accounts" rowKey="id" [columns]="columns" [fields]="6" [rows]="accounts" />`,
    }),
  },
  {
    id: 'activation',
    title: 'A link, a command, or text',
    note: 'With href the title is a link and the whole record is its target; with activatable it is a button that emits activate; with neither the record is only read. The current record carries the neutral ground.',
    snippet: defineSnippet({
      id: 'data-list-angular-activation',
      language: 'angular',
      label: 'One destination per record',
      source: `<sl-data-list activatable [current]="openId()" (activate)="openId.set($event.key)" />`,
    }),
  },
  {
    id: 'selection',
    title: 'Selection',
    note: 'Multiple: the checkbox in each record, Shift to extend from the anchor, select-all over every record the query left and the count saying how many are chosen. Single holds one key, as table does.',
    snippet: defineSnippet({
      id: 'data-list-angular-selection',
      language: 'angular',
      label: 'The union table holds',
      source: `<sl-data-list selectionMode="multiple" [(value)]="chosen" />`,
    }),
  },
  {
    id: 'sorting',
    title: 'Sorting without a header',
    note: 'The sort control is a menu of the sortable columns and a direction. The trigger names the first key; a query sorted by several keys in sl-data-grid shows +1 and the announcement reads the whole order.',
    snippet: defineSnippet({
      id: 'data-list-angular-sorting',
      language: 'angular',
      label: 'The query sl-data-grid holds',
      source: `<sl-data-list [(query)]="query" (queryChangeRequest)="refetch($event.change)" />`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering with a search field',
    note: 'The list applies query.search and query.filter; the control that writes them is the application’s own, bound to the same query. Type “lis” to keep the Lisbon accounts.',
    snippet: defineSnippet({
      id: 'data-list-angular-filtering',
      language: 'angular',
      label: 'One query, two controls',
      source: `<input slTextFieldInput [value]="query().search" (input)="search($event)" />
<sl-data-list [(query)]="query" />`,
    }),
  },
  {
    id: 'grouping',
    title: 'Groups',
    note: 'query.group becomes list sections, each named by the column, the value and the count. The groups stay open: a list has no collapsible group row.',
    snippet: defineSnippet({
      id: 'data-list-angular-grouping',
      language: 'angular',
      label: 'Grouped by status',
      source: `<sl-data-list [query]="{ sort: [], filter: null, search: '', page: null, group: ['status'] }" />`,
    }),
  },
  {
    id: 'expansion',
    title: 'The fields past the first few',
    note: 'fields sets how many a closed record shows. Show 3 more opens the rest in the same grid, and the expansion is a set of keys bound in both directions, like the grid’s detail.',
    snippet: defineSnippet({
      id: 'data-list-angular-expansion',
      language: 'angular',
      label: 'Two-way expansion',
      source: `<sl-data-list [fields]="2" [(expanded)]="open" />`,
    }),
  },
  {
    id: 'states',
    title: 'Record states',
    note: 'Selected, current, disabled and loading on four records: selected is the accent ground with its edge, current the neutral one, disabled and loading recede and refuse the activation while keeping their width.',
    snippet: defineSnippet({
      id: 'data-list-angular-states',
      language: 'angular',
      label: 'States by key',
      source: `<sl-data-list
  activatable
  current="cobalt"
  selectionMode="multiple"
  [disabledKeys]="['dunmore']"
  [loadingKeys]="['borealis']"
  [value]="['acme']"
/>`,
    }),
  },
  {
    id: 'loading',
    title: 'The first load, and a refresh',
    note: 'With no rows the loader draws the record’s anatomy: title, subtitle, balance and four fields with their real labels. Over rows already shown a refresh keeps them and dims them; nothing moves.',
    snippet: defineSnippet({
      id: 'data-list-angular-loading',
      language: 'angular',
      label: 'One input, two waits',
      source: `<sl-data-list [loading]="fetching()" [rows]="accounts() ?? []" />`,
    }),
  },
  {
    id: 'empty-and-error',
    title: 'Empty, no results, error',
    note: 'Three states, each with its own next step: nothing yet, a query that left nothing and offers Clear filters, and a failure that offers Try again.',
    snippet: defineSnippet({
      id: 'data-list-angular-empty',
      language: 'angular',
      label: 'The family knows which of the three it is',
      source: `<sl-data-list [error]="failed()" [rows]="rows()" (retry)="refetch()" />`,
    }),
  },
  {
    id: 'load-more',
    title: 'Load more',
    note: 'With hasMore the footer asks for the next page through loadMore; the button carries the wait and the list stays readable. The count says how many exist when the server gives totalCount.',
    snippet: defineSnippet({
      id: 'data-list-angular-load-more',
      language: 'angular',
      label: 'A server page at a time',
      source: `<sl-data-list
  [hasMore]="page().hasMore"
  [loading]="fetching()"
  [rows]="page().rows"
  [totalCount]="page().total"
  (loadMore)="fetchNext()"
/>`,
    }),
  },
  {
    id: 'with-table',
    title: 'Beside table, on one state',
    note: 'createWidthGate at COMPACT_BELOW swaps the table and the list over the same sort and selection. Choose Phone: under 600 pixels the list takes over and the chosen accounts stay chosen.',
    snippet: defineSnippet({
      id: 'data-list-angular-with-table',
      language: 'angular',
      label: 'The table’s single sort key is the query’s first',
      source: `@if (compact()) {
  <sl-data-list
    [query]="asQuery(sort())"
    [(value)]="chosen"
    (queryChangeRequest)="fromQuery($event)"
  />
} @else {
  <div slTable selectionMode="multiple" [(sort)]="sort" [(value)]="chosen"></div>
}`,
    }),
  },
  {
    id: 'content',
    title: 'Content the columns did not plan for',
    note: 'A title in two lines, an address with no break in it, labels a translation made long and a value in another script: the pairs wrap, nothing is cut, and the Arabic value takes its own direction.',
    snippet: defineSnippet({
      id: 'data-list-angular-content',
      language: 'ts',
      label: 'Words and plurals in the application’s language',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab moves through select-all, the sort trigger, then each record’s checkbox, title, disclosure and actions. Space toggles a checkbox, Shift+Space extends from the anchor, Enter follows the title. No arrow key is bound.',
    snippet: defineSnippet({
      id: 'data-list-angular-keyboard',
      language: 'angular',
      label: 'Focus a record from outside',
      source: `<sl-data-list #accounts="slDataList" />
<button slButton (click)="accounts.focusKey('cobalt')">Focus Cobalt Studio</button>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The list is named by the heading above it; each record is a list item whose title is its link; the checkbox is named Select and the title; the count and the sort order are announced politely.',
    snippet: defineSnippet({
      id: 'data-list-angular-accessibility',
      language: 'angular',
      label: 'A name for the set',
      source: `<h2 id="accounts-heading">Accounts</h2>
<sl-data-list labelledBy="accounts-heading" />`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'queryChangeRequest',
    payload:
      'DataListQueryRequest: { value, previous, reason, change, source, cancelled, cancel() }',
    when: 'Before [(query)] moves: sort from the menu (pointer, keyboard), filter from Clear filters (clear). change names the part: sort | filter | search | page | group. cancel() keeps the query.',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string | null | readonly string[]>',
    when: 'Before [(value)] moves: a checkbox (pointer, keyboard), Shift from the anchor or select-all (select), select-all clearing (clear).',
  },
  {
    name: 'expandedChangeRequest',
    payload: 'DataListExpandedRequest: { value, key, reason, … }',
    when: 'Before [(expanded)] moves, from a record’s more button.',
  },
  {
    name: 'activate',
    payload: '{ key, row, reason: "pointer" | "keyboard", event }',
    when: 'After the title is pressed: a button with activatable, or a link with href before it navigates. Not for a disabled or loading record.',
  },
  { name: 'loadMore', payload: 'void', when: 'The load-more button in the footer was pressed.' },
  { name: 'retry', payload: 'void', when: 'Try again in the error state was pressed.' },
];

export const ANGULAR_DATA_LIST_DOCS = {
  dataList: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['rows', 'readonly Row[]', '—', 'sl-data-list', 'The consumer’s array'],
      [
        'rowKey',
        'keyof Row | (row) => string',
        '—',
        'sl-data-list',
        'Names every record in every state model',
      ],
      [
        'columns',
        'readonly GridColumn<Row>[]',
        '—',
        'sl-data-list',
        'The model sl-data-grid, sl-column-manager and sl-saved-views read',
      ],
      [
        'columnState',
        'Partial<GridColumnState>',
        '—',
        'sl-data-list',
        'Order and hidden columns; widths and pins are ignored',
      ],
      ['title', 'string', 'rowHeader column', 'sl-data-list', 'The title’s column'],
      ['subtitle', 'string', '—', 'sl-data-list', 'The column under the title'],
      ['trailing', 'string', '—', 'sl-data-list', 'The column at the end of the row'],
      [
        'fields',
        'number',
        '4',
        'sl-data-list, provideDataListDefaults',
        'How many fields a closed record shows',
      ],
      [
        'label',
        'string',
        '—',
        'sl-data-list',
        'The list’s accessible name; an aria-label written on the host is read when label is absent',
      ],
      ['labelledBy', 'string', '—', 'sl-data-list', 'The id of the element that names the list'],
      [
        'query',
        'model<GridQuery>',
        'emptyQuery()',
        'sl-data-list',
        'Sort, filter, search, page and group; [(query)] binds it both ways',
      ],
      [
        'mode',
        '"client" | "server"',
        'client',
        'sl-data-list',
        'client applies the query; server draws the rows given. server when totalCount is given',
      ],
      [
        'totalCount',
        'number',
        '—',
        'sl-data-list',
        'The server’s total, for the count and server mode',
      ],
      [
        'selectionMode',
        '"none" | "single" | "multiple"',
        'none',
        'sl-data-list, provideDataListDefaults',
        'A checkbox per record in single and multiple',
      ],
      [
        'value',
        'model<string | null | readonly string[]>',
        'null',
        'sl-data-list',
        'The selection; [(value)] binds it both ways',
      ],
      [
        'expanded',
        'model<readonly string[]>',
        '[]',
        'sl-data-list',
        'Records that show every field; [(expanded)] binds it both ways',
      ],
      [
        'disabledKeys',
        'readonly string[]',
        '[]',
        'sl-data-list',
        'Records that refuse selection and activation',
      ],
      [
        'loadingKeys',
        'readonly string[]',
        '[]',
        'sl-data-list',
        'Records busy with an action: aria-busy, activation refused',
      ],
      [
        'current',
        'string | null',
        '—',
        'sl-data-list',
        'The record open beside the list; aria-current on its row',
      ],
      ['href', '(row) => string', '—', 'sl-data-list', 'Makes the title a link'],
      [
        'activatable',
        'boolean',
        'false',
        'sl-data-list',
        'Makes the title a button that emits activate',
      ],
      [
        'loading',
        'boolean',
        'false',
        'sl-data-list',
        'The skeleton with no rows, a dimmed refresh over rows, the load-more wait',
      ],
      [
        'error',
        'boolean | string | null',
        '—',
        'sl-data-list',
        'The error state; a string replaces messages.errorTitle',
      ],
      ['hasMore', 'boolean', 'false', 'sl-data-list', 'Shows load-more in the footer'],
      [
        'variant',
        '"plain" | "ruled" | "framed"',
        'ruled',
        'sl-data-list, provideDataListDefaults',
        'The list’s variant, handed to every record',
      ],
      [
        'size',
        '"sm" | "md" | "lg"',
        'md',
        'sl-data-list, provideDataListDefaults',
        'The record’s control step',
      ],
      [
        'skeletonRows',
        'number',
        '5',
        'sl-data-list, provideDataListDefaults',
        'Records the first-load skeleton draws',
      ],
      [
        'loadingDelay',
        'number',
        '200',
        'sl-data-list, provideDataListDefaults',
        'Milliseconds before the skeleton appears',
      ],
      [
        'loadingMinDuration',
        'number',
        '400',
        'sl-data-list, provideDataListDefaults',
        'Milliseconds the skeleton stays once drawn',
      ],
      [
        'messages',
        'Partial<DataListMessages>',
        '—',
        'sl-data-list',
        'Words laid over the language in force, key by key; count and selectAll are plural messages',
      ],
      [
        'locale',
        'string',
        'the provider’s',
        'sl-data-list',
        'Formats values, group counts and the sort',
      ],
      [
        'slDataListCell',
        'ng-template',
        '—',
        'content',
        'Draws a column’s value; context { $implicit: row, row, column, key, value, text, place }',
      ],
      [
        'slDataListMedia',
        'ng-template',
        '—',
        'content',
        'The picture at the start of a record; $implicit is the row',
      ],
      [
        'slDataListEmpty',
        'ng-template',
        '—',
        'content',
        'Replaces empty, no-results or error; $implicit is the status',
      ],
      [
        'slDataListFooter',
        'directive',
        '—',
        'content',
        'Content projected into the footer, beside load-more',
      ],
      ['exportAs', 'slDataList', '—', 'sl-data-list', 'focus(), focusKey(key), scrollToKey(key)'],
    ]),
    accessibility: [
      'No Authoring Practices pattern covers a list of records, so the family is list’s role="list" of list items, named by label or labelledBy, and every control in it is native: a checkbox, a link or a button, the disclosure pattern for more and the menu button pattern for sort.',
      'The title is the record’s link or button and its name is the title alone; the fields sit outside it as a dl, because a dl may not sit inside a button and a link named by every field is a sentence. The checkbox is named “Select {title}” and announces the selection the row paints — aria-selected is not valid on listitem.',
      'No arrow key is bound: role="list" admits none and the scope refuses grid navigation. Tab reaches each control in reading order; sl-data-grid is the family for a cell cursor. When the focused record is removed, focus moves to the next record, the previous one, or the empty state.',
      'The count is an output announced politely; a sort announces the whole order through the shared live announcer. The first load is a skeleton region with one polite announcement and aria-busy, and an absent value reads messages.empty beside the dash a sighted reader sees.',
    ],
    snippets: [
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
