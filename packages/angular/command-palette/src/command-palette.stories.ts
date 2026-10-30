import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlHighlight } from '@slotted/angular/highlight';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlKbd } from '@slotted/angular/kbd';
import { SlPopover } from '@slotted/angular/popover';
import { SlPopoverContent, SlPopoverLayer, SlPopoverTrigger } from '@slotted/angular/popover';
import { SlTextField } from '@slotted/angular/text-field';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlCommandPalette,
  SlCommandPaletteEmpty,
  SlCommandPaletteFooter,
  SlCommandPaletteItem,
  SlCommandPaletteTrigger,
} from './command-palette';
import { provideCommandPaletteDefaults } from './command-palette-defaults';
import type { CommandPaletteItem } from './command-palette-defaults';
import {
  ANGULAR_COMMAND_PALETTE_DOCS,
  ANGULAR_COMMAND_PALETTE_TOKENS,
} from './command-palette.docs';

interface CommandPaletteStoryArgs {
  pictured: boolean;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_COMMAND_PALETTE_DOCS.commandPalette.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    groups: Groups,
    ranking: Ranking,
    pages: Pages,
    recent: Recent,
    shortcuts: Shortcuts,
    destinations: Destinations,
    async: Async,
    loading: Loading,
    empty: Empty,
    inline: Inline,
    sizes: Sizes,
    states: States,
    content: Content,
    hotkey: Hotkey,
    defaults: Defaults,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

/* ── The product: a deployment console ────────────────────────────────── */

const GROUPS = [
  { id: 'nav', label: 'Go to' },
  { id: 'actions', label: 'Actions' },
];

const TEAMS: CommandPaletteItem[] = [
  { id: 'acme', label: 'Acme Robotics', description: '14 members' },
  { id: 'globex', label: 'Globex Freight', description: '6 members' },
  { id: 'initech', label: 'Initech Studio', description: 'You are the owner' },
];

const ITEMS: CommandPaletteItem[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    description: '14 unread',
    group: 'nav',
    shortcut: 'g i',
    keywords: ['mail', 'notifications'],
  },
  { id: 'projects', label: 'Projects', group: 'nav', shortcut: 'g p', href: '#projects' },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace, members and billing',
    group: 'nav',
    shortcut: 'mod+,',
  },
  { id: 'team', label: 'Switch team…', description: '3 teams', group: 'nav', children: TEAMS },
  {
    id: 'deploy',
    label: 'Deploy to production',
    description: 'Ship the current release of api-gateway',
    group: 'actions',
    shortcut: 'mod+shift+d',
    keywords: ['ship', 'release'],
  },
  { id: 'deploy-staging', label: 'Deploy to staging', group: 'actions', keywords: ['ship'] },
  {
    id: 'rollback',
    label: 'Roll back deployment',
    description: 'Restore the previous release',
    group: 'actions',
  },
  { id: 'new-project', label: 'New project', group: 'actions', shortcut: 'mod+n' },
  { id: 'theme', label: 'Toggle dark mode', shortcut: 'mod+shift+l' },
  {
    id: 'delete',
    label: 'Delete workspace',
    description: 'Requires the owner role',
    disabled: true,
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const PROPS = {
  groups: GROUPS,
  items: ITEMS,
  teams: TEAMS,
  reversed: [...GROUPS].reverse(),
  withShortcuts: ITEMS.filter((item) => item.shortcut !== undefined),
  few: ITEMS.slice(0, 4),
  destinations: [
    { id: 'projects', label: 'Projects', href: '#projects', meta: 'Page' },
    { id: 'billing', label: 'Billing', href: '#billing', meta: 'Page' },
    { id: 'invoice', label: 'Download last invoice' },
  ] satisfies CommandPaletteItem[],
  slow: [
    { id: 'restart', label: 'Restart api-gateway', onSelect: () => wait(2000) },
    {
      id: 'purge',
      label: 'Purge CDN cache',
      onSelect: () => Promise.reject(new Error('Not allowed for this role')),
    },
    { id: 'logs', label: 'Open logs' },
  ] satisfies CommandPaletteItem[],
  states: [
    { id: 'rest', label: 'At rest', shortcut: 'mod+1' },
    { id: 'current', label: 'Current, from the keyboard', shortcut: 'mod+2' },
    {
      id: 'busy',
      label: 'Running… the handler has not answered',
      shortcut: 'mod+3',
      onSelect: () => new Promise<void>(() => {}),
    },
    {
      id: 'disabled',
      label: 'Disabled, kept in place and announced',
      shortcut: 'mod+4',
      disabled: true,
    },
    { id: 'page', label: 'Opens a page', children: TEAMS },
    { id: 'link', label: 'A destination, rendered as a link', href: '#inbox', meta: 'Page' },
  ] satisfies CommandPaletteItem[],
  german: [
    {
      id: 'sync',
      label: 'Benachrichtigungseinstellungen für alle Arbeitsbereiche und Teams synchronisieren',
      description:
        'Eine sehr lange Beschreibung, die abgeschnitten werden muss, weil sie sonst drei Zeilen einnehmen würde',
      group: 'admin',
      shortcut: 'mod+shift+alt+p',
    },
    {
      id: 'pipeline',
      label: 'Supercalifragilisticexpialidocious-Bereitstellungspipeline',
      group: 'admin',
      meta: 'Empfohlen',
    },
    { id: 'go', label: 'Go', group: 'admin', shortcut: 'g' },
    {
      id: 'review',
      label: 'Sicherheitsüberprüfung',
      description: 'Kurz',
      group: 'admin',
      shortcut: 'mod+k',
    },
  ] satisfies CommandPaletteItem[],
  germanGroups: [{ id: 'admin', label: 'Verwaltung' }],
  portugueseGroups: [
    { id: 'nav', label: 'Go to' },
    { id: 'actions', label: 'Actions' },
  ],
  recent: ['deploy', 'inbox'] as readonly string[],
};

export const COMMAND_PALETTE_IMPORTS = [
  SlCommandPalette,
  SlCommandPaletteTrigger,
  SlCommandPaletteItem,
  SlCommandPaletteFooter,
  SlCommandPaletteEmpty,
  SlAvatar,
  SlButton,
  SlHighlight,
  SlKbd,
  SlPopover,
  SlPopoverTrigger,
  SlPopoverLayer,
  SlPopoverContent,
  SlTextField,
];

const meta: Meta<CommandPaletteStoryArgs> = {
  title: 'Components/Command palette',
  decorators: [moduleMetadata({ imports: COMMAND_PALETTE_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Command palette',
        description:
          'A search that executes. A combobox whose list is always visible, inside a dialog opened by ⌘K — or in line, inside whatever the product puts it in — ranking commands and destinations by the locale’s own comparison, with pages, recents, shortcuts drawn for the platform and a live count.',
        framework: 'Angular',
        ...ANGULAR_COMMAND_PALETTE_DOCS.commandPalette,
        tokens: ANGULAR_COMMAND_PALETTE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<CommandPaletteStoryArgs>;

/**
 * Where an operated palette opens. In the story view the layer opens inside
 * the demo box; on the docs page the box is a bar holding the trigger and the
 * palette opens over the page itself, as it does in an application, rather
 * than in a tall empty canvas waiting for a click.
 */
const layer = (body: string) =>
  `<div class="slotted-demo-viewport" [attr.data-size]="pictured ? 'tall' : null" #box>${body}</div>`;

const scene = (label: string, note: string, body: string, layout = 'block') =>
  `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, body: string) =>
  `<div class="slotted-demo-grid" data-columns="${columns}">${body}</div>`;

/** An inline panel, the shape most scenes take. */
const panel = (attributes = '', content = '') =>
  `<sl-command-palette presentation="inline" [groups]="groups" [items]="items" ${attributes}>${content}</sl-command-palette>`;

const render = (template: string, props: Record<string, unknown> = {}) => ({
  props: { ...PROPS, ...props },
  template,
});

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) =>
    render(
      grid(
        1,
        scene(
          'Open it',
          'The trigger, or ⌘K with the page focused. In an application the layer covers the viewport; here the box stands in for it.',
          layer(`<button slButton [slCommandPaletteTrigger]="palette" type="button">Search commands</button>
            <sl-command-palette #palette="slCommandPalette" [container]="pictured ? box : undefined" [open]="pictured" [groups]="groups" [items]="items" />`),
        ),
      ),
      { pictured: isolated(context) },
    ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Header, list, status, footer',
          'The mark and the field in the header; the grouped rows under it, the current one ringed; the count in a hidden status row; the keys the family answers in the footer.',
          panel(`[recent]="['deploy']"`),
        ),
      ),
    ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Declared order',
          'Go to before Actions, as groups says; Toggle dark mode has no group and closes the list.',
          panel('hideFooter'),
        ) +
          scene(
            'The other order',
            'The same items with the groups reversed: nothing about an item changed, only the order the product declared.',
            `<sl-command-palette presentation="inline" hideFooter [groups]="reversed" [items]="items" />`,
          ),
      ),
    ),
};

