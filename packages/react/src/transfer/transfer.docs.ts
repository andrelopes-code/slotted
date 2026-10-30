import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import transferTokens from '@slotted/styles/transfer/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TRANSFER_TOKENS = transferTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Transfer decision',
}));

const imports: ReferenceImport = {
  source: "import { Transfer, TransferDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'role="group", data-ui="transfer", data-layout, data-size and data-pane. The container named transfer that decides columns or steps.',
  },
  {
    part: 'switch',
    element: 'div around a SegmentedControl',
    required: true,
    purpose:
      'Available (12) and Chosen (3): the pane shown in steps. Rendered always, laid out only in steps.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose: 'The grid of the two panes and the actions column.',
  },
  {
    part: 'pane',
    element: 'div',
    required: true,
    purpose:
      'One per side: data-side="source" or "target", role="group" named by its title, data-current on the pane the switch names, data-drop-target while a drop would land in it.',
  },
  {
    part: 'pane-header',
    element: 'div',
    required: true,
    purpose: 'Select-all, title and count on one line, the box over the lists’ check column.',
  },
  {
    part: 'select-all',
    element: 'span around a Checkbox',
    required: false,
    purpose: 'Tri-state over the pane’s visible enabled items. Absent under selectAll={false}.',
  },
  {
    part: 'title',
    element: 'span',
    required: true,
    purpose: 'messages.source or messages.target; names the pane and its list.',
  },
  {
    part: 'count',
    element: 'span',
    required: true,
    purpose:
      '“12 items”, “3 of 12 selected” or, under a query, “4 of 12 shown”, in tabular figures.',
  },
  {
    part: 'search',
    element: 'div around a TextField',
    required: false,
    purpose:
      'type="search", clearable, one size step below the family. Absent under searchable={false}.',
  },
  {
    part: 'search-icon',
    element: 'span',
    required: false,
    purpose: 'The search glyph in the field’s start slot.',
  },
  {
    part: 'list',
    element: 'div around a Listbox',
    required: true,
    purpose:
      'rows options tall whatever it holds, so the two panes stand level. The Listbox inside is plain, multiple and named by the title.',
  },
  {
    part: 'empty',
    element: 'div inside the Listbox’s own empty part',
    required: false,
    purpose:
      'messages.empty, or messages.noResults with data-query while a query is typed, over an inbox or a search mark.',
  },
  {
    part: 'drop-indicator',
    element: 'div',
    required: false,
    purpose:
      'A line of no height where a pointer drop would land in a reorderable target. Present only while a drag hovers.',
  },
  {
    part: 'pane-footer',
    element: 'div',
    required: false,
    purpose: 'renderFooter(side), under the list. Absent when it returns nothing.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose:
      'role="group" named messages.actions: the four moves, then reorder. In steps it stands under the source or over the target and shows that pane’s two moves.',
  },
  {
    part: 'move-to-target',
    element: 'button, a Button',
    required: true,
    purpose:
      'Add ›: the source’s selected visible enabled items. aria-keyshortcuts="Enter"; aria-disabled with nothing to move.',
  },
  {
    part: 'move-all-to-target',
    element: 'button, a Button',
    required: true,
    purpose: 'Add all »: every visible enabled source item.',
  },
  {
    part: 'move-to-source',
    element: 'button, a Button',
    required: true,
    purpose: '‹ Remove: the target’s selected visible enabled items. aria-keyshortcuts="Delete".',
  },
  {
    part: 'move-all-to-source',
    element: 'button, a Button',
    required: true,
    purpose: '« Remove all: every visible enabled target item.',
  },
  {
    part: 'reorder',
    element: 'div',
    required: false,
    purpose: 'role="group" named messages.reorder, under reorderable.',
  },
  {
    part: 'move-up',
    element: 'button, a Button',
    required: false,
    purpose:
      'Moves the target’s selection one place toward the start. aria-keyshortcuts="Alt+ArrowUp".',
  },
  {
    part: 'move-down',
    element: 'button, a Button',
    required: false,
    purpose: 'One place toward the end. aria-keyshortcuts="Alt+ArrowDown".',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Twelve people and a project team of three. Change size, layout, search, select-all and order in the controls below; every request is written under the transfer.',
    snippet: defineSnippet({
      id: 'transfer-react-playground',
      language: 'tsx',
      label: 'A controlled transfer',
      source: `const [team, setTeam] = useState<readonly string[]>(['ana', 'kenji', 'marta']);

<Transfer
  aria-label="Project team"
  items={people}
  onTargetKeysChange={(keys) => setTeam(keys)}
  targetKeys={team}
/>;`,
    }),
  },
  {
    id: 'selection',
    title: 'Selecting, then moving',
    note: 'Click, Shift+click and Control+A select inside a pane; the box in the header selects every visible enabled item and goes half-filled when some are. Add moves the selection and clears it.',
    snippet: defineSnippet({
      id: 'transfer-react-selection',
      language: 'tsx',
      label: 'The selection is one set across both panes',
      source: `<Transfer
  items={people}
  onSelectedKeysChange={(keys, request) => setSelected(keys)}
  selectedKeys={selected}
/>;`,
    }),
  },
  {
    id: 'search',
    title: 'Searching a pane',
    note: 'Type fabio or design: the label and the description are searched in the locale, accents apart. The count says 1 of 12 shown, Add all moves only what is shown, and nothing matching says so over a search mark.',
    snippet: defineSnippet({
      id: 'transfer-react-search',
      language: 'tsx',
      label: 'A filter of your own',
      source: `<Transfer filter={(person, query) => person.email.startsWith(query)} items={people} />;`,
    }),
  },
  {
    id: 'order',
    title: 'An order the reader decides',
    note: 'Under reorderable the target keeps the order of targetKeys: a move joins the end, Up and Down move the selection one place, and Alt+ArrowUp/Down does the same from the list. Without it the target follows the collection.',
    snippet: defineSnippet({
      id: 'transfer-react-order',
      language: 'tsx',
      label: 'Dashboard widgets, in the order they are drawn',
      source: `<Transfer items={widgets} messages={{ target: 'On the dashboard' }} reorderable />;`,
    }),
  },
  {
    id: 'drag',
    title: 'Dragging between the panes',
    note: 'Drag a person across: a selected person carries the pane’s selection with them. In a reorderable target a line shows where the drop lands; a drop inside the source is refused, and Escape cancels.',
    snippet: defineSnippet({
      id: 'transfer-react-drag',
      language: 'tsx',
      label: 'Nothing to wire',
      source: `<Transfer items={people} reorderable />;`,
    }),
  },
  {
    id: 'steps',
    title: 'One pane at a time',
    note: 'Below 36rem of its own width the transfer becomes two steps: the switch names the pane, Add and Add all stand under the source and Remove over the target. layout="steps" fixes it at any width.',
    snippet: defineSnippet({
      id: 'transfer-react-steps',
      language: 'tsx',
      label: 'The pane is a value like the others',
      source: `<Transfer items={people} layout="steps" onPaneChange={(pane) => setPane(pane)} pane={pane} />;`,
    }),
  },
  {
    id: 'states',
    title: 'Disabled, read-only, invalid and required',
    note: 'Disabled greys both panes and stops every control. Read-only keeps the lists reachable and selectable and refuses every move. Invalid draws the danger edge on both panes; required is carried to both lists.',
    snippet: defineSnippet({
      id: 'transfer-react-states',
      language: 'tsx',
      label: 'The four states',
      source: `<Transfer disabled items={people} />;
<Transfer items={people} readOnly />;
<Transfer invalid items={people} required />;`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Two thousand items',
    note: 'virtual with an itemSize windows both lists, so a directory of two thousand people scrolls without drawing them all. Typeahead, Shift+click and the moves work across the whole set.',
    snippet: defineSnippet({
      id: 'transfer-react-virtualization',
      language: 'tsx',
      label: 'Windowed',
      source: `<Transfer itemSize={34} items={directory} virtual />;`,
    }),
  },
  {
    id: 'loading',
    title: 'A source that arrives in pages',
    note: 'loading marks the source busy; hasMore draws the loading row at its end and onLoadMore asks for the next page when the reader reaches it.',
    snippet: defineSnippet({
      id: 'transfer-react-loading',
      language: 'tsx',
      label: 'Paged from a server',
      source: `<Transfer
  hasMore={page.hasMore}
  items={page.items}
  loading={page.loading}
  onLoadMore={() => fetchNext()}
/>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A description under the name, an unbroken permission key, a translated title that wraps, and a chosen key the collection does not hold — drawn with the key itself, in the muted mono ink, never dropped.',
    snippet: defineSnippet({
      id: 'transfer-react-content',
      language: 'tsx',
      label: 'An option of your own',
      source: `<Transfer
  items={permissions}
  renderItem={(permission) => (
    <>
      <ListboxLabel>{permission.name}</ListboxLabel>
      <ListboxMeta>{permission.scope}</ListboxMeta>
    </>
  )}
/>;`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'Inside a Field the transfer takes the label, the description and the disabled state; name submits one hidden input per chosen key, so a bare form posts the set.',
    snippet: defineSnippet({
      id: 'transfer-react-forms',
      language: 'tsx',
      label: 'Posted as reviewers=ana&reviewers=kenji',
      source: `<Field required>
  <FieldLabel>Reviewers</FieldLabel>
  <Transfer items={people} name="reviewers" />
  <FieldDescription>At least one reviewer signs the release.</FieldDescription>
</Field>;`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for another product',
    note: 'Every word is a message: the titles, the four moves, the counts and the announcements. The language in force sets them once; an instance lays its own over them.',
    snippet: defineSnippet({
      id: 'transfer-react-labels',
      language: 'tsx',
      label: 'Permissions in Portuguese',
      source: `<SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
  <Transfer
    items={permissions}
    messages={{ target: 'Concedidas', moveToTarget: 'Conceder', moveToSource: 'Revogar' }}
  />
</SlottedProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'In either list Enter moves the selection — or the option you are on — to the other side; Delete sends it back from the target; Control+ArrowRight and Control+ArrowLeft move toward that side, mirrored in right-to-left; Alt+ArrowUp/Down reorders. Space selects.',
    snippet: defineSnippet({
      id: 'transfer-react-keyboard',
      language: 'tsx',
      label: 'The keys are the family’s',
      source: `<Transfer items={people} reorderable />;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Names, shortcuts and announcements',
    note: 'Each pane is a group named by its title and each list a listbox named the same. The moves carry aria-keyshortcuts, and every move is announced politely: “2 moved to Chosen”.',
    snippet: defineSnippet({
      id: 'transfer-react-accessibility',
      language: 'tsx',
      label: 'The announcement is a message',
      source: `<Transfer items={people} messages={{ moved: '{count} added to {pane}' }} />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onTargetKeysChange',
    payload:
      "(targetKeys: readonly string[], request: ChangeRequest<readonly string[]> & { direction: 'target' | 'source' | 'reorder'; keys: readonly string[] })",
    when: 'Before the target moves: a move button or Up/Down (pointer, keyboard), Enter, Delete, Control+Arrow or Alt+Arrow in a list (keyboard), a drop (pointer). cancel() refuses it and nothing else follows.',
  },
  {
    name: 'onSelectedKeysChange',
    payload: '(selectedKeys: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before the selection moves: a press or a key in a list (pointer, keyboard), select-all or Control+A (select), and after a move, which takes the moved keys out with the move’s reason.',
  },
  {
    name: 'onSourceQueryChange / onTargetQueryChange',
    payload: '(query: string, request: ChangeRequest<string>)',
    when: 'Before a pane’s search moves: typing (keyboard) or the clear control (clear).',
  },
  {
    name: 'onPaneChange',
    payload: "(pane: 'source' | 'target', request: ChangeRequest<'source' | 'target'>)",
    when: 'Before the switch names the other pane (pointer, keyboard).',
  },
  {
    name: 'onLoadMore',
    payload: '()',
    when: 'When the source list reaches the end of what has been loaded while hasMore is true.',
  },
  {
    name: 'onKeyDown and the other native handlers',
    payload: 'the element’s own event',
    when: 'Reach the root. The family’s own keys are taken in the capture phase of each list, so a handler that calls preventDefault() there first keeps the key.',
  },
];

export const REACT_TRANSFER_DOCS = {
  transfer: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['items', 'readonly T[]', '—', 'Transfer', 'The whole collection, both sides'],
      [
        'getKey',
        '(item: T) => string',
        'item.key',
        'Transfer',
        'The key an item is moved and selected by',
      ],
      [
        'getLabel',
        '(item: T) => string',
        'item.label',
        'Transfer',
        'What typeahead and the search match, and what a reader hears',
      ],
      [
        'getDescription',
        '(item: T) => string | undefined',
        'item.description',
        'Transfer',
        'A second line under the label, also searched',
      ],
      [
        'isItemDisabled',
        '(item: T) => boolean',
        'item.disabled',
        'Transfer',
        'A disabled item cannot be selected or moved and stays where it is',
      ],
      [
        'renderItem',
        '(item: T, { side, resolved }) => ReactNode',
        'label and description',
        'Transfer',
        'The content of one option inside the check the family draws; write it with ListboxLabel, ListboxDescription and ListboxMeta',
      ],
      [
        'targetKeys',
        'readonly string[]',
        '—',
        'Transfer',
        'Present means the consumer owns the target, for the life of the component',
      ],
      [
        'defaultTargetKeys',
        'readonly string[]',
        '[]',
        'Transfer',
        'The uncontrolled start, read once',
      ],
      [
        'selectedKeys',
        'readonly string[]',
        '—',
        'Transfer',
        'The selection across both panes. Present means controlled',
      ],
      [
        'defaultSelectedKeys',
        'readonly string[]',
        '[]',
        'Transfer',
        'The uncontrolled selection, read once',
      ],
      ['sourceQuery', 'string', '—', 'Transfer', 'The source’s search. Present means controlled'],
      [
        'defaultSourceQuery',
        'string',
        "''",
        'Transfer',
        'The uncontrolled source search, read once',
      ],
      ['targetQuery', 'string', '—', 'Transfer', 'The target’s search. Present means controlled'],
      [
        'defaultTargetQuery',
        'string',
        "''",
        'Transfer',
        'The uncontrolled target search, read once',
      ],
      [
        'pane',
        "'source' | 'target'",
        'source',
        'Transfer',
        'The pane shown in steps. Present means controlled',
      ],
      [
        'defaultPane',
        "'source' | 'target'",
        'source',
        'Transfer',
        'The uncontrolled pane, read once',
      ],
      [
        'filter',
        '(item: T, query: string, side) => boolean',
        'locale contains',
        'Transfer',
        'Whether an item answers a query',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Transfer, TransferDefaultsProvider',
        'The lists’ step; the search and the buttons stand one below',
      ],
      [
        'layout',
        "'auto' | 'columns' | 'steps'",
        'auto',
        'Transfer, TransferDefaultsProvider',
        'auto answers the root’s own width: columns from 36rem, steps below',
      ],
      [
        'searchable',
        'boolean',
        'true',
        'Transfer, TransferDefaultsProvider',
        'Whether each pane has a search field',
      ],
      [
        'selectAll',
        'boolean',
        'true',
        'Transfer, TransferDefaultsProvider',
        'Whether each pane has a select-all box',
      ],
      [
        'reorderable',
        'boolean',
        'false',
        'Transfer, TransferDefaultsProvider',
        'Whether the target keeps an order of its own',
      ],
      [
        'rows',
        'number',
        '8',
        'Transfer, TransferDefaultsProvider',
        'How many options tall each list is',
      ],
      ['virtual', 'boolean', 'false', 'Transfer', 'Windows both lists; needs itemSize'],
      [
        'itemSize',
        'number',
        '—',
        'Transfer',
        'The block size of one option, in pixels, for virtual',
      ],
      [
        'overscan',
        'number',
        '4',
        'Transfer',
        'Options rendered either side of a windowed viewport',
      ],
      ['disabled', 'boolean', 'false', 'Transfer', 'Stops every control; defaults to the field’s'],
      [
        'readOnly',
        'boolean',
        'false',
        'Transfer',
        'Keeps the lists reachable and refuses every move',
      ],
      [
        'required',
        'boolean',
        'false',
        'Transfer',
        'Carried to both lists as aria-required; defaults to the field’s',
      ],
      [
        'invalid',
        'boolean',
        'false',
        'Transfer',
        'The danger edge on both panes; defaults to the field’s',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Transfer',
        'The source is still arriving: aria-busy on its list',
      ],
      [
        'hasMore',
        'boolean',
        'false',
        'Transfer',
        'The source has another page; draws the loading row',
      ],
      ['name', 'string', '—', 'Transfer', 'Submits one hidden input per target key'],
      [
        'messages',
        'Partial<TransferMessages>',
        '—',
        'Transfer',
        'Words laid over the language in force, key by key: source, target, search, selectAll, count, countSelected, countFiltered, paneCount, panes, empty, noResults, loading, actions, moveToTarget, moveAllToTarget, moveToSource, moveAllToSource, reorder, moveUp, moveDown, moved, movedOne, reordered; {slot}s are filled',
      ],
      ['renderFooter', '(side) => ReactNode', '—', 'Transfer', 'Content under a pane’s list'],
      [
        'handleRef',
        'Ref<TransferHandle>',
        '—',
        'Transfer',
        'focus(side?) and scrollToKey(key); element, the root',
      ],
      [
        'render',
        '(props: TransferRootProps) => ReactNode',
        'a div',
        'Transfer',
        'Substitutes the root element; attach props.ref beside your own, the drag measures against it',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"div">',
        '—',
        'Transfer',
        'aria-*, data-*, className, style and handlers reach the root',
      ],
      [
        'TransferDefaultsProvider',
        '{ size, layout, searchable, selectAll, reorderable, rows }',
        '—',
        'a subtree',
        'The decisions an application takes once; an instance that states any of them wins',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a dual list; the APG’s Listboxes with Rearrangeable Options example is the closest, and the family follows its second example: each side is a multi-select listbox named by its title, Enter adds from the available list, Delete removes from the chosen one, and Alt+ArrowUp/Down moves an option with focus kept on it.',
      'Each list is the Listbox family, so its own keyboard stands inside the pane: arrows, Home, End, PageUp, PageDown, Space, Shift ranges, Control+A and typeahead. Enter is the one key taken from it — the listbox selects with it, and here it moves — and Space still selects.',
      'The move buttons say their shortcut through aria-keyshortcuts and keep their focus stop with aria-disabled when there is nothing to move, so the button that just emptied its own selection does not drop focus on the page.',
      'Every move is announced through the shared polite live region — “Ana Souza moved to Chosen”, “3 moved to Available”, “Revenue moved to position 2” — and a list that a move emptied hands focus to the other list rather than to nothing.',
      'A disabled item keeps its place and aria-disabled, and is skipped by the arrows, by select-all and by Add all; a key the collection does not hold is still announced by its key.',
    ],
    snippets: [
      defineSnippet({
        id: 'transfer-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="transfer" data-part="root" data-layout="auto" data-pane="source" role="group">
  <div data-part="switch">
    <div data-ui="segmented-control">…</div>
  </div>
  <div data-part="body">
    <div
      data-part="pane"
      data-side="source"
      data-current=""
      role="group"
      aria-labelledby=":r1:-source-title"
    >
      <div data-part="pane-header">
        <span data-part="select-all">
          <div data-ui="checkbox">…</div>
        </span>
        <span data-part="title" id=":r1:-source-title">
          Available
        </span>
        <span data-part="count">2 of 12 selected</span>
      </div>
      <div data-part="search">
        <div data-ui="text-field">…</div>
      </div>
      <div data-part="list">
        <div data-ui="listbox" role="listbox" aria-multiselectable="true">
          …
        </div>
      </div>
    </div>
    <div data-part="actions" role="group" aria-label="Move items">
      <button data-ui="button" data-part="move-to-target" aria-keyshortcuts="Enter">
        Add
      </button>
    </div>
    <div data-part="pane" data-side="target" role="group">
      …
    </div>
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'transfer-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='transfer'] {
  --slotted-transfer-pane-min-inline-size: 16rem;
}`,
      }),
    ],
  },
} as const;
