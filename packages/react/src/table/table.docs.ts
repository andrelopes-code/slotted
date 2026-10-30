import tableTokens from '@slotted/styles/table/tokens.json';
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

export const REACT_TABLE_TOKENS = tableTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Table decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Table,\n  TableBody,\n  TableCaption,\n  TableCell,\n  TableColumnActions,\n  TableColumnHeader,\n  TableContent,\n  TableDefaultsProvider,\n  TableDetail,\n  TableEmpty,\n  TableExpander,\n  TableFooter,\n  TableGroupRow,\n  TableHead,\n  TableLoader,\n  TableRow,\n  TableRowHeader,\n  TableSelect,\n  TableSelectAll,\n  TableSort,\n  TableSummary,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame. It carries every axis, and it holds what must not move when the table is scrolled sideways: the border, the radius and the footer bar.',
  },
  {
    part: 'scroll',
    element: 'div',
    required: true,
    purpose:
      'The scroller, and the element a sticky header resolves against. It becomes a named region with a tab stop only while the table overflows.',
  },
  {
    part: 'table',
    element: 'table',
    required: true,
    purpose:
      'The tabular structure itself, and the element the platform gives the role to. It carries aria-rowcount when the DOM holds a page of a larger set.',
  },
  {
    part: 'caption',
    element: 'caption',
    required: false,
    purpose:
      'The table name, and the accessible name whether it is read or hidden. The family writes no aria-labelledby restating what the browser already states.',
  },
  {
    part: 'head',
    element: 'thead',
    required: false,
    purpose: 'The header row group. It sticks to the scroller when stickyHeader is on.',
  },
  {
    part: 'body',
    element: 'tbody',
    required: true,
    purpose: 'The rows. A table may hold more than one, which is how a set is grouped by section.',
  },
  {
    part: 'summary',
    element: 'tfoot',
    required: false,
    purpose:
      'The column summaries, which is the HTML Standard own word for a tfoot: a total, a count, a unit. It is not the footer bar.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The bar under the table and inside the frame, where a paged listing puts its control. It is a sibling of the scroller, so a table scrolled sideways does not take its pagination with it.',
  },
  {
    part: 'row',
    element: 'tr',
    required: true,
    purpose:
      'One record. It carries data-selected and data-expanded for the stylesheet and data-value for the range and the select-all.',
  },
  {
    part: 'column-header',
    element: 'th',
    required: false,
    purpose:
      'A column name, scoped to its column. It carries aria-sort when it is the sorted one, and on no other header. A name its box cuts — text="truncate" on a column with no room — opens a hint with the whole of it, shown rather than read, because the header already states the words.',
  },
  {
    part: 'row-header',
    element: 'th',
    required: false,
    purpose:
      'The cell that identifies the record, scoped to its row, which a screen reader repeats in each cell beside it.',
  },
  {
    part: 'cell',
    element: 'td',
    required: true,
    purpose: 'One value, and the four axes a cell answers: align, numeric, text and sticky.',
  },
  {
    part: 'sort',
    element: 'button',
    required: false,
    purpose:
      'The column name wrapped in a button, which is what the APG sortable example does. The whole header is the target.',
  },
  {
    part: 'column-actions',
    element: 'span',
    required: false,
    purpose:
      'The slot beside a column name for the controls it carries: a filter trigger, a column menu, a help hint. The family holds the place; the query is yours.',
  },
  {
    part: 'filter',
    element: 'button',
    required: false,
    purpose:
      'The trigger the table draws in that slot, and everything behind it. It marks itself while the column is filtered and states what is applied in its own name.',
  },
  {
    part: 'filter-panel',
    element: 'div',
    required: false,
    purpose:
      'The surface the trigger opens: the conditions, the join between them and the two actions. It edits a draft — nothing reaches you until Apply.',
  },
  {
    part: 'filter-condition',
    element: 'div',
    required: false,
    purpose:
      'One condition: an operator and the operands that operator takes. Two of them at most, and the second appears once the first is complete.',
  },
  {
    part: 'filter-operator',
    element: 'div',
    required: false,
    purpose:
      'The chooser, which is the Select family. What it offers is the kind own list, narrowed by operators.',
  },
  {
    part: 'filter-operand',
    element: 'div',
    required: false,
    purpose:
      'The field the operator asks for: none for is empty, one for a comparison, two for between. renderOperand replaces it and keeps everything else.',
  },
  {
    part: 'filter-join',
    element: 'div',
    required: false,
    purpose:
      'And or Or between two conditions, which is also the word between the ends of a range.',
  },
  {
    part: 'filter-search',
    element: 'div',
    required: false,
    purpose:
      'The field that narrows a set filter values, through the same locale collator Combobox filters with. It appears once there are searchThreshold values.',
  },
  {
    part: 'filter-list',
    element: 'div',
    required: false,
    purpose:
      'The values, scrolling inside the panel rather than making the panel taller than the screen.',
  },
  {
    part: 'filter-option',
    element: 'div',
    required: false,
    purpose:
      'One value, its checkbox and its count. The first is the covering checkbox, which answers for exactly what the search left.',
  },
  {
    part: 'filter-empty',
    element: 'p',
    required: false,
    purpose: 'The word shown when the search matches nothing, so the panel is never a blank box.',
  },
  {
    part: 'filter-actions',
    element: 'div',
    required: false,
    purpose: 'The footer: Clear at the leading edge and Apply at the trailing one.',
  },
  {
    part: 'selection',
    element: 'th or td',
    required: false,
    purpose:
      'The cell holding the checkbox, in the header and in every row. The cell is this family and the chooser is Checkbox.',
  },
  {
    part: 'expander',
    element: 'button',
    required: false,
    purpose:
      'Opens and closes one row detail. It carries aria-expanded, and aria-controls naming the detail row while that row is open. It is the APG Disclosure pattern, borrowed whole.',
  },
  {
    part: 'detail',
    element: 'tr',
    required: false,
    purpose:
      'The open row detail, one cell spanning every column. It is not rendered while it is closed.',
  },
  {
    part: 'group-row',
    element: 'tr',
    required: false,
    purpose:
      'The band that opens a group of rows: a day of a ledger with its net at the end. One header cell spans every column, and sticky holds the band under the header while its rows scroll past.',
  },
  {
    part: 'group-header',
    element: 'th',
    required: false,
    purpose:
      'The one cell of the band, scope="rowgroup", spanning the columns of the table. It names the rows of its own tbody, so a grouped listing writes one body per group.',
  },
  {
    part: 'group-content',
    element: 'div',
    required: false,
    purpose:
      'The line inside the band that sets the name at the start and the end content at the end.',
  },
  {
    part: 'group-start',
    element: 'span',
    required: false,
    purpose: 'The name of the group.',
  },
  {
    part: 'group-end',
    element: 'span',
    required: false,
    purpose:
      'The end of the band, from the end prop: the total or net of the group, in tabular figures.',
  },
  {
    part: 'empty',
    element: 'td',
    required: false,
    purpose:
      'What is shown when there is nothing, spanning every column, in a row the part writes itself. It takes a ResultState, which already separates an empty set from a set a filter emptied.',
  },
  {
    part: 'loader',
    element: 'tbody',
    required: false,
    purpose:
      'The skeleton rows of a first load: the table shape before its content. A refresh over rows already read is the other state and dims the body instead.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on one table, driven by the controls below the canvas. Change the variant, turn the stripes on, then narrow the window: the table scrolls inside its own frame rather than pushing the page over.',
    snippet: defineSnippet({
      id: 'table-react-playground',
      language: 'tsx',
      label: 'A table',
      source:
        '<Table columns={3}>\n  <TableContent>\n    <TableCaption>Invoices</TableCaption>\n    <TableHead>\n      <TableRow>\n        <TableColumnHeader>Invoice</TableColumnHeader>\n        <TableColumnHeader>Client</TableColumnHeader>\n        <TableColumnHeader numeric>Amount</TableColumnHeader>\n      </TableRow>\n    </TableHead>\n    <TableBody>\n      {invoices.map((invoice) => (\n        <TableRow key={invoice.id} value={invoice.id}>\n          <TableRowHeader>{invoice.id}</TableRowHeader>\n          <TableCell>{invoice.client}</TableCell>\n          <TableCell numeric>{invoice.amount}</TableCell>\n        </TableRow>\n      ))}\n    </TableBody>\n  </TableContent>\n</Table>;',
    }),
  },
  {
    id: 'variant',
    title: 'Nothing, a rule, or a frame',
    note: 'Plain is the form that belongs inside a card, where the card already draws the box. Ruled puts a hairline between records. Framed is the listing screen: the set reads as one object, and the footer bar sits inside it.',
    snippet: defineSnippet({
      id: 'table-react-variant',
      language: 'tsx',
      label: 'The three presentations',
      source: '<Table variant="plain" />;\n<Table variant="ruled" />;\n<Table variant="framed" />;',
    }),
  },
  {
    id: 'striped',
    title: 'A stripe to carry the eye across',
    note: 'Off by default, because a stripe costs a row its own state colors. It is mixed from the ink at five per cent, one step under the header band, and every state is painted over it: a striped row that is selected reads as selected.',
    snippet: defineSnippet({
      id: 'table-react-striped',
      language: 'tsx',
      label: 'Zebra rows',
      source: '<Table striped>{rows}</Table>;',
    }),
  },
  {
    id: 'sorting',
    title: 'Ordered by one column, and said out loud',
    note: 'Press a header: ascending, then descending, then none. The family holds the descriptor and reorders nothing — the rows are yours — so apply it to your own array or send it to your query. The change is announced, because aria-sort alone is silent.',
    snippet: defineSnippet({
      id: 'table-react-sorting',
      language: 'tsx',
      label: 'Sorting your own array',
      source:
        'const [sort, setSort] = useState<TableSortDescriptor | null>(null);\nconst rows = useMemo(() => sortRows(invoices, sort), [invoices, sort]);\n\n<Table sort={sort} onSortChange={setSort}>\n  <TableContent>\n    <TableHead>\n      <TableRow>\n        <TableColumnHeader column="client">\n          <TableSort>Client</TableSort>\n        </TableColumnHeader>\n      </TableRow>\n    </TableHead>\n  </TableContent>\n</Table>;',
    }),
  },
  {
    id: 'column-controls',
    title: 'A filter, beside the name it filters',
    note: 'The family draws the filter: a trigger on the column boundary and a panel that searches, covers what the search left, counts what you counted, and edits a draft. Nothing reaches you until Apply — Escape and a press outside put back the set the panel opened with. What the set means is still your query.',
    snippet: defineSnippet({
      id: 'table-react-column-controls',
      language: 'tsx',
      label: 'A column that sorts and filters',
      source:
        '<TableColumnHeader column="client">\n  <TableSort>Client</TableSort>\n  <TableColumnActions>\n    <TableTextFilter columnLabel="client" onValueChange={setClient} value={client} />\n  </TableColumnActions>\n</TableColumnHeader>;\n\n// The descriptor is yours to apply, and the query is where it belongs.\nconst keep = createFilterPredicate(client);\nconst rows = invoices.filter((row) => keep(row.client));',
    }),
  },
  {
    id: 'filter',
    title: 'A column filtered to the values you named',
    note: 'The set filter: a list, a search past eight values through the same locale collator Combobox uses, and a checkbox that covers exactly what the search left. Counts are yours to supply. Nothing reaches you until Apply — Escape and a press outside put back the descriptor the panel opened with — and a filtered column says what is applied in the trigger own name.',
    snippet: defineSnippet({
      id: 'table-react-filter',
      language: 'tsx',
      label: 'A set filter, and the query that answers it',
      source:
        "const [status, setStatus] = useState<SetFilter | null>(null);\nconst keep = useMemo(() => createFilterPredicate(status), [status]);\nconst rows = useMemo(() => invoices.filter((row) => keep(row.status)), [invoices, keep]);\n\n<TableColumnHeader>\n  Status\n  <TableColumnActions>\n    <TableSetFilter\n      columnLabel=\"status\"\n      onValueChange={setStatus}\n      options={[\n        { count: 5, value: 'Paid' },\n        { count: 4, value: 'Overdue' },\n        { count: 3, value: 'Draft' },\n      ]}\n      value={status}\n    />\n  </TableColumnActions>\n</TableColumnHeader>;",
    }),
  },
  {
    id: 'filter-types',
    title: 'Four columns, four kinds, one predicate',
    note: 'Text, number, date and boolean, each with the operators its type has and each typed as itself — a text filter value is a TextFilter, in React types and in Angular signals alike, and you never unwrap a union to read it. createRowPredicate joins the four, so the screen filters without a switch of its own.',
    snippet: defineSnippet({
      id: 'table-react-filter-types',
      language: 'tsx',
      label: 'A listing that filters four kinds',
      source:
        'const [filters, setFilters] = useState<Record<string, FilterDescriptor | null>>({});\nconst set = (column: string) => (value: FilterDescriptor | null) =>\n  setFilters((held) => ({ ...held, [column]: value }));\n\nconst keep = useMemo(\n  () => createRowPredicate(filters, (row, column) => row[column as keyof Invoice]),\n  [filters],\n);\nconst rows = useMemo(() => invoices.filter(keep), [invoices, keep]);\n\n<TableTextFilter columnLabel="client" onValueChange={set(\'client\')} />;\n<TableNumberFilter columnLabel="amount" onValueChange={set(\'amount\')} />;\n<TableDateFilter columnLabel="due" onValueChange={set(\'due\')} />;\n<TableBooleanFilter columnLabel="paid" onValueChange={set(\'paid\')} />;',
    }),
  },
  {
    id: 'filter-conditions',
    title: 'Two conditions, and the shapes an operator makes',
    note: 'Between takes two operands and is empty takes none, so the panel grows a field or loses both — and says so, because a form that changes shape under a reader who cannot see it says nothing otherwise. The second condition appears once the first is complete, joined by And or Or; past two, a rule set is Filter Bar work.',
    snippet: defineSnippet({
      id: 'table-react-filter-conditions',
      language: 'tsx',
      label: 'A range, a blank test, and two conditions',
      source:
        "// between 100 and 2500, or nothing recorded at all\nconst amount: NumberFilter = {\n  conditions: [{ end: 2500, operator: 'between', value: 100 }, { operator: 'empty' }],\n  join: 'or',\n  kind: 'number',\n};\n\n<TableNumberFilter columnLabel=\"amount\" onValueChange={setAmount} value={amount} />;\n\n// One condition only, which is AG Grid maxNumConditions\n<TableTextFilter columnLabel=\"client\" conditions={1} onValueChange={setClient} />;",
    }),
  },
  {
    id: 'filter-time',
    title: 'A time column, and a window that crosses midnight',
    note: 'TableTimeFilter draws the time picker, and one time range picker for between, and holds ISO text at the column granularity — 22:00 at a minute, 22:00:00 at a second — which is the precision the engine compares at. A between whose start is later than its end is the overnight window, not an empty set: 22:00 to 02:00 keeps 23:30 and 01:15. The range picker marks that pair out of order until its wrap capability lands; the filter applies it as the window either way. Your shifts go in through presets.',
    snippet: defineSnippet({
      id: 'table-react-filter-time',
      language: 'tsx',
      label: 'A time filter, and the rows it keeps',
      source:
        "const [cutoff, setCutoff] = useState<TimeFilter | null>({\n  conditions: [{ end: '02:00', operator: 'between', value: '22:00' }],\n  join: 'and',\n  kind: 'time',\n});\nconst keep = useMemo(() => createFilterPredicate(cutoff), [cutoff]);\nconst rows = deliveries.filter((row) => keep(row.cutoff));\n\n<TableTimeFilter\n  columnLabel=\"cut-off\"\n  granularity=\"minute\"\n  onValueChange={setCutoff}\n  presets={<TimeRangePickerPreset value={MORNING_SHIFT}>Morning</TimeRangePickerPreset>}\n  value={cutoff}\n/>;",
    }),
  },
  {
    id: 'filter-datetime',
    title: 'A date-time column, at the precision you wrote',
    note: 'TableDateTimeFilter draws the date-time picker, and one date-time range picker for between, and holds 2026-09-14T09:00 as text. Compared at the operand own precision, so after 2026-09-14T09 starts at ten o clock and is 2026-09-14 matches the whole day. A condition with one half missing is inactive until both halves exist, and Apply reports nothing for it. Your windows go in through presets.',
    snippet: defineSnippet({
      id: 'table-react-filter-datetime',
      language: 'tsx',
      label: 'A date-time filter over a wall-clock column',
      source:
        'const [scheduled, setScheduled] = useState<DateTimeFilter | null>(null);\nconst keep = useMemo(\n  () => createFilterPredicate(scheduled, { timeZone: \'Europe/Lisbon\' }),\n  [scheduled],\n);\n\n<TableDateTimeFilter\n  columnLabel="scheduled"\n  onValueChange={setScheduled}\n  presets={\n    <DateTimeRangePickerPreset value={EARLY_OCTOBER}>Early October</DateTimeRangePickerPreset>\n  }\n  value={scheduled}\n/>;',
    }),
  },
  {
    id: 'filter-range',
    title: 'Between two dates, as one range picker',
    note: 'The between of a date column is one date-range-picker rather than two pickers: it says the run length while it is drawn, takes the ends in either order and carries your presets through the presets prop. The descriptor is unchanged — between, an ISO day and another — so a saved view written with two pickers opens in the range picker.',
    snippet: defineSnippet({
      id: 'table-react-filter-range',
      language: 'tsx',
      label: 'A date filter with the application own periods',
      source:
        '<TableDateFilter\n  columnLabel="due"\n  onValueChange={setDue}\n  presets={\n    <>\n      <DateRangePickerPreset value={september}>September</DateRangePickerPreset>\n      <DateRangePickerPreset value={quarter}>Q4</DateRangePickerPreset>\n    </>\n  }\n  value={due}\n/>;',
    }),
  },
  {
    id: 'filter-tags',
    title: 'A set typed as chips',
    note: 'operand tags draws tags-input where the checkbox list stood, for a list too long to tick. With options, they are a native datalist of suggestions and a typed value outside them is refused; without options any value is admitted. The chips hold the same readonly string[] the list held, so the operator stays anyOf or noneOf and a saved view is read by either operand.',
    snippet: defineSnippet({
      id: 'table-react-filter-tags',
      language: 'tsx',
      label: 'Chips held to the column values, and chips free of them',
      source:
        '<TableSetFilter columnLabel="client" onValueChange={setClient} operand="tags" options={clients} />;\n<TableSetFilter columnLabel="invoice" onValueChange={setInvoice} operand="tags" />;',
    }),
  },
  {
    id: 'editing',
    title: 'A plain control in a cell',
    note: 'A cell whose child is a plain control gives up its inset: padding goes to zero and the control reads the cell padding and the row height through the control tokens, so the edited value stands where the read value stood and the row does not grow. The rule names the fourteen plain field families and nothing else. The control width is its own, as in a form.',
    snippet: defineSnippet({
      id: 'table-react-editing',
      language: 'tsx',
      label: 'A count corrected in place',
      source:
        '<TableRow value={item.sku}>\n  <TableRowHeader>{item.sku}</TableRowHeader>\n  <TableCell>\n    <TextField aria-label="Description" size="sm" value={description} variant="plain" />\n  </TableCell>\n  <TableCell numeric>\n    <NumberField aria-label="Counted" size="sm" stepper="none" value={counted} variant="plain" />\n  </TableCell>\n</TableRow>;',
    }),
  },
  {
    id: 'selection',
    title: 'Choosing records, and what all means',
    note: 'Hold Shift and press a second checkbox to take everything between. The header checkbox covers the rows in the DOM and says how many in its own name — a selection over a whole result set is a decision only your query can make.',
    snippet: defineSnippet({
      id: 'table-react-selection',
      language: 'tsx',
      label: 'Rows a bulk action acts on',
      source:
        '<Table selectionMode="multiple" value={chosen} onValueChange={setChosen}>\n  <TableContent>\n    <TableHead>\n      <TableRow>\n        <TableSelectAll />\n        <TableColumnHeader>Invoice</TableColumnHeader>\n      </TableRow>\n    </TableHead>\n    <TableBody>\n      <TableRow value="INV-1042">\n        <TableSelect />\n        <TableRowHeader>INV-1042</TableRowHeader>\n      </TableRow>\n    </TableBody>\n  </TableContent>\n</Table>;',
    }),
  },
  {
    id: 'expansion',
    title: 'A record with more to say',
    note: 'The expander is the Disclosure pattern: a button carrying aria-expanded and naming the row it opens. A closed detail is not in the DOM at all, so nothing is announced that a reader cannot reach.',
    snippet: defineSnippet({
      id: 'table-react-expansion',
      language: 'tsx',
      label: 'A row that opens',
      source:
        '<>\n  <TableRow value={invoice.id}>\n    <TableCell>\n      <TableExpander />\n    </TableCell>\n    <TableRowHeader>{invoice.id}</TableRowHeader>\n  </TableRow>\n  <TableDetail value={invoice.id}>Issued 12 August, due 11 September.</TableDetail>\n</>;',
    }),
  },
  {
    id: 'sticky',
    title: 'A header, a summary and a column that stay',
    note: 'stickyHeader holds the head against the top of the scroller and stickyFooter holds the summary against the bottom of it, so the total is on screen at the first row and the last. stickyTo says which box that is: this table own scroller, or whatever scrolls outside it. Under stickyTo="page" the head stops at --slotted-table-sticky-offset, which a page binds to its own chrome; a table inside a scrolling box of its own sets that token to 0 on the box. A pinned column darkens its edge exactly while something is hidden under it, and all of it mirrors in a right-to-left document.',
    snippet: defineSnippet({
      id: 'table-react-sticky',
      language: 'tsx',
      label: 'Pinned at four edges',
      source:
        '<Table stickyFooter stickyHeader stickyTo="page">\n  <TableContent>\n    <TableHead>\n      <TableRow>\n        <TableColumnHeader sticky="start">Invoice</TableColumnHeader>\n        <TableColumnHeader sticky="end" />\n      </TableRow>\n    </TableHead>\n    <TableSummary>\n      <TableRow>\n        <TableCell colSpan={4} sticky="start">\n          48 invoices\n        </TableCell>\n        <TableCell numeric>{total}</TableCell>\n      </TableRow>\n    </TableSummary>\n  </TableContent>\n</Table>;',
    }),
  },
  {
    id: 'scroll',
    title: 'Wider than the space it has',
    note: 'The scroller takes a tab stop, a role and a name only while it overflows, so a table that fits costs a keyboard reader nothing. Tab to it and the arrow keys, Page keys, Home and End all scroll it.',
    snippet: defineSnippet({
      id: 'table-react-scroll',
      language: 'tsx',
      label: 'Naming the region',
      source:
        "<TableContent scrollProps={{ 'aria-label': 'Invoices, scrollable' }}>{rows}</TableContent>;",
    }),
  },
  {
    id: 'alignment',
    title: 'Where a value stands, and how its digits line up',
    note: 'Alignment is logical, so a column aligned to the end is on the right in English and on the left in Arabic. Numeric is a separate fact: it sets tabular figures, and aligns to the end unless you say otherwise.',
    snippet: defineSnippet({
      id: 'table-react-alignment',
      language: 'tsx',
      label: 'Numbers under numbers',
      source:
        '<TableCell numeric>9,802.75</TableCell>;\n<TableCell align="center">EU</TableCell>;\n<TableCell align="end">12 Aug</TableCell>;',
    }),
  },
  {
    id: 'text',
    title: 'A value longer than its column',
    note: 'Wrap breaks an unbroken token — a hash, a URL, an identifier — rather than letting it set the column width. Truncate keeps one line with the whole value still in the DOM. Nowrap never breaks. None of the three removes anything.',
    snippet: defineSnippet({
      id: 'table-react-text',
      language: 'tsx',
      label: 'The three treatments',
      source:
        '<Table layout="fixed">\n  <TableContent>\n    <TableBody>\n      <TableRow>\n        <TableCell text="wrap">{hash}</TableCell>\n        <TableCell text="truncate">{note}</TableCell>\n        <TableCell text="nowrap">12 Aug 2026</TableCell>\n      </TableRow>\n    </TableBody>\n  </TableContent>\n</Table>;',
    }),
  },
  {
    id: 'footer',
    title: 'The totals, and the page',
    note: 'Two different feet. The summary is a tfoot inside the table, where a total belongs beside the column it totals. The footer is a bar outside it and inside the frame, which is where the paging control goes and where it does not scroll sideways.',
    snippet: defineSnippet({
      id: 'table-react-footer',
      language: 'tsx',
      label: 'A total and a paginator',
      source:
        '<Table>\n  <TableContent totalRowCount={128}>\n    <TableSummary>\n      <TableRow>\n        <TableCell numeric>11,061.25</TableCell>\n      </TableRow>\n    </TableSummary>\n  </TableContent>\n  <TableFooter>\n    <span>3 of 128 invoices</span>\n    <Pagination page={page} onPageChange={setPage} total={128} />\n  </TableFooter>\n</Table>;',
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Nothing yet, nothing at all, and something arriving',
    note: 'A first load draws skeleton rows, so the shape is visible before the content. A refresh over rows already read writes aria-busy and dims them without moving anything — a reader looking at row forty stays there.',
    snippet: defineSnippet({
      id: 'table-react-empty-and-loading',
      language: 'tsx',
      label: 'The three states of an empty body',
      source:
        '{\n  loading && rows.length === 0 ? (\n    <TableLoader skeletonRows={5} />\n  ) : rows.length === 0 ? (\n    <TableBody>\n      <TableEmpty>\n        <ResultState status="no-results" title="No invoices match this filter" />\n      </TableEmpty>\n    </TableBody>\n  ) : (\n    <TableBody>{rows}</TableBody>\n  );\n}',
    }),
  },
  {
    id: 'density',
    title: 'The same table, three sizes',
    note: 'The row reads the control height, the cell reads the control inset and the type reads the control step, so one theme decision retunes the rows, the buttons and the fields together. Density changes the size and never the meaning.',
    snippet: defineSnippet({
      id: 'table-react-density',
      language: 'tsx',
      label: 'A dense region',
      source: '<div data-slotted-density="dense">\n  <Table>{rows}</Table>\n</div>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the table did not choose',
    note: 'A forty-character identifier, a translated header twice as long as its English, a cell holding a Tag and a Link. The table is a grid of your own content, so the parts hold whatever a record needs rather than a string.',
    snippet: defineSnippet({
      id: 'table-react-content',
      language: 'tsx',
      label: 'A cell that is not a string',
      source:
        '<TableCell>\n  <Tag tone="danger">Overdue</Tag>\n</TableCell>;\n<TableRowHeader>\n  <Link href={`/invoices/${invoice.id}`}>{invoice.id}</Link>\n</TableRowHeader>;',
    }),
  },
  {
    id: 'listing',
    title: 'The screen this is reached for',
    note: 'Sorting, selection with a bulk action, a filter in a header, an identifier pinned at the start and actions pinned at the end, a paging control in the footer. Every piece beside the table is another family, composed rather than built in.',
    snippet: defineSnippet({
      id: 'table-react-listing',
      language: 'tsx',
      label: 'A listing screen',
      source:
        '<Table columns={5} selectionMode="multiple" stickyHeader variant="framed">\n  <TableContent>{/* header, rows, actions column */}</TableContent>\n  <TableFooter>\n    <Pagination page={page} onPageChange={setPage} total={total} />\n  </TableFooter>\n</Table>;',
    }),
  },
  {
    id: 'composition',
    title: 'Setting the table once, and reaching past it',
    note: 'The provider sets the frame and the layout for everything below it, SlottedProvider the language, and a table that states an axis itself still wins. Every part takes render, a ref and native props, so a part can become your own element without losing a data attribute.',
    snippet: defineSnippet({
      id: 'table-react-composition',
      language: 'tsx',
      label: 'An application deciding once',
      source:
        '<TableDefaultsProvider variant="framed" stickyHeader>\n  <App />\n</TableDefaultsProvider>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'Every control is its own tab stop',
    note: 'A table is not a composite widget, so the table binds no key: Tab reaches the scroller, then each sort button, checkbox and expander in DOM order. Shift with Space on a checkbox takes the range, which is the one gesture the family adds.',
    snippet: defineSnippet({
      id: 'table-react-keyboard',
      language: 'tsx',
      label: 'Nothing to wire',
      source:
        '// Enter and Space activate the buttons the table renders.\n// Shift + Space on a row checkbox selects from the anchor.\n// The scroller answers the arrow, Page, Home and End keys.',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The caption names the table, scope ties every value to its column and its record, aria-sort says the order and the announcer says it changed. A paged table states aria-rowcount so row three of twenty is row three of four hundred.',
    snippet: defineSnippet({
      id: 'table-react-accessibility',
      language: 'tsx',
      label: 'A paged table saying how large it is',
      source:
        '<TableContent totalRowCount={412}>\n  <TableBody>\n    <TableRow rowIndex={41} value="INV-1042">\n      <TableRowHeader>INV-1042</TableRowHeader>\n    </TableRow>\n  </TableBody>\n</TableContent>;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onSortChange',
    payload: '(value: TableSortDescriptor | null, request)',
    when: 'The column and the direction the reader asked for, or null when the third press clears it. The request carries the reason — pointer, keyboard, clear or programmatic — and cancel().',
  },
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request)',
    when: 'The chosen rows, in the collection order rather than the order they were pressed. The reason is select for a range or a select-all, clear when the set is emptied, pointer otherwise.',
  },
  {
    name: 'onExpandedChange',
    payload: '(value: readonly string[], request)',
    when: 'The rows whose detail is open, after the press that opened or closed one.',
  },
];

export const REACT_TABLE_DOCS = {
  table: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'sort',
        'TableSortDescriptor | null',
        '—',
        'Table',
        'The column the rows are ordered by. Present means you own it.',
      ],
      [
        'defaultSort',
        'TableSortDescriptor | null',
        'null',
        'Table',
        'The order an uncontrolled table starts in, read once',
      ],
      [
        'value',
        'readonly string[]',
        '—',
        'Table',
        'The chosen rows. Present means you own the selection.',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '[]',
        'Table',
        'The rows an uncontrolled table starts with',
      ],
      [
        'expanded',
        'readonly string[]',
        '—',
        'Table',
        'The rows whose detail is open. Present means you own it.',
      ],
      [
        'defaultExpanded',
        'readonly string[]',
        '[]',
        'Table',
        'The details an uncontrolled table starts with',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed'",
        'ruled',
        'Table',
        'How much of a frame the set is given',
      ],
      [
        'edges',
        "'inset' | 'flush'",
        'inset',
        'Table',
        'Whether the first and the last column keep the cell inset on their outer side. flush lines a plain or ruled table up with the heading around it, leaving the theme’s --slotted-table-edge-inset (0 unless set); a framed table ignores it. Sticky and selection columns keep their own offsets',
      ],
      ['striped', 'boolean', 'false', 'Table', 'A tinted ground on every second record'],
      [
        'stickyHeader',
        'boolean',
        'false',
        'Table',
        'Whether the header stays while the body scrolls',
      ],
      [
        'stickyFooter',
        'boolean',
        'false',
        'Table',
        'Whether the summary rows stay while the body scrolls. It pins the tfoot and not the footer bar, which never scrolls.',
      ],
      [
        'stickyTo',
        "'scroll' | 'page'",
        'scroll',
        'Table',
        'What the header stays inside: this table own scroller, or whatever scrolls outside it. page releases the scroller, so the table stops scrolling sideways in its frame.',
      ],
      [
        'options',
        'readonly TableFilterOption[]',
        '[]',
        'TableSetFilter',
        'The values the column can be filtered to, each with an optional count of its own. With operand tags they are a datalist and the set a typed value must belong to; without them any value is admitted.',
      ],
      [
        'operand',
        "'list' | 'tags'",
        'list',
        'TableSetFilter',
        'How the values are chosen: the search, the covering checkbox and the list, or tags-input holding the chosen values as chips. The descriptor is the same list either way.',
      ],
      [
        'presets',
        'ReactNode',
        '—',
        'TableDateFilter, TableTimeFilter, TableDateTimeFilter',
        'DateRangePickerPreset, TimeRangePickerPreset or DateTimeRangePickerPreset buttons offered inside the range picker between draws. The descriptor still receives two ISO values.',
      ],
      [
        'granularity',
        "'hour' | 'minute' | 'second'",
        'minute',
        'TableTimeFilter, TableDateTimeFilter',
        'The last unit the picker writes, and the precision the engine compares at: a minute-precision operand matches every second of its minute.',
      ],
      [
        'value',
        'TextFilter | NumberFilter | DateFilter | TimeFilter | DateTimeFilter | BooleanFilter | SetFilter | null',
        'null',
        'Table*Filter',
        'The descriptor the column is filtered by, typed as its own kind. Controlled when stated; defaultValue is the uncontrolled form, and onValueChange fires once, on Apply.',
      ],
      [
        'operators',
        'readonly FilterOperator[]',
        'the kind own list',
        'Table*Filter',
        'Narrows what the chooser offers, in the order given. defaultOperator picks the one the panel opens on.',
      ],
      [
        'conditions',
        '1 | 2',
        '2',
        'Table*Filter',
        'How many conditions the panel offers. The second appears once the first is complete.',
      ],
      [
        'renderOperand',
        '(props: TableFilterOperandProps) => ReactNode',
        '—',
        'Table*Filter',
        'Replaces the field the table would have drawn, and keeps the draft, the chooser, the join, the actions and the announcements.',
      ],
      [
        'searchThreshold',
        'number',
        '8',
        'TableSetFilter',
        'How many values bring a search with them. searchable states it outright.',
      ],
      [
        'cellAlign',
        "'start' | 'center' | 'end'",
        'center',
        'Table',
        'Where every cell content sits in a row as tall as its tallest cell. A cell states blockAlign to answer differently.',
      ],
      [
        'layout',
        "'auto' | 'fixed'",
        'auto',
        'Table',
        'Whether the browser sizes the columns from their content or from what you state',
      ],
      [
        'selectionMode',
        "'none' | 'single' | 'multiple'",
        'none',
        'Table',
        'How many records may be chosen at once',
      ],
      ['columns', 'number', '1', 'Table', 'How many columns the spanning parts span'],
      [
        'loading',
        'boolean',
        'false',
        'Table',
        'A refresh over rows already shown: aria-busy, and nothing moves',
      ],
      [
        'messages',
        'Partial<TableMessages>',
        '—',
        'Table',
        'Words laid over the language in force, key by key: selection, expansion, sort and every word of the column filters',
      ],
      ['skeletonRows', 'number', '5', 'TableLoader', 'How many skeleton rows a first load draws'],
      [
        'totalRowCount',
        'number',
        '—',
        'TableContent',
        'The size of the set behind a page, written as aria-rowcount',
      ],
      [
        'scrollLabelledBy',
        'string',
        '—',
        'TableContent',
        'The element that names the region instead, usually the caption',
      ],
      [
        'value',
        'string',
        '—',
        'TableRow',
        'The record key the selection and the expansion are held by',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'TableRow',
        'A record the reader may not choose; it leaves the set the header covers',
      ],
      [
        'rowIndex',
        'number',
        '—',
        'TableRow',
        'The record position in the whole set, written as aria-rowindex',
      ],
      [
        'current',
        'boolean',
        'false',
        'TableRow',
        'The record open elsewhere on the page, a detail pane beside the table, written as aria-current',
      ],
      [
        'interactive',
        'boolean',
        'true with onAction',
        'TableRow',
        'Paints the row as a thing the pointer presses',
      ],
      [
        'onAction',
        '(event) => void',
        '—',
        'TableRow',
        'A click anywhere in the row that lands on no control of its own; the first link or button in the row is the keyboard way in',
      ],
      [
        'end',
        'ReactNode',
        '—',
        'TableGroupRow',
        'What stands at the end of the band: the total or net of the group',
      ],
      [
        'column',
        'string',
        '—',
        'TableColumnHeader, TableSort',
        'The column key the sort descriptor names',
      ],
      [
        'align',
        "'start' | 'center' | 'end'",
        'start',
        'the three cell parts',
        'Which edge the value stands on, resolved logically',
      ],
      [
        'numeric',
        'boolean',
        'false',
        'the three cell parts',
        'Tabular figures, and the end edge unless align says otherwise',
      ],
      [
        'blockAlign',
        "'start' | 'center' | 'end'",
        'center',
        'the three cell parts and both selection cells',
        'Where this cell content sits in its row, overriding the table own cellAlign',
      ],
      [
        'text',
        "'wrap' | 'truncate' | 'nowrap'",
        'wrap',
        'the three cell parts',
        'What a value longer than its column does',
      ],
      [
        'sticky',
        "'start' | 'end'",
        'start',
        'the three cell parts and both selection cells',
        'Which edge the column is pinned to while the table scrolls past it',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'TableGroupRow',
        'Holds the band under the header while its rows scroll past',
      ],
      [
        'stickyOffset',
        'string',
        '0',
        'the three cell parts and both selection cells',
        'Where the pinned column stops, as a CSS length. Two columns pinned to the same edge need the second to state how wide the first is — beside a selection column that is --slotted-table-selection-size, which is 3rem.',
      ],
      [
        'colSpan',
        'number',
        '—',
        'TableDetail, TableEmpty',
        'How many columns the part spans, defaulting to the table own count',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Table, TableRow, TableSort',
        'Substitutes the rendered element, keeping every data attribute',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'every part', 'Reaches the element, and focus() with it'],
      [
        'handleRef',
        'RefObject<TableHandle>',
        '—',
        'TableContent',
        'scrollToRow(), overflowing() and refresh(): the three a prop cannot express',
      ],
      [
        'useTable()',
        '() => TableContextValue',
        '—',
        'inside a Table',
        'The sort, the selection and the words, for a part of your own',
      ],
      [
        'TableDefaultsProvider',
        'variant | striped | stickyHeader | stickyFooter | stickyTo | layout | selectionMode | columns',
        '—',
        'Application',
        'Sets those once for everything below it; a prop on the table still wins',
      ],
      [
        'scrollProps',
        "ComponentPropsWithRef<'div'>",
        '—',
        'TableContent',
        'Reaches the scroller: a height, a ref, a scroll listener of your own',
      ],
    ]),
    accessibility: [
      'The role is table and not grid, and the difference is the whole boundary with data-grid. The APG says a table "is not an interactive widget. Thus, its cells are not focusable or selectable", so every control inside is its own tab stop and the family binds no key. Column resizing, virtualisation, multi-column sort and row activation all need the grid pattern and are deferred to the family that has it.',
      'Every role comes from the platform: table, thead, tbody, tfoot, tr, th and td already carry table, rowgroup, row, columnheader, rowheader and cell. The family writes none of them, and it writes no aria-labelledby either — a caption is the accessible name by the browser own rule, whether it is visible or visually hidden.',
      'scope="col" on a column header and scope="row" on a row header are what make a screen reader repeat the column name and the record name in each cell. They are the two attributes §12 of the feature guide asks for by name.',
      'aria-sort is written on the sorted header and removed from every other, because ARIA has no way to state a sort level and a second sorted column would be silent or a lie. The change is also announced politely with the column and the direction: a property that changes silently is a change no reader hears, and none of the six surveyed implementations says it.',
      'A row is not selectable under this role, so it carries no aria-selected. The state is painted with data-selected and announced by the checkbox that owns it — the division list-item recorded — and the header checkbox states in its own name how many rows it covers.',
      'aria-rowcount and aria-rowindex are written exactly when you state a total larger than the DOM, which is what the Grid and Table Properties practice requires: the pair exists to say the DOM is not the whole set. The practice warns that writing aria-rowindex on some rows and not others has devastating effects, so the family writes neither unless you state both.',
      'The scroller becomes a region with a tab stop and a name only while the table overflows, measured rather than assumed. A wide table with no tab stop is unreachable without a pointer — a WCAG 2.2 level A failure — and a tab stop on a table that fits is one a reader presses for nothing.',
      'The expander is the Disclosure pattern: a button with aria-expanded, and with aria-controls naming the detail row while it is open. A closed detail is not rendered at all, so nothing is announced that a reader cannot reach.',
      'A selected row is said by its ground and its ink together, and by the checkbox mark. R1 of this repository forbids the rail two families reached for, and in the high-contrast scheme every tone ground is the page own white — so the mark is what survives, which is where WCAG 2.2 SC 1.4.1 puts the requirement.',
    ],
    snippets: [
      defineSnippet({
        id: 'table-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-layout="auto" data-part="root" data-ui="table" data-variant="framed">\n  <div data-part="scroll">\n    <table data-part="table">\n      <caption data-part="caption">Invoices</caption>\n      <thead data-part="head">\n        <tr data-part="row">\n          <th data-part="selection" scope="col" />\n          <th aria-sort="ascending" data-part="column-header" scope="col">\n            <button data-part="sort" type="button">\n              Invoice\n            </button>\n          </th>\n        </tr>\n      </thead>\n      <tbody data-part="body">\n        <tr data-part="row" data-selected data-value="INV-1042">\n          <td data-part="selection" />\n          <th data-part="row-header" scope="row">\n            INV-1042\n          </th>\n        </tr>\n      </tbody>\n    </table>\n  </div>\n  <div data-part="footer" />\n</div>;',
      }),
      defineSnippet({
        id: 'table-theming',
        language: 'css',
        label: 'Retuning the table for an application',
        source:
          "[data-ui='table'] {\n  --slotted-table-row-min-block-size: 40px;\n  --slotted-table-row-surface-hover: var(--slotted-tone-accent-subtle-hover);\n  --slotted-table-header-surface: var(--slotted-surface-sunken);\n  --slotted-table-border-color: var(--slotted-border-strong);\n}",
      }),
    ],
  },
} as const;
