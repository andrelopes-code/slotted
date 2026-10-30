import menubarTokens from '@slotted/styles/menubar/tokens.json';
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

export const REACT_MENUBAR_TOKENS = menubarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Menubar decision',
}));

const imports: ReferenceImport = {
  source: "import { Menubar, MenubarDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The bar. It carries data-ui="menubar", role="menubar", its orientation and its size, holds one tab stop for every trigger on it, and paints no ground of its own — the header it sits in owns that.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'One menu\'s control, as role="menuitem". It is rendered by MenuTrigger inside the bar: the menus on a bar are the menu family unchanged, so the bar itself declares no other part.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A bar of four menus, driven by the controls under the canvas. Change the orientation and the size, and the menus follow the bar rather than being told twice.',
    snippet: defineSnippet({
      id: 'menubar-react-playground',
      language: 'tsx',
      label: 'A bar, and the menus on it',
      source: `<Menubar aria-label="Main">
  <Menu value="file">
    <MenuTrigger>File</MenuTrigger>
    <MenuContent>
      <MenuItem shortcut="Mod+N">New</MenuItem>
    </MenuContent>
  </Menu>
</Menubar>;`,
    }),
  },
  {
    id: 'bar',
    title: 'The bar',
    note: 'Four menus in a header. Pressing one opens it; with one open, moving the pointer along the bar switches menus without another press.',
    snippet: defineSnippet({
      id: 'menubar-react-bar',
      language: 'tsx',
      label: 'The menu family, unchanged, on a bar',
      source: `<Menubar aria-label="Main">
  <Menu value="file">…</Menu>
  <Menu value="edit">…</Menu>
  <Menu value="view">…</Menu>
</Menubar>;`,
    }),
  },
  {
    id: 'submenus',
    title: 'Submenus',
    note: "A bar's menu holds submenus like any other menu, and the inline arrows still move between the bar's own menus once the submenu has closed.",
    snippet: defineSnippet({
      id: 'menubar-react-submenus',
      language: 'tsx',
      label: 'A menu inside a menu, on a bar',
      source: `<Menu value="file">
  <MenuTrigger>File</MenuTrigger>
  <MenuContent>
    <Menu>
      <MenuTrigger>Export as</MenuTrigger>
      <MenuContent>
        <MenuItem>PDF</MenuItem>
      </MenuContent>
    </Menu>
  </MenuContent>
</Menu>;`,
    }),
  },
  {
    id: 'checkbox-and-radio',
    title: 'Options on a bar',
    note: 'A View menu of toggles and a choice, which stay open as they are changed — the bar keeps its menu while the reader turns three things on.',
    snippet: defineSnippet({
      id: 'menubar-react-checkbox-and-radio',
      language: 'tsx',
      label: 'Options that keep the menu open',
      source: `<MenuContent>
  <MenuCheckboxItem defaultChecked>Rulers</MenuCheckboxItem>
  <MenuRadioGroup defaultValue="fit">
    <MenuRadioItem value="fit">Fit</MenuRadioItem>
  </MenuRadioGroup>
</MenuContent>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Orientation',
    note: 'A sidebar of commands is a vertical menubar: the arrow pairs exchange places, the menus open beside the bar, and aria-orientation says so.',
    snippet: defineSnippet({
      id: 'menubar-react-orientation',
      language: 'tsx',
      label: 'The same bar, turned',
      source: `<Menubar aria-label="Workspace" orientation="vertical">
  <Menu value="project">…</Menu>
</Menubar>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'The trigger whose menu is open keeps its highlight, a disabled trigger stays focusable and opens nothing, and a disabled bar disables every menu on it.',
    snippet: defineSnippet({
      id: 'menubar-react-states',
      language: 'tsx',
      label: 'Open, disabled, and a bar out of action',
      source: `<Menubar aria-label="Main" disabled={saving}>
  <Menu disabled value="window">
    <MenuTrigger>Window</MenuTrigger>
    <MenuContent>…</MenuContent>
  </Menu>
</Menubar>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches the bar once and lands where it was left; the inline arrows move between triggers and switch menus while one is open; typing jumps to a menu by name.',
    snippet: defineSnippet({
      id: 'menubar-react-keyboard',
      language: 'tsx',
      label: 'One tab stop, and the pattern for the rest',
      source: `<Menubar aria-label="Main" loop typeahead>
  <Menu value="file">…</Menu>
</Menubar>;`,
    }),
  },
  {
    id: 'composition',
    title: 'In context',
    note: 'An application header: the bar sits beside a logo and an account control, paints no ground of its own, and takes its size from the provider once.',
    snippet: defineSnippet({
      id: 'menubar-react-composition',
      language: 'tsx',
      label: 'A bar in a header, sized once',
      source: `<MenubarDefaultsProvider size="sm">
  <header>
    <strong>Acme</strong>
    <Menubar aria-label="Main">…</Menubar>
  </header>
</MenubarDefaultsProvider>;`,
    }),
  },
];

const api = apiRows([
  [
    'value',
    'string | undefined',
    '—',
    'Menubar',
    'The menu now open, named by its own value. A bar has at most one, so the state is that name rather than a boolean on each menu.',
  ],
  [
    'defaultValue',
    'string',
    '—',
    'Menubar',
    'The menu an uncontrolled bar starts with open, read once.',
  ],
  [
    'onValueChange',
    '(value, request) => void',
    '—',
    'Menubar',
    'Asked before the bar moves to another menu, with the reason and the event, and refusable.',
  ],
  [
    'orientation',
    "'horizontal' | 'vertical'",
    'horizontal',
    'Menubar',
    'Which way the bar runs. A vertical bar swaps the two arrow pairs and writes aria-orientation.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Menubar',
    'The step every trigger and every menu on the bar takes.',
  ],
  ['loop', 'boolean', 'true', 'Menubar', 'Whether the arrows wrap past the ends of the bar.'],
  [
    'typeahead',
    'boolean',
    'true',
    'Menubar',
    'Whether typing moves to the trigger whose label begins with it.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'Menubar',
    'A disabled bar opens no menu, and every menu on it reads the same answer.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'Menubar',
    "Renders the consumer's own element as the bar, with the role, the state and the keyboard on it.",
  ],
]);

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: MenubarChangeRequest)',
    when: 'Before the bar opens another menu or closes the one it has. The request carries pointer, keyboard, escape, outsidePress, select, dismiss or programmatic, the originating event, and cancel().',
  },
];

const composition = apiRows([
  [
    'MenubarDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets the orientation, the size, the wrapping and the typeahead once for a subtree. A bar that states one itself still wins.',
  ],
  [
    'Menu',
    'component',
    '—',
    'Inside a Menubar',
    'The menus on a bar are the menu family unchanged: every capability it has — submenus, options, shortcuts, tone — reaches the bar without a second API.',
  ],
  [
    'value',
    'prop',
    '—',
    'Menu',
    'The name a menu answers to on the bar. A consumer controlling the bar names its menus; on its own a menu needs none.',
  ],
  [
    'ref',
    'prop',
    '—',
    'Menubar',
    'A handle carrying focus() and close(), for an application that opens its own menus from a shortcut.',
  ],
  [
    'native props',
    'attributes',
    '—',
    'Menubar',
    "Anything a div takes reaches the bar, and a consumer's own onKeyDown runs before the family's rather than instead of it.",
  ],
]);

const accessibility = [
  'The platform supplies each trigger: it is a native button, so the press and the two keys are the browser\'s own. role="menuitem" replaces role="button", because on a bar the control is an item of a composite widget rather than a button in a row.',
  "The family supplies the bar's keyboard, as the WAI-ARIA menu and menubar pattern describes it: one tab stop for the whole bar, arrows along its own axis with wrapping, Home and End at the ends, typeahead by name, and — from inside an open menu — the inline arrows closing it and opening the neighbouring one with focus left on the trigger.",
  'The bar has no name of its own to invent, so the consumer gives it one: aria-label on the bar, which is what a reader hears before the first trigger.',
  'A disabled trigger stays focusable and takes aria-disabled rather than the native attribute, so a reader can find a menu that is currently unavailable instead of walking past a gap in the bar.',
];

const code = defineSnippet({
  id: 'menubar-react-code',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="menubar"
  data-part="root"
  role="menubar"
  aria-label="Main"
  data-orientation="horizontal"
  data-size="md"
>
  <button
    data-part="trigger"
    role="menuitem"
    type="button"
    aria-haspopup="menu"
    aria-expanded="false"
    tabindex="0"
  >
    File
  </button>
  <button
    data-part="trigger"
    role="menuitem"
    type="button"
    aria-haspopup="menu"
    aria-expanded="true"
    data-open
    tabindex="-1"
  >
    Edit
  </button>
</div>;`,
});

const theming = defineSnippet({
  id: 'menubar-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='menubar'] {
  --slotted-menubar-gap: var(--slotted-space-2);
  --slotted-menubar-highlight: var(--slotted-tone-accent-surface);
  --slotted-menubar-trigger-radius: var(--slotted-radius-md);
}`,
});

export const REACT_MENUBAR_DOCS = {
  menubar: {
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
