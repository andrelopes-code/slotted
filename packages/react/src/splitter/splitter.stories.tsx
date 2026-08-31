import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Splitter } from './splitter';
import { REACT_SPLITTER_DOCS, REACT_SPLITTER_TOKENS } from './splitter.docs';
import { SplitterHandle } from './splitter-handle';
import { SplitterPane } from './splitter-pane';

const FRAME = { blockSize: '11rem' };

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Splitter',
  component: Splitter,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Splitter',
        description: 'Two regions whose shared boundary the reader can move.',
        framework: 'React',
        ...REACT_SPLITTER_DOCS.splitter,
        tokens: REACT_SPLITTER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Splitter>;

export default meta;
type Story = StoryObj<typeof meta>;

const pane = (title: string, body: string) => (
  <div style={{ padding: '0.75rem' }}>
    <strong>{title}</strong>
    <p>{body}</p>
  </div>
);

export const Playground: Story = {
  args: { defaultValue: 40, max: 90, min: 10, orientation: 'horizontal', step: 5 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Splitter {...args} style={FRAME}>
        <SplitterPane id="playground-nav">{pane('Navigation', 'Drag the boundary.')}</SplitterPane>
        <SplitterHandle aria-controls="playground-nav" aria-label="Resize navigation" />
        <SplitterPane>{pane('Content', 'Or focus the handle and use the arrows.')}</SplitterPane>
      </Splitter>
    </div>
  ),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">horizontal</span>
          <span className="slotted-demo-scene__note">
            Panes side by side; the separator is a vertical line.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Splitter defaultValue={40} style={FRAME}>
            <SplitterPane>{pane('Start', 'Left in this document.')}</SplitterPane>
            <SplitterHandle aria-label="Resize columns" />
            <SplitterPane>{pane('End', 'Right in this document.')}</SplitterPane>
          </Splitter>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">vertical</span>
          <span className="slotted-demo-scene__note">
            Panes stacked; the separator is a horizontal line.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Splitter defaultValue={40} orientation="vertical" style={FRAME}>
            <SplitterPane>{pane('Above', 'The first pane.')}</SplitterPane>
            <SplitterHandle aria-label="Resize rows" />
            <SplitterPane>{pane('Below', 'The second pane.')}</SplitterPane>
          </Splitter>
        </div>
      </section>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Splitter defaultValue={50} max={85} min={15} step={10} style={FRAME}>
          <SplitterPane>{pane('Start', 'Focus the handle with Tab.')}</SplitterPane>
          <SplitterHandle aria-label="Resize columns" />
          <SplitterPane>{pane('End', 'Then try the keys below.')}</SplitterPane>
        </Splitter>
        <ul>
          <li>Left and Right move the separator by one step, here ten percent.</li>
          <li>Home takes it to the minimum, End to the maximum — fifteen and eighty-five.</li>
          <li>Enter collapses the first pane, and Enter again restores where it was.</li>
          <li>Up and Down do nothing, so a page inside a pane still scrolls.</li>
        </ul>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Splitter defaultValue={30} max={60} min={15} style={{ blockSize: '16rem' }}>
        <SplitterPane>{pane('Files', 'One splitter.')}</SplitterPane>
        <SplitterHandle aria-label="Resize files" />
        <SplitterPane>
          <Splitter defaultValue={60} orientation="vertical" style={{ blockSize: '100%' }}>
            <SplitterPane>{pane('Editor', 'A second splitter inside the first.')}</SplitterPane>
            <SplitterHandle aria-label="Resize editor" />
            <SplitterPane>{pane('Output', 'Three regions, no coupled constraints.')}</SplitterPane>
          </Splitter>
        </SplitterPane>
      </Splitter>
    </div>
  ),
};
