import cascaderTokens from '@slotted/styles/cascader/tokens.json';
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

export const ANGULAR_CASCADER_TOKENS = cascaderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Cascader decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideCascaderDefaults, SlCascader, SlCascaderNode, SlCascaderPanel } from '@slotted/angular/cascader';",
  selector: 'sl-cascader, sl-cascader-panel, ng-template[slCascaderNode]',
  exportAs: 'slCascader, slCascaderPanel',
};

const row = (part: string, element: string, required: boolean, purpose: string): AnatomyRow => ({
  part,
  element,
  required,
  purpose,
});

const anatomy: AnatomyRow[] = [
  row(
    'root',
    'div',
    true,
    'The field: select’s frame, with the size, the variant and every state as data attributes.',
  ),
  row(
    'trigger',
    'button',
    true,
    'role="combobox". It names the tree it opens with aria-haspopup="tree", or dialog when search is on, and names the active node with aria-activedescendant.',
  ),
  row(
    'value',
    'span',
    false,
    'The path of the chosen node, or the summary of a multiple selection. The whole path stays in the DOM, so the name is never the ellipsis.',
  ),
  row(
    'value-segment',
    'span',
    false,
    'One level of the path. The middle segments give way first, the chosen place last.',
  ),
  row(
    'value-separator',
    'span',
    false,
    'The separator between two segments, hidden from a reader who hears the segments as one name.',
  ),
  row('placeholder', 'span', false, 'What the control says while nothing is chosen.'),
  row(
    'tags',
    'span',
    false,
    'The chips of a multiple selection, beside the trigger rather than in it, each with its own remove control.',
  ),
  row(
    'summary',
    'span',
    false,
    '“3 selected”: the name of a multiple selection, shown when the control is too narrow for chips.',
  ),
  row('clear', 'button', false, 'Clears the value and gives focus back to the trigger.'),
  row(
    'busy',
    'span',
    false,
    'The ring where the chevron stands while the value’s path is resolving.',
  ),
  row('arrow', 'span', false, 'The chevron, turned over while the popup is open.'),
  row(
    'positioner',
    'div',
    true,
    'The layer the positioner places. It carries data-layout and reserves the widest width the window of columns can reach, so a growing path never moves it.',
  ),
  row(
    'content',
    'div',
    true,
    'The surface. role="dialog" with search; on its own, with data-ui, it is the panel on the page.',
  ),
  row('search', 'div', false, 'The search row, under search.'),
  row(
    'search-input',
    'input',
    false,
    'role="combobox" with aria-autocomplete="list"; it holds focus and the active descendant while the popup is open.',
  ),
  row(
    'breadcrumb',
    'nav',
    false,
    'The levels behind the ones on show: in drill always, in columns once the window has slid. One line; a deep trail folds its middle into one crumb.',
  ),
  row(
    'crumb',
    'button',
    false,
    'A level to go back to. The level on show carries aria-current="location"; the fold carries data-collapsed.',
  ),
  row('panel', 'div', true, 'role="tree", aria-multiselectable under a multiple selection.'),
  row(
    'column',
    'div',
    true,
    'role="group", named by the branch whose children it lists. One per level in columns, one in drill and tree.',
  ),
  row(
    'node',
    'div',
    true,
    'role="treeitem" with aria-level, aria-posinset, aria-setsize, aria-expanded on a branch and aria-selected or aria-checked.',
  ),
  row(
    'indicator',
    'span',
    false,
    'The check of a single selection at the end, or the box of a multiple selection at the start.',
  ),
  row('icon', 'span', false, 'The node’s own picture, from the node template.'),
  row(
    'label',
    'span',
    true,
    'The node’s name, from the slCascaderNode template or the label. It clamps at two lines.',
  ),
  row('match', 'mark', false, 'The span of a label a query matched.'),
  row(
    'description',
    'span',
    false,
    'A line under the label, from getDescription, or the road to a search hit.',
  ),
  row('meta', 'span', false, 'The count of a branch, or how many inside it are chosen.'),
  row(
    'expander',
    'span',
    false,
    'The chevron of a branch, pointing along the reading direction; the spinner while its level loads.',
  ),
  row('loader', 'div', false, 'A row of the level on its way, the height of a node.'),
  row(
    'status',
    'div',
    false,
    'role="status": how many results a query found, or a level that failed with its retry.',
  ),
  row('empty', 'div', false, 'A level with nothing in it, or a query with no answer.'),
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One cascader with the common axes on it. Open it, walk the levels with the arrows, and choose a place.',
    snippet: defineSnippet({
      id: 'cascader-angular-playground',
      language: 'angular',
      label: 'A place in a hierarchy',
      source: `<sl-cascader
  aria-label="Location"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
  [(value)]="place"
/>`,
    }),
  },
  {
    id: 'columns',
    title: 'Columns',
    note: 'One column per level of the path, side by side: the road from the first column to the value reads as one line, and each count ends on one edge.',
    snippet: defineSnippet({
      id: 'cascader-angular-columns',
      language: 'angular',
      label: 'Columns, asked for by name',
      source: `<sl-cascader
  layout="columns"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'drill',
    title: 'Drill',
    note: 'One level at a time, with the levels behind it in a breadcrumb. It is what layout="auto" chooses where two columns do not fit.',
    snippet: defineSnippet({
      id: 'cascader-angular-drill',
      language: 'angular',
      label: 'One level at a time',
      source: `<sl-cascader
  layout="drill"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'tree',
    title: 'Tree',
    note: 'Every level in one indented list, branches opening in place. The chevron turns down as its level opens.',
    snippet: defineSnippet({
      id: 'cascader-angular-tree',
      language: 'angular',
      label: 'An indented list',
      source: `<sl-cascader
  layout="tree"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'layout-auto',
    title: 'Layout from the room',
    note: 'The same cascader in a narrow and a wide container. The narrow one drills; the wide one shows columns, never more than maxColumns, and slides past a level when the path is deeper.',
    snippet: defineSnippet({
      id: 'cascader-angular-layout-auto',
      language: 'angular',
      label: 'The layout follows the room',
      source: `<sl-cascader
  layout="auto"
  [maxColumns]="3"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'search',
    title: 'Search',
    note: 'A query finds a node at any depth and prints the road to it under the label. The navigation path is untouched, and clearing the query shows it again.',
    snippet: defineSnippet({
      id: 'cascader-angular-search',
      language: 'angular',
      label: 'Search every level',
      source: `<sl-cascader search [nodes]="places" [getKey]="key" [getLabel]="label" [getChildren]="children" />`,
    }),
  },
  {
    id: 'multiple',
    title: 'Multiple',
    note: 'A box per node. A branch’s box takes everything below it, a branch partly chosen shows the dash, and checkedStrategy decides whether the branch or its leaves are emitted.',
    snippet: defineSnippet({
      id: 'cascader-angular-multiple',
      language: 'angular',
      label: 'Many places, emitted as their parents',
      source: `<sl-cascader
  selectionMode="multiple"
  checkedStrategy="parent"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'any-level',
    title: 'Any level',
    note: 'selectable="any" lets a branch be chosen: pressing it opens its level and chooses it, so a reader can stop at a country or go on to a city.',
    snippet: defineSnippet({
      id: 'cascader-angular-any-level',
      language: 'angular',
      label: 'A branch is a value too',
      source: `<sl-cascader
  selectable="any"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'lazy',
    title: 'Levels on demand',
    note: 'A branch whose children have not arrived asks for them as its level is shown, with a signal the family aborts if the reader moves on. The rows wait as the shape of what is coming.',
    snippet: defineSnippet({
      id: 'cascader-angular-lazy',
      language: 'angular',
      label: 'Load a level as it is opened',
      source: `<sl-cascader
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
  [hasChildren]="hasChildren"
  [isNodeLoading]="isLoading"
  (loadChildren)="load($event.key, $event.signal)"
/>`,
    }),
  },
  {
    id: 'value-path',
    title: 'The path in the control',
    note: 'A long path gives way in the middle, keeping the place itself, and a value template replaces the segments with anything the consumer draws.',
    snippet: defineSnippet({
      id: 'cascader-angular-value-path',
      language: 'angular',
      label: 'How the value reads',
      source: `<sl-cascader
  separator="›"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'panel',
    title: 'Panel',
    note: 'The same tree on the page, without a control or a layer. The tree takes focus itself and walks by the same keys.',
    snippet: defineSnippet({
      id: 'cascader-angular-panel',
      language: 'angular',
      label: 'Embedded in a page',
      source: `<sl-cascader-panel
  aria-label="Category"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled, read-only, invalid, a disabled node, a level that failed with its retry, and a query with no answer.',
    snippet: defineSnippet({
      id: 'cascader-angular-states',
      language: 'angular',
      label: 'Every state a reader can meet',
      source: `<sl-cascader
  [disabled]="true"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>
<sl-cascader
  [readOnly]="true"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>
<sl-cascader
  [invalid]="true"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Down opens; Right enters a level, Left goes back, both mirrored in right-to-left; Up and Down stay in the column; Enter chooses; a letter jumps in the level.',
    snippet: defineSnippet({
      id: 'cascader-angular-keyboard',
      language: 'angular',
      label: 'The keys',
      source: `<sl-cascader
  aria-label="Location"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
/>`,
    }),
  },
  {
    id: 'composition',
    title: 'In a form',
    note: 'A form control with ControlValueAccessor and a Validator: required, and unresolved for a key the hierarchy no longer holds.',
    snippet: defineSnippet({
      id: 'cascader-angular-composition',
      language: 'angular',
      label: 'A field in a reactive form',
      source: `<sl-cascader
  aria-label="Delivery area"
  [required]="true"
  [nodes]="places"
  [getKey]="key"
  [getLabel]="label"
  [getChildren]="children"
  [formControl]="area"
/>`,
    }),
  },
];

const api = apiRows([
  [
    'nodes',
    'readonly T[]',
    '[]',
    'sl-cascader, sl-cascader-panel',
    'The roots, nested, or a flat list read with getParent.',
  ],
  [
    'getKey',
    '(node) => string',
    '—',
    'sl-cascader, sl-cascader-panel',
    'A stable key, which is also the value.',
  ],
  [
    'getLabel',
    '(node) => string',
    '—',
    'sl-cascader, sl-cascader-panel',
    'The name, which search and typeahead read.',
  ],
  [
    'getChildren',
    '(node) => T[] | undefined',
    '—',
    'sl-cascader, sl-cascader-panel',
    'The children of a nested node.',
  ],
  [
    'getParent',
    '(node) => string | null',
    '—',
    'sl-cascader, sl-cascader-panel',
    'Opts in to a flat list; an unknown parent makes a root.',
  ],
  [
    'hasChildren',
    '(node) => boolean',
    '—',
    'sl-cascader, sl-cascader-panel',
    'A branch whose children have not arrived says so.',
  ],
  [
    'isNodeDisabled',
    '(node) => boolean',
    '—',
    'sl-cascader, sl-cascader-panel',
    'Stays on show and reachable, never chosen.',
  ],
  [
    'isNodeLoading',
    '(node) => boolean',
    '—',
    'sl-cascader, sl-cascader-panel',
    'The children of this branch are on their way.',
  ],
  [
    'isNodeFailed',
    '(node) => boolean',
    '—',
    'sl-cascader, sl-cascader-panel',
    'The children of this branch could not be loaded.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'sl-cascader, sl-cascader-panel',
    'The roots are on their way: the first level waits as rows and the control shows the ring.',
  ],
  [
    'value',
    'model<string | null | string[]>',
    'null',
    'sl-cascader, sl-cascader-panel',
    'A scalar for one choice, a list for many. A model, so [(value)] is both the value and the write-back.',
  ],
  ['open', 'model<boolean>', 'false', 'sl-cascader', 'Whether the popup is showing.'],
  [
    'path',
    'model<readonly string[]>',
    '[]',
    'sl-cascader, sl-cascader-panel',
    'The branches whose levels are on show, root first.',
  ],
  [
    'activeKey',
    'model<string | null>',
    'null',
    'sl-cascader, sl-cascader-panel',
    'The node under the cursor.',
  ],
  [
    'expandedKeys',
    'model<readonly string[]>',
    '[]',
    'sl-cascader, sl-cascader-panel',
    'The branches open in place, under layout="tree".',
  ],
  [
    'searchValue',
    'model<string>',
    "''",
    'sl-cascader, sl-cascader-panel',
    'The query, under search.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-cascader, sl-cascader-panel',
    'The control and the surface together.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'sl-cascader',
    'sl-select’s three frames.',
  ],
  ['fullWidth', 'boolean', 'true', 'sl-cascader', 'Whether the control fills its field.'],
  [
    'layout',
    "'auto' | 'columns' | 'drill' | 'tree'",
    'auto',
    'sl-cascader, sl-cascader-panel',
    'auto shows columns while two fit and drills below that.',
  ],
  [
    'selectionMode',
    "'single' | 'multiple'",
    'single',
    'sl-cascader, sl-cascader-panel',
    'One place, or many.',
  ],
  [
    'selectable',
    "'leaf' | 'any' | (node) => boolean",
    'leaf',
    'sl-cascader, sl-cascader-panel',
    'Which nodes a single selection may commit.',
  ],
  [
    'checkedStrategy',
    "'all' | 'parent' | 'child'",
    'all',
    'sl-cascader, sl-cascader-panel',
    'Which keys a multiple selection emits.',
  ],
  [
    'expandOn',
    "'press' | 'hover'",
    'press',
    'sl-cascader, sl-cascader-panel',
    'Whether a rest on a branch shows its level. Hover never commits.',
  ],
  ['closeOnSelect', 'boolean', 'true', 'sl-cascader', 'Whether a single commit closes the popup.'],
  [
    'search',
    'boolean',
    'false',
    'sl-cascader, sl-cascader-panel',
    'A field that finds nodes at any depth.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'sl-cascader',
    'Whether a clear button stands in the control while it holds a value.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'sl-cascader',
    'Whether the layer is rendered at the end of the document.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-cascader',
    'Never opens and answers nothing; a disabled form control says the same.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'sl-cascader, sl-cascader-panel',
    'Opens and walks, and refuses every change.',
  ],
  [
    'required',
    'boolean',
    'false',
    'sl-cascader',
    'Says aria-required, and the Validator reports required.',
  ],
  ['invalid', 'boolean', 'false', 'sl-cascader', 'Says aria-invalid and paints the frame.'],
  ['separator', 'string', '/', 'sl-cascader', 'Between two segments of the path.'],
  [
    'hoverDelay',
    'number',
    '150',
    'sl-cascader, sl-cascader-panel',
    'How long a rest on a branch waits before its level shows, under expandOn="hover".',
  ],
  [
    'maxColumns',
    'number',
    '3',
    'sl-cascader, sl-cascader-panel',
    'The most columns on show at once, whatever the room.',
  ],
  [
    'maxCrumbs',
    'number',
    '4',
    'sl-cascader, sl-cascader-panel',
    'The most crumbs before the middle folds.',
  ],
  ['name', 'string', '—', 'sl-cascader', 'Submits one hidden input per emitted key.'],
  [
    'messages',
    'Partial<CascaderMessages>',
    '—',
    'sl-cascader, sl-cascader-panel',
    'Words laid over the language in force, key by key: placeholder, clear, remove ({label}), summary ({count}), search, searchPlaceholder, root, back ({label}), breadcrumb, empty, noResults ({query}), results ({count}), loading, failed ({label}), retry',
  ],
  [
    'valueTemplate',
    'TemplateRef<{ $implicit: T[] }>',
    '—',
    'sl-cascader',
    'The value’s path as the control prints it.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<CascaderValue>',
    when: 'Before the value moves: pointer, keyboard, select, clear, remove or programmatic. cancel() refuses it.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the popup opens or closes, with the reason.',
  },
  {
    name: 'pathChangeRequest',
    payload: 'ChangeRequest<string[]>',
    when: 'Before a level is shown or left.',
  },
  {
    name: 'activeKeyChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the cursor moves.',
  },
  {
    name: 'expandedKeysChangeRequest',
    payload: 'ChangeRequest<string[]>',
    when: 'Before a branch opens or closes in place, under layout="tree".',
  },
  {
    name: 'searchValueChangeRequest',
    payload: 'ChangeRequest<string>',
    when: 'Before the query changes.',
  },
  {
    name: 'loadChildren',
    payload: '{ key, signal }',
    when: 'A level that has not arrived is shown. The signal aborts when the path moves away or the popup closes.',
  },
  { name: 'retry', payload: 'string', when: 'The reader pressed retry on a level that failed.' },
];

const composition = apiRows([
  [
    'provideCascaderDefaults',
    'provider',
    '—',
    'Application',
    'Sets every axis once, in the bootstrap or on a route; the words come from the language in force (provideSlotted). A cascader that states one itself still wins.',
  ],
  [
    'ng-template[slCascaderNode]',
    'directive',
    '—',
    'sl-cascader, sl-cascader-panel',
    'The label of a node, with the item as $implicit and its state as view.',
  ],
  [
    'ControlValueAccessor',
    'forms',
    '—',
    'sl-cascader',
    'formControl, formControlName and ngModel; a disabled control disables the cascader.',
  ],
  [
    'exportAs',
    'template reference',
    '—',
    'sl-cascader, sl-cascader-panel',
    'A template reaches the instance — #places="slCascader" — for focus() and revealValue().',
  ],
]);

const accessibility = [
  'The control is a combobox whose popup is a tree, in all three layouts: the tree view pattern gives a branch aria-expanded, a level aria-level and a set aria-posinset and aria-setsize, so nothing has to be folded into a name.',
  'DOM focus stays on the control — or on the search field, which the combobox pattern moves it into for a dialog popup — and the cursor is aria-activedescendant. The arrows follow the tree popup section of the pattern, mirrored in right-to-left, with one written departure: in columns and drill the vertical arrows stay in the active column.',
  'A multiple selection is aria-multiselectable with aria-checked on each node and mixed on a branch partly chosen. A disabled node stays reachable and is never chosen.',
  'A level on its way carries aria-busy on its column; a level that failed says so in a status row with a real retry button outside the tree; a query reports its count in a polite status.',
];

const code = defineSnippet({
  id: 'cascader-angular-code',
  language: 'angular',
  label: 'A node template',
  source: `<sl-cascader [nodes]="places" [getKey]="key" [getLabel]="label" [getChildren]="children">
  <ng-template slCascaderNode let-place let-view="view">
    {{ place.name }}
  </ng-template>
</sl-cascader>`,
});

const theming = defineSnippet({
  id: 'cascader-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='cascader'] {
  --slotted-cascader-column-measure: 14rem;
  --slotted-cascader-indent: var(--slotted-space-5);
  --slotted-cascader-highlight: var(--slotted-tone-accent-surface);
}`,
});

export const ANGULAR_CASCADER_DOCS = {
  cascader: {
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