export const Ranking: Story = {
  parameters: scenario('ranking'),
  render: () =>
    render(
      grid(
        1,
        scene(
          '“dep”',
          'Deploy starts with it, so it leads; “deployment” inside Roll back is a word start; Actions rises above Go to because its best row scored higher.',
          panel('hideFooter query="dep"'),
        ) +
          scene(
            '“ship”, a keyword',
            'No label holds it. Two rows carry it as a keyword and answer one step below any label match, in the order they were written.',
            panel('hideFooter query="ship"'),
          ) +
          scene(
            '[rank]="null"',
            'A server ranked these already: the rows come back exactly as given, whatever was typed, and nothing is marked.',
            panel('hideFooter query="zzz" [rank]="null"'),
          ),
      ),
    ),
};

export const Pages: Story = {
  parameters: scenario('pages'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'A row that opens a page',
          'Switch team… carries the chevron. Enter or a click opens its children, and the footer gains the Backspace hint.',
          panel('highlightedId="team"'),
        ) +
          scene(
            'Inside the page',
            'The trail names where the reader is; pressing it, Backspace on an empty query, or Escape returns to the root.',
            panel(`[pages]="['team']" [messages]="{ placeholder: 'Search teams…' }"`),
          ),
      ),
    ),
};

export const Recent: Story = {
  parameters: scenario('recent'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Run a row, watch it move to the front',
          'Two recents open the list. Run any row and it becomes the first recent; recentLimit of three keeps the group short.',
          panel('[(recent)]="recent" [recentLimit]="3" [closeOnSelect]="false"'),
        ),
      ),
    ),
};

