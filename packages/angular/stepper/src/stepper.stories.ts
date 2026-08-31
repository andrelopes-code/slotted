import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlProgressBar } from '../../progress-bar/src/progress-bar';
import { SlStepper } from './stepper';
import type { StepperOrientation } from './stepper';
import { SlStepperLabel } from './stepper-label';
import { SlStepperMarker } from './stepper-marker';
import { SlStepperStep } from './stepper-step';
import { ANGULAR_STEPPER_DOCS, ANGULAR_STEPPER_TOKENS } from './stepper.docs';

interface StepperStoryArgs {
  orientation: StepperOrientation;
}

const STEPS = `
      <li slStepperStep status="complete">
        <span slStepperMarker>1</span>
        <span slStepperLabel>Account</span>
      </li>
      <li slStepperStep status="current">
        <span slStepperMarker>2</span>
        <span slStepperLabel>Members</span>
      </li>
      <li slStepperStep>
        <span slStepperMarker>3</span>
        <span slStepperLabel>Billing</span>
      </li>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Status as never,
});

const meta: Meta<StepperStoryArgs> = {
  title: 'Components/Stepper',
  component: SlStepper,
  decorators: [
    moduleMetadata({
      imports: [SlProgressBar, SlStepper, SlStepperLabel, SlStepperMarker, SlStepperStep],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stepper',
        description: 'Where the reader is in a sequence they are working through.',
        framework: 'Angular',
        ...ANGULAR_STEPPER_DOCS.stepper,
        tokens: ANGULAR_STEPPER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StepperStoryArgs>;

export const Playground: Story = {
  args: { orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <ol slStepper aria-label="Set up your workspace" [orientation]="orientation">${STEPS}
  </ol>
</div>`,
  }),
};

const statusScene = (status: string, note: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${status}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage">
      <ol slStepper aria-label="A ${status} step">
        <li slStepperStep status="${status}">
          <span slStepperMarker>2</span>
          <span slStepperLabel>Members</span>
        </li>
      </ol>
    </div>
  </section>`;

export const Status: Story = {
  parameters: scenario('status'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${statusScene('complete', 'Filled, and the label is no longer muted.')}
  ${statusScene('current', 'A thicker ring, so it is not colour alone.')}
  ${statusScene('upcoming', 'Outlined and quiet: nothing has happened here.')}
</div>`,
  }),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">horizontal</span>
      <span class="slotted-demo-scene__note">A wizard across the top of a form.</span>
    </header>
    <div class="slotted-demo-stage">
      <ol slStepper aria-label="Horizontal flow">${STEPS}
      </ol>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">vertical</span>
      <span class="slotted-demo-scene__note">A checklist down the side of one.</span>
    </header>
    <div class="slotted-demo-stage">
      <ol slStepper aria-label="Vertical flow" orientation="vertical">${STEPS}
      </ol>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <ol slStepper aria-label="Set up your workspace">${STEPS}
    </ol>
    <div slProgressBar aria-label="Setup progress" valueText="Step 2 of 3" [max]="3" [value]="1"></div>
    <p>
      The stepper names the steps and the progress bar measures them. A screen reader hears
      &ldquo;Members, current step&rdquo; from one and &ldquo;Step 2 of 3&rdquo; from the other,
      which is the pair a listener actually needs.
    </p>
  </div>
</div>`,
  }),
};
