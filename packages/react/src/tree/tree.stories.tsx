import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { TextField } from '../text-field';
import { Tree } from './tree';
import { TreeDefaultsProvider } from './tree-defaults';
import { TreeNode } from './tree-parts';
import { REACT_TREE_DOCS, REACT_TREE_TOKENS } from './tree.docs';
import type { TreeValue } from './tree.types';

interface Entry {
  id: string;
  name: string;
  entries?: Entry[];
  count?: string;
  locked?: boolean;
  more?: number;
  note?: string;
}

const FILES: Entry[] = [
  {
    id: 'src',
    name: 'src',
    count: '12',
    entries: [
      { id: 'index.ts', name: 'index.ts' },
      {
        id: 'lib',
        name: 'lib',
        count: '2',
        entries: [
          { id: 'collection.ts', name: 'collection.ts', count: '4 kB' },
          { id: 'tree.ts', name: 'tree.ts', note: 'edited' },
        ],
      },
    ],
  },
  { id: 'docs', name: 'docs', more: 3 },
  { id: 'readme', name: 'README.md' },
];

const PERMISSIONS: Entry[] = [
  {
    id: 'reports',
    name: 'Reports',
    entries: [
      { id: 'revenue', name: 'Revenue' },
      { id: 'churn', name: 'Churn' },
      { id: 'payroll', name: 'Payroll', note: 'no access', locked: true },
    ],
  },
  { id: 'audit', name: 'Audit log', entries: [{ id: 'exports', name: 'Exports' }] },
];

const DEEP: Entry[] = [
  {
    id: 'packages',
    name: 'packages',
    entries: [
      {
        id: 'core',
        name: 'core',
        entries: [
          {
            id: 'collection',
            name: 'collection',
            entries: [
              { id: 'tree-ts', name: 'tree.ts', count: '18 kB' },
              { id: 'items-ts', name: 'items.ts' },
            ],
          },
        ],
      },
    ],
  },
];

const REGIONS: Entry[] = Array.from({ length: 40 }, (_, region) => ({
  id: `region-${region}`,
  name: `Region ${String(region + 1).padStart(2, '0')}`,
  entries: Array.from({ length: 100 }, (_, row) => ({
    id: `region-${region}-row-${row}`,
    name: `Row ${String(row + 1).padStart(3, '0')}`,
  })),
}));

const FolderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

/** The composed shape, written out once and reused by most of the scenes. */
const nodesOf = (entries: readonly Entry[]): ReactNode =>
  entries.map((entry) => (
    <TreeNode
      key={entry.id}
      value={entry.id}
      label={entry.name}
      {...(entry.note === undefined ? {} : { description: entry.note })}
      {...(entry.count === undefined ? {} : { meta: entry.count })}
      {...(entry.locked === true ? { disabled: true } : {})}
      {...(entry.more === undefined ? {} : { hasChildren: true })}
    >
      {entry.entries === undefined ? undefined : nodesOf(entry.entries)}
    </TreeNode>
  ));

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

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TREE_DOCS.tree.scenes, {
    playground: Playground,
    expansion: Expansion,
    selection: Selection,
    cascade: Cascade,
    indicator: Indicator,
    guides: Guides,
    size: Size,
    variant: Variant,
    states: States,
    'empty-and-loading': EmptyAndLoading,
    'lazy-loading': LazyLoading,
    filtering: Filtering,
    virtualization: Virtualization,
    content: Content,
    forms: Forms,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Tree',
  component: Tree,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tree',
        description:
          'A hierarchy the reader opens, walks and chooses from, with a cascade, a filter that keeps ancestors, and a window that keeps the active node addressable.',
        framework: 'React',
        ...REACT_TREE_DOCS.tree,
        tokens: REACT_TREE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    disabled: false,
    expandOn: 'row',
    guides: true,
    loading: false,
    loop: false,
    selectionBehavior: 'toggle',
    selectionCascade: 'none',
    selectionIndicator: 'auto',
    selectionMode: 'single',
    size: 'md',
    typeahead: true,
    variant: 'plain',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Tree {...args} aria-label="Project files" defaultExpandedKeys={['src', 'lib']}>
      {nodesOf(FILES)}
    </Tree>
  ),
};

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="expandOn=row"
        note="The whole band opens the branch, which is a larger target than any chevron and what a file browser does."
      >
        <Tree aria-label="Files, row" defaultExpandedKeys={['src']}>
          {nodesOf(FILES)}
        </Tree>
      </Scene>
      <Scene
        label="expandOn=expander"
        note="The chevron alone opens it, and its hit area is grown to the WCAG minimum without the artwork growing. The row is then free to select."
      >
        <Tree aria-label="Files, chevron" expandOn="expander" defaultExpandedKeys={['src']}>
          {nodesOf(FILES)}
        </Tree>
      </Scene>
    </div>
  ),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="single"
        note="One choice at a time, said with the row's ground and its ink. aria-selected is what a reader hears."
      >
        <Tree aria-label="One file" defaultExpandedKeys={['src']} defaultValue="index.ts">
          {nodesOf(FILES)}
        </Tree>
      </Scene>
      <Scene
        label="multiple"
        note="A set, said with the box the checkbox family draws. aria-checked replaces aria-selected; the pattern forbids both at once."
      >
        <Tree
          aria-label="Several files"
          selectionMode="multiple"
          defaultExpandedKeys={['src']}
          defaultValue={['index.ts']}
        >
          {nodesOf(FILES)}
        </Tree>
      </Scene>
      <Scene
        label="none"
        note="A navigation tree chooses nothing: neither attribute is written, and a leaf takes the arrow cursor back."
      >
        <Tree aria-label="Navigation" selectionMode="none" defaultExpandedKeys={['src']}>
          {nodesOf(FILES)}
        </Tree>
      </Scene>
    </div>
  ),
};

