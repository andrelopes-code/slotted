import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTree } from './tree';
import type {
  TreeExpandOn,
  TreeSelectionBehavior,
  TreeSelectionCascade,
  TreeSelectionIndicator,
  TreeSelectionMode,
  TreeSize,
  TreeVariant,
} from './tree-defaults';
import { provideTreeDefaults } from './tree-defaults';
import {
  SlTreeActions,
  SlTreeDescription,
  SlTreeEmpty,
  SlTreeGroup,
  SlTreeIcon,
  SlTreeLabel,
  SlTreeMeta,
  SlTreeNode,
} from './tree-parts';
import { ANGULAR_TREE_DOCS, ANGULAR_TREE_TOKENS } from './tree.docs';

interface TreeStoryArgs {
  disabled: boolean;
  expandOn: TreeExpandOn;
  guides: boolean;
  loading: boolean;
  loop: boolean;
  selectionBehavior: TreeSelectionBehavior;
  selectionCascade: TreeSelectionCascade;
  selectionIndicator: TreeSelectionIndicator;
  selectionMode: TreeSelectionMode;
  size: TreeSize;
  typeahead: boolean;
  variant: TreeVariant;
}

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

const CONTENT: Entry[] = [
  {
    id: 'downloads',
    name: 'Downloads',
    count: '3',
    entries: [
      {
        id: 'unbroken',
        name: 'umsehrlangerdateinamederniemalsumbrichtundtrotzdemlesbarbleibensoll.ts',
        count: '18 kB',
      },
      {
        id: 'translated',
        name: 'Quartalsbericht-Zusammenfassung-2026.pdf',
        note: 'edited',
        count: '2 MB',
      },
      { id: 'rtl', name: 'تقرير-الربع-الأول.pdf', count: '1 MB' },
    ],
  },
];

const IMPORTS = [
  SlTree,
  SlTreeActions,
  SlTreeDescription,
  SlTreeEmpty,
  SlTreeGroup,
  SlTreeIcon,
  SlTreeLabel,
  SlTreeMeta,
  SlTreeNode,
];

/** The accessors every data-driven story hands the tree. */
const accessors = {
  children: (entry: Entry) => entry.entries,
  count: (entry: Entry) => entry.more,
  isFolder: (entry: Entry) => entry.entries !== undefined || entry.more !== undefined,
  key: (entry: Entry) => entry.id,
  locked: (entry: Entry) => entry.locked === true,
  name: (entry: Entry) => entry.name,
};

const scene = (label: string, note: string, body: string) => `
<section class="slotted-demo-scene">
  <header class="slotted-demo-scene__header">
    <span class="slotted-demo-scene__label">${label}</span>
    <span class="slotted-demo-scene__note">${note}</span>
  </header>
  <div class="slotted-demo-stage" data-layout="block">${body}</div>
</section>`;

const grid = (...scenes: string[]) => `<div class="slotted-demo-grid">${scenes.join('\n')}</div>`;

