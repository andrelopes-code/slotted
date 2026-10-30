import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Layer } from '../dialog/dialog-demo';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Kbd } from '../kbd';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { TextField } from '../text-field';
import { CommandPalette, CommandPaletteTrigger } from './command-palette';
import { CommandPaletteDefaultsProvider } from './command-palette-defaults';
import { REACT_COMMAND_PALETTE_DOCS, REACT_COMMAND_PALETTE_TOKENS } from './command-palette.docs';
import type { CommandPaletteItem, CommandPaletteProps } from './command-palette.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_COMMAND_PALETTE_DOCS.commandPalette.scenes, {
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

const meta = {
  title: 'Components/Command palette',
  component: CommandPalette,
  /* `items` is required, and every scene brings its own; the meta states the
     empty list so a story without args is still a story. */
  args: { items: [] as CommandPaletteItem[] },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Command palette',
        description:
          'A search that executes. A combobox whose list is always visible, inside a dialog opened by ⌘K — or in line, inside whatever the product puts it in — ranking commands and destinations by the locale’s own comparison, with pages, recents, shortcuts drawn for the platform and a live count.',
        framework: 'React',
        ...REACT_COMMAND_PALETTE_DOCS.commandPalette,
        tokens: REACT_COMMAND_PALETTE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── The product: a deployment console ────────────────────────────────── */

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  rocket: (
    <Glyph>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </Glyph>
  ),
  folder: (
    <Glyph>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </Glyph>
  ),
  inbox: (
    <Glyph>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Glyph>
  ),
  settings: (
    <Glyph>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07-1.41 1.41M8.34 15.66l-1.41 1.41m0-10.14 1.41 1.41m7.32 7.32 1.41 1.41" />
    </Glyph>
  ),
  user: (
    <Glyph>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </Glyph>
  ),
  plus: (
    <Glyph>
      <path d="M5 12h14M12 5v14" />
    </Glyph>
  ),
  moon: (
    <Glyph>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Glyph>
  ),
  trash: (
    <Glyph>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </Glyph>
  ),
};

const GROUPS = [
  { id: 'nav', label: 'Go to' },
  { id: 'actions', label: 'Actions' },
];

const TEAMS: CommandPaletteItem[] = [
  { id: 'acme', label: 'Acme Robotics', description: '14 members', icon: ICONS.user },
  { id: 'globex', label: 'Globex Freight', description: '6 members', icon: ICONS.user },
  { id: 'initech', label: 'Initech Studio', description: 'You are the owner', icon: ICONS.user },
];

const ITEMS: CommandPaletteItem[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    description: '14 unread',
    group: 'nav',
    icon: ICONS.inbox,
    shortcut: 'g i',
    keywords: ['mail', 'notifications'],
  },
  {
    id: 'projects',
    label: 'Projects',
    group: 'nav',
    icon: ICONS.folder,
    shortcut: 'g p',
    href: '#projects',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Workspace, members and billing',
    group: 'nav',
    icon: ICONS.settings,
    shortcut: 'mod+,',
  },
  {
    id: 'team',
    label: 'Switch team…',
    description: '3 teams',
    group: 'nav',
    icon: ICONS.user,
    children: TEAMS,
  },
  {
    id: 'deploy',
    label: 'Deploy to production',
    description: 'Ship the current release of api-gateway',
    group: 'actions',
    icon: ICONS.rocket,
    shortcut: 'mod+shift+d',
    keywords: ['ship', 'release'],
  },
  {
    id: 'deploy-staging',
    label: 'Deploy to staging',
    group: 'actions',
    icon: ICONS.rocket,
    keywords: ['ship'],
  },
  {
    id: 'rollback',
    label: 'Roll back deployment',
    description: 'Restore the previous release',
    group: 'actions',
    icon: ICONS.rocket,
  },
  {
    id: 'new-project',
    label: 'New project',
    group: 'actions',
    icon: ICONS.plus,
    shortcut: 'mod+n',
  },
  { id: 'theme', label: 'Toggle dark mode', icon: ICONS.moon, shortcut: 'mod+shift+l' },
  {
    id: 'delete',
    label: 'Delete workspace',
    description: 'Requires the owner role',
    icon: ICONS.trash,
    disabled: true,
  },
];

/** An inline panel on a stage, the shape most scenes take. */
function Panel(props: Partial<CommandPaletteProps>) {
  return <CommandPalette groups={GROUPS} items={ITEMS} presentation="inline" {...props} />;
}

/**
 * Where an operated palette opens. In the story view the layer opens inside
 * the demo box, so the picture is a panel in a scene; on the docs page there
 * is no box — the trigger stands in a bar and the palette opens over the page
 * itself, which is what it does in an application, rather than in a tall
 * empty canvas waiting for a click.
 */
