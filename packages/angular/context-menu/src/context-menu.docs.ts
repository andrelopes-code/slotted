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

export const ANGULAR_CONTEXT_MENU_TOKENS = contextMenuTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Context menu decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlContextMenuTrigger, provideContextMenuDefaults } from '@slotted/angular/context-menu';\nimport { SlMenu, SlMenuItem, SlMenuSeparator } from '@slotted/angular/menu';",
  selector: '[slContextMenuTriggerFor]',
  exportAs: 'slContextMenuTrigger',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: "the consumer's own element — a div, a tr, a card",
    required: true,
    purpose:
      'The target: the region the menu opens on. It carries data-ui="context-menu", data-open while the menu shows, data-pressed during a long press and data-disabled while the browser\'s menu is the one that opens. The menu is the menu family unchanged — data-ui="menu".',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The menu hangs from the tile because it opened from a bound [open]; right-click anywhere on the tile and it moves to the point. The controls under the canvas change the long press and disable the family, which hands the click to the browser.',
    snippet: defineSnippet({
      id: 'context-menu-angular-playground',
      language: 'angular',
      label: 'A target and the menu it opens',
      source: `<div class="tile" [slContextMenuTriggerFor]="actions">…</div>
<sl-menu #actions aria-label="Document actions">
  <button slMenuItem>Open</button>
  <button slMenuItem tone="danger">Move to trash</button>
</sl-menu>`,
    }),
  },
  {
    id: 'target',
    title: 'The target',
    note: 'The tile is the target and paints nothing at rest; while the menu shows, an inward one-pixel mark laid over the tile says which one the commands act on, following the tile\u2019s own corner. The tile on the right was opened from a bound [open], so the menu hangs from it the way a keyboard opening places it. A target wrapped around a card would frame the card\u2019s round corners with a square: make the card the target.',
    snippet: defineSnippet({
      id: 'context-menu-angular-target',
      language: 'angular',
      label: 'The region is the root; the menu is menu’s',
      source: `<div class="tile" [slContextMenuTriggerFor]="actions" tabindex="0">…</div>
<sl-menu #actions [open]="true">…</sl-menu>`,
    }),
  },
  {
    id: 'rows',
    title: 'One menu for many rows',
    note: 'A list of files with one slContextMenuTriggerFor around all of them. Right-click any row: the request carries the event, the handler reads the row from it, and the menu names the file it acts on. Mounting a menu per row is the shape this composition exists to avoid.',
    snippet: defineSnippet({
      id: 'context-menu-angular-rows',
      language: 'angular',
      label: 'The request carries the event, and the event names the row',
      source: `<ul [slContextMenuTriggerFor]="actions">
  @for (name of files; track name) {
    <li [attr.data-file]="name">{{ name }}</li>
  }
</ul>
<sl-menu
  #actions
  [attr.aria-label]="file() ?? 'File actions'"
  (openChangeRequest)="remember($event)"
>
  …
</sl-menu>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'From the keyboard',
    note: 'Tab to the tile — it is focusable because the page said so, with tabindex — and press Shift+F10 or the Menu key. The menu hangs from the tile rather than from wherever the pointer last was, focus lands on the first item, and Escape brings it back to the tile.',
    snippet: defineSnippet({
      id: 'context-menu-angular-keyboard',
      language: 'angular',
      label: 'A focusable target opens from the keyboard',
      source: `<div [slContextMenuTriggerFor]="actions" tabindex="0" aria-label="Release notes 4.2">…</div>
<sl-menu #actions>…</sl-menu>`,
    }),
  },
  {
    id: 'touch',
    title: 'On touch',
    note: "There is no secondary button on a touch screen: holding the tile for half a second opens the menu at the finger, while text selection and the platform's callout are held off for the duration of the press. Lifting or moving past ten pixels before then cancels it, so a scroll that starts on the tile is still a scroll.",
    snippet: defineSnippet({
      id: 'context-menu-angular-touch',
      language: 'angular',
      label: 'The long press, and its delay set once',
      source: `<div [slContextMenuTriggerFor]="actions" [longPressDelay]="400">…</div>
<sl-menu #actions>…</sl-menu>`,
    }),
  },
  {
    id: 'other-path',
    title: 'The other path',
    note: 'A context menu is found by convention, and a reader who never right-clicks must still reach every command in it: the same actions sit behind the Actions button on the tile, as a menu opened the ordinary way. A menu has one trigger element, so the region and the button each open their own sl-menu, and one ng-template holds the commands both render.',
    snippet: defineSnippet({
      id: 'context-menu-angular-other-path',
      language: 'angular',
      label: 'Every command exists by another path',
      source: `<ng-template #commands>
  <button slMenuItem>Open</button>
  <button slMenuItem>Rename</button>
</ng-template>

<div class="tile" [slContextMenuTriggerFor]="fromRegion">
  <button slButton variant="ghost" [slMenuTriggerFor]="fromButton">Actions</button>
</div>
<sl-menu #fromRegion aria-label="Document actions">
  <ng-container *ngTemplateOutlet="commands" />
</sl-menu>
<sl-menu #fromButton>
  <ng-container *ngTemplateOutlet="commands" />
</sl-menu>`,
    }),
  },
  {
    id: 'disabled',
    title: 'Disabled',
    note: "A disabled family suppresses nothing: the browser's own menu opens on the secondary click, because taking both away would leave the reader with none. The target says so with data-disabled and paints nothing, since the content it wraps still works.",
    snippet: defineSnippet({
      id: 'context-menu-angular-disabled',
      language: 'angular',
      label: 'The browser’s menu passes through',
      source: `<div [slContextMenuTriggerFor]="actions">…</div>
<sl-menu #actions [disabled]="true">…</sl-menu>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Three tiles: at rest nothing is painted; open draws the inward mark in the colour that separates two surfaces; disabled paints nothing either; pressed exists only for the half second a finger is held, and turns off selection rather than painting.',
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
    'model<boolean>',
    'false',
    'sl-menu',
    'Whether the menu shows. Two-way: [(open)] on the sl-menu the target opens. The state is the menu\u2019s and the target only asks it to move.',
  ],
  [
    'slContextMenuTriggerFor',
    'SlMenu',
    '—',
    'target',
    'The menu this region opens, as a template reference: [slContextMenuTriggerFor]="actions".',
  ],
  [
    'longPress',
    'boolean',
    'true',
    'target',
    'Whether holding the region on touch and pen opens the menu.',
  ],
  [
    'longPressDelay',
    'number',
    '500',
    'target',
    'Milliseconds the press is held before the menu opens; movement past ten pixels or lifting first cancels it.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-menu',
    'The menu\u2019s own disabled: the family never opens and the browser\u2019s menu passes through. The target carries data-disabled.',
  ],
  [
    'size, side, align, closeOnSelect, loop, typeahead, …',
    'SlMenu inputs',
    '—',
    'sl-menu',
    'Every input of sl-menu reaches the surface unchanged; anchor and finalFocus are written by the target.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the menu opens or closes. The request carries pointer (a secondary click or a long press), keyboard (Shift+F10, the Menu key), escape, outsidePress (a press anywhere else, the target included), select, dismiss or programmatic, the originating event, and cancel(). Moving to a new point while open emits nothing, because open did not change.',
  },
];

const composition = apiRows([
  [
    'provideContextMenuDefaults()',
    'provider',
    '—',
    'Application',
    'Sets longPress and longPressDelay once for an injector. A target that states one itself still wins; the surface reads provideMenuDefaults().',
  ],
  [
    'sl-menu, slMenuItem, …',
    'directives',
    '—',
    'Beside the target',
    'The surface is the menu family unchanged: submenus, checkbox and radio items, groups, shortcuts, typeahead and tone reach the context menu without a second API. Nothing is re-exported.',
  ],
  [
    'exportAs',
    'template reference',
    '—',
    'target',
    'A template reaches the target — #target="slContextMenuTrigger" — and the menu — #actions="slMenu" — for show() and hide().',
  ],
  [
    'aria-label',
    'attribute',
    '—',
    'sl-menu',
    'The surface is named after the target\u2019s text unless given one — right for a row, wrong for a canvas.',
  ],
  [
    'host attributes',
    'attributes',
    '—',
    'target',
    'The target is the consumer\u2019s own element with its own attributes; a data-part it already carries — a table row\u2019s — is kept, and the identity is written beside it.',
  ],
]);

const accessibility = [
  'The platform supplies the gesture: the contextmenu event is the secondary click, the Menu key and Shift+F10 on every desktop, and the family answers all three with preventDefault while it is enabled and with nothing while it is disabled, so a reader is never left with no menu at all.',
  'The family writes no aria-haspopup on the target — it is not permitted on a generic element, and no surveyed library writes it — so a screen reader is not told the region has a menu. That is why every command in a context menu also exists by another path, and the reference page shows the path.',
  'Focus goes to the first item on open and, on Escape or after a command, back to whatever held it when the menu opened — the checkbox in the row, the tile itself — rather than to a trigger that never had it. A press elsewhere leaves focus where the reader put it.',
  'The family writes no tabindex: a target the page made focusable can be opened from the keyboard, and one it did not cannot. A tab stop on every wrapped region would be one a grid with roving focus cannot afford.',
];

const code = defineSnippet({
  id: 'context-menu-angular-code',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<div data-ui="context-menu" data-part="root" id="sl-menu-trigger-1" tabindex="0" data-open>
  Q3 board deck.pdf
</div>
<div data-ui="menu" data-part="root" data-side="bottom" data-align="start" data-open>
  <div data-part="content" role="menu" aria-labelledby="sl-menu-trigger-1" tabindex="-1">
    <button data-part="item" role="menuitem" type="button">
      <span data-part="label">Open</span>
    </button>
  </div>
</div>`,
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

export const ANGULAR_CONTEXT_MENU_DOCS = {
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
