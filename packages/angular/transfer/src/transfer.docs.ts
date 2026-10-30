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

export const ANGULAR_TRANSFER_TOKENS = transferTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlTransfer decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlTransfer, SlTransferFooter, SlTransferItem, provideTransferDefaults } from '@slotted/angular/transfer';",
  selector: '[slTransfer], ng-template[slTransferItem], ng-template[slTransferFooter]',
  exportAs: 'slTransfer',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element slTransfer is on',
    required: true,
    purpose:
      'role="group" unless the consumer wrote one, data-ui="transfer", data-layout, data-size and data-pane. The container named transfer that decides columns or steps.',
  },
  {
    part: 'switch',
    element: 'div around an slSegmentedControl',
    required: true,
    purpose: 'Available (12) and Chosen (3): the pane shown in steps. Laid out only in steps.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose: 'The grid of the two panes and the actions.',
  },
  {
    part: 'pane',
    element: 'div',
    required: true,
    purpose:
      'data-side="source" or "target", role="group" named by its title, data-current on the pane the switch names, data-drop-target while a drop would land in it.',
  },
  {
    part: 'pane-header',
    element: 'div',
    required: true,
    purpose: 'Select-all, title and count, the box over the lists’ check column.',
  },
  {
    part: 'select-all',
    element: 'span around an slCheckbox',
    required: false,
    purpose:
      'Tri-state over the pane’s visible enabled items; its input is named “Select all in Available”.',
  },
  {
    part: 'title',
    element: 'span',
    required: true,
    purpose: 'messages.source or messages.target.',
  },
  {
    part: 'count',
    element: 'span',
    required: true,
    purpose: '“12 items”, “3 of 12 selected”, or “4 of 12 shown” under a query.',
  },
  {
    part: 'search',
    element: 'div around an slTextField',
    required: false,
    purpose: 'type="search", clearable, one size step below the family.',
  },
  {
    part: 'search-icon',
    element: 'span',
    required: false,
    purpose: 'The search glyph in the field’s start slot.',
  },
  {
    part: 'list',
    element: 'div around an slListbox',
    required: true,
    purpose: 'rows options tall whatever it holds; the listbox inside is plain and multiple.',
  },
  {
    part: 'empty',
    element: 'div inside the listbox’s slListboxEmpty',
    required: false,
    purpose: 'messages.empty, or messages.noResults with data-query while a query is typed.',
  },
  {
    part: 'drop-indicator',
    element: 'div',
    required: false,
    purpose: 'Where a pointer drop would land in a reorderable target; present only during a drag.',
  },
  {
    part: 'pane-footer',
    element: 'div',
    required: false,
    purpose: 'The slTransferFooter template, per side.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose: 'role="group" named messages.actions: the four moves, then reorder.',
  },
  {
    part: 'move-to-target',
    element: 'button slButton',
    required: true,
    purpose: 'Add ›. aria-keyshortcuts="Enter"; aria-disabled with nothing to move.',
  },
  {
    part: 'move-all-to-target',
    element: 'button slButton',
    required: true,
    purpose: 'Add all »: every visible enabled source item.',
  },
  {
    part: 'move-to-source',
    element: 'button slButton',
    required: true,
    purpose: '‹ Remove. aria-keyshortcuts="Delete".',
  },
  {
    part: 'move-all-to-source',
    element: 'button slButton',
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
    element: 'button slButton',
    required: false,
    purpose: 'aria-keyshortcuts="Alt+ArrowUp".',
  },
  {
    part: 'move-down',
    element: 'button slButton',
    required: false,
    purpose: 'aria-keyshortcuts="Alt+ArrowDown".',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Twelve people and a project team of three. Change size, layout, search, select-all and order in the controls below; every request is written under the transfer.',
    snippet: defineSnippet({
      id: 'transfer-angular-playground',
      language: 'angular',
      label: 'A two-way transfer',
      source: `<div slTransfer aria-label="Project team" [items]="people" [(targetKeys)]="team"></div>`,
    }),
  },
  {
    id: 'selection',
    title: 'Selecting, then moving',
    note: 'Click, Shift+click and Control+A select inside a pane; the box in the header selects every visible enabled item and goes half-filled when some are. Add moves the selection and clears it.',
    snippet: defineSnippet({
      id: 'transfer-angular-selection',
      language: 'angular',
      label: 'The selection is one set across both panes',
      source: `<div slTransfer [items]="people" [(selectedKeys)]="selected"></div>`,
    }),
  },
  {
    id: 'search',
    title: 'Searching a pane',
    note: 'Type fabio or design: the label and the description are searched in the locale, accents apart. The count says 1 of 12 shown, Add all moves only what is shown, and nothing matching says so over a search mark.',
    snippet: defineSnippet({
      id: 'transfer-angular-search',
      language: 'angular',
      label: 'A filter of your own',
      source: `<div slTransfer [items]="people" [filter]="byEmail"></div>`,
    }),
  },
  {
    id: 'order',
    title: 'An order the reader decides',
    note: 'Under reorderable the target keeps the order of targetKeys: a move joins the end, Up and Down move the selection one place, and Alt+ArrowUp/Down does the same from the list.',
    snippet: defineSnippet({
      id: 'transfer-angular-order',
      language: 'angular',
      label: 'Dashboard widgets, in the order they are drawn',
      source: `<div slTransfer reorderable [items]="widgets" [messages]="{ target: 'On the dashboard' }"></div>`,
    }),
  },
  {
    id: 'drag',
    title: 'Dragging between the panes',
    note: 'Drag a person across: a selected person carries the pane’s selection with them. In a reorderable target a line shows where the drop lands; a drop inside the source is refused, and Escape cancels.',
    snippet: defineSnippet({
      id: 'transfer-angular-drag',
      language: 'angular',
      label: 'Nothing to wire',
      source: `<div slTransfer reorderable [items]="people"></div>`,
    }),
  },
  {
    id: 'steps',
    title: 'One pane at a time',
    note: 'Below 36rem of its own width the transfer becomes two steps: the switch names the pane, Add and Add all stand under the source and Remove over the target. layout="steps" fixes it at any width.',
    snippet: defineSnippet({
      id: 'transfer-angular-steps',
      language: 'angular',
      label: 'The pane is a value like the others',
      source: `<div slTransfer layout="steps" [items]="people" [(pane)]="pane"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Disabled, read-only, invalid and required',
    note: 'Disabled greys both panes and stops every control. Read-only keeps the lists reachable and selectable and refuses every move. Invalid draws the danger edge; required reports { required: true } to a form while the target is empty.',
    snippet: defineSnippet({
      id: 'transfer-angular-states',
      language: 'angular',
      label: 'The four states',
      source: `<div slTransfer disabled [items]="people"></div>
<div slTransfer readOnly [items]="people"></div>
<div slTransfer invalid required [items]="people"></div>`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Two thousand items',
    note: 'virtual with an itemSize windows both lists, so a directory of two thousand people scrolls without drawing them all.',
    snippet: defineSnippet({
      id: 'transfer-angular-virtualization',
      language: 'angular',
      label: 'Windowed',
      source: `<div slTransfer virtual [itemSize]="34" [items]="directory"></div>`,
    }),
  },
  {
    id: 'loading',
    title: 'A source that arrives in pages',
    note: 'loading marks the source busy; hasMore draws the loading row at its end and (loadMore) asks for the next page when the reader reaches it.',
    snippet: defineSnippet({
      id: 'transfer-angular-loading',
      language: 'angular',
      label: 'Paged from a server',
      source: `<div
  slTransfer
  [items]="page().items"
  [loading]="page().loading"
  [hasMore]="page().hasMore"
  (loadMore)="fetchNext()"
></div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A description under the name, an unbroken permission key, a translated title that wraps, and a chosen key the collection does not hold — drawn with the key itself, in the muted mono ink, never dropped.',
    snippet: defineSnippet({
      id: 'transfer-angular-content',
      language: 'angular',
      label: 'An option of your own',
      source: `<div slTransfer [items]="permissions">
  <ng-template slTransferItem let-permission>
    <span slListboxLabel>{{ permission.label }}</span>
    <span slListboxMeta>{{ permission.scope }}</span>
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'forms',
    title: 'In a form',
    note: 'The transfer is a ControlValueAccessor over targetKeys and a Validator for required; a disabled control disables it. name submits one hidden input per chosen key.',
    snippet: defineSnippet({
      id: 'transfer-angular-forms',
      language: 'angular',
      label: 'formControlName',
      source: `<div slTransfer required formControlName="reviewers" [items]="people"></div>`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for another product',
    note: 'Every word is a message: the titles, the four moves, the counts and the announcements. provideSlotted sets the language once; an instance lays its own words over it.',
    snippet: defineSnippet({
      id: 'transfer-angular-labels',
      language: 'ts',
      label: 'Permissions in Portuguese',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'In either list Enter moves the selection — or the option you are on — to the other side; Delete sends it back from the target; Control+ArrowRight and Control+ArrowLeft move toward that side, mirrored in right-to-left; Alt+ArrowUp/Down reorders. Space selects.',
    snippet: defineSnippet({
      id: 'transfer-angular-keyboard',
      language: 'angular',
      label: 'The keys are the family’s',
      source: `<div slTransfer reorderable [items]="people"></div>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Names, shortcuts and announcements',
    note: 'Each pane is a group named by its title and each list a listbox named the same. The moves carry aria-keyshortcuts, and every move is announced politely: “2 moved to Chosen”.',
    snippet: defineSnippet({
      id: 'transfer-angular-accessibility',
      language: 'angular',
      label: 'The announcement is a message',
      source: `<div slTransfer [items]="people" [messages]="{ moved: '{count} added to {pane}' }"></div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'targetKeysChangeRequest',
    payload:
      "ChangeRequest<readonly string[]> & { direction: 'target' | 'source' | 'reorder'; keys: readonly string[] }",
    when: 'Before the target moves: a move button or Up/Down (pointer, keyboard), Enter, Delete, Control+Arrow or Alt+Arrow in a list (keyboard), a drop (pointer). cancel() refuses it and nothing else follows.',
  },
  {
    name: 'targetKeysChange',
    payload: 'readonly string[]',
    when: 'The model half of [(targetKeys)], after a request nobody cancelled. A form control is told at the same moment.',
  },
  {
    name: 'selectedKeysChangeRequest',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'Before the selection moves: a press or a key in a list, select-all or Control+A (select), and after a move.',
  },
  {
    name: 'selectedKeysChange',
    payload: 'readonly string[]',
    when: 'The model half of [(selectedKeys)].',
  },
  {
    name: 'sourceQueryChangeRequest / targetQueryChangeRequest',
    payload: 'ChangeRequest<string>',
    when: 'Before a pane’s search moves: typing (keyboard) or the clear control (clear).',
  },
  {
    name: 'sourceQueryChange / targetQueryChange',
    payload: 'string',
    when: 'The model halves of [(sourceQuery)] and [(targetQuery)].',
  },
  {
    name: 'paneChangeRequest',
    payload: "ChangeRequest<'source' | 'target'>",
    when: 'Before the switch names the other pane (pointer, keyboard).',
  },
  { name: 'paneChange', payload: "'source' | 'target'", when: 'The model half of [(pane)].' },
  {
    name: 'loadMore',
    payload: 'void',
    when: 'When the source list reaches the end of what has been loaded while hasMore is true.',
  },
];

export const ANGULAR_TRANSFER_DOCS = {
  transfer: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['items', 'readonly T[]', '—', '[slTransfer]', 'The whole collection, both sides'],
      [
        'getKey',
        '(item: T) => string',
        'item.key',
        '[slTransfer]',
        'The key an item is moved and selected by',
      ],
      [
        'getLabel',
        '(item: T) => string',
        'item.label',
        '[slTransfer]',
        'What typeahead and the search match',
      ],
      [
        'getDescription',
        '(item: T) => string | undefined',
        'item.description',
        '[slTransfer]',
        'A second line under the label, also searched',
      ],
      [
        'isItemDisabled',
        '(item: T) => boolean',
        'item.disabled',
        '[slTransfer]',
        'A disabled item cannot be selected or moved',
      ],
      [
        'targetKeys',
        'model<readonly string[] | undefined>',
        '—',
        '[slTransfer]',
        'Two-way. Unbound, the transfer holds the keys itself from defaultTargetKeys',
      ],
      [
        'defaultTargetKeys',
        'readonly string[]',
        '[]',
        '[slTransfer]',
        'The start while targetKeys is unbound',
      ],
      [
        'selectedKeys',
        'model<readonly string[] | undefined>',
        '—',
        '[slTransfer]',
        'Two-way selection across both panes',
      ],
      [
        'defaultSelectedKeys',
        'readonly string[]',
        '[]',
        '[slTransfer]',
        'The start while selectedKeys is unbound',
      ],
      ['sourceQuery', 'model<string | undefined>', '—', '[slTransfer]', 'Two-way source search'],
      [
        'defaultSourceQuery',
        'string',
        "''",
        '[slTransfer]',
        'The start while sourceQuery is unbound',
      ],
      ['targetQuery', 'model<string | undefined>', '—', '[slTransfer]', 'Two-way target search'],
      [
        'defaultTargetQuery',
        'string',
        "''",
        '[slTransfer]',
        'The start while targetQuery is unbound',
      ],
      [
        'pane',
        "model<'source' | 'target' | undefined>",
        'source',
        '[slTransfer]',
        'Two-way pane shown in steps',
      ],
      [
        'defaultPane',
        "'source' | 'target'",
        'source',
        '[slTransfer]',
        'The start while pane is unbound',
      ],
      [
        'filter',
        '(item: T, query: string, side) => boolean',
        'locale contains',
        '[slTransfer]',
        'Whether an item answers a query',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        '[slTransfer], provideTransferDefaults',
        'The lists’ step; the search and the buttons stand one below',
      ],
      [
        'layout',
        "'auto' | 'columns' | 'steps'",
        'auto',
        '[slTransfer], provideTransferDefaults',
        'auto answers the root’s own width: columns from 36rem, steps below',
      ],
      [
        'searchable',
        'boolean',
        'true',
        '[slTransfer], provideTransferDefaults',
        'Whether each pane has a search field',
      ],
      [
        'selectAll',
        'boolean',
        'true',
        '[slTransfer], provideTransferDefaults',
        'Whether each pane has a select-all box',
      ],
      [
        'reorderable',
        'boolean',
        'false',
        '[slTransfer], provideTransferDefaults',
        'Whether the target keeps an order of its own',
      ],
      [
        'rows',
        'number',
        '8',
        '[slTransfer], provideTransferDefaults',
        'How many options tall each list is',
      ],
      ['virtual', 'boolean', 'false', '[slTransfer]', 'Windows both lists; needs itemSize'],
      ['itemSize', 'number', '—', '[slTransfer]', 'The block size of one option, in pixels'],
      [
        'overscan',
        'number',
        '4',
        '[slTransfer]',
        'Options rendered either side of a windowed viewport',
      ],
      [
        'disabled',
        'boolean',
        'false',
        '[slTransfer]',
        'Stops every control; a disabled form control sets it too',
      ],
      [
        'readOnly',
        'boolean',
        'false',
        '[slTransfer]',
        'Keeps the lists reachable and refuses every move',
      ],
      [
        'required',
        'boolean',
        'false',
        '[slTransfer]',
        'aria-required on both lists, and { required: true } to a form while the target is empty',
      ],
      ['invalid', 'boolean', 'false', '[slTransfer]', 'The danger edge on both panes'],
      ['loading', 'boolean', 'false', '[slTransfer]', 'The source is still arriving'],
      [
        'hasMore',
        'boolean',
        'false',
        '[slTransfer]',
        'The source has another page; draws the loading row',
      ],
      ['name', 'string', '—', '[slTransfer]', 'Submits one hidden input per target key'],
      [
        'messages',
        'Partial<TransferMessages>',
        '—',
        '[slTransfer]',
        'Words laid over the language in force, key by key; {slot}s are filled',
      ],
      [
        'slTransferItem',
        'ng-template, let-item, side',
        'label and description',
        'a child template',
        'The content of one option inside the check the family draws',
      ],
      [
        'slTransferFooter',
        'ng-template, let-side',
        '—',
        'a child template',
        'Content under a pane’s list',
      ],
      [
        'focus(side?) / scrollToKey(key)',
        'methods, through #ref="slTransfer"',
        '—',
        '[slTransfer]',
        'Move focus into a list; reveal an item in whichever pane holds it',
      ],
      [
        'native attributes',
        'HTML attributes',
        '—',
        'the host',
        'aria-*, id, class and listeners stay on the element the directive is on; a role written there wins',
      ],
      [
        'provideTransferDefaults',
        '{ size, layout, searchable, selectAll, reorderable, rows }',
        '—',
        'providers',
        'The decisions an application takes once',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a dual list; the APG’s Listboxes with Rearrangeable Options example is the closest, and the family follows its second example: each side is a multi-select listbox named by its title, Enter adds from the available list, Delete removes from the chosen one, and Alt+ArrowUp/Down moves an option with focus kept on it.',
      'Each list is the slListbox family, so its own keyboard stands inside the pane: arrows, Home, End, PageUp, PageDown, Space, Shift ranges, Control+A and typeahead. Enter is the one key taken from it — the listbox selects with it, and here it moves — and Space still selects.',
      'The move buttons say their shortcut through aria-keyshortcuts and keep their focus stop with aria-disabled when there is nothing to move, so the button that just emptied its own selection does not drop focus on the page.',
      'Every move is announced through the shared polite live region — “Ana Souza moved to Chosen”, “3 moved to Available” — and a list that a move emptied hands focus to the other list rather than to nothing.',
      'The select-all box is named on its input, “Select all in Available”: the slCheckbox family takes its name from its label and offers no input for one, so the family writes aria-label on the control after each render and leaves the label empty.',
    ],
    snippets: [
      defineSnippet({
        id: 'transfer-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div slTransfer data-ui="transfer" data-part="root" data-layout="auto" role="group">
  <div data-part="switch">…</div>
  <div data-part="body">
    <div data-part="pane" data-side="source" role="group">
      <div data-part="pane-header">…</div>
      <div data-part="search">…</div>
      <div data-part="list">…</div>
    </div>
    <div data-part="actions" role="group" aria-label="Move items">…</div>
    <div data-part="pane" data-side="target" role="group">…</div>
  </div>
</div>`,
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
