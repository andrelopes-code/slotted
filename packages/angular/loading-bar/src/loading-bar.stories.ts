import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlLoadingBar } from './loading-bar';
import type { LoadingBarPlacement } from './loading-bar';
import { ANGULAR_LOADING_BAR_DOCS, ANGULAR_LOADING_BAR_TOKENS } from './loading-bar.docs';

interface LoadingBarStoryArgs {
  max: number;
  placement: LoadingBarPlacement;
  value: number | null;
}

const FRAME = 'block-size: 5rem; border: 1px dashed; position: relative';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Placement as never,
});

const meta: Meta<LoadingBarStoryArgs> = {
  title: 'Components/LoadingBar',
  component: SlLoadingBar,
  decorators: [moduleMetadata({ imports: [SlLoadingBar] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'LoadingBar',
        description: 'A page-level wait, drawn as a line across the top of what is waiting.',
        framework: 'Angular',
        ...ANGULAR_LOADING_BAR_DOCS.loadingBar,
        tokens: ANGULAR_LOADING_BAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<LoadingBarStoryArgs>;

export const Playground: Story = {
  args: { max: 100, placement: 'inline', value: null },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slLoadingBar aria-label="Loading page" [max]="max" [placement]="placement" [value]="value"></div>
</div>`,
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">inline</span>
      <span class="slotted-demo-scene__note">In the flow, above the region that is loading.</span>
    </header>
    <div class="slotted-demo-stage">
      <div style="${FRAME}">
        <div slLoadingBar aria-label="Loading the table"></div>
        <p style="padding: 0.5rem">The table below is being fetched.</p>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">fixed</span>
      <span class="slotted-demo-scene__note">Pinned to the viewport; nothing on the page moves.</span>
    </header>
    <div class="slotted-demo-stage">
      <p>
        A fixed bar leaves the flow entirely and sits at the top of the window, which is why it is
        not shown inside this frame: it would be at the top of the page, not of the box.
      </p>
    </div>
  </section>
</div>`,
  }),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slLoadingBar aria-label="Loading page"></div>
    <p>
      No value, so no position is reported: aria-valuenow is absent rather than zero. This is the
      ordinary case for a page-level wait, which is why it is the default.
    </p>
    <div slLoadingBar aria-label="Uploading" valueText="Step 1 of 4" [max]="4" [value]="1"></div>
    <p>
      A determinate bar reports a position and, when the percentage would say less than words, the
      words instead.
    </p>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <span id="loading-bar-a11y-label">Loading invoices</span>
    <div slLoadingBar aria-labelledby="loading-bar-a11y-label"></div>
    <p role="status">Loading invoices&hellip;</p>
    <p>
      The bar takes its name from the visible text and reports no position, because it does not have
      one. The status message beside it is what a screen reader actually announces: the bar is a
      picture of a wait, and a picture announces nothing.
    </p>
  </div>
</div>`,
  }),
};
