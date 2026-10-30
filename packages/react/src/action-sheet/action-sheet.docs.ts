import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import actionSheetTokens from '@slotted/styles/action-sheet/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_ACTION_SHEET_TOKENS = actionSheetTokens.map((name) => ({
  name,
  purpose: 'Theme-owned ActionSheet decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ActionSheet, ActionSheetCancel, ActionSheetContent, ActionSheetDefaultsProvider, ActionSheetGroup, ActionSheetHeader, ActionSheetItem, ActionSheetList, ActionSheetMessage, ActionSheetSeparator, ActionSheetTitle, ActionSheetTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, inside drawer’s panel',
    required: true,
    purpose:
      'The family’s own box, data-ui="action-sheet": a grid of header, list and footer that spans every row of drawer’s panel, so the list is the one row that scrolls when the sheet reaches its cap. The layer around it is drawer with side="bottom" and size="content", which owns the portal, the scrim, the role="dialog" panel, the slide, the drag and the width — here the family’s --slotted-action-sheet-inline-size, handed to drawer’s sheet.',
  },
  {
    part: 'trigger',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'drawer’s trigger, rendered where it is written. aria-haspopup="dialog", aria-expanded and aria-controls. It is also the layer’s branch, so a press on it is not read as a press outside.',
  },
  {
    part: 'header',
    element: 'header',
    required: false,
    purpose: 'The title and the message, above a rule.',
  },
  {
    part: 'title',
    element: 'h2, or the element render returns',
    required: false,
    purpose:
      'The name of the dialog and of the list, set small: the title is the context and the actions are the content.',
  },
  {
    part: 'message',
    element: 'p, or the element render returns',
    required: false,
    purpose: 'The dialog’s description, which aria-describedby points at when it is rendered.',
  },
  {
    part: 'list',
    element: 'div with role="menu"',
    required: true,
    purpose:
      'One tab stop for every action, by roving tabindex; the arrows, Home, End and typeahead move inside it. Named by the title. The one row of the panel that scrolls.',
  },
  {
    part: 'group',
    element: 'div with role="group"',
    required: false,
    purpose: 'A run of related actions, named by its label.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The group’s visible name, set muted and semibold above its actions.',
  },
  {
    part: 'item',
    element: 'button with role="menuitem", or the element render returns',
    required: true,
    purpose:
      'One action, a control’s height tall — 44 pixels under a coarse pointer, where the theme raises it, and the density’s own height under a fine one. data-tone, data-disabled and data-loading; a disabled or loading item stays focusable and takes aria-disabled.',
  },
  {
    part: 'icon',
    element: 'span[aria-hidden]',
    required: false,
    purpose:
      'The item’s visual, or the spinner while it is loading. Its column exists only when some item of the list draws one, so labels line up either way.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose: 'The item’s words. It wraps and never truncates.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'The item’s second line, muted, which aria-describedby points at.',
  },
  {
    part: 'separator',
    element: 'hr with role="separator"',
    required: false,
    purpose: 'A rule between runs of actions. Not focusable.',
  },
  {
    part: 'footer',
    element: 'div, rendered by ActionSheetCancel',
    required: false,
    purpose:
      'The band that holds the cancel, on the sunken surface, carrying the bottom safe-area inset where a phone’s home indicator sits.',
  },
  {
    part: 'cancel',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'The explicit way out, asking to close with the reason dismiss. Never disabled. Its words default to the catalog’s cancel.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'A trigger, the actions and the way out',
    note: 'Press Partilhar: the sheet rises from the bottom edge over a scrim, focus lands on the first action, and choosing one closes it with the reason select and the action’s value.',
    snippet: defineSnippet({
      id: 'action-sheet-react-playground',
      language: 'tsx',
      label: 'The whole family',
      source: `<ActionSheet onOpenChange={(open, request) => run(request.result)}>
  <ActionSheetTrigger>Partilhar</ActionSheetTrigger>
  <ActionSheetContent>
    <ActionSheetHeader>
      <ActionSheetTitle>Share report</ActionSheetTitle>
      <ActionSheetMessage>Anyone who receives the link sees today's version.</ActionSheetMessage>
    </ActionSheetHeader>
    <ActionSheetList>
      <ActionSheetItem value="copy" icon={<Copy />}>
        Copy link
      </ActionSheetItem>
      <ActionSheetItem value="pdf" icon={<FileText />}>
        Descarregar PDF
      </ActionSheetItem>
    </ActionSheetList>
    <ActionSheetCancel>Cancelar</ActionSheetCancel>
  </ActionSheetContent>
</ActionSheet>;`,
    }),
  },
  {
    id: 'destructive',
    title: 'The destructive choice, at the top',
    note: 'tone="danger" paints the words, the mark and the highlight red, and the destructive action goes first, where it is noticed. Opened, this sheet puts focus on Cancelar rather than on the danger.',
    snippet: defineSnippet({
      id: 'action-sheet-react-destructive',
      language: 'tsx',
      label: 'One tone, and the order',
      source: `<ActionSheetList>
  <ActionSheetItem value="delete" tone="danger">
    Delete draft
  </ActionSheetItem>
  <ActionSheetItem value="save">Save draft</ActionSheetItem>
</ActionSheetList>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, a rule, a second line and an action that is not available',
    note: 'A group is named by its label, a separator draws the rule between two runs, and a disabled action keeps its place and says in its second line why it cannot run — it stays in the arrow ring and refuses the press.',
    snippet: defineSnippet({
      id: 'action-sheet-react-groups',
      language: 'tsx',
      label: 'Groups and a disabled action',
      source: `<ActionSheetList>
  <ActionSheetGroup label="Send">
    <ActionSheetItem value="remind">Remind the customer</ActionSheetItem>
    <ActionSheetItem value="accounting" disabled description="Available after approval">
      Send to accounting
    </ActionSheetItem>
  </ActionSheetGroup>
  <ActionSheetSeparator />
  <ActionSheetGroup label="Estado">
    <ActionSheetItem value="paid" tone="success">
      Marcar como paga
    </ActionSheetItem>
  </ActionSheetGroup>
</ActionSheetList>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A title of two lines, a long message, labels that wrap and a reference with no spaces: nothing truncates, the list is the one row that scrolls, and the title and the cancel stay on screen.',
    snippet: defineSnippet({
      id: 'action-sheet-react-content',
      language: 'tsx',
      label: 'Long content scrolls in the list',
      source: `<ActionSheetItem value="copy-ref">
  Copiar ENC-2026-0000088213-ATLANTICA-PT-LISBOA-NORTE
</ActionSheetItem>;`,
    }),
  },
  {
    id: 'loading',
    title: 'An action that takes time',
    note: 'Press Descarregar PDF: the ring takes the mark’s box and the label stays, so nothing moves; the item carries aria-busy, refuses a second press, and the sheet stays open until the consumer clears loading.',
    snippet: defineSnippet({
      id: 'action-sheet-react-loading',
      language: 'tsx',
      label: 'Keep the sheet open while the work runs',
      source: `<ActionSheetItem
  value="pdf"
  loading={exporting}
  onSelect={(event) => {
    event.preventDefault();
    setExporting(true);
    exportPdf().then(() => {
      setExporting(false);
      setOpen(false);
    });
  }}
>
  Descarregar PDF
</ActionSheetItem>;`,
    }),
  },
  {
    id: 'modal',
    title: 'Modal, or beside the page',
    note: 'modal is the default: the page is inert, the scroll is locked and the scrim is painted. modal={false} paints no scrim and leaves the page operable — the map behind stays live — while a press outside still closes the sheet.',
    snippet: defineSnippet({
      id: 'action-sheet-react-modal',
      language: 'tsx',
      label: 'A sheet beside the work',
      source: `<ActionSheet modal={false}>…</ActionSheet>;`,
    }),
  },
  {
    id: 'policy',
    title: 'What may close it',
    note: 'escape, outsidePress and back each take close or none, and every close is a request the consumer can cancel. Here only Cancelar closes the sheet; the line under the trigger names each request that arrived and whether it was refused.',
    snippet: defineSnippet({
      id: 'action-sheet-react-policy',
      language: 'tsx',
      label: 'Only the explicit way out',
      source: `<ActionSheet escape="none" outsidePress="none" back="none">
  …
</ActionSheet>;

<ActionSheet
  onOpenChange={(open, request) => {
    if (!open && saving) request.cancel();
  }}
>
  …
</ActionSheet>;`,
    }),
  },
  {
    id: 'focus',
    title: 'Where focus enters, and where it goes back',
    note: 'Focus enters on the first action that can run; when that action is destructive it enters on Cancelar, the least destructive one the dialog pattern asks for. On close it returns to the trigger; initialFocus and finalFocus name other elements.',
    snippet: defineSnippet({
      id: 'action-sheet-react-focus',
      language: 'tsx',
      label: 'Naming the elements',
      source: `<ActionSheet initialFocus={saveRef} finalFocus={composerRef}>
  …
</ActionSheet>;`,
    }),
  },
  {
    id: 'result',
    title: 'Which action was chosen, and why it closed',
    note: 'The close request carries reason and, when the reason is select, result — the value of the item chosen. There is no controller that returns a promise: the request already says what the promise would.',
    snippet: defineSnippet({
      id: 'action-sheet-react-result',
      language: 'tsx',
      label: 'Reading the request',
      source: `<ActionSheet
  open={open}
  onOpenChange={(next, request) => {
    setOpen(next);
    if (request.reason === 'select') archive(request.result);
  }}
>
  …
</ActionSheet>;`,
    }),
  },
  {
    id: 'responsive',
    title: 'One list of actions, a menu on a pointer and a sheet on a phone',
    note: 'The item vocabulary is menu’s, word for word — value, icon, description, tone, disabled, onSelect — so one array renders as either family, and the breakpoint that picks between them is the application’s.',
    snippet: defineSnippet({
      id: 'action-sheet-react-responsive',
      language: 'tsx',
      label: 'The same array, two families',
      source: `const coarse = useMediaQuery('(pointer: coarse)');

coarse ? (
  <ActionSheet>
    <ActionSheetTrigger>More</ActionSheetTrigger>
    <ActionSheetContent aria-label="Actions">
      <ActionSheetList aria-label="Actions">
        {actions.map((action) => (
          <ActionSheetItem key={action.value} {...action} />
        ))}
      </ActionSheetList>
      <ActionSheetCancel />
    </ActionSheetContent>
  </ActionSheet>
) : (
  <Menu>
    <MenuTrigger>More</MenuTrigger>
    <MenuContent aria-label="Actions">
      {actions.map((action) => (
        <MenuItem key={action.value} {...action} />
      ))}
    </MenuContent>
  </Menu>
);`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'ActionSheetDefaultsProvider sets modal, mount, escape, outsidePress, back and closeOnSelect for every sheet below it, and a sheet that states a value itself still wins. The cancel’s words come from the language in force (SlottedProvider).',
    snippet: defineSnippet({
      id: 'action-sheet-react-defaults',
      language: 'tsx',
      label: 'Once, at the root',
      source: `<ActionSheetDefaultsProvider closeOnSelect={false} back="close">
  <App />
</ActionSheetDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard',
    note: 'Open it and use the keys: the arrows move between actions and wrap, Home and End reach the ends, a letter moves to the next action that starts with it, Tab moves between the list and Cancelar, and Escape closes and returns focus.',
    snippet: defineSnippet({
      id: 'action-sheet-react-accessibility',
      language: 'tsx',
      label: 'Typeahead on a label that is not text',
      source: `<ActionSheetItem value="flag" textValue="Sinalizar">
  <FlagBadge /> Sinalizar
</ActionSheetItem>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ActionSheetChangeRequest)',
    when: 'Before the sheet moves, for every way it can: reason is pointer or keyboard from the trigger, pointer from a drag of the sheet that asks to close, select from an item, dismiss from the cancel, escape, outsidePress, back, or programmatic from the handle. result carries the chosen item’s value when the reason is select, and cancel() refuses the move before anything commits.',
  },
  {
    name: 'onSelect',
    payload: '(event: ActionSheetSelectEvent)',
    when: 'On ActionSheetItem, when an item that can run is activated, before the sheet asks to close. The event carries reason, value and the originating event; preventDefault() keeps the sheet open.',
  },
  {
    name: 'onClick, onKeyDown, onPointerMove, on every part',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. The consumer’s handler runs first, and preventDefault() refuses the family’s own behavior.',
  },
];

const composition = apiRows([
  [
    'render',
    '(props) => ReactNode',
    '—',
    'ActionSheetTrigger, ActionSheetContent, ActionSheetTitle, ActionSheetMessage, ActionSheetItem, ActionSheetCancel',
    'Substitutes the element. An item that navigates renders an anchor and keeps its role and keyboard; the trigger becomes the application’s own Button. The list, the groups and the separator are fixed, because their role is what they are',
  ],
  [
    'ref',
    'Ref<ActionSheetHandle> on ActionSheet, Ref<HTMLElement> on every part',
    '—',
    'ActionSheet, every part',
    'On a part it reaches the element. On the family it is a handle with open(), close() and focus() — the actions a consumer cannot express declaratively',
  ],
  [
    'container',
    'Element | null',
    '—',
    'ActionSheet',
    'A parent for this layer alone instead of the shared portal root, passed to drawer',
  ],
  [
    'useActionSheet()',
    '() => ActionSheetContextValue',
    '—',
    'inside ActionSheet',
    'What the parts read: the open state, the identifiers, the axes and close(reason, result). It throws outside a sheet',
  ],
  [
    'ActionSheetDefaultsProvider',
    '{ modal, mount, escape, outsidePress, back, closeOnSelect }',
    '—',
    'a subtree',
    'The decisions an application takes once. A sheet that states any of them itself still wins',
  ],
]);

const accessibility = [
  'No WAI-ARIA APG pattern describes an action sheet, so the layer answers Dialog (Modal) — w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — and the list answers Menu — w3.org/WAI/ARIA/apg/patterns/menubar/. The panel is role="dialog", aria-modal while modal, named by the title and described by the message; the list is role="menu", named by the same title, and every action is a native button with role="menuitem".',
  'The list is one tab stop. ArrowDown and ArrowUp move between actions and wrap, Home and End reach the ends, and a printable character moves to the next action whose label, or textValue, begins with it. Tab moves between the list and the cancel and does not close — the one departure from the menu pattern, because the menu is the content of a dialog and the dialog contains focus. A reader leaves with Escape or the cancel.',
  'A screen reader hears the title twice on entry, once for the dialog and once for the menu. Without a name the menu would be anonymous to a reader moving by widget, and the repetition is the cheaper cost.',
  'Focus enters on the first action that can run. When that action is destructive it enters on the cancel, which is the least destructive action the dialog pattern’s first note recommends; with no cancel, on the first action that is not danger. It returns to the element that held it on close, except after a press outside a non-modal sheet, where the reader was going somewhere else.',
  'A disabled or loading action keeps its place in the ring and takes aria-disabled, as the menu pattern requires; a loading one also carries aria-busy. The cancel is never disabled, because a sheet that cannot be left is a trap. Every action is a control’s height tall, which the theme raises to the 44-pixel comfortable target under a coarse pointer; on a phone the label grows from 14 to 16 pixels with it.',
  'The layer is drawer’s, so the sheet answers everything a drawer from the bottom answers: a touch on its body drags it and a release toward the edge asks to close with the reason pointer, which cancel() refuses like any other close; with the virtual keyboard open the sheet lands above the keys. Nothing of that needs a key: Escape and the cancel are the keyboard’s way out.',
  'A mouse or a pen moving over an action focuses it, so one row is lit whichever device drives; a finger does not, because focus moving under a touch that is about to scroll would light rows at random.',
];

const snippets = [
  defineSnippet({
    id: 'action-sheet-react-anatomy',
    language: 'tsx',
    label: 'Anatomy, as it reaches the DOM',
    source: `<div
  data-ui="drawer"
  data-part="root"
  data-mode="overlay"
  data-side="bottom"
  data-size="content"
  data-drag="panel"
  data-modal
  data-open
>
  <div data-part="backdrop" />
  <div
    data-part="panel"
    role="dialog"
    tabIndex={-1}
    aria-modal="true"
    aria-labelledby="s-t"
    aria-describedby="s-m"
    style={{
      '--slotted-drawer-sheet-inline-size': 'var(--slotted-action-sheet-inline-size, 32rem)',
    }}
  >
    <div data-ui="action-sheet" data-part="root">
      <header data-part="header">
        <h2 data-part="title" id="s-t">
          Share report
        </h2>
        <p data-part="message" id="s-m">
          Anyone who receives the link sees today's version.
        </p>
      </header>
      <div data-part="list" role="menu" aria-labelledby="s-t">
        <button data-part="item" role="menuitem" tabIndex={0}>
          <span data-part="icon" aria-hidden="true">
            …
          </span>
          <span data-part="label">Copy link</span>
        </button>
      </div>
      <div data-part="footer">
        <button data-part="cancel" type="button">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</div>;`,
  }),
  defineSnippet({
    id: 'action-sheet-theming',
    language: 'css',
    label: 'Retuning the family for an application',
    source: `/* The measure is read by drawer's panel, which is the root's parent, so it is
   written where both see it: the theme. */
:root {
  --slotted-action-sheet-inline-size: 28rem;
}

[data-ui='action-sheet'] {
  --slotted-action-sheet-footer-surface: transparent;
  --slotted-action-sheet-highlight: var(--slotted-tone-accent-subtle-hover);
}

/* The sheet's corner, surface and scrim are drawer's. */
[data-ui='drawer'] {
  --slotted-drawer-radius: 12px;
}`,
  }),
];

export const REACT_ACTION_SHEET_DOCS = {
  'action-sheet': {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'open',
        'boolean',
        '—',
        'ActionSheet',
        'Present at all means the consumer owns the state, for the life of the component. The family then asks and waits',
      ],
      [
        'defaultOpen',
        'boolean',
        '—',
        'ActionSheet',
        'The value an uncontrolled sheet starts from, read once',
      ],
      [
        'modal',
        'boolean',
        'true',
        'ActionSheet, ActionSheetDefaultsProvider',
        'Whether the page is inert, the scroll locked, focus contained and the scrim painted. false keeps the page operable and paints no scrim',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager'",
        'active',
        'ActionSheet, ActionSheetDefaultsProvider',
        'When the layer exists. active drops it once the exit is over, lazy builds it on the first open and keeps it, eager builds it up front and makes it inert',
      ],
      [
        'escape',
        "'close' | 'none'",
        'close',
        'ActionSheet, ActionSheetDefaultsProvider',
        'Whether Escape asks to close. It reaches the topmost layer only',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'ActionSheet, ActionSheetDefaultsProvider',
        'Whether a press outside the panel — on the scrim, or on the page behind a non-modal sheet — asks to close',
      ],
      [
        'back',
        "'close' | 'none'",
        'close',
        'ActionSheet, ActionSheetDefaultsProvider',
        'The platform’s way back — a phone’s gesture, a browser’s button — closes the sheet instead of leaving the page, while it is modal',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'ActionSheet, ActionSheetDefaultsProvider',
        'Whether choosing an action closes the sheet with the reason select',
      ],
      [
        'messages',
        'Partial<ActionSheetMessages>',
        '—',
        'ActionSheet',
        'Words laid over the language in force, key by key: the cancel’s words when it is given no children (cancel)',
      ],
      [
        'initialFocus',
        'RefObject<HTMLElement> | false',
        '—',
        'ActionSheet',
        'Where focus goes on opening. Unstated, the first action that can run, or the least destructive one when that action is danger. false moves nothing',
      ],
      [
        'finalFocus',
        'RefObject<HTMLElement> | false',
        '—',
        'ActionSheet',
        'Where focus goes on closing. Unstated, the element that held it on opening',
      ],
      [
        'value',
        'string',
        '—',
        'ActionSheetItem',
        'What the close request carries as result when this action is chosen',
      ],
      [
        'textValue',
        'string',
        '—',
        'ActionSheetItem',
        'What typeahead matches when the label is not plain text',
      ],
      [
        'icon',
        'ReactNode',
        '—',
        'ActionSheetItem',
        'The action’s visual, drawn in the mark column',
      ],
      [
        'description',
        'ReactNode',
        '—',
        'ActionSheetItem',
        'The second line, which aria-describedby points at',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        '—',
        'ActionSheetItem',
        'Paints the words, the mark and the highlight. danger is the destructive action',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'ActionSheetItem',
        'The action cannot run. It stays focusable and takes aria-disabled',
      ],
      [
        'loading',
        'boolean',
        'false',
        'ActionSheetItem',
        'The action is running: the ring takes the mark’s box, aria-busy is written, a second press is refused and the sheet stays open',
      ],
      [
        'closeOnSelect',
        'boolean',
        '—',
        'ActionSheetItem',
        'Overrides the sheet’s closeOnSelect for this action',
      ],
      [
        'label',
        'ReactNode',
        '—',
        'ActionSheetGroup',
        'Rendered as the group-label part, and the group’s accessible name',
      ],
    ]),
    composition,
    accessibility,
    snippets,
  },
} as const;