export const Cascade: Story = {
  parameters: scenario('cascade'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="selectionCascade=descendants"
        note="Press Reports. Every enabled report follows, Payroll is left exactly where it was, and a branch holding part of a set draws the dash rather than the tick."
      >
        <Tree
          aria-label="Permissions"
          selectionMode="multiple"
          selectionCascade="descendants"
          nodes={PERMISSIONS}
          getKey={(entry: Entry) => entry.id}
          getLabel={(entry: Entry) => entry.name}
          getChildren={(entry: Entry) => entry.entries}
          isNodeDisabled={(entry: Entry) => entry.locked === true}
          defaultExpandedKeys={['reports']}
          defaultValue={['revenue']}
        />
      </Scene>
      <Scene
        label="a collapsed branch that holds a choice"
        note="Close Reports with Revenue still chosen. The branch keeps the accent ink, because a selection that disappears when its branch closes is one the reader has lost."
      >
        <Tree
          aria-label="Permissions, closed"
          selectionMode="multiple"
          selectionCascade="descendants"
          nodes={PERMISSIONS}
          getKey={(entry: Entry) => entry.id}
          getLabel={(entry: Entry) => entry.name}
          getChildren={(entry: Entry) => entry.entries}
          defaultValue={['revenue']}
        />
      </Scene>
    </div>
  ),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="highlight"
        note="No mark and no cell for one. A mark empty on every unchosen row is a gutter down a tree that already spends a cell on the chevron and one per level on the indent."
      >
        <Tree
          aria-label="Highlighted"
          selectionIndicator="highlight"
          defaultExpandedKeys={['src']}
          defaultValue="index.ts"
        >
          {nodesOf(FILES)}
        </Tree>
      </Scene>
      <Scene
        label="checkbox"
        note="The box the checkbox family draws, value for value: same square, same edge, same two pixels of clearance around the mark."
      >
        <Tree
          aria-label="Checked"
          selectionIndicator="checkbox"
          defaultExpandedKeys={['src']}
          defaultValue="index.ts"
        >
          {nodesOf(FILES)}
        </Tree>
      </Scene>
    </div>
  ),
};

