import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '../menu';
import { Menubar } from './menubar';
import { MenubarDefaultsProvider } from './menubar-defaults';
import { REACT_MENUBAR_DOCS, REACT_MENUBAR_TOKENS } from './menubar.docs';

/**
 * Every bar here opens its menus `portal={false}` inside the workbench's own
 * viewport box, so a surface opened in one scene cannot draw over the scene
 * above it.
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

/** The bar sits across the top of the box, with the room its menus need under it. */
const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'tall'}>
    {children}
  </div>
);

const FileMenu = ({ open }: { open?: boolean }) => (
  <Menu {...(open === undefined ? {} : { defaultOpen: open })} portal={false} value="file">
    <MenuTrigger>File</MenuTrigger>
    <MenuContent>
      <MenuItem shortcut="Mod+N">New</MenuItem>
      <MenuItem shortcut="Mod+O">Open…</MenuItem>
      <MenuSeparator />
      <MenuItem shortcut="Mod+S">Save</MenuItem>
    </MenuContent>
  </Menu>
);

const EditMenu = ({ open }: { open?: boolean }) => (
  <Menu {...(open === undefined ? {} : { defaultOpen: open })} portal={false} value="edit">
    <MenuTrigger>Edit</MenuTrigger>
    <MenuContent>
      <MenuItem shortcut="Mod+Z">Undo</MenuItem>
      <MenuItem disabled shortcut="Shift+Mod+Z">
        Redo
      </MenuItem>
    </MenuContent>
  </Menu>
);

const HelpMenu = () => (
  <Menu portal={false} value="help">
    <MenuTrigger>Help</MenuTrigger>
    <MenuContent>
      <MenuItem>Documentation</MenuItem>
    </MenuContent>
  </Menu>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MENUBAR_DOCS.menubar.scenes, {
    bar: Bar,
    'checkbox-and-radio': Options,
    composition: Composition,
    keyboard: Keyboard,
    orientation: Orientation,
    playground: Playground,
    states: States,
    submenus: Submenus,
  }) as never;

const meta = {
  title: 'Components/Menubar',
  component: Menubar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Menubar',
        description:
          'A row of triggers with one tab stop, each opening a menu. The bar holds which menu is open; everything inside it is the menu family unchanged.',
        framework: 'React',
        ...REACT_MENUBAR_DOCS.menubar,
        tokens: REACT_MENUBAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    disabled: false,
    loop: true,
    orientation: 'horizontal',
    size: 'md',
    typeahead: true,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Viewport>
      <Menubar {...args} aria-label="Main" defaultValue="file">
        <FileMenu />
        <EditMenu />
        <HelpMenu />
      </Menubar>
    </Viewport>
  ),
};

export const Bar: Story = {
  parameters: scenario('bar'),
  render: () => (
    <Viewport>
      <Menubar aria-label="Main" defaultValue="edit">
        <FileMenu />
        <EditMenu />
        <HelpMenu />
      </Menubar>
    </Viewport>
  ),
};

export const Submenus: Story = {
  parameters: scenario('submenus'),
  render: () => (
    <Viewport>
      <Menubar aria-label="Main" defaultValue="file">
        <Menu portal={false} value="file">
          <MenuTrigger>File</MenuTrigger>
          <MenuContent>
            <MenuItem>New</MenuItem>
            <Menu defaultOpen portal={false}>
              <MenuTrigger>Export as</MenuTrigger>
              <MenuContent>
                <MenuItem>PDF</MenuItem>
                <MenuItem>PNG</MenuItem>
              </MenuContent>
            </Menu>
          </MenuContent>
        </Menu>
        <EditMenu />
      </Menubar>
    </Viewport>
  ),
};

export const Options: Story = {
  parameters: scenario('checkbox-and-radio'),
  render: () => (
    <Viewport>
      <Menubar aria-label="Main" defaultValue="view">
        <FileMenu />
        <Menu portal={false} value="view">
          <MenuTrigger>View</MenuTrigger>
          <MenuContent>
            <MenuCheckboxItem defaultChecked>Rulers</MenuCheckboxItem>
            <MenuCheckboxItem>Pixel grid</MenuCheckboxItem>
            <MenuSeparator />
            <MenuRadioGroup defaultValue="fit">
              <MenuRadioItem value="fit">Fit</MenuRadioItem>
              <MenuRadioItem value="full">Actual size</MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      </Menubar>
    </Viewport>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  /* One column, because a vertical bar opens its menus beside itself: in half
     a page there was no room left for the surface, and the label column
     collapsed to nothing — which `tools/harness/audit.mjs` reported. */
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Horizontal, in a header"
        note="The default. The menus hang under the bar, and the inline arrows move along it."
      >
        <Viewport size="layer">
          <Menubar aria-label="Main">
            <FileMenu />
            <EditMenu />
          </Menubar>
        </Viewport>
      </Scene>
      <Scene
        label="Vertical, in a sidebar"
        note="The arrow pairs exchange places, the menus open beside the bar rather than under it, and the triggers stretch to the bar's width."
      >
        <Viewport>
          <Menubar aria-label="Workspace" defaultValue="file" orientation="vertical">
            <FileMenu />
            <EditMenu />
          </Menubar>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Open, and a menu out of action"
        note="The trigger whose menu is showing keeps its highlight; the disabled one stays focusable and opens nothing at all."
      >
        <Viewport>
          <Menubar aria-label="Main" defaultValue="file">
            <FileMenu />
            <Menu disabled portal={false} value="window">
              <MenuTrigger>Window</MenuTrigger>
              <MenuContent>
                <MenuItem>Minimize</MenuItem>
              </MenuContent>
            </Menu>
          </Menubar>
        </Viewport>
      </Scene>
      <Scene
        label="A bar out of action"
        note="One value on the bar rather than the same value repeated on every menu, which is what a page saving its work needs."
      >
        <Viewport size="layer">
          <Menubar aria-label="Main" disabled>
            <FileMenu />
            <EditMenu />
          </Menubar>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Viewport>
      <Menubar aria-label="Main" defaultValue="file">
        <FileMenu />
        <EditMenu />
        <HelpMenu />
      </Menubar>
    </Viewport>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <MenubarDefaultsProvider size="sm">
      <Viewport>
        <div className="slotted-demo-row">
          <strong>Acme</strong>
          <Menubar aria-label="Main">
            <FileMenu />
            <EditMenu />
            <HelpMenu />
          </Menubar>
        </div>
      </Viewport>
    </MenubarDefaultsProvider>
  ),
};
