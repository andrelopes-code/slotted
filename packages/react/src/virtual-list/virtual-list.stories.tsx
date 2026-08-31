import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../badge';
import { VirtualList } from './virtual-list';
import { REACT_VIRTUAL_LIST_DOCS, REACT_VIRTUAL_LIST_TOKENS } from './virtual-list.docs';
import { VirtualListItem } from './virtual-list-item';

const FRAME = { blockSize: '18rem' };

/**
 * A windowed list is the first component whose demonstration needs more rows
 * than anyone would write out. They are generated from the index, so a story
 * of a hundred thousand rows costs the same as a story of ten.
 */
const CITIES = ['Lisbon', 'Osaka', 'Bogotá', 'Tallinn', 'Nairobi', 'Perth', 'Reykjavík'];
const STATUS = ['ready', 'queued', 'running'] as const;

const label = (index: number) => `${CITIES[index % CITIES.length]} ${1000 + index}`;

const row = (index: number) => <VirtualListItem index={index}>{label(index)}</VirtualListItem>;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Scale as never,
});

const meta = {
  title: 'Components/VirtualList',
  component: VirtualList,
  args: { children: row, itemCount: 5000, itemSize: 44, overscan: 4 },
  argTypes: { children: { table: { disable: true } } },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VirtualList',
        description: 'A list of any length that renders only the rows near the viewport.',
        framework: 'React',
        ...REACT_VIRTUAL_LIST_DOCS.virtualList,
        tokens: REACT_VIRTUAL_LIST_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <VirtualList {...args} aria-label="Playground rows" style={FRAME} />
    </div>
  ),
};

export const Scale: Story = {
  parameters: scenario('scale'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">100 rows</span>
          <span className="slotted-demo-scene__note">
            Short enough to render whole, and windowed anyway.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <VirtualList aria-label="One hundred rows" itemCount={100} itemSize={40} style={FRAME}>
            {row}
          </VirtualList>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">100,000 rows</span>
          <span className="slotted-demo-scene__note">
            The same handful of elements, and a scrollbar that means it.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <VirtualList
            aria-label="One hundred thousand rows"
            itemCount={100_000}
            itemSize={40}
            style={FRAME}
          >
            {row}
          </VirtualList>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <VirtualList aria-label="Reported rows" itemCount={9999} itemSize={40} style={FRAME}>
          {(index) => (
            <VirtualListItem index={index}>
              {label(index)}
              <span className="slotted-demo-scene__note">item {index + 1} of 9,999</span>
            </VirtualListItem>
          )}
        </VirtualList>
        <ul>
          <li>
            Every rendered row carries <code>aria-setsize=&quot;9999&quot;</code> and its own{' '}
            <code>aria-posinset</code>, so the list reports its real length rather than the number
            of elements it happens to hold.
          </li>
          <li>
            The root is <code>role=&quot;list&quot;</code> with <code>tabindex=&quot;0&quot;</code>.
            Tab to it, then scroll with the arrows, Page Up and Page Down, Home and End — all of it
            the platform&rsquo;s, none of it bound by the component.
          </li>
          <li>
            The element between the list and its rows is <code>role=&quot;none&quot;</code>, so the
            rows are owned by the list and not by a generic container.
          </li>
        </ul>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <VirtualList aria-label="Jobs" itemCount={20_000} itemSize={52} style={FRAME}>
        {(index) => (
          <VirtualListItem index={index}>
            <Badge variant={index % 3 === 2 ? 'accent' : 'secondary'}>
              {STATUS[index % STATUS.length]}
            </Badge>
            <span>{label(index)}</span>
          </VirtualListItem>
        )}
      </VirtualList>
    </div>
  ),
};