export const Guides: Story = {
  parameters: scenario('guides'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="guides on"
        note="One line per ancestor level, each under the chevron of the level above it. At depth four the line is the only thing saying which folder a file belongs to."
      >
        <Tree
          aria-label="Deep, with guides"
          defaultExpandedKeys={['packages', 'core', 'collection']}
        >
          {nodesOf(DEEP)}
        </Tree>
      </Scene>
      <Scene
        label="guides off"
        note="The indent alone. It reads at two levels and stops reading at four, which is the whole reason the lines exist."
      >
        <Tree
          aria-label="Deep, without guides"
          guides={false}
          defaultExpandedKeys={['packages', 'core', 'collection']}
        >
          {nodesOf(DEEP)}
        </Tree>
      </Scene>
    </div>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['sm', 'md', 'lg'] as const).map((step) => (
        <Scene
          key={step}
          label={step}
          note={`The ${step} step: the row height, the type, the glyph and the indent move together, and the distance from a guide to its chevron does not.`}
        >
          <Tree aria-label={`Files, ${step}`} size={step} defaultExpandedKeys={['src', 'lib']}>
            {nodesOf(FILES)}
          </Tree>
        </Scene>
      ))}
    </div>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="plain"
        note="What a tree is by default: no box at all, for the pane or drawer it almost always sits in. Two edges a pixel apart is what this value exists to prevent."
      >
        <Tree aria-label="Plain" defaultExpandedKeys={['src']}>
          {nodesOf(FILES)}
        </Tree>
      </Scene>
      <Scene
        label="framed"
        note="Its own edge, its own radius, its own resting shadow, for the minority case: a standalone picker on a page with nothing else around it."
      >
        <Tree aria-label="Framed" variant="framed" defaultExpandedKeys={['src']}>
          {nodesOf(FILES)}
        </Tree>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="every state a row can be in"
        note="Hover the first, tab in for the ring, and read the rest: chosen outranks the row the keyboard is on, and disabled outranks everything above it."
      >
        <Tree
          aria-label="States"
          selectionMode="multiple"
          defaultValue={['chosen']}
          defaultActiveKey="current"
          defaultExpandedKeys={['fetching']}
        >
          <TreeNode value="rest" label="At rest" />
          <TreeNode value="current" label="Where the keyboard is" />
          <TreeNode value="chosen" label="Chosen" />
          <TreeNode value="out" label="Out of reach" description="no access" disabled />
          <TreeNode value="fetching" label="Fetching its children" hasChildren loading>
            <TreeNode value="pending" label="…" />
          </TreeNode>
        </Tree>
      </Scene>
    </div>
  ),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="loading"
        note="The whole set is still on its way: the tree says aria-busy and holds its name and its role while it waits."
      >
        <Tree
          aria-label="Loading"
          loading
          nodes={[]}
          getKey={(entry: Entry) => entry.id}
          emptyContent="Fetching your files…"
        />
      </Scene>
      <Scene
        label="empty"
        note="Nothing matched. The empty part replaces no row, and the tree keeps the accessible name the pattern requires of it."
      >
        <Tree
          aria-label="Empty"
          nodes={FILES}
          getKey={(entry: Entry) => entry.id}
          getLabel={(entry: Entry) => entry.name}
          getChildren={(entry: Entry) => entry.entries}
          query="invoices"
          emptyContent="No folder matches “invoices”"
        />
      </Scene>
    </div>
  ),
};

function LazyTree() {
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [pending, setPending] = useState<readonly string[]>([]);
  const [loaded, setLoaded] = useState<readonly string[]>([]);

  const roots: Entry[] = [
    {
      id: 'docs',
      name: 'docs',
      more: 3,
      ...(loaded.includes('docs')
        ? {
            entries: [
              { id: 'guide', name: 'guide.md' },
              { id: 'api', name: 'api.md' },
              { id: 'faq', name: 'faq.md' },
            ],
          }
        : {}),
    },
    { id: 'readme', name: 'README.md' },
  ];

  return (
    <Tree
      aria-label="Lazy files"
      nodes={roots}
      getKey={(entry: Entry) => entry.id}
      getLabel={(entry: Entry) => entry.name}
      getChildren={(entry: Entry) => entry.entries}
      hasChildren={(entry: Entry) => entry.entries !== undefined || entry.more !== undefined}
      getChildrenCount={(entry: Entry) => entry.more}
      isNodeLoading={(entry: Entry) => pending.includes(entry.id)}
      expandedKeys={expanded}
      onExpandedKeysChange={(keys) => {
        setExpanded(keys);
        for (const key of keys) {
          if (loaded.includes(key) || pending.includes(key)) continue;
          setPending((held) => [...held, key]);
          setTimeout(() => {
            setLoaded((held) => [...held, key]);
            setPending((held) => held.filter((candidate) => candidate !== key));
          }, 1200);
        }
      }}
    />
  );
}

export const LazyLoading: Story = {
  parameters: scenario('lazy-loading'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="children that arrive after the branch opens"
        note="Press docs. The ring stands where the chevron stood so nothing moves, the group says aria-busy, and the names arrive a second later."
      >
        <LazyTree />
      </Scene>
    </div>
  ),
};

