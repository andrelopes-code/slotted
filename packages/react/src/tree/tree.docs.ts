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
      'The box around the tree. It carries data-ui="tree" and every axis, it is the container the indent adapts to, and in the flat structure it is also the scroller.',
  },
  {
    part: 'canvas',
    element: 'ul with role="tree"',
    required: true,
    purpose:
      'The tree itself: the accessible name, aria-multiselectable and the single tab stop. While virtual it also holds the full height of the list.',
  },
  {
    part: 'node',
    element: 'li with role="treeitem"',
    required: true,
    purpose:
      'One node. It carries the key, the depth, aria-expanded on a branch and the selection attribute, and it is named by its own label, so a branch is not announced as everything under it.',
  },
  {
    part: 'row',
    element: 'div',
    required: true,
    purpose:
      'The line that is shown and pressed. It is separate from the node, which also contains the children, so a press on a child does not press its parent.',
  },
  {
    part: 'guide',
    element: 'span',
    required: false,
    purpose:
      'One line per ancestor level, under the chevron of that level. It is absent at the root level and when guides is false.',
  },
  {
    part: 'expander',
    element: 'span',
    required: true,
    purpose:
      'The chevron. It is not a button, because a tree has one tab stop. A leaf keeps the cell empty, so the names at one depth start in one column.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The checkbox, under selectionIndicator="checkbox". The other indicators draw no cell.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The leading icon, which you supply. One node with an icon reserves the same cell on every row.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The name. It names the node, it is what typeahead matches, and a long name truncates while staying whole in the DOM.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'A second, muted text after the name. It is hidden when the tree is narrower than 240 pixels.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'The trailing count, size or badge. It keeps its own width, so a long name truncates before it.',
  },
  {
    part: 'loader',
    element: 'span with data-ui="spinner"',
    required: false,
    purpose:
      'The spinner of a branch whose children are arriving. It takes the cell and the size of the chevron, so nothing moves.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      "The trailing controls. They are always in the DOM, and the keys and clicks they receive are not the row's.",
  },
  {
    part: 'group',
    element: 'ul with role="group"',
    required: false,
    purpose: 'The children of an open branch. A closed branch renders none.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'What the tree shows when it holds no node or the query matches none.',
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
    'The chosen key, or the set of chosen keys in multiple. When it is present the selection is controlled.',
  ],
  [
    'defaultValue',
    'string | readonly string[] | null',
    '—',
    'Tree',
    'The selection an uncontrolled tree starts with.',
  ],
  [
    'expandedKeys',
    'readonly string[]',
    '—',
    'Tree',
    'The keys of the open branches. When it is present the expansion is controlled. A query never changes it.',
  ],
  [
    'defaultExpandedKeys',
    'readonly string[]',
    '—',
    'Tree',
    'The branches an uncontrolled tree starts with open.',
  ],
  [
    'activeKey',
    'string | null',
    '—',
    'Tree',
    'The node the keyboard is on, which is separate from the selection. When it is present the position is controlled.',
  ],
  [
    'defaultActiveKey',
    'string | null',
    '—',
    'Tree',
    'The node the keyboard starts on in an uncontrolled tree.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Tree',
    'The row height, the type size, the glyph size and the indent, which move together.',
  ],
  [
    'variant',
    "'plain' | 'framed'",
    'plain',
    'Tree',
    'Whether the tree draws its own box. plain draws none and framed draws an edge, a radius and a shadow.',
  ],
  [
    'structure',
    "'auto' | 'nested' | 'flat'",
    'auto',
    'Tree',
    'Whether the nodes nest in groups or lie flat with their level stated. auto is flat while virtual and nested otherwise. Only a tree built from nodes can be flat.',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'Tree',
    'How many nodes can be chosen at once. none writes no selection attribute on any node.',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'Tree',
    'What a plain press does. toggle changes one node and needs no modifier key; replace collapses the selection onto the node pressed, and Ctrl, Command and Shift extend it.',
  ],
  [
    'selectionIndicator',
    "'auto' | 'highlight' | 'checkbox' | 'none'",
    'auto',
    'Tree',
    'How the selection is drawn and which attribute states it. highlight writes aria-selected, checkbox writes aria-checked, and auto draws a checkbox in multiple and a highlight in single.',
  ],
  [
    'selectionCascade',
    "'none' | 'descendants'",
    'none',
    'Tree',
    'Whether choosing a branch also chooses its enabled descendants. descendants needs nodes.',
  ],
  [
    'expandOn',
    "'row' | 'expander'",
    'row',
    'Tree',
    'What opens a branch. row gives the whole row and the chevron that job; expander leaves it to the chevron alone.',
  ],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'Tree',
    'How the position of the keyboard is expressed. auto is activedescendant while virtual and a roving tab stop otherwise.',
  ],
  [
    'guides',
    'boolean',
    'true',
    'Tree',
    'Whether the lines that tie a row to its parent are drawn.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'Tree',
    'Whether the arrow keys wrap past the first and the last node.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'Tree',
    'Whether typing a name moves the keyboard to the node that starts with it.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'Tree',
    'The milliseconds of silence that start a new typeahead search.',
  ],
  [
    'selectOnFocus',
    'boolean',
    'false',
    'Tree',
    'Whether moving the keyboard also chooses the node it lands on.',
  ],
  [
    'navigateDisabled',
    'boolean',
    'false',
    'Tree',
    'Whether the arrow keys land on a disabled node.',
  ],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'Tree',
    'Whether the last chosen node stays chosen when it is pressed again.',
  ],
  [
    'disallowSelectAll',
    'boolean',
    'false',
    'Tree',
    'Whether Control+A is kept from choosing every visible node.',
  ],
  ['pageSize', 'number', '10', 'Tree', 'How many nodes Page Up and Page Down move by.'],
  [
    'virtual',
    'boolean',
    'false',
    'Tree',
    'Whether only the rows in view are rendered. It needs nodes and itemSize, and it lays the rows flat.',
  ],
  ['itemSize', 'number', '32', 'Tree', 'The height of one row in pixels, read while virtual.'],
  [
    'overscan',
    'number',
    '4',
    'Tree',
    'How many rows are rendered on each side of the rows in view, while virtual.',
  ],
  ['disabled', 'boolean', 'false', 'Tree', 'Whether the whole tree is disabled.'],
  [
    'readOnly',
    'boolean',
    'false',
    'Tree',
    'Whether the selection is fixed while the tree can still be opened and walked.',
  ],
  ['required', 'boolean', 'false', 'Tree', 'Whether the tree states that a choice is required.'],
  [
    'invalid',
    'boolean',
    'false',
    'Tree',
    'Whether the tree is drawn and announced as being in error.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'Tree',
    'Whether the nodes of the tree are still arriving. It writes aria-busy on the tree.',
  ],
  [
    'name',
    'string',
    '—',
    'Tree',
    'The form name. The tree renders one hidden input per chosen key under it.',
  ],
  [
    'nodes',
    'readonly T[]',
    '—',
    'Tree',
    'The hierarchy the tree renders. selectionCascade, expandAll, query and virtual read it.',
  ],
  [
    'getKey',
    '(node: T) => string',
    '—',
    'Tree',
    'Returns the key of a node. It is required with nodes.',
  ],
  [
    'getLabel',
    '(node: T) => string',
    '—',
    'Tree',
    'Returns the name of a node, which is what the row shows and what typeahead and query match.',
  ],
  [
    'getChildren',
    '(node: T) => readonly T[] | undefined',
    '—',
    'Tree',
    'Returns the children of a node, for a nested hierarchy.',
  ],
  [
    'getLevel',
    '(node: T) => number',
    '—',
    'Tree',
    'Returns the depth of a node, for nodes that arrive as a flat list in reading order.',
  ],
  [
    'hasChildren',
    '(node: T) => boolean',
    '—',
    'Tree',
    'Returns whether a node is a branch before its children have arrived.',
  ],
  [
    'getChildrenCount',
    '(node: T) => number | undefined',
    '—',
    'Tree',
    'Returns how many children a branch will have. Until all of them arrive, the ones present state the size of the whole set.',
  ],
  ['isNodeDisabled', '(node: T) => boolean', '—', 'Tree', 'Returns whether a node is disabled.'],
  [
    'isNodeLoading',
    '(node: T) => boolean',
    '—',
    'Tree',
    'Returns whether the children of a node are arriving.',
  ],

  [
    'query',
    'string',
    '—',
    'Tree',
    'The text the tree filters nodes by. The field it is typed into is yours.',
  ],
  [
    'renderCells',
    '(node: T, key: string) => TreeNodeCells',
    '—',
    'Tree',
    'Returns the icon, label, description, meta and actions of one row of nodes. A cell left out is not drawn, and a label left out is the name getLabel returns.',
  ],
  [
    'messages',
    'PartialMessages<TreeMessages>',
    '—',
    'Tree',
    'The words the tree announces, over the ones of the language in force.',
  ],
  [
    'emptyContent',
    'ReactNode',
    '—',
    'Tree',
    'What the tree shows when it holds no node or the query matches none.',
  ],
  [
    'render',
    '(props: TreeRootProps) => ReactNode',
    '—',
    'Tree',
    'Renders the root as another element.',
  ],
  [
    'handleRef',
    'Ref<TreeHandle>',
    '—',
    'Tree',
    'The imperative handle: focus, scrollToKey, expand, collapse, expandAll, collapseAll, getActiveKey and getElement.',
  ],
  [
    'label',
    'ReactNode',
    '—',
    'TreeNode',
    'The name of the node, which is also its accessible name.',
  ],
  [
    'description',
    'ReactNode',
    '—',
    'TreeNode',
    'A second, muted text after the name. It is hidden when the tree is narrower than 240 pixels.',
  ],
  [
    'icon',
    'ReactNode',
    '—',
    'TreeNode',
    'The leading icon. One node with an icon reserves the same cell on every row.',
  ],
  ['meta', 'ReactNode', '—', 'TreeNode', 'The trailing count, size or badge.'],
  [
    'actions',
    'ReactNode',
    '—',
    'TreeNode',
    'The trailing controls. A press on one of them does not choose or open the row.',
  ],
  [
    'textValue',
    'string',
    '—',
    'TreeNode',
    'The text typeahead matches, for a label that is not plain text.',
  ],
  [
    'match',
    "'hit' | 'ancestor'",
    '—',
    'TreeNode',
    'Whether a query matched this node or one below it. The tree writes it on the rows of nodes; a tree you write by hand states it.',
  ],
  [
    'pinned',
    'boolean',
    '—',
    'TreeNode',
    'Whether the node is placed outside the rows in view. The tree sets it while virtual.',
  ],
  [
    'offset',
    'number',
    '—',
    'TreeNode',
    'Where a pinned row sits, in pixels. The tree sets it while virtual.',
  ],
  [
    'depth',
    'number',
    '—',
    'TreeNode',
    'The depth of the node in the flat structure. Elsewhere the markup states it.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string | readonly string[] | null, request: ChangeRequest)',
    when: 'Before the selection changes. The value is one key, or the set in multiple. The request carries the previous value, the reason (pointer, keyboard, select, clear or programmatic), the originating event and cancel().',
  },
  {
    name: 'onExpandedKeysChange',
    payload: '(keys: readonly string[], request: ChangeRequest)',
    when: 'Before a branch opens or closes. The reasons are pointer, keyboard and programmatic. A query holds branches open without this event.',
  },
  {
    name: 'onActiveKeyChange',
    payload: '(key: string | null, request: ChangeRequest)',
    when: 'Before the keyboard moves to another node. The reasons are pointer, keyboard and programmatic. Closing a branch that holds the active node emits this event first.',
  },
  {
    name: 'onNodeActivate',
    payload: "(key: string, reason: 'pointer' | 'keyboard')",
    when: 'When a node is pressed, or Enter is pressed on it. Use it to open what the node stands for; it does not depend on the selection.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'TreeDefaultsProvider',
    '{ size, variant, expandOn, … }',
    '—',
    'a subtree',
    'Sets the axes once for every tree under it. A prop on a tree still wins.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'Tree, TreeNode',
    'Renders the part as another element with the attributes and handlers it receives.',
  ],
  [
    'label, description, icon, meta, actions',
    'ReactNode',
    '—',
    'TreeNode',
    'The cells of a row written by hand. Each takes any content.',
  ],
  [
    'handleRef',
    'Ref<TreeHandle>',
    '—',
    'Tree',
    'Reaches focus, scrollToKey, expand, collapse, expandAll, collapseAll, getActiveKey and getElement.',
  ],
  [
    'onClick',
    '(event: MouseEvent) => void',
    '—',
    'TreeNode',
    'Runs before the row acts, and preventDefault keeps the row from acting.',
  ],
  [
    'data-expanded, data-selected, data-loading',
    'attribute',
    '—',
    'the node',
    'The state of a node in the DOM, which lets CSS change an icon by state.',
  ],
]);

const accessibility = [
  'The tree takes its accessible name from aria-label or aria-labelledby, which reach the element with role="tree".',
  'Each node is named by its own label through aria-labelledby. A treeitem contains its children, so a name computed from its contents would be everything under it.',
  'aria-expanded is written on branches and never on leaves, which would otherwise be announced as parents.',
  'Selection is stated with aria-selected under the highlight and with aria-checked under the checkbox, and never with both.',
  'aria-level, aria-setsize and aria-posinset are written while the rows are flat. A nested tree leaves them to the browser, except on the children of a branch that is still missing some of them.',
  'The whole tree is one tab stop. Focus lands on the chosen node when there is one and on the first node otherwise, and a virtual tree keeps the active node in the document.',
  'A control in the trailing cell of a row is a tab stop of its own and receives its own keys.',
  'A branch whose children are arriving has aria-busy, and a polite live region announces the branch and how many items arrived.',
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
