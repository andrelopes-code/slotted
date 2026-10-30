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

export const ANGULAR_MENUBAR_TOKENS = menubarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Menubar decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlMenubar, provideMenubarDefaults } from '@slotted/angular/menubar';\nimport { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';",
  selector: 'sl-menubar',
  exportAs: 'slMenubar',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-menubar',
    required: true,
    purpose:
      'The bar. It carries data-ui="menubar", role="menubar", its orientation and its size, holds one tab stop for every trigger on it, and paints no ground of its own — the header it sits in owns that.',
  },
  {
    part: 'trigger',
    element: "the consumer's control carrying slMenuTriggerFor",
    required: true,
    purpose:
      'One menu\'s control, as role="menuitem". The directive writes the part and the role once it finds a bar in scope: the menus on a bar are the menu family unchanged, so the bar declares no other part.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A bar of three menus, driven by the controls under the canvas. Change the orientation and the size, and the menus follow the bar rather than being told twice.',
    snippet: defineSnippet({
      id: 'menubar-angular-playground',
      language: 'angular',
      label: 'A bar, and the menus on it',
      source: `<sl-menubar aria-label="Main">
  <button [slMenuTriggerFor]="file">File</button>
  <sl-menu #file value="file">
    <button slMenuItem shortcut="Mod+N">New</button>
  </sl-menu>
</sl-menubar>`,
    }),
  },
  {
    id: 'bar',
    title: 'The bar',
    note: 'Three menus in a header. Pressing one opens it; with one open, moving the pointer along the bar switches menus without another press.',
    snippet: defineSnippet({
      id: 'menubar-angular-bar',
      language: 'angular',
      label: 'The menu family, unchanged, on a bar',
      source: `<sl-menubar aria-label="Main" [(value)]="openMenu">
  <button [slMenuTriggerFor]="file">File</button>
  <sl-menu #file value="file">…</sl-menu>
</sl-menubar>`,
    }),
  },
  {
    id: 'submenus',
    title: 'Submenus',
    note: "A bar's menu holds submenus like any other menu, and the inline arrows still move between the bar's own menus once the submenu has closed.",
    snippet: defineSnippet({
      id: 'menubar-angular-submenus',
      language: 'angular',
      label: 'A menu inside a menu, on a bar',
      source: `<sl-menu #file value="file">
  <button slMenuItem>New</button>
  <button slMenuItem [slMenuTriggerFor]="exportAs">Export as</button>
  <sl-menu #exportAs>
    <button slMenuItem>PDF</button>
  </sl-menu>
</sl-menu>`,
    }),
  },
  {
    id: 'checkbox-and-radio',
    title: 'Options on a bar',
    note: 'A View menu of toggles and a choice, which stay open as they are changed — the bar keeps its menu while the reader turns three things on.',
    snippet: defineSnippet({
      id: 'menubar-angular-checkbox-and-radio',
      language: 'angular',
      label: 'Options that keep the menu open',
      source: `<sl-menu #view value="view">
  <button slMenuCheckboxItem [checked]="true">Rulers</button>
  <sl-menu-radio-group value="fit">
    <button slMenuRadioItem value="fit">Fit</button>
  </sl-menu-radio-group>
</sl-menu>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Orientation',
    note: 'A sidebar of commands is a vertical menubar: the arrow pairs exchange places, the menus open beside the bar, and aria-orientation says so.',
    snippet: defineSnippet({
      id: 'menubar-angular-orientation',
      language: 'angular',
      label: 'The same bar, turned',
      source: `<sl-menubar aria-label="Workspace" orientation="vertical">
  <button [slMenuTriggerFor]="project">Project</button>
  <sl-menu #project value="project">…</sl-menu>
</sl-menubar>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'The trigger whose menu is open keeps its highlight, a disabled trigger stays focusable and opens nothing, and a disabled bar disables every menu on it.',
    snippet: defineSnippet({
      id: 'menubar-angular-states',
      language: 'angular',
      label: 'Open, disabled, and a bar out of action',
      source: `<sl-menubar aria-label="Main" [disabled]="saving()">
  <button [slMenuTriggerFor]="window">Window</button>
  <sl-menu #window value="window" [disabled]="true">…</sl-menu>
</sl-menubar>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches the bar once and lands where it was left; the inline arrows move between triggers and switch menus while one is open; typing jumps to a menu by name.',
    snippet: defineSnippet({
      id: 'menubar-angular-keyboard',
      language: 'angular',
      label: 'One tab stop, and the pattern for the rest',
      source: `<sl-menubar aria-label="Main" [loop]="true" [typeahead]="true">
  <button [slMenuTriggerFor]="file">File</button>
  <sl-menu #file value="file">…</sl-menu>
</sl-menubar>`,
    }),
  },
  {
    id: 'composition',
    title: 'In context',
    note: 'An application header: the bar sits beside a logo and an account control, paints no ground of its own, and takes its size from the provider once.',
    snippet: defineSnippet({
      id: 'menubar-angular-composition',
      language: 'ts',
      label: 'A bar in a header, sized once',
      source: `bootstrapApplication(App, { providers: [provideMenubarDefaults({ size: 'sm' })] });`,
    }),
  },
];

const api = apiRows([
  [
    'value',
    'model<string | undefined>',
    '—',
    'sl-menubar',
    'The menu now open, named by its own value. A model, so [(value)] is both the value and the write-back; a bar has at most one open menu, so the state is that name rather than a boolean on each.',
  ],
  [
    'orientation',
    "'horizontal' | 'vertical'",
    'horizontal',
    'sl-menubar',
    'Which way the bar runs. A vertical bar swaps the two arrow pairs and writes aria-orientation.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-menubar',
    'The step every trigger and every menu on the bar takes.',
  ],
  ['loop', 'boolean', 'true', 'sl-menubar', 'Whether the arrows wrap past the ends of the bar.'],
  [
    'typeahead',
    'boolean',
    'true',
    'sl-menubar',
    'Whether typing moves to the trigger whose label begins with it.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-menubar',
    'A disabled bar opens no menu, and every menu on it reads the same answer.',
  ],
  [
    'aria-label',
    'string',
    '—',
    'sl-menubar',
    'Names the bar. The role has no name of its own to invent, so the consumer gives it one.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'string | undefined',
    when: 'After the bar has opened another menu or closed the one it had, as the write-back half of [(value)].',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string>',
    when: 'Before the bar moves. It carries pointer, keyboard, escape, outsidePress, select, dismiss or programmatic, the originating event, and cancel().',
  },
];

const composition = apiRows([
  [
    'provideMenubarDefaults',
    'provider',
    '—',
    'Application',
    'Sets the orientation, the size, the wrapping and the typeahead once, in the bootstrap or on a route. A bar that states one itself still wins.',
  ],
  [
    'SlMenu',
    'component',
    '—',
    'Inside sl-menubar',
    'The menus on a bar are the menu family unchanged: every capability it has — submenus, options, shortcuts, tone — reaches the bar without a second API.',
  ],
  [
    'MENUBAR_SURFACE',
    'injection token',
    '—',
    'sl-menubar',
    "What the bar provides and a menu reads: the open menu's name, the orientation, the size and the two keys that move between menus. The menu entry point declares it, so the dependency runs one way.",
  ],
  [
    'exportAs',
    'template reference',
    '—',
    'sl-menubar',
    'A template reaches the bar — #bar="slMenubar" — for step() and the resolved axes.',
  ],
  [
    'ng-content',
    'projection',
    '—',
    'sl-menubar',
    "The triggers and the menus are the consumer's own elements, in the order the bar reads them.",
  ],
]);

const accessibility = [
  'The platform supplies each trigger: it is the consumer\'s own button, so the press and the two keys are the browser\'s own. role="menuitem" replaces role="button", because on a bar the control is an item of a composite widget rather than a button in a row.',
  "The family supplies the bar's keyboard, as the WAI-ARIA menu and menubar pattern describes it: one tab stop for the whole bar, arrows along its own axis with wrapping, Home and End at the ends, typeahead by name, and — from inside an open menu — the inline arrows closing it and opening the neighbouring one with focus left on the trigger.",
  'The bar has no name of its own to invent, so the consumer gives it one with aria-label, which is what a reader hears before the first trigger.',
  'A disabled trigger stays focusable and takes aria-disabled rather than the native attribute, so a reader can find a menu that is currently unavailable instead of walking past a gap in the bar.',
];

const code = defineSnippet({
  id: 'menubar-angular-code',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<sl-menubar
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
</sl-menubar>`,
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

export const ANGULAR_MENUBAR_DOCS = {
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