export const Shortcuts: Story = {
  parameters: scenario('shortcuts'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'One notation, the reader’s keyboard',
          'mod+shift+d, mod+, and g i as written; the caps are kbd’s plain variant at the row’s own step, and the chords are announced on the row.',
          `<sl-command-palette presentation="inline" hideFooter [groups]="groups" [items]="withShortcuts" />`,
        ),
      ),
    ),
};

export const Destinations: Story = {
  parameters: scenario('destinations'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Places and actions in one list',
          'Projects and Billing are links — inspect them — and Download is a handler. Enter follows the link; ⌘Enter opens a tab.',
          `<sl-command-palette presentation="inline" [items]="destinations" />`,
        ),
      ),
    ),
};

export const Async: Story = {
  parameters: scenario('async'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Restart takes two seconds; Purge is refused',
          'Run Restart: the row shows the ring, a second Enter does nothing, and the palette closes when it resolves. Run Purge: it stays open and the status row says why.',
          `<sl-command-palette presentation="inline" [items]="slow" />`,
        ),
      ),
    ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Nothing yet',
          'The ring where the magnifier was, three ragged skeleton rows the height of a row, and “Loading…” in the status row.',
          `<sl-command-palette presentation="inline" loading query="dep" [items]="[]" />`,
        ) +
          scene(
            'Refreshing what is there',
            'The ring alone: rows that already arrived stay where they are, so nothing jumps when the answer lands.',
            panel('loading query="dep"'),
          ),
      ),
    ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'messages.empty',
          'The family’s sentence, centerd in the list, with the clear control drawn because there is a query to clear.',
          panel('query="xylophone"'),
        ) +
          scene(
            'ng-template[slCommandPaletteEmpty]',
            'The product’s own template in the same place, saying what a reader might type instead.',
            panel(
              'query="xylophone"',
              `<ng-template slCommandPaletteEmpty><span>No command matches. Try a service name, such as api-gateway.</span></ng-template>`,
            ),
          ),
      ),
    ),
};

