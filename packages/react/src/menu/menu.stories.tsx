import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUpRight, Copy, File, Inbox, LogOut, Trash2, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Menu } from './menu';
import { MenuDefaultsProvider } from './menu-defaults';
import { MenuContent, MenuTrigger } from './menu-parts';
import {
  MenuCheckboxItem,
  MenuEmpty,
  MenuGroup,
  MenuHeader,
  MenuItem,
  MenuItemDescription,
  MenuItemLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from './menu-items';
import { REACT_MENU_DOCS, REACT_MENU_TOKENS } from './menu.docs';

/**
 * Every demonstration is `portal={false}` inside the workbench's own viewport
 * box, so a surface opened in one scene cannot draw over the scene above it.
 * The `composition` scene keeps the portal, and says so.
 */
const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

/**
 * The box a menu is demonstrated in. `data-place="top"` holds the control near
 * the top with the room under it, which is the shape a surface that opens
 * *below* its control needs; centering it clipped the surface against the floor
 * of the box.
 */
const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'layer'}>
    {children}
  </div>
);

const Trigger = ({ children }: { children: string }) => (
  <MenuTrigger
    render={(props) => (
      <Button {...props} size="sm" tone="secondary" variant="outline">
        {children}
      </Button>
    )}
  />
);

const FOLDERS = ['Inbox', 'Archive', 'Drafts', 'Sent', 'Spam', 'Trash', 'Receipts', 'Travel'];

/**
 * The consumer's own artwork, which is what the icon column holds, and it is
 * Lucide's. A story may not paint with an inline style, so the mark is content
 * rather than a custom property pointed at a glyph token.
 */
const CopyMark = () => <Copy aria-hidden="true" focusable="false" size={16} />;

const ExternalMark = () => <ArrowUpRight aria-hidden="true" focusable="false" size={16} />;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MENU_DOCS.menu.scenes, {
    'checkbox-items': CheckboxItems,
    commands: Commands,
    composition: Composition,
    groups: Groups,
    header: Header,
    icons: Icons,
    keyboard: Keyboard,
    meta: ItemMeta,
    placement: Placement,
    playground: Playground,
    'radio-items': RadioItems,
    scrolling: Scrolling,
    shortcuts: Shortcuts,
    states: States,
    submenu: Submenus,
    'submenu-open': SubmenuOpen,
    tone: Tone,
  }) as never;

