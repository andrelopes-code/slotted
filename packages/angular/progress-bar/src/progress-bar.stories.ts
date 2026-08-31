import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlProgressBar } from './progress-bar';
import { ANGULAR_PROGRESS_BAR_DOCS, ANGULAR_PROGRESS_BAR_TOKENS } from './progress-bar.docs';

interface ProgressBarStoryArgs {
  max: number;
  value: number | null;
  valueText: string;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Values as never,
});

const meta: Meta<ProgressBarStoryArgs> = {
  title: 'Components/ProgressBar',
  component: SlProgressBar,
  decorators: [moduleMetadata({ imports: [SlProgressBar] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'ProgressBar',
        description: 'How far along something is, or that it is under way at all.',
        framework: 'Angular',
        ...ANGULAR_PROGRESS_BAR_DOCS.progressBar,
        tokens: ANGULAR_PROGRESS_BAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ProgressBarStoryArgs>;

export const Playground: Story = {
  args: { max: 100, value: 40, valueText: '' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slProgressBar aria-label="Uploading" [max]="max" [value]="value" [valueText]="valueText"></div>
</div>`,
  }),
};

const valueScene = (value: number, note: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">value=${value}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">
      <div slProgressBar aria-label="Example at ${value}" [value]="${value}"></div>
    </div>
  </section>`;

export const Values: Story = {
  parameters: scenario('values'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${valueScene(0, 'Nothing done yet, and the track still holds the space.')}
  ${valueScene(40, 'Part way, painted from the start edge.')}
  ${valueScene(100, 'Complete, filling the track exactly.')}
  ${valueScene(140, 'Beyond the maximum: clamped, not overflowing.')}
</div>`,
  }),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slProgressBar aria-label="Preparing export" [value]="null"></div>
    <p>
      Nothing knows how long this takes, so no position is reported: aria-valuenow is absent rather
      than zero, which is how a screen reader is told the position is unknown.
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
    <span id="progress-bar-upload-label">Uploading invoices</span>
    <div
      slProgressBar
      aria-labelledby="progress-bar-upload-label"
      valueText="3 of 7 files"
      [max]="7"
      [value]="3"
    ></div>
    <p>
      The name comes from the visible text beside it, and valueText replaces the percentage a
      screen reader would otherwise compute. A listener learns that three files of seven are done,
      which is what the number was ever standing in for.
    </p>
  </div>
</div>`,
  }),
};
