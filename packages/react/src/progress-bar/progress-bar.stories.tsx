import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressBar } from './progress-bar';
import { REACT_PROGRESS_BAR_DOCS, REACT_PROGRESS_BAR_TOKENS } from './progress-bar.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Values as never,
});

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ProgressBar',
        description: 'How far along something is, or that it is under way at all.',
        framework: 'React',
        ...REACT_PROGRESS_BAR_DOCS.progressBar,
        tokens: REACT_PROGRESS_BAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { 'aria-label': 'Uploading', max: 100, value: 40 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <ProgressBar {...args} />
    </div>
  ),
};

export const Values: Story = {
  parameters: scenario('values'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      {(
        [
          [0, 'Nothing done yet, and the track still holds the space.'],
          [40, 'Part way, painted from the start edge.'],
          [100, 'Complete, filling the track exactly.'],
          [140, 'Beyond the maximum: clamped, not overflowing.'],
        ] as const
      ).map(([value, note]) => (
        <section className="slotted-demo-scene" key={value}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">value={value}</span>
            <span className="slotted-demo-scene__note">{note}</span>
          </header>
          <div className="slotted-demo-stage">
            <ProgressBar aria-label={`Example at ${value}`} value={value} />
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <ProgressBar aria-label="Preparing export" value={null} />
        <p>
          Nothing knows how long this takes, so no position is reported: aria-valuenow is absent
          rather than zero, which is how a screen reader is told the position is unknown.
        </p>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <span id="progress-bar-upload-label">Uploading invoices</span>
        <ProgressBar
          aria-labelledby="progress-bar-upload-label"
          max={7}
          value={3}
          valueText="3 of 7 files"
        />
        <p>
          The name comes from the visible text beside it, and valueText replaces the percentage a
          screen reader would otherwise compute. A listener learns that three files of seven are
          done, which is what the number was ever standing in for.
        </p>
      </div>
    </div>
  ),
};
