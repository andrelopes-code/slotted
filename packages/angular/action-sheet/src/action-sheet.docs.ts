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

export const ANGULAR_ACTION_SHEET_TOKENS = actionSheetTokens.map((name) => ({
  name,
  purpose: 'Theme-owned ActionSheet decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SL_ACTION_SHEET, provideActionSheetDefaults } from '@slotted/angular/action-sheet';",
  selector: '<sl-action-sheet>, exportAs slActionSheet',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div inside <sl-drawer>’s panel',
    required: true,
    purpose:
      'The family’s own box, data-ui="action-sheet": a grid of header, list and footer that spans every row of drawer’s panel, so the list is the one row that scrolls when the sheet reaches its cap. The layer around it is <sl-drawer> with side="bottom" and size="content", which owns the portal, the scrim, the role="dialog" panel, the slide, the drag and the width — here the family’s --slotted-action-sheet-inline-size, handed to the drawer’s sheet through its panel.',
  },
  {
    part: 'trigger',
    element: 'the consumer’s own button with [slActionSheetTrigger]',
    required: false,
    purpose:
      'The control that opens the sheet, rendered where it is written. aria-haspopup="dialog", aria-expanded and aria-controls. The sheet hands it to the drawer as the layer’s branch, so a press on it is not read as a press outside.',
  },
  {
    part: 'header',
    element: 'header[slActionSheetHeader]',
    required: false,
    purpose: 'The title and the message, above a rule.',
  },
  {
    part: 'title',
    element: 'h2[slActionSheetTitle]',
    required: false,
    purpose:
      'The name of the dialog and of the list, set small: the title is the context and the actions are the content.',
  },
  {
    part: 'message',
    element: 'p[slActionSheetMessage]',
    required: false,
    purpose: 'The dialog’s description, which aria-describedby points at when it is rendered.',
  },
  {
    part: 'list',
    element: 'div[slActionSheetList], role="menu"',
    required: true,
    purpose:
      'One tab stop for every action, by roving tabindex; the arrows, Home, End and typeahead move inside it. Named by the title. The one row of the panel that scrolls.',
  },
  {
    part: 'group',
    element: 'div[slActionSheetGroup], role="group"',
    required: false,
    purpose: 'A run of related actions, named by its label.',
  },
  {
    part: 'group-label',
    element: 'div[slActionSheetGroupLabel]',
    required: false,
    purpose:
      'The group’s visible name, set muted and semibold above its actions; the group reads its id.',
  },
  {
    part: 'item',
    element: 'button[slActionSheetItem] or a[slActionSheetItem], role="menuitem"',
    required: true,
    purpose:
      'One action, a control’s height tall — 44 pixels under a coarse pointer, where the theme raises it, and the density’s own height under a fine one. data-tone, data-disabled and data-loading; a disabled or loading item stays focusable and takes aria-disabled.',
  },
  {
    part: 'icon',
    element: 'span[slActionSheetItemIcon], aria-hidden',
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
    element: 'span[slActionSheetItemDescription]',
    required: false,
    purpose: 'The item’s second line, muted, which aria-describedby points at.',
  },
  {
    part: 'separator',
    element: 'hr[slActionSheetSeparator]',
    required: false,
    purpose: 'A rule between runs of actions. Not focusable.',
  },
  {
    part: 'footer',
    element: 'div[slActionSheetFooter]',
    required: false,
    purpose:
      'The band that holds the cancel, on the sunken surface, carrying the bottom safe-area inset where a phone’s home indicator sits.',
  },
  {
    part: 'cancel',
    element: 'button[slActionSheetCancel]',
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
      id: 'action-sheet-angular-playground',
      language: 'angular',
      label: 'The whole family',
      source: `<button slButton [slActionSheetTrigger]="sheet">Partilhar</button>
<sl-action-sheet #sheet="slActionSheet" (openChangeRequest)="run($event.result)">
  <header slActionSheetHeader>
    <h2 slActionSheetTitle>Share report</h2>
    <p slActionSheetMessage>Anyone who receives the link sees today's version.</p>
  </header>
  <div slActionSheetList>
    <button slActionSheetItem value="copy">Copy link</button>
    <button slActionSheetItem value="pdf">Download PDF</button>
  </div>
  <div slActionSheetFooter><button slActionSheetCancel>Cancelar</button></div>
</sl-action-sheet>`,
    }),
  },
  {
    id: 'destructive',
    title: 'The destructive choice, at the top',
    note: 'tone="danger" paints the words, the mark and the highlight red, and the destructive action goes first, where it is noticed. Opened, this sheet puts focus on Cancelar rather than on the danger.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-destructive',
      language: 'angular',
      label: 'One tone, and the order',
      source: `<div slActionSheetList>
  <button slActionSheetItem value="delete" tone="danger">Delete draft</button>
  <button slActionSheetItem value="save">Save draft</button>
</div>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, a rule, a second line and an action that is not available',
    note: 'A group is named by its label, a separator draws the rule between two runs, and a disabled action keeps its place and says in its second line why it cannot run — it stays in the arrow ring and refuses the press.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-groups',
      language: 'angular',
      label: 'Groups and a disabled action',
      source: `<div slActionSheetGroup>
  <div slActionSheetGroupLabel>Send</div>
  <button slActionSheetItem value="remind">Remind the customer</button>
  <button slActionSheetItem value="accounting" disabled>
    Send to accounting
    <span slActionSheetItemDescription>Available after approval</span>
  </button>
</div>
<hr slActionSheetSeparator />`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A title of two lines, a long message, labels that wrap and a reference with no spaces: nothing truncates, the list is the one row that scrolls, and the title and the cancel stay on screen.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-content',
      language: 'angular',
      label: 'Long content scrolls in the list',
      source: `<button slActionSheetItem value="copy-ref">
  Copiar ENC-2026-0000088213-ATLANTICA-PT-LISBOA-NORTE
</button>`,
    }),
  },
  {
    id: 'loading',
    title: 'An action that takes time',
    note: 'Press Descarregar PDF: the ring takes the mark’s box and the label stays, so nothing moves; the item carries aria-busy, refuses a second press, and the sheet stays open until the consumer clears loading.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-loading',
      language: 'angular',
      label: 'Keep the sheet open while the work runs',
      source: `<button
  slActionSheetItem
  value="pdf"
  [closeOnSelect]="false"
  [loading]="exporting()"
  (select)="exportPdf()"
>
  Descarregar PDF
</button>`,
    }),
  },
  {
    id: 'modal',
    title: 'Modal, or beside the page',
    note: 'modal is the default: the page is inert, the scroll is locked and the scrim is painted. [modal]="false" paints no scrim and leaves the page operable — the map behind stays live — while a press outside still closes the sheet.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-modal',
      language: 'angular',
      label: 'A sheet beside the work',
      source: `<sl-action-sheet [modal]="false">…</sl-action-sheet>`,
    }),
  },
  {
    id: 'policy',
    title: 'What may close it',
    note: 'escape, outsidePress and back each take close or none, and every close is a request the consumer can cancel. Here only Cancelar closes the sheet; the line under the trigger names each request that arrived.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-policy',
      language: 'angular',
      label: 'Only the explicit way out',
      source: `<sl-action-sheet
  escape="none"
  outsidePress="none"
  back="none"
  (openChangeRequest)="saving() && !$event.value && $event.cancel()"
>
  …
</sl-action-sheet>`,
    }),
  },
  {
    id: 'focus',
    title: 'Where focus enters, and where it goes back',
    note: 'Focus enters on the first action that can run; when that action is destructive it enters on Cancelar, the least destructive one the dialog pattern asks for. On close it returns to the trigger; initialFocus and finalFocus name other elements.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-focus',
      language: 'angular',
      label: 'Naming the elements',
      source: `<sl-action-sheet [finalFocus]="composer">…</sl-action-sheet>`,
    }),
  },
  {
    id: 'result',
    title: 'Which action was chosen, and why it closed',
    note: 'The request carries reason and, when the reason is select, result — the value of the item chosen; (closed) repeats the result once the sheet has left. There is no service that returns a promise.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-result',
      language: 'angular',
      label: 'Reading the request',
      source: `<sl-action-sheet
  [(open)]="open"
  (openChangeRequest)="$event.reason === 'select' && archive($event.result)"
>
  …
</sl-action-sheet>`,
    }),
  },
  {
    id: 'responsive',
    title: 'One list of actions, a menu on a pointer and a sheet on a phone',
    note: 'The item vocabulary is menu’s, word for word — value, tone, disabled, (select) and the description line — so one array renders as either family, and the breakpoint that picks between them is the application’s.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-responsive',
      language: 'angular',
      label: 'The same array, two families',
      source: `@if (coarse()) {
  <sl-action-sheet #sheet="slActionSheet" aria-label="Actions">
    <div slActionSheetList aria-label="Actions">
      @for (action of actions; track action.value) {
        <button slActionSheetItem [value]="action.value" [tone]="action.tone">
          {{ action.label }}
        </button>
      }
    </div>
  </sl-action-sheet>
} @else {
  <sl-menu #menu>
    @for (action of actions; track action.value) {
      <button slMenuItem [tone]="action.tone">{{ action.label }}</button>
    }
  </sl-menu>
}`,
    }),
  },
  {
    id: 'defaults',
    title: 'Decided once for the application',
    note: 'provideActionSheetDefaults() sets modal, mount, escape, outsidePress, back and closeOnSelect for every sheet it reaches, and a sheet that states a value itself still wins. The cancel’s words come from the language in force (provideSlotted).',
    snippet: defineSnippet({
      id: 'action-sheet-angular-defaults',
      language: 'angular',
      label: 'Once, in the providers',
      source: `<!-- bootstrapApplication(App, { providers: [provideActionSheetDefaults({ closeOnSelect: false })] }) -->
<div slActionSheetFooter><button slActionSheetCancel></button></div>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'The keyboard',
    note: 'Open it and use the keys: the arrows move between actions and wrap, Home and End reach the ends, a letter moves to the next action that starts with it, Tab moves between the list and Cancelar, and Escape closes and returns focus.',
    snippet: defineSnippet({
      id: 'action-sheet-angular-accessibility',
      language: 'angular',
      label: 'Typeahead on a label that is not text',
      source: `<button slActionSheetItem value="flag" textValue="Sinalizar">
  <span slActionSheetItemIcon><ng-icon name="lucideFlag" /></span>
  Sinalizar
</button>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChangeRequest',
    payload: 'ActionSheetChangeRequest',
    when: 'Before the sheet moves, for every way it can: reason is pointer or keyboard from the trigger, pointer from a drag of the sheet that asks to close, select from an item, dismiss from the cancel, escape, outsidePress, back, or programmatic from show() and close(). result carries the chosen item’s value when the reason is select, and cancel() refuses the move.',
  },
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'The model half of [(open)], once a request was not refused.',
  },
  {
    name: 'closed',
    payload: 'string | undefined',
    when: 'Once the sheet has closed, with the value of the item chosen, or undefined for any other reason. It is not emitted by a sheet destroyed while open.',
  },
  {
    name: 'select',
    payload: 'ActionSheetSelectEvent',
    when: 'On slActionSheetItem, when an action that can run is activated, before the sheet asks to close. preventDefault() keeps the sheet open.',
  },
];

const composition = apiRows([
  [
    'slActionSheetTrigger',
    'SlActionSheet',
    '—',
    'the consumer’s button',
    'The wiring on the application’s own control: <button slButton [slActionSheetTrigger]="sheet">. A handler of the consumer’s that calls preventDefault() refuses the open',
  ],
  [
    'exportAs',
    'slActionSheet',
    '—',
    'sl-action-sheet',
    'The instance, with show(), close() and focus() — the actions a template cannot express declaratively',
  ],
  [
    'a[slActionSheetItem]',
    'anchor',
    '—',
    'slActionSheetItem',
    'An action that navigates is an anchor and keeps its role and keyboard',
  ],
  [
    'SL_ACTION_SHEET',
    'readonly Type[]',
    '—',
    'a standalone component’s imports',
    'Every part at once',
  ],
  [
    'provideActionSheetDefaults()',
    '{ modal, mount, escape, outsidePress, back, closeOnSelect }',
    '—',
    'an injector',
    'The decisions an application takes once. A sheet that states any of them itself still wins',
  ],
  [
    'aria-label',
    'string',
    '—',
    'sl-action-sheet',
    'Read from the host before the bindings are written and moved to the panel, which carries the role — for a sheet with no title',
  ],
]);

const accessibility = [
  'No WAI-ARIA APG pattern describes an action sheet, so the layer answers Dialog (Modal) — w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — and the list answers Menu — w3.org/WAI/ARIA/apg/patterns/menubar/. The panel is role="dialog", aria-modal while modal, named by the title and described by the message; the list is role="menu", named by the same title, and every action is a native button with role="menuitem".',
  'The list is one tab stop. ArrowDown and ArrowUp move between actions and wrap, Home and End reach the ends, and a printable character moves to the next action whose label, or textValue, begins with it. Tab moves between the list and the cancel and does not close — the one departure from the menu pattern, because the menu is the content of a dialog and the dialog contains focus. A reader leaves with Escape or the cancel.',
  'A screen reader hears the title twice on entry, once for the dialog and once for the menu. Without a name the menu would be anonymous to a reader moving by widget, and the repetition is the cheaper cost.',
  'Focus enters on the first action that can run. When that action is destructive it enters on the cancel, which is the least destructive action the dialog pattern’s first note recommends; with no cancel, on the first action that is not danger. It returns to the element that held it on close, except after a press outside a non-modal sheet, where the reader was going somewhere else.',
  'A disabled or loading action keeps its place in the ring and takes aria-disabled, as the menu pattern requires; a loading one also carries aria-busy. The cancel is never disabled, because a sheet that cannot be left is a trap. Every action is a control’s height tall, which the theme raises to the 44-pixel comfortable target under a coarse pointer; on a phone the label grows from 14 to 16 pixels with it.',
  'The layer is <sl-drawer>, so the sheet answers everything a drawer from the bottom answers: a touch on its body drags it and a release toward the edge asks to close with the reason pointer, which cancel() refuses like any other close; with the virtual keyboard open the sheet lands above the keys. Nothing of that needs a key: Escape and the cancel are the keyboard’s way out.',
  'A mouse or a pen moving over an action focuses it, so one row is lit whichever device drives; a finger does not, because focus moving under a touch that is about to scroll would light rows at random.',
];

const snippets = [
  defineSnippet({
    id: 'action-sheet-angular-anatomy',
    language: 'angular',
    label: 'Anatomy, as it reaches the DOM',
    source: `<div data-ui="drawer" data-part="root" data-side="bottom" data-size="content" data-modal data-open>
  <div data-part="backdrop"></div>
  <div
    data-part="panel"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="s-t"
    style="--slotted-drawer-sheet-inline-size: var(--slotted-action-sheet-inline-size, 32rem)"
  >
    <div data-ui="action-sheet" data-part="root">
      <header data-part="header">
        <h2 data-part="title" id="s-t">Share report</h2>
      </header>
      <div data-part="list" role="menu" aria-labelledby="s-t">
        <button data-part="item" role="menuitem" tabindex="0">
          <span data-part="label">Copy link</span>
        </button>
      </div>
      <div data-part="footer"><button data-part="cancel" type="button">Cancelar</button></div>
    </div>
  </div>
</div>`,
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

export const ANGULAR_ACTION_SHEET_DOCS = {
  'action-sheet': {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'open',
        'model<boolean>',
        'false',
        'sl-action-sheet',
        'Whether the sheet is open. Two-way with [(open)]; the family asks through openChangeRequest before it moves',
      ],
      [
        'modal',
        'boolean',
        'true',
        'sl-action-sheet, provideActionSheetDefaults',
        'Whether the page is inert, the scroll locked, focus contained and the scrim painted. false keeps the page operable and paints no scrim',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager'",
        'active',
        'sl-action-sheet, provideActionSheetDefaults',
        'When the layer exists. active drops it once the exit is over, lazy builds it on the first open and keeps it, eager builds it up front and makes it inert',
      ],
      [
        'escape',
        "'close' | 'none'",
        'close',
        'sl-action-sheet, provideActionSheetDefaults',
        'Whether Escape asks to close. It reaches the topmost layer only',
      ],
      [
        'outsidePress',
        "'close' | 'none'",
        'close',
        'sl-action-sheet, provideActionSheetDefaults',
        'Whether a press outside the panel asks to close',
      ],
      [
        'back',
        "'close' | 'none'",
        'close',
        'sl-action-sheet, provideActionSheetDefaults',
        'The platform’s way back closes the sheet instead of leaving the page, while it is modal',
      ],
      [
        'closeOnSelect',
        'boolean',
        'true',
        'sl-action-sheet, provideActionSheetDefaults',
        'Whether choosing an action closes the sheet with the reason select',
      ],
      [
        'messages',
        'Partial<ActionSheetMessages>',
        '—',
        'sl-action-sheet',
        'Words laid over the language in force, key by key: the cancel’s words when it is given no content (cancel)',
      ],
      [
        'initialFocus',
        'HTMLElement | false',
        '—',
        'sl-action-sheet',
        'Where focus goes on opening. Unstated, the first action that can run, or the least destructive one when that action is danger. false moves nothing',
      ],
      [
        'finalFocus',
        'HTMLElement | false',
        '—',
        'sl-action-sheet',
        'Where focus goes on closing. Unstated, the element that held it on opening',
      ],
      [
        'container',
        'Element | null',
        '—',
        'sl-action-sheet',
        'A parent for this layer alone instead of the shared portal root',
      ],
      [
        'value',
        'string',
        '—',
        'slActionSheetItem',
        'What the close request carries as result when this action is chosen',
      ],
      [
        'textValue',
        'string',
        '—',
        'slActionSheetItem',
        'What typeahead matches when the label is not plain text',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        '—',
        'slActionSheetItem',
        'Paints the words, the mark and the highlight. danger is the destructive action',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slActionSheetItem',
        'The action cannot run. It stays focusable and takes aria-disabled; the native attribute is removed so the item stays in the ring',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slActionSheetItem',
        'The action is running: the ring takes the mark’s box, aria-busy is written, a second press is refused and the sheet stays open',
      ],
      [
        'closeOnSelect',
        'boolean',
        '—',
        'slActionSheetItem',
        'Overrides the sheet’s closeOnSelect for this action',
      ],
    ]),
    composition,
    accessibility,
    snippets,
  },
} as const;
