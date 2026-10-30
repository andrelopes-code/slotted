import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUpRight,
  lucideCopy,
  lucideFile,
  lucideInbox,
  lucideLogOut,
  lucideTrash2,
  lucideUser,
} from '@ng-icons/lucide';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlMenu } from './menu';
import type { MenuAlign, MenuSide, MenuSize } from './menu-defaults';
import {
  SlMenuEmpty,
  SlMenuGroup,
  SlMenuHeader,
  SlMenuItem,
  SlMenuItemDescription,
  SlMenuItemIcon,
  SlMenuItemMeta,
  SlMenuRadioGroup,
  SlMenuSeparator,
} from './menu-items';
import { SlMenuTrigger } from './menu-trigger';
import { ANGULAR_MENU_DOCS, ANGULAR_MENU_TOKENS } from './menu.docs';

interface MenuStoryArgs {
  align: MenuAlign;
  closeOnSelect: boolean;
  disabled: boolean;
  loop: boolean;
  side: MenuSide;
  size: MenuSize;
  typeahead: boolean;
}

/**
 * Every demonstration opens `[portal]="false"` inside the workbench's own
 * viewport box, so a surface opened in one scene cannot draw over the scene
 * above it.
 */
const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MENU_DOCS.menu.scenes, {
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

const meta: Meta<MenuStoryArgs> = {
  title: 'Components/Menu',
  decorators: [
    moduleMetadata({
      imports: [
        NgIcon,
        SlAvatar,
        SlButton,
        SlMenu,
        SlMenuEmpty,
        SlMenuGroup,
        SlMenuHeader,
        SlMenuItem,
        SlMenuItemDescription,
        SlMenuItemIcon,
        SlMenuItemMeta,
        SlMenuRadioGroup,
        SlMenuSeparator,
        SlMenuTrigger,
      ],
      providers: [
        provideIcons({
          lucideArrowUpRight,
          lucideCopy,
          lucideFile,
          lucideInbox,
          lucideLogOut,
          lucideTrash2,
          lucideUser,
        }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Menu',
        description:
          'A list of commands on a layer, opened from a control, from an item of another menu, or from a trigger on a menubar.',
        framework: 'Angular',
        ...ANGULAR_MENU_DOCS.menu,
        tokens: ANGULAR_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<MenuStoryArgs>;

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
  render: (args, context) => ({
    props: { ...args, pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="layer">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="document">Document</button>
        <sl-menu
          #document
          [open]="pictured"
          [portal]="false"
          [align]="align"
          [closeOnSelect]="closeOnSelect"
          [disabled]="disabled"
          [loop]="loop"
          [side]="side"
          [size]="size"
          [typeahead]="typeahead"
        >
          <button slMenuItem shortcut="Mod+D">Duplicate</button>
          <button slMenuItem [disabled]="true">Publish</button>
          <hr slMenuSeparator />
          <button slMenuItem tone="danger">Delete…</button>
        </sl-menu>
      </div>
    `,
  }),
};

export const Commands: Story = {
  parameters: scenario('commands'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Running an item closes the menu</span>
            <span class="slotted-demo-scene__note">The default, and what a command is: the reader asked for one thing and the surface has said what it was.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="one">Document</button>
              <sl-menu #one [open]="pictured" [portal]="false">
                <button slMenuItem>Duplicate</button>
                <button slMenuItem>Rename…</button>
              </sl-menu>
            </div>
          </div>
        </section>
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">An item that stays</span>
            <span class="slotted-demo-scene__note">[closeOnSelect]="false" keeps the surface open, which is what a command a reader presses three times in a row needs.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="two">View</button>
              <sl-menu #two [open]="pictured" [portal]="false">
                <button slMenuItem [closeOnSelect]="false">Zoom in</button>
                <button slMenuItem [closeOnSelect]="false">Zoom out</button>
              </sl-menu>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};

export const Icons: Story = {
  parameters: scenario('icons'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="layer">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Document</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <button slMenuItem>
            <span slMenuItemIcon>
              <ng-icon aria-hidden="true" name="lucideCopy" size="16"></ng-icon>
            </span>
            Duplicate
          </button>
          <button slMenuItem>
            <span slMenuItemIcon>
              <ng-icon aria-hidden="true" name="lucideArrowUpRight" size="16"></ng-icon>
            </span>
            Open in new tab
          </button>
          <button slMenuItem>Rename…</button>
        </sl-menu>
      </div>
    `,
  }),
};

export const Shortcuts: Story = {
  parameters: scenario('shortcuts'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="layer">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">File</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <button slMenuItem shortcut="Mod+S">Save</button>
          <button slMenuItem shortcut="Shift+Mod+S">Save as…</button>
          <button slMenuItem shortcut="Mod+P">Print…</button>
        </sl-menu>
      </div>
    `,
  }),
};

export const CheckboxItems: Story = {
  parameters: scenario('checkbox-items'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="layer">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">View</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <button slMenuCheckboxItem [checked]="true">Rulers</button>
          <button slMenuCheckboxItem shortcut="Mod+'">Pixel grid</button>
        </sl-menu>
      </div>
    `,
  }),
};

export const RadioItems: Story = {
  parameters: scenario('radio-items'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Sort</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <sl-menu-radio-group value="name">
            <button slMenuRadioItem value="name">
              Name
              <span slMenuItemDescription>A to Z</span>
            </button>
            <button slMenuRadioItem value="date">
              Date modified
              <span slMenuItemDescription>Newest first</span>
            </button>
            <button slMenuRadioItem value="size">
              Size
              <span slMenuItemDescription>Largest first</span>
            </button>
          </sl-menu-radio-group>
        </sl-menu>
      </div>
    `,
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Document</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <sl-menu-group label="File">
            <button slMenuItem>Duplicate</button>
            <button slMenuItem>Move to…</button>
          </sl-menu-group>
          <hr slMenuSeparator />
          <sl-menu-group label="Share">
            <button slMenuItem>Copy link</button>
            <button slMenuItem>Invite…</button>
          </sl-menu-group>
        </sl-menu>
      </div>
    `,
  }),
};

export const Submenus: Story = {
  parameters: scenario('submenu'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="share">Share</button>
        <sl-menu #share [open]="pictured" [portal]="false">
          <button slMenuItem>Copy link</button>
          <button slMenuItem [slMenuTriggerFor]="sendTo">Send to</button>
          <sl-menu #sendTo [portal]="false">
            <button slMenuItem>Slack</button>
            <button slMenuItem>Email</button>
          </sl-menu>
          <button slMenuItem>Embed…</button>
        </sl-menu>
      </div>
    `,
  }),
};

/* The submenu open from the start, for the picture: its panel one gap out
   from the parent's edge, its first item level with the item that opened it. */
export const SubmenuOpen: Story = {
  parameters: scenario('submenu-open'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="share">Share</button>
        <sl-menu #share [open]="pictured" [portal]="false">
          <button slMenuItem>Copy link</button>
          <button slMenuItem [slMenuTriggerFor]="sendTo">Send to</button>
          <sl-menu #sendTo [open]="pictured" [portal]="false">
            <button slMenuItem>Slack</button>
            <button slMenuItem>Email</button>
          </sl-menu>
          <button slMenuItem>Embed…</button>
        </sl-menu>
      </div>
    `,
  }),
};

/* Who the menu belongs to, above the commands: the avatar starts at the
   icons' edge and the arrows begin at Profile. */
export const Header: Story = {
  parameters: scenario('header'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="account">Account</button>
        <sl-menu #account [open]="pictured" [portal]="false">
          <div slMenuHeader>
            <span slAvatar name="Ada Lovelace" size="md" decorative></span>
            <span data-part="label" data-part-label="">Ada Lovelace</span>
            <span slMenuItemDescription>ada@analytical.engine</span>
          </div>
          <hr slMenuSeparator />
          <button slMenuItem shortcut="Mod+Shift+P">
            <span slMenuItemIcon><ng-icon aria-hidden="true" name="lucideUser" size="16"></ng-icon></span>
            Profile
          </button>
          <hr slMenuSeparator />
          <button slMenuItem tone="danger">
            <span slMenuItemIcon><ng-icon aria-hidden="true" name="lucideLogOut" size="16"></ng-icon></span>
            Sign out
          </button>
        </sl-menu>
      </div>
    `,
  }),
};

/* Counts end on one edge, shortcuts keep theirs, and the submenu trigger
   shows the value it is set to. */
export const ItemMeta: Story = {
  parameters: scenario('meta'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), presence: 'Available' },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="workspace">Workspace</button>
        <sl-menu #workspace [open]="pictured" [portal]="false">
          <button slMenuItem shortcut="Mod+1">
            <span slMenuItemIcon><ng-icon aria-hidden="true" name="lucideInbox" size="16"></ng-icon></span>
            Inbox <span slMenuItemMeta>12</span>
          </button>
          <button slMenuItem shortcut="Mod+2">
            <span slMenuItemIcon><ng-icon aria-hidden="true" name="lucideFile" size="16"></ng-icon></span>
            Drafts <span slMenuItemMeta>3</span>
          </button>
          <button slMenuItem [disabled]="true">
            <span slMenuItemIcon><ng-icon aria-hidden="true" name="lucideTrash2" size="16"></ng-icon></span>
            Trash <span slMenuItemMeta>0</span>
          </button>
          <hr slMenuSeparator />
          <button slMenuItem [slMenuTriggerFor]="status">
            Status <span slMenuItemMeta>{{ presence }}</span>
          </button>
          <sl-menu #status [portal]="false">
            <sl-menu-radio-group [(value)]="presence">
              <button slMenuRadioItem value="Available">Available</button>
              <button slMenuRadioItem value="Away">Away</button>
              <button slMenuRadioItem value="Do not disturb">Do not disturb</button>
            </sl-menu-radio-group>
          </sl-menu>
        </sl-menu>
      </div>
    `,
  }),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="layer">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Document</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <button slMenuItem>Duplicate</button>
          <hr slMenuSeparator />
          <button slMenuItem tone="danger">
            Delete document
            <span slMenuItemDescription>This cannot be undone.</span>
          </button>
        </sl-menu>
      </div>
    `,
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Under the control, from its start edge</span>
            <span class="slotted-demo-scene__note">The default: the control's text and the items' labels share one edge, which is what a menu hanging from a button should do.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="below">Actions</button>
              <sl-menu #below [open]="pictured" [portal]="false" side="bottom" align="start">
                <button slMenuItem>Rename…</button>
                <button slMenuItem>Duplicate</button>
              </sl-menu>
            </div>
          </div>
        </section>
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Beside the control</span>
            <span class="slotted-demo-scene__note">side="inline-end" puts the surface where a submenu goes, and mirrors with the reading direction rather than staying on the right.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="beside">Actions</button>
              <sl-menu #beside [open]="pictured" [portal]="false" side="inline-end" align="start">
                <button slMenuItem>Rename…</button>
                <button slMenuItem>Duplicate</button>
              </sl-menu>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};

export const Scrolling: Story = {
  parameters: scenario('scrolling'),
  render: (_args, context) => ({
    props: {
      pictured: isolated(context),
      folders: ['Inbox', 'Archive', 'Drafts', 'Sent', 'Spam', 'Trash', 'Receipts'],
    },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Move to</button>
        <sl-menu #menu [open]="pictured" [portal]="false" aria-label="Move to">
          @for (folder of folders; track folder) {
            <button slMenuItem>{{ folder }}</button>
          }
        </sl-menu>
      </div>
    `,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Disabled, checked, and a parent while its submenu shows</span>
            <span class="slotted-demo-scene__note">A disabled item still takes focus and still runs nothing; the parent item keeps its highlight while the surface it opened is showing.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="tall">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="states">Document</button>
              <sl-menu #states [open]="pictured" [portal]="false">
                <button slMenuItem [disabled]="true" shortcut="Mod+P">Publish</button>
                <button slMenuCheckboxItem [checked]="true">Show comments</button>
                <button slMenuItem [slMenuTriggerFor]="exportAs">Export as</button>
                <sl-menu #exportAs [open]="pictured" [portal]="false">
                  <button slMenuItem>PDF</button>
                </sl-menu>
              </sl-menu>
            </div>
          </div>
        </section>
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Waiting, and holding nothing</span>
            <span class="slotted-demo-scene__note">Both keep the surface's measure rather than collapsing to a two-pixel box, and the waiting one says so with aria-busy.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <button slButton size="sm" variant="outline" [slMenuTriggerFor]="labels">Labels</button>
              <sl-menu #labels [open]="pictured" [portal]="false" [loading]="true" aria-label="Labels">
                <div slMenuEmpty>Loading labels…</div>
              </sl-menu>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="menu">Commands</button>
        <sl-menu #menu [open]="pictured" [portal]="false">
          <button slMenuItem shortcut="Mod+S">Save</button>
          <button slMenuItem shortcut="Shift+Mod+S">Save as…</button>
          <button slMenuItem>Settings…</button>
          <hr slMenuSeparator />
          <button slMenuItem>Sign out</button>
        </sl-menu>
      </div>
    `,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <button
          slButton
          size="sm"
          variant="ghost"
          aria-label="Row actions"
          [slMenuTriggerFor]="rowActions"
        >
          ⋯
        </button>
        <sl-menu #rowActions [open]="pictured" [portal]="false" align="end" aria-label="Row actions">
          <button slMenuItem>Open</button>
          <button slMenuItem shortcut="Mod+D">Duplicate</button>
          <hr slMenuSeparator />
          <button slMenuItem tone="danger">
            Delete row
            <span slMenuItemDescription>This cannot be undone.</span>
          </button>
        </sl-menu>
      </div>
    `,
  }),
};
