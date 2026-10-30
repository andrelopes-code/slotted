import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import treeTokens from '@slotted/styles/tree/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TREE_TOKENS = treeTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tree decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Tree,\n  TreeDefaultsProvider,\n  TreeDescription,\n  TreeEmpty,\n  TreeGroup,\n  TreeIcon,\n  TreeLabel,\n  TreeMeta,\n  TreeNode,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The box around the tree. It carries data-ui="tree" and every axis, it is the query container the indent answers, and under the flat structure it is the scroller as well.',
  },
  {
    part: 'canvas',
    element: 'ul with role="tree"',
    required: true,
    purpose:
      'The tree itself: the accessible name, aria-multiselectable, the one tab stop the whole set has, and — while windowed — the block size of the list it holds a slice of.',
  },
  {
    part: 'node',
    element: 'li with role="treeitem"',
    required: true,
    purpose:
      'One node. It carries the key, the depth, aria-expanded on a branch, the selection attribute, and aria-labelledby to its own label, so a folder is not announced as the whole subtree under it.',
  },
  {
    part: 'row',
    element: 'div',
    required: true,
    purpose:
      'The line a reader sees and presses: the band, the indent, and the cells. It is a second element because the node has to contain the group holding its children, and a target that contained the subtree would select a folder when a file three levels down was clicked.',
  },
  {
    part: 'guide',
    element: 'span',
    required: false,
    purpose:
      'One element per row, drawing one line per ancestor level under the chevron of the level above it. Absent at the root level and when guides is false.',
  },
  {
    part: 'expander',
    element: 'span',
    required: true,
    purpose:
      'The chevron. It is not a button: a button here is a second tab stop inside a widget whose pattern has exactly one. A leaf keeps the box and draws nothing, so every name at one depth starts in one column.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The box, under selectionIndicator="checkbox". It is the box the checkbox family draws, value for value. Under highlight and none there is no cell at all.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The leading picture, which the consumer owns whole — the family has no folder glyph. A tree holding at least one icon opens the same cell on every row, so names stay in one column.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The name. It is what names the node, what typeahead matches, and the only part that gives way: a long or unbroken name truncates and stays whole in the DOM.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line beside the name. It is hidden below 240 pixels, where it has no room.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'The trailing count, size or badge. It keeps its intrinsic width, so a name twice as long in translation pushes on itself rather than on the number.',
  },
  {
    part: 'loader',
    element: 'span with data-ui="spinner"',
    required: false,
    purpose:
      "The wait, in the chevron's own cell and at its size, so a branch that starts fetching moves neither its own name nor the rows below it. It is progress-indicator's ring and not an arc of the tree's own.",
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The trailing controls. They stay in the DOM and stay reachable: revealing them on hover alone puts a control behind a gesture a touch reader does not have.',
  },
  {
    part: 'group',
    element: 'ul with role="group"',
    required: false,
    purpose:
      'The children of an open branch. It is rendered only while the branch is open, so a collapsed branch contributes no rows to the reading order the family counts.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'What the tree shows when it holds nothing, or when a query matches nothing.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One tree with every axis on it, driven by the controls under the canvas. Arrow through it, press the arrows sideways, and watch the chevron and the band say two different things.',
    snippet: defineSnippet({
      id: 'tree-react-playground',
      language: 'tsx',
      label: 'A tree, and the nodes inside it',
      source: `<Tree aria-label="Project files" defaultExpandedKeys={['src']}>
  <TreeNode value="src" label="src" meta="12">
    <TreeNode value="index.ts" label="index.ts" />
    <TreeNode value="lib" label="lib">
      <TreeNode value="tree.ts" label="tree.ts" />
    </TreeNode>
  </TreeNode>
  <TreeNode value="readme" label="README.md" />
</Tree>;`,
    }),
  },
  {
    id: 'expansion',
    title: 'Opening and closing a branch',
    note: 'The row opens the branch by default; the second tree gives that job to the chevron alone. Press each of them, then use the sideways arrows on both.',
    snippet: defineSnippet({
      id: 'tree-react-expansion',
      language: 'tsx',
      label: 'The chevron as the only target',
      source: `<Tree aria-label="Files" expandOn="expander" defaultExpandedKeys={['src']}>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'selection',
    title: 'One choice, several, or none',
    note: 'Three trees side by side. The multi-select one writes aria-checked and draws a box; the single one writes aria-selected and says it with the band; the third writes neither.',
    snippet: defineSnippet({
      id: 'tree-react-selection',
      language: 'tsx',
      label: 'The three selection modes',
      source: `<Tree
  aria-label="Permissions"
  selectionMode="multiple"
  defaultValue={['revenue']}
  defaultExpandedKeys={['reports']}
>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'cascade',
    title: 'A branch that takes its descendants with it',
    note: 'Press the folder and watch every enabled file under it follow, including the ones inside a branch that is closed. The locked file is left exactly where it was.',
    snippet: defineSnippet({
      id: 'tree-react-cascade',
      language: 'tsx',
      label: 'Checking a folder checks what is under it',
      source: `<Tree
  aria-label="Permissions"
  selectionMode="multiple"
  selectionCascade="descendants"
  nodes={roots}
  getKey={(node) => node.id}
  getLabel={(node) => node.name}
  getChildren={(node) => node.children}
/>;`,
    }),
  },
  {
    id: 'indicator',
    title: 'How the selection is said',
    note: 'The same value under the two indicators. The box states aria-checked and is the box the checkbox family draws; the highlight states aria-selected and spends no cell at all.',
    snippet: defineSnippet({
      id: 'tree-react-indicator',
      language: 'tsx',
      label: 'A box on a tree that chooses one thing',
      source: `<Tree aria-label="Files" selectionIndicator="checkbox" defaultValue="index.ts">
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'guides',
    title: 'The lines that say which parent a row belongs to',
    note: 'Depth four with the guides on and off. Each line sits under the chevron of the level above it, at one distance from the row it belongs to, at every size.',
    snippet: defineSnippet({
      id: 'tree-react-guides',
      language: 'tsx',
      label: 'Turning the guides off',
      source: `<Tree aria-label="Packages" guides={false} defaultExpandedKeys={['a', 'b', 'c']}>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'size',
    title: 'The three type steps',
    note: 'Small, medium and large in a column. The row height, the type, the glyph and the indent all move together, and the distance from a guide to its chevron does not.',
    snippet: defineSnippet({
      id: 'tree-react-size',
      language: 'tsx',
      label: 'A tree at the small step',
      source: `<Tree aria-label="Files" size="sm" defaultExpandedKeys={['src']}>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'variant',
    title: 'Framed, and inside something that already has an edge',
    note: 'The framed tree draws its own box; the plain one draws none, for a panel or a drawer that has drawn one already. Both keep the same row.',
    snippet: defineSnippet({
      id: 'tree-react-variant',
      language: 'tsx',
      label: 'A tree in a panel that already has an edge',
      source: `<Tree aria-label="Navigation" variant="plain" defaultExpandedKeys={['reports']}>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state a row can be in',
    note: 'At rest, hovered, where the keyboard is, chosen, both at once, out of reach, and fetching. Chosen outranks the keyboard, and disabled outranks everything.',
    snippet: defineSnippet({
      id: 'tree-react-states',
      language: 'tsx',
      label: 'A node the reader cannot reach',
      source: `<TreeNode value="payroll" label="Payroll" description="no access" disabled />;`,
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Nothing yet, and nothing at all',
    note: 'A tree still loading its roots, and one whose query matched nothing. The empty part replaces no row: the tree keeps its name and its role either way.',
    snippet: defineSnippet({
      id: 'tree-react-empty',
      language: 'tsx',
      label: 'What the tree says when it holds nothing',
      source: `<Tree aria-label="Files" nodes={[]} getKey={(node) => node.id} emptyContent="No files here" />;`,
    }),
  },
  {
    id: 'lazy-loading',
    title: 'Children that arrive after the branch opens',
    note: 'Press the folder. The request goes out, the ring stands where the chevron stood, the group says aria-busy, and the placeholder rows are the width names would have been.',
    snippet: defineSnippet({
      id: 'tree-react-lazy',
      language: 'tsx',
      label: 'Fetching a branch the reader opened',
      source: `<Tree
  aria-label="Files"
  nodes={roots}
  getKey={(node) => node.id}
  hasChildren={(node) => node.type === 'folder'}
  getChildrenCount={(node) => node.count}
  isNodeLoading={(node) => pending.has(node.id)}
  onExpandedKeysChange={(keys, request) => {
    if (request.reason !== 'programmatic') fetchChildren(keys);
    setExpanded(keys);
  }}
/>;`,
    }),
  },
  {
    id: 'filtering',
    title: 'Searching a tree without losing where things are',
    note: 'Type in the field. Every hit keeps its ancestors, the matched span is marked, and the path is held open for as long as the query lasts without moving the set the reader opened.',
    snippet: defineSnippet({
      id: 'tree-react-filtering',
      language: 'tsx',
      label: 'The consumer owns the query and the field',
      source: `<>
  <TextField aria-label="Search" value={query} onValueChange={setQuery} />
  <Tree
    aria-label="Files"
    query={query}
    nodes={roots}
    getKey={(node) => node.id}
    getLabel={(node) => node.name}
    getChildren={(node) => node.children}
  />
</>;`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Four thousand rows, and the ones on screen',
    note: 'Scroll it. Only the covered slice is rendered, the rows are laid flat with their level stated, and the node the keyboard is on stays in the document however far it is scrolled away.',
    snippet: defineSnippet({
      id: 'tree-react-virtualization',
      language: 'tsx',
      label: 'A window over the rows a reader can see',
      source: `<Tree
  aria-label="Regions"
  virtual
  itemSize={32}
  nodes={roots}
  getKey={(node) => node.id}
  getLabel={(node) => node.name}
  getChildren={(node) => node.children}
/>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the tree did not choose',
    note: 'A name that is one unbroken token, a translated name twice the length, and a right-to-left name in a left-to-right tree. Each takes its own direction and truncates rather than pushing the count out.',
    snippet: defineSnippet({
      id: 'tree-react-content',
      language: 'tsx',
      label: 'A node with a picture, a second line and a count',
      source: `<TreeNode
  value="report"
  label="quarterly-report-2026.pdf"
  description="edited"
  icon={<FileIcon />}
  meta="18 kB"
/>;`,
    }),
  },
  {
    id: 'forms',
    title: 'A tree that submits',
    note: 'One hidden input per chosen key, under the name the form reads. The tree is the control, and a bare form carries the set without a controlled value anywhere.',
    snippet: defineSnippet({
      id: 'tree-react-forms',
      language: 'tsx',
      label: 'Submitting the chosen keys',
      source: `<form action="/permissions" method="post">
  <Tree aria-label="Permissions" name="scopes" selectionMode="multiple">
    {nodes}
  </Tree>
  <Button type="submit">Save</Button>
</form>;`,
    }),
  },
  {
    id: 'composition',
    title: 'What a consumer can put in a row, and set once',
    note: 'A row with an icon, a count and a trailing control, beside a provider that gives every tree under it the same size and the same expansion target.',
    snippet: defineSnippet({
      id: 'tree-react-composition',
      language: 'tsx',
      label: 'Setting the defaults for every tree under here',
      source: `<TreeDefaultsProvider size="sm" expandOn="expander" guides={false}>
  <Tree aria-label="Files">{nodes}</Tree>
</TreeDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key the pattern gives a tree',
    note: 'Tab in and try them: the sideways arrows open, enter and leave a branch; Home and End cross the whole list; the asterisk opens every sibling at the level.',
    snippet: defineSnippet({
      id: 'tree-react-keyboard',
      language: 'tsx',
      label: 'Reading where the keyboard is',
      source: `<Tree
  aria-label="Files"
  activeKey={active}
  onActiveKeyChange={(key, request) => {
    if (request.reason === 'keyboard') announce(key);
    setActive(key);
  }}
>
  {nodes}
</Tree>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The tree carries its own name, each node is named by its own label rather than by the subtree under it, and a branch that is fetching says so through a live region once.',
    snippet: defineSnippet({
      id: 'tree-react-accessibility',
      language: 'tsx',
      label: 'The name the pattern requires of the tree',
      source: `<Tree aria-labelledby="files-heading">{nodes}</Tree>;`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'string | readonly string[] | null',
    '—',
    'Tree',
    'The chosen key, or the set of them in multiple. Present means controlled, for the life of the component',
  ],
  [
    'defaultValue',
    'string | readonly string[] | null',
    '—',
    'Tree',
    'What an uncontrolled tree starts from, read once',
  ],
  [
    'expandedKeys',
    'readonly string[]',
    '—',
    'Tree',
    'Which branches are open. Present means controlled; a filter never moves it',
  ],
  [
    'defaultExpandedKeys',
    'readonly string[]',
    '—',
    'Tree',
    'The set an uncontrolled tree opens with',
  ],
  [
    'activeKey',
    'string | null',
    '—',
    'Tree',
    'The node the keyboard is on. It is not the selection, and the pattern says so',
  ],
  [
    'defaultActiveKey',
    'string | null',
    '—',
    'Tree',
    'Where the keyboard starts in an uncontrolled tree',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'Tree', 'The type step the rows sit at'],
  ['variant', "'plain' | 'framed'", 'plain', 'Tree', 'Whether the tree draws its own box'],
  [
    'structure',
    "'auto' | 'nested' | 'flat'",
    'auto',
    'Tree',
    'Whether the nodes nest in groups or lie flat with their level stated. auto answers flat while windowed',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'Tree',
    'How many nodes may be chosen at once',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'Tree',
    'Which of the two models the pattern offers is in force. toggle is the one it recommends',
  ],
  [
    'selectionIndicator',
    "'auto' | 'highlight' | 'checkbox' | 'none'",
    'auto',
    'Tree',
    'How the selection is drawn, and which attribute states it. auto reads the mode beside it',
  ],
  [
    'selectionCascade',
    "'none' | 'descendants'",
    'none',
    'Tree',
    'Whether pressing a branch takes its enabled descendants with it. Needs nodes',
  ],
  ['expandOn', "'row' | 'expander'", 'row', 'Tree', 'What a press on the row does to a branch'],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'Tree',
    'How the keyboard position is expressed. auto answers activedescendant while windowed',
  ],
  [
    'guides',
    'boolean',
    'true',
    'Tree',
    'Whether the lines that say which parent a row belongs to are drawn',
  ],
  ['loop', 'boolean', 'false', 'Tree', 'Whether the arrows wrap past the ends'],
  ['typeahead', 'boolean', 'true', 'Tree', 'Whether typing a name moves the keyboard to it'],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'Tree',
    'Milliseconds of silence before a new search begins',
  ],
  ['selectOnFocus', 'boolean', 'false', 'Tree', 'Whether moving the keyboard also chooses'],
  ['navigateDisabled', 'boolean', 'false', 'Tree', 'Whether the arrows land on a disabled node'],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'Tree',
    'Whether the last chosen node may be unchosen',
  ],
  ['disallowSelectAll', 'boolean', 'false', 'Tree', 'Whether Control and A may take the whole set'],
  ['pageSize', 'number', '10', 'Tree', 'How far the page keys travel'],
  ['virtual', 'boolean', 'false', 'Tree', 'Whether only the rows the viewport covers are rendered'],
  [
    'itemSize',
    'number',
    '32',
    'Tree',
    'The block size of one row, in pixels. Required whenever virtual',
  ],
  ['overscan', 'number', '4', 'Tree', 'Rows rendered either side of the viewport'],
  ['disabled', 'boolean', 'false', 'Tree', 'Whether the whole tree refuses the reader'],
  ['readOnly', 'boolean', 'false', 'Tree', 'Whether the tree may be read and not moved'],
  ['required', 'boolean', 'false', 'Tree', 'Whether a choice is required of the form around it'],
  ['invalid', 'boolean', 'false', 'Tree', 'Whether the tree is in error'],
  ['loading', 'boolean', 'false', 'Tree', 'Whether the set is still arriving. Writes aria-busy'],
  ['name', 'string', '—', 'Tree', 'Submits one hidden input per chosen key'],
  [
    'nodes',
    'readonly T[]',
    '—',
    'Tree',
    'The hierarchy the tree holds. What a cascade, expandAll and the filter read',
  ],
  ['getKey', '(node: T) => string', '—', 'Tree', 'The identity that survives a reorder'],
  [
    'getLabel',
    '(node: T) => string',
    '—',
    'Tree',
    'What the reader sees and what typeahead matches',
  ],
  [
    'getChildren',
    '(node: T) => readonly T[] | undefined',
    '—',
    'Tree',
    'The children, in the nested shape',
  ],
  [
    'getLevel',
    '(node: T) => number',
    '—',
    'Tree',
    'The depth, in the already-flat shape a rowset backend returns',
  ],
  [
    'hasChildren',
    '(node: T) => boolean',
    '—',
    'Tree',
    'Whether a node is a branch before it can prove it',
  ],
  [
    'getChildrenCount',
    '(node: T) => number | undefined',
    '—',
    'Tree',
    'How many children will arrive, which draws the placeholder',
  ],
  ['isNodeDisabled', '(node: T) => boolean', '—', 'Tree', 'Which nodes refuse the reader'],
  [
    'isNodeLoading',
    '(node: T) => boolean',
    '—',
    'Tree',
    'Which branches are fetching their children',
  ],
  [
    'renderNode',
    '(node: T, key: string) => ReactNode',
    '—',
    'Tree',
    'The content of one row. The family renders the row around it',
  ],
  [
    'query',
    'string',
    '—',
    'Tree',
    'What the tree filters by. The consumer owns the string and the field',
  ],
  ['emptyContent', 'ReactNode', '—', 'Tree', 'What the tree shows when it holds nothing'],
  [
    'render',
    '(props: TreeRootProps) => ReactNode',
    '—',
    'Tree',
    'Substitutes the element the root renders',
  ],
  [
    'handleRef',
    'Ref<TreeHandle>',
    '—',
    'Tree',
    'focus, scrollToKey, expand, collapse, expandAll, collapseAll, getActiveKey, getElement',
  ],
  ['label', 'ReactNode', '—', 'TreeNode', "The node's name, and what names it"],
  ['description', 'ReactNode', '—', 'TreeNode', 'A second line beside the name'],
  ['icon', 'ReactNode', '—', 'TreeNode', 'The leading picture, which the consumer owns whole'],
  ['meta', 'ReactNode', '—', 'TreeNode', 'The trailing count, size or badge'],
  ['actions', 'ReactNode', '—', 'TreeNode', 'The trailing controls, which stay reachable'],
  [
    'textValue',
    'string',
    '—',
    'TreeNode',
    'What typeahead matches, when the label is not plain text',
  ],
  [
    'match',
    "'hit' | 'ancestor'",
    '—',
    'TreeNode',
    'Whether a query matched this name or one below it',
  ],
  [
    'pinned',
    'boolean',
    '—',
    'TreeNode',
    'Rendered at its own place on the canvas, outside the window',
  ],
  ['offset', 'number', '—', 'TreeNode', 'Where a pinned row sits on the canvas, in pixels'],
  [
    'depth',
    'number',
    '—',
    'TreeNode',
    'Stated only by the flat shape; elsewhere the markup says it',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string | readonly string[] | null, request: ChangeRequest)',
    when: 'Before the selection moves. The value is one key in single and none, and the set in multiple. The request carries the value it replaces, the reason — pointer, keyboard, select, clear or programmatic — the originating event, and cancel().',
  },
  {
    name: 'onExpandedKeysChange',
    payload: '(keys: readonly string[], request: ChangeRequest)',
    when: 'Before a branch opens or closes. Reasons: pointer, keyboard, programmatic. A filter is not among them: it holds a path open without moving the set.',
  },
  {
    name: 'onActiveKeyChange',
    payload: '(key: string | null, request: ChangeRequest)',
    when: 'Before the node the keyboard is on moves. Reasons: pointer, keyboard, programmatic. Closing a branch that holds the active node emits this first, so the pair stays coherent.',
  },
  {
    name: 'onNodeActivate',
    payload: "(key: string, reason: 'pointer' | 'keyboard')",
    when: 'When a node is pressed, or Enter is pressed on it. It is not the selection: a navigation tree opens a page here and chooses nothing.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TreeDefaultsProvider',
    '{ size, variant, expandOn, … }',
    '—',
    'a subtree',
    'Sets twenty-one axes once for every tree under it. An explicit prop still wins',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'Tree, TreeNode',
    'Renders the part into another element, keeping every attribute and handler it was given',
  ],
  [
    'label, description, icon, meta, actions',
    'ReactNode',
    '—',
    'TreeNode',
    'The cells of a row, each one whatever the consumer renders. The family owns no folder glyph of its own',
  ],
  [
    'handleRef',
    'Ref<TreeHandle>',
    '—',
    'Tree',
    'focus, scrollToKey, expand, collapse, expandAll, collapseAll, getActiveKey and getElement — the actions a consumer cannot express declaratively',
  ],
  [
    'onClick',
    '(event: MouseEvent) => void',
    '—',
    'TreeNode',
    'Runs before the family acts, and preventDefault stops it. Every handler composes rather than replaces',
  ],
  [
    'data-expanded, data-selected, data-loading',
    'attribute',
    '—',
    'the node',
    'Every state the contract declares is in the DOM, so an icon can be swapped by state in CSS alone with no prop for it',
  ],
]);

const accessibility = [
  'The tree carries its own accessible name, which the pattern requires: aria-label or aria-labelledby reaches the element with role="tree".',
  'Each node is named by its own label through aria-labelledby, because a treeitem contains the group holding its children and a name computed from its contents is the whole subtree read aloud.',
  'aria-expanded is on branches and never on leaves: a leaf carrying it is announced as a parent.',
  'Selection is stated with aria-selected or with aria-checked and never with both, which the pattern allows only under three conditions it calls extremely rare.',
  'aria-level, aria-setsize and aria-posinset are written only while the rows are flat — the condition the pattern names — because the nesting is what the browser computes them from otherwise.',
  'The whole tree is one tab stop. Focus lands on the chosen node when there is one and on the first node otherwise, and a windowed tree keeps the active node in the document rather than letting a recycled row take it away.',
];

export const REACT_TREE_DOCS = {
  tree: {
    imports,
    anatomy,
    scenes,
    api,
    events,
    composition,
    accessibility,
    snippets: [
      defineSnippet({
        id: 'tree-react-controlled',
        language: 'tsx',
        label: 'Owning the three values, and reading the reason each moved',
        source: `<Tree
  aria-label="Files"
  value={chosen}
  onValueChange={setChosen}
  expandedKeys={open}
  onExpandedKeysChange={(keys, request) => {
    if (request.reason === 'pointer') fetchChildren(keys);
    setOpen(keys);
  }}
  activeKey={active}
  onActiveKeyChange={setActive}
>
  {nodes}
</Tree>;`,
      }),
      defineSnippet({
        id: 'tree-icon-by-state',
        language: 'css',
        label: 'Swapping an icon by state, with no prop for it',
        source: `[data-ui='tree'] [data-part='icon'] {
  background-color: currentcolor;
  mask-image: url('folder.svg');
}

[data-ui='tree'] [data-part='node'][data-expanded] > [data-part='row'] [data-part='icon'] {
  mask-image: url('folder-open.svg');
}`,
      }),
      defineSnippet({
        id: 'tree-react-reveal',
        language: 'tsx',
        label: 'Revealing a node behind branches that are closed',
        source: `const tree = useRef<TreeHandle>(null);

tree.current?.scrollToKey('packages/core/src/collection/tree.ts', 'center');`,
      }),
    ],
  },
} as const;
