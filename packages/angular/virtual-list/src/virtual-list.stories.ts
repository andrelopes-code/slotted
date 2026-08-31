import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBadge } from '../../badge/src/badge';
import { SlVirtualList } from './virtual-list';
import { ANGULAR_VIRTUAL_LIST_DOCS, ANGULAR_VIRTUAL_LIST_TOKENS } from './virtual-list.docs';
import { SlVirtualListItem } from './virtual-list-item';

interface VirtualListStoryArgs {
  itemCount: number;
  itemSize: number;
  overscan: number;
}

const FRAME = 'block-size: 18rem';

/**
 * A windowed list is the first component whose demonstration needs more rows
 * than anyone would write out. They are generated from the index, so a story
 * of a hundred thousand rows costs the same as a story of ten.
 */
const CITIES = ['Lisbon', 'Osaka', 'Bogotá', 'Tallinn', 'Nairobi', 'Perth', 'Reykjavík'];
const STATUS = ['ready', 'queued', 'running'];

const label = (index: number) => `${CITIES[index % CITIES.length]} ${1000 + index}`;
const status = (index: number) => STATUS[index % STATUS.length];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Scale as never,
});

const meta: Meta<VirtualListStoryArgs> = {
  title: 'Components/VirtualList',
  component: SlVirtualList,
  decorators: [moduleMetadata({ imports: [SlBadge, SlVirtualList, SlVirtualListItem] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VirtualList',
        description: 'A list of any length that renders only the rows near the viewport.',
        framework: 'Angular',
        ...ANGULAR_VIRTUAL_LIST_DOCS.virtualList,
        tokens: ANGULAR_VIRTUAL_LIST_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<VirtualListStoryArgs>;

export const Playground: Story = {
  args: { itemCount: 5000, itemSize: 44, overscan: 4 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...args, label },
    template: `
<div class="slotted-demo-measure">
  <div
    slVirtualList
    #list="slVirtualList"
    aria-label="Playground rows"
    style="${FRAME}"
    [itemCount]="itemCount"
    [itemSize]="itemSize"
    [overscan]="overscan"
  >
    @for (index of list.indices(); track index) {
      <div slVirtualListItem [index]="index">{{ label(index) }}</div>
    }
  </div>
</div>`,
  }),
};

export const Scale: Story = {
  parameters: scenario('scale'),
  render: () => ({
    props: { label },
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">100 rows</span>
      <span class="slotted-demo-scene__note">Short enough to render whole, and windowed anyway.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slVirtualList #short="slVirtualList" aria-label="One hundred rows" style="${FRAME}" [itemCount]="100" [itemSize]="40">
        @for (index of short.indices(); track index) {
          <div slVirtualListItem [index]="index">{{ label(index) }}</div>
        }
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">100,000 rows</span>
      <span class="slotted-demo-scene__note">The same handful of elements, and a scrollbar that means it.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slVirtualList #long="slVirtualList" aria-label="One hundred thousand rows" style="${FRAME}" [itemCount]="100000" [itemSize]="40">
        @for (index of long.indices(); track index) {
          <div slVirtualListItem [index]="index">{{ label(index) }}</div>
        }
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: { label },
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slVirtualList #list="slVirtualList" aria-label="Reported rows" style="${FRAME}" [itemCount]="9999" [itemSize]="40">
      @for (index of list.indices(); track index) {
        <div slVirtualListItem [index]="index">
          {{ label(index) }}
          <span class="slotted-demo-scene__note">item {{ index + 1 }} of 9,999</span>
        </div>
      }
    </div>
    <ul>
      <li>
        Every rendered row carries <code>aria-setsize="9999"</code> and its own
        <code>aria-posinset</code>, so the list reports its real length rather than the number of
        elements it happens to hold.
      </li>
      <li>
        The root is <code>role="list"</code> with <code>tabindex="0"</code>. Tab to it, then scroll
        with the arrows, Page Up and Page Down, Home and End &mdash; all of it the platform&rsquo;s,
        none of it bound by the component.
      </li>
      <li>
        The element between the list and its rows is <code>role="none"</code>, so the rows are owned
        by the list and not by a generic container.
      </li>
    </ul>
  </div>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { label, status },
    template: `
<div class="slotted-demo-measure">
  <div slVirtualList #list="slVirtualList" aria-label="Jobs" style="${FRAME}" [itemCount]="20000" [itemSize]="52">
    @for (index of list.indices(); track index) {
      <div slVirtualListItem [index]="index">
        <span slBadge [variant]="index % 3 === 2 ? 'primary' : 'secondary'">{{ status(index) }}</span>
        <span>{{ label(index) }}</span>
      </div>
    }
  </div>
</div>`,
  }),
};