/** One data-driven tree, with the accessors already wired. */
const driven = (attributes: string) => `
<div
  slTree
  [nodes]="nodes"
  [getKey]="key"
  [getLabel]="name"
  [getChildren]="children"
  [hasChildren]="isFolder"
  [getChildrenCount]="count"
  [isNodeDisabled]="locked"
  ${attributes}
></div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TREE_DOCS.tree.scenes, {
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

const meta: Meta<TreeStoryArgs> = {
  title: 'Components/Tree',
  component: SlTree,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tree',
        description:
          'A hierarchy the reader opens, walks and chooses from, with a cascade, a filter that keeps ancestors, and a window that keeps the active node addressable.',
        framework: 'Angular',
        ...ANGULAR_TREE_DOCS.tree,
        tokens: ANGULAR_TREE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TreeStoryArgs>;

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
  render: (args) => ({
    props: { ...args, ...accessors, nodes: FILES, open: ['src', 'lib'] },
    template: driven(`
  aria-label="Project files"
  [expandedKeys]="open"
  [size]="size"
  [variant]="variant"
  [guides]="guides"
  [expandOn]="expandOn"
  [selectionMode]="selectionMode"
  [selectionBehavior]="selectionBehavior"
  [selectionIndicator]="selectionIndicator"
  [selectionCascade]="selectionCascade"
  [loop]="loop"
  [typeahead]="typeahead"
  [disabled]="disabled"
  [loading]="loading"`),
  }),
};

export const Expansion: Story = {
  parameters: scenario('expansion'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src'] },
    template: grid(
      scene(
        'expandOn=row',
        'The whole band opens the branch, which is a larger target than any chevron and what a file browser does.',
        driven('aria-label="Files, row" [expandedKeys]="open"'),
      ),
      scene(
        'expandOn=expander',
        'The chevron alone opens it, and its hit area is grown to the WCAG minimum without the artwork growing. The row is then free to select.',
        driven('aria-label="Files, chevron" expandOn="expander" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src'], one: 'index.ts', many: ['index.ts'] },
    template: grid(
      scene(
        'single',
        "One choice at a time, said with the row's ground and its ink. aria-selected is what a reader hears.",
        driven('aria-label="One file" [expandedKeys]="open" [value]="one"'),
      ),
      scene(
        'multiple',
        'A set, said with the box the checkbox family draws. aria-checked replaces aria-selected; the pattern forbids both at once.',
        driven(
          'aria-label="Several files" selectionMode="multiple" [expandedKeys]="open" [value]="many"',
        ),
      ),
      scene(
        'none',
        'A navigation tree chooses nothing: neither attribute is written, and a leaf takes the arrow cursor back.',
        driven('aria-label="Navigation" selectionMode="none" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const Cascade: Story = {
  parameters: scenario('cascade'),
  render: () => ({
    props: { ...accessors, nodes: PERMISSIONS, open: ['reports'], chosen: ['revenue'] },
    template: grid(
      scene(
        'selectionCascade=descendants',
        'Press Reports. Every enabled report follows, Payroll is left exactly where it was, and a branch holding part of a set draws the dash rather than the tick.',
        driven(
          'aria-label="Permissions" selectionMode="multiple" selectionCascade="descendants" [expandedKeys]="open" [value]="chosen"',
        ),
      ),
      scene(
        'a collapsed branch that holds a choice',
        'Close Reports with Revenue still chosen. The branch keeps the accent ink, because a selection that disappears when its branch closes is one the reader has lost.',
        driven(
          'aria-label="Permissions, closed" selectionMode="multiple" selectionCascade="descendants" [value]="chosen"',
        ),
      ),
    ),
  }),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src'], one: 'index.ts' },
    template: grid(
      scene(
        'highlight',
        'No mark and no cell for one. A mark empty on every unchosen row is a gutter down a tree that already spends a cell on the chevron and one per level on the indent.',
        driven(
          'aria-label="Highlighted" selectionIndicator="highlight" [expandedKeys]="open" [value]="one"',
        ),
      ),
      scene(
        'checkbox',
        'The box the checkbox family draws, value for value: same square, same edge, same two pixels of clearance around the mark.',
        driven(
          'aria-label="Checked" selectionIndicator="checkbox" [expandedKeys]="open" [value]="one"',
        ),
      ),
    ),
  }),
};

export const Guides: Story = {
  parameters: scenario('guides'),
  render: () => ({
    props: { ...accessors, nodes: DEEP, open: ['packages', 'core', 'collection'] },
    template: grid(
      scene(
        'guides on',
        'One line per ancestor level, each under the chevron of the level above it. At depth four the line is the only thing saying which folder a file belongs to.',
        driven('aria-label="Deep, with guides" [expandedKeys]="open"'),
      ),
      scene(
        'guides off',
        'The indent alone. It reads at two levels and stops reading at four, which is the whole reason the lines exist.',
        driven('aria-label="Deep, without guides" [guides]="false" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src', 'lib'] },
    template: grid(
      ...(['sm', 'md', 'lg'] as const).map((step) =>
        scene(
          step,
          `The ${step} step: the row height, the type, the glyph and the indent move together, and the distance from a guide to its chevron does not.`,
          driven(`aria-label="Files, ${step}" size="${step}" [expandedKeys]="open"`),
        ),
      ),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src'] },
    template: grid(
      scene(
        'framed',
        'The standalone control: its own edge, its own radius, its own resting shadow. What a tree looks like on a page with nothing around it.',
        driven('aria-label="Framed" [expandedKeys]="open"'),
      ),
      scene(
        'plain',
        'No box at all, for a panel or a drawer that has drawn one already. Two edges a pixel apart is what this axis exists to prevent.',
        driven('aria-label="Plain" variant="plain" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    props: { open: ['fetching'], chosen: ['chosen'], active: 'current' },
    template: grid(
      scene(
        'every state a row can be in',
        'Hover the first, tab in for the ring, and read the rest: chosen outranks the row the keyboard is on, and disabled outranks everything above it.',
        `
<div
  slTree
  aria-label="States"
  selectionMode="multiple"
  [expandedKeys]="open"
  [value]="chosen"
  [activeKey]="active"
>
  <li slTreeNode value="rest" label="At rest"></li>
  <li slTreeNode value="current" label="Where the keyboard is"></li>
  <li slTreeNode value="chosen" label="Chosen"></li>
  <li slTreeNode value="out" label="Out of reach" disabled>
    <span slTreeDescription>no access</span>
  </li>
  <li slTreeNode value="fetching" label="Fetching its children" hasChildren loading>
    <ul slTreeGroup busy>
      <li slTreeNode value="pending" label="…"></li>
    </ul>
  </li>