export const Inline: Story = {
  parameters: scenario('inline'),
  render: (_args, context) =>
    render(
      grid(
        1,
        scene(
          'Assign to…',
          'A popover holding the panel: no scrim, no hotkey, no Escape to close, and the footer removed. Arrow through the people and Enter to assign.',
          `<div class="slotted-demo-viewport" data-place="top" data-size="tall">
            <ng-container slPopover [portal]="false" [open]="true" [closeOnOutsidePress]="pictured">
              <button slButton slPopoverTrigger type="button">Assign to…</button>
              <ng-template slPopoverLayer>
                <div slPopoverContent aria-label="Assign to">
                  <sl-command-palette presentation="inline" hideFooter [messages]="{ placeholder: 'Search people…' }" [items]="teams" />
                </div>
              </ng-template>
            </ng-container>
          </div>`,
        ),
      ),
      { pictured: isolated(context) },
    ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'sm',
          'Small rows, a medium header. The measure inside a dialog would be twenty-four rems.',
          `<sl-command-palette presentation="inline" size="sm" [groups]="groups" [items]="few" />`,
        ) +
          scene(
            'lg',
            'Large rows, and a header that takes its type from the text scale because control geometry stops at lg.',
            `<sl-command-palette presentation="inline" size="lg" [groups]="groups" [items]="few" />`,
          ),
      ),
    ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Six rows, six states',
          'Hover the rows that are not current for the wash; run the third row and it stays busy, because its handler never settles; the disabled row is skipped by the arrows and answers no click.',
          `<sl-command-palette presentation="inline" highlightedId="current" [items]="states" />`,
        ),
      ),
    ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Long, translated, unbroken',
          'The label is cut with an ellipsis and survives whole on the row’s title; the description likewise; the four-key binding keeps its column; the short row still lines up.',
          `<sl-command-palette presentation="inline" query="ver" [groups]="germanGroups" [items]="german" />`,
        ),
      ),
    ),
};

export const Hotkey: Story = {
  parameters: scenario('hotkey'),
  render: (_args, context) =>
    render(
      grid(
        1,
        scene(
          'mod+k, the default',
          'Click the box to focus the page, then press ⌘K or Ctrl+K. Press it again while open and the field takes focus with the query selected.',
          layer(`<button slButton tone="secondary" variant="outline" [slCommandPaletteTrigger]="a" type="button">Search</button>
            <sl-command-palette #a="slCommandPalette" [container]="pictured ? box : undefined" [open]="pictured" [items]="items" />`),
        ) +
          scene(
            '/, a bare key',
            'Press / with nothing focused and it opens; press / inside the text field and it types a slash, because a key without a modifier stays quiet in an editable target.',
            layer(`<input slTextField aria-label="Notes" placeholder="Type / here" />
            <button slButton tone="secondary" variant="outline" [slCommandPaletteTrigger]="b" type="button">Search</button>
            <sl-command-palette #b="slCommandPalette" hotkey="/" [container]="pictured ? box : undefined" [items]="items" />`),
          ),
      ),
      { pictured: isolated(context) },
    ),
};

export const Defaults: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        provideSlotted({ locale: 'pt-BR' }),
        provideCommandPaletteDefaults({ size: 'sm' }),
      ],
    }),
  ],
  parameters: scenario('defaults'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Portuguese, from the providers',
          'Nothing on the panel states a word or a size; provideSlotted gives the language and the defaults provider the size, once, for every palette under them.',
          `<sl-command-palette presentation="inline" [groups]="portugueseGroups" [items]="items" [recent]="['inbox']" />`,
        ),
      ),
    ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) =>
    render(
      grid(
        1,
        scene(
          'A top bar’s search, and rows with avatars',
          'The trigger is a slButton with a kbd inside, carrying slCommandPaletteTrigger; the rows are an item template’s, an avatar standing in the icon column and the marked label beside it.',
          layer(`<button slButton tone="secondary" variant="outline" [slCommandPaletteTrigger]="p" type="button">
              Search people <kbd slKbd size="sm">⌘K</kbd>
            </button>
            <sl-command-palette #p="slCommandPalette" [messages]="{ label: 'People', input: 'Search people', placeholder: 'Search people…' }" [container]="pictured ? box : undefined" [open]="pictured" [items]="teams">
              <ng-template slCommandPaletteItem let-item let-query="query">
                <span data-part="icon" data-part-icon=""><span slAvatar [name]="item.label" size="xs"></span></span>
                <span data-part="label" data-part-label=""><span slHighlight [text]="item.label" [query]="query"></span></span>
                @if (item.description) {
                  <span data-part="description" data-part-description="">{{ item.description }}</span>
                }
              </ng-template>
            </sl-command-palette>`),
        ),
      ),
      { pictured: isolated(context) },
    ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Click the field and drive it',
          'ArrowDown from the last row wraps; PageDown stops at the end; Ctrl+End reaches it; Home moves the caret; Enter runs; Escape clears the query first.',
          panel('query="e" [closeOnSelect]="false"'),
        ),
      ),
    ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () =>
    render(
      grid(
        1,
        scene(
          'Two names, one live region',
          'The field is named Search deployments and the list borrows it; the current row is aria-selected and named by aria-activedescendant; the hidden status row holds the count.',
          panel(`[messages]="{ label: 'Deployment commands', input: 'Search deployments' }"`),
        ),
      ),
    ),
};
