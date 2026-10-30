import menuTokens from '@slotted/styles/menu/tokens.json';
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

export const ANGULAR_MENU_TOKENS = menuTokens.map((name) => ({
  name,
  purpose: 'A Menu value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlMenu, SlMenuEmpty, SlMenuGroup, SlMenuHeader, SlMenuItem, SlMenuItemDescription, SlMenuItemIcon, SlMenuItemMeta, SlMenuRadioGroup, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';",
  selector:
    'sl-menu, [slMenuTriggerFor], button[slMenuItem], a[slMenuItem], button[slMenuCheckboxItem], button[slMenuRadioItem], sl-menu-group, sl-menu-radio-group, hr[slMenuSeparator], [slMenuHeader], [slMenuItemIcon], [slMenuItemDescription], [slMenuItemMeta], [slMenuEmpty]',
  exportAs: 'slMenu, slMenuTrigger, slMenuItem, slMenuGroup, slMenuRadioGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, built into the portal when the menu opens',
    required: true,
    purpose:
      'The layer the menu is positioned on. It carries data-ui="menu", the resolved size, side and align, and data-open while the menu is open. A layer kept in the document by mount="lazy" or "eager" carries inert while it is closed.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The painted surface, carrying role="menu". It lays out the columns every item uses, is never taller than the room left in the window, and scrolls inside that height.',
  },
  {
    part: 'header',
    element: 'div[slMenuHeader]',
    required: false,
    purpose:
      'Who the menu belongs to: an avatar or a mark, a name in an element with data-part="label" and a line under it in slMenuItemDescription. It is not an item and never takes focus; the surface references it with aria-describedby, so a screen reader announces it once as the menu opens.',
  },
  {
    part: 'group',
    element: 'sl-menu-group, or sl-menu-radio-group',
    required: false,
    purpose:
      'A run of items with role="group", named by its label. Its items keep the menu\'s columns, so their labels line up with the items outside the group.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The name of a group, which the group references with aria-labelledby.',
  },
  {
    part: 'item',
    element: 'button[slMenuItem], or a[slMenuItem] for a link',
    required: true,
    purpose:
      'One command, option or choice. slMenuItem gives role="menuitem", slMenuCheckboxItem menuitemcheckbox and slMenuRadioItem menuitemradio. A disabled item keeps its place among the items the arrow keys reach and carries aria-disabled, because the WAI-ARIA pattern keeps disabled items focusable.',
  },
  {
    part: 'indicator',
    element: 'span, drawn by the item',
    required: false,
    purpose:
      'The check of a checkbox item or the dot of a radio item. Its box is present whether or not the item is checked, so the labels do not move when an option changes.',
  },
  {
    part: 'icon',
    element: 'span[slMenuItemIcon]',
    required: false,
    purpose:
      'The icon in the first column: an slGlyph inside an slIcon, or any element you pass. The column sizes it and does not paint it. It shares the column with the indicator.',
  },
  {
    part: 'label',
    element: 'span, drawn by the item around its content',
    required: true,
    purpose: "The item's text, and the only column that wraps when the surface is narrow.",
  },
  {
    part: 'description',
    element: 'span[slMenuItemDescription]',
    required: false,
    purpose:
      'The line under the label, which the item references with aria-describedby, so a screen reader announces the command as the name and this line as its description.',
  },
  {
    part: 'meta',
    element: 'span[slMenuItemMeta]',
    required: false,
    purpose:
      'A count, a status or the value a submenu holds, end-aligned in its own column before the shortcut, so the values of every item line up. It is part of the accessible name; typeahead matches the label alone.',
  },
  {
    part: 'shortcut',
    element: 'span, drawn by the item',
    required: false,
    purpose:
      'The shortcut printed for the platform: ⌘K on macOS, Ctrl+K elsewhere. It is aria-hidden, because the item announces the shortcut with aria-keyshortcuts.',
  },
  {
    part: 'separator',
    element: 'hr[slMenuSeparator]',
    required: false,
    purpose: 'A line between two runs of items. It is never focused and does nothing when pressed.',
  },
  {
    part: 'empty',
    element: '[slMenuEmpty]',
    required: false,
    purpose:
      'The message the surface shows while it is loading or when it holds no items. The surface keeps its width instead of collapsing around it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One menu with every input on it, driven by the controls under the canvas. Change side and align and watch the surface move around the control that opened it.',
    snippet: defineSnippet({
      id: 'menu-angular-playground',
      language: 'angular',
      label: 'A control, and the commands it opens',
      source: `<button slButton variant="outline" [slMenuTriggerFor]="document">Document</button>
<sl-menu #document>
  <button slMenuItem shortcut="Mod+D">Duplicate</button>
  <button slMenuItem [disabled]="true">Publish</button>
  <hr slMenuSeparator />
  <button slMenuItem tone="danger">Delete…</button>
</sl-menu>`,
    }),
  },
  {
    id: 'commands',
    title: 'Commands',
    note: 'The default: an item runs and the menu closes. The second asks to stay open, which is what a command a reader repeats needs.',
    snippet: defineSnippet({
      id: 'menu-angular-commands',
      language: 'angular',
      label: 'Running an item, and staying open',
      source: `<button slMenuItem (select)="duplicate($event.reason)">Duplicate</button>
<button slMenuItem [closeOnSelect]="false" (select)="zoomIn()">Zoom in</button>`,
    }),
  },
  {
    id: 'icons',
    title: 'Icons',
    note: 'Two items carry a mark and two do not, and every label still starts on the same line: the column exists for the menu rather than for the item.',
    snippet: defineSnippet({
      id: 'menu-angular-icons',
      language: 'angular',
      label: 'A glyph in the first column',
      source: `<button slMenuItem>
  <span slMenuItemIcon
    ><span slIcon><svg slGlyph name="copy"></svg></span
  ></span>
  Duplicate
</button>`,
    }),
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    note: 'Written once as Mod+S and printed as ⌘S on a Mac and Ctrl+S elsewhere. The legend is hidden from a screen reader, which hears aria-keyshortcuts instead.',
    snippet: defineSnippet({
      id: 'menu-angular-shortcuts',
      language: 'angular',
      label: 'One notation, every platform',
      source: `<button slMenuItem shortcut="Mod+S">Save</button>
<button slMenuItem shortcut="Shift+Mod+S">Save as…</button>`,
    }),
  },
  {
    id: 'checkbox-items',
    title: 'Checkbox items',
    note: 'Each item holds a state of its own and the menu stays open, so a reader can turn three things on without opening it three times. Space toggles without closing.',
    snippet: defineSnippet({
      id: 'menu-angular-checkbox-items',
      language: 'angular',
      label: 'An option that stays put',
      source: `<button slMenuCheckboxItem [(checked)]="rulers">Rulers</button>`,
    }),
  },
  {
    id: 'radio-items',
    title: 'Radio items',
    note: 'One value across the group, chosen among the items inside it. The mark sits in the same column an icon would, so the labels stay in line.',
    snippet: defineSnippet({
      id: 'menu-angular-radio-items',
      language: 'angular',
      label: 'One choice among several',
      source: `<sl-menu-radio-group [(value)]="sort">
  <button slMenuRadioItem value="name">
    Name
    <span slMenuItemDescription>A to Z</span>
  </button>
  <button slMenuRadioItem value="date">
    Date modified
    <span slMenuItemDescription>Newest first</span>
  </button>
</sl-menu-radio-group>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'A label names the run under it and the group points at it, so a reader hears "Sort by" before the options rather than a heading belonging to nothing.',
    snippet: defineSnippet({
      id: 'menu-angular-groups',
      language: 'angular',
      label: 'A named run of items',
      source: `<sl-menu-group label="Sort by">
  <button slMenuItem>Name</button>
  <button slMenuItem>Date modified</button>
</sl-menu-group>`,
    }),
  },
  {
    id: 'submenu',
    title: 'Submenus',
    note: 'A menu nested in a menu. Hover opens it after a pause, the inline-end arrow opens it from the keyboard, and the pointer may cut diagonally across the items between.',
    snippet: defineSnippet({
      id: 'menu-angular-submenu',
      language: 'angular',
      label: 'The same family, opened from an item',
      source: `<sl-menu #share>
  <button slMenuItem>Copy link</button>
  <button slMenuItem [slMenuTriggerFor]="sendTo">Send to</button>
  <sl-menu #sendTo>
    <button slMenuItem>Slack</button>
  </sl-menu>
</sl-menu>`,
    }),
  },
  {
    id: 'submenu-open',
    title: 'Submenu open',
    note: 'The submenu as it lands: its panel one gap out from the parent surface, not against the item, and its first item level with the item that opened it. Every other scene keeps its submenu closed until it is hovered or the inline-end arrow asks for it.',
    snippet: defineSnippet({
      id: 'menu-angular-submenu-open',
      language: 'angular',
      label: 'Open from the start, for a capture',
      source: `<sl-menu #sendTo [open]="true">
  <button slMenuItem>Slack</button>
</sl-menu>`,
    }),
  },
  {
    id: 'header',
    title: 'Header',
    note: "An account menu opens with who it belongs to. The avatar starts at the icons' edge, the arrows begin at the first command, and a reader hears the name and the address as the surface's description.",
    snippet: defineSnippet({
      id: 'menu-angular-header',
      language: 'angular',
      label: 'A header above the commands',
      source: `<sl-menu #account>
  <div slMenuHeader>
    <span slAvatar name="Ada Lovelace" size="md" decorative></span>
    <span data-part="label">Ada Lovelace</span>
    <span slMenuItemDescription>ada@analytical.engine</span>
  </div>
  <hr slMenuSeparator />
  <button slMenuItem>Profile</button>
  <button slMenuItem tone="danger">Sign out</button>
</sl-menu>`,
    }),
  },
  {
    id: 'meta',
    title: 'Meta',
    note: 'Counts and the value a submenu holds, in a column of their own: the numbers end on one edge, the shortcuts keep theirs, and a submenu trigger shows its current value before the chevron.',
    snippet: defineSnippet({
      id: 'menu-angular-meta',
      language: 'angular',
      label: 'A count per item, a value on a submenu trigger',
      source: `<button slMenuItem shortcut="Mod+1">Inbox <span slMenuItemMeta>12</span></button>
<button slMenuItem [slMenuTriggerFor]="status">
  Status <span slMenuItemMeta>{{ presence() }}</span>
</button>`,
    }),
  },
  {
    id: 'tone',
    title: 'Tone',
    note: 'A destructive command reads as destructive before it is read at all: the tone paints the label, the mark and the highlight together, in all three schemes.',
    snippet: defineSnippet({
      id: 'menu-angular-tone',
      language: 'angular',
      label: 'A command that destroys something',
      source: `<button slMenuItem tone="danger" (select)="remove()">
  Delete document
  <span slMenuItemDescription>This cannot be undone.</span>
</button>`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement',
    note: 'The surface hangs from the start edge of its control by default, and flips or slides rather than leaving the screen. Both inline values mirror in a right-to-left document.',
    snippet: defineSnippet({
      id: 'menu-angular-placement',
      language: 'angular',
      label: 'Where the surface hangs',
      source: `<sl-menu #actions side="inline-end" align="start" [sideOffset]="4">
  <button slMenuItem>Rename…</button>
</sl-menu>`,
    }),
  },
  {
    id: 'scrolling',
    title: 'A menu taller than the screen',
    note: 'The surface is bounded by the room the positioner reports and scrolls inside it, so thirty commands never run off the bottom of the window.',
    snippet: defineSnippet({
      id: 'menu-angular-scrolling',
      language: 'angular',
      label: 'Bounded by the room that is left',
      source: `<sl-menu #moveTo aria-label="Move to">
  @for (folder of folders; track folder) {
    <button slMenuItem>{{ folder }}</button>
  }
</sl-menu>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled, checked, the parent item while its submenu is open, and the surface waiting for its items. A disabled item still takes focus and still runs nothing.',
    snippet: defineSnippet({
      id: 'menu-angular-states',
      language: 'angular',
      label: 'Every state the contract declares',
      source: `<sl-menu #labels [loading]="pending()">
  <button slMenuItem [disabled]="true">Publish</button>
  <button slMenuCheckboxItem [checked]="true">Show comments</button>
  <div slMenuEmpty>Loading labels…</div>
</sl-menu>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Arrows move and wrap, Home and End reach the ends, typing jumps to a command by name, Escape closes one surface and Tab closes them all and moves on down the page.',
    snippet: defineSnippet({
      id: 'menu-angular-keyboard',
      language: 'angular',
      label: 'Nothing to write: the pattern is the default',
      source: `<sl-menu #commands [loop]="true" [typeahead]="true">
  <button slMenuItem textValue="Save">Save</button>
</sl-menu>`,
    }),
  },
  {
    id: 'composition',
    title: 'In context',
    note: "A row of actions in a table: the trigger is the consumer's own icon button, the menu holds the row's commands, and provideMenuDefaults sets the side once.",
    snippet: defineSnippet({
      id: 'menu-angular-composition',
      language: 'angular',
      label: "The consumer's own control, wired",
      source: `<button slButton variant="ghost" aria-label="Row actions" [slMenuTriggerFor]="rowActions">⋯</button>
<sl-menu #rowActions>
  <button slMenuItem>Open</button>
</sl-menu>`,
    }),
  },
];

const api = apiRows([
  [
    'open',
    'model<boolean>',
    'false',
    'sl-menu',
    'Whether the menu is open. Bind [(open)] to read and write it; on a menubar the bar holds it instead.',
  ],
  [
    'value',
    'string | undefined',
    '—',
    'sl-menu, sl-menu-radio-group, button[slMenuRadioItem]',
    'On an sl-menu inside sl-menubar, the name the bar knows it by; a menu on its own needs none. On sl-menu-radio-group, the chosen value, bound with [(value)]. On a radio item, the value the item stands for.',
  ],
  [
    'checked',
    'model<boolean>',
    'false',
    'button[slMenuCheckboxItem]',
    'Whether the option is on. Bind [(checked)] to read and write it.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-menu',
    'The width of the surface and the height of its items.',
  ],
  [
    'width',
    "'content' | 'anchor'",
    'content',
    'sl-menu',
    'content: the surface takes its own measure; anchor: it is exactly as wide as its trigger, capped by the available width. A submenu is always content.',
  ],
  [
    'side',
    "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'sl-menu',
    'The edge of the trigger the surface opens from. inline-start and inline-end follow the reading direction.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'sl-menu',
    'Where the surface sits along that edge.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'sl-menu',
    'When the surface is in the document: only while open, from the first open on, or from the start. A surface kept while closed carries inert.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'sl-menu',
    'The CSS position the layer is placed with.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'true',
    'sl-menu, button[slMenuItem]',
    'Whether running an item closes the menu. Checkbox and radio items keep it open unless they set it themselves.',
  ],
  [
    'loop',
    'boolean',
    'true',
    'sl-menu',
    'Whether the arrow keys wrap from the last item to the first.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'sl-menu',
    'Whether typing moves focus to the item whose label starts with the typed text.',
  ],
  [
    'openOnHover',
    'boolean',
    'true',
    'sl-menu',
    'Whether a submenu opens when the pointer rests on its item.',
  ],
  [
    'closeOnEscape',
    'boolean',
    'true',
    'sl-menu',
    'Whether Escape closes the menu that holds focus.',
  ],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'sl-menu',
    'Whether a press outside the menu closes every open menu.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'sl-menu',
    'Whether the surface moves to the opposite side when it would leave the window.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'sl-menu',
    'Whether the surface slides along its edge to stay in the window.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'sl-menu',
    'Whether the surface hides once its trigger has scrolled out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'sl-menu',
    'Whether the layer is built at the end of the document.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-menu, button[slMenuItem]',
    'A disabled menu never opens. A disabled item stays focusable and runs nothing.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'sl-menu',
    'Whether the items are on their way. The surface keeps its width, sets aria-busy and shows the slMenuEmpty message.',
  ],
  [
    'sideOffset',
    'number',
    '0',
    'sl-menu',
    "Extra distance from the trigger, in pixels, beyond the layer's own gap.",
  ],
  ['alignOffset', 'number', '0', 'sl-menu', 'Distance along the alignment edge, in pixels.'],
  [
    'collisionPadding',
    'number',
    '8',
    'sl-menu',
    'The distance, in pixels, the surface keeps from the edge of the window.',
  ],
  [
    'submenuOpenDelay',
    'number',
    '150',
    'sl-menu',
    'How long, in milliseconds, the pointer rests on an item before its submenu opens.',
  ],
  [
    'submenuCloseDelay',
    'number',
    '300',
    'sl-menu',
    'How long, in milliseconds, a submenu stays open while the pointer travels toward it without reaching it.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'sl-menu',
    'How long, in milliseconds, typed letters keep adding to one search.',
  ],
  [
    'shortcut',
    'string',
    '—',
    'button[slMenuItem]',
    'A shortcut written as Mod+K, printed for the platform and announced with aria-keyshortcuts. The menu does not bind the key.',
  ],
  [
    'textValue',
    'string',
    '—',
    'button[slMenuItem]',
    'The text typeahead matches, when the label does not start with the word a reader would type.',
  ],
  [
    'tone',
    "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
    '—',
    'button[slMenuItem]',
    'The theme tone of the label, the icon and the highlight. A destructive command takes danger.',
  ],
  [
    'label',
    'string',
    '—',
    'sl-menu-group',
    'The name of the group, rendered as its group-label part.',
  ],
  [
    'slMenuTriggerFor',
    'SlMenu',
    '—',
    '[slMenuTriggerFor]',
    'The menu a control opens. It goes on your own button; on an slMenuItem it opens a submenu.',
  ],
  [
    'aria-label',
    'string',
    '—',
    'sl-menu',
    'Names the surface itself, instead of the name it takes from its trigger.',
  ],
  [
    'aria-describedby',
    'string',
    '—',
    'sl-menu',
    'The ids of the elements that describe the menu, written on the element with role="menu".',
  ],
]);

const events: EventRow[] = [
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'After the menu opens or closes, as the write-back of [(open)].',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the menu opens or closes. request.reason is pointer, keyboard, escape, outsidePress, select, dismiss or programmatic, request.source is the event, and request.cancel() refuses the change.',
  },
  {
    name: 'checkedChange, checkedChangeRequest',
    payload: 'boolean, ChangeRequest<boolean>',
    when: "After and before a checkbox item changes. The request's reason is pointer or keyboard.",
  },
  {
    name: 'valueChange, valueChangeRequest',
    payload: 'string, ChangeRequest<string>',
    when: "After and before a radio group changes its value. The request's reason is pointer or keyboard.",
  },
  {
    name: 'select',
    payload: 'MenuSelectEvent',
    when: 'When an item runs. event.reason is pointer or keyboard, and event.preventDefault() keeps the menu open for this press only.',
  },
];

const composition = apiRows([
  [
    'provideMenuDefaults',
    'provider',
    '—',
    'Application',
    'Sets any axis once, in the application config or on a route. A value set on one menu still wins.',
  ],
  [
    'slMenuTriggerFor',
    'directive',
    '—',
    'Any control',
    'Goes on your own element instead of replacing it: the wiring, the state attributes and the keyboard arrive on the button you already have, which keeps its own part and styles.',
  ],
  [
    'slMenuHeader',
    'directive',
    '—',
    'sl-menu',
    'The block above the commands. Its children are the media, an element with data-part="label" and an slMenuItemDescription, and the surface is described by it.',
  ],
  [
    'slMenuItemIcon, slMenuItemDescription, slMenuItemMeta',
    'directive',
    '—',
    'Item content',
    'Project an element into the icon, description or meta column of the item.',
  ],
  [
    'slMenuEmpty',
    'directive',
    '—',
    'sl-menu',
    'The message shown while loading is set or when the menu holds no items.',
  ],
  [
    'exportAs',
    'template reference',
    '—',
    'sl-menu, [slMenuTriggerFor]',
    'A template reference such as #menu="slMenu" reaches the instance, for toggle(), closeAll() and the resolved axes.',
  ],
  [
    'ng-content',
    'projection',
    '—',
    'sl-menu, sl-menu-group',
    'The items are your own elements, projected into the surface the menu builds when it opens.',
  ],
  [
    'slMenuItem, slMenuCheckboxItem, slMenuRadioItem',
    'attribute',
    '—',
    'button, a',
    'The attribute you write decides the role of the item. slMenuItem also goes on an a for a link item.',
  ],
]);

const accessibility = [
  'An item is a native button, so Enter and Space run it and the pointer behaves as the browser\'s own. role="menuitem" replaces role="button", so a screen reader announces a menu item. A link item is an a that keeps its href and takes the same role.',
  'Menu supplies the keyboard of the WAI-ARIA menu pattern: the arrow keys move and wrap, Home and End reach the ends, letters move by typeahead, the inline-end arrow opens a submenu and the inline-start arrow closes it, Escape closes the menu that holds focus, and Tab closes every menu and moves focus past the trigger.',
  'A disabled item stays focusable and carries aria-disabled instead of the native disabled attribute, so a keyboard user can still find a command that is unavailable. A natively disabled button cannot take focus.',
  'A header is not an item and never takes focus, because role="menu" owns only items, groups and separators. The surface references it with aria-describedby, joined to any description you give, so a screen reader announces who the menu belongs to once, as it opens.',
  "The surface is named by its trigger, or by its own aria-label. A checkbox or radio item announces its state through aria-checked, a group is named by its label, and a shortcut is announced through aria-keyshortcuts while the printed keys are hidden, so the item's name stays the command.",
];

const code = defineSnippet({
  id: 'menu-angular-code',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<div data-ui="menu" data-part="root" data-side="bottom" data-align="start" data-size="md" data-open>
  <div data-part="content" role="menu" aria-labelledby="sl-menu-trigger-a1b2c3" tabindex="-1">
    <sl-menu-group data-part="group" role="group" aria-labelledby="sl-menu-group-d4e5f6">
      <div data-part="group-label" id="sl-menu-group-d4e5f6">File</div>
      <button
        data-part="item"
        role="menuitem"
        type="button"
        tabindex="-1"
        aria-keyshortcuts="Control+D"
      >
        <span data-part="label">Duplicate</span>
        <span data-part="shortcut" aria-hidden="true">Ctrl+D</span>
      </button>
    </sl-menu-group>
    <hr data-part="separator" role="separator" aria-orientation="horizontal" />
  </div>
</div>`,
});

const theming = defineSnippet({
  id: 'menu-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='menu'] {
  --slotted-menu-surface: var(--slotted-surface-raised);
  --slotted-menu-radius: var(--slotted-radius-lg);
  --slotted-menu-measure: 18rem;
  --slotted-menu-highlight: var(--slotted-tone-accent-surface);
}`,
});

export const ANGULAR_MENU_DOCS = {
  menu: {
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
