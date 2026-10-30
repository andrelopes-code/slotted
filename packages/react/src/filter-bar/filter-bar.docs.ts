import filterBarTokens from '@slotted/styles/filter-bar/tokens.json';
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

export const REACT_FILTER_BAR_TOKENS = filterBarTokens.map((name) => ({
  name,
  purpose: 'Theme decision about the filter bar',
}));

const imports: ReferenceImport = {
  source:
    "import { FilterBar, FilterBarDefaultsProvider } from '@slotted/react';\nimport { createFilterGroupPredicate, createSearchPredicate } from '@slotted/core/filter';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The role="search" landmark with the family name. Carries data-ui="filter-bar", data-apply, data-size, data-dirty, data-open, data-sticky, data-readonly, data-disabled, data-loading. It is the query container; nothing on it changes grid.',
  },
  {
    part: 'frame',
    element: 'div',
    required: true,
    purpose:
      'The grid, an element inside the root, because a container query does not restyle the element it measures. Above 36rem, two rows: the search, the consumer’s controls and the count; then the bar, which wraps. Below, the search, the bar as a row that scrolls sideways, and the count.',
  },
  {
    part: 'search',
    element: 'div',
    required: true,
    purpose:
      'The global search field — a wrapped text-field — the first tab stop. Escape clears the query; the shortcut key lands here.',
  },
  {
    part: 'bar',
    element: 'div',
    required: true,
    purpose:
      'The role="toolbar" that holds everything that is not the search: one tab stop, and the arrows move through the summary, the pills, each segment of each chip, more, add, clear and the actions, from row to row. data-revealed while the folded chips are in view.',
  },
  {
    part: 'pill',
    element: 'button',
    required: false,
    purpose:
      'A pinned field without a condition: dashed edge, plus glyph, the name. Pressed, it gives way to the field’s chip, incomplete, with the value popover open; on a phone it opens the builder with the rule’s card.',
  },
  {
    part: 'add',
    element: 'button',
    required: true,
    purpose:
      'The trigger of the menu with the fields that have no rule yet, grouped by section and with each one’s glyph. With a chip on the bar it draws only the glyph, in a circle, data-compact; the label stays as name and title.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Drawn while something is applied. Returns a required field to its defaultValue and erases the rest, with the reason clear.',
  },
  {
    part: 'preset',
    element: 'div',
    required: false,
    purpose:
      'A wrapped select with the saved views. Choosing one replaces the tree with the reason select.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'Under apply="manual": reset and apply. In a builder group: add-rule, add-group, remove-group.',
  },
  {
    part: 'apply',
    element: 'button',
    required: false,
    purpose:
      'Applies the draft with the reason submit. Refuses while a required field has no value.',
  },
  { part: 'reset', element: 'button', required: false, purpose: 'Discards the draft.' },
  {
    part: 'summary',
    element: 'button',
    required: true,
    purpose:
      'First on the bar, drawn only below 36rem: "Filters (n)", which opens the builder. Outside the narrow width it is hidden and out of the focus ring.',
  },
  {
    part: 'end',
    element: 'div',
    required: true,
    purpose: 'The consumer’s controls — a sort, a column picker — projected as children.',
  },
  {
    part: 'chip',
    element: 'div',
    required: false,
    purpose:
      'A condition written in segments, role="group" named "<field>: <phrase>". data-pinned on a pinned field, data-incomplete while the operand is missing, data-folded beyond chipLimit, data-invalid on an unknown field or a required field without a value. Delete on any segment removes the condition.',
  },
  {
    part: 'chip-field',
    element: 'span',
    required: false,
    purpose: 'The field’s glyph and its name. Read only: the field of a condition is fixed.',
  },
  {
    part: 'chip-operator',
    element: 'button',
    required: false,
    purpose:
      'The operator, lighter than the ends. Opens a menu with the operators of the kind; an operator that needs a missing operand moves on to the value.',
  },
  {
    part: 'chip-value',
    element: 'button',
    required: false,
    purpose:
      'The value: two items and the rest as a number, the whole list in the name and the title. Opens a popover with the operand only; on a phone it also carries the operator’s words and opens the builder.',
  },
  {
    part: 'chip-remove',
    element: 'button',
    required: false,
    purpose:
      'Removes the condition with the reason remove. Absent on a required field and under readOnly.',
  },
  {
    part: 'more',
    element: 'button',
    required: false,
    purpose: '"+n more" while chips are folded; "Show less" when they are revealed.',
  },
  {
    part: 'count',
    element: 'p',
    required: false,
    purpose:
      'The count, in aria-live="polite": count of total in the figures of the current locale. With loading, a spinner and aria-busy.',
  },
  {
    part: 'builder',
    element: 'div',
    required: true,
    purpose:
      'The editor of the whole tree, inside a drawer. Carries its own data-ui because the drawer portals it.',
  },
  {
    part: 'group',
    element: 'fieldset',
    required: true,
    purpose:
      'A group of the tree: the header, the rows and the controls. From data-depth 1 on it is a box over the sunken surface, with its own remove in the header.',
  },
  {
    part: 'join',
    element: 'div',
    required: true,
    purpose:
      'The group header: "Match", the All/Any segmented-control, "of the following" and, in a nested group, Remove group at the end.',
  },
  {
    part: 'rules',
    element: 'div',
    required: true,
    purpose:
      'The group’s rows in a two-column grid: the joining word and the rule or the group, so that every field aligns.',
  },
  {
    part: 'conjunction',
    element: 'span',
    required: true,
    purpose:
      'The word before each row: "Where" on the first, "and" or "or" on the following ones, the group’s join.',
  },
  {
    part: 'rule',
    element: 'div',
    required: false,
    purpose:
      'A rule: field, operator, operand, remove. data-kind and data-operands for the grid; data-invalid on an unknown field; data-expanded on the open card of the narrow form.',
  },
  {
    part: 'rule-summary',
    element: 'button',
    required: false,
    purpose:
      'The rule’s phrase, header of the card when the builder is narrower than 30rem. Pressed, it opens or closes the card, one at a time; aria-expanded and aria-controls on the three controls.',
  },
  { part: 'field', element: 'div', required: false, purpose: 'The field select, wrapped.' },
  {
    part: 'operator',
    element: 'div',
    required: false,
    purpose: 'The operator select, with the names of the map that table already translates.',
  },
  {
    part: 'operand',
    element: 'div',
    required: false,
    purpose:
      'The control for the kind — text-field, number-field, date-picker, time-picker, datetime-picker, true/false select, multi-select — or whatever renderOperand returns. Two columns for between.',
  },
  {
    part: 'remove',
    element: 'button',
    required: false,
    purpose: 'Removes the rule from the group. Absent on a rule of a required field.',
  },
  {
    part: 'add-rule',
    element: 'button',
    required: true,
    purpose: 'Adds a rule to the group, on the first field.',
  },
  {
    part: 'add-group',
    element: 'button',
    required: true,
    purpose: 'Adds a group with the opposite join and one rule inside.',
  },
  {
    part: 'remove-group',
    element: 'button',
    required: false,
    purpose:
      'The trash glyph, named Remove group: removes a nested group with everything inside it. The root cannot be removed.',
  },
  {
    part: 'save-preset',
    element: 'button',
    required: false,
    purpose:
      'Asks the application to save the tree as a view, when onPresetSave exists. The application asks for the name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The bar’s axes over a list of orders, moved by the controls below the stage. Switch apply to manual and the bar edits a draft instead.',
    snippet: defineSnippet({
      id: 'filter-bar-react-playground',
      language: 'tsx',
      label: 'The bar over a list of orders',
      source:
        '<FilterBar\n  count={kept.length}\n  fields={FIELDS}\n  onValueChange={setFilter}\n  total={orders.length}\n  value={filter}\n/>;',
    }),
  },
  {
    id: 'listing',
    title: 'The bar over the table, and the same rule in both places',
    note: 'The consumer applies the tree with createFilterGroupPredicate and createSearchPredicate; the table below shrinks and the count says by how much. The Status column filter in the header edits the same object as the bar’s Status chip.',
    snippet: defineSnippet({
      id: 'filter-bar-react-listing',
      language: 'tsx',
      label: 'Applying the tree and the query to the rows',
      source:
        "const keep = createFilterGroupPredicate(filter, (row, field) => row[field]);\nconst find = createSearchPredicate(query, (row, field) => row[field], ['customer', 'id']);\nconst kept = orders.filter((row) => keep(row) && find(row));",
    }),
  },
  {
    id: 'pinned',
    title: 'Pinned fields: a dashed place that becomes a chip',
    note: 'pinned keeps the field always in view. Without a condition it is a dashed pill with + and the name — a place waiting to be filled; pressed, it gives way to the field’s chip, in the same place, incomplete and with the value popover open. Removing the condition brings the pill back.',
    snippet: defineSnippet({
      id: 'filter-bar-react-pinned',
      language: 'tsx',
      label: 'Two fields always in view',
      source:
        "const FIELDS = [\n  {\n    icon: 'circle',\n    key: 'status',\n    kind: 'set',\n    label: 'Status',\n    options: STATUSES,\n    pinned: true,\n  },\n  { key: 'customer', kind: 'text', label: 'Customer', pinned: true },\n  { key: 'amount', kind: 'number', label: 'Amount' },\n];",
    }),
  },
  {
    id: 'chips',
    title: 'Each condition written in segments',
    note: 'A chip is the condition’s phrase in segments: the field with its glyph, the lighter operator, the value, and the X. The operator opens a menu, the value a popover with the operand only — changing the comparison does not reopen the values. A long list writes two values and the rest as a number (Paid, Refunded +2), whole in the name and the title; a list of one reads as equality. Add filter creates the chip at once, dashed until it has a value, and left out of the emitted value until then. Beyond chipLimit the chips fold behind +n more.',
    snippet: defineSnippet({
      id: 'filter-bar-react-chips',
      language: 'tsx',
      label: 'Six chips in view and the rest folded',
      source: '<FilterBar chipLimit={6} defaultRevealed={false} fields={FIELDS} value={filter} />;',
    }),
  },
  {
    id: 'builder',
    title: 'The builder in a drawer',
    note: 'Add filter, a group chip or Filters (n) open the whole tree in a drawer; on a phone the drawer rises from the bottom as a sheet. Wider than 30rem each rule is a row of field, operator, operand and X; narrower, a card with the phrase that expands in place, one at a time. Apply requests the tree with the reason submit, Cancel and Escape discard.',
    snippet: defineSnippet({
      id: 'filter-bar-react-builder',
      language: 'tsx',
      label: 'Opening the builder from outside',
      source:
        'const bar = useRef<FilterBarHandle>(null);\n<FilterBar\n  defaultOpen={false}\n  fields={FIELDS}\n  onOpenChange={(open, request) => log(request.reason)}\n  ref={bar}\n/>;\nbar.current?.open();',
    }),
  },
  {
    id: 'groups',
    title: 'Nested AND/OR groups',
    note: 'A group inside a group is a box over the sunken surface, with the opposite join and the trash that removes it; in a narrow builder it becomes a rail on the start edge, which costs ten pixels per level instead of eighty. On the bar it appears as a single chip, with the phrase in parentheses, that opens the builder.',
    snippet: defineSnippet({
      id: 'filter-bar-react-groups',
      language: 'tsx',
      label: 'The tree the bar holds',
      source:
        "const filter = {\n  join: 'and',\n  rules: [\n    { field: 'status', filter: setFilter(['paid']) },\n    {\n      join: 'or',\n      rules: [\n        {\n          field: 'amount',\n          filter: {\n            kind: 'number',\n            join: 'and',\n            conditions: [{ operator: 'greaterThan', value: 1000 }],\n          },\n        },\n        {\n          field: 'priority',\n          filter: { kind: 'boolean', join: 'and', conditions: [{ operator: 'is', value: true }] },\n        },\n      ],\n    },\n  ],\n};",
    }),
  },
  {
    id: 'manual',
    title: 'Applying in a batch',
    note: 'With apply="manual" each edit goes to a draft: the root becomes data-dirty, Reset discards, Apply requests the tree and the query with the reason submit. Enter on an operand applies. It is the Go of Fiori and the batch of Carbon.',
    snippet: defineSnippet({
      id: 'filter-bar-react-manual',
      language: 'tsx',
      label: 'One request per Apply, not per key',
      source:
        "<FilterBar\n  apply=\"manual\"\n  fields={FIELDS}\n  onQueryChange={(query, request) => request.reason === 'submit' && fetch(query)}\n  onValueChange={(filter, request) => request.reason === 'submit' && fetch(filter)}\n/>;",
    }),
  },
  {
    id: 'required',
    title: 'A required field with a default',
    note: 'required pins the field and gives it a defaultValue: Clear returns it to the default instead of erasing it, the chip has no X, and an Apply with the field empty is refused — the chip stays dashed and data-invalid, and the message is announced.',
    snippet: defineSnippet({
      id: 'filter-bar-react-required',
      language: 'tsx',
      label: 'A listing always limited to one company',
      source:
        "const company = {\n  key: 'company',\n  kind: 'set',\n  label: 'Company',\n  options: COMPANIES,\n  required: true,\n  defaultValue: setFilter(['acme']),\n};",
    }),
  },
  {
    id: 'presets',
    title: 'Saved views',
    note: 'presets appears as a select at the end of the bar: choosing one replaces the tree with the reason select; editing afterwards keeps the chosen view and marks the root data-dirty. Saving belongs to the application — onPresetSave hands over the tree, and the application asks for the name.',
    snippet: defineSnippet({
      id: 'filter-bar-react-presets',
      language: 'tsx',
      label: 'Choosing and saving a view',
      source:
        "<FilterBar\n  fields={FIELDS}\n  onPresetChange={(key) => setView(key)}\n  onPresetSave={(filter) => askForName(filter)}\n  preset={view}\n  presets={[{ key: 'overdue', label: 'Overdue this month', value: OVERDUE }]}\n/>;",
    }),
  },
  {
    id: 'query',
    title: 'The global search',
    note: 'The query is the only field that belongs to no column. Debounced by queryDelay under live; Escape clears with the reason clear; shortcut is the document key that reaches the field, drawn inside it with kbd — and hidden where the primary input is a touch screen, where there is no key to press.',
    snippet: defineSnippet({
      id: 'filter-bar-react-query',
      language: 'tsx',
      label: 'The search with the bar at 120ms and a shortcut',
      source:
        '<FilterBar fields={FIELDS} onQueryChange={setQuery} query={query} queryDelay={120} shortcut="/" />;',
    }),
  },
  {
    id: 'url',
    title: 'The state in a URL',
    note: 'toFilterBarParams writes f=and(…) and q=; fromFilterBarParams reads them back, and an f.<column> written by a table without a bar becomes a top-level group. parseFilterGroup is total: a marker from an older version degrades to no filter.',
    snippet: defineSnippet({
      id: 'filter-bar-react-url',
      language: 'tsx',
      label: 'Round trip through the query string',
      source:
        "const params = toFilterBarParams({ filter, query });\nhistory.replaceState(null, '', `?${params}`);\nconst restored = fromFilterBarParams(location.search);",
    }),
  },
  {
    id: 'count',
    title: 'The count as a live region',
    note: 'count and total are the consumer’s numbers, written in the figures of the current locale. The part is aria-live="polite", so a change in the filter is heard as its effect; with loading the count gives way to a spinner and aria-busy.',
    snippet: defineSnippet({
      id: 'filter-bar-react-count',
      language: 'tsx',
      label: 'How many are left, out of how many',
      source: '<FilterBar count={128} fields={FIELDS} loading={fetching} total={3412} />;',
    }),
  },
  {
    id: 'narrow',
    title: 'On a phone: a row that scrolls sideways and a sheet',
    note: 'Below 36rem the search sits on top and the bar becomes a row that scrolls sideways: Filters (n) first, every chip — the folded ones too —, then the empty pills; the chip cut at the edge says the row continues. Each chip has three targets: the field, the value with the operator’s words, the X. Tapping a value, a pill or Filters opens the builder as a sheet, with the rule’s card open. Resize the stage.',
    snippet: defineSnippet({
      id: 'filter-bar-react-narrow',
      language: 'tsx',
      label: 'The bar in a phone-sized container',
      source:
        "<div style={{ inlineSize: '22rem' }}>\n  <FilterBar fields={FIELDS} value={filter} />\n</div>;",
    }),
  },
  {
    id: 'sticky',
    title: 'Stuck under the page header',
    note: 'sticky reads --slotted-page-sticky-top, sticks the bar there, and adds its own height to the property on the parent element for what comes next — a table with a sticky header sticks below the bar, not below the title.',
    snippet: defineSnippet({
      id: 'filter-bar-react-sticky',
      language: 'tsx',
      label: 'The bar and the table stuck in a chain',
      source:
        '<>\n  <FilterBar fields={FIELDS} sticky value={filter} />\n  <Table stickyHeader>…</Table>\n</>;',
    }),
  },
  {
    id: 'states',
    title: 'Disabled, loading, read only',
    note: 'disabled turns off every control and keeps the width; loading keeps the controls, turns off Apply and puts the spinner in place of the count; readOnly leaves every condition reachable and readable — the segments keep their stop with aria-disabled — and draws no X, add, clear or empty pills.',
    snippet: defineSnippet({
      id: 'filter-bar-react-states',
      language: 'tsx',
      label: 'The three states of the whole bar',
      source:
        '<>\n  <FilterBar disabled fields={FIELDS} />\n  <FilterBar fields={FIELDS} loading />\n  <FilterBar fields={FIELDS} readOnly value={filter} />\n</>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A value of eleven items writes two and the rest as a number, whole in the title and in the accessible name; a long value truncates at 12rem; an Arabic label next to an ISO date does not reorder the date, because field, operator and value are isolated runs; an unknown field is an invalid, removable chip.',
    snippet: defineSnippet({
      id: 'filter-bar-react-content',
      language: 'tsx',
      label: 'A long chip, an RTL label, a field that no longer exists',
      source:
        "<FilterBar\n  dir=\"rtl\"\n  fields={[{ key: 'city', kind: 'set', label: 'المدينة', options: CITIES }]}\n  value={filter}\n/>;",
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab: the search, then the bar — two stops. The arrows move through every control of the bar, segment by segment, from row to row and mirrored in RTL; Home and End at the ends. Enter on the operator opens the menu, on the value the popover; Delete on any segment removes the condition with the reason remove and focus goes to the same segment of the next chip; Escape clears the search or closes the surface.',
    snippet: defineSnippet({
      id: 'filter-bar-react-keyboard',
      language: 'tsx',
      label: 'What is heard when a chip is removed',
      source:
        '// "Amount filter removed" — and focus moves to the next chip, or to\n// Add filter when none is left.\n<FilterBar fields={FIELDS} onValueChange={(next, request) => request.reason === \'remove\'} />;',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: FilterGroup | null, request)',
    when: 'Before the tree moves. The reason is pointer, keyboard, clear, remove, select, submit or programmatic; cancelling moves nothing. The tree arrives normalized: no incomplete rules, null when nothing is left.',
  },
  {
    name: 'onQueryChange',
    payload: '(query: string, request)',
    when: 'After queryDelay under live, or with submit under manual; clear when Escape or the field’s X clears it.',
  },
  {
    name: 'onPresetChange',
    payload: '(preset: string | null, request)',
    when: 'When a view is chosen in the select, with select; clear when the select is emptied.',
  },
  {
    name: 'onPresetSave',
    payload: '(value: FilterGroup | null)',
    when: 'When the reader presses "Save as view…" in the builder. The family does not save: it asks.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request)',
    when: 'Before the builder opens or closes: pointer, keyboard, escape, outsidePress, dismiss, submit, programmatic.',
  },
  {
    name: 'onRevealedChange',
    payload: '(revealed: boolean, request)',
    when: 'Before the folded chips appear or fold again.',
  },
];

export const REACT_FILTER_BAR_DOCS = {
  filterBar: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'fields',
        'FilterBarField[]',
        '—',
        'FilterBar',
        'The filterable fields: key, label, kind, icon (glyph name or node), operators, pinned, required, defaultValue, section, options, searchable',
      ],
      [
        'value',
        'FilterGroup | null',
        '—',
        'FilterBar',
        'The tree the consumer owns. Present means controlled, for the life of the bar',
      ],
      [
        'defaultValue',
        'FilterGroup | null',
        '—',
        'FilterBar',
        'Where an uncontrolled bar starts, read once',
      ],
      ['query', 'string', '—', 'FilterBar', 'The global search, controlled'],
      ['defaultQuery', 'string', '', 'FilterBar', 'The search an uncontrolled bar starts with'],
      ['presets', 'FilterBarPreset[]', '—', 'FilterBar', 'The saved views: key, label, value'],
      ['preset', 'string | null', '—', 'FilterBar', 'The current view, controlled'],
      ['defaultPreset', 'string | null', 'null', 'FilterBar', 'The view it starts with'],
      ['open', 'boolean', '—', 'FilterBar', 'Whether the builder is open, controlled'],
      ['defaultOpen', 'boolean', 'false', 'FilterBar', 'Whether it starts open'],
      ['revealed', 'boolean', '—', 'FilterBar', 'Whether the folded chips are in view, controlled'],
      ['defaultRevealed', 'boolean', 'false', 'FilterBar', 'Whether they start in view'],
      [
        'apply',
        "'live' | 'manual'",
        'live',
        'FilterBar',
        'Requests on every edit, or edits a draft until Apply',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'FilterBar',
        'Sticks under the page header and adds its height to what follows',
      ],
      [
        'container',
        'Element | null',
        '—',
        'FilterBar',
        'A parent for the builder drawer only, instead of the shared portal root',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'FilterBar', 'The step of the controls'],
      [
        'queryDelay',
        'number',
        '320',
        'FilterBar',
        'Milliseconds the search and a text operand wait under live',
      ],
      ['chipLimit', 'number', '6', 'FilterBar', 'Chips in view before folding'],
      [
        'shortcut',
        'string | null',
        'null',
        'FilterBar',
        'The document key that focuses the search, outside an editable field',
      ],
      ['disabled', 'boolean', 'false', 'FilterBar', 'Turns off every control'],
      [
        'readOnly',
        'boolean',
        'false',
        'FilterBar',
        'Every condition reachable and readable, none changeable: no X, add, clear or empty pills',
      ],
      [
        'loading',
        'boolean',
        'false',
        'FilterBar',
        'Keeps the width, turns off Apply, spinner in place of the count',
      ],
      ['count', 'number', '—', 'FilterBar', 'How many rows the filter kept'],
      ['total', 'number', '—', 'FilterBar', 'How many there are'],
      [
        'messages',
        'Partial<FilterBarMessages>',
        '—',
        'FilterBar',
        'Words over those of the current locale, key by key: the landmark name (bar), the controls, the chip names, the count and the announcements',
      ],
      [
        'renderOperand',
        '(props: FilterBarOperandProps) => ReactNode',
        '—',
        'FilterBar',
        'Replaces the operand control; undefined keeps the one for the kind',
      ],
      ['children', 'ReactNode', '—', 'FilterBar', 'The consumer’s controls in the end slot'],
    ]),
    composition: apiRows([
      [
        'renderOperand',
        '(props) => ReactNode',
        '—',
        'FilterBar',
        'The seam table uses: date-range-picker on a between, tags-input on a large set',
      ],
      [
        'children',
        'ReactNode',
        '—',
        'FilterBar',
        'The end slot: a sort, a column picker, outside the toolbar ring',
      ],
      [
        'ref',
        'Ref<FilterBarHandle>',
        '—',
        'FilterBar',
        'focusSearch(), open(), root — the actions a prop does not express',
      ],
      [
        'FilterBarDefaultsProvider',
        'apply | chipLimit | queryDelay | shortcut | size',
        '—',
        'Application',
        'Decides once for everything below; a prop on the bar wins',
      ],
      [
        'onKeyDown, id, aria-*, data-*',
        'native props',
        '—',
        'FilterBar',
        'Reach the root; the consumer’s handler runs before the family’s',
      ],
    ]),
    accessibility: [
      'The root is role="search", not role="toolbar": the APG Toolbar pattern asks a toolbar to avoid controls that need the arrows, and the search field is one. The search is the first tab stop and the toolbar the second — two stops however many fields there are; the APG note on multi-row toolbars lets the arrows move from row to row.',
      'A chip is role="group" named "<field>: <phrase>", the same phrase describeFilter gives to the table announcement, and ", incomplete" while the value is missing. The operator has aria-haspopup="menu", the value aria-haspopup="dialog" and the name with the whole list, the X "Remove <field>". Delete and Backspace on any segment remove with the reason remove and focus goes to the segment of the same role on the next chip, the previous one, or Add filter.',
      'A pill has aria-haspopup="dialog"; under readOnly the toolbar carries aria-description="Read only" and the segments keep their stop with aria-disabled, and a locked value names the whole list the popover no longer shows.',
      'The count is itself the live region, in polite, so the effect of a filter is heard; applying, clearing, removing a chip and choosing a view are announced by the shared live-announcer.',
      'The builder is a drawer: modal, Escape closes and discards, focus returns to the trigger. Each group is a fieldset with a legend, each rule three named controls — Field, Operator, Value or From and To.',
      'Below 36rem the operator, more, add and clear leave the focus ring with visibility hidden, not only the drawing: a stop where nothing is seen is a stop that does not exist. The builder’s closed cards take the three controls out of the ring the same way; the card’s phrase has aria-expanded and aria-controls.',
    ],
    snippets: [
      defineSnippet({
        id: 'filter-bar-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  aria-label="Filter"\n  data-apply="live"\n  data-part="root"\n  data-size="md"\n  data-ui="filter-bar"\n  role="search"\n>\n  <div data-part="frame">\n    <div data-part="search">…</div>\n    <div aria-label="Filters" data-part="bar" role="toolbar">\n      <button data-part="summary">Filters (2)</button>\n      <div aria-label="Status: any of Paid, Refunded" data-part="chip" role="group">\n        <span data-part="chip-field">Status</span>\n        <button aria-haspopup="menu" data-part="chip-operator">\n          any of\n        </button>\n        <button aria-haspopup="dialog" data-part="chip-value">\n          Paid, Refunded\n        </button>\n        <button aria-label="Remove Status" data-part="chip-remove" />\n      </div>\n      <button aria-haspopup="dialog" data-part="pill">\n        Owner\n      </button>\n      <button aria-label="Add filter" data-compact="" data-part="add" />\n    </div>\n    <p aria-live="polite" data-part="count">\n      128 of 3,412\n    </p>\n  </div>\n</div>;',
      }),
      defineSnippet({
        id: 'filter-bar-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='filter-bar'] {\n  --slotted-filter-bar-pill-radius: var(--slotted-radius-md);\n  --slotted-filter-bar-value-max: 16rem;\n  --slotted-filter-bar-search-max: 36rem;\n}",
      }),
    ],
  },
} as const;
