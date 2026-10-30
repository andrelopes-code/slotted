import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import columnManagerTokens from '@slotted/styles/column-manager/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_COLUMN_MANAGER_TOKENS = columnManagerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlColumnManager decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlColumnManager, SlColumnManagerTrigger, provideColumnManagerDefaults } from '@slotted/angular/column-manager';",
  selector: 'sl-column-manager, [slColumnManagerTrigger]',
  exportAs: 'slColumnManager',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'role="group" named by the title, carrying data-ui="column-manager", data-presentation and data-apply. The popover’s one child, the drawer’s content, or in place under presentation="inline".',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose: 'The title and the summary on one line.',
  },
  { part: 'title', element: 'h2', required: true, purpose: 'messages.title; names the root.' },
  {
    part: 'summary',
    element: 'span',
    required: true,
    purpose: 'messages.visibleCount — “7 of 9 shown”, in tabular figures.',
  },
  {
    part: 'search',
    element: 'div around an slTextField',
    required: true,
    purpose:
      'type="search" at size sm, named by messages.search; filters by label and description.',
  },
  {
    part: 'list',
    element: 'div',
    required: true,
    purpose:
      'The scroller of the sections, bounded by --slotted-column-manager-list-max-block-size except in a drawer.',
  },
  {
    part: 'section',
    element: 'div',
    required: false,
    purpose:
      'One per pin zone that holds a column: start, middle, end. role="group" named by its label, and the drag container of its zone. data-drop-target while a drag hovers it.',
  },
  {
    part: 'section-label',
    element: 'div',
    required: false,
    purpose:
      'Pinned to start, Columns, Pinned to end. Read and not shown when the section is the only one.',
  },
  {
    part: 'item',
    element: 'div',
    required: false,
    purpose:
      'One column: data-column, data-hidden, data-locked, data-space-hidden, data-pinned, data-dragging. Every column is listed, hidden or not.',
  },
  {
    part: 'handle',
    element: 'button',
    required: false,
    purpose:
      'The grip: a pointer drag starts on it, and Alt+ArrowUp/Down moves the column one place in its zone. aria-disabled and data-disabled while a search is typed or for reorderable: false.',
  },
  {
    part: 'visibility',
    element: 'div around an slCheckbox',
    required: false,
    purpose:
      'Ticked while the column is shown. Disabled for hideable: false and for the last shown column.',
  },
  {
    part: 'description',
    element: 'p[slCheckboxDescription], the checkbox’s own description',
    required: false,
    purpose: 'GridColumn.description under the label, and the box’s aria-describedby.',
  },
  {
    part: 'status',
    element: 'span inside the label',
    required: false,
    purpose:
      'Required for a locked column, Hidden for space for one the grid hid for room, Shown in row for one the grid moved into its rows’ pop-in; heard with the name.',
  },
  {
    part: 'pin',
    element: 'button[slMenuTriggerFor]',
    required: false,
    purpose:
      'Opens Pin to start, Pin to end and Unpin. Named messages.pin; data-pinned and the accent ink while the column is pinned.',
  },
  {
    part: 'drop-indicator',
    element: 'div',
    required: false,
    purpose:
      'A line of no height where a pointer drop would land. Present only while a drag hovers.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'role="status" with messages.noResults in place of the sections when the search finds nothing.',
  },
  {
    part: 'footer',
    element: 'div',
    required: true,
    purpose: 'The actions. Below 20rem of its own width they stand two by two.',
  },
  {
    part: 'show-all',
    element: 'button[slButton]',
    required: true,
    purpose: 'Asks for every column shown. Disabled while none is hidden.',
  },
  {
    part: 'reset',
    element: 'button[slButton]',
    required: true,
    purpose:
      'Asks for defaultColumnState with the reason clear. Disabled while the state already equals it.',
  },
  {
    part: 'cancel',
    element: 'button[slButton]',
    required: false,
    purpose: 'Under apply="confirm": discards the draft and closes the layer.',
  },
  {
    part: 'apply',
    element: 'button[slButton]',
    required: false,
    purpose:
      'Under apply="confirm": asks once for the draft with the reason submit and closes the layer. Disabled while nothing changed.',
  },
  {
    part: 'trigger',
    element: 'the consumer’s button carrying [slColumnManagerTrigger]',
    required: false,
    purpose:
      'aria-haspopup="dialog", aria-expanded, aria-controls the root while open, data-open and data-column-manager-trigger.',
  },
  {
    part: 'count',
    element: 'span',
    required: false,
    purpose:
      'On the trigger after its words: the number of hidden columns, aria-hidden, beside a visually hidden “3 hidden columns” that names the trigger. Absent at zero.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'An orders listing’s nine columns behind a trigger. Hide one and watch the count on the trigger; switch presentation and apply in the controls below.',
    snippet: defineSnippet({
      id: 'column-manager-angular-playground',
      language: 'angular',
      label: 'A trigger and its manager',
      source: `<button slButton slColumnManagerTrigger [slColumnManagerTriggerFor]="manager" type="button">
  Columns
</button>
<sl-column-manager #manager="slColumnManager" [columns]="columns" [(columnState)]="state" />`,
    }),
  },
  {
    id: 'popover',
    title: 'In a popover on the trigger',
    note: 'The default presentation: a popover anchored on the trigger, 22rem wide, the search focused on open. Escape and a press outside close it and focus returns to the trigger.',
    snippet: defineSnippet({
      id: 'column-manager-angular-popover',
      language: 'angular',
      label: 'presentation="popover"',
      source: `<sl-column-manager #manager="slColumnManager" presentation="popover" [columns]="columns" />`,
    }),
  },
  {
    id: 'drawer',
    title: 'In a drawer at the end',
    note: 'The same panel as the drawer family at side end, size sm, for a grid with many columns: the list takes the drawer’s height and is not capped.',
    snippet: defineSnippet({
      id: 'column-manager-angular-drawer',
      language: 'angular',
      label: 'presentation="drawer"',
      source: `<sl-column-manager #manager="slColumnManager" presentation="drawer" [columns]="columns" />`,
    }),
  },
  {
    id: 'confirm',
    title: 'Apply once',
    note: 'Under apply="confirm" every action edits a draft: hide two columns and move one, and the log stays empty until Apply asks once with the reason submit and every key that moved. Cancel discards the draft.',
    snippet: defineSnippet({
      id: 'column-manager-angular-confirm',
      language: 'angular',
      label: 'A draft and one request',
      source: `<sl-column-manager
  apply="confirm"
  [columns]="columns"
  [(columnState)]="state"
  (columnStateChangeRequest)="log($event.reason, $event.changes)"
/>`,
    }),
  },
  {
    id: 'search',
    title: 'Search by name and description',
    // language: pt-BR
    note: 'Type “date”: Due date matches by its name and Status by its description. “regiao” finds Região — case and accents fall away. While a query stands every grip is disabled, because a place in a subset is not a place in the list.',
    // language: en-US
    snippet: defineSnippet({
      id: 'column-manager-angular-search',
      language: 'ts',
      label: 'Descriptions are searched',
      source: `const columns: GridColumn<Order>[] = [
  {
    id: 'status',
    label: 'Status',
    description: 'Fulfilment stage, updated when the ship date is set',
  },
  { id: 'due', label: 'Due date', description: 'The date promised to the customer' },
];`,
    }),
  },
  {
    id: 'locked',
    title: 'Required, and the last shown column',
    note: 'Order is hideable: false — ticked, disabled and marked Required. With every other column hidden, the last shown one is disabled too: the manager never asks for a grid with no column.',
    snippet: defineSnippet({
      id: 'column-manager-angular-locked',
      language: 'ts',
      label: 'A column that cannot be hidden',
      source: `const columns = [{ id: 'number', label: 'Order', hideable: false }, ...rest];`,
    }),
  },
  {
    id: 'hidden-by-space',
    title: 'Hidden for space, shown in row',
    // language: pt-BR
    note: 'The grid moved Owner into its rows’ pop-in and hid Região for room. Their boxes keep the reader’s value and their status says where they are; the sets never enter the state.',
    // language: en-US
    snippet: defineSnippet({
      id: 'column-manager-angular-hidden-by-space',
      language: 'angular',
      label: 'The grid’s set, passed on',
      source: `<sl-data-grid #grid="slDataGrid" rowKey="id" [columns]="columns" [rows]="orders" />
<sl-column-manager [columns]="columns" [outOfSpace]="grid.outOfSpace()" />`,
    }),
  },
  {
    id: 'reorder',
    title: 'Reorder by pointer and by keyboard',
    note: 'Drag a grip: the row dims and a line marks where it lands, inside its zone only. Or focus a grip and press Alt+ArrowDown: the column moves one place, “Customer moved to position 3” is announced, and focus stays on the grip.',
    snippet: defineSnippet({
      id: 'column-manager-angular-reorder',
      language: 'angular',
      label: 'A move is a request with change order',
      source: `<sl-column-manager
  [columns]="columns"
  [(columnState)]="state"
  (columnStateChangeRequest)="$event.change === 'order' && saveOrder($event.value.order)"
/>`,
    }),
  },
  {
    id: 'pinning',
    title: 'Pinning',
    note: 'Order is pinned to the start and Actions to the end, each in its section. Open a row’s pin to move it between zones; a pinned column’s pin is in the accent ink, and a move never crosses a zone.',
    snippet: defineSnippet({
      id: 'column-manager-angular-pinning',
      language: 'angular',
      label: 'Zones are facts of the state',
      source: `<sl-column-manager
  [columns]="columns"
  [defaultColumnState]="{ pinned: { start: ['number'], end: ['actions'] } }"
/>`,
    }),
  },
  {
    id: 'reset-and-show-all',
    title: 'Show all and Restore defaults',
    note: 'Four columns hidden against a default of one. Show all asks for none hidden; Restore defaults asks for defaultColumnState with the reason clear. Each is disabled while it would change nothing.',
    snippet: defineSnippet({
      id: 'column-manager-angular-reset',
      language: 'angular',
      label: 'The default is the reset target',
      source: `<sl-column-manager
  [columns]="columns"
  [defaultColumnState]="defaults"
  [(columnState)]="state"
  (columnStateChangeRequest)="$event.reason === 'clear' && announceRestored()"
/>`,
    }),
  },
  {
    id: 'trigger-count',
    title: 'The count on the trigger',
    note: 'No count at zero, a chip at one and at twelve. The chip is aria-hidden and a visually hidden sentence names the trigger — “Columns 12 hidden columns” — so the number is heard once, as words.',
    snippet: defineSnippet({
      id: 'column-manager-angular-trigger',
      language: 'angular',
      label: 'The directive goes on any button',
      source: `<button
  slButton
  size="sm"
  variant="ghost"
  slColumnManagerTrigger
  [slColumnManagerTriggerFor]="manager"
  type="button"
>
  Columns
</button>`,
    }),
  },
  {
    id: 'with-data-grid',
    title: 'With the data grid',
    note: 'The grid and the manager share one column state. Manage columns… in any column menu opens the manager the toolbar trigger opens; narrow the room and the grid’s outOfSpace reaches the list as Shown in row and Hidden for space.',
    snippet: defineSnippet({
      id: 'column-manager-angular-data-grid',
      language: 'angular',
      label: 'One state, two editors',
      source: `<button slButton slColumnManagerTrigger [slColumnManagerTriggerFor]="manager" type="button">
  Columns
</button>
<sl-data-grid
  #grid="slDataGrid"
  manageable
  rowKey="id"
  [columns]="columns"
  [rows]="orders"
  [(columnState)]="state"
  (manageColumns)="manager.show()"
/>
<sl-column-manager
  #manager="slColumnManager"
  [columns]="columns"
  [outOfSpace]="grid.outOfSpace()"
  [(columnState)]="state"
/>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab walks the search, then each row’s checkbox, grip and pin, then the footer. Space toggles a box; Alt+ArrowUp/Down on a grip moves the column; Enter on a pin opens its menu; Escape during a drag cancels it.',
    snippet: defineSnippet({
      id: 'column-manager-angular-keyboard',
      language: 'angular',
      label: 'The keys are the family’s',
      source: `<sl-column-manager presentation="inline" [columns]="columns" />`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Names, descriptions and announcements',
    note: 'The panel is a group named Columns and each zone a group named by its label. A box is named by the column and its status and described by its description; a keyboard move is announced politely with the new position.',
    snippet: defineSnippet({
      id: 'column-manager-angular-accessibility',
      language: 'ts',
      label: 'Words for another language',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'columnStateChangeRequest',
    payload: 'ChangeRequest<GridColumnState> & { change, changes }',
    when: 'Before the state moves: a box (pointer, keyboard), a move (pointer, keyboard), a pin, Show all, Restore defaults (clear), or Apply under confirm (submit). change is changes[0]; changes lists every key that differs. cancel() refuses it.',
  },
  {
    name: 'columnStateChange',
    payload: 'GridColumnState',
    when: 'The model half of [(columnState)], after a request nobody cancelled.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the layer opens or closes: the trigger (pointer, keyboard), Escape, a press outside, the back gesture in a drawer, Apply and Cancel, or show() and hide() (programmatic).',
  },
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'The model half of [(open)], after a request nobody cancelled.',
  },
];

export const ANGULAR_COLUMN_MANAGER_DOCS = {
  columnManager: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'columns',
        'readonly GridColumn[]',
        '—',
        'sl-column-manager',
        'The grid’s columns: id, label, description, hideable, reorderable. Every column is listed',
      ],
      [
        'columnState',
        'model<GridColumnState | undefined>',
        '—',
        'sl-column-manager',
        'Two-way. Unbound, the manager holds the state itself from defaultColumnState',
      ],
      [
        'defaultColumnState',
        'Partial<GridColumnState>',
        '—',
        'sl-column-manager',
        'The start while columnState is unbound, and the target of Restore defaults in both modes',
      ],
      [
        'outOfSpace',
        'GridOutOfSpace',
        '{ popin: [], hidden: [] }',
        'sl-column-manager',
        'The columns the grid took out for room — grid.outOfSpace() — listed with Shown in row for popin and Hidden for space for hidden, never written to the state',
      ],
      [
        'presentation',
        "'popover' | 'drawer' | 'inline'",
        'popover',
        'sl-column-manager, provideColumnManagerDefaults',
        'A popover on the trigger, a drawer at the end, or the panel in place',
      ],
      [
        'apply',
        "'live' | 'confirm'",
        'live',
        'sl-column-manager, provideColumnManagerDefaults',
        'live asks for every action; confirm edits a draft that Apply asks for once',
      ],
      [
        'open',
        'model<boolean>',
        'false',
        'sl-column-manager',
        'Two-way: whether the layer is open',
      ],
      [
        'messages',
        'Partial<ColumnManagerMessages>',
        '—',
        'sl-column-manager',
        'Words laid over the language in force, key by key: title, search, noResults, showAll, reset, apply, cancel, pinnedStart, unpinned, pinnedEnd, pin, pinStart, pinEnd, unpin, reorder, moved, required, hiddenBySpace, inRow, hiddenCount, visibleCount',
      ],
      [
        'show(), hide(), toggleOpen()',
        'methods',
        '—',
        'slColumnManager',
        'Open and close with the reason programmatic, for a grid’s (manageColumns) or any other caller',
      ],
      [
        'slColumnManagerTriggerFor',
        'SlColumnManager',
        '—',
        '[slColumnManagerTrigger]',
        'The manager the button opens. The directive writes aria-haspopup, aria-expanded, aria-controls, data-open, data-part="trigger", and appends the count',
      ],
      [
        'provideColumnManagerDefaults',
        '{ presentation, apply }',
        '—',
        'providers',
        'The decisions an application takes once. A manager that states either itself still wins; the words come from the language in force (provideSlotted)',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a column chooser, so the rows are native controls in document order: an slCheckbox, a grip button and a pin button that opens an sl-menu. Tab gives three stops a row and the search shortens the list first; the inspected AG Grid and MUI X panels make the same choice, and a layout grid would give one stop at the price of a cursor model of its own.',
      // language: pt-BR
      'The root is a group named by its heading and each zone a group named by its label, so a reader hears Pinned to start before the columns in it. A checkbox is named by the column and its status — “Order Required”, “Região Hidden for space” — and described by the column’s description through slCheckboxDescription.',
      // language: en-US
      'Alt+ArrowUp/Down on a grip is the rearrangeable listbox’s move: the column moves one place within its zone, focus stays on the grip, and the live announcer says “Customer moved to position 3”. A pointer drag runs through @slotted/core/drag, whose Escape cancels the drag before the layer sees it.',
      'The trigger says aria-haspopup="dialog", aria-expanded and aria-controls; its count is aria-hidden and a visually hidden sentence carries it, so the name is “Columns 3 hidden columns” and the number is never read as a bare digit.',
    ],
    snippets: [
      defineSnippet({
        id: 'column-manager-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="column-manager"
  data-part="root"
  data-presentation="popover"
  data-apply="live"
  role="group"
  aria-labelledby="slotted-column-manager-1-title"
>
  <div data-part="header">
    <h2 data-part="title" id="slotted-column-manager-1-title">Columns</h2>
    <span data-part="summary">7 of 9 shown</span>
  </div>
  <div data-part="search"><div data-ui="text-field">…</div></div>
  <div data-part="list">
    <div data-part="section" data-zone="middle" role="group">
      <div data-part="section-label">Columns</div>
      <div data-part="item" data-column="region" data-space-hidden>
        <button data-part="handle" aria-label="Reorder Region"></button>
        <div data-part="visibility"><div data-ui="checkbox">…</div></div>
        <button data-part="pin" aria-label="Pin Region" aria-haspopup="menu"></button>
      </div>
    </div>
  </div>
  <div data-part="footer">
    <button data-ui="button" data-part="show-all">Show all</button>
    <button data-ui="button" data-part="reset">Restore defaults</button>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'column-manager-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='column-manager'] {
  --slotted-column-manager-inline-size: 26rem;
  --slotted-column-manager-list-max-block-size: min(70vh, 36rem);
}`,
      }),
    ],
  },
} as const;
