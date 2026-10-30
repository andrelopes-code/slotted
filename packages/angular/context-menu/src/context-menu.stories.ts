import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlHeading, SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { provideContextMenuDefaults } from './context-menu-defaults';
import { SlContextMenuTrigger } from './context-menu-trigger';
import { ANGULAR_CONTEXT_MENU_DOCS, ANGULAR_CONTEXT_MENU_TOKENS } from './context-menu.docs';

interface ContextMenuStoryArgs {
  disabled: boolean;
  longPress: boolean;
  longPressDelay: number;
  size: 'sm' | 'md' | 'lg';
}

/**
 * A document in the library. The tile *is* the target: the mark the family
 * draws while its menu shows follows the tile's own corner, and a wrapper
 * around a card would have framed the card's rounded corners with a square.
 */
const tile = (menu: string, name: string, meta: string, attributes = '', inner = '') => `
  <div
    class="slotted-demo-surface"
    data-surface="raised"
    data-flow="stack"
    [slContextMenuTriggerFor]="${menu}"
    ${attributes}
  >
    <h3 slHeading size="md">${name}</h3>
    <p slText size="sm" tone="muted">${meta}</p>
    ${inner}
  </div>
`;

/** The commands a document has, wherever the menu that holds them opened from. */
const COMMANDS = `
  <button slMenuItem shortcut="Enter">Open</button>
  <button slMenuItem shortcut="F2">Rename</button>
  <button slMenuItem shortcut="Mod+D">Duplicate</button>
  <button slMenuItem [slMenuTriggerFor]="moveTo">Move to</button>
  <sl-menu #moveTo [portal]="false">
    <button slMenuItem>Finance</button>
    <button slMenuItem>Board</button>
    <button slMenuItem>Archive</button>
  </sl-menu>
  <hr slMenuSeparator />
  <button slMenuItem shortcut="Backspace" tone="danger">Move to trash</button>
`;

const viewport = (body: string, size: 'layer' | 'tall' = 'tall') => `
  <div class="slotted-demo-viewport" data-place="top" data-size="${size}">${body}</div>
`;

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>
`;

const FILES = [
  ['Invoice 2026-0412.pdf', '312 KB · Today'],
  ['Supplier contract — Meridian.docx', '1.8 MB · Yesterday'],
  ['Q3 board deck.pdf', '4.2 MB · Mon'],
  ['Onboarding checklist.md', '9 KB · Mar 3'],
  ['Brand book.pdf', '18 MB · Feb 27'],
] as const;

/** One menu for many rows: the request names the row, and the menu names the file. */
@Component({
  selector: 'sl-demo-context-menu-rows',
  standalone: true,
  imports: [SlContextMenuTrigger, SlMenu, SlMenuGroup, SlMenuItem, SlMenuSeparator],
  template: `
    <div class="slotted-demo-viewport" data-place="top" data-size="tall">
      <div class="slotted-demo-rows" [slContextMenuTriggerFor]="actions">
        @for (row of files; track row[0]) {
          <span [attr.data-file]="row[0]">{{ row[0] }}</span>
          <span [attr.data-file]="row[0]">{{ row[1] }}</span>
        }
      </div>
      <sl-menu
        #actions
        [portal]="false"
        [attr.aria-label]="file() ?? 'File actions'"
        (openChangeRequest)="remember($event)"
      >
        <sl-menu-group [label]="file() ?? 'File'">
          <button slMenuItem>Open</button>
          <button slMenuItem>Share…</button>
          <button slMenuItem>Download</button>
        </sl-menu-group>
        <hr slMenuSeparator />
        <button slMenuItem tone="danger">Move to trash</button>
      </sl-menu>
    </div>
  `,
})
class RowsDemo {
  readonly files = FILES;
  readonly file = signal<string | null>(null);

  remember(request: { value: boolean; source?: unknown }) {
    if (!request.value) return;
    const target = (request.source as Event | undefined)?.target;
    const row = target instanceof Element ? target.closest('[data-file]') : null;
    this.file.set(row?.getAttribute('data-file') ?? null);
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CONTEXT_MENU_DOCS.contextMenu.scenes, {
    disabled: Disabled,
    keyboard: Keyboard,
    'other-path': OtherPath,
    playground: Playground,
    rows: Rows,
    states: States,
    target: Target,
    touch: Touch,
  }) as never;

const meta: Meta<ContextMenuStoryArgs> = {
  title: 'Components/Context menu',
  decorators: [
    moduleMetadata({
      imports: [
        NgTemplateOutlet,
        RowsDemo,
        SlButton,
        SlContextMenuTrigger,
        SlHeading,
        SlMenu,
        SlMenuGroup,
        SlMenuItem,
        SlMenuSeparator,
        SlMenuTrigger,
        SlText,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Context menu',
        description:
          'A menu opened from a point: a secondary click, a long press or Shift+F10 on a region. The target is the family; the menu is the menu family unchanged.',
        framework: 'Angular',
        ...ANGULAR_CONTEXT_MENU_DOCS.contextMenu,
        tokens: ANGULAR_CONTEXT_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ContextMenuStoryArgs>;

export const Playground: Story = {
  args: { disabled: false, longPress: true, longPressDelay: 500, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: viewport(`
      ${tile('actions', 'Q3 board deck.pdf', '4.2 MB · edited yesterday', '[longPress]="longPress" [longPressDelay]="longPressDelay" tabindex="0"')}
      <sl-menu
        #actions
        [open]="true"
        [portal]="false"
        [disabled]="disabled"
        [size]="size"
        aria-label="Document actions"
      >
        ${COMMANDS}
      </sl-menu>
    `),
  }),
};

export const Target: Story = {
  parameters: scenario('target'),
  render: () => ({
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          'At rest',
          'Nothing is painted on the region: the card is the card. Right-click anywhere on it.',
          viewport(
            `
            ${tile('rest', 'Hiring plan.xlsx', '640 KB · edited 3 days ago', 'tabindex="0"')}
            <sl-menu #rest [portal]="false" aria-label="Document actions">${COMMANDS}</sl-menu>
          `,
            'layer',
          ),
        )}
        ${scene(
          'Open',
          'The inward mark says which tile the commands act on; opened from a bound [open], the menu hangs from the tile.',
          viewport(`
            ${tile('open', 'Brand book.pdf', '18 MB · edited Feb 27', 'tabindex="0"')}
            <sl-menu #open [open]="true" [portal]="false" aria-label="Document actions">${COMMANDS}</sl-menu>
          `),
        )}
      </div>
    `,
  }),
};

