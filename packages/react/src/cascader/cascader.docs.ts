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

export const REACT_CASCADER_TOKENS = cascaderTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Cascader decision',
}));

const imports: ReferenceImport = {
  source: "import { Cascader, CascaderDefaultsProvider, CascaderPanel } from '@slotted/react';",
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
  row('icon', 'span', false, 'The node’s own picture, from renderIcon.'),
  row(
    'label',
    'span',
    true,
    'The node’s name, from renderNode or the label. It clamps at two lines.',
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
      id: 'cascader-react-playground',
      language: 'tsx',
      label: 'A place in a hierarchy',
      source: `<Cascader
  aria-label="Location"
  getChildren={(place) => place.children}
  getKey={(place) => place.id}
  getLabel={(place) => place.name}
  nodes={places}
/>;`,
    }),
  },
  {
    id: 'columns',
    title: 'Columns',
    note: 'One column per level of the path, side by side: the road from the first column to the value reads as one line, and each count ends on one edge.',
    snippet: defineSnippet({
      id: 'cascader-react-columns',
      language: 'tsx',
      label: 'Columns, asked for by name',
      source: `<Cascader layout="columns" {...data} />;`,
    }),
  },
  {
    id: 'drill',
    title: 'Drill',
    note: 'One level at a time, with the levels behind it in a breadcrumb. It is what layout="auto" chooses where two columns do not fit.',
    snippet: defineSnippet({
      id: 'cascader-react-drill',
      language: 'tsx',
      label: 'One level at a time',
      source: `<Cascader layout="drill" {...data} />;`,
    }),
  },
  {
    id: 'tree',
    title: 'Tree',
    note: 'Every level in one indented list, branches opening in place. The chevron turns down as its level opens.',
    snippet: defineSnippet({
      id: 'cascader-react-tree',
      language: 'tsx',
      label: 'An indented list',
      source: `<Cascader layout="tree" {...data} />;`,
    }),
  },
  {
    id: 'layout-auto',
    title: 'Layout from the room',
    note: 'The same cascader in a narrow and a wide container. The narrow one drills; the wide one shows columns, never more than maxColumns, and slides past a level when the path is deeper.',
    snippet: defineSnippet({
      id: 'cascader-react-layout-auto',
      language: 'tsx',
      label: 'The layout follows the room',
      source: `<Cascader layout="auto" maxColumns={3} {...data} />;`,
    }),
  },
  {
    id: 'search',
    title: 'Search',
    note: 'A query finds a node at any depth and prints the road to it under the label. The navigation path is untouched, and clearing the query shows it again.',
    snippet: defineSnippet({
      id: 'cascader-react-search',
      language: 'tsx',
      label: 'Search every level',
      source: `<Cascader search {...data} />;`,
    }),
  },
  {
    id: 'multiple',
    title: 'Multiple',
    note: 'A box per node. A branch’s box takes everything below it, a branch partly chosen shows the dash, and checkedStrategy decides whether the branch or its leaves are emitted.',
    snippet: defineSnippet({
      id: 'cascader-react-multiple',
      language: 'tsx',
      label: 'Many places, emitted as their parents',
      source: `<Cascader checkedStrategy="parent" selectionMode="multiple" {...data} />;`,
    }),
  },
  {
    id: 'any-level',
    title: 'Any level',
    note: 'selectable="any" lets a branch be chosen: pressing it opens its level and chooses it, so a reader can stop at a country or go on to a city.',
    snippet: defineSnippet({
      id: 'cascader-react-any-level',
      language: 'tsx',
      label: 'A branch is a value too',
      source: `<Cascader selectable="any" {...data} />;`,
    }),
  },
  {
    id: 'lazy',
    title: 'Levels on demand',
    note: 'A branch whose children have not arrived asks for them as its level is shown, with a signal the family aborts if the reader moves on. The rows wait as the shape of what is coming.',
    snippet: defineSnippet({
      id: 'cascader-react-lazy',
      language: 'tsx',
      label: 'Load a level as it is opened',
      source: `<Cascader
  hasChildren={(place) => place.lazy || Boolean(place.children)}
  isNodeLoading={(place) => loading.has(place.id)}
  onLoadChildren={({ key, signal }) => load(key, signal)}
  {...data}
/>;`,
    }),
  },
  {
    id: 'value-path',
    title: 'The path in the control',
    note: 'A long path gives way in the middle, keeping the place itself, and renderValue replaces the segments with anything the consumer draws.',
    snippet: defineSnippet({
      id: 'cascader-react-value-path',
      language: 'tsx',
      label: 'How the value reads',
      source: `<Cascader defaultValue="sao-pedro" separator="›" {...data} />;`,
    }),
  },
  {
    id: 'panel',
    title: 'Panel',
    note: 'The same tree on the page, without a control or a layer. The tree takes focus itself and walks by the same keys.',
    snippet: defineSnippet({
      id: 'cascader-react-panel',
      language: 'tsx',
      label: 'Embedded in a page',
      source: `<CascaderPanel aria-label="Category" {...data} />;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled, read-only, invalid, a disabled node, a level that failed with its retry, and a query with no answer.',
    snippet: defineSnippet({
      id: 'cascader-react-states',
      language: 'tsx',
      label: 'Every state a reader can meet',
      source: `<>
  <Cascader disabled {...data} />
  <Cascader defaultValue="alf" readOnly {...data} />
  <Cascader invalid {...data} />
</>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Down opens; Right enters a level, Left goes back, both mirrored in right-to-left; Up and Down stay in the column; Enter chooses; a letter jumps in the level.',
    snippet: defineSnippet({
      id: 'cascader-react-keyboard',
      language: 'tsx',
      label: 'The keys',
      source: `<Cascader aria-label="Location" {...data} />;`,
    }),
  },
  {
    id: 'composition',
    title: 'In a form',
    note: 'Inside a field, the label names the control and the error describes it; name submits one hidden input per chosen key.',
    snippet: defineSnippet({
      id: 'cascader-react-composition',
      language: 'tsx',
      label: 'A field in a form',
      source: `<Field required>
  <FieldLabel>Delivery area</FieldLabel>
  <Cascader name="area" {...data} />
  <FieldDescription>Choose the district.</FieldDescription>
</Field>;`,
    }),
  },
];

const api = apiRows([
  [
    'nodes',
    'readonly T[]',
    '—',
    'Cascader, CascaderPanel',
    'The roots, nested, or a flat list read with getParent.',
  ],
  [
    'getKey',
    '(node) => string',
    '—',
    'Cascader, CascaderPanel',
    'A stable key, which is also the value.',
  ],
  [
    'getLabel',
    '(node) => string',
    '—',
    'Cascader, CascaderPanel',
    'The name, which search and typeahead read.',
  ],
  [
    'getChildren',
    '(node) => T[] | undefined',
    '—',
    'Cascader, CascaderPanel',
    'The children of a nested node.',
  ],
  [
    'getParent',
    '(node) => string | null',
    '—',
    'Cascader, CascaderPanel',
    'Opts in to a flat list; an unknown parent makes a root.',
  ],
  [
    'hasChildren',
    '(node) => boolean',
    '—',
    'Cascader, CascaderPanel',
    'A branch whose children have not arrived says so.',
  ],
  [
    'isNodeDisabled',
    '(node) => boolean',
    '—',
    'Cascader, CascaderPanel',
    'Stays on show and reachable, never chosen.',
  ],
  [
    'isNodeLoading',
    '(node) => boolean',
    '—',
    'Cascader, CascaderPanel',
    'The children of this branch are on their way.',
  ],
  [
    'loading',
    'boolean',
    '—',
    'Cascader, CascaderPanel',
    'The roots are on their way: the first level waits as rows and the control shows the ring.',
  ],
  [
    'isNodeFailed',
    '(node) => boolean',
    '—',
    'Cascader, CascaderPanel',
    'The children of this branch could not be loaded.',
  ],
  [
    'renderNode',
    '(node, view) => ReactNode',
    '—',
    'Cascader, CascaderPanel',
    'The label of a node; the row, its marks and its count stay the family’s.',
  ],
  [
    'value',
    'string | null | string[]',
    '—',
    'Cascader, CascaderPanel',
    'Present means controlled. A scalar for one choice, a list for many.',
  ],
  [
    'defaultValue',
    'string | null | string[]',
    '—',
    'Cascader, CascaderPanel',
    'What an uncontrolled cascader starts with, read once.',
  ],
  ['open', 'boolean', '—', 'Cascader', 'Present means controlled.'],
  ['defaultOpen', 'boolean', 'false', 'Cascader', 'Whether the popup starts open.'],
  [
    'path',
    'readonly string[]',
    '—',
    'Cascader, CascaderPanel',
    'The branches whose levels are on show, root first.',
  ],
  [
    'defaultPath',
    'readonly string[]',
    '[]',
    'Cascader, CascaderPanel',
    'The path an uncontrolled cascader starts from.',
  ],
  ['activeKey', 'string | null', '—', 'Cascader, CascaderPanel', 'The node under the cursor.'],
  [
    'defaultActiveKey',
    'string | null',
    'null',
    'Cascader, CascaderPanel',
    'Where the cursor starts.',
  ],
  [
    'expandedKeys',
    'readonly string[]',
    '—',
    'Cascader, CascaderPanel',
    'The branches open in place, under layout="tree".',
  ],
  [
    'defaultExpandedKeys',
    'readonly string[]',
    '[]',
    'Cascader, CascaderPanel',
    'What an uncontrolled tree starts with open.',
  ],
  ['searchValue', 'string', '—', 'Cascader, CascaderPanel', 'The query, under search.'],
  [
    'defaultSearchValue',
    'string',
    "''",
    'Cascader, CascaderPanel',
    'The query an uncontrolled field starts with.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Cascader, CascaderPanel',
    'The control and the surface together.',
  ],
  ['variant', "'outline' | 'subtle' | 'plain'", 'outline', 'Cascader', 'select’s three frames.'],
  ['fullWidth', 'boolean', 'true', 'Cascader', 'Whether the control fills its field.'],
  [
    'layout',
    "'auto' | 'columns' | 'drill' | 'tree'",
    'auto',
    'Cascader, CascaderPanel',
    'auto shows columns while two fit and drills below that.',
  ],
  [
    'selectionMode',
    "'single' | 'multiple'",
    'single',
    'Cascader, CascaderPanel',
    'One place, or many.',
  ],
  [
    'selectable',
    "'leaf' | 'any' | (node) => boolean",
    'leaf',
    'Cascader, CascaderPanel',
    'Which nodes a single selection may commit.',
  ],
  [
    'checkedStrategy',
    "'all' | 'parent' | 'child'",
    'all',
    'Cascader, CascaderPanel',
    'Which keys a multiple selection emits.',
  ],
  [
    'expandOn',
    "'press' | 'hover'",
    'press',
    'Cascader, CascaderPanel',
    'Whether a rest on a branch shows its level. Hover never commits.',
  ],
  ['closeOnSelect', 'boolean', 'true', 'Cascader', 'Whether a single commit closes the popup.'],
  [
    'search',
    'boolean',
    'false',
    'Cascader, CascaderPanel',
    'A field that finds nodes at any depth.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'Cascader',
    'Whether a clear button stands in the control while it holds a value.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'Cascader',
    'Whether the layer is rendered at the end of the document.',
  ],
  ['disabled', 'boolean', 'false', 'Cascader, CascaderPanel', 'Never opens and answers nothing.'],
  [
    'readOnly',
    'boolean',
    'false',
    'Cascader, CascaderPanel',
    'Opens and walks, and refuses every change.',
  ],
  ['required', 'boolean', 'false', 'Cascader', 'Says aria-required.'],
  ['invalid', 'boolean', 'false', 'Cascader', 'Says aria-invalid and paints the frame.'],
  ['separator', 'string', '/', 'Cascader', 'Between two segments of the path.'],
  [
    'hoverDelay',
    'number',
    '150',
    'Cascader, CascaderPanel',
    'How long a rest on a branch waits before its level shows, under expandOn="hover".',
  ],
  [
    'maxColumns',
    'number',
    '3',
    'Cascader, CascaderPanel',
    'The most columns on show at once, whatever the room.',
  ],
  [
    'maxCrumbs',
    'number',
    '4',
    'Cascader, CascaderPanel',
    'The most crumbs before the middle folds.',
  ],
  ['name', 'string', '—', 'Cascader', 'Submits one hidden input per emitted key.'],
  [
    'messages',
    'Partial<CascaderMessages>',
    '—',
    'Cascader, CascaderPanel',
    'Words laid over the language in force, key by key: placeholder, clear, remove ({label}), summary ({count}), search, searchPlaceholder, root, back ({label}), breadcrumb, empty, noResults ({query}), results ({count}), loading, failed ({label}), retry',
  ],
  [
    'handleRef',
    'Ref<CascaderHandle>',
    '—',
    'Cascader',
    'open(), close(), focus() and revealValue().',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value, request)',
    when: 'Before the value moves: pointer, keyboard, select, clear, remove or programmatic. request.cancel() refuses it.',
  },
  {
    name: 'onOpenChange',
    payload: '(open, request)',
    when: 'Before the popup opens or closes, with the reason.',
  },
  {
    name: 'onPathChange',
    payload: '(path, request)',
    when: 'Before a level is shown or left: pointer, keyboard, back or programmatic.',
  },
  { name: 'onActiveKeyChange', payload: '(key, request)', when: 'Before the cursor moves.' },
  {
    name: 'onExpandedKeysChange',
    payload: '(keys, request)',
    when: 'Before a branch opens or closes in place, under layout="tree".',
  },
  { name: 'onSearchValueChange', payload: '(query, request)', when: 'Before the query changes.' },
  {
    name: 'onLoadChildren',
    payload: '({ key, signal })',
    when: 'A level that has not arrived is shown. The signal aborts when the path moves away or the popup closes.',
  },
  { name: 'onRetry', payload: '(key)', when: 'The reader pressed retry on a level that failed.' },
];

const composition = apiRows([
  [
    'CascaderDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets every axis once for a subtree; the words come from the language in force (SlottedProvider). A cascader that states one itself still wins.',
  ],
  ['CascaderPanel', 'component', '—', 'A page', 'The tree without a control or a layer.'],
  [
    'renderValue',
    'prop',
    '—',
    'Cascader',
    'Replaces the segments of the path with the consumer’s own drawing.',
  ],
  [
    'native props',
    'attributes',
    '—',
    'The root',
    'Anything a div takes reaches the control’s root.',
  ],
]);

const accessibility = [
  'The control is a combobox whose popup is a tree, in all three layouts: the tree view pattern gives a branch aria-expanded, a level aria-level and a set aria-posinset and aria-setsize, so nothing has to be folded into a name. A listbox per level would need aria-haspopup and aria-expanded on an option, which the option role does not support.',
  'DOM focus stays on the control — or on the search field, which the combobox pattern moves it into for a dialog popup — and the cursor is aria-activedescendant. The arrows follow the tree popup section of the pattern, mirrored in right-to-left, with one written departure: in columns and drill the vertical arrows stay in the active column.',
  'A multiple selection is aria-multiselectable with aria-checked on each node and mixed on a branch partly chosen, the rule the tree family took for its boxes. A disabled node stays reachable and is never chosen.',
  'A level on its way carries aria-busy on its column; a level that failed says so in a status row with a real retry button outside the tree; a query reports its count in a polite status.',
];

const code = defineSnippet({
  id: 'cascader-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div data-ui="cascader" data-part="root" data-size="md" data-variant="outline">
  <button data-part="trigger" role="combobox" aria-haspopup="tree" aria-expanded="true">
    <span data-part="value">
      <span data-part="value-segment">Portugal</span>
      <span data-part="value-separator" aria-hidden="true">
        /
      </span>
      <span data-part="value-segment">Lisboa</span>
    </span>
  </button>
</div>;`,
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

export const REACT_CASCADER_DOCS = {
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
