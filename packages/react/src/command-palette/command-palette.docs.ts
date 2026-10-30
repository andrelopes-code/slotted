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

export const REACT_COMMAND_PALETTE_TOKENS = commandPaletteTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Command palette decision',
}));

const imports: ReferenceImport = {
  source:
    "import { CommandPalette, CommandPaletteDefaultsProvider, CommandPaletteTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The panel. Carries data-ui="command-palette", data-presentation, data-size, data-open, data-loading, data-disabled, data-query while something is typed and data-empty while nothing matched. Inside the dialog’s plain surface, or where it was written under presentation="inline".',
  },
  {
    part: 'trigger',
    element: 'button',
    required: false,
    purpose:
      'The control that opens the palette, composed over the dialog family’s trigger. Rendered where it was written; render substitutes the element. Absent under presentation="inline".',
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
      'The first column, holding the consumer’s icon. Present on every row so labels line up.',
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
      'The binding, holding outline keycaps from kbd at a tenth under the row’s secondary type, with nothing drawn between them. Hidden from assistive technology; the row announces it through aria-keyshortcuts.',
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
    purpose: 'The message when nothing matched: the empty message, or the empty prop.',
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
    purpose: 'The keyboard hints. Replaced by the footer prop, removed by footer={null}.',
  },
  {
    part: 'hint',
    element: 'span',
    required: false,
    purpose: 'One hint: outline caps from kbd and a word.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Press the trigger, or ⌘K, and the palette opens at the top of the layer with the first row already current. Type to rank, arrow to move, Enter to run.',
    snippet: defineSnippet({
      id: 'command-palette-react-playground',
      language: 'tsx',
      label: 'A palette with a trigger',
      source:
        '<CommandPalette groups={groups} items={items} onSelect={(item) => run(item.id)}>\n  <CommandPaletteTrigger render={(props) => <Button {...props}>Search</Button>} />\n</CommandPalette>;',
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, inline',
    note: 'The same panel with no layer around it, so every part can be pointed at: the header with its mark and clear, the grouped list, the current row, a row with a description and a binding, and the footer of hints.',
    snippet: defineSnippet({
      id: 'command-palette-react-anatomy',
      language: 'tsx',
      label: 'One item, every field',
      source:
        "const items = [\n  {\n    id: 'deploy',\n    label: 'Deploy to production',\n    description: 'Ship the current release of api-gateway',\n    keywords: ['ship', 'release'],\n    group: 'actions',\n    icon: <RocketIcon />,\n    shortcut: 'mod+shift+d',\n    onSelect: () => deploy(),\n  },\n];",
    }),
  },
  {
    id: 'groups',
    title: 'Groups, in the order the product declares',
    note: 'groups gives each heading its label and its place; an item whose group is not listed lands under its own id, after them, and an item with no group closes the list.',
    snippet: defineSnippet({
      id: 'command-palette-react-groups',
      language: 'tsx',
      label: 'Headings and their order',
      source:
        "<CommandPalette\n  groups={[\n    { id: 'nav', label: 'Go to' },\n    { id: 'actions', label: 'Actions' },\n  ]}\n  items={items}\n  presentation=\"inline\"\n/>;",
    }),
  },
  {
    id: 'ranking',
    title: 'Ranking, and the adapter',
    note: 'Type “dep”: a label that starts with it outranks a word that starts with it, which outranks a run inside a word, which outranks a keyword; groups reorder by their best row. The third panel hands the order to a ranker of the product’s own.',
    snippet: defineSnippet({
      id: 'command-palette-react-ranking',
      language: 'tsx',
      label: 'The default ranker, and one of your own',
      source:
        '<CommandPalette defaultQuery="dep" items={items} presentation="inline" />;\n\n// A server has already ranked the list: show it as it came.\n<CommandPalette items={results} presentation="inline" rank={null} />;\n\n// Or score it yourself.\n<CommandPalette\n  items={items}\n  presentation="inline"\n  rank={(item, query) => (item.label.toLowerCase().includes(query) ? item.weight : null)}\n/>;',
    }),
  },
  {
    id: 'pages',
    title: 'Pages, stacked',
    note: 'A row with children opens a page: the trail appears before the field, the children take the list, and Backspace on an empty query or Escape returns one page. pages is state the product may own.',
    snippet: defineSnippet({
      id: 'command-palette-react-pages',
      language: 'tsx',
      label: 'A row that opens a page',
      source:
        "const items = [\n  {\n    id: 'team',\n    label: 'Switch team…',\n    children: [\n      { id: 'acme', label: 'Acme Robotics', onSelect: () => switchTo('acme') },\n      { id: 'globex', label: 'Globex Freight', onSelect: () => switchTo('globex') },\n    ],\n  },\n];\n\n<CommandPalette defaultPages={['team']} items={items} presentation=\"inline\" />;",
    }),
  },
  {
    id: 'recent',
    title: 'What the reader ran last',
    note: 'With nothing typed, the recents open the list under their own heading; running a row moves it to the front and cuts the array at recentLimit. Persisting it is the product’s — it receives the array.',
    snippet: defineSnippet({
      id: 'command-palette-react-recent',
      language: 'tsx',
      label: 'Recents the product keeps',
      source:
        "const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem('recent') ?? '[]'));\n\n<CommandPalette\n  items={items}\n  onRecentChange={(next) => {\n    setRecent(next);\n    localStorage.setItem('recent', JSON.stringify(next));\n  }}\n  presentation=\"inline\"\n  recent={recent}\n  recentLimit={3}\n/>;",
    }),
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts, drawn for the platform',
    note: 'One notation, mod+shift+d, becomes ⌘⇧D on a Mac and Ctrl+Shift+D elsewhere, and is announced as Meta+Shift+D or Control+Shift+D. A sequence such as g i is drawn and not announced. The palette binds none of them: the three lines below do.',
    snippet: defineSnippet({
      id: 'command-palette-react-shortcuts',
      language: 'tsx',
      label: 'Binding an item’s shortcut yourself',
      source:
        "useEffect(() => {\n  const onKey = (event: KeyboardEvent) => {\n    const hit = items.find(\n      (item) => item.shortcut && matchesShortcut(event, item.shortcut, platform),\n    );\n    if (hit) hit.onSelect?.();\n  };\n  document.addEventListener('keydown', onKey);\n  return () => document.removeEventListener('keydown', onKey);\n}, [items, platform]);",
    }),
  },
  {
    id: 'destinations',
    title: 'Rows that are places',
    note: 'A row with href renders as a link with role option: Enter follows it, ⌘Enter opens it in a new tab because the browser, not the palette, answers the modifier. meta says what kind of place it is.',
    snippet: defineSnippet({
      id: 'command-palette-react-destinations',
      language: 'tsx',
      label: 'A destination and an action, side by side',
      source:
        "const items = [\n  { id: 'billing', label: 'Billing', href: '/settings/billing', meta: 'Page' },\n  { id: 'invoice', label: 'Download last invoice', onSelect: () => download() },\n];",
    }),
  },
  {
    id: 'async',
    title: 'A command that takes a while',
    note: 'A handler that returns a promise keeps the palette open and the row busy, refuses a second run of the same row until it settles, then closes; a rejection keeps it open and the status row says why. Press the first row and wait two seconds.',
    snippet: defineSnippet({
      id: 'command-palette-react-async',
      language: 'tsx',
      label: 'A promise, and a refusal',
      source:
        "const items = [\n  { id: 'restart', label: 'Restart api-gateway', onSelect: () => api.restart('api-gateway') },\n  {\n    id: 'purge',\n    label: 'Purge CDN cache',\n    onSelect: () => Promise.reject(new Error('Not allowed')),\n  },\n];",
    }),
  },
  {
    id: 'loading',
    title: 'While the results travel',
    note: 'loading swaps the magnifier for the ring, draws three skeleton rows when there is nothing to show yet, and says the loading message in the status row. The palette debounces nothing: the product does, in three lines.',
    snippet: defineSnippet({
      id: 'command-palette-react-loading',
      language: 'tsx',
      label: 'A remote search',
      source:
        "const [query, setQuery] = useState('');\nconst [loading, setLoading] = useState(false);\nconst [results, setResults] = useState([]);\n\nuseEffect(() => {\n  setLoading(true);\n  const timer = setTimeout(\n    () =>\n      search(query)\n        .then(setResults)\n        .finally(() => setLoading(false)),\n    200,\n  );\n  return () => clearTimeout(timer);\n}, [query]);\n\n<CommandPalette\n  items={results}\n  loading={loading}\n  onQueryChange={setQuery}\n  query={query}\n  rank={null}\n/>;",
    }),
  },
  {
    id: 'empty',
    title: 'Nothing matched',
    note: 'The empty part takes the list, the count row says “0 results”, and the root carries data-empty. The second panel replaces the sentence with the product’s own node.',
    snippet: defineSnippet({
      id: 'command-palette-react-empty',
      language: 'tsx',
      label: 'Your own empty state',
      source:
        '<CommandPalette\n  defaultQuery="xylophone"\n  empty={<span>No command matches. Try a service name.</span>}\n  items={items}\n  presentation="inline"\n/>;',
    }),
  },
  {
    id: 'inline',
    title: 'Without a layer',
    note: 'presentation="inline" draws the panel where it was written — here inside a popover on an “Assign to” button — with no scrim, no hotkey and no Escape to close. It is the filtered menu that menu refused.',
    snippet: defineSnippet({
      id: 'command-palette-react-inline',
      language: 'tsx',
      label: 'A palette inside a popover',
      source:
        '<Popover>\n  <PopoverTrigger render={(props) => <Button {...props}>Assign to…</Button>} />\n  <PopoverContent>\n    <CommandPalette items={people} presentation="inline" footer={null} />\n  </PopoverContent>\n</Popover>;',
    }),
  },
  {
    id: 'sizes',
    title: 'Three measures',
    note: 'size is the dialog’s measure — 24, 32 and 42 rems — and the row’s step: sm rows read the small control geometry, lg rows the large, and the header stands one step above the rows in each.',
    snippet: defineSnippet({
      id: 'command-palette-react-sizes',
      language: 'tsx',
      label: 'The three steps',
      source:
        '<CommandPalette items={items} presentation="inline" size="sm" />;\n<CommandPalette items={items} presentation="inline" size="lg" />;',
    }),
  },
  {
    id: 'states',
    title: 'Every state a row can be in',
    note: 'At rest, current from the keyboard, busy while its handler runs, disabled but announced and kept in place, opening a page, and a link. Hover a row that is not current for the quieter wash.',
    snippet: defineSnippet({
      id: 'command-palette-react-states',
      language: 'tsx',
      label: 'A disabled row stays in the list',
      source:
        "const items = [\n  {\n    id: 'delete',\n    label: 'Delete workspace',\n    description: 'Requires the owner role',\n    disabled: true,\n  },\n];",
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label of sixty characters, a description longer than the row, a binding of four keys and a row with no icon beside rows that have one: the label gives way, the binding never does, and the icon column keeps every label on one line.',
    snippet: defineSnippet({
      id: 'command-palette-react-content',
      language: 'tsx',
      label: 'The whole label survives on the title',
      source:
        "const items = [\n  {\n    id: 'sync',\n    label: 'Benachrichtigungseinstellungen für alle Arbeitsbereiche synchronisieren',\n    shortcut: 'mod+shift+alt+p',\n  },\n];",
    }),
  },
  {
    id: 'hotkey',
    title: 'The chord that opens it',
    note: 'mod+k by default, matched on the document in the capture phase with preventDefault, so Firefox’s search bar does not answer first. A bare key such as / stays quiet inside a text field; hotkey={null} turns it off. Focus the page and press ⌘K or Ctrl+K.',
    snippet: defineSnippet({
      id: 'command-palette-react-hotkey',
      language: 'tsx',
      label: 'Another chord, or none',
      source:
        '<CommandPalette hotkey="mod+p" items={items} />;\n<CommandPalette hotkey="/" items={items} />;\n<CommandPalette hotkey={null} items={items} />;',
    }),
  },
  {
    id: 'defaults',
    title: 'Set once for the application',
    note: 'The provider holds every axis, and SlottedProvider the language the family speaks: the panel below reads Portuguese words, a size and a hotkey it did not state itself.',
    snippet: defineSnippet({
      id: 'command-palette-react-defaults',
      language: 'tsx',
      label: 'Translating the family',
      source:
        '<SlottedProvider locale="pt-BR">\n  <CommandPaletteDefaultsProvider hotkey="mod+p" size="sm">\n    <App />\n  </CommandPaletteDefaultsProvider>\n</SlottedProvider>;',
    }),
  },
  {
    id: 'composition',
    title: 'In an application’s top bar',
    note: 'The trigger is a search-shaped Button with a Kbd in it, rendered through render so the palette hands it the wiring and the ref; the row content is the product’s own through renderItem, with an avatar where the icon column is.',
    snippet: defineSnippet({
      id: 'command-palette-react-composition',
      language: 'tsx',
      label: 'Your trigger, your rows',
      source:
        '<CommandPalette\n  items={items}\n  renderItem={(item, state) => (\n    <>\n      <span data-part="icon">\n        <Avatar name={item.label} size="xs" />\n      </span>\n      <span data-part="label">{state.label}</span>\n    </>\n  )}\n>\n  <CommandPaletteTrigger\n    render={(props) => (\n      <Button {...props} tone="secondary" variant="outline">\n        Search <Kbd size="sm">⌘K</Kbd>\n      </Button>\n    )}\n  />\n</CommandPalette>;',
    }),
  },
  {
    id: 'keyboard',
    title: 'The keys',
    note: 'Arrows move and wrap, PageUp and PageDown move ten and stop, Ctrl+Home and Ctrl+End reach the ends, Home and End keep moving the caret, Enter runs, Escape clears then returns a page then closes, Backspace on an empty query returns a page.',
    snippet: defineSnippet({
      id: 'command-palette-react-keyboard',
      language: 'tsx',
      label: 'Nothing to write: the keys come with the family',
      source: '<CommandPalette items={items} presentation="inline" />;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader meets',
    note: 'The dialog is named by the label message, the field by the input message, the list by the same; the current row is aria-selected and named by aria-activedescendant; the count, the wait and a failure are one live region. Open the tree to read it.',
    snippet: defineSnippet({
      id: 'command-palette-react-accessibility',
      language: 'tsx',
      label: 'The two names',
      source:
        "<CommandPalette\n  items={items}\n  messages={{ input: 'Search deployments', label: 'Deployment commands' }}\n/>;",
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the palette opens or closes; reason is pointer, keyboard, escape, outsidePress, select, dismiss or programmatic. request.cancel() refuses it.',
  },
  {
    name: 'onQueryChange',
    payload: '(query: string, request: ChangeRequest<string>)',
    when: 'Before the query moves: keyboard as the reader types, clear from the clear control or Escape, select when a page opens, programmatic on close and from the handle.',
  },
  {
    name: 'onHighlightedIdChange',
    payload: '(id: string | null, request: ChangeRequest<string | null>)',
    when: 'Before the current row moves: pointer, keyboard, or programmatic when the rows changed under it.',
  },
  {
    name: 'onPagesChange',
    payload: '(pages: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before a page opens or closes: select from Enter on a row with children, pointer from a click on one or on the trail, keyboard from Backspace or Escape, programmatic on close.',
  },
  {
    name: 'onRecentChange',
    payload: '(recent: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'After a row ran, with its id moved to the front and the array cut at recentLimit; reason select.',
  },
  {
    name: 'onSelect',
    payload: '(item, request: { item, reason, source, keepOpen() })',
    when: 'When a row runs, after the row’s own onSelect and after a returned promise fulfilled; reason pointer or keyboard. Never for a disabled row or a row that opens a page.',
  },
];

export const REACT_COMMAND_PALETTE_DOCS = {
  commandPalette: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'items',
        'CommandPaletteItem[]',
        '—',
        'CommandPalette',
        'The commands: id, label, keywords, description, group, icon, meta, shortcut, href, target, disabled, onSelect, children',
      ],
      [
        'groups',
        'CommandGroup[]',
        '—',
        'CommandPalette',
        'The headings and their order; a group not listed is drawn after them under its own id',
      ],
      [
        'rank',
        'CommandRanker | null',
        'the core ranker',
        'CommandPalette',
        '(item, query) => number | null. Absent takes the locale-sensitive core ranker; null shows the items as they came',
      ],
      [
        'locale',
        'string',
        '—',
        'CommandPalette',
        'BCP 47, for the comparison the default ranker and the match mark make',
      ],
      [
        'limit',
        'number',
        '—',
        'CommandPalette',
        'How many rows to draw at most, across groups in reading order',
      ],
      [
        'open',
        'boolean',
        '—',
        'CommandPalette',
        'The consumer’s value; present at all puts the layer in controlled mode',
      ],
      [
        'defaultOpen',
        'boolean',
        'false',
        'CommandPalette',
        'The value an uncontrolled palette starts from, read once',
      ],
      [
        'query',
        'string',
        '—',
        'CommandPalette',
        'The consumer’s text; present at all puts the query in controlled mode',
      ],
      [
        'defaultQuery',
        'string',
        "''",
        'CommandPalette',
        'The text an uncontrolled palette starts from',
      ],
      ['highlightedId', 'string | null', '—', 'CommandPalette', 'The current row, controlled'],
      [
        'defaultHighlightedId',
        'string | null',
        'null',
        'CommandPalette',
        'The current row an uncontrolled palette starts from; autoHighlight moves it to the first row',
      ],
      [
        'pages',
        'string[]',
        '—',
        'CommandPalette',
        'The ids of the open pages, oldest first, controlled',
      ],
      [
        'defaultPages',
        'string[]',
        '[]',
        'CommandPalette',
        'The pages an uncontrolled palette starts on',
      ],
      [
        'recent',
        'string[]',
        '—',
        'CommandPalette',
        'The ids the reader ran recently, newest first, controlled',
      ],
      [
        'defaultRecent',
        'string[]',
        '[]',
        'CommandPalette',
        'The recents an uncontrolled palette starts with',
      ],
      [
        'presentation',
        "'dialog' | 'inline'",
        'dialog',
        'CommandPalette',
        'dialog composes the dialog family; inline draws the panel where it was written',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'CommandPalette',
        'The dialog’s measure and the row’s control step',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'CommandPalette',
        'Whether a press on the scrim closes the palette',
      ],
      [
        'loop',
        'boolean',
        'true',
        'CommandPalette',
        'Whether ArrowDown on the last row wraps to the first',
      ],
      [
        'autoHighlight',
        'boolean',
        'true',
        'CommandPalette',
        'Whether the first enabled row is current on open and after every change of the rows',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'CommandPalette',
        'Whether running a row closes the palette; keepOpen() on the request holds it open once',
      ],
      [
        'clearOnClose',
        'boolean',
        'true',
        'CommandPalette',
        'Whether closing empties the query and the pages, each through its own request',
      ],
      [
        'highlightMatch',
        'boolean',
        'true',
        'CommandPalette',
        'Whether the run the query matched is marked in the label',
      ],
      [
        'hotkey',
        'string | null',
        'mod+k',
        'CommandPalette',
        'The chord that opens the palette from anywhere; null for none. A bare key stays quiet in an editable field',
      ],
      ['recentLimit', 'number', '5', 'CommandPalette', 'How many recents are kept'],
      [
        'loading',
        'boolean',
        'false',
        'CommandPalette',
        'The ring in the header, three skeleton rows when there is nothing to show, aria-busy on the list, the loading message in the status row',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'CommandPalette',
        'Disables the field, the trigger and the hotkey',
      ],
      [
        'messages',
        'Partial<CommandPaletteMessages>',
        '—',
        'CommandPalette',
        'Words laid over the language in force, key by key: the dialog’s name (label), the field’s name and placeholder (input, placeholder), the empty, loading, count and error sentences, the recents heading, the clear, close and back controls, and the footer’s hints',
      ],
    ]),
    events,
    composition: apiRows([
      [
        'children',
        'ReactNode',
        '—',
        'CommandPalette',
        'The trigger, rendered where it was written; the panel is the family’s and goes into the layer',
      ],
      [
        'render',
        '(props: CommandPaletteTriggerRootProps) => ReactNode',
        '—',
        'CommandPaletteTrigger',
        'Substitutes the trigger’s element. Attach the ref it hands you beside your own: it is the layer’s focus origin',
      ],
      [
        'renderItem',
        '(item, state: { current, disabled, pending, label, query }) => ReactNode',
        '—',
        'CommandPalette',
        'Replaces the row’s content; the option element and its wiring stay the family’s. state.label is the marked label',
      ],
      ['empty', 'ReactNode', '—', 'CommandPalette', 'Replaces the empty message'],
      ['footer', 'ReactNode | null', '—', 'CommandPalette', 'Replaces the footer; null removes it'],
      [
        'inputProps',
        "ComponentPropsWithRef<'input'>",
        '—',
        'CommandPalette',
        'Native props for the field, ref included; onKeyDown and onChange run before the family’s and preventDefault() skips it',
      ],
      [
        'container',
        'Element | null',
        '—',
        'CommandPalette',
        'A parent for the layer alone, instead of the portal root made beside the trigger',
      ],
      [
        'ref',
        'Ref<CommandPaletteHandle>',
        '—',
        'CommandPalette',
        'open(), close(), toggle(), focus(), setQuery(), scrollToId(), and the input element',
      ],
      [
        'CommandPaletteDefaultsProvider',
        'Partial<CommandPaletteDefaults>',
        '—',
        'a subtree',
        'Every axis, set once; an explicit prop still wins',
      ],
    ]),
    accessibility: [
      'The field carries role="combobox" with aria-expanded="true", aria-controls naming the list and aria-autocomplete="list"; the list carries role="listbox" and each row role="option". DOM focus stays on the field for the whole interaction and the current row is named by aria-activedescendant and marked aria-selected — the WAI-ARIA combobox pattern with a listbox popup, whose note says exactly this.',
      'The layer is the dialog family’s: role="dialog", aria-modal, the page inert behind the scrim, focus contained and returned to the trigger. Its name is the label message; the field’s name is the input message, and the list borrows it.',
      'A row with a shortcut carries aria-keyshortcuts in the platform’s own words — Meta+Shift+D on a Mac, Control+Shift+D elsewhere — while the drawn keys are aria-hidden; a sequence has no syntax in the attribute and is drawn only. A disabled row is announced with aria-disabled, stays in the list, and is skipped by every movement key.',
      'The result count, the loading sentence and the failure of a rejected handler are one visually hidden role="status" row, spoken through the shared live announcer so the same sentence is never said twice in a row.',
      'Escape is three steps in a fixed order — clear the query, return one page, close — so a reader who typed does not lose the palette on the first press; the footer draws the same keys the family answers.',
      'The panel answers its own width: below 360 pixels the description and the meta go and the binding stays; inside a dialog on a narrow screen the panel takes the whole layer.',
    ],
    snippets: [
      defineSnippet({
        id: 'command-palette-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div data-ui="command-palette" data-part="root" data-presentation="dialog" data-size="md" data-open>\n  <div data-part="header">\n    <span aria-hidden="true" data-part="search" />\n    <input\n      aria-activedescendant="cp-deploy"\n      aria-autocomplete="list"\n      aria-controls="cp-list"\n      aria-expanded="true"\n      aria-label="Search commands"\n      data-part="input"\n      role="combobox"\n    />\n    <button aria-label="Clear" data-part="clear" tabIndex={-1} type="button" />\n  </div>\n  <div data-part="list" id="cp-list" role="listbox">\n    <div aria-labelledby="cp-g1" data-part="group" role="group">\n      <div data-part="group-label" id="cp-g1">\n        Actions\n      </div>\n      <div aria-selected="true" data-current data-part="item" id="cp-deploy" role="option">\n        <span data-part="icon" />\n        <span data-part="label">Deploy to production</span>\n        <span aria-hidden="true" data-part="shortcut" />\n      </div>\n    </div>\n  </div>\n  <div data-part="status" role="status">\n    9 results\n  </div>\n  <div aria-hidden="true" data-part="footer" />\n</div>;',
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
