import {
  SlMenu,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlMenubar } from './menubar';
import type { MenubarOrientation } from './menubar-defaults';
import { ANGULAR_MENUBAR_DOCS, ANGULAR_MENUBAR_TOKENS } from './menubar.docs';

interface MenubarStoryArgs {
  disabled: boolean;
  loop: boolean;
  orientation: MenubarOrientation;
  size: 'sm' | 'md' | 'lg';
  typeahead: boolean;
}

const FILE = `
  <button [slMenuTriggerFor]="file">File</button>
  <sl-menu #file value="file" [portal]="false">
    <button slMenuItem shortcut="Mod+N">New</button>
    <button slMenuItem shortcut="Mod+O">Open…</button>
    <hr slMenuSeparator />
    <button slMenuItem shortcut="Mod+S">Save</button>
  </sl-menu>
`;

const EDIT = `
  <button [slMenuTriggerFor]="edit">Edit</button>
  <sl-menu #edit value="edit" [portal]="false">
    <button slMenuItem shortcut="Mod+Z">Undo</button>
    <button slMenuItem [disabled]="true" shortcut="Shift+Mod+Z">Redo</button>
  </sl-menu>
`;

const HELP = `
  <button [slMenuTriggerFor]="help">Help</button>
  <sl-menu #help value="help" [portal]="false">
    <button slMenuItem>Documentation</button>
  </sl-menu>
`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MENUBAR_DOCS.menubar.scenes, {
    bar: Bar,
    'checkbox-and-radio': Options,
    composition: Composition,
    keyboard: Keyboard,
    orientation: Orientation,
    playground: Playground,
    states: States,
    submenus: Submenus,
  }) as never;

const meta: Meta<MenubarStoryArgs> = {
  title: 'Components/Menubar',
  decorators: [
    moduleMetadata({
      imports: [SlMenu, SlMenuItem, SlMenuRadioGroup, SlMenuSeparator, SlMenuTrigger, SlMenubar],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Menubar',
        description:
          'A row of triggers with one tab stop, each opening a menu. The bar holds which menu is open; everything inside it is the menu family unchanged.',
        framework: 'Angular',
        ...ANGULAR_MENUBAR_DOCS.menubar,
        tokens: ANGULAR_MENUBAR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<MenubarStoryArgs>;

export const Playground: Story = {
  args: {
    disabled: false,
    loop: true,
    orientation: 'horizontal',
    size: 'md',
    typeahead: true,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <sl-menubar
          aria-label="Main"
          value="file"
          [disabled]="disabled"
          [loop]="loop"
          [orientation]="orientation"
          [size]="size"
          [typeahead]="typeahead"
        >
          ${FILE}
          ${EDIT}
          ${HELP}
        </sl-menubar>
      </div>
    `,
  }),
};

export const Bar: Story = {
  parameters: scenario('bar'),
  render: () => ({
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <sl-menubar aria-label="Main" value="edit">
          ${FILE}
          ${EDIT}
          ${HELP}
        </sl-menubar>
      </div>
    `,
  }),
};

export const Submenus: Story = {
  parameters: scenario('submenus'),
  render: () => ({
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <sl-menubar aria-label="Main" value="file">
          <button [slMenuTriggerFor]="file">File</button>
          <sl-menu #file value="file" [portal]="false">
            <button slMenuItem>New</button>
            <button slMenuItem [slMenuTriggerFor]="exportAs">Export as</button>
            <sl-menu #exportAs [open]="true" [portal]="false">
              <button slMenuItem>PDF</button>
              <button slMenuItem>PNG</button>
            </sl-menu>
          </sl-menu>
          ${EDIT}
        </sl-menubar>
      </div>
    `,
  }),
};

export const Options: Story = {
  parameters: scenario('checkbox-and-radio'),
  render: () => ({
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <sl-menubar aria-label="Main" value="view">
          ${FILE}
          <button [slMenuTriggerFor]="view">View</button>
          <sl-menu #view value="view" [portal]="false">
            <button slMenuCheckboxItem [checked]="true">Rulers</button>
            <button slMenuCheckboxItem>Pixel grid</button>
            <hr slMenuSeparator />
            <sl-menu-radio-group value="fit">
              <button slMenuRadioItem value="fit">Fit</button>
              <button slMenuRadioItem value="full">Actual size</button>
            </sl-menu-radio-group>
          </sl-menu>
        </sl-menubar>
      </div>
    `,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  /* One column, because a vertical bar opens its menus beside itself: in half
     a page there is no room left for the surface. */
  render: () => ({
    template: `
      <div class="slotted-demo-grid">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Horizontal, in a header</span>
            <span class="slotted-demo-scene__note">The default. The menus hang under the bar, and the inline arrows move along it.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <sl-menubar aria-label="Main">
                ${FILE}
                ${EDIT}
              </sl-menubar>
            </div>
          </div>
        </section>
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Vertical, in a sidebar</span>
            <span class="slotted-demo-scene__note">The arrow pairs exchange places, the menus open beside the bar rather than under it, and the triggers stretch to the bar's width.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="tall">
              <sl-menubar aria-label="Workspace" orientation="vertical" value="file">
                ${FILE}
                ${EDIT}
              </sl-menubar>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">Open, and a menu out of action</span>
            <span class="slotted-demo-scene__note">The trigger whose menu is showing keeps its highlight; the disabled one stays focusable and opens nothing at all.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="tall">
              <sl-menubar aria-label="Main" value="file">
                ${FILE}
                <button [slMenuTriggerFor]="window">Window</button>
                <sl-menu #window value="window" [disabled]="true" [portal]="false">
                  <button slMenuItem>Minimise</button>
                </sl-menu>
              </sl-menubar>
            </div>
          </div>
        </section>
        <section class="slotted-demo-scene">
          <header class="slotted-demo-scene__header">
            <span class="slotted-demo-scene__label">A bar out of action</span>
            <span class="slotted-demo-scene__note">One value on the bar rather than the same value repeated on every menu, which is what a page saving its work needs.</span>
          </header>
          <div class="slotted-demo-stage" data-layout="block">
            <div class="slotted-demo-viewport" data-place="top" data-size="layer">
              <sl-menubar aria-label="Main" [disabled]="true">
                ${FILE}
                ${EDIT}
              </sl-menubar>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <sl-menubar aria-label="Main" value="file" [loop]="true" [typeahead]="true">
          ${FILE}
          ${EDIT}
          ${HELP}
        </sl-menubar>
      </div>
    `,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
      <div class="slotted-demo-viewport" data-place="top" data-size="tall">
        <div class="slotted-demo-row">
          <strong>Acme</strong>
          <sl-menubar aria-label="Main" size="sm">
            ${FILE}
            ${EDIT}
            ${HELP}
          </sl-menubar>
        </div>
      </div>
    `,
  }),
};
