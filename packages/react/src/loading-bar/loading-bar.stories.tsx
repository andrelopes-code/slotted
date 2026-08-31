import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingBar } from './loading-bar';
import { REACT_LOADING_BAR_DOCS, REACT_LOADING_BAR_TOKENS } from './loading-bar.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Placement as never,
});

const meta = {
  title: 'Components/LoadingBar',
  component: LoadingBar,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'LoadingBar',
        description: 'A page-level wait, drawn as a line across the top of what is waiting.',
        framework: 'React',
        ...REACT_LOADING_BAR_DOCS.loadingBar,
        tokens: REACT_LOADING_BAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof LoadingBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const frame = { blockSize: '5rem', border: '1px dashed', position: 'relative' } as const;

export const Playground: Story = {
  args: { 'aria-label': 'Loading page', max: 100, placement: 'inline', value: null },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <LoadingBar {...args} />
    </div>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">inline</span>
          <span className="slotted-demo-scene__note">
            In the flow, above the region that is loading.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div style={frame}>
            <LoadingBar aria-label="Loading the table" />
            <p style={{ padding: '0.5rem' }}>The table below is being fetched.</p>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">fixed</span>
          <span className="slotted-demo-scene__note">
            Pinned to the viewport; nothing on the page moves.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <p>
            A fixed bar leaves the flow entirely and sits at the top of the window, which is why it
            is not shown inside this frame: it would be at the top of the page, not of the box.
          </p>
        </div>
      </section>
    </div>
  ),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <LoadingBar aria-label="Loading page" />
        <p>
          No value, so no position is reported: aria-valuenow is absent rather than zero. This is
          the ordinary case for a page-level wait, which is why it is the default.
        </p>
        <LoadingBar aria-label="Uploading" max={4} value={1} valueText="Step 1 of 4" />
        <p>
          A determinate bar reports a position and, when the percentage would say less than words,
          the words instead.
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
        <span id="loading-bar-a11y-label">Loading invoices</span>
        <LoadingBar aria-labelledby="loading-bar-a11y-label" />
        <p role="status">Loading invoices…</p>
        <p>
          The bar takes its name from the visible text and reports no position, because it does not
          have one. The status message beside it is what a screen reader actually announces: the bar
          is a picture of a wait, and a picture announces nothing.
        </p>
      </div>
    </div>
  ),
};