</div>`,
      ),
    ),
  }),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => ({
    props: { ...accessors, empty: [], nodes: FILES },
    template: grid(
      scene(
        'loading',
        'The whole set is still on its way: the tree says aria-busy and holds its name and its role while it waits.',
        `
<div slTree aria-label="Loading" loading [nodes]="empty" [getKey]="key">
  <p slTreeEmpty>Fetching your files…</p>
</div>`,
      ),
      scene(
        'empty',
        'Nothing matched. The empty part replaces no row, and the tree keeps the accessible name the pattern requires of it.',
        `
<div
  slTree
  aria-label="Empty"
  query="invoices"
  [nodes]="nodes"
  [getKey]="key"
  [getLabel]="name"
  [getChildren]="children"
>
  <p slTreeEmpty>No folder matches “invoices”</p>
</div>`,
      ),
    ),
  }),
};

export const LazyLoading: Story = {
  parameters: scenario('lazy-loading'),
  render: () => ({
    props: {
      ...accessors,
      nodes: [
        { id: 'docs', name: 'docs', more: 3 },
        { id: 'readme', name: 'README.md' },
      ],
      open: ['docs'],
      pending: (entry: Entry) => entry.id === 'docs',
    },
    template: grid(
      scene(
        'children that arrive after the branch opens',
        'The ring stands where the chevron stood so nothing moves, the group says aria-busy, and the placeholder rows are the width names would have been.',
        driven('aria-label="Lazy files" [expandedKeys]="open" [isNodeLoading]="pending"'),
      ),
    ),
  }),
};

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: () => ({
    props: { ...accessors, nodes: FILES },
    template: grid(
      scene(
        'a query the consumer owns',
        'Every hit keeps its ancestors, the matched span is marked, and the path opens without the tree touching the set the reader opened.',
        driven('aria-label="Filtered files" query="tre"'),
      ),
    ),
  }),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => ({
    props: { ...accessors, nodes: REGIONS, open: ['region-0', 'region-1'], active: 'region-0' },
    template: grid(
      scene(
        'four thousand rows',
        'Scroll it. Only the covered slice is rendered, the rows lie flat with their level stated, and the node the keyboard is on stays in the document however far it is scrolled away.',
        driven(
          'aria-label="Regions" virtual [itemSize]="32" [expandedKeys]="open" [activeKey]="active"',
        ),
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { ...accessors, nodes: CONTENT, open: ['downloads'] },
    template: grid(
      scene(
        'content the tree did not choose',
        'An unbroken name, a translated one twice the length, and a right-to-left name in a left-to-right tree. Each takes its own direction and truncates rather than pushing the count out.',
        driven('aria-label="Content" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    props: { ...accessors, nodes: PERMISSIONS, open: ['reports'], chosen: ['revenue'] },
    template: grid(
      scene(
        'a tree that belongs to a form',
        'The tree is the control: a reactive control writes into it and reads back out of it, and required is the one rule the family decides from the value alone.',
        driven(
          'aria-label="Permissions" selectionMode="multiple" required [expandedKeys]="open" [value]="chosen"',
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [provideTreeDefaults({ expandOn: 'expander', guides: false, size: 'sm' })],
    }),
  ],
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src'] },
    template: grid(
      scene(
        'what a row can hold',
        'A picture, a second line, a count and a trailing control. The actions stay in the DOM and stay reachable rather than appearing on hover.',
        `
<div slTree aria-label="Composed" [expandedKeys]="open">
  <li slTreeNode value="reports" label="Reports" hasChildren>
    <span slTreeMeta>3</span>
    <ul slTreeGroup>
      <li slTreeNode value="q1" label="Q1.pdf">
        <span slTreeDescription>shared</span>
        <span slTreeMeta>1 MB</span>
        <span slTreeActions><button slButton size="sm" variant="ghost">Open</button></span>
      </li>
    </ul>
  </li>
</div>`,
      ),
      scene(
        'setting the axes once',
        'A provider gives every tree under it the same step and the same expansion target. A tree that states one itself still wins.',
        driven('aria-label="Provided" [expandedKeys]="open"'),
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src', 'lib'], active: 'src' },
    template: grid(
      scene(
        'every key the pattern gives a tree',
        'Tab in and try them: the sideways arrows open, enter and leave a branch; Home and End cross the list; the asterisk opens every sibling at the level.',
        driven(
          'aria-label="Keyboard" selectionMode="multiple" [expandedKeys]="open" [activeKey]="active"',
        ),
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { ...accessors, nodes: FILES, open: ['src', 'lib'] },
    template: grid(
      scene(
        'the name, and what a node is called',
        'The tree takes its name from the heading above it. Each node is named by its own label, so a folder is not announced as every file inside it.',
        `
<div class="slotted-demo-stack">
  <h3 id="tree-angular-files" class="slotted-demo-scene__label">Project files</h3>
  ${driven('aria-labelledby="tree-angular-files" [expandedKeys]="open"')}
</div>`,
      ),
    ),
  }),
};