function Operated({
  children,
  pictured,
}: {
  children: (container: Element | undefined) => ReactNode;
  pictured: boolean;
}) {
  if (pictured) return <Layer>{(container) => children(container)}</Layer>;
  return (
    <div className="slotted-demo-viewport">
      <div className="slotted-demo-row">{children(undefined)}</div>
    </div>
  );
}

const layerProps = (container: Element | undefined) =>
  container === undefined ? {} : { container };

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => (
    <Grid columns={1}>
      <Scene
        label="Open it"
        note="The trigger, or ⌘K with the page focused. In an application the layer covers the viewport; here the box stands in for it."
      >
        <Operated pictured={isolated(context)}>
          {(container) => (
            <CommandPalette
              {...layerProps(container)}
              defaultOpen={isolated(context)}
              groups={GROUPS}
              items={ITEMS}
            >
              <CommandPaletteTrigger
                render={(props) => <Button {...props}>Search commands</Button>}
              />
            </CommandPalette>
          )}
        </Operated>
      </Scene>
    </Grid>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Header, list, status, footer"
        note="The mark and the field in the header; the grouped rows under it, the current one ringed; the count in a hidden status row; the keys the family answers in the footer."
      >
        <Panel defaultRecent={['deploy']} />
      </Scene>
    </Grid>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Declared order"
        note="Go to before Actions, as groups says; Toggle dark mode has no group and closes the list."
      >
        <Panel footer={null} />
      </Scene>
      <Scene
        label="The other order"
        note="The same items with the groups reversed: nothing about an item changed, only the order the product declared."
      >
        <Panel footer={null} groups={[...GROUPS].reverse()} />
      </Scene>
    </Grid>
  ),
};

function Ranked({ query, ...props }: { query: string } & Partial<CommandPaletteProps>) {
  return <Panel defaultQuery={query} footer={null} {...props} />;
}

export const Ranking: Story = {
  parameters: scenario('ranking'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="“dep”"
        note="Deploy starts with it, so it leads; “deployment” inside Roll back is a word start; Actions rises above Go to because its best row scored higher."
      >
        <Ranked query="dep" />
      </Scene>
      <Scene
        label="“ship”, a keyword"
        note="No label holds it. Two rows carry it as a keyword and answer one step below any label match, in the order they were written."
      >
        <Ranked query="ship" />
      </Scene>
      <Scene
        label="rank={null}"
        note="A server ranked these already: the rows come back exactly as given, whatever was typed, and nothing is marked."
      >
        <Ranked query="zzz" rank={null} />
      </Scene>
    </Grid>
  ),
};

export const Pages: Story = {
  parameters: scenario('pages'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A row that opens a page"
        note="Switch team… carries the chevron. Enter or a click opens its children, and the footer gains the Backspace hint."
      >
        <Panel defaultHighlightedId="team" />
      </Scene>
      <Scene
        label="Inside the page"
        note="The trail names where the reader is; pressing it, Backspace on an empty query, or Escape returns to the root."
      >
        <Panel defaultPages={['team']} messages={{ placeholder: 'Search teams…' }} />
      </Scene>
    </Grid>
  ),
};

export const Recent: Story = {
  parameters: scenario('recent'),
  render: () => {
    const [recent, setRecent] = useState<readonly string[]>(['deploy', 'inbox']);
    return (
      <Grid columns={1}>
        <Scene
          label="Run a row, watch it move to the front"
          note="Two recents open the list. Run any row and it becomes the first recent; recentLimit={3} keeps the group short."
        >
          <Panel closeOnSelect={false} onRecentChange={setRecent} recent={recent} recentLimit={3} />
        </Scene>
      </Grid>
    );
  },
};

export const Shortcuts: Story = {
  parameters: scenario('shortcuts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One notation, the reader’s keyboard"
        note="mod+shift+d, mod+, and g i as written; the caps are kbd’s plain variant at the row’s own step, and the chords are announced on the row."
      >
        <Panel items={ITEMS.filter((item) => item.shortcut !== undefined)} footer={null} />
      </Scene>
    </Grid>
  ),
};

