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

export const ANGULAR_TREE_TOKENS = treeTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tree decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideTreeDefaults,\n  SlTree,\n  SlTreeActions,\n  SlTreeCell,\n  SlTreeDescription,\n  SlTreeEmpty,\n  SlTreeGroup,\n  SlTreeIcon,\n  SlTreeLabel,\n  SlTreeMeta,\n  SlTreeNode,\n} from '@slotted/angular/tree';",
  selector:
    '[slTree], li[slTreeNode], ul[slTreeGroup], [slTreeIcon], [slTreeLabel], [slTreeDescription], [slTreeMeta], [slTreeActions], [slTreeEmpty], ng-template[slTreeCell]',
  exportAs: 'slTree, slTreeNode',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slTree',
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
    element: 'ul[slTreeGroup] with role="group"',
    required: false,
    purpose:
      'The children of an open branch. You write it inside the node, because Angular parses templates as HTML, where an li closes the li before it. It is placed only while the branch is open.',
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
      id: 'tree-angular-playground',
      language: 'angular',
      label: 'A tree, and the nodes inside it',
      source: `<div slTree aria-label="Project files" [expandedKeys]="['src']">
  <li slTreeNode value="src" label="src">
    <span slTreeMeta>12</span>
    <ul slTreeGroup>
      <li slTreeNode value="index.ts" label="index.ts"></li>
      <li slTreeNode value="lib" label="lib"></li>
    </ul>
  </li>
  <li slTreeNode value="readme" label="README.md"></li>
</div>`,
    }),
  },
  {
    id: 'expansion',
    title: 'Opening and closing a branch',
    note: 'The row opens the branch by default; the second tree gives that job to the chevron alone. Press each of them, then use the sideways arrows on both.',
    snippet: defineSnippet({
      id: 'tree-angular-expansion',
      language: 'angular',
      label: 'The chevron as the only target',
      source: `<div slTree aria-label="Files" expandOn="expander" [(expandedKeys)]="open">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'selection',
    title: 'One choice, several, or none',
    note: 'Three trees side by side. The multi-select one writes aria-checked and draws a box; the single one writes aria-selected and says it with the band; the third writes neither.',
    snippet: defineSnippet({
      id: 'tree-angular-selection',
      language: 'angular',
      label: 'The three selection modes',
      source: `<div slTree aria-label="Permissions" selectionMode="multiple" [(value)]="chosen">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'cascade',
    title: 'A branch that takes its descendants with it',
    note: 'Press the folder and watch every enabled file under it follow, including the ones inside a branch that is closed. The locked file is left exactly where it was.',
    snippet: defineSnippet({
      id: 'tree-angular-cascade',
      language: 'angular',
      label: 'Checking a folder checks what is under it',
      source: `<div
  slTree
  aria-label="Permissions"
  selectionMode="multiple"
  selectionCascade="descendants"
  [nodes]="roots"
  [getKey]="key"
  [getLabel]="name"
  [getChildren]="children"
  [(value)]="chosen"
></div>`,
    }),
  },
  {
    id: 'indicator',
    title: 'How the selection is said',
    note: 'The same value under the two indicators. The box states aria-checked and is the box the checkbox family draws; the highlight states aria-selected and spends no cell at all.',
    snippet: defineSnippet({
      id: 'tree-angular-indicator',
      language: 'angular',
      label: 'A box on a tree that chooses one thing',
      source: `<div slTree aria-label="Files" selectionIndicator="checkbox" [(value)]="chosen">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'guides',
    title: 'The lines that say which parent a row belongs to',
    note: 'Depth four with the guides on and off. Each line sits under the chevron of the level above it, at one distance from the row it belongs to, at every size.',
    snippet: defineSnippet({
      id: 'tree-angular-guides',
      language: 'angular',
      label: 'Turning the guides off',
      source: `<div slTree aria-label="Packages" [guides]="false" [(expandedKeys)]="open">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'size',
    title: 'The three type steps',
    note: 'Small, medium and large in a column. The row height, the type, the glyph and the indent all move together, and the distance from a guide to its chevron does not.',
    snippet: defineSnippet({
      id: 'tree-angular-size',
      language: 'angular',
      label: 'A tree at the small step',
      source: `<div slTree aria-label="Files" size="sm" [(expandedKeys)]="open">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'Framed, and inside something that already has an edge',
    note: 'The framed tree draws its own box; the plain one draws none, for a panel or a drawer that has drawn one already. Both keep the same row.',
    snippet: defineSnippet({
      id: 'tree-angular-variant',
      language: 'angular',
      label: 'A tree in a panel that already has an edge',
      source: `<div slTree aria-label="Navigation" variant="plain" [(expandedKeys)]="open">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state a row can be in',
    note: 'At rest, hovered, where the keyboard is, chosen, both at once, out of reach, and fetching. Chosen outranks the keyboard, and disabled outranks everything.',
    snippet: defineSnippet({
      id: 'tree-angular-states',
      language: 'angular',
      label: 'A node the reader cannot reach',
      source: `<li slTreeNode value="payroll" label="Payroll" disabled>
  <span slTreeDescription>no access</span>
</li>`,
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Nothing yet, and nothing at all',
    note: 'A tree still loading its roots, and one whose query matched nothing. The empty part replaces no row: the tree keeps its name and its role either way.',
    snippet: defineSnippet({
      id: 'tree-angular-empty',
      language: 'angular',
      label: 'What the tree says when it holds nothing',
      source: `<div slTree aria-label="Files" [nodes]="[]" [getKey]="key">
  <p slTreeEmpty>No files here</p>
</div>`,
    }),
  },
  {
    id: 'lazy-loading',
    title: 'Children that arrive after the branch opens',
    note: 'Press the folder. The request goes out, the ring stands where the chevron stood, the group says aria-busy, and the placeholder rows are the width names would have been.',
    snippet: defineSnippet({
      id: 'tree-angular-lazy',
      language: 'angular',
      label: 'Fetching a branch the reader opened',
      source: `<div
  slTree
  aria-label="Files"
  [nodes]="roots"
  [getKey]="key"
  [hasChildren]="isFolder"
  [getChildrenCount]="count"
  [isNodeLoading]="pending"
  [expandedKeys]="open()"
  (expandedKeysRequest)="fetch($event)"
></div>`,
    }),
  },
  {
    id: 'filtering',
    title: 'Searching a tree without losing where things are',
    note: 'Type in the field. Every hit keeps its ancestors, the matched span is marked, and the path is held open for as long as the query lasts without moving the set the reader opened.',
    snippet: defineSnippet({
      id: 'tree-angular-filtering',
      language: 'angular',
      label: 'The consumer owns the query and the field',
      source: `<input slTextField aria-label="Search" [(ngModel)]="query" />
<div slTree aria-label="Files" [query]="query()" [nodes]="roots" [getKey]="key"></div>`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Four thousand rows, and the ones on screen',
    note: 'Scroll it. Only the covered slice is rendered, the rows are laid flat with their level stated, and the node the keyboard is on stays in the document however far it is scrolled away.',
    snippet: defineSnippet({
      id: 'tree-angular-virtualization',
      language: 'angular',
      label: 'A window over the rows a reader can see',
      source: `<div
  slTree
  aria-label="Regions"
  virtual
  [itemSize]="32"
  [nodes]="roots"
  [getKey]="key"
  [getLabel]="name"
  [getChildren]="children"
></div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the tree did not choose',
    note: 'A name that is one unbroken token, a translated name twice the length, and a right-to-left name in a left-to-right tree. Each takes its own direction and truncates rather than pushing the count out.',
    snippet: defineSnippet({
      id: 'tree-angular-content',
      language: 'angular',
      label: 'A node with a picture, a second line and a count',
      source: `<li slTreeNode value="report" label="quarterly-report-2026.pdf">
  <span slTreeIcon><svg viewBox="0 0 24 24"></svg></span>
  <span slTreeDescription>edited</span>
  <span slTreeMeta>18 kB</span>
</li>`,
    }),
  },
  {
    id: 'forms',
    title: 'A tree that belongs to a form',
    note: 'The tree is the control: a reactive control writes into it and reads back out of it, and required is the one rule it can decide from the value alone.',
    snippet: defineSnippet({
      id: 'tree-angular-forms',
      language: 'angular',
      label: 'A tree inside a reactive form',
      source: `<form [formGroup]="form">
  <div slTree aria-label="Permissions" formControlName="scopes" selectionMode="multiple" required>
    <ng-container [ngTemplateOutlet]="nodes" />
  </div>
</form>`,
    }),
  },
  {
    id: 'composition',
    title: 'What a consumer can put in a row, and set once',
    note: 'A row with an icon, a count and a trailing control, beside a provider that gives every tree under it the same size and the same expansion target.',
    snippet: defineSnippet({
      id: 'tree-angular-composition',
      language: 'ts',
      label: 'Setting the defaults for every tree under here',
      source: `providers: [provideTreeDefaults({ size: 'sm', expandOn: 'expander', guides: false })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Every key the pattern gives a tree',
    note: 'Tab in and try them: the sideways arrows open, enter and leave a branch; Home and End cross the whole list; the asterisk opens every sibling at the level.',
    snippet: defineSnippet({
      id: 'tree-angular-keyboard',
      language: 'angular',
      label: 'Reading where the keyboard is',
      source: `<div slTree aria-label="Files" [(activeKey)]="active" (activeKeyRequest)="announce($event)">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The tree carries its own name, each node is named by its own label rather than by the subtree under it, and a branch that is fetching says so through a live region once.',
    snippet: defineSnippet({
      id: 'tree-angular-accessibility',
      language: 'angular',
      label: 'The name the pattern requires of the tree',
      source: `<h2 id="files-heading">Project files</h2>
<div slTree aria-labelledby="files-heading">
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
    }),
  },
];

const api: ApiRow[] = apiRows([
  [
    'value',
    'model<string | readonly string[] | null>',
    '—',
    'SlTree',
    'The chosen key, or the set of chosen keys in multiple. It binds two ways, and it is the value a form control writes.',
  ],
  [
    'expandedKeys',
    'model<readonly string[]>',
    '—',
    'SlTree',
    'The keys of the open branches. It binds two ways, and a query never changes it.',
  ],
  [
    'activeKey',
    'model<string | null>',
    '—',
    'SlTree',
    'The node the keyboard is on, which is separate from the selection. It binds two ways.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'SlTree',
    'The row height, the type size, the glyph size and the indent, which move together.',
  ],
  [
    'variant',
    "'plain' | 'framed'",
    'plain',
    'SlTree',
    'Whether the tree draws its own box. plain draws none and framed draws an edge, a radius and a shadow.',
  ],
  [
    'structure',
    "'auto' | 'nested' | 'flat'",
    'auto',
    'SlTree',
    'Whether the nodes nest in groups or lie flat with their level stated. auto is flat while virtual and nested otherwise. Only a tree built from nodes can be flat.',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'SlTree',
    'How many nodes can be chosen at once. none writes no selection attribute on any node.',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'SlTree',
    'What a plain press does. toggle changes one node and needs no modifier key; replace collapses the selection onto the node pressed, and Ctrl, Command and Shift extend it.',
  ],
  [
    'selectionIndicator',
    "'auto' | 'highlight' | 'checkbox' | 'none'",
    'auto',
    'SlTree',
    'How the selection is drawn and which attribute states it. highlight writes aria-selected, checkbox writes aria-checked, and auto draws a checkbox in multiple and a highlight in single.',
  ],
  [
    'selectionCascade',
    "'none' | 'descendants'",
    'none',
    'SlTree',
    'Whether choosing a branch also chooses its enabled descendants. descendants needs nodes.',
  ],
  [
    'expandOn',
    "'row' | 'expander'",
    'row',
    'SlTree',
    'What opens a branch. row gives the whole row and the chevron that job; expander leaves it to the chevron alone.',
  ],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'SlTree',
    'How the position of the keyboard is expressed. auto is activedescendant while virtual and a roving tab stop otherwise.',
  ],
  [
    'guides',
    'boolean',
    'true',
    'SlTree',
    'Whether the lines that tie a row to its parent are drawn.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'SlTree',
    'Whether the arrow keys wrap past the first and the last node.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'SlTree',
    'Whether typing a name moves the keyboard to the node that starts with it.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'SlTree',
    'The milliseconds of silence that start a new typeahead search.',
  ],
  [
    'selectOnFocus',
    'boolean',
    'false',
    'SlTree',
    'Whether moving the keyboard also chooses the node it lands on.',
  ],
  [
    'navigateDisabled',
    'boolean',
    'false',
    'SlTree',
    'Whether the arrow keys land on a disabled node.',
  ],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'SlTree',
    'Whether the last chosen node stays chosen when it is pressed again.',
  ],
  [
    'disallowSelectAll',
    'boolean',
    'false',
    'SlTree',
    'Whether Control+A is kept from choosing every visible node.',
  ],
  ['pageSize', 'number', '10', 'SlTree', 'How many nodes Page Up and Page Down move by.'],
  [
    'virtual',
    'boolean',
    'false',
    'SlTree',
    'Whether only the rows in view are rendered. It needs nodes and itemSize, and it lays the rows flat.',
  ],
  ['itemSize', 'number', '32', 'SlTree', 'The height of one row in pixels, read while virtual.'],
  [
    'overscan',
    'number',
    '4',
    'SlTree',
    'How many rows are rendered on each side of the rows in view, while virtual.',
  ],
  ['disabled', 'boolean', 'false', 'SlTree', 'Whether the whole tree is disabled.'],
  [
    'readOnly',
    'boolean',
    'false',
    'SlTree',
    'Whether the selection is fixed while the tree can still be opened and walked.',
  ],
  [
    'required',
    'boolean',
    'false',
    'SlTree',
    'Whether a choice is required. It is the one rule the tree validates as a form control.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'SlTree',
    'Whether the tree is drawn and announced as being in error.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'SlTree',
    'Whether the nodes of the tree are still arriving. It writes aria-busy on the tree.',
  ],
  [
    'nodes',
    'readonly T[]',
    '—',
    'SlTree',
    'The hierarchy the tree renders. selectionCascade, expandAll, query and virtual read it.',
  ],
  [
    'getKey',
    '(node: T) => string',
    '—',
    'SlTree',
    'Returns the key of a node. It is required with nodes.',
  ],
  [
    'getLabel',
    '(node: T) => string',
    '—',
    'SlTree',
    'Returns the name of a node, which is what the row shows and what typeahead and query match.',
  ],
  [
    'getChildren',
    '(node: T) => readonly T[] | undefined',
    '—',
    'SlTree',
    'Returns the children of a node, for a nested hierarchy.',
  ],
  [
    'getLevel',
    '(node: T) => number',
    '—',
    'SlTree',
    'Returns the depth of a node, for nodes that arrive as a flat list in reading order.',
  ],
  [
    'hasChildren',
    '(node: T) => boolean',
    '—',
    'SlTree',
    'Returns whether a node is a branch before its children have arrived.',
  ],
  [
    'getChildrenCount',
    '(node: T) => number | undefined',
    '—',
    'SlTree',
    'Returns how many children a branch will have. Until all of them arrive, the ones present state the size of the whole set.',
  ],
  ['isNodeDisabled', '(node: T) => boolean', '—', 'SlTree', 'Returns whether a node is disabled.'],
  [
    'isNodeLoading',
    '(node: T) => boolean',
    '—',
    'SlTree',
    'Returns whether the children of a node are arriving.',
  ],
  [
    'query',
    'string',
    '—',
    'SlTree',
    'The text the tree filters nodes by. The field it is typed into is yours.',
  ],
  [
    'messages',
    'PartialMessages<TreeMessages>',
    '—',
    'SlTree',
    'The words the tree announces, over the ones of the language in force.',
  ],
  [
    'slTreeCell',
    "'icon' | 'label' | 'description' | 'meta' | 'actions'",
    '—',
    'ng-template[slTreeCell]',
    'The cell of every row of nodes the template fills. The template holds the directive of the cell, and let-node is the node.',
  ],
  [
    'slTreeCellOf',
    'readonly T[]',
    '—',
    'ng-template[slTreeCell]',
    'The nodes of the tree, which give let-node its type.',
  ],
  [
    'label',
    'string',
    '—',
    'SlTreeNode',
    'The name of the node, which is also its accessible name.',
  ],
  [
    'hasChildren',
    'boolean',
    '—',
    'SlTreeNode',
    'Whether the node is a branch whose children have not been written yet.',
  ],
  ['loading', 'boolean', '—', 'SlTreeNode', 'Whether the children of the node are arriving.'],
  [
    'disabled',
    'boolean',
    '—',
    'SlTreeNode',
    'Whether the node is disabled. Unset, the node follows the tree.',
  ],
  [
    'textValue',
    'string',
    '—',
    'SlTreeNode',
    'The text typeahead matches, for a label that is not plain text.',
  ],
  [
    'match',
    "'hit' | 'ancestor'",
    '—',
    'SlTreeNode',
    'Whether a query matched this node or one below it. The tree writes it on the rows of nodes; a tree you write by hand states it.',
  ],
  [
    'pinned',
    'boolean',
    '—',
    'SlTreeNode',
    'Whether the node is placed outside the rows in view. The tree sets it while virtual.',
  ],
  [
    'offset',
    'number',
    '—',
    'SlTreeNode',
    'Where a pinned row sits, in pixels. The tree sets it while virtual.',
  ],
  [
    'level',
    'number',
    '—',
    'SlTreeNode',
    'The depth of the node in the flat structure. Elsewhere the markup states it.',
  ],
  ['busy', 'boolean', '—', 'SlTreeGroup', 'Whether the children in this group are still arriving.'],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: '(value: string | readonly string[] | null)',
    when: 'After the selection changes. The value is one key, or the set in multiple.',
  },
  {
    name: 'valueRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before the selection changes. The request carries the next and the previous value, the reason (pointer, keyboard, select, clear or programmatic), the originating event and cancel().',
  },
  {
    name: 'expandedKeysRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before a branch opens or closes. The reasons are pointer, keyboard and programmatic. A query holds branches open without this event.',
  },
  {
    name: 'activeKeyRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before the keyboard moves to another node. Closing a branch that holds the active node emits this event first.',
  },
  {
    name: 'nodeActivate',
    payload: "({ key: string; reason: 'pointer' | 'keyboard' })",
    when: 'When a node is pressed, or Enter is pressed on it. Use it to open what the node stands for; it does not depend on the selection.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideTreeDefaults',
    '(defaults: Partial<TreeDefaults>)',
    '—',
    'an injector',
    'Sets the axes once for every tree under the injector. An input on a tree still wins.',
  ],
  [
    'slTreeGroup',
    'directive on a ul',
    '—',
    'inside a node',
    'The list the children of a branch are written in.',
  ],
  [
    'slTreeIcon, slTreeDescription, slTreeMeta, slTreeActions',
    'directives',
    '—',
    'inside a node',
    'The cells of a row. Each takes any content.',
  ],
  [
    'exportAs',
    'slTree, slTreeNode',
    '—',
    'a template',
    'Reaches focus, scrollToKey, expand, collapse, expandAll and collapseAll from a template reference.',
  ],
  [
    'ControlValueAccessor',
    'formControlName, ngModel',
    '—',
    'SlTree',
    'The tree is the form control over its selection, and it validates required.',
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

export const ANGULAR_TREE_DOCS = {
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
        id: 'tree-angular-two-way',
        language: 'angular',
        label: 'Owning the three values, and reading the reason each moved',
        source: `<div
  slTree
  aria-label="Files"
  [(value)]="chosen"
  [(expandedKeys)]="open"
  [(activeKey)]="active"
  (expandedKeysRequest)="fetch($event)"
>
  <ng-container [ngTemplateOutlet]="nodes" />
</div>`,
      }),
      defineSnippet({
        id: 'tree-icon-by-state',
        language: 'css',
        label: 'Swapping an icon by state, with no input for it',
        source: `[data-ui='tree'] [data-part='icon'] {
  background-color: currentcolor;
  mask-image: url('folder.svg');
}

[data-ui='tree'] [data-part='node'][data-expanded] > [data-part='row'] [data-part='icon'] {
  mask-image: url('folder-open.svg');
}`,
      }),
      defineSnippet({
        id: 'tree-angular-reveal',
        language: 'angular',
        label: 'Revealing a node behind branches that are closed',
        source: `<div slTree #tree="slTree" aria-label="Files"></div>
<button type="button" (click)="tree.scrollToKey('tree.ts', 'center')">Reveal</button>`,
      }),
    ],
  },
} as const;
