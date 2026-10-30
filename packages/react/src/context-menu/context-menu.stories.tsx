import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Button } from '../button';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '../menu';
import { Heading, Text } from '../typography';
import { ContextMenu, ContextMenuTrigger } from './context-menu';
import { ContextMenuDefaultsProvider } from './context-menu-defaults';
import { REACT_CONTEXT_MENU_DOCS, REACT_CONTEXT_MENU_TOKENS } from './context-menu.docs';

/**
 * Every menu here opens `portal={false}` inside the workbench's own viewport
 * box, so a surface opened in one scene cannot draw over the scene above it.
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

const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'tall'}>
    {children}
  </div>
);

/**
 * A document in the library. The tile *is* the target: the mark the family
 * draws while its menu shows follows the tile's own corner, and a wrapper
 * around a card would have framed the card's rounded corners with a square.
 */
const Tile = ({
  children,
  meta,
  name,
  ...props
}: { meta: string; name: string } & ComponentPropsWithoutRef<typeof ContextMenuTrigger>) => (
  <ContextMenuTrigger
    className="slotted-demo-surface"
    data-flow="stack"
    data-surface="raised"
    {...props}
  >
    <Heading level={3} size="md">
      {name}
    </Heading>
    <Text size="sm" tone="muted">
      {meta}
    </Text>
    {children}
  </ContextMenuTrigger>
);

/** The commands a document has, wherever the menu that holds them opened from. */
const DocumentActions = ({ label = 'Document actions' }: { label?: string }) => (
  <MenuContent aria-label={label}>
    <MenuItem shortcut="Enter">Open</MenuItem>
    <MenuItem shortcut="F2">Rename</MenuItem>
    <MenuItem shortcut="Mod+D">Duplicate</MenuItem>
    <Menu portal={false}>
      <MenuTrigger>Move to</MenuTrigger>
      <MenuContent>
        <MenuItem>Finance</MenuItem>
        <MenuItem>Board</MenuItem>
        <MenuItem>Archive</MenuItem>
      </MenuContent>
    </Menu>
    <MenuSeparator />
    <MenuItem shortcut="Backspace" tone="danger">
      Move to trash
    </MenuItem>
  </MenuContent>
);

const FILES = [
  ['Invoice 2026-0412.pdf', '312 KB', 'Today'],
  ['Supplier contract — Meridian.docx', '1.8 MB', 'Yesterday'],
  ['Q3 board deck.pdf', '4.2 MB', 'Mon'],
  ['Onboarding checklist.md', '9 KB', 'Mar 3'],
  ['Brand book.pdf', '18 MB', 'Feb 27'],
] as const;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CONTEXT_MENU_DOCS.contextMenu.scenes, {
    disabled: Disabled,
    keyboard: Keyboard,
    'other-path': OtherPath,
    playground: Playground,
    rows: Rows,
    states: States,
    target: Target,
    touch: Touch,
  }) as never;

const meta = {
  title: 'Components/Context menu',
  component: ContextMenu,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Context menu',
        description:
          'A menu opened from a point: a secondary click, a long press or Shift+F10 on a region. The target is the family; the menu is the menu family unchanged.',
        framework: 'React',
        ...REACT_CONTEXT_MENU_DOCS.contextMenu,
        tokens: REACT_CONTEXT_MENU_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    disabled: false,
    longPress: true,
    longPressDelay: 500,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Viewport>
      <ContextMenu {...args} defaultOpen portal={false}>
        <Tile name="Q3 board deck.pdf" meta="4.2 MB · edited yesterday" tabIndex={0} />
        <DocumentActions />
      </ContextMenu>
    </Viewport>
  ),
};

export const Target: Story = {
  parameters: scenario('target'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="At rest"
        note="Nothing is painted on the region: the card is the card. Right-click anywhere on it."
      >
        <Viewport size="layer">
          <ContextMenu portal={false}>
            <Tile name="Hiring plan.xlsx" meta="640 KB · edited 3 days ago" tabIndex={0} />
            <DocumentActions />
          </ContextMenu>
        </Viewport>
      </Scene>
      <Scene
        label="Open"
        note="The inward mark says which tile the commands act on; opened from script, the menu hangs from the tile."
      >
        <Viewport>
          <ContextMenu defaultOpen portal={false}>
            <Tile name="Brand book.pdf" meta="18 MB · edited Feb 27" tabIndex={0} />
            <DocumentActions />
          </ContextMenu>
        </Viewport>
      </Scene>
    </div>
  ),
};

