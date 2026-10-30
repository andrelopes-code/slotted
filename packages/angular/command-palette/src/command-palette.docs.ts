import commandPaletteTokens from '@slotted/styles/command-palette/tokens.json';
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

export const ANGULAR_COMMAND_PALETTE_TOKENS = commandPaletteTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Command palette decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlCommandPalette, SlCommandPaletteTrigger, SlCommandPaletteItem, provideCommandPaletteDefaults } from '@slotted/angular/command-palette';",
  selector: 'sl-command-palette, [slCommandPaletteTrigger], ng-template[slCommandPaletteItem]',
  exportAs: 'slCommandPalette',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The panel. Carries data-ui="command-palette", data-presentation, data-size, data-open, data-loading, data-disabled, data-query while something is typed and data-empty while nothing matched. Inside the dialog’s plain surface, or where sl-command-palette was written under presentation="inline".',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'The consumer’s own control carrying slCommandPaletteTrigger, pointed at the instance. Written where the product wants it; absent under presentation="inline".',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose: 'The search row: the mark, the trail, the field and the clear.',
  },
  {
    part: 'search',
    element: 'span',
    required: false,
    purpose: 'The magnifier, drawn from the glyph scale. Replaced by busy while loading.',
  },
  {
    part: 'busy',
    element: 'span',
    required: false,
    purpose:
      'The ring spinner draws, worn as data-ui="spinner": in the header while loading, and at the end of a row whose handler has not answered.',
  },
  {
    part: 'pages',
    element: 'ol',
    required: false,
    purpose: 'The trail of open pages, oldest first, drawn only once a page is open.',
  },
  {
    part: 'page',
    element: 'button',
    required: false,
    purpose: 'One page in the trail. Pressing it returns to that page.',
  },
  {
    part: 'input',
    element: 'input',
    required: true,
    purpose:
      'role="combobox", aria-expanded="true", aria-controls naming the list, aria-activedescendant naming the current row, aria-autocomplete="list". DOM focus stays here for the whole interaction.',
  },
  {
    part: 'clear',
    element: 'button',
    required: true,
    purpose:
      'Empties the query. Out of the tab sequence and drawn only while there is something to clear.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The way out where the scrim is not: the close message at the end of the field, drawn by the stylesheet only while the dialog is full screen, asking open to be false with the reason dismiss. Absent inline.',
  },
  {
    part: 'list',
    element: 'div',
    required: true,
    purpose: 'role="listbox". Scrolls inside the panel; aria-busy while loading.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose:
      'role="group", named by its group-label. The recents are the first group, labelled by the recent message.',
  },
  { part: 'group-label', element: 'div', required: false, purpose: 'The heading of a group.' },
  {
    part: 'item',
    element: 'div | a',
    required: false,
    purpose:
      'role="option". An anchor when the item has href. Carries aria-selected on the current row, aria-disabled, aria-busy and aria-keyshortcuts; data-current, data-disabled, data-loading and data-page.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The first column. Empty in the family’s own row; an item template writes an icon into it.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The command’s name, one line, cut with an ellipsis; the whole text is on the row’s title.',
  },
  {
    part: 'match',
    element: 'mark',
    required: false,
    purpose:
      'The run of the label the query matched: the match part of the highlight family, whose root sits inside label.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'The second line under the label. Hidden below 360 pixels.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'A word at the end of the row — the kind of thing this is. Hidden from assistive technology and below 360 pixels.',
  },
  {
    part: 'shortcut',
    element: 'span',
    required: false,
    purpose:
      'The binding, holding outline keycaps from kbd[slShortcut] at a tenth under the row’s secondary type, with nothing drawn between them. Hidden from assistive technology; the row announces it through aria-keyshortcuts.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: false,
    purpose: 'The chevron on a row that opens a page, mirrored in a right-to-left document.',
  },
  {
    part: 'separator',
    element: 'div',
    required: false,
    purpose: 'role="separator", between two groups.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'The message when nothing matched: the empty message, or ng-template[slCommandPaletteEmpty].',
  },
  {
    part: 'status',
    element: 'div',
    required: true,
    purpose:
      'role="status", visually hidden: the result count, the loading sentence, the error of a rejected handler.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose:
      'Three skeleton rows while loading with nothing to show. Hidden from assistive technology.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The keyboard hints. Replaced by ng-template[slCommandPaletteFooter], removed by hideFooter.',
  },
  {
    part: 'hint',
    element: 'span',
    required: false,
    purpose: 'One hint: outline caps from kbd[slShortcut] and a word.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Press the trigger, or ⌘K, and the palette opens at the top of the layer with the first row already current. Type to rank, arrow to move, Enter to run.',
    snippet: defineSnippet({
      id: 'command-palette-angular-playground',
      language: 'angular',
      label: 'A palette with a trigger',
      source:
        '<button slButton [slCommandPaletteTrigger]="palette">Search</button>\n<sl-command-palette\n  #palette="slCommandPalette"\n  [items]="items"\n  [groups]="groups"\n  (select)="run($event.item.id)"\n/>',
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, inline',
    note: 'The same panel with no layer around it, so every part can be pointed at: the header with its mark and clear, the grouped list, the current row, a row with a description and a binding, and the footer of hints.',
    snippet: defineSnippet({
      id: 'command-palette-angular-anatomy',
      language: 'ts',
      label: 'One item, every field',
      source:
        "const items: CommandPaletteItem[] = [\n  {\n    id: 'deploy',\n    label: 'Deploy to production',\n    description: 'Ship the current release of api-gateway',\n    keywords: ['ship', 'release'],\n    group: 'actions',\n    shortcut: 'mod+shift+d',\n    onSelect: () => this.deploy(),\n  },\n];",
    }),
  },
  {
    id: 'groups',
    title: 'Groups, in the order the product declares',
    note: 'groups gives each heading its label and its place; an item whose group is not listed lands under its own id, after them, and an item with no group closes the list.',
    snippet: defineSnippet({
      id: 'command-palette-angular-groups',
      language: 'angular',
      label: 'Headings and their order',
      source:
        "<sl-command-palette\n  presentation=\"inline\"\n  [items]=\"items\"\n  [groups]=\"[\n    { id: 'nav', label: 'Go to' },\n    { id: 'actions', label: 'Actions' },\n  ]\"\n/>",
    }),
  },
  {
    id: 'ranking',
    title: 'Ranking, and the adapter',
    note: 'Type “dep”: a label that starts with it outranks a word that starts with it, which outranks a run inside a word, which outranks a keyword; groups reorder by their best row. The third panel hands the order to a ranker of the product’s own.',
    snippet: defineSnippet({
      id: 'command-palette-angular-ranking',
      language: 'angular',
      label: 'The default ranker, and one of your own',
      source:
        '<sl-command-palette presentation="inline" query="dep" [items]="items" />\n\n<!-- A server has already ranked the list: show it as it came. -->\n<sl-command-palette presentation="inline" [items]="results" [rank]="null" />\n\n<!-- Or score it yourself. -->\n<sl-command-palette presentation="inline" [items]="items" [rank]="byWeight" />',
    }),
  },
  {
    id: 'pages',
    title: 'Pages, stacked',
    note: 'A row with children opens a page: the trail appears before the field, the children take the list, and Backspace on an empty query or Escape returns one page. pages is state the product may own through the model.',
    snippet: defineSnippet({
      id: 'command-palette-angular-pages',
      language: 'angular',
      label: 'A row that opens a page',
      source: '<sl-command-palette presentation="inline" [items]="items" [(pages)]="pages" />',
    }),
  },
  {
    id: 'recent',
    title: 'What the reader ran last',
    note: 'With nothing typed, the recents open the list under their own heading; running a row moves it to the front and cuts the array at recentLimit. Persisting it is the product’s — it receives the array through the model.',
    snippet: defineSnippet({
      id: 'command-palette-angular-recent',
      language: 'angular',
      label: 'Recents the product keeps',
      source:
        '<sl-command-palette\n  presentation="inline"\n  [items]="items"\n  [(recent)]="recent"\n  [recentLimit]="3"\n  (recentChangeRequest)="persist($event.value)"\n/>',
    }),
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts, drawn for the platform',
    note: 'One notation, mod+shift+d, becomes ⌘⇧D on a Mac and Ctrl+Shift+D elsewhere, and is announced as Meta+Shift+D or Control+Shift+D. A sequence such as g i is drawn and not announced. The palette binds none of them: the lines below do.',
    snippet: defineSnippet({
      id: 'command-palette-angular-shortcuts',
      language: 'ts',
      label: 'Binding an item’s shortcut yourself',
      source:
        "class Shell {\n  private readonly platformOf = injectKbdPlatform();\n\n  @HostListener('document:keydown', ['$event'])\n  onKey(event: KeyboardEvent) {\n    const platform = this.platformOf();\n    const hit = this.items.find(\n      (item) => item.shortcut && matchesShortcut(event, item.shortcut, platform),\n    );\n    if (hit) hit.onSelect?.();\n  }\n}",
    }),
  },
  {
    id: 'destinations',
    title: 'Rows that are places',
    note: 'A row with href renders as a link with role option: Enter follows it, ⌘Enter opens it in a new tab because the browser, not the palette, answers the modifier. meta says what kind of place it is.',
    snippet: defineSnippet({
      id: 'command-palette-angular-destinations',
      language: 'ts',
      label: 'A destination and an action, side by side',
      source:
        "const items: CommandPaletteItem[] = [\n  { id: 'billing', label: 'Billing', href: '/settings/billing', meta: 'Page' },\n  { id: 'invoice', label: 'Download last invoice', onSelect: () => this.download() },\n];",
    }),
  },
  {
    id: 'async',
    title: 'A command that takes a while',
    note: 'A handler that returns a promise keeps the palette open and the row busy, refuses a second run of the same row until it settles, then closes; a rejection keeps it open and the status row says why. Press the first row and wait two seconds.',
    snippet: defineSnippet({
      id: 'command-palette-angular-async',
      language: 'ts',
      label: 'A promise, and a refusal',
      source:
        "const items: CommandPaletteItem[] = [\n  { id: 'restart', label: 'Restart api-gateway', onSelect: () => this.api.restart('api-gateway') },\n  {\n    id: 'purge',\n    label: 'Purge CDN cache',\n    onSelect: () => Promise.reject(new Error('Not allowed')),\n  },\n];",
    }),
  },
  {
    id: 'loading',
    title: 'While the results travel',
    note: 'loading swaps the magnifier for the ring, draws three skeleton rows when there is nothing to show yet, and says the loading message in the status row. The palette debounces nothing: the product does, in a few lines.',
    snippet: defineSnippet({
      id: 'command-palette-angular-loading',
      language: 'angular',
      label: 'A remote search',
      source:
        '<sl-command-palette [items]="results()" [loading]="loading()" [rank]="null" [(query)]="query" />',
    }),
  },
  {
    id: 'empty',
    title: 'Nothing matched',
    note: 'The empty part takes the list, the count row says “0 results”, and the root carries data-empty. The second panel replaces the sentence with the product’s own template.',
    snippet: defineSnippet({
      id: 'command-palette-angular-empty',
      language: 'angular',
      label: 'Your own empty state',
      source:
        '<sl-command-palette presentation="inline" query="xylophone" [items]="items">\n  <ng-template slCommandPaletteEmpty>No command matches. Try a service name.</ng-template>\n</sl-command-palette>',
    }),
  },
  {
    id: 'inline',
    title: 'Without a layer',
    note: 'presentation="inline" draws the panel where it was written — here inside a popover on an “Assign to” button — with no scrim, no hotkey and no Escape to close. It is the filtered menu that menu refused.',
    snippet: defineSnippet({
      id: 'command-palette-angular-inline',
      language: 'angular',
      label: 'A palette inside a popover',
      source:
        '<ng-container slPopover>\n  <button slButton slPopoverTrigger>Assign to…</button>\n  <ng-template slPopoverLayer>\n    <div slPopoverContent aria-label="Assign to">\n      <sl-command-palette presentation="inline" hideFooter [items]="people" />\n    </div>\n  </ng-template>\n</ng-container>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three measures',
    note: 'size is the dialog’s measure — 24, 32 and 42 rems — and the row’s step: sm rows read the small control geometry, lg rows the large, and the header stands one step above the rows in each.',
    snippet: defineSnippet({
      id: 'command-palette-angular-sizes',
      language: 'angular',
      label: 'The three steps',
      source:
        '<sl-command-palette presentation="inline" size="sm" [items]="items" />\n<sl-command-palette presentation="inline" size="lg" [items]="items" />',
    }),
  },
  {
    id: 'states',
    title: 'Every state a row can be in',
    note: 'At rest, current from the keyboard, busy while its handler runs, disabled but announced and kept in place, opening a page, and a link. Hover a row that is not current for the quieter wash.',
    snippet: defineSnippet({
      id: 'command-palette-angular-states',
      language: 'ts',
      label: 'A disabled row stays in the list',
      source:
        "const items: CommandPaletteItem[] = [\n  {\n    id: 'delete',\n    label: 'Delete workspace',\n    description: 'Requires the owner role',\n    disabled: true,\n  },\n];",
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label of sixty characters, a description longer than the row, a binding of four keys and a row with a short label beside it: the label gives way, the binding never does, and the rows stay one line each.',
    snippet: defineSnippet({
      id: 'command-palette-angular-content',
      language: 'ts',
      label: 'The whole label survives on the title',
      source:
        "const items: CommandPaletteItem[] = [\n  {\n    id: 'sync',\n    label: 'Benachrichtigungseinstellungen für alle Arbeitsbereiche synchronisieren',\n    shortcut: 'mod+shift+alt+p',\n  },\n];",
    }),
  },
  {
    id: 'hotkey',
    title: 'The chord that opens it',
    note: 'mod+k by default, matched on the document in the capture phase with preventDefault, so Firefox’s search bar does not answer first. A bare key such as / stays quiet inside a text field; [hotkey]="null" turns it off. Focus the page and press ⌘K or Ctrl+K.',
    snippet: defineSnippet({
      id: 'command-palette-angular-hotkey',
      language: 'angular',
      label: 'Another chord, or none',
      source:
        '<sl-command-palette hotkey="mod+p" [items]="items" />\n<sl-command-palette hotkey="/" [items]="items" />\n<sl-command-palette [hotkey]="null" [items]="items" />',
    }),
  },
  {
    id: 'defaults',
    title: 'Set once for the application',
    note: 'The provider holds every axis, and provideSlotted the language the family speaks: the panel below reads Portuguese words, a size and a hotkey it did not state itself.',
    snippet: defineSnippet({
      id: 'command-palette-angular-defaults',
      language: 'ts',
      label: 'Translating the family',
      source:
        "bootstrapApplication(App, {\n  providers: [\n    provideSlotted({ locale: 'pt-BR' }),\n    provideCommandPaletteDefaults({ hotkey: 'mod+p', size: 'sm' }),\n  ],\n});",
    }),
  },
  {
    id: 'composition',
    title: 'In an application’s top bar',
    note: 'The trigger is a search-shaped slButton with a kbd in it, carrying slCommandPaletteTrigger; the row content is the product’s own through an item template, with an avatar where the icon column is.',
    snippet: defineSnippet({
      id: 'command-palette-angular-composition',
      language: 'angular',
      label: 'Your trigger, your rows',
      source:
        '<button slButton tone="secondary" variant="outline" [slCommandPaletteTrigger]="palette">\n  Search people <kbd slKbd size="sm">⌘K</kbd>\n</button>\n<sl-command-palette #palette="slCommandPalette" [items]="people">\n  <ng-template slCommandPaletteItem let-item let-query="query">\n    <span data-part="icon"><sl-avatar [name]="item.label" size="xs" /></span>\n    <span data-part="label">\n      <span slHighlight [text]="item.label" [query]="query"></span>\n    </span>\n  </ng-template>\n</sl-command-palette>',
    }),
  },
  {
    id: 'keyboard',
    title: 'The keys',
    note: 'Arrows move and wrap, PageUp and PageDown move ten and stop, Ctrl+Home and Ctrl+End reach the ends, Home and End keep moving the caret, Enter runs, Escape clears then returns a page then closes, Backspace on an empty query returns a page.',
    snippet: defineSnippet({
      id: 'command-palette-angular-keyboard',
      language: 'angular',
      label: 'Nothing to write: the keys come with the family',
      source: '<sl-command-palette presentation="inline" [items]="items" />',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader meets',
    note: 'The dialog is named by the label message, the field by the input message, the list by the same; the current row is aria-selected and named by aria-activedescendant; the count, the wait and a failure are one live region. Open the tree to read it.',
    snippet: defineSnippet({
      id: 'command-palette-angular-accessibility',
      language: 'angular',
      label: 'The two names',
      source:
        '<sl-command-palette\n  [messages]="{ label: \'Deployment commands\', input: \'Search deployments\' }"\n  [items]="items"\n/>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChange / openChangeRequest',
    payload: 'boolean / ChangeRequest<boolean>',
    when: 'Before the palette opens or closes; reason is pointer, keyboard, escape, outsidePress, select, dismiss or programmatic. request.cancel() refuses it; the model updates after.',
  },
  {
    name: 'queryChange / queryChangeRequest',
    payload: 'string / ChangeRequest<string>',
    when: 'Before the query moves: keyboard as the reader types, clear from the clear control or Escape, select when a page opens, programmatic on close and from setQuery().',
  },
  {
    name: 'highlightedIdChange / highlightedIdChangeRequest',
    payload: 'string | null / ChangeRequest<string | null>',
    when: 'Before the current row moves: pointer, keyboard, or programmatic when the rows changed under it.',
  },
  {
    name: 'pagesChange / pagesChangeRequest',
    payload: 'string[] / ChangeRequest<readonly string[]>',
    when: 'Before a page opens or closes: select from Enter on a row with children, pointer from a click on one or on the trail, keyboard from Backspace or Escape, programmatic on close.',
  },
  {
    name: 'recentChange / recentChangeRequest',
    payload: 'string[] / ChangeRequest<readonly string[]>',
    when: 'After a row ran, with its id moved to the front and the array cut at recentLimit; reason select.',
  },
  {
    name: 'select',
    payload: '{ item, reason, source, keepOpen() }',
    when: 'When a row runs, after the row’s own onSelect and after a returned promise fulfilled; reason pointer or keyboard. Never for a disabled row or a row that opens a page.',
  },
];

export const ANGULAR_COMMAND_PALETTE_DOCS = {
  commandPalette: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'items',
        'CommandPaletteItem[]',
        '—',
        'sl-command-palette',
        'The commands: id, label, keywords, description, group, meta, shortcut, href, target, disabled, onSelect, children',
      ],
      [
        'groups',
        'CommandGroup[]',
        '—',
        'sl-command-palette',
        'The headings and their order; a group not listed is drawn after them under its own id',
      ],
      [
        'rank',
        'CommandRanker | null',
        'the core ranker',
        'sl-command-palette',
        '(item, query) => number | null. Absent takes the locale-sensitive core ranker; null shows the items as they came',
      ],
      [
        'locale',
        'string',
        '—',
        'sl-command-palette',
        'BCP 47, for the comparison the default ranker and the match mark make',
      ],
      [
        'limit',
        'number',
        '—',
        'sl-command-palette',
        'How many rows to draw at most, across groups in reading order',
      ],
      [
        'open',
        'model<boolean>',
        'false',
        'sl-command-palette',
        'model(): the layer’s state, two-way with [(open)]',
      ],
      [
        'query',
        'model<string>',
        "''",
        'sl-command-palette',
        'model(): the text, two-way with [(query)]',
      ],
      [
        'highlightedId',
        'model<string | null>',
        'null',
        'sl-command-palette',
        'model(): the current row; autoHighlight moves it to the first row',
      ],
      [
        'pages',
        'model<string[]>',
        '[]',
        'sl-command-palette',
        'model(): the ids of the open pages, oldest first',
      ],
      [
        'recent',
        'model<string[]>',
        '[]',
        'sl-command-palette',
        'model(): the ids the reader ran recently, newest first',
      ],
      [
        'presentation',
        "'dialog' | 'inline'",
        'dialog',
        'sl-command-palette',
        'dialog composes the dialog family; inline draws the panel where it was written',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'sl-command-palette',
        'The dialog’s measure and the row’s control step',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'sl-command-palette',
        'Whether a press on the scrim closes the palette',
      ],
      [
        'loop',
        'boolean',
        'true',
        'sl-command-palette',
        'Whether ArrowDown on the last row wraps to the first',
      ],
      [
        'autoHighlight',
        'boolean',
        'true',
        'sl-command-palette',
        'Whether the first enabled row is current on open and after every change of the rows',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'sl-command-palette',
        'Whether running a row closes the palette; keepOpen() on the request holds it open once',
      ],
      [
        'clearOnClose',
        'boolean',
        'true',
        'sl-command-palette',
        'Whether closing empties the query and the pages, each through its own request',
      ],
      [
        'highlightMatch',
        'boolean',
        'true',
        'sl-command-palette',
        'Whether the run the query matched is marked in the label',
      ],
      [
        'hotkey',
        'string | null',
        'mod+k',
        'sl-command-palette',
        'The chord that opens the palette from anywhere; null for none. A bare key stays quiet in an editable field',
      ],
      ['recentLimit', 'number', '5', 'sl-command-palette', 'How many recents are kept'],
      [
        'loading',
        'boolean',
        'false',
        'sl-command-palette',
        'The ring in the header, three skeleton rows when there is nothing to show, aria-busy on the list, the loading message in the status row',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'sl-command-palette',
        'Disables the field, the trigger and the hotkey',
      ],
      [
        'hideFooter',
        'boolean',
        'false',
        'sl-command-palette',
        'Removes the footer; an ng-template[slCommandPaletteFooter] replaces it instead',
      ],
      [
        'container',
        'Element | null',
        '—',
        'sl-command-palette',
        'A parent for the layer alone, instead of the portal root the dialog makes beside this host',
      ],
      [
        'messages',
        'Partial<CommandPaletteMessages>',
        '—',
        'sl-command-palette',
        'Words laid over the language in force, key by key: the dialog’s name (label), the field’s name and placeholder (input, placeholder), the empty, loading, count and error sentences, the recents heading, the clear, close and back controls, and the footer’s hints',
      ],
      [
        'slCommandPaletteTrigger',
        'SlCommandPalette',
        '—',
        '[slCommandPaletteTrigger]',
        'The instance the control opens, reached with a template reference variable',
      ],
    ]),
    events,
    composition: apiRows([
      [
        'ng-template[slCommandPaletteItem]',
        'let-item, let-current, let-disabled, let-pending, let-query, let-runs',
        '—',
        'sl-command-palette',
        'Replaces the row’s content; the option element and its wiring stay the family’s. runs is the marked label',
      ],
      [
        'ng-template[slCommandPaletteEmpty]',
        '—',
        '—',
        'sl-command-palette',
        'Replaces the empty message',
      ],
      [
        'ng-template[slCommandPaletteFooter]',
        '—',
        '—',
        'sl-command-palette',
        'Replaces the footer',
      ],
      [
        'exportAs',
        'slCommandPalette',
        '—',
        'sl-command-palette',
        'openPalette(), close(), toggle(), focus(), setQuery(), setHighlighted(), setPages(), scrollToId()',
      ],
      [
        '[slCommandPaletteTrigger]',
        'directive',
        '—',
        'the consumer’s button',
        'Writes data-part="trigger", aria-haspopup, aria-expanded and data-open on the consumer’s own element and registers it as the layer’s focus origin',
      ],
      [
        'provideCommandPaletteDefaults',
        'Partial<CommandPaletteDefaults>',
        '—',
        'the injector',
        'Every axis, set once; an explicit input still wins',
      ],
    ]),
    accessibility: [
      'The field carries role="combobox" with aria-expanded="true", aria-controls naming the list and aria-autocomplete="list"; the list carries role="listbox" and each row role="option". DOM focus stays on the field for the whole interaction and the current row is named by aria-activedescendant and marked aria-selected — the WAI-ARIA combobox pattern with a listbox popup, whose note says exactly this.',
      'The layer is the dialog family’s: role="dialog", aria-modal, the page inert behind the scrim, focus contained and returned to the trigger. Its name is the label message, pointed at through a hidden title the dialog labels itself by; the field’s name is the input message, and the list borrows it.',
      'A row with a shortcut carries aria-keyshortcuts in the platform’s own words — Meta+Shift+D on a Mac, Control+Shift+D elsewhere — while the drawn keys are aria-hidden; a sequence has no syntax in the attribute and is drawn only. A disabled row is announced with aria-disabled, stays in the list, and is skipped by every movement key.',
      'The result count, the loading sentence and the failure of a rejected handler are one visually hidden role="status" row, spoken through the shared live announcer so the same sentence is never said twice in a row.',
      'Escape is three steps in a fixed order — clear the query, return one page, close — so a reader who typed does not lose the palette on the first press; the footer draws the same keys the family answers.',
      'The panel answers its own width: below 360 pixels the description and the meta go and the binding stays; inside a dialog on a narrow screen the panel takes the whole layer.',
    ],
    snippets: [
      defineSnippet({
        id: 'command-palette-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-ui="command-palette" data-part="root" data-presentation="dialog" data-size="md" data-open>\n  <div data-part="header">\n    <span data-part="search" aria-hidden="true"></span>\n    <input\n      data-part="input"\n      role="combobox"\n      aria-expanded="true"\n      aria-controls="cp-list"\n      aria-activedescendant="cp-deploy"\n      aria-autocomplete="list"\n      aria-label="Search commands"\n    />\n    <button data-part="clear" type="button" tabindex="-1" aria-label="Clear"></button>\n  </div>\n  <div data-part="list" role="listbox" id="cp-list">\n    <div data-part="group" role="group" aria-labelledby="cp-g1">\n      <div data-part="group-label" id="cp-g1">Actions</div>\n      <div data-part="item" role="option" id="cp-deploy" aria-selected="true" data-current>\n        <span data-part="icon"></span>\n        <span data-part="label">Deploy to production</span>\n        <span data-part="shortcut" aria-hidden="true"></span>\n      </div>\n    </div>\n  </div>\n  <div data-part="status" role="status">9 results</div>\n  <div data-part="footer" aria-hidden="true"></div>\n</div>',
      }),
      defineSnippet({
        id: 'command-palette-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='command-palette'] {\n  --slotted-command-palette-radius: var(--slotted-radius-md);\n  --slotted-command-palette-list-max-block-size: 28rem;\n  --slotted-command-palette-highlight: var(--slotted-tone-secondary-subtle-hover);\n  --slotted-command-palette-highlight-ring: var(--slotted-border-strong);\n}",
      }),
    ],
  },
} as const;