export const Destinations: Story = {
  parameters: scenario('destinations'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Places and actions in one list"
        note="Projects and Billing are links — inspect them — and Download is a handler. Enter follows the link; ⌘Enter opens a tab."
      >
        <Panel
          groups={[]}
          items={[
            {
              id: 'projects',
              label: 'Projects',
              href: '#projects',
              icon: ICONS.folder,
              meta: 'Page',
            },
            {
              id: 'billing',
              label: 'Billing',
              href: '#billing',
              icon: ICONS.settings,
              meta: 'Page',
            },
            { id: 'invoice', label: 'Download last invoice', icon: ICONS.inbox },
          ]}
        />
      </Scene>
    </Grid>
  ),
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const Async: Story = {
  parameters: scenario('async'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Restart takes two seconds; Purge is refused"
        note="Run Restart: the row shows the ring, a second Enter does nothing, and the palette closes when it resolves. Run Purge: it stays open and the status row says why."
      >
        <Panel
          groups={[]}
          items={[
            {
              id: 'restart',
              label: 'Restart api-gateway',
              icon: ICONS.rocket,
              onSelect: () => wait(2000),
            },
            {
              id: 'purge',
              label: 'Purge CDN cache',
              icon: ICONS.trash,
              onSelect: () => Promise.reject(new Error('Not allowed for this role')),
            },
            { id: 'logs', label: 'Open logs', icon: ICONS.folder },
          ]}
        />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Nothing yet"
        note="The ring where the magnifier was, three ragged skeleton rows the height of a row, and “Loading…” in the status row."
      >
        <Panel defaultQuery="dep" items={[]} loading />
      </Scene>
      <Scene
        label="Refreshing what is there"
        note="The ring alone: rows that already arrived stay where they are, so nothing jumps when the answer lands."
      >
        <Panel defaultQuery="dep" loading />
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="emptyLabel"
        note="The family’s sentence, centerd in the list, with the clear control drawn because there is a query to clear."
      >
        <Panel defaultQuery="xylophone" />
      </Scene>
      <Scene
        label="empty={…}"
        note="The product’s own node in the same place, saying what a reader might type instead."
      >
        <Panel
          defaultQuery="xylophone"
          empty={<span>No command matches. Try a service name, such as api-gateway.</span>}
        />
      </Scene>
    </Grid>
  ),
};

export const Inline: Story = {
  parameters: scenario('inline'),
  render: (_args, context) => (
    <Grid columns={1}>
      <Scene
        label="Assign to…"
        note="A popover holding the panel: no scrim, no hotkey, no Escape to close, and the footer removed. Arrow through the people and Enter to assign."
      >
        <div className="slotted-demo-viewport" data-place="top" data-size="tall">
          {/* Open in both views: the picture is the point, the popover is not
              modal, and a press outside would otherwise close every copy of it
              on the page at once. */}
          <Popover
            closeOnOutsidePress={isolated(context)}
            defaultOpen
            initialFocus={isolated(context) ? undefined : '[data-part="root"]'}
            portal={false}
          >
            <PopoverTrigger render={(props) => <Button {...props}>Assign to…</Button>} />
            <PopoverContent aria-label="Assign to">
              <CommandPalette
                footer={null}
                items={TEAMS.map((team) => ({ ...team, description: undefined }))}
                messages={{ placeholder: 'Search people…' }}
                presentation="inline"
              />
            </PopoverContent>
          </Popover>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="sm"
        note="Small rows, a medium header. The measure inside a dialog would be twenty-four rems."
      >
        <Panel items={ITEMS.slice(0, 4)} size="sm" />
      </Scene>
      <Scene
        label="lg"
        note="Large rows, and a header that takes its type from the text scale because control geometry stops at lg."
      >
        <Panel items={ITEMS.slice(0, 4)} size="lg" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Six rows, six states"
        note="Hover the rows that are not current for the wash; run the third row and it stays busy, because its handler never settles; the disabled row is skipped by the arrows and answers no click."
      >
        <Panel
          defaultHighlightedId="current"
          groups={[]}
          items={[
            { id: 'rest', label: 'At rest', icon: ICONS.folder, shortcut: 'mod+1' },
            {
              id: 'current',
              label: 'Current, from the keyboard',
              icon: ICONS.folder,
              shortcut: 'mod+2',
            },
            {
              id: 'busy',
              label: 'Running… the handler has not answered',
              icon: ICONS.rocket,
              shortcut: 'mod+3',
              onSelect: () => new Promise(() => {}),
            },
            {
              id: 'disabled',
              label: 'Disabled, kept in place and announced',
              icon: ICONS.trash,
              shortcut: 'mod+4',
              disabled: true,
            },
            { id: 'page', label: 'Opens a page', icon: ICONS.user, children: TEAMS },
            {
              id: 'link',
              label: 'A destination, rendered as a link',
              icon: ICONS.inbox,
              href: '#inbox',
              meta: 'Page',
            },
          ]}
        />
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Long, translated, unbroken"
        note="The label is cut with an ellipsis and survives whole on the row’s title; the description likewise; the four-key binding keeps its column; the row with no icon still lines up."
      >
        <Panel
          defaultQuery="ver"
          groups={[{ id: 'admin', label: 'Verwaltung' }]}
          items={[
            {
              id: 'sync',
              label:
                'Benachrichtigungseinstellungen für alle Arbeitsbereiche und Teams synchronisieren',
              description:
                'Eine sehr lange Beschreibung, die abgeschnitten werden muss, weil sie sonst drei Zeilen einnehmen würde',
              group: 'admin',
              icon: ICONS.settings,
              shortcut: 'mod+shift+alt+p',
            },
            {
              id: 'pipeline',
              label: 'Supercalifragilisticexpialidocious-Bereitstellungspipeline',
              group: 'admin',
              icon: ICONS.rocket,
              meta: 'Empfohlen',
            },
            { id: 'go', label: 'Go', group: 'admin', icon: ICONS.folder, shortcut: 'g' },
            {
              id: 'review',
              label: 'Sicherheitsüberprüfung',
              description: 'Kurz',
              group: 'admin',
              shortcut: 'mod+k',
            },
          ]}
        />
      </Scene>
    </Grid>
  ),
};

export const Hotkey: Story = {
  parameters: scenario('hotkey'),
  render: (_args, context) => (
    <Grid columns={1}>
      <Scene
        label="mod+k, the default"
        note="Click the box to focus the page, then press ⌘K or Ctrl+K. Press it again while open and the field takes focus with the query selected."
      >
        <Operated pictured={isolated(context)}>
          {(container) => (
            <CommandPalette
              {...layerProps(container)}
              defaultOpen={isolated(context)}
              items={ITEMS}
            >
              <CommandPaletteTrigger
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Search
                  </Button>
                )}
              />
            </CommandPalette>
          )}
        </Operated>
      </Scene>
      <Scene
        label="/, a bare key"
        note="Press / with nothing focused and it opens; press / inside the text field and it types a slash, because a key without a modifier stays quiet in an editable target."
      >
        <Operated pictured={isolated(context)}>
          {(container) => (
            <>
              <TextField aria-label="Notes" placeholder="Type / here" />
              <CommandPalette {...layerProps(container)} hotkey="/" items={ITEMS}>
                <CommandPaletteTrigger
                  render={(props) => (
                    <Button {...props} tone="secondary" variant="outline">
                      Search
                    </Button>
                  )}
                />
              </CommandPalette>
            </>
          )}
        </Operated>
      </Scene>
    </Grid>
  ),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Portuguese, from the providers"
        note="Nothing on the panel states a word or a size; SlottedProvider gives the language and the defaults provider the size, once, for every palette under them."
      >
        <SlottedProvider locale="pt-BR">
          <CommandPaletteDefaultsProvider size="sm">
            <Panel
              defaultRecent={['inbox']}
              groups={[
                { id: 'nav', label: 'Go to' },
                { id: 'actions', label: 'Actions' },
              ]}
            />
          </CommandPaletteDefaultsProvider>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => (
    <Grid columns={1}>
      <Scene
        label="A top bar’s search, and rows with avatars"
        note="The trigger is a Button with a Kbd inside, rendered through render; the rows are renderItem’s, an avatar standing in the icon column and the marked label beside it."
      >
        <Operated pictured={isolated(context)}>
          {(container) => (
            <CommandPalette
              {...layerProps(container)}
              defaultOpen={isolated(context)}
              items={TEAMS}
              messages={{ input: 'Search people', label: 'People', placeholder: 'Search people…' }}
              renderItem={(item, state) => (
                <>
                  <span data-part="icon" data-part-icon="">
                    <Avatar name={item.label} size="xs" />
                  </span>
                  <span data-part="label" data-part-label="">
                    {state.label}
                  </span>
                  {item.description === undefined ? null : (
                    <span data-part="description" data-part-description="">
                      {item.description}
                    </span>
                  )}
                </>
              )}
            >
              <CommandPaletteTrigger
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Search people <Kbd size="sm">⌘K</Kbd>
                  </Button>
                )}
              />
            </CommandPalette>
          )}
        </Operated>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Click the field and drive it"
        note="ArrowDown from the last row wraps; PageDown stops at the end; Ctrl+End reaches it; Home moves the caret; Enter runs; Escape clears the query first."
      >
        <Panel closeOnSelect={false} defaultQuery="e" />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two names, one live region"
        note="The field is named Search deployments and the list borrows it; the current row is aria-selected and named by aria-activedescendant; the hidden status row holds the count."
      >
        <Panel messages={{ input: 'Search deployments', label: 'Deployment commands' }} />
      </Scene>
    </Grid>
  ),
};
