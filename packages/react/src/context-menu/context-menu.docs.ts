import contextMenuTokens from '@slotted/styles/context-menu/tokens.json';
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

export const REACT_CONTEXT_MENU_TOKENS = contextMenuTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Context menu decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ContextMenu, ContextMenuTrigger, ContextMenuDefaultsProvider } from '@slotted/react';\nimport { MenuContent, MenuItem, MenuSeparator } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The target: the region the menu opens on. It carries data-ui="context-menu", data-open while the menu shows, data-pressed during a long press and data-disabled while the browser\'s menu is the one that opens. The menu is the menu family unchanged — data-ui="menu".',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The menu hangs from the tile because it opened from script; right-click anywhere on the tile and it moves to the point. The controls under the canvas change the long press and disable the family, which hands the click to the browser.',
    snippet: defineSnippet({
      id: 'context-menu-react-playground',
      language: 'tsx',
      label: 'A target and the menu it opens',
      source: `<ContextMenu>
  <ContextMenuTrigger className="tile">…</ContextMenuTrigger>
  <MenuContent aria-label="Document actions">
    <MenuItem>Open</MenuItem>
    <MenuItem tone="danger">Move to trash</MenuItem>
  </MenuContent>
</ContextMenu>;`,
    }),
  },
  {
    id: 'target',
    title: 'The target',
    note: 'The tile is the target and paints nothing at rest; while the menu shows, an inward one-pixel mark laid over the tile says which one the commands act on, following the tile\u2019s own corner. The tile on the right was opened from script, so the menu hangs from it the way a keyboard opening places it. A target wrapped around a card would frame the card\u2019s round corners with a square: make the card the target.',
    snippet: defineSnippet({
      id: 'context-menu-react-target',
      language: 'tsx',
      label: 'The region is the root; the menu is menu’s',
      source: `<ContextMenu defaultOpen>
  <ContextMenuTrigger className="tile" tabIndex={0}>
    …
  </ContextMenuTrigger>
  <MenuContent>…</MenuContent>
</ContextMenu>;`,
    }),
  },
  {
    id: 'rows',
    title: 'One menu for many rows',
    note: 'A list of files with one ContextMenu around all of them. Right-click any row: the request carries the event, the handler reads the row from it, and the menu names the file it acts on. Mounting a menu per row is the shape this composition exists to avoid.',
    snippet: defineSnippet({
      id: 'context-menu-react-rows',
      language: 'tsx',
      label: 'The request carries the event, and the event names the row',
      source: `const [file, setFile] = useState<string | null>(null);

<ContextMenu
  onOpenChange={(open, request) => {
    if (!open) return;
    const row = (request.source as Event).target as HTMLElement;
    setFile(row.closest('[data-file]')?.getAttribute('data-file') ?? null);
  }}
>
  <ContextMenuTrigger render={(props) => <ul {...props} />}>
    {files.map((name) => (
      <li key={name} data-file={name}>
        {name}
      </li>
    ))}
  </ContextMenuTrigger>
  <MenuContent aria-label={file ?? 'File actions'}>…</MenuContent>
</ContextMenu>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'From the keyboard',
    note: 'Tab to the tile — it is focusable because the page said so, with tabIndex — and press Shift+F10 or the Menu key. The menu hangs from the tile rather than from wherever the pointer last was, focus lands on the first item, and Escape brings it back to the tile.',
    snippet: defineSnippet({
      id: 'context-menu-react-keyboard',
      language: 'tsx',
      label: 'A focusable target opens from the keyboard',
      source: `<ContextMenu>
  <ContextMenuTrigger tabIndex={0} aria-label="Release notes 4.2">
    …
  </ContextMenuTrigger>
  <MenuContent>…</MenuContent>
</ContextMenu>;`,
    }),
  },
  {
    id: 'touch',
    title: 'On touch',
    note: "There is no secondary button on a touch screen: holding the tile for half a second opens the menu at the finger, while text selection and the platform's callout are held off for the duration of the press. Lifting or moving past ten pixels before then cancels it, so a scroll that starts on the tile is still a scroll.",
    snippet: defineSnippet({
      id: 'context-menu-react-touch',
      language: 'tsx',
      label: 'The long press, and its delay set once',
      source: `<ContextMenuDefaultsProvider longPressDelay={400}>
  <ContextMenu>
    <ContextMenuTrigger>…</ContextMenuTrigger>
    <MenuContent>…</MenuContent>
  </ContextMenu>
</ContextMenuDefaultsProvider>;`,
    }),
  },
  {
    id: 'other-path',
    title: 'The other path',
    note: 'A context menu is found by convention, and a reader who never right-clicks must still reach every command in it: the same actions sit behind the Actions button on the tile, as a menu opened the ordinary way. The two surfaces are one MenuContent rendered twice.',
    snippet: defineSnippet({
      id: 'context-menu-react-other-path',
      language: 'tsx',
      label: 'Every command exists by another path',
      source: `const actions = (
  <MenuContent aria-label="Document actions">
    <MenuItem>Open</MenuItem>
    <MenuItem>Rename</MenuItem>
  </MenuContent>
);

<ContextMenu>
  <ContextMenuTrigger className="tile">
    <Menu>
      <MenuTrigger
        render={(props) => (
          <Button {...props} variant="ghost">
            Actions
          </Button>
        )}
      />
      {actions}
    </Menu>
  </ContextMenuTrigger>
  {actions}
</ContextMenu>;`,
    }),
  },
  {
    id: 'disabled',
    title: 'Disabled',
    note: "A disabled family suppresses nothing: the browser's own menu opens on the secondary click, because taking both away would leave the reader with none. The target says so with data-disabled and paints nothing, since the content it wraps still works.",
    snippet: defineSnippet({
      id: 'context-menu-react-disabled',
      language: 'tsx',
      label: 'The browser’s menu passes through',
      source: `<ContextMenu disabled>
  <ContextMenuTrigger>…</ContextMenuTrigger>
  <MenuContent>…</MenuContent>
</ContextMenu>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Three tiles: at rest nothing is painted; open draws the inward mark in the color that separates two surfaces; disabled paints nothing either; pressed exists only for the half second a finger is held, and turns off selection rather than painting.',
    snippet: defineSnippet({
      id: 'context-menu-states',
      language: 'css',
      label: 'What a consumer may style',
      source: `[data-ui='context-menu'][data-open] {
  --slotted-context-menu-mark-color: var(--slotted-tone-accent-border);
}
[data-ui='context-menu'][data-pressed] {
  opacity: 0.9;
}`,
    }),
  },
];

const api = apiRows([
  [
    'open',
    'boolean | undefined',
    '—',
    'ContextMenu',
    'Whether the menu shows. Present at all puts the menu in controlled mode: it asks and waits.',
  ],
  [
    'defaultOpen',
    'boolean',
    '—',
    'ContextMenu',
    'The value an uncontrolled menu starts from, read once. A menu open from the start hangs from the target.',
  ],
  [
    'onOpenChange',
    '(open, request) => void',
    '—',
    'ContextMenu',
    'Asked before the menu opens or closes, with the reason and the originating event, and refusable.',
  ],
  [
    'longPress',
    'boolean',
    'true',
    'ContextMenu',
    'Whether holding the target on touch and pen opens the menu.',
  ],
  [
    'longPressDelay',
    'number',
    '500',
    'ContextMenu',
    'Milliseconds the press is held before the menu opens; movement past ten pixels or lifting first cancels it.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'ContextMenu',
    "The family never opens and the browser's own menu passes through. The target carries data-disabled.",
  ],
  [
    'size, side, align, closeOnSelect, loop, typeahead, …',
    'MenuProps',
    '—',
    'ContextMenu',
    'Every prop of Menu except anchor and finalFocus, which the family decides, reaches the menu it renders.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'ContextMenuTrigger',
    "Renders the consumer's own element as the target — a tr, a li — with the identity, the state and the listeners on it.",
  ],
]);

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: MenuChangeRequest)',
    when: 'Before the menu opens or closes. The request carries pointer (a secondary click or a long press), keyboard (Shift+F10, the Menu key), escape, outsidePress (a press anywhere else, the target included), select, dismiss or programmatic, the originating event, and cancel(). Moving to a new point while open emits nothing, because open did not change.',
  },
];

