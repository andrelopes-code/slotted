import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressBar } from '../progress-bar';
import { Stepper } from './stepper';
import { StepperLabel } from './stepper-label';
import { StepperMarker } from './stepper-marker';
import { StepperStep } from './stepper-step';
import { REACT_STEPPER_DOCS, REACT_STEPPER_TOKENS } from './stepper.docs';
import type { StepperStatus } from './stepper.types';

const STEPS: readonly (readonly [string, StepperStatus, string])[] = [
  ['1', 'complete', 'Account'],
  ['2', 'current', 'Members'],
  ['3', 'upcoming', 'Billing'],
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Status as never,
});

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stepper',
        description: 'Where the reader is in a sequence they are working through.',
        framework: 'React',
        ...REACT_STEPPER_DOCS.stepper,
        tokens: REACT_STEPPER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = () =>
  STEPS.map(([marker, status, label]) => (
    <StepperStep key={label} status={status}>
      <StepperMarker>{marker}</StepperMarker>
      <StepperLabel>{label}</StepperLabel>
    </StepperStep>
  ));

export const Playground: Story = {
  args: { orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Stepper {...args} aria-label="Set up your workspace">
        {steps()}
      </Stepper>
    </div>
  ),
};

export const Status: Story = {
  parameters: scenario('status'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(
        [
          ['complete', 'Filled, and the label is no longer muted.'],
          ['current', 'A thicker ring, so it is not colour alone.'],
          ['upcoming', 'Outlined and quiet: nothing has happened here.'],
        ] as const
      ).map(([status, note]) => (
        <section className="slotted-demo-scene" key={status}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{status}</span>
            <span className="slotted-demo-scene__note">{note}</span>
          </header>
          <div className="slotted-demo-stage">
            <Stepper aria-label={`A ${status} step`}>
              <StepperStep status={status}>
                <StepperMarker>2</StepperMarker>
                <StepperLabel>Members</StepperLabel>
              </StepperStep>
            </Stepper>
          </div>
        </section>
      ))}
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
          <span className="slotted-demo-scene__note">A wizard across the top of a form.</span>
        </header>
        <div className="slotted-demo-stage">
          <Stepper aria-label="Horizontal flow">{steps()}</Stepper>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">vertical</span>
          <span className="slotted-demo-scene__note">A checklist down the side of one.</span>
        </header>
        <div className="slotted-demo-stage">
          <Stepper aria-label="Vertical flow" orientation="vertical">
            {steps()}
          </Stepper>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Stepper aria-label="Set up your workspace">{steps()}</Stepper>
        <ProgressBar aria-label="Setup progress" max={3} value={1} valueText="Step 2 of 3" />
        <p>
          The stepper names the steps and the progress bar measures them. A screen reader hears
          &ldquo;Members, current step&rdquo; from one and &ldquo;Step 2 of 3&rdquo; from the other,
          which is the pair a listener actually needs.
        </p>
      </div>
    </div>
  ),
};