const meta = {
  title: 'Components/Menu',
  component: Menu,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Menu',
        description:
          'A list of commands on a layer, opened from a control, from an item of another menu, or from a trigger on a menubar.',
        framework: 'React',
        ...REACT_MENU_DOCS.menu,
        tokens: REACT_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'start',
    closeOnSelect: true,
    disabled: false,
    loop: true,
    side: 'bottom',
    size: 'md',
    typeahead: true,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => (
    <Viewport>
      <Menu {...args} defaultOpen={isolated(context)} portal={false}>
        <Trigger>Document</Trigger>
        <MenuContent>
          <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
          <MenuItem disabled>Publish</MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger">Delete…</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const Commands: Story = {
  parameters: scenario('commands'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Running an item closes the menu"
        note="The default, and what a command is: the reader asked for one thing and the surface has said what it was."
      >
        <Viewport>
          <Menu defaultOpen={isolated(context)} portal={false}>
            <Trigger>Document</Trigger>
            <MenuContent>
              <MenuItem>Duplicate</MenuItem>
              <MenuItem>Rename…</MenuItem>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
      <Scene
        label="An item that stays"
        note="closeOnSelect={false} keeps the surface open, which is what a command a reader presses three times in a row needs."
      >
        <Viewport>
          <Menu defaultOpen={isolated(context)} portal={false}>
            <Trigger>View</Trigger>
            <MenuContent>
              <MenuItem closeOnSelect={false}>Zoom in</MenuItem>
              <MenuItem closeOnSelect={false}>Zoom out</MenuItem>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Icons: Story = {
  parameters: scenario('icons'),
  render: (_args, context) => (
    <Viewport>
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Document</Trigger>
        <MenuContent>
          <MenuItem icon={<CopyMark />}>Duplicate</MenuItem>
          <MenuItem icon={<ExternalMark />}>Open in new tab</MenuItem>
          <MenuItem>Rename…</MenuItem>
          <MenuItem>Move to…</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const Shortcuts: Story = {
  parameters: scenario('shortcuts'),
  render: (_args, context) => (
    <Viewport>
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>File</Trigger>
        <MenuContent>
          <MenuItem shortcut="Mod+S">Save</MenuItem>
          <MenuItem shortcut="Shift+Mod+S">Save as…</MenuItem>
          <MenuItem shortcut="Mod+P">Print…</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const CheckboxItems: Story = {
  parameters: scenario('checkbox-items'),
  render: function Render(_args, context) {
    const [rulers, setRulers] = useState(true);
    const [grid, setGrid] = useState(false);

    return (
      <Viewport>
        <Menu defaultOpen={isolated(context)} portal={false}>
          <Trigger>View</Trigger>
          <MenuContent>
            <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers}>
              Rulers
            </MenuCheckboxItem>
            <MenuCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="Mod+'">
              Pixel grid
            </MenuCheckboxItem>
          </MenuContent>
        </Menu>
      </Viewport>
    );
  },
};

export const RadioItems: Story = {
  parameters: scenario('radio-items'),
  render: function Render(_args, context) {
    const [sort, setSort] = useState('name');

    return (
      <Viewport size="tall">
        <Menu defaultOpen={isolated(context)} portal={false}>
          <Trigger>Sort</Trigger>
          <MenuContent>
            <MenuRadioGroup onValueChange={setSort} value={sort}>
              <MenuRadioItem description="A to Z" value="name">
                Name
              </MenuRadioItem>
              <MenuRadioItem description="Newest first" value="date">
                Date modified
              </MenuRadioItem>
              <MenuRadioItem description="Largest first" value="size">
                Size
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      </Viewport>
    );
  },
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Document</Trigger>
        <MenuContent>
          <MenuGroup label="File">
            <MenuItem>Duplicate</MenuItem>
            <MenuItem>Move to…</MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup label="Share">
            <MenuItem>Copy link</MenuItem>
            <MenuItem>Invite…</MenuItem>
          </MenuGroup>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const Submenus: Story = {
  parameters: scenario('submenu'),
  render: (_args, context) => (
    <Viewport>
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Share</Trigger>
        <MenuContent>
          <MenuItem>Copy link</MenuItem>
          <Menu portal={false}>
            <MenuTrigger>Send to</MenuTrigger>
            <MenuContent>
              <MenuItem>Slack</MenuItem>
              <MenuItem>Email</MenuItem>
            </MenuContent>
          </Menu>
          <MenuItem>Embed…</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

/* The submenu open from the start, for the picture: its panel one gap out
   from the parent's edge, its first item level with the item that opened it. */
export const SubmenuOpen: Story = {
  parameters: scenario('submenu-open'),
  render: (_args, context) => (
    <Viewport>
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Share</Trigger>
        <MenuContent>
          <MenuItem>Copy link</MenuItem>
          <Menu defaultOpen={isolated(context)} portal={false}>
            <MenuTrigger>Send to</MenuTrigger>
            <MenuContent>
              <MenuItem>Slack</MenuItem>
              <MenuItem>Email</MenuItem>
            </MenuContent>
          </Menu>
          <MenuItem>Embed…</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

/* Who the menu belongs to, above the commands: the avatar starts at the
   icons' edge and the arrows begin at Profile. */
export const Header: Story = {
  parameters: scenario('header'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Account</Trigger>
        <MenuContent>
          <MenuHeader>
            <Avatar decorative name="Ada Lovelace" size="md" />
            <MenuItemLabel>Ada Lovelace</MenuItemLabel>
            <MenuItemDescription>ada@analytical.engine</MenuItemDescription>
          </MenuHeader>
          <MenuSeparator />
          <MenuItem icon={<User aria-hidden />} shortcut="Mod+Shift+P">
            Profile
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<LogOut aria-hidden />} tone="danger">
            Sign out
          </MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

/* Counts end on one edge, shortcuts keep theirs, and the submenu trigger
   shows the value it is set to. */
export const ItemMeta: Story = {
  parameters: scenario('meta'),
  render: (_args, context) => {
    const [status, setStatus] = useState('Available');
    return (
      <Viewport size="tall">
        <Menu defaultOpen={isolated(context)} portal={false}>
          <Trigger>Workspace</Trigger>
          <MenuContent>
            <MenuItem icon={<Inbox aria-hidden />} meta="12" shortcut="Mod+1">
              Inbox
            </MenuItem>
            <MenuItem icon={<File aria-hidden />} meta="3" shortcut="Mod+2">
              Drafts
            </MenuItem>
            <MenuItem disabled icon={<Trash2 aria-hidden />} meta="0">
              Trash
            </MenuItem>
            <MenuSeparator />
            <Menu portal={false}>
              <MenuTrigger meta={status}>Status</MenuTrigger>
              <MenuContent>
                <MenuRadioGroup value={status} onValueChange={setStatus}>
                  <MenuRadioItem value="Available">Available</MenuRadioItem>
                  <MenuRadioItem value="Away">Away</MenuRadioItem>
                  <MenuRadioItem value="Do not disturb">Do not disturb</MenuRadioItem>
                </MenuRadioGroup>
              </MenuContent>
            </Menu>
          </MenuContent>
        </Menu>
      </Viewport>
    );
  },
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: (_args, context) => (
    <Viewport>
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Document</Trigger>
        <MenuContent>
          <MenuItem>Duplicate</MenuItem>
          <MenuSeparator />
          <MenuItem description="This cannot be undone." tone="danger">
            Delete document
          </MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Under the control, from its start edge"
        note="The default: the control's text and the items' labels share one edge, which is what a menu hanging from a button should do."
      >
        <Viewport>
          <Menu align="start" defaultOpen={isolated(context)} portal={false} side="bottom">
            <Trigger>Actions</Trigger>
            <MenuContent>
              <MenuItem>Rename…</MenuItem>
              <MenuItem>Duplicate</MenuItem>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
      <Scene
        label="Beside the control"
        note='side="inline-end" puts the surface where a submenu goes, and mirrors with the reading direction rather than staying on the right.'
      >
        <Viewport>
          <Menu align="start" defaultOpen={isolated(context)} portal={false} side="inline-end">
            <Trigger>Actions</Trigger>
            <MenuContent>
              <MenuItem>Rename…</MenuItem>
              <MenuItem>Duplicate</MenuItem>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Scrolling: Story = {
  parameters: scenario('scrolling'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Move to</Trigger>
        <MenuContent aria-label="Move to">
          {FOLDERS.map((folder) => (
            <MenuItem key={folder}>{folder}</MenuItem>
          ))}
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Disabled, checked, and a parent while its submenu shows"
        note="A disabled item still takes focus and still runs nothing; the parent item keeps its highlight while the surface it opened is showing."
      >
        <Viewport>
          <Menu defaultOpen={isolated(context)} portal={false}>
            <Trigger>Document</Trigger>
            <MenuContent>
              <MenuItem disabled shortcut="Mod+P">
                Publish
              </MenuItem>
              <MenuCheckboxItem defaultChecked>Show comments</MenuCheckboxItem>
              <Menu defaultOpen={isolated(context)} portal={false}>
                <MenuTrigger>Export as</MenuTrigger>
                <MenuContent>
                  <MenuItem>PDF</MenuItem>
                </MenuContent>
              </Menu>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
      <Scene
        label="Waiting, and holding nothing"
        note="Both keep the surface's measure rather than collapsing to a two-pixel box, and the waiting one says so with aria-busy."
      >
        <Viewport>
          <Menu defaultOpen={isolated(context)} portal={false}>
            <Trigger>Labels</Trigger>
            <MenuContent aria-label="Labels" loading>
              <MenuEmpty>Loading labels…</MenuEmpty>
            </MenuContent>
          </Menu>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Menu defaultOpen={isolated(context)} portal={false}>
        <Trigger>Commands</Trigger>
        <MenuContent>
          <MenuItem shortcut="Mod+S">Save</MenuItem>
          <MenuItem shortcut="Shift+Mod+S">Save as…</MenuItem>
          <MenuItem>Settings…</MenuItem>
          <MenuSeparator />
          <MenuItem>Sign out</MenuItem>
        </MenuContent>
      </Menu>
    </Viewport>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => (
    <MenuDefaultsProvider align="end" side="bottom">
      <Viewport>
        <Menu defaultOpen={isolated(context)} portal={false}>
          <MenuTrigger
            render={(props) => (
              <Button
                {...props}
                aria-label="Row actions"
                size="sm"
                tone="secondary"
                variant="ghost"
              >
                ⋯
              </Button>
            )}
          />
          <MenuContent aria-label="Row actions">
            <MenuItem>Open</MenuItem>
            <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
            <MenuSeparator />
            <MenuItem description="This cannot be undone." tone="danger">
              Delete row
            </MenuItem>
          </MenuContent>
        </Menu>
      </Viewport>
    </MenuDefaultsProvider>
  ),
};