const composition = apiRows([
  [
    'ContextMenuDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets longPress, longPressDelay and disabled once for a subtree. A menu that states one itself still wins. The surface reads MenuDefaultsProvider.',
  ],
  [
    'MenuContent, MenuItem, …',
    'components',
    '—',
    'Inside a ContextMenu',
    'The surface is the menu family unchanged: submenus, checkbox and radio items, groups, shortcuts, typeahead and tone reach the context menu without a second API. Nothing is re-exported.',
  ],
  [
    'ref',
    'prop',
    '—',
    'ContextMenu',
    'A MenuHandle carrying open(), close() and focus(). open() hangs the menu from the target.',
  ],
  [
    'aria-label',
    'attribute',
    '—',
    'MenuContent',
    "The surface is named after the target's text unless given one — right for a row, wrong for a canvas.",
  ],
  [
    'native props',
    'attributes',
    '—',
    'ContextMenuTrigger',
    "Anything a div takes reaches the target, and a consumer's own onContextMenu or onPointerDown runs before the family's; preventDefault from it stops the family.",
  ],
]);

const accessibility = [
  'The platform supplies the gesture: the contextmenu event is the secondary click, the Menu key and Shift+F10 on every desktop, and the family answers all three with preventDefault while it is enabled and with nothing while it is disabled, so a reader is never left with no menu at all.',
  'The family writes no aria-haspopup on the target — it is not permitted on a generic element, and no surveyed library writes it — so a screen reader is not told the region has a menu. That is why every command in a context menu also exists by another path, and the reference page shows the path.',
  'Focus goes to the first item on open and, on Escape or after a command, back to whatever held it when the menu opened — the checkbox in the row, the tile itself — rather than to a trigger that never had it. A press elsewhere leaves focus where the reader put it.',
  'The family writes no tabindex: a target the page made focusable can be opened from the keyboard, and one it did not cannot. A tab stop on every wrapped region would be one a grid with roving focus cannot afford.',
];

const code = defineSnippet({
  id: 'context-menu-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<>
  <div data-ui="context-menu" data-part="root" id="menu-1-trigger" tabindex="0" data-open>
    Q3 board deck.pdf
  </div>
  <div data-ui="menu" data-part="root" data-side="bottom" data-align="start" data-open>
    <div data-part="content" role="menu" aria-labelledby="menu-1-trigger" tabindex="-1">
      <button data-part="item" role="menuitem" type="button">
        <span data-part="label">Open</span>
      </button>
    </div>
  </div>
</>;`,
});

const theming = defineSnippet({
  id: 'context-menu-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='context-menu'] {
  --slotted-context-menu-mark-width: var(--slotted-border-width-thick);
  --slotted-context-menu-mark-color: var(--slotted-tone-accent-border);
}`,
});

export const REACT_CONTEXT_MENU_DOCS = {
  contextMenu: {
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
