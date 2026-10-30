import dataGridTokens from '@slotted/styles/data-grid/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DATA_GRID_TOKENS = dataGridTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Data grid decision',
}));

const imports: ReferenceImport = {
  source:
    "import { DataGrid, DataGridDefaultsProvider, type DataGridColumn } from '@slotted/react';\nimport type { GridColumn, GridQuery, GridColumnState } from '@slotted/core/grid';\nimport { applyQuery, emptyQuery, toGridParams, fromGridParams } from '@slotted/core/grid';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[role="grid"]',
    required: true,
    purpose:
      'The frame and the widget: data-ui="data-grid", every axis, aria-rowcount, aria-colcount, aria-multiselectable, aria-busy, and the column template as --slotted-data-grid-template.',
  },
  {
    part: 'scroll',
    element: 'div',
    required: true,
    purpose:
      'The scroller on both axes, and the window the virtualiser measures. Carries data-overflowing, data-at-start and data-at-end while the columns overflow.',
  },
  {
    part: 'head',
    element: 'div[role="rowgroup"]',
    required: true,
    purpose: 'The header rows, sticky to the top of the scroller by default.',
  },
  {
    part: 'header-row',
    element: 'div[role="row"]',
    required: true,
    purpose: 'One row of the header: the column groups, or the column names.',
  },
  {
    part: 'column-group',
    element: 'div[role="columnheader"]',
    required: false,
    purpose: 'A group heading spanning its columns through aria-colspan.',
  },
  {
    part: 'column-header',
    element: 'div[role="columnheader"]',
    required: true,
    purpose:
      'A column’s name and its controls. Carries aria-sort on the first sort key, data-sorted, data-filtered, data-pinned, data-dragging, data-drop-target and data-resizing. The name truncates, and a name its box cuts opens a hint with the whole of it — shown rather than read, because the header already states the words.',
  },
  {
    part: 'sort',
    element: 'span',
    required: false,
    purpose:
      'The direction mark on a sorted column, with data-index when the order holds more than one key.',
  },
  {
    part: 'column-description',
    element: 'span',
    required: false,
    purpose:
      'The column’s description, visually hidden, referenced by the header’s aria-describedby and by the column menu’s; present whenever the column has a description.',
  },
  {
    part: 'column-actions',
    element: 'span',
    required: false,
    purpose:
      'The slot at the trailing edge holding the column help, the filter trigger and the column menu. F2 on the header enters it, Tab cycles it, Escape leaves it.',
  },
  {
    part: 'column-help',
    element: 'button',
    required: false,
    purpose:
      'The circled question mark on a column with a description or a help node, always shown. Opens a popover by click, Enter or Space — never by hover — holding both.',
  },
  {
    part: 'column-menu',
    element: 'button',
    required: false,
    purpose: 'Opens the column’s menu: sort, filter, pin, fit, fit all, hide, manage.',
  },
  {
    part: 'column-menu-description',
    element: 'div[aria-hidden]',
    required: false,
    purpose:
      'The description again, as a muted caption atop the column menu; hidden from the reader, who hears it once through the menu’s aria-describedby.',
  },
  {
    part: 'resizer',
    element: 'div[aria-hidden]',
    required: false,
    purpose: 'The pointer’s handle on the trailing edge; a double press fits the column.',
  },
  {
    part: 'resize-guide',
    element: 'div[aria-hidden]',
    required: false,
    purpose:
      'The line a drag of the resizer moves by translate across the scroller’s height; the width is applied on release.',
  },
  {
    part: 'drop-indicator',
    element: 'div',
    required: false,
    purpose: 'The line between two columns while one is dragged.',
  },
  {
    part: 'filter-row',
    element: 'div[role="row"]',
    required: false,
    purpose: 'The row under the header, with filterRow, holding one operand per filterable column.',
  },
  {
    part: 'filter-cell',
    element: 'div[role="gridcell"]',
    required: false,
    purpose: 'One cell of the filter row; data-filtered while its column has a rule.',
  },
  {
    part: 'filter',
    element: 'button',
    required: false,
    purpose: 'The funnel on a filtered column, and the shortest way back to its panel.',
  },
  {
    part: 'filter-panel',
    element: 'div',
    required: false,
    purpose:
      'The compact panel in a popover, carrying data-ui itself because it is rendered outside the root.',
  },
  {
    part: 'filter-condition',
    element: 'div',
    required: false,
    purpose: 'One line of the panel: the operator and its operand(s); data-operands says how many.',
  },
  {
    part: 'filter-operator',
    element: 'div',
    required: false,
    purpose: 'The operator chooser: a select in the panel, a symbol button in the row.',
  },
  {
    part: 'filter-operand',
    element: 'div',
    required: false,
    purpose: 'The operand control(s), with data-kind and data-range for a between.',
  },
  {
    part: 'filter-join',
    element: 'div',
    required: false,
    purpose: 'And / Or between the two conditions of the panel.',
  },
  { part: 'filter-actions', element: 'div', required: false, purpose: 'Clear and Apply.' },
  {
    part: 'body',
    element: 'div[role="rowgroup"]',
    required: true,
    purpose: 'The rows; carries the virtual window’s total height and start offset.',
  },
  {
    part: 'pinned-rows',
    element: 'div[role="rowgroup"]',
    required: false,
    purpose: 'Rows held under the head or over the summary, out of the query.',
  },
  {
    part: 'row',
    element: 'div[role="row"]',
    required: true,
    purpose:
      'One record: aria-rowindex, aria-selected, data-selected, data-current, data-expanded, data-editing, data-disabled.',
  },
  {
    part: 'row-header',
    element: 'div[role="rowheader"]',
    required: false,
    purpose:
      'The cell of the column marked rowHeader, which a screen reader repeats for the record.',
  },
  {
    part: 'cell',
    element: 'div[role="gridcell"]',
    required: true,
    purpose:
      'One value: aria-colindex, data-align, data-numeric, data-text, data-pinned, data-current, data-in-range, data-range-edge, data-editing, data-invalid, data-loading, data-readonly.',
  },
  {
    part: 'editor',
    element: 'div',
    required: false,
    purpose: 'The control editing a cell, plain and sm, filling it.',
  },
  {
    part: 'selection',
    element: 'div[role="gridcell"]',
    required: false,
    purpose:
      'The checkbox column, always pinned to the start; in the header it selects every row the query left.',
  },
  {
    part: 'expander',
    element: 'button',
    required: false,
    purpose: 'Opens a row’s detail; aria-expanded and aria-controls.',
  },
  {
    part: 'detail',
    element: 'div[role="row"]',
    required: false,
    purpose: 'The open detail: one cell spanning every column, held to the frame’s width.',
  },
  {
    part: 'popin-header',
    element: 'div[role="columnheader"]',
    required: false,
    purpose:
      'The pop-in’s column, last in the header row while columns are out of space: messages.popinHeader, visually hidden, with no track.',
  },
  {
    part: 'popin',
    element: 'div[role="gridcell"]',
    required: false,
    purpose:
      'The last cell of a record’s row and of the summary while columns are out of space: the row’s second line, every track, held to the frame’s width; aria-colindex is the last.',
  },
  {
    part: 'popin-field',
    element: 'div',
    required: false,
    purpose: 'One column in the pop-in, in the order of the columns: its label over its value.',
  },
  {
    part: 'popin-label',
    element: 'span',
    required: false,
    purpose: 'The column’s label, in the small muted type; left out for a column with none.',
  },
  {
    part: 'popin-value',
    element: 'div',
    required: false,
    purpose:
      'The value, drawn by the column’s cell renderer with the cell’s own context; an editable column is read only here.',
  },
  {
    part: 'group-row',
    element: 'div[role="row"]',
    required: false,
    purpose: 'A group heading: aria-level, aria-expanded, the value, the count, the aggregates.',
  },
  {
    part: 'group-toggle',
    element: 'button',
    required: false,
    purpose: 'Opens and closes a group.',
  },
  {
    part: 'tree-toggle',
    element: 'button',
    required: false,
    purpose: 'Opens and closes a tree row’s children; a leaf keeps its room empty.',
  },
  {
    part: 'row-handle',
    element: 'button',
    required: false,
    purpose: 'The grip a row is dragged by; disabled while the query is not at rest.',
  },
  {
    part: 'summary',
    element: 'div[role="rowgroup"]',
    required: false,
    purpose: 'The aggregates of the whole query, pinned to the end.',
  },
  {
    part: 'summary-cell',
    element: 'div[role="gridcell"]',
    required: false,
    purpose: 'One aggregate.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'The result-state for no rows, no results or an error, held to the frame’s width.',
  },
  {
    part: 'loader',
    element: 'div[role="rowgroup"]',
    required: false,
    purpose: 'Skeleton rows on a first load.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'The bar under the grid: the range, the consumer’s pagination, load more.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose: 'Row actions inside a cell of kind actions, revealed by hover and by the cursor.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every capability on one listing of shipments: sort with a press and Shift, filter from the funnel or the row, select with the checkboxes, edit a cell with Enter, pin and resize from the header. The toolbar switches scheme, density and direction.',
    snippet: defineSnippet({
      id: 'data-grid-react-playground',
      language: 'tsx',
      label: 'A grid of shipments',
      source: `<DataGrid
  columns={columns}
  height="100%"
  label="Shipments"
  rowKey="id"
  rows={shipments}
  selectionMode="multiple"
/>;`,
    }),
  },
  {
    id: 'columns',
    title: 'Columns',
    note: 'Each column declares its kind, and the kind decides the comparator, the operators, the editor and the alignment: a number column sits its digits at the end in tabular figures, a date column formats the ISO day in the reader’s locale, a set column names its values.',
    snippet: defineSnippet({
      id: 'data-grid-react-columns',
      language: 'tsx',
      label: 'A column per kind',
      source: `const columns: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Tracking', rowHeader: true, width: 132 },
  { id: 'customer', label: 'Customer', width: 200 },
  { id: 'carrier', label: 'Carrier', kind: 'set', options: carriers },
  { id: 'weight', label: 'Weight', kind: 'number', format: (value) => \`\${value} kg\` },
  { id: 'shipped', label: 'Shipped', kind: 'date' },
  { id: 'priority', label: 'Priority', kind: 'boolean' },
];`,
    }),
  },
  {
    id: 'column-groups',
    title: 'Column groups',
    note: 'A second header row above the columns: each group spans the columns it names, wherever the reader has laid them out, and a column no group names spans itself.',
    snippet: defineSnippet({
      id: 'data-grid-react-column-groups',
      language: 'tsx',
      label: 'Groups over the columns',
      source: `<DataGrid
  columnGroups={[
    { id: 'shipment', label: 'Shipment', columns: ['id', 'customer', 'destination'] },
    { id: 'timing', label: 'Timing', columns: ['shipped', 'eta'] },
  ]}
  columns={columns}
  rowKey="id"
  rows={shipments}
/>;`,
    }),
  },
  {
    id: 'sorting',
    title: 'Sorting',
    note: 'A press on a header sorts ascending, a second descending, a third removes the key; Shift with the press appends the column to the order instead, and the second and third keys carry their index beside the mark. Enter on the header does the same from the keyboard.',
    snippet: defineSnippet({
      id: 'data-grid-react-sorting',
      language: 'tsx',
      label: 'The order is in the query',
      source: `<DataGrid
  defaultQuery={{
    ...emptyQuery(),
    sort: [
      { column: 'carrier', direction: 'ascending' },
      { column: 'weight', direction: 'descending' },
    ],
  }}
  onQueryChange={(query, request) => log(request.change, query.sort)}
/>;`,
    }),
  },
  {
    id: 'filter-panel',
    title: 'The filter panel',
    note: 'Ctrl+Enter on a header or its menu opens the panel: one line per condition — operator and operand in sm — the join as two words on the second line once the first is complete, Clear and Apply at the end. Nothing reaches the query until Apply.',
    snippet: defineSnippet({
      id: 'data-grid-react-filter-panel',
      language: 'tsx',
      label: 'A rule per column, in the query',
      source: `<DataGrid
  defaultQuery={
    withColumnFilter(emptyQuery(), 'customer', {
      kind: 'text',
      join: 'or',
      conditions: [
        { operator: 'contains', value: 'nord' },
        { operator: 'startsWith', value: 'B' },
      ],
    }).query
  }
/>;`,
    }),
  },
  {
    id: 'filter-row',
    title: 'The filter row',
    note: 'With filterRow the row under the header holds one operand per column, plain, with the operator as a symbol at its start — press it for the names in full. Text and number apply after the debounce and on Enter; a set, a boolean and a date apply on change. The cursor walks the row.',
    snippet: defineSnippet({
      id: 'data-grid-react-filter-row',
      language: 'tsx',
      label: 'The densest form a wide listing has',
      source: `<DataGrid columns={columns} filterRow rowKey="id" rows={shipments} />;`,
    }),
  },
  {
    id: 'filter-bar',
    title: 'With a filter bar',
    note: 'One descriptor, two families: the bar above edits query.filter and the grid evaluates it, nested groups included. A rule written in a column header appears as a chip in the bar, and a chip removed in the bar clears the header’s funnel.',
    snippet: defineSnippet({
      id: 'data-grid-react-filter-bar',
      language: 'tsx',
      label: 'The same FilterGroup in both',
      source: `<>
  <FilterBar
    fields={fields}
    onValueChange={(filter) => setQuery(withFilter(query, filter).query)}
    value={query.filter}
  />
  <DataGrid columns={columns} onQueryChange={setQuery} query={query} rowKey="id" rows={shipments} />
</>;`,
    }),
  },
  {
    id: 'search',
    title: 'Search',
    // language: pt-BR
    note: 'One condition that belongs to no column: query.search is matched against the text of every searchable column through the locale collator, so "agua" finds "Água". The field that writes it is the consumer’s own text-field.',
    // language: en-US
    snippet: defineSnippet({
      id: 'data-grid-react-search',
      language: 'tsx',
      label: 'Search is part of the query',
      source: `<>
  <TextField
    onValueChange={(text) => setQuery(withSearch(query, text).query)}
    value={query.search}
  />
  <DataGrid columns={columns} onQueryChange={setQuery} query={query} rowKey="id" rows={shipments} />
</>;`,
    }),
  },
  {
    id: 'selection',
    title: 'Row selection',
    note: 'single chooses one row with a press; multiple draws the checkbox column, pinned to the start: Shift extends from the anchor, Shift+Space toggles the row from any cell, Ctrl+A and the header checkbox cover every row the query left and say so in their name.',
    snippet: defineSnippet({
      id: 'data-grid-react-selection',
      language: 'tsx',
      label: 'The selection is the reader’s own',
      source: `<DataGrid
  onValueChange={(value, request) => log(request.reason, value)}
  selectionMode="multiple"
  value={selected}
/>;`,
    }),
  },
  {
    id: 'range',
    title: 'Cell range',
    note: 'range selects a rectangle of cells: Shift with the arrows extends it from the anchor, Shift with a press sets it, a drag paints it, Ctrl+Space takes the column and Shift+Space the row. Ctrl+C copies it as tab-separated text; Escape clears it.',
    snippet: defineSnippet({
      id: 'data-grid-react-range',
      language: 'tsx',
      label: 'A rectangle, copied',
      source: `<DataGrid onRangeChange={(range) => log(range)} range={range} selectionMode="range" />;`,
    }),
  },
  {
    id: 'editing',
    title: 'Editing a cell',
    note: 'Enter, F2, a double press or a typed key open the cell’s editor — the field family of its kind, plain, filling the cell. Enter commits and moves one row down, Tab commits and moves to the next editable cell, Escape cancels. The commit may return a promise; the cell dims until it settles.',
    snippet: defineSnippet({
      id: 'data-grid-react-editing',
      language: 'tsx',
      label: 'The value is the column’s own',
      source: `const COLUMNS: DataGridColumn<Shipment>[] = [
  { id: 'customer', label: 'Customer', editable: true },
  { id: 'weight', label: 'Weight', kind: 'number', editable: true },
];

<DataGrid
  columns={COLUMNS}
  onEditCommit={async ({ key, column, value }) => save(key, { [column]: value })}
/>;`,
    }),
  },
  {
    id: 'editing-row',
    title: 'Editing a row',
    note: 'editMode="row" opens every editable cell of the row at once: Tab moves between them, Enter commits the row with every change in one request, Escape cancels them all.',
    snippet: defineSnippet({
      id: 'data-grid-react-editing-row',
      language: 'tsx',
      label: 'One request per row',
      source: `<DataGrid editMode="row" onEditCommit={({ key, changes }) => save(key, changes)} />;`,
    }),
  },
  {
    id: 'validation',
    title: 'Validation, failure and conflict',
    note: 'A column’s validate refuses a draft with a message: the cell turns invalid and keeps what was typed. A commit that rejects reopens the editor with the draft and the error. A row that changes under an open editor is a conflict, said in the same place.',
    snippet: defineSnippet({
      id: 'data-grid-react-validation',
      language: 'tsx',
      label: 'An error never discards the draft',
      source: `const columns = [
  {
    id: 'weight',
    label: 'Weight',
    kind: 'number',
    editable: true,
    validate: (value) => (value < 0 ? 'A weight is not negative' : null),
  },
];
<DataGrid columns={columns} onEditCommit={() => Promise.reject(new Error('Offline'))} />;`,
    }),
  },
  {
    id: 'activation',
    title: 'Row activation',
    note: 'activatable turns a double press or Enter on a text cell into onActivate with the row’s key — opening the record is a different act from choosing it, and the two never share a key. An editable cell keeps Enter for its editor. On a touch screen or with a pen one press activates, except on a widget in the cell or a cell in edit, and the double press that follows within 500ms is ignored.',
    snippet: defineSnippet({
      id: 'data-grid-react-activation',
      language: 'tsx',
      label: 'Open the record',
      source: `<DataGrid activatable onActivate={({ key }) => navigate(\`/shipments/\${key}\`)} />;`,
    }),
  },
  {
    id: 'pinning',
    title: 'Pinned columns',
    note: 'A column pinned to the start or the end stays while the others scroll; the checkbox column is always pinned. Pin from the column menu or the state; the last column of each zone draws the edge, darker while something is hidden under it.',
    snippet: defineSnippet({
      id: 'data-grid-react-pinning',
      language: 'tsx',
      label: 'Pinned through the state',
      source: `<DataGrid defaultColumnState={{ pinned: { start: ['id'], end: ['actions'] } }} />;`,
    }),
  },
  {
    id: 'resize',
    title: 'Resizing',
    note: 'Drag the handle on a column’s trailing edge; Escape during the drag restores the width. From the keyboard, Ctrl+Shift+ArrowRight widens by eight pixels and announces the width; Ctrl+Shift+Enter and a double press on the handle fit the column to its mounted cells.',
    snippet: defineSnippet({
      id: 'data-grid-react-resize',
      language: 'tsx',
      label: 'Widths are in the column state',
      source: `<DataGrid
  columnState={state}
  onColumnStateChange={(next, request) => request.change === 'width' && setState(next)}
/>;`,
    }),
  },
  {
    id: 'reorder',
    title: 'Reordering',
    note: 'Drag a header along the row: the drop indicator shows the boundary it lands on, and a column never leaves its pin zone. Alt+ArrowLeft and Alt+ArrowRight move the column one place from the keyboard. Every move is announced.',
    snippet: defineSnippet({
      id: 'data-grid-react-reorder',
      language: 'tsx',
      label: 'The order is in the column state',
      source: `<DataGrid defaultColumnState={{ order: ['customer', 'id', 'carrier'] }} />;`,
    }),
  },
  {
    id: 'column-menu',
    title: 'The column menu',
    note: 'Revealed by the pointer and by the cursor, opened with Ctrl+Enter, a secondary press on the header (at the press; Shift keeps the browser’s menu) or Shift+F10 and the Menu key (on the header cell): sort ascending, descending or remove; filter; pin to either edge or unpin; fit to content, and fit all columns in one request; hide; and manage columns, which hands over to the application’s column-manager. A fit chosen by pointer carries reason pointer, by keyboard reason keyboard; Shift with a double press on the resizer fits every column.',
    snippet: defineSnippet({
      id: 'data-grid-react-column-menu',
      language: 'tsx',
      label: 'One menu, every column operation',
      source: `<DataGrid onManageColumns={() => setManagerOpen(true)} />;`,
    }),
  },
  {
    id: 'column-help',
    title: 'A column that explains itself',
    note: 'ARR and Margin carry a description; Status carries a help node with a link. The circled question mark stays shown, because a coarse pointer has no hover; it opens a popover on a press, Enter or Space, and never sorts. The description is also the header’s accessible description and the caption atop its menu. F2 on a header reaches the button without a pointer.',
    snippet: defineSnippet({
      id: 'data-grid-react-column-help',
      language: 'tsx',
      label: 'A description, or a node of your own',
      source: `const columns: DataGridColumn<Account>[] = [
  {
    id: 'arr',
    label: 'ARR',
    kind: 'number',
    description: 'Annual recurring revenue, in US dollars',
  },
  { id: 'status', label: 'Status', help: <StatusGlossary /> },
];`,
    }),
  },
  {
    id: 'undo-hide',
    title: 'Undoing a hidden column',
    note: 'Hide column announces “Carrier hidden” and asks with change: hidden. The application answers with a toast whose Undo shows that column again through withColumnHidden: a hide moves no order, width or pin, so the column returns to its place and its width, and whatever the reader changed after the hide stays. Writing back request.previous would undo those changes too.',
    snippet: defineSnippet({
      id: 'data-grid-react-undo-hide',
      language: 'tsx',
      label: 'The undo shows the column again',
      source: `<DataGrid
  columnState={state}
  onColumnStateChange={(next, request) => {
    setState(next);
    if (request.change !== 'hidden') return;
    const shown = next.hidden.filter((column) => !request.previous.hidden.includes(column));
    const id = toaster.show({
      title: 'Column hidden',
      actions: (
        <Button
          onClick={() => {
            setState((current) =>
              shown.reduce((state, column) => withColumnHidden(state, column, false), current),
            );
            toaster.dismiss(id, 'pointer');
          }}
          size="sm"
          variant="outline"
        >
          Undo
        </Button>
      ),
    });
  }}
/>;`,
    }),
  },
  {
    id: 'column-state',
    title: 'Saving a view',
    note: 'A view is the column state, the query and the density as one line of text: serializeGridView writes it, parseGridView reads it back and drops a column the model no longer has. usePersistedGridView keeps that line under a key in localStorage (or any store with getItem, setItem and removeItem; null keeps it in memory), reads it once on mount, writes it after every change, and resets to the defaults by removing the entry. Hand reset, onDensityChange and setView — which replaces the whole view in one write, as applying a saved view does — to the controls that call them, and spread the rest on the grid. Selection, cursor and expansion are session state and are not kept.',
    snippet: defineSnippet({
      id: 'data-grid-react-column-state',
      language: 'tsx',
      label: 'A view, kept',
      source: `const { reset, onDensityChange, setView, ...view } = usePersistedGridView({
  key: 'shipments',
  columns,
  defaultColumnState: { pinned: { start: ['id'], end: [] } },
});
<DataGrid {...view} columns={columns} rows={rows} rowKey="id" />;`,
    }),
  },
  {
    id: 'grouping',
    title: 'Grouping',
    note: 'query.group names the columns the rows are grouped by, outermost first. A group row carries its level, its count and the aggregates of its rows; ArrowLeft closes it and ArrowRight opens it. expandedGroups is the set of open groups, all by default.',
    snippet: defineSnippet({
      id: 'data-grid-react-grouping',
      language: 'tsx',
      label: 'Grouped in the query',
      source: `<DataGrid defaultQuery={{ ...emptyQuery(), group: ['carrier', 'status'] }} />;`,
    }),
  },
  {
    id: 'summary',
    title: 'Aggregates',
    note: 'A column with aggregate — sum, avg, min, max, count or a function — draws the summary row, pinned to the end of the scroller, over every row the query kept; a grouped grid draws the same aggregate on each group row.',
    snippet: defineSnippet({
      id: 'data-grid-react-summary',
      language: 'tsx',
      label: 'The summary is the columns’ own',
      source: `const columns = [
  { id: 'weight', label: 'Weight', kind: 'number', aggregate: 'sum' },
  { id: 'cost', label: 'Cost', kind: 'number', aggregate: 'sum', format: money },
];`,
    }),
  },
  {
    id: 'detail',
    title: 'Row detail',
    note: 'renderDetail gives a row a detail: the expander column appears, ArrowRight on it opens the detail under the row as one cell spanning every column and held to the frame, ArrowLeft closes it. expanded is the set of open rows.',
    snippet: defineSnippet({
      id: 'data-grid-react-detail',
      language: 'tsx',
      label: 'A detail under the row',
      source: `<DataGrid renderDetail={(row) => <ShipmentTimeline shipment={row} />} />;`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Ten thousand rows',
    note: 'Above a hundred rows the grid windows them: the body is as tall as every row and only the ones in view, plus the overscan, are in the DOM. Scroll, or jump with Ctrl+End — the last row is mounted and focused. Above twenty middle columns the same happens sideways.',
    snippet: defineSnippet({
      id: 'data-grid-react-virtualization',
      language: 'tsx',
      label: 'Windowed by default',
      source: `<DataGrid height={480} rowHeight={34} rows={tenThousandShipments} virtualize="auto" />;`,
    }),
  },
  {
    id: 'server',
    title: 'Server mode',
    note: 'With totalCount or hasMore the grid draws the rows it is given and reports the query instead of applying it: sorting, filtering, searching and paging all arrive as one request saying what changed, and a server answers with the page.',
    snippet: defineSnippet({
      id: 'data-grid-react-server',
      language: 'tsx',
      label: 'One request per change',
      source: `<DataGrid
  loading={pending}
  onQueryChange={(next, request) => fetchPage(next, request.change)}
  query={query}
  rows={page.rows}
  totalCount={page.total}
/>;`,
    }),
  },
  {
    id: 'data-source',
    title: 'A data source',
    note: 'dataSource hands the grid its own fetching: getRows is called with the query on every change and an AbortSignal, the request before it aborted; the answer — rows, total or hasMore — is kept by the query’s text (cacheSize, default 20), so a page the reader comes back to is on screen at once. The grid is in server mode with the loading and the error states of its own: a rejection is the error state with the message thrown, Try again asks the same query, handle.reload() drops the cache. rows, totalCount, loading, error and onRetry are the source’s and are not read.',
    snippet: defineSnippet({
      id: 'data-grid-react-data-source',
      language: 'tsx',
      label: 'The grid asks',
      source: `const shipments: DataGridDataSource<Shipment> = {
  getRows: (query, { signal }) =>
    fetch(\`/api/shipments?\${toGridParams(query)}\`, { signal }).then((response) => response.json()),
};
<DataGrid
  columns={columns}
  dataSource={shipments}
  defaultQuery={emptyQuery({ index: 0, size: 25 })}
  rowKey="id"
/>;`,
    }),
  },
  {
    id: 'pagination',
    title: 'Pagination',
    note: 'query.page carries the index and the size; the pagination family in the footer moves both, in the bar a table carries: a page size, the range and the two triggers, at the inline end. The status states the range, so showRange is off. A change of filter, search or group puts the page back at the start in the same request.',
    snippet: defineSnippet({
      id: 'data-grid-react-pagination',
      language: 'tsx',
      label: 'The page is in the query',
      source: `<DataGrid
  footer={
    <Pagination
      count={total}
      onPageChange={(page) => setQuery(withPageIndex(query, page - 1).query)}
      onPageSizeChange={(size) => setQuery(withPageSize(query, size).query)}
      page={query.page.index + 1}
      pageSize={query.page.size}
      pageSizeOptions={[25, 50, 100]}
    >
      <PaginationPageSize />
      <PaginationStatus />
      <PaginationPrevious />
      <PaginationNext />
    </Pagination>
  }
  query={query}
  showRange={false}
/>;`,
    }),
  },
  {
    id: 'load-more',
    title: 'Load more',
    note: 'With an unknown total the footer states the range without one. onLoadMore is called on its own as the reader nears the end, and the footer says a page is loading; it offers a control only to retry a page that failed (loadMoreFailed). loadMoreTrigger="button" asks only from a Load more control, "both" does the two.',
    snippet: defineSnippet({
      id: 'data-grid-react-load-more',
      language: 'tsx',
      label: 'A cursor, no total',
      source: `<DataGrid
  hasMore={hasMore}
  onLoadMore={fetchMore}
  query={{ ...emptyQuery(), page: { cursor, size: 50 } }}
  rows={rows}
/>;`,
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Empty, no results, error, loading',
    note: 'Three states a body can hold instead of rows, each a result-state: nothing at all; nothing after the filter, with Clear filters; and a failed load, with Try again. A first load draws skeleton rows; a refresh over rows already shown dims them and moves nothing. Zero rows is an answer too: once the grid has drawn the empty state, loading keeps it and draws no skeleton, and loading="initial" asks for the skeleton anyway.',
    snippet: defineSnippet({
      id: 'data-grid-react-empty-and-loading',
      language: 'tsx',
      label: 'The grid knows which of the three it is',
      source: `<DataGrid error={error} loading={loading} onRetry={reload} rows={rows} />;`,
    }),
  },
  {
    id: 'variant',
    title: 'Variants',
    note: 'plain draws no rules and no band; ruled draws a rule between rows; framed adds the border, the radius and the footer inside. striped tints every second row under every state.',
    snippet: defineSnippet({
      id: 'data-grid-react-variant',
      language: 'tsx',
      label: 'Three variants and the stripe',
      source: `<DataGrid striped variant="framed" />;`,
    }),
  },
  {
    id: 'text',
    title: 'Long values',
    note: 'truncate is the default — a column has a width — and keeps the whole value in the cell’s title; wrap breaks an unbroken token rather than widening the column; nowrap keeps a code on one line. A value keeps its own direction in a right-to-left grid.',
    snippet: defineSnippet({
      id: 'data-grid-react-text',
      language: 'tsx',
      label: 'Per column',
      source: `const columns = [
  { id: 'customer', label: 'Customer', text: 'wrap' },
  { id: 'hash', label: 'Hash', text: 'nowrap' },
];`,
    }),
  },
  {
    id: 'density',
    title: 'Density',
    note: 'The row reads the theme’s control scale: 34 pixels at comfortable, 28 at compact, 26 at dense, with the type and the inset stepping with it. Without density the grid takes the page’s, which the toolbar switches; with density it writes data-slotted-density on its own root and holds that one whatever the page says. The menu and the popovers it opens are portals and stay at the page’s density.',
    snippet: defineSnippet({
      id: 'data-grid-react-density',
      language: 'tsx',
      label: 'The page’s density, or its own',
      source: `<DataGrid columns={columns} density="dense" rowKey="id" rows={shipments} />;`,
    }),
  },
  {
    id: 'responsive-priority',
    title: 'Columns that yield to a phone',
    note: 'The same grid in a phone-wide room. When the frame is too narrow for the template, columns leave the row: first those without a priority, the last first, then the highest priority; the identity column — the first rowHeader — and an actions column never leave. A column that leaves moves into the row’s pop-in, its label over its value drawn by the same cell renderer; one with popin: false is hidden instead. The root states the pop-in’s count as data-popin, rows grow to their fields, and onOutOfSpaceChange reports both sets — but the column state is untouched, so nothing is persisted and a wider frame brings them back. That is columnOverflow="auto", the default, under 600px, or under 1024px with a coarse pointer; wider, with a mouse, it scrolls. columnOverflow="popin" pops in at every width, and "scroll" keeps every column and scrolls.',
    snippet: defineSnippet({
      id: 'data-grid-react-responsive-priority',
      language: 'tsx',
      label: 'A lower priority stays longer',
      source: `const columns: GridColumn<Shipment>[] = [
  { id: 'id', label: 'Tracking', rowHeader: true },
  { id: 'status', label: 'Status', priority: 1 },
  { id: 'eta', label: 'ETA', kind: 'datetime', priority: 2 },
  { id: 'carrier', label: 'Carrier', priority: 3 },
  { id: 'cost', label: 'Cost', kind: 'number', popin: false },
];
<DataGrid columns={columns} onOutOfSpaceChange={setOut} rowKey="id" rows={rows} />;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the grid did not choose',
    note: 'A hundred-character customer name, an unbroken identifier, a right-to-left name, a disabled row, an empty cell in a numeric column and a value with a dash: each holds where the family says it holds.',
    snippet: defineSnippet({
      id: 'data-grid-react-content',
      language: 'tsx',
      label: 'Real content',
      source: `const DISABLED = ['SHP-20492'];

<DataGrid disabledKeys={DISABLED} rows={awkwardShipments} />;`,
    }),
  },
  {
    id: 'media',
    title: 'Pictures in cells',
    note: 'A renderer draws anything: an avatar beside the name, a thumbnail in a custom column. A stated rowHeight is the drawn row as well as the windowed one, so ten thousand rows of 56 pixels scroll to the right place. A cell with a picture and a name is one flex row of the renderer’s own; the grid lays out the renderer’s first element as the value.',
    snippet: defineSnippet({
      id: 'data-grid-react-media',
      language: 'tsx',
      label: 'An avatar and a thumbnail',
      source: `const MEDIA_COLUMNS: DataGridColumn<Shipment>[] = [
  ...columns,
  { id: 'photo', label: 'Cargo', kind: 'custom', sortable: false },
];

<DataGrid
  cellRenderers={{
    customer: ({ row }) => (
      <span className="customer">
        <Avatar name={row.customer} size="sm" />
        <span>{row.customer}</span>
      </span>
    ),
    photo: ({ row }) => <Image alt="" radius="sm" ratio="landscape" src={row.photo} />,
  }}
  columns={MEDIA_COLUMNS}
  rowHeight={56}
/>;`,
    }),
  },
  {
    id: 'realtime',
    title: 'Realtime',
    note: 'rows is compared with the rows before it, by key, on the mounted rows only: a cell whose value changed is marked for the time highlightChanges states (true is 1200 ms) and fades on the accent’s subtle ground; under reduced motion the ground stays flat and leaves with the mark. A row that arrived is not a change. Selection, cursor, expansion and scroll survive every tick because the key is the identity.',
    snippet: defineSnippet({
      id: 'data-grid-react-realtime',
      language: 'tsx',
      label: 'A feed',
      source: `<DataGrid highlightChanges rows={feed.rows} />;`,
    }),
  },
  {
    id: 'tree',
    title: 'Tree data',
    note: 'tree names each row’s parent by key; a row whose parent is not in rows is a root. The root is a treegrid, every row carries aria-level and a branch aria-expanded. The open branches are expanded — the same state the detail uses; a branch opens its children, a leaf its detail. Filter and search keep a row that matches or has a descendant that matches, with its ancestors; sorting is among siblings; the page is a slice of the open rows; query.group is ignored. In the tree column, ArrowRight opens a closed branch, ArrowLeft closes an open one and climbs to the parent from a leaf. A row hasChildren says has children not yet in rows asks for them through onLoadChildren when opened, and shows the wait until they arrive.',
    snippet: defineSnippet({
      id: 'data-grid-react-tree',
      language: 'tsx',
      label: 'Rows that name their parent',
      source: `<DataGrid
  defaultExpanded={['pt']}
  onLoadChildren={({ key }) => fetchZones(key).then(appendRows)}
  tree={{ parentKey: (row) => row.parent, hasChildren: (row) => row.kind === 'warehouse' }}
/>;`,
    }),
  },
  {
    id: 'pinned-rows',
    title: 'Pinned rows',
    note: 'pinnedRows holds rows at the top or the bottom of the body, by key, in the stated order. A held row leaves the query — never sorted, filtered or paged — and stays on screen, under the head and over the summary, at the heights the grid measures for each. It is a row like any other: the cursor walks through it, it selects, edits and exports with the rest, and it counts in aria-rowcount.',
    snippet: defineSnippet({
      id: 'data-grid-react-pinned-rows',
      language: 'tsx',
      label: 'Held at the edges',
      source: `<DataGrid pinnedRows={{ top: ['SHP-20487'], bottom: ['SHP-20481'] }} />;`,
    }),
  },
  {
    id: 'reorder-rows',
    title: 'Reordering rows',
    note: 'rowsReorderable draws a grip per row in a reserved column. The pointer drags from the grip and drops in a gap, with the same guide a column shows; Alt with the vertical arrows moves the row from any of its cells, and the move is announced. The grid keeps no order of its own: onRowsReorder says where the row goes in rows (from and to, the index it takes once moved) and the consumer moves it. Only while the query is at rest — no sort, filter, search or group — and without a tree, because elsewhere the position on screen is not the position in rows; the grip is disabled otherwise.',
    snippet: defineSnippet({
      id: 'data-grid-react-reorder-rows',
      language: 'tsx',
      label: 'The consumer moves the row',
      source: `<DataGrid
  onRowsReorder={({ from, to }) => setRows((rows) => arrayMove(rows, from, to))}
  rows={rows}
  rowsReorderable
/>;`,
    }),
  },
  {
    id: 'export',
    title: 'Export and print',
    note: 'handle.exportCsv builds the file by toCsv — RFC 4180, each cell as the grid draws it — from the rows the query left (every page in client mode) and the columns not hidden in the reader’s order, or the selected rows and every column on request, and hands it to the browser as a download; handle.toCsv returns the text for a consumer who sends it elsewhere. In print, the frame grows to its rows, nothing scrolls or sticks, and the pointer’s controls are not on paper; a windowed grid prints the rows it has mounted, so a consumer who prints ten thousand turns the window off first. Excel is the consumer’s: SheetJS reads the same text.',
    snippet: defineSnippet({
      id: 'data-grid-react-export',
      language: 'tsx',
      label: 'A file, a print',
      source: `<>
  <Button onClick={() => grid.current?.exportCsv({ filename: 'shipments.csv' })}>CSV</Button>
  <Button onClick={() => grid.current?.exportCsv({ rows: 'selected', bom: true })}>
    Selected, for Excel
  </Button>
  <Button onClick={() => window.print()}>Print</Button>
</>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab enters on the current cell and leaves the grid. The arrows move one cell, Home and End along the row, Ctrl+Home and Ctrl+End to the corners, PageUp and PageDown a view. Enter and F2 enter a cell, Escape leaves it. On a header: Enter sorts, Shift+Enter appends, Ctrl+Enter, Shift+F10 and the Menu key open the menu, Ctrl+Shift+arrows resize, Alt+arrows move. The pop-in is the last cell of a row.',
    snippet: defineSnippet({
      id: 'data-grid-react-keyboard',
      language: 'tsx',
      label: 'One tab stop',
      source: `<DataGrid
  defaultCurrent={{ row: 'SHP-20481', column: 'customer' }}
  onCurrentChange={(cell) => log(cell)}
/>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'A grid named by aria-label; every row with its index in the whole set and every cell with its column index; aria-sort on the first key and the rest announced; the selection’s size in the header checkbox’s name; a resize as a width; a filter as its sentence. Inspect the tree with a screen reader.',
    snippet: defineSnippet({
      id: 'data-grid-react-accessibility',
      language: 'tsx',
      label: 'Name, counts and announcements',
      source: `<DataGrid
  aria-label="Shipments"
  messages={{
    selectAllFiltered:
      '{count, plural, one {Select the # shipment} other {Select all # shipments}}',
  }}
/>;`,
    }),
  },
];

const api = apiRows([
  [
    'rows',
    'readonly Row[]',
    '—',
    'DataGrid',
    'The records; the grid never mutates them. Left out when a dataSource answers for them.',
  ],
  [
    'rowKey',
    'keyof Row | (row) => string',
    '—',
    'DataGrid',
    'A field name or a function: the key every state model names a row by.',
  ],
  [
    'columns',
    'GridColumn<Row>[]',
    '—',
    'DataGrid',
    'The column model: id, label, description, kind, accessor, format, compare, width, minWidth, maxWidth, flex, priority, sortable, filterable, searchable, editable, resizable, reorderable, hideable, rowHeader, pinned (end by default for kind actions), options, aggregate, validate, parse — and help, a node for the column’s help popover.',
  ],
  [
    'description',
    'string',
    '—',
    'DataGridColumn',
    'What the column is: the header’s accessible description, the caption atop its menu and the first line of its help popover.',
  ],
  [
    'help',
    'ReactNode',
    '—',
    'DataGridColumn',
    'The column’s own help, under the description in the popover the column-help button opens. Its presence alone draws the button.',
  ],
  [
    'priority',
    'number',
    '—',
    'DataGridColumn',
    'The lower, the longer the column stays when the frame is too narrow. A column without one leaves before every numbered one; the identity column and an actions column never leave.',
  ],
  [
    'popin',
    'boolean',
    'true',
    'DataGridColumn',
    'Whether a column with no room moves into the row’s pop-in; false hides it instead.',
  ],
  [
    'columnGroups',
    'GridColumnGroup[]',
    '—',
    'DataGrid',
    'Headings spanning columns, drawn as a row above the names.',
  ],
  [
    'mode',
    "'client' | 'server'",
    'inferred',
    'DataGrid',
    'client applies the query to rows; server draws rows as given. server when totalCount or hasMore is present.',
  ],
  [
    'totalCount',
    'number',
    '—',
    'DataGrid',
    'The whole set’s size in server mode; aria-rowcount and the range read it.',
  ],
  [
    'hasMore',
    'boolean',
    '—',
    'DataGrid',
    'Whether a page past this one exists when the total is unknown; loadMoreTrigger decides what asks for it.',
  ],
  [
    'loading',
    "boolean | 'initial' | 'refresh'",
    'false',
    'DataGrid',
    'Skeleton rows with no answer to keep; aria-busy over an answer already drawn — rows, which dim, or the empty state, which stays. true is initial until the grid has drawn an answer, and refresh after; rows emptied while a load starts wait in the skeleton.',
  ],
  [
    'error',
    'string | null',
    '—',
    'DataGrid',
    'The message of a failed load; draws the error state with Try again when onRetry is set.',
  ],
  [
    'disabledKeys',
    'string[]',
    '—',
    'DataGrid',
    'Rows that are neither selectable nor editable, drawn with data-disabled.',
  ],
  [
    'query',
    'GridQuery',
    '—',
    'DataGrid',
    'sort, filter, search, page and group in one object. Present puts the query in controlled mode.',
  ],
  [
    'defaultQuery',
    'GridQuery',
    'emptyQuery()',
    'DataGrid',
    'The query an uncontrolled grid starts from, read once.',
  ],
  [
    'onQueryChange',
    '(query, request) => void',
    '—',
    'DataGrid',
    'Asked before the query moves; the request carries change: sort | filter | search | page | group, the reason, and cancel().',
  ],
  [
    'columnState',
    'GridColumnState',
    '—',
    'DataGrid',
    'order, widths, hidden and pinned. Present puts the arrangement in controlled mode; it is normalised against columns.',
  ],
  [
    'defaultColumnState',
    'Partial<GridColumnState>',
    '—',
    'DataGrid',
    'The arrangement an uncontrolled grid starts from, read once.',
  ],
  [
    'onColumnStateChange',
    '(state, request) => void',
    '—',
    'DataGrid',
    'Asked before the arrangement moves; the request carries change: order | width | hidden | pinned.',
  ],
  [
    'onManageColumns',
    '() => void',
    '—',
    'DataGrid',
    'Called by the column menu’s Manage columns; the application opens its column-manager.',
  ],
  [
    'onOutOfSpaceChange',
    '(outOfSpace: GridOutOfSpace) => void',
    '—',
    'DataGrid',
    'Called when the columns a narrow frame took out by priority change — those in the pop-in and those hidden. Never part of columnState.',
  ],
  [
    'density',
    "'comfortable' | 'compact' | 'dense' | null",
    'the page’s',
    'DataGrid',
    'This grid’s own density, written as data-slotted-density on the root; absent or null, the page’s.',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple' | 'range'",
    'none',
    'DataGrid',
    'Rows, one or many, with the checkbox column in multiple; or a rectangle of cells.',
  ],
  [
    'value',
    'string | string[] | null',
    '—',
    'DataGrid',
    'The selected row (single) or rows (multiple). Present puts the selection in controlled mode.',
  ],
  [
    'defaultValue',
    'string | string[] | null',
    '—',
    'DataGrid',
    'The selection an uncontrolled grid starts from.',
  ],
  [
    'onValueChange',
    '(value, request) => void',
    '—',
    'DataGrid',
    'Asked before the selection moves, with pointer, keyboard, select, clear or programmatic.',
  ],
  [
    'range',
    'GridRange | null',
    '—',
    'DataGrid',
    'The cell rectangle as anchor and focus, in range mode. Present puts it in controlled mode.',
  ],
  [
    'defaultRange',
    'GridRange | null',
    '—',
    'DataGrid',
    'The rectangle an uncontrolled grid starts from.',
  ],
  [
    'onRangeChange',
    '(range, request) => void',
    '—',
    'DataGrid',
    'Asked before the rectangle moves, with pointer, keyboard, clear or programmatic.',
  ],
  [
    'current',
    'GridCell | null',
    '—',
    'DataGrid',
    'Where the cursor stands: a row key (or header, filter, summary, group:<key>) and a column id. Present puts the cursor in controlled mode.',
  ],
  ['defaultCurrent', 'GridCell | null', '—', 'DataGrid', 'Where an uncontrolled cursor starts.'],
  [
    'onCurrentChange',
    '(cell, request) => void',
    '—',
    'DataGrid',
    'Asked before the cursor moves, with pointer, keyboard or programmatic.',
  ],
  [
    'expanded',
    'string[]',
    '—',
    'DataGrid',
    'The rows whose detail is open. Present puts it in controlled mode.',
  ],
  [
    'defaultExpanded',
    'string[]',
    '—',
    'DataGrid',
    'The open details an uncontrolled grid starts with.',
  ],
  [
    'onExpandedChange',
    '(keys, request) => void',
    '—',
    'DataGrid',
    'Asked before a detail opens or closes.',
  ],
  [
    'expandedGroups',
    "string[] | 'all'",
    '—',
    'DataGrid',
    'The open groups, or all. Present puts it in controlled mode.',
  ],
  [
    'defaultExpandedGroups',
    "string[] | 'all'",
    'all',
    'DataGrid',
    'The open groups an uncontrolled grid starts with: every group.',
  ],
  [
    'onExpandedGroupsChange',
    '(keys, request) => void',
    '—',
    'DataGrid',
    'Asked before a group opens or closes.',
  ],
  [
    'expandable',
    'boolean | (row) => boolean',
    'true with renderDetail',
    'DataGrid',
    'Which rows have a detail.',
  ],
  [
    'editMode',
    "'cell' | 'row'",
    'cell',
    'DataGrid',
    'One cell at a time, or every editable cell of the row.',
  ],
  ['onEditStart', '(cell) => void', '—', 'DataGrid', 'An editor opened.'],
  [
    'onEditCommit',
    '(commit) => void | Promise<void>',
    '—',
    'DataGrid',
    'A draft committed: key, column, value, previous, row, reason and every change of the row. A rejected promise reopens the editor with the draft and the error.',
  ],
  ['onEditCancel', '(cell) => void', '—', 'DataGrid', 'A draft cancelled.'],
  [
    'activatable',
    'boolean',
    'false',
    'DataGrid',
    'A double press or Enter on a text cell reports the row through onActivate.',
  ],
  ['onActivate', '(event) => void', '—', 'DataGrid', 'The row’s key, the reason and the event.'],
  ['filterRow', 'boolean', 'false', 'DataGrid', 'The row of operands under the header.'],
  [
    'filterDebounce',
    'number',
    '300',
    'DataGrid',
    'Milliseconds a text or number operand in the filter row waits before it applies.',
  ],
  [
    'virtualize',
    "'auto' | boolean",
    'auto',
    'DataGrid',
    'auto windows rows above a hundred and middle columns above twenty.',
  ],
  [
    'rowHeight',
    "number | 'auto'",
    'density',
    'DataGrid',
    'Pixels per row, read once from the first row when unstated; auto measures every row, capped by --slotted-data-grid-row-max-block-size. While a pop-in is drawn every row is measured, as under auto.',
  ],
  [
    'columnOverflow',
    "'auto' | 'popin' | 'scroll'",
    'auto',
    'DataGrid',
    'What a frame too narrow for the template does: popin moves columns into each row’s pop-in by priority; scroll keeps them and scrolls sideways; auto pops in on a frame under 600px, or under 1024px when the main pointer is coarse — a phone, a small tablet — and scrolls elsewhere, where a mouse or a trackpad scrolls and the columns keep their layout.',
  ],
  ['overscan', 'number', '6', 'DataGrid', 'Rows mounted past each edge of the window.'],
  [
    'tree',
    '{ parentKey, column?, hasChildren? }',
    '—',
    'DataGrid',
    'Rows as a tree, each naming its parent by key; the open branches are expanded and the root is a treegrid.',
  ],
  [
    'onLoadChildren',
    '({ key, row }) => void',
    '—',
    'DataGrid',
    'Called when a branch hasChildren says has children opens and none are in rows.',
  ],
  [
    'dataSource',
    '{ getRows(query, { signal }), cacheSize? }',
    '—',
    'DataGrid',
    'The grid asks for its own rows per query, aborting the request before, keeping answers by query; server mode with its own loading and error.',
  ],
  [
    'pinnedRows',
    '{ top?: string[], bottom?: string[] }',
    '—',
    'DataGrid',
    'Rows held at the top or the bottom of the body, out of the query and always on screen.',
  ],
  [
    'rowsReorderable',
    'boolean',
    'false',
    'DataGrid',
    'A grip per row; the pointer drags it and Alt with the vertical arrows moves it. Only while the query is at rest and without a tree.',
  ],
  [
    'onRowsReorder',
    '({ key, from, to, reason, event }) => void',
    '—',
    'DataGrid',
    'Where a row goes in rows: from, and the index it takes once moved. The consumer moves it.',
  ],
  [
    'highlightChanges',
    'boolean | number',
    'false',
    'DataGrid',
    'Marks a mounted cell whose value changed between two rows, for the stated milliseconds (true is 1200).',
  ],
  [
    'loadMoreThreshold',
    'number',
    '20',
    'DataGrid',
    'Rows left below the window before onLoadMore is called.',
  ],
  ['onLoadMore', '() => void', '—', 'DataGrid', 'Asked for the next page when hasMore is true.'],
  [
    'loadMoreTrigger',
    "'scroll' | 'button' | 'both'",
    'scroll',
    'DataGrid',
    'What asks for the next page: nearing the end, with a loading status in the footer; a Load more control; or both.',
  ],
  [
    'loadMoreFailed',
    'boolean',
    'false',
    'DataGrid',
    'The last page asked for failed: the automatic request stops and the footer offers Try again.',
  ],
  ['onRetry', '() => void', '—', 'DataGrid', 'The error state’s Try again.'],
  ['skeletonRows', 'number', '8', 'DataGrid', 'Rows the first load draws.'],
  [
    'pageSizes',
    'number[]',
    '25,50,100',
    'DataGrid',
    'The sizes a page-size control in the footer offers, read through useDataGridDefaults.',
  ],
  [
    'variant',
    "'plain' | 'ruled' | 'framed'",
    'ruled',
    'DataGrid',
    'No rules, rules between rows, or the border and the radius.',
  ],
  ['striped', 'boolean', 'false', 'DataGrid', 'Every second row tinted.'],
  [
    'stickyHeader',
    'boolean',
    'true',
    'DataGrid',
    'The header, the filter row and the summary stay while the rows scroll.',
  ],
  [
    'stickyTo',
    "'scroll' | 'page'",
    'scroll',
    'DataGrid',
    'What the header sticks inside: the grid’s own scroller, or the page — which gives up the grid’s own scrolling and windowing.',
  ],
  [
    'height',
    'string | number',
    '—',
    'DataGrid',
    'The frame’s height; without one the grid grows to its rows.',
  ],
  [
    'labelledBy',
    'string',
    '—',
    'DataGrid',
    'The id of the element that names the grid; a native aria-label names it directly, and with neither the grid is named by messages.grid.',
  ],
  [
    'messages',
    'Partial<DataGridMessages>',
    '—',
    'DataGrid',
    'Words laid over the language in force, key by key: every control, state and announcement, the grid’s name (grid), and filterYes and filterNo for a boolean cell. The operator names and symbols are the groups filterOperators and filterSymbols.',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'DataGrid',
    'BCP 47, for the collator, the number and the date formats.',
  ],
  ['timeZone', 'string', '—', 'DataGrid', 'The zone a timestamp is read in.'],
  [
    'renderCell',
    '(context) => ReactNode',
    '—',
    'DataGrid',
    'What a cell draws; cellRenderers does it per column and wins.',
  ],
  [
    'renderEditor',
    '(context) => ReactNode',
    '—',
    'DataGrid',
    'What a cell edits with; editorRenderers per column wins. The context carries draft, setDraft, commit and cancel.',
  ],
  [
    'renderHeader',
    '(context) => ReactNode',
    '—',
    'DataGrid',
    'What a header draws in place of the label.',
  ],
  [
    'renderDetail',
    '(row, key) => ReactNode',
    '—',
    'DataGrid',
    'A row’s detail; its presence draws the expander column.',
  ],
  [
    'renderGroup',
    '(context) => ReactNode',
    '—',
    'DataGrid',
    'What a group row draws beside its toggle.',
  ],
  [
    'renderEmpty',
    '(status) => ReactNode',
    '—',
    'DataGrid',
    'The empty, no-results or error state in place of the grid’s result state.',
  ],
  [
    'renderFilterOperand',
    '(context) => ReactNode',
    '—',
    'DataGrid',
    'The operand control in the panel and the row, for a kind the grid has no field for.',
  ],
  [
    'footer',
    'ReactNode',
    '—',
    'DataGrid',
    'What stands in the bar under the grid, after the range.',
  ],
  ['showRange', 'boolean', 'when paged', 'DataGrid', 'Whether the footer states the range.'],
  [
    'handle',
    'RefObject<DataGridHandle>',
    '—',
    'DataGrid',
    'focusCell, scrollToRow, scrollToColumn, scrollToCell, startEdit, stopEdit, autofit (one column, or every resizable column as one request, reason programmatic), getOutOfSpace, getVisibleRows, toCsv, exportCsv, reload, selectAll, clearSelection, element.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'GridColumn',
    'Where the value sits; a number column sits at the end unless told otherwise.',
  ],
  [
    'numeric',
    'boolean',
    'false',
    'GridColumn',
    'Tabular figures and end alignment; true for kind number.',
  ],
  ['text', "'wrap' | 'truncate' | 'nowrap'", 'truncate', 'GridColumn', 'What a long value does.'],
]);

const events: EventRow[] = [
  {
    name: 'onQueryChange',
    payload: '(query: GridQuery, request: DataGridQueryRequest)',
    when: 'Before the query moves: a sort press, a filter applied, a search, a page, a group. request.change says which; the reason is pointer, keyboard, clear or programmatic; cancel() refuses it.',
  },
  {
    name: 'onColumnStateChange',
    payload: '(state: GridColumnState, request: DataGridColumnStateRequest)',
    when: 'Before a column is resized, moved, hidden or pinned. request.change says which; the reason is pointer, keyboard or programmatic. A hide is announced; the columns in value.hidden and not in previous.hidden are what an undo shows again.',
  },
  {
    name: 'onOutOfSpaceChange',
    payload: '(outOfSpace: GridOutOfSpace)',
    when: 'After the frame is measured, whenever the columns in the pop-in or the columns hidden for room change.',
  },
  {
    name: 'onValueChange',
    payload: '(value: string | string[] | null, request)',
    when: 'Before the row selection moves: a checkbox press, Shift+Space, Ctrl+A, the header checkbox (reason select), or clearSelection (programmatic).',
  },
  {
    name: 'onRangeChange',
    payload: '(range: GridRange | null, request)',
    when: 'Before the cell rectangle moves, or is cleared with Escape (reason clear).',
  },
  {
    name: 'onCurrentChange',
    payload: '(cell: GridCell | null, request)',
    when: 'Before the cursor moves: an arrow key, a press, or the grid settling the cursor after its row left (programmatic).',
  },
  {
    name: 'onExpandedChange',
    payload: '(keys: string[], request)',
    when: 'Before a detail opens or closes.',
  },
  {
    name: 'onExpandedGroupsChange',
    payload: "(keys: string[] | 'all', request)",
    when: 'Before a group opens or closes.',
  },
  {
    name: 'onEditStart / onEditCommit / onEditCancel',
    payload: '(cell) / (commit: DataGridEditCommit) / (cell)',
    when: 'When an editor opens; when a draft is committed by Enter, Tab, F2, a press elsewhere or blur (the commit may return a promise); when Escape cancels it.',
  },
  {
    name: 'onActivate',
    payload: '(event: DataGridActivateEvent)',
    when: 'A double press or Enter on a text cell, or one touch or pen press, while activatable is true.',
  },
  {
    name: 'onLoadMore / onRetry / onManageColumns',
    payload: '()',
    when: 'The window nears the end with hasMore; the error state’s Try again; the column menu’s Manage columns.',
  },
];

const composition = apiRows([
  [
    'DataGridDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets variant, striped, stickyHeader, stickyTo, selectionMode, editMode, filterRow, virtualize, rowHeight, columnOverflow, overscan, pageSizes, filterDebounce, loadMoreThreshold, loadMoreTrigger and skeletonRows once for a subtree. A grid that states one itself still wins. Its words and its locale come from the language in force (SlottedProvider).',
  ],
  [
    '@slotted/core/grid',
    'module',
    '—',
    'Application',
    'applyQuery, emptyQuery, withSortPress, withColumnFilter, withSearch, withPageIndex, withGroup, toGridParams, fromGridParams, normalizeColumnState, serializeColumnState, parseColumnState: the engine the grid runs on, for a server mock, a URL and a saved view.',
  ],
  [
    'renderCell, renderEditor, renderHeader, renderDetail, renderGroup, renderEmpty, renderFilterOperand',
    'render props',
    '—',
    'DataGrid',
    'Every surface a consumer replaces, per grid or per column through cellRenderers and editorRenderers. row, cell, head and body are fixed: the layout and the roles are theirs.',
  ],
  [
    'footer',
    'ReactNode',
    '—',
    'DataGrid',
    'Pagination, a page-size select, a count: the consumer’s own controls in the bar the grid draws.',
  ],
  [
    'handle',
    'DataGridHandle',
    '—',
    'DataGrid',
    'The imperative surface for what cannot be said declaratively: focusCell, scrollToRow, scrollToColumn, startEdit, stopEdit, autofit, getOutOfSpace, getVisibleRows, toCsv, exportCsv, reload, selectAll, clearSelection.',
  ],
  [
    'native props',
    'attributes',
    '—',
    'DataGrid',
    'Anything a div takes reaches the root; a consumer’s onKeyDown runs before the grid’s and preventDefault stops it. ref reaches the root element.',
  ],
  [
    'FilterBar, Pagination, ColumnManager',
    'families',
    '—',
    'Beside the grid',
    'The bar edits query.filter; pagination moves query.page in the footer; column-manager edits columnState.',
  ],
]);

const accessibility = [
  '`columns`, `disabledKeys` and a function `rowKey` are compared by identity: a new array or function on a render of the parent re-renders every mounted row, so declare them at module scope or memoise them. The renderers — `cellRenderers`, `editorRenderers`, `renderCell`, `renderEditor`, `renderHeader`, `renderGroup`, `renderDetail` — `messages` and `tree` are read when a row renders and may be written inline. A row renders again for its own row object, selection, cursor, edit or expansion, and for a change of `columns` or the language; a renderer whose output reads state outside its row is refreshed by memoising `columns` on that state.',
  'The root is role="grid": a composite widget with one tab stop. The current cell — or the single simple widget inside it, a link, a button or a checkbox — is the only element with tabindex="0"; Tab enters there and leaves the grid to the next control of the page, which is what the APG requires of a grid and what a table cannot give.',
  'Every row carries aria-rowindex against aria-rowcount on the root, and every cell aria-colindex against aria-colcount, always: the grid windows its rows and columns, so the DOM is never the whole set, and the counts are what let a screen reader say “row 4,812 of 9,000”.',
  'aria-sort is written on the first sort key’s header only — the practice says more than one is ambiguous — and the whole order is announced through the live announcer: “Sorted by Carrier ascending, Weight descending”. A resize announces the column and its width; a filter announces its sentence through describeFilter; a copy announces the count.',
  'A cell that does not edit while others do carries aria-readonly="true"; a draft that fails carries aria-invalid and its message in the title. A selected row carries aria-selected; a cell in a range carries it too, and the root aria-multiselectable in multiple and range.',
  'A column with a description is described by it: the header carries aria-describedby to a visually hidden span, and the column menu points at the same span while showing the text aria-hidden, so the words are heard once. The column help is a button with a name — “About ARR” — reached by F2 on the header; Tab cycles the header’s widgets and Escape returns to the cell. Hiding a column is announced as “Carrier hidden”.',
  'The header checkbox names what it covers — “Select all 3,412 rows”, or the page in server mode — because a selection over a whole result set is a decision only the query can make. Every control the grid draws has a name: the column menu, the filter trigger, the expander, the group toggle, the operator symbol.',
];

const code = defineSnippet({
  id: 'data-grid-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="data-grid"
  data-part="root"
  role="grid"
  aria-label="Shipments"
  aria-rowcount="3413"
  aria-colcount="7"
  data-variant="framed"
  data-sticky-header
  data-rows="fixed"
>
  <div data-part="scroll">
    <div data-part="head" role="rowgroup">
      <div data-part="header-row" role="row" aria-rowindex="1">
        <div data-part="selection" role="gridcell" aria-colindex="1">
          …
        </div>
        <div
          data-part="column-header"
          role="columnheader"
          aria-colindex="2"
          aria-sort="ascending"
          data-sortable
          data-sorted="ascending"
          tabindex="-1"
        >
          <span>Customer</span>
          <span data-part="sort" aria-hidden="true"></span>
          <span data-part="column-actions">
            <button
              data-part="column-menu"
              type="button"
              aria-label="Column menu, Customer"
            ></button>
          </span>
          <div data-part="resizer" aria-hidden="true"></div>
        </div>
      </div>
    </div>
    <div data-part="body" role="rowgroup">
      <div data-part="row" role="row" aria-rowindex="2" data-row="SHP-20481">
        <div data-part="selection" role="gridcell" aria-colindex="1">
          …
        </div>
        <div data-part="row-header" role="rowheader" aria-colindex="2" data-current tabindex="0">
          <span>SHP-20481</span>
        </div>
        <div data-part="cell" role="gridcell" aria-colindex="3" data-numeric>
          <span>142.5 kg</span>
        </div>
      </div>
    </div>
    <div data-part="summary" role="rowgroup">
      …
    </div>
  </div>
  <div data-part="footer">
    <span data-range>1–50 of 3,412</span>…
  </div>
</div>;`,
});

const theming = defineSnippet({
  id: 'data-grid-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='data-grid'] {
  --slotted-data-grid-row-block-size: var(--slotted-control-height-md);
  --slotted-data-grid-header-surface: color-mix(
    in oklab,
    var(--slotted-text) 8%,
    var(--slotted-surface)
  );
  --slotted-data-grid-row-surface-hover: var(--slotted-tone-secondary-subtle-hover);
  --slotted-data-grid-cursor-color: var(--slotted-tone-accent-border);
  --slotted-data-grid-filter-panel-size: 24rem;
  --slotted-data-grid-block-size: 32rem;
}`,
});

export const REACT_DATA_GRID_DOCS = {
  'data-grid': {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [code, theming],
  },
};