function FilteredTree() {
  const [query, setQuery] = useState('tre');
  return (
    <div className="slotted-demo-stack">
      <TextField aria-label="Search files" value={query} onValueChange={setQuery} />
      <Tree
        aria-label="Filtered files"
        query={query}
        nodes={FILES}
        getKey={(entry: Entry) => entry.id}
        getLabel={(entry: Entry) => entry.name}
        getChildren={(entry: Entry) => entry.entries}
        emptyContent="Nothing matches"
      />
    </div>
  );
}

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="a query the consumer owns"
        note="Type in the field. Every hit keeps its ancestors, the matched span is marked, and the path opens without the tree touching the set the reader opened."
      >
        <FilteredTree />
      </Scene>
    </div>
  ),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="four thousand rows"
        note="Scroll it. Only the covered slice is rendered, the rows lie flat with their level stated, and the node the keyboard is on stays in the document however far it is scrolled away."
      >
        <Tree
          aria-label="Regions"
          virtual
          itemSize={32}
          nodes={REGIONS}
          getKey={(entry: Entry) => entry.id}
          getLabel={(entry: Entry) => entry.name}
          getChildren={(entry: Entry) => entry.entries}
          defaultExpandedKeys={['region-0', 'region-1']}
          defaultActiveKey="region-0"
        />
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="content the tree did not choose"
        note="An unbroken name, a translated one twice the length, and a right-to-left name in a left-to-right tree. Each takes its own direction and truncates rather than pushing the count out."
      >
        <Tree aria-label="Content" defaultExpandedKeys={['folder']}>
          <TreeNode value="folder" label="Downloads" icon={<FolderIcon />} meta="4">
            <TreeNode
              value="unbroken"
              label="umsehrlangerdateinamederniemalsumbrichtundtrotzdemlesbarbleibensoll.ts"
              icon={<FileIcon />}
              meta="18 kB"
            />
            <TreeNode
              value="translated"
              label="Quartalsbericht-Zusammenfassung-2026.pdf"
              icon={<FileIcon />}
              description="edited"
              meta="2 MB"
            />
            <TreeNode value="rtl" label="تقرير-الربع-الأول.pdf" icon={<FileIcon />} meta="1 MB" />
          </TreeNode>
        </Tree>
      </Scene>
    </div>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="a tree that submits"
        note="One hidden input per chosen key, under the name the form reads. Choose two reports and submit: the set arrives without a controlled value anywhere."
      >
        <form
          action="#"
          method="post"
          className="slotted-demo-stack"
          onSubmit={(event) => event.preventDefault()}
        >
          <Tree
            aria-label="Permissions"
            name="scopes"
            selectionMode="multiple"
            nodes={PERMISSIONS}
            getKey={(entry: Entry) => entry.id}
            getLabel={(entry: Entry) => entry.name}
            getChildren={(entry: Entry) => entry.entries}
            defaultExpandedKeys={['reports']}
            defaultValue={['revenue']}
          />
          <Button type="submit">Save</Button>
        </form>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="what a row can hold"
        note="A picture, a second line, a count and a trailing control. The actions stay in the DOM and stay reachable rather than appearing on hover."
      >
        <Tree aria-label="Composed" defaultExpandedKeys={['folder']}>
          <TreeNode value="folder" label="Reports" icon={<FolderIcon />} meta="3">
            <TreeNode
              value="q1"
              label="Q1.pdf"
              icon={<FileIcon />}
              description="shared"
              meta="1 MB"
              actions={
                <Button size="sm" variant="ghost">
                  Open
                </Button>
              }
            />
          </TreeNode>
        </Tree>
      </Scene>
      <Scene
        label="setting the axes once"
        note="A provider gives every tree under it the same step and the same expansion target. A tree that states one itself still wins."
      >
        <TreeDefaultsProvider size="sm" expandOn="expander" guides={false}>
          <Tree aria-label="Provided" defaultExpandedKeys={['src']}>
            {nodesOf(FILES)}
          </Tree>
        </TreeDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="every key the pattern gives a tree"
        note="Tab in and try them: the sideways arrows open, enter and leave a branch; Home and End cross the list; the asterisk opens every sibling at the level."
      >
        <Tree
          aria-label="Keyboard"
          selectionMode="multiple"
          defaultExpandedKeys={['src', 'lib']}
          defaultActiveKey="src"
        >
          {nodesOf(FILES)}
        </Tree>
      </Scene>
    </div>
  ),
};

function AnnouncedTree() {
  const [chosen, setChosen] = useState<TreeValue>('index.ts');
  return (
    <div className="slotted-demo-stack">
      <h3 id="tree-files-heading" className="slotted-demo-scene__label">
        Project files
      </h3>
      <Tree
        aria-labelledby="tree-files-heading"
        value={chosen}
        onValueChange={setChosen}
        defaultExpandedKeys={['src', 'lib']}
      >
        {nodesOf(FILES)}
      </Tree>
    </div>
  );
}

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="the name, and what a node is called"
        note="The tree takes its name from the heading above it. Each node is named by its own label, so a folder is not announced as every file inside it."
      >
        <AnnouncedTree />
      </Scene>
    </div>
  ),
};
