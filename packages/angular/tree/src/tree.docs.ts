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
    "import {\n  provideTreeDefaults,\n  SlTree,\n  SlTreeActions,\n  SlTreeDescription,\n  SlTreeEmpty,\n  SlTreeGroup,\n  SlTreeIcon,\n  SlTreeLabel,\n  SlTreeMeta,\n  SlTreeNode,\n} from '@slotted/angular/tree';",
  selector:
    '[slTree], li[slTreeNode], ul[slTreeGroup], [slTreeIcon], [slTreeLabel], [slTreeDescription], [slTreeMeta], [slTreeActions], [slTreeEmpty]',
  exportAs: 'slTree, slTreeNode',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slTree',
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
    element: 'ul[slTreeGroup] with role="group"',
    required: false,
    purpose:
      'The children of an open branch, and the one part a consumer writes rather than receives: Angular parses a template as HTML, where an li closes the li before it, so a node written inside a node needs the list between them. The node still decides whether the group is placed, and it is placed only while the branch is open.',
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
    note: 'The tree is the control: a reactive control writes into it and reads back out of it, and required is the one rule the family can decide from the value alone.',
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
    'The chosen key, or the set of them in multiple. Two-way, and the control a reactive form writes into',
  ],
  [
    'expandedKeys',
    'model<readonly string[]>',
    '—',
    'SlTree',
    'Which branches are open. Two-way, and a filter never moves it',
  ],
  [
    'activeKey',
    'model<string | null>',
    '—',
    'SlTree',
    'The node the keyboard is on. It is not the selection, and the pattern says so',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'SlTree', 'The type step the rows sit at'],
  ['variant', "'plain' | 'framed'", 'plain', 'SlTree', 'Whether the tree draws its own box'],
  [
    'structure',
    "'auto' | 'nested' | 'flat'",
    'auto',
    'SlTree',
    'Whether the nodes nest in groups or lie flat with their level stated. auto answers flat while windowed',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'SlTree',
    'How many nodes may be chosen at once',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'SlTree',
    'Which of the two models the pattern offers is in force. toggle is the one it recommends',
  ],
  [
    'selectionIndicator',
    "'auto' | 'highlight' | 'checkbox' | 'none'",
    'auto',
    'SlTree',
    'How the selection is drawn, and which attribute states it. auto reads the mode beside it',
  ],
  [
    'selectionCascade',
    "'none' | 'descendants'",
    'none',
    'SlTree',
    'Whether pressing a branch takes its enabled descendants with it. Needs nodes',
  ],
  ['expandOn', "'row' | 'expander'", 'row', 'SlTree', 'What a press on the row does to a branch'],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'SlTree',
    'How the keyboard position is expressed. auto answers activedescendant while windowed',
  ],
  [
    'guides',
    'boolean',
    'true',
    'SlTree',
    'Whether the lines that say which parent a row belongs to are drawn',
  ],
  ['loop', 'boolean', 'false', 'SlTree', 'Whether the arrows wrap past the ends'],
  ['typeahead', 'boolean', 'true', 'SlTree', 'Whether typing a name moves the keyboard to it'],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'SlTree',
    'Milliseconds of silence before a new search begins',
  ],
  ['selectOnFocus', 'boolean', 'false', 'SlTree', 'Whether moving the keyboard also chooses'],
  ['navigateDisabled', 'boolean', 'false', 'SlTree', 'Whether the arrows land on a disabled node'],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'SlTree',
    'Whether the last chosen node may be unchosen',
  ],
  [
    'disallowSelectAll',
    'boolean',
    'false',
    'SlTree',
    'Whether Control and A may take the whole set',
  ],
  ['pageSize', 'number', '10', 'SlTree', 'How far the page keys travel'],
  [
    'virtual',
    'boolean',
    'false',
    'SlTree',
    'Whether only the rows the viewport covers are rendered',
  ],
  [
    'itemSize',
    'number',
    '32',
    'SlTree',
    'The block size of one row, in pixels. Required whenever virtual',
  ],
  ['overscan', 'number', '4', 'SlTree', 'Rows rendered either side of the viewport'],
  ['disabled', 'boolean', 'false', 'SlTree', 'Whether the whole tree refuses the reader'],
  ['readOnly', 'boolean', 'false', 'SlTree', 'Whether the tree may be read and not moved'],
  [
    'required',
    'boolean',
    'false',
    'SlTree',
    'Whether a choice is required. The family validates this one rule and no other',
  ],
  ['invalid', 'boolean', 'false', 'SlTree', 'Whether the tree is in error'],
  ['loading', 'boolean', 'false', 'SlTree', 'Whether the set is still arriving. Writes aria-busy'],
  [
    'nodes',
    'readonly T[]',
    '—',
    'SlTree',
    'The hierarchy the tree holds. What a cascade, expandAll and the filter read',
  ],
  ['getKey', '(node: T) => string', '—', 'SlTree', 'The identity that survives a reorder'],
  [
    'getLabel',
    '(node: T) => string',
    '—',
    'SlTree',
    'What the reader sees and what typeahead matches',
  ],
  [
    'getChildren',
    '(node: T) => readonly T[] | undefined',
    '—',
    'SlTree',
    'The children, in the nested shape',
  ],
  [
    'getLevel',
    '(node: T) => number',
    '—',
    'SlTree',
    'The depth, in the already-flat shape a rowset backend returns',
  ],
  [
    'hasChildren',
    '(node: T) => boolean',
    '—',
    'SlTree',
    'Whether a node is a branch before it can prove it',
  ],
  [
    'getChildrenCount',
    '(node: T) => number | undefined',
    '—',
    'SlTree',
    'How many children will arrive, which draws the placeholder',
  ],
  ['isNodeDisabled', '(node: T) => boolean', '—', 'SlTree', 'Which nodes refuse the reader'],
  [
    'isNodeLoading',
    '(node: T) => boolean',
    '—',
    'SlTree',
    'Which branches are fetching their children',
  ],
  [
    'query',
    'string',
    '—',
    'SlTree',
    'What the tree filters by. The consumer owns the string and the field',
  ],
  ['label', 'string', '—', 'SlTreeNode', "The node's name, and what names it"],
  [
    'hasChildren',
    'boolean',
    '—',
    'SlTreeNode',
    'Whether this node is a branch whose children have not been written yet',
  ],
  ['loading', 'boolean', '—', 'SlTreeNode', 'Whether the children are on their way'],
  ['disabled', 'boolean', '—', 'SlTreeNode', 'Unstated rather than false, so the node defers'],
  [
    'textValue',
    'string',
    '—',
    'SlTreeNode',
    'What typeahead matches, when the label is not plain text',
  ],
  [
    'match',
    "'hit' | 'ancestor'",
    '—',
    'SlTreeNode',
    'Whether a query matched this name or one below it',
  ],
  [
    'pinned',
    'boolean',
    '—',
    'SlTreeNode',
    'Rendered at its own place on the canvas, outside the window',
  ],
  ['offset', 'number', '—', 'SlTreeNode', 'Where a pinned row sits on the canvas, in pixels'],
  [
    'level',
    'number',
    '—',
    'SlTreeNode',
    'Stated only by the flat shape; elsewhere the markup says it',
  ],
  ['busy', 'boolean', '—', 'SlTreeGroup', 'Whether the children in this group are still arriving'],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: '(value: string | readonly string[] | null)',
    when: 'The two-way half of value. The set in multiple, one key otherwise.',
  },
  {
    name: 'valueRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before the selection moves. The request carries the value it replaces, the reason — pointer, keyboard, select, clear or programmatic — the originating event, and cancel().',
  },
  {
    name: 'expandedKeysRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before a branch opens or closes. Reasons: pointer, keyboard, programmatic. A filter is not among them: it holds a path open without moving the set.',
  },
  {
    name: 'activeKeyRequest',
    payload: '(request: ChangeRequest)',
    when: 'Before the node the keyboard is on moves. Closing a branch that holds the active node emits this first, so the pair stays coherent.',
  },
  {
    name: 'nodeActivate',
    payload: "({ key: string; reason: 'pointer' | 'keyboard' })",
    when: 'When a node is pressed, or Enter is pressed on it. It is not the selection: a navigation tree opens a page here and chooses nothing.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideTreeDefaults',
    '(defaults: Partial<TreeDefaults>)',
    '—',
    'an injector',
    'Sets twenty-one axes once for every tree under it. An explicit input still wins',
  ],
  [
    'slTreeGroup',
    'directive on a ul',
    '—',
    'inside a node',
    "The list a branch's children are written in. Angular parses a template as HTML, where an li closes the li before it, so a node inside a node needs the list between them",
  ],
  [
    'slTreeIcon, slTreeDescription, slTreeMeta, slTreeActions',
    'directives',
    '—',
    'inside a node',
    'The cells of a row, each one whatever the consumer projects. The family owns no folder glyph of its own',
  ],
  [
    'exportAs',
    'slTree, slTreeNode',
    '—',
    'a template',
    'Reaches the instance for focus, scrollToKey, expand, collapse, expandAll and collapseAll',
  ],
  [
    'ControlValueAccessor',
    'formControlName, ngModel',
    '—',
    'SlTree',
    'The tree is the form control over its selection, and validates required',
  ],
  [
    'data-expanded, data-selected, data-loading',
    'attribute',
    '—',
    'the node',
    'Every state the contract declares is in the DOM, so an icon can be swapped by state in CSS alone with no input for it',
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