export const Rows: Story = {
  parameters: scenario('rows'),
  render: () => ({ template: `<sl-demo-context-menu-rows />` }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: viewport(`
      ${tile('actions', 'Release notes 4.2.md', '12 KB · edited 3 days ago · Tab here, then Shift+F10', 'tabindex="0" aria-label="Release notes 4.2"')}
      <sl-menu #actions [open]="true" [portal]="false">${COMMANDS}</sl-menu>
    `),
  }),
};

export const Touch: Story = {
  parameters: scenario('touch'),
  decorators: [
    moduleMetadata({ providers: [provideContextMenuDefaults({ longPressDelay: 400 })] }),
  ],
  render: () => ({
    template: viewport(`
      ${tile('actions', 'Roadmap.fig', 'Hold for 400 ms on a touch screen')}
      <sl-menu #actions [open]="true" [portal]="false" aria-label="Document actions">${COMMANDS}</sl-menu>
    `),
  }),
};

export const OtherPath: Story = {
  parameters: scenario('other-path'),
  render: () => ({
    template: viewport(`
      <ng-template #commands>
        <button slMenuItem shortcut="Enter">Open</button>
        <button slMenuItem shortcut="F2">Rename</button>
        <button slMenuItem>Download</button>
        <hr slMenuSeparator />
        <button slMenuItem tone="danger">Move to trash</button>
      </ng-template>
      ${tile(
        'fromRegion',
        'Supplier contract — Meridian.docx',
        '1.8 MB · edited yesterday',
        'tabindex="0"',
        `
        <button slButton size="sm" variant="outline" [slMenuTriggerFor]="fromButton">Actions</button>
        <sl-menu #fromButton [open]="true" [portal]="false">
          <ng-container *ngTemplateOutlet="commands" />
        </sl-menu>
      `,
      )}
      <sl-menu #fromRegion [portal]="false" aria-label="Document actions">
        <ng-container *ngTemplateOutlet="commands" />
      </sl-menu>
    `),
  }),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => ({
    template: viewport(
      `
      ${tile('actions', 'Archive 2023.zip', "Right-click opens the browser's own menu")}
      <sl-menu #actions [disabled]="true" [portal]="false">${COMMANDS}</sl-menu>
    `,
      'layer',
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
      <div class="slotted-demo-grid" data-columns="3">
        ${scene(
          'Rest',
          "Nothing painted: the region is the consumer's.",
          viewport(
            `
            ${tile('rest', 'Roadmap.fig', 'rest')}
            <sl-menu #rest [portal]="false">${COMMANDS}</sl-menu>
          `,
            'layer',
          ),
        )}
        ${scene(
          'Open',
          'The inward mark, in the colour that separates surfaces.',
          viewport(
            `
            ${tile('open', 'Brand book.pdf', 'open')}
            <sl-menu #open [open]="true" [portal]="false" aria-label="Brand book actions">
              <button slMenuItem>Open</button>
              <button slMenuItem>Download</button>
            </sl-menu>
          `,
            'layer',
          ),
        )}
        ${scene(
          'Disabled',
          "Nothing painted; the browser's menu is the one that opens.",
          viewport(
            `
            ${tile('off', 'Archive 2023.zip', 'disabled')}
            <sl-menu #off [disabled]="true" [portal]="false">${COMMANDS}</sl-menu>
          `,
            'layer',
          ),
        )}
      </div>
    `,
  }),
};