const RowsDemo = () => {
  const [file, setFile] = useState<string | null>(null);
  return (
    <Viewport>
      <ContextMenu
        onOpenChange={(open, request) => {
          if (!open) return;
          const target = (request.source as Event | undefined)?.target;
          const row = target instanceof Element ? target.closest('[data-file]') : null;
          setFile(row?.getAttribute('data-file') ?? null);
        }}
        portal={false}
      >
        <ContextMenuTrigger render={(props) => <div {...props} className="slotted-demo-rows" />}>
          {FILES.flatMap(([name, size, when]) => [
            <span data-file={name} key={`${name}-name`}>
              {name}
            </span>,
            <span data-file={name} key={`${name}-meta`}>
              {size} · {when}
            </span>,
          ])}
        </ContextMenuTrigger>
        <MenuContent aria-label={file ?? 'File actions'}>
          <MenuGroup>
            <MenuGroupLabel>{file ?? 'File'}</MenuGroupLabel>
            <MenuItem>Open</MenuItem>
            <MenuItem>Share…</MenuItem>
            <MenuItem>Download</MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem tone="danger">Move to trash</MenuItem>
        </MenuContent>
      </ContextMenu>
    </Viewport>
  );
};

export const Rows: Story = {
  parameters: scenario('rows'),
  render: () => <RowsDemo />,
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Viewport>
      <ContextMenu defaultOpen portal={false}>
        <Tile
          name="Release notes 4.2.md"
          meta="12 KB · edited 3 days ago · Tab here, then Shift+F10"
          aria-label="Release notes 4.2"
          tabIndex={0}
        />
        <DocumentActions />
      </ContextMenu>
    </Viewport>
  ),
};

export const Touch: Story = {
  parameters: scenario('touch'),
  render: () => (
    <ContextMenuDefaultsProvider longPressDelay={400}>
      <Viewport>
        <ContextMenu defaultOpen portal={false}>
          <Tile name="Roadmap.fig" meta="Hold for 400 ms on a touch screen" />
          <DocumentActions />
        </ContextMenu>
      </Viewport>
    </ContextMenuDefaultsProvider>
  ),
};

export const OtherPath: Story = {
  parameters: scenario('other-path'),
  render: () => (
    <Viewport>
      <ContextMenu portal={false}>
        <Tile
          meta="1.8 MB · edited yesterday"
          name="Supplier contract — Meridian.docx"
          tabIndex={0}
        >
          <Menu defaultOpen portal={false}>
            <MenuTrigger
              render={(props) => (
                <Button {...props} size="sm" variant="outline">
                  Actions
                </Button>
              )}
            />
            <DocumentActions />
          </Menu>
        </Tile>
        <DocumentActions />
      </ContextMenu>
    </Viewport>
  ),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => (
    <Viewport size="layer">
      <ContextMenu disabled portal={false}>
        <Tile name="Archive 2023.zip" meta="Right-click opens the browser's own menu" />
        <DocumentActions />
      </ContextMenu>
    </Viewport>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene label="Rest" note="Nothing painted: the region is the consumer's.">
        <Viewport size="layer">
          <ContextMenu portal={false}>
            <Tile name="Roadmap.fig" meta="rest" />
            <DocumentActions />
          </ContextMenu>
        </Viewport>
      </Scene>
      <Scene label="Open" note="The inward mark, in the color that separates surfaces.">
        <Viewport size="layer">
          <ContextMenu defaultOpen portal={false}>
            <Tile name="Brand book.pdf" meta="open" />
            <MenuContent aria-label="Brand book actions">
              <MenuItem>Open</MenuItem>
              <MenuItem>Download</MenuItem>
            </MenuContent>
          </ContextMenu>
        </Viewport>
      </Scene>
      <Scene label="Disabled" note="Nothing painted; the browser's menu is the one that opens.">
        <Viewport size="layer">
          <ContextMenu disabled portal={false}>
            <Tile name="Archive 2023.zip" meta="disabled" />
            <DocumentActions />
          </ContextMenu>
        </Viewport>
      </Scene>
    </div>
  ),
};
