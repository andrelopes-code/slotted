import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSpinner } from './spinner';
import type { SpinnerSize } from './spinner';
import { ANGULAR_SPINNER_DOCS, ANGULAR_SPINNER_TOKENS } from './spinner.docs';

interface SpinnerStoryArgs {
  decorative: boolean;
  label: string;
  size: SpinnerSize;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<SpinnerStoryArgs> = {
  title: 'Components/Spinner',
  component: SlSpinner,
  decorators: [moduleMetadata({ imports: [SlSpinner] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Spinner',
        description: 'An indeterminate wait, announced once and painted in the surrounding colour.',
        framework: 'Angular',
        ...ANGULAR_SPINNER_DOCS.spinner,
        tokens: ANGULAR_SPINNER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SpinnerStoryArgs>;

export const Playground: Story = {
  args: { decorative: false, label: 'Loading', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <span slSpinner [decorative]="decorative" [label]="label" [size]="size"></span>
  </div>
</div>`,
  }),
};

const sizeScene = (size: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${size}</span>
      <span class="slotted-demo-scene__note">One token per size; the stroke stays constant.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slSpinner label="Loading, ${size}" size="${size}"></span>
    </div>
  </section>`;

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${sizeScene('sm')}
  ${sizeScene('md')}
  ${sizeScene('lg')}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Inside a sentence</span>
      <span class="slotted-demo-scene__note">The ring takes the text colour and the text size.</span>
    </header>
    <div class="slotted-demo-stage">
      <p style="color: var(--slotted-tone-accent-text)">
        <span slSpinner decorative size="sm"></span> Saving your changes
      </p>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Filling a region</span>
      <span class="slotted-demo-scene__note">The only content, so it announces the wait itself.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slSpinner label="Loading invoices" size="lg"></span>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Announced</span>
      <span class="slotted-demo-scene__note">role="status", with the label as hidden text.</span>
    </header>
    <div class="slotted-demo-stage">
      <span slSpinner label="Loading invoices"></span>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Silent</span>
      <span class="slotted-demo-scene__note">The sentence already reports the wait, so the ring says nothing.</span>
    </header>
    <div class="slotted-demo-stage">
      <p><span slSpinner decorative size="sm"></span> Loading invoices</p>
    </div>
  </section>
</div>`,
  }),
};
