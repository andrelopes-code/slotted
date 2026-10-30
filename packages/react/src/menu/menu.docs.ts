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

export const REACT_MENU_TOKENS = menuTokens.map((name) => ({
  name,
  purpose: 'A Menu value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { Menu, MenuCheckboxItem, MenuContent, MenuEmpty, MenuGroup, MenuHeader, MenuItem, MenuItemDescription, MenuItemLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The layer the menu is positioned on. It carries data-ui="menu", the resolved size, side and align, and data-open while the menu is open. The gap between the trigger and the surface is the layer\'s own padding, so the pointer never crosses the page on its way into a submenu.',
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
    element: 'div',
    required: false,
    purpose:
      'Who the menu belongs to: an avatar or a mark, a name in MenuItemLabel and a line under it in MenuItemDescription. It is not an item and never takes focus; the surface references it with aria-describedby, so a screen reader announces it once as the menu opens.',
  },
  {
    part: 'group',
    element: 'div',
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
    element: 'button, or a when the item is a link',
    required: true,
    purpose:
      'One command, option or choice, with role menuitem, menuitemcheckbox or menuitemradio. A disabled item keeps its place among the items the arrow keys reach and carries aria-disabled, because the WAI-ARIA pattern keeps disabled items focusable.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The check of a checkbox item or the dot of a radio item. Its box is present whether or not the item is checked, so the labels do not move when an option changes.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The icon in the first column: a Glyph inside an Icon, or any element you pass. The column sizes it and does not paint it. It shares the column with the indicator.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose: "The item's text, and the only column that wraps when the surface is narrow.",
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'The line under the label, which the item references with aria-describedby, so a screen reader announces the command as the name and this line as its description.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'A count, a status or the value a submenu holds, end-aligned in its own column before the shortcut, so the values of every item line up. It is part of the accessible name; typeahead matches the label alone.',
  },
  {
    part: 'shortcut',
    element: 'span',
    required: false,
    purpose:
      'The shortcut printed for the platform: ⌘K on macOS, Ctrl+K elsewhere. It is aria-hidden, because the item announces the shortcut with aria-keyshortcuts.',
  },
  {
    part: 'separator',
    element: 'hr',
    required: false,
    purpose: 'A line between two runs of items. It is never focused and does nothing when pressed.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'The message the surface shows while it is loading or when it holds no items. The surface keeps its width instead of collapsing around it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One menu with every axis on it, driven by the controls under the canvas. Change side and align and watch the surface move around the control that opened it.',
    snippet: defineSnippet({
      id: 'menu-react-playground',
      language: 'tsx',
      label: 'A control, and the commands it opens',
      source: `<Menu>
  <MenuTrigger render={(props) => <Button {...props} variant="outline" />}>Document</MenuTrigger>
  <MenuContent>
    <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
    <MenuItem disabled>Publish</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger">Delete…</MenuItem>
  </MenuContent>
</Menu>;`,
    }),
  },
  {
    id: 'commands',
    title: 'Commands',
    note: 'The default: an item runs and the menu closes. The second item asks to stay open, which is what a command a reader repeats needs.',
    snippet: defineSnippet({
      id: 'menu-react-commands',
      language: 'tsx',
      label: 'Running an item, and staying open',
      source: `<>
  <MenuItem onSelect={(event) => duplicate(event.reason)}>Duplicate</MenuItem>
  <MenuItem closeOnSelect={false} onSelect={zoomIn}>
    Zoom in
  </MenuItem>
</>;`,
    }),
  },
  {
    id: 'icons',
    title: 'Icons',
    note: 'Two items carry a mark and two do not, and every label still starts on the same line: the column exists for the menu rather than for the item.',
    snippet: defineSnippet({
      id: 'menu-react-icons',
      language: 'tsx',
      label: 'A glyph in the first column',
      source: `<>
  <MenuItem
    icon={
      <Icon>
        <Glyph name="copy" />
      </Icon>
    }
  >
    Duplicate
  </MenuItem>
  <MenuItem>Rename</MenuItem>
</>;`,
    }),
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    note: 'Written once as Mod+S and printed as ⌘S on a Mac and Ctrl+S elsewhere. The legend is hidden from a screen reader, which hears aria-keyshortcuts instead.',
    snippet: defineSnippet({
      id: 'menu-react-shortcuts',
      language: 'tsx',
      label: 'One notation, every platform',
      source: `<>
  <MenuItem shortcut="Mod+S">Save</MenuItem>
  <MenuItem shortcut="Shift+Mod+S">Save as…</MenuItem>
</>;`,
    }),
  },
  {
    id: 'checkbox-items',
    title: 'Checkbox items',
    note: 'Each item holds a state of its own and the menu stays open, so a reader can turn three things on without opening it three times. Space toggles without closing.',
    snippet: defineSnippet({
      id: 'menu-react-checkbox-items',
      language: 'tsx',
      label: 'An option that stays put',
      source: `<MenuCheckboxItem checked={rulers} onCheckedChange={setRulers}>
  Rulers
</MenuCheckboxItem>;`,
    }),
  },
  {
    id: 'radio-items',
    title: 'Radio items',
    note: 'One value across the group, chosen among the items inside it. The mark sits in the same column an icon would, so the labels stay in line.',
    snippet: defineSnippet({
      id: 'menu-react-radio-items',
      language: 'tsx',
      label: 'One choice among several',
      source: `<MenuRadioGroup value={sort} onValueChange={setSort}>
  <MenuRadioItem value="name" description="A to Z">
    Name
  </MenuRadioItem>
  <MenuRadioItem value="date" description="Newest first">
    Date modified
  </MenuRadioItem>
</MenuRadioGroup>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'A label names the run under it and the group points at it, so a reader hears "Sort by" before the options rather than a heading belonging to nothing.',
    snippet: defineSnippet({
      id: 'menu-react-groups',
      language: 'tsx',
      label: 'A named run of items',
      source: `<MenuGroup label="Sort by">
  <MenuItem>Name</MenuItem>
  <MenuItem>Date modified</MenuItem>
</MenuGroup>;`,
    }),
  },
  {
    id: 'submenu',
    title: 'Submenus',
    note: 'A menu nested in a menu. Hover opens it after a pause, the inline-end arrow opens it from the keyboard, and the pointer may cut diagonally across the items between.',
    snippet: defineSnippet({
      id: 'menu-react-submenu',
      language: 'tsx',
      label: 'The same family, opened from an item',
      source: `<MenuContent>
  <MenuItem>Copy link</MenuItem>
  <Menu>
    <MenuTrigger>Send to</MenuTrigger>
    <MenuContent>
      <MenuItem>Slack</MenuItem>
    </MenuContent>
  </Menu>
</MenuContent>;`,
    }),
  },
  {
    id: 'submenu-open',
    title: 'Submenu open',
    note: 'The submenu as it lands: its panel one gap out from the parent surface, not against the item, and its first item level with the item that opened it. Every other scene keeps its submenu closed until it is hovered or the inline-end arrow asks for it.',
    snippet: defineSnippet({
      id: 'menu-react-submenu-open',
      language: 'tsx',
      label: 'Open from the start, for a capture',
      source: `<Menu defaultOpen>
  <MenuTrigger>Send to</MenuTrigger>
  <MenuContent>
    <MenuItem>Slack</MenuItem>
  </MenuContent>
</Menu>;`,
    }),
  },
  {
    id: 'header',
    title: 'Header',
    note: "An account menu opens with who it belongs to. The avatar starts at the icons' edge, the arrows begin at the first command, and a reader hears the name and the address as the surface's description.",
    snippet: defineSnippet({
      id: 'menu-react-header',
      language: 'tsx',
      label: 'A header above the commands',
      source: `<MenuContent>
  <MenuHeader>
    <Avatar name="Ada Lovelace" size="md" />
    <MenuItemLabel>Ada Lovelace</MenuItemLabel>
    <MenuItemDescription>ada@analytical.engine</MenuItemDescription>
  </MenuHeader>
  <MenuSeparator />
  <MenuItem
    icon={
      <Icon>
        <Glyph name="person" />
      </Icon>
    }
  >
    Profile
  </MenuItem>
  <MenuItem tone="danger">Sign out</MenuItem>
</MenuContent>;`,
    }),
  },
  {
    id: 'meta',
    title: 'Meta',
    note: 'Counts and the value a submenu holds, in a column of their own: the numbers end on one edge, the shortcuts keep theirs, and a submenu trigger shows its current value before the chevron.',
    snippet: defineSnippet({
      id: 'menu-react-meta',
      language: 'tsx',
      label: 'A count per item, a value on a submenu trigger',
      source: `<MenuContent>
  <MenuItem meta="12" shortcut="Mod+1">
    Inbox
  </MenuItem>
  <MenuItem meta="3" shortcut="Mod+2">
    Drafts
  </MenuItem>
  <Menu>
    <MenuTrigger meta="Available">Status</MenuTrigger>
    <MenuContent>…</MenuContent>
  </Menu>
</MenuContent>;`,
    }),
  },
  {
    id: 'tone',
    title: 'Tone',
    note: 'A destructive command reads as destructive before it is read at all: the tone paints the label, the mark and the highlight together, in all three schemes.',
    snippet: defineSnippet({
      id: 'menu-react-tone',
      language: 'tsx',
      label: 'A command that destroys something',
      source: `<MenuItem tone="danger" onSelect={remove}>
  Delete document
</MenuItem>;`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement',
    note: 'The surface hangs from the start edge of its control by default, and flips or slides rather than leaving the screen. Both inline values mirror in a right-to-left document.',
    snippet: defineSnippet({
      id: 'menu-react-placement',
      language: 'tsx',
      label: 'Where the surface hangs',
      source: `<Menu side="inline-end" align="start" sideOffset={4}>
  <MenuTrigger>Actions</MenuTrigger>
  <MenuContent>
    <MenuItem>Rename</MenuItem>
  </MenuContent>
</Menu>;`,
    }),
  },
  {
    id: 'scrolling',
    title: 'A menu taller than the screen',
    note: 'The surface is bounded by the room the positioner reports and scrolls inside it, so thirty commands never run off the bottom of the window.',
    snippet: defineSnippet({
      id: 'menu-react-scrolling',
      language: 'tsx',
      label: 'Bounded by the room that is left',
      source: `<MenuContent aria-label="Move to">
  {folders.map((folder) => (
    <MenuItem key={folder}>{folder}</MenuItem>
  ))}
</MenuContent>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Disabled, checked, the parent item while its submenu is open, and the surface waiting for its items. A disabled item still takes focus and still runs nothing.',
    snippet: defineSnippet({
      id: 'menu-react-states',
      language: 'tsx',
      label: 'Every state the contract declares',
      source: `<MenuContent loading={pending}>
  <MenuItem disabled>Publish</MenuItem>
  <MenuCheckboxItem checked>Show comments</MenuCheckboxItem>
  <MenuEmpty>Loading labels…</MenuEmpty>
</MenuContent>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Arrows move and wrap, Home and End reach the ends, typing jumps to a command by name, Escape closes one surface and Tab closes them all and moves on down the page.',
    snippet: defineSnippet({
      id: 'menu-react-keyboard',
      language: 'tsx',
      label: 'Nothing to write: the pattern is the default',
      source: `<Menu loop typeahead>
  <MenuTrigger>Commands</MenuTrigger>
  <MenuContent>
    <MenuItem textValue="Save">Save</MenuItem>
  </MenuContent>
</Menu>;`,
    }),
  },
  {
    id: 'composition',
    title: 'In context',
    note: "A row of actions in a table: the trigger is the consumer's own icon button, the menu holds the row's commands, and the defaults provider sets the side once.",
    snippet: defineSnippet({
      id: 'menu-react-composition',
      language: 'tsx',
      label: "The consumer's own control, wired",
      source: `<MenuDefaultsProvider side="bottom" align="end">
  <Menu>
    <MenuTrigger render={(props) => <Button {...props} variant="ghost" aria-label="Row actions" />}>
      ⋯
    </MenuTrigger>
    <MenuContent>
      <MenuItem>Open</MenuItem>
    </MenuContent>
  </Menu>
</MenuDefaultsProvider>;`,
    }),
  },
];

const api = apiRows([
  [
    'open',
    'boolean | undefined',
    '—',
    'Menu',
    'Whether the menu is open. Passing it makes the menu controlled for its lifetime; update it from onOpenChange.',
  ],
  [
    'defaultOpen',
    'boolean',
    'false',
    'Menu',
    'Whether an uncontrolled menu starts open. Read once.',
  ],
  [
    'onOpenChange',
    '(open, request) => void',
    '—',
    'Menu',
    'Called before the menu opens or closes, with the reason and the event. The request can be cancelled.',
  ],
  [
    'value',
    'string',
    '—',
    'Menu, MenuRadioGroup, MenuRadioItem',
    'On a Menu inside a Menubar, the name the bar knows it by; a menu on its own needs none. On a MenuRadioGroup, the chosen value, which makes the group controlled. On a MenuRadioItem, the value the item stands for.',
  ],
  [
    'checked',
    'boolean | undefined',
    '—',
    'MenuCheckboxItem',
    'Whether the option is on. Passing it makes the item controlled.',
  ],
  [
    'defaultChecked',
    'boolean',
    'false',
    'MenuCheckboxItem',
    'Whether an uncontrolled option starts on.',
  ],
  [
    'onCheckedChange',
    '(checked, request) => void',
    '—',
    'MenuCheckboxItem',
    'Called before the option changes, with pointer or keyboard as the reason.',
  ],
  ['defaultValue', 'string', '—', 'MenuRadioGroup', 'The value an uncontrolled group starts with.'],
  [
    'onValueChange',
    '(value, request) => void',
    '—',
    'MenuRadioGroup',
    'Called before the chosen value changes, with pointer or keyboard as the reason.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Menu',
    'The width of the surface and the height of its items.',
  ],
  [
    'width',
    "'content' | 'anchor'",
    'content',
    'Menu',
    'content: the surface takes its own measure; anchor: it is exactly as wide as its trigger, capped by the available width. A submenu is always content.',
  ],
  [
    'side',
    "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'Menu',
    'The edge of the trigger the surface opens from. inline-start and inline-end follow the reading direction.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'Menu',
    'Where the surface sits along that edge.',
  ],
  [
    'anchor',
    'PositionerAnchor | null',
    '—',
    'Menu',
    'What the surface is positioned against instead of the trigger, such as a table row or a point. Focus still returns to the trigger.',
  ],
  [
    'finalFocus',
    'Element | RefObject | string',
    'the trigger',
    'Menu',
    'Where focus goes when the menu closes, for a trigger that is gone by then, such as the actions button of a deleted row.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Menu',
    'When the surface is in the document: only while open, from the first open on, or from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'Menu',
    'The CSS position the layer is placed with.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'true',
    'Menu, MenuItem',
    'Whether running an item closes the menu. Checkbox and radio items keep it open unless they set it themselves.',
  ],
  [
    'loop',
    'boolean',
    'true',
    'Menu',
    'Whether the arrow keys wrap from the last item to the first.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'Menu',
    'Whether typing moves focus to the item whose label starts with the typed text.',
  ],
  [
    'openOnHover',
    'boolean',
    'true',
    'Menu',
    'Whether a submenu opens when the pointer rests on its item.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'Menu', 'Whether Escape closes the menu that holds focus.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'Menu',
    'Whether a press outside the menu closes every open menu.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'Menu',
    'Whether the surface moves to the opposite side when it would leave the window.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'Menu',
    'Whether the surface slides along its edge to stay in the window.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'Menu',
    'Whether the surface hides once its trigger has scrolled out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'Menu',
    'Whether the layer is rendered at the end of the document.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'Menu, MenuItem',
    'A disabled menu never opens, and its trigger keeps aria-expanded="false". A disabled item stays focusable and runs nothing.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'MenuContent',
    'Whether the items are on their way. The surface keeps its width, sets aria-busy and shows the MenuEmpty message.',
  ],
  [
    'sideOffset',
    'number',
    '0',
    'Menu',
    "Extra distance from the trigger, in pixels, beyond the layer's own gap.",
  ],
  ['alignOffset', 'number', '0', 'Menu', 'Distance along the alignment edge, in pixels.'],
  [
    'collisionPadding',
    'number',
    '8',
    'Menu',
    'The distance, in pixels, the surface keeps from the edge of the window.',
  ],
  [
    'submenuOpenDelay',
    'number',
    '150',
    'Menu',
    'How long, in milliseconds, the pointer rests on an item before its submenu opens.',
  ],
  [
    'submenuCloseDelay',
    'number',
    '300',
    'Menu',
    'How long, in milliseconds, a submenu stays open while the pointer travels toward it without reaching it.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'Menu',
    'How long, in milliseconds, typed letters keep adding to one search.',
  ],
  ['icon', 'ReactNode', '—', 'MenuItem, MenuTrigger', 'The icon in the first column of the item.'],
  [
    'description',
    'ReactNode',
    '—',
    'MenuItem, MenuCheckboxItem, MenuRadioItem',
    'The line under the label, referenced with aria-describedby; the label alone names the item.',
  ],
  [
    'meta',
    'ReactNode',
    '—',
    'MenuItem, MenuTrigger',
    'A count, a status or the value a submenu holds, in its own column before the shortcut or the chevron.',
  ],
  [
    'shortcut',
    'string',
    '—',
    'MenuItem',
    'A shortcut written as Mod+K, printed for the platform and announced with aria-keyshortcuts. The menu does not bind the key.',
  ],
  [
    'textValue',
    'string',
    '—',
    'MenuItem',
    'The text typeahead matches, when the label does not start with the word a reader would type.',
  ],
  [
    'tone',
    "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
    '—',
    'MenuItem',
    'The theme tone of the label, the icon and the highlight. A destructive command takes danger.',
  ],
  [
    'label',
    'ReactNode',
    '—',
    'MenuGroup',
    'The name of the group, rendered as its group-label part.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'MenuTrigger, MenuContent, MenuItem',
    'Renders your own element with the wiring, the state attributes and the handlers spread on it. On MenuItem, return an a for a link item.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: MenuChangeRequest)',
    when: 'Before the menu opens or closes. request.reason is pointer, keyboard, escape, outsidePress, select, dismiss or programmatic, request.source is the event, and request.cancel() refuses the change.',
  },
  {
    name: 'onCheckedChange',
    payload: '(checked: boolean, request: MenuCheckedChangeRequest)',
    when: 'Before a checkbox item changes. request.reason is pointer or keyboard.',
  },
  {
    name: 'onValueChange',
    payload: '(value: string, request: MenuValueChangeRequest)',
    when: 'Before a radio group changes its value. request.reason is pointer or keyboard.',
  },
  {
    name: 'onSelect',
    payload: '(event: MenuSelectEvent)',
    when: 'When an item runs. event.reason is pointer or keyboard, and event.preventDefault() keeps the menu open for this press only.',
  },
];

const composition = apiRows([
  [
    'MenuDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets any axis once for every menu under it, and container sets where the layers are rendered. A value set on one menu still wins.',
  ],
  [
    'render',
    'prop',
    '—',
    'MenuTrigger, MenuContent, MenuItem',
    'Replaces the rendered element with your own, keeping the wiring, the state attributes and the handlers.',
  ],
  [
    'MenuHeader',
    'component',
    '—',
    'MenuContent',
    'The block above the commands. Its children are the media, a MenuItemLabel and a MenuItemDescription, and the surface is described by it.',
  ],
  [
    'MenuItemMeta, MenuItemIcon, MenuItemLabel, MenuItemDescription, MenuItemShortcut',
    'component',
    '—',
    'MenuItem children',
    'The parts of an item, for an item written from its parts instead of from props.',
  ],
  [
    'MenuGroupLabel',
    'component',
    '—',
    'MenuGroup',
    'The group-label part, for a label written as a child instead of with label.',
  ],
  [
    'MenuEmpty',
    'component',
    '—',
    'MenuContent',
    'The message shown while loading is set or when the menu holds no items.',
  ],
  [
    'useMenu',
    'hook',
    '—',
    'Inside a Menu',
    'Reads the menu around a part: whether it is open, its resolved axes and toggle().',
  ],
  [
    'ref',
    'prop',
    '—',
    'Menu',
    'A handle with open(), close() and focus(), for a shortcut your application binds outside the menu.',
  ],
  [
    'native props',
    'attributes',
    '—',
    'Every part',
    "Any attribute the underlying element takes reaches it. Your own onClick, onKeyDown or onPointerEnter runs before the menu's handler, and preventDefault() in it skips the menu's.",
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
  id: 'menu-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div data-ui="menu" data-part="root" data-side="bottom" data-align="start" data-size="md" data-open>
  <div data-part="content" role="menu" aria-labelledby="trigger-id" tabindex="-1">
    <div data-part="group" role="group" aria-labelledby="group-id">
      <div data-part="group-label" id="group-id">
        File
      </div>
      <button
        data-part="item"
        role="menuitem"
        type="button"
        tabindex="-1"
        aria-keyshortcuts="Control+D"
      >
        <span data-part="icon">
          <span data-ui="icon" data-part="root" aria-hidden="true">
            <svg data-part="glyph" data-glyph="copy" />
          </span>
        </span>
        <span data-part="label">Duplicate</span>
        <span data-part="shortcut" aria-hidden="true">
          Ctrl+D
        </span>
      </button>
    </div>
    <hr data-part="separator" role="separator" aria-orientation="horizontal" />
    <button
      data-part="item"
      role="menuitemcheckbox"
      aria-checked="true"
      data-checked
      type="button"
      tabindex="-1"
    >
      <span data-part="indicator">
        <span data-ui="icon" data-part="root" aria-hidden="true">
          <svg data-part="glyph" data-glyph="check" />
        </span>
      </span>
      <span data-part="label">Show comments</span>
    </button>
  </div>
</div>;`,
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

export const REACT_MENU_DOCS = {
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
