import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stepper, useStepper } from './stepper';
import { StepperDefaultsProvider } from './stepper-defaults';
import { StepperList, StepperPanel, StepperStep } from './stepper-parts';
import { REACT_STEPPER_DOCS, REACT_STEPPER_TOKENS } from './stepper.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_STEPPER_DOCS.stepper.scenes, {
    playground: Playground,
    orientation: Orientation,
    statuses: Statuses,
    linear: Linear,
    navigation: Navigation,
    placement: Placement,
    panels: Panels,
    compact: Compact,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stepper',
        description:
          'Where the reader is in a sequence of steps, which they may reach, and the panel of the one they are on.',
        framework: 'React',
        ...REACT_STEPPER_DOCS.stepper,
        tokens: REACT_STEPPER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const CHECKOUT = ['Cart', 'Address', 'Payment', 'Review'];

function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

function Flow({
  names = CHECKOUT,
  ...props
}: React.ComponentProps<typeof Stepper> & { names?: string[] }) {
  return (
    <Stepper {...props}>
      <StepperList>
        {names.map((name) => (
          <StepperStep key={name} label={name} />
        ))}
      </StepperList>
    </Stepper>
  );
}

export const Playground: Story = {
  args: {
    autoComplete: false,
    defaultStep: 1,
    messages: { label: 'Checkout' },
    labelPlacement: 'end',
    linear: false,
    navigation: 'button',
    orientation: 'horizontal',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Flow {...args} />
    </div>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label='orientation="horizontal"'
        note="A row of equal columns: five steps divide the width evenly however long their names are, and the connectors line up on one axis."
      >
        <Flow defaultStep={1} />
      </Scene>
      <Scene
        layout="block"
        label='orientation="vertical"'
        note="A column, with the connector running down the marker's own center line and room under each step for the content behind it."
      >
        <Stepper defaultStep={1} orientation="vertical">
          <StepperList>
            <StepperStep description="Compiled in 42 seconds" label="Build" complete />
            <StepperStep description="Waiting for the release key" label="Sign" />
            <StepperStep description="Not started" label="Publish" />
          </StepperList>
        </Stepper>
      </Scene>
    </div>
  ),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="complete, invalid, current, pending, disabled"
        note="Every status is a fill and a shape as well as a color: a check on a filled disc, a cross on a red one, a ring where the reader is, and an outline for what is still ahead."
      >
        <Stepper defaultStep={2} labelPlacement="bottom">
          <StepperList>
            <StepperStep label="Complete" complete />
            <StepperStep label="Failed" invalid />
            <StepperStep label="Current" />
            <StepperStep label="Pending" />
            <StepperStep label="Closed" disabled />
          </StepperList>
        </Stepper>
      </Scene>
    </div>
  ),
};

export const Linear: Story = {
  parameters: scenario('linear'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="linear"
        note="Only the step after the last complete one can be reached. Press a later header and nothing moves, but Tab still lands on it and it says it is unavailable."
      >
        <Stepper defaultStep={1} linear>
          <StepperList>
            <StepperStep label="Cart" complete />
            <StepperStep label="Address" />
            <StepperStep label="Payment" />
            <StepperStep label="Review" />
          </StepperList>
        </Stepper>
      </Scene>
      <Scene
        layout="block"
        label="without linear"
        note="The same four steps with the policy off: every header is reachable, which is the flow a reader may enter at any point."
      >
        <Flow defaultStep={1} />
      </Scene>
    </div>
  ),
};

export const Navigation: Story = {
  parameters: scenario('navigation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label='navigation="button"'
        note="A control the reader presses. Hover underlines the name and the marker gives a little under the press, so it reads as pressable before it is pressed."
      >
        <Flow defaultStep={1} names={['Cart', 'Address', 'Payment']} />
      </Scene>
      <Scene
        layout="block"
        label='navigation="link"'
        note="A destination with a URL of its own, so a middle click opens the step in a tab and a crawler can follow the flow."
      >
        <Stepper defaultStep={1} navigation="link">
          <StepperList>
            <StepperStep href="#cart" label="Cart" complete />
            <StepperStep href="#address" label="Address" />
            <StepperStep href="#payment" label="Payment" />
          </StepperList>
        </Stepper>
      </Scene>
      <Scene
        layout="block"
        label='navigation="none"'
        note="Nothing to press: the header is a span, and the same markup is the read-only progress indicator the field ships as a separate component."
      >
        <Stepper defaultStep={1} navigation="none">
          <StepperList>
            <StepperStep label="Placed" complete />
            <StepperStep label="Packed" />
            <StepperStep label="Delivered" />
          </StepperList>
        </Stepper>
      </Scene>
    </div>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label='labelPlacement="end"'
        note="The name sits beside the marker and the connector takes whatever the name leaves, so a short flow reads as one continuous track."
      >
        <Flow defaultStep={1} names={['Cart', 'Address', 'Payment']} />
      </Scene>
      <Scene
        layout="block"
        label='labelPlacement="bottom"'
        note="The marker centers over its own column and the name runs under it, which is what a row of long names needs to stay legible."
      >
        <Flow
          defaultStep={1}
          labelPlacement="bottom"
          names={['Company details', 'Bank account', 'Verification']}
        />
      </Scene>
    </div>
  ),
};

export const Panels: Story = {
  parameters: scenario('panels'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="StepperPanel"
        note="One panel at a time, the one belonging to the current step. Press another header and the content behind it replaces this, with no animation to wait through."
      >
        <Stepper defaultStep={1} labelPlacement="bottom">
          <StepperList>
            <StepperStep label="Amount" complete>
              <StepperPanel>How much is being transferred, and from which account.</StepperPanel>
            </StepperStep>
            <StepperStep label="Recipient">
              <StepperPanel>
                The account number is being checked against the sort code.
              </StepperPanel>
            </StepperStep>
            <StepperStep label="Confirm">
              <StepperPanel>Everything above, once more, before it leaves.</StepperPanel>
            </StepperStep>
          </StepperList>
        </Stepper>
      </Scene>
    </div>
  ),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Below 30rem"
        note="The same horizontal stepper in a narrow column. It turns into a column rather than shrinking five names to two characters each, and the connectors turn with it."
      >
        <div className="slotted-demo-measure">
          <Flow defaultStep={1} labelPlacement="bottom" />
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Six steps, long names"
        note="A German compound and a phrase of four words. The label wraps inside its own column, the marker never does, and no step widens the row past its share."
      >
        <Stepper defaultStep={2} labelPlacement="bottom">
          <StepperList>
            <StepperStep label="Stammdaten" complete />
            <StepperStep label="Zahlungsabwicklungseinstellungen" complete />
            <StepperStep label="Umsätze und Steuerbeträge prüfen" />
            <StepperStep label="Belege" />
            <StepperStep label="Prüfung" />
            <StepperStep label="Absenden" />
          </StepperList>
        </Stepper>
      </Scene>
      <Scene
        layout="block"
        label="A second line"
        note="The description renders inside the label, so the marker sits against the whole text block and both lines wrap together."
      >
        <Stepper defaultStep={0} orientation="vertical">
          <StepperList>
            <StepperStep description="Compiled in 42 seconds" label="Build" />
            <StepperStep description="Waiting for the release key" label="Sign" />
          </StepperList>
        </Stepper>
      </Scene>
    </div>
  ),
};

function Advance() {
  const stepper = useStepper();
  return (
    <div className="slotted-demo-row">
      <button
        data-part="root"
        data-part-root=""
        data-size="md"
        data-tone="secondary"
        data-ui="button"
        data-ui-button=""
        data-variant="outline"
        disabled={!stepper.canGoPrevious}
        onClick={() => stepper.previous()}
        type="button"
      >
        <span data-part="label" data-part-label="">
          Back
        </span>
      </button>
      <button
        data-part="root"
        data-part-root=""
        data-size="md"
        data-tone="accent"
        data-ui="button"
        data-ui-button=""
        data-variant="solid"
        disabled={!stepper.canGoNext}
        onClick={() => stepper.next()}
        type="button"
      >
        <span data-part="label" data-part-label="">
          Continue
        </span>
      </button>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="useStepper()"
        note="The move and whether it is available, handed to a button this family did not paint. Press Continue and the flow advances; the button is yours to theme with every other one."
      >
        <Stepper defaultStep={0} labelPlacement="bottom">
          <StepperList>
            <StepperStep label="Amount" />
            <StepperStep label="Recipient" />
            <StepperStep label="Confirm" />
          </StepperList>
          <Advance />
        </Stepper>
      </Scene>
      <Scene
        layout="block"
        label="StepperDefaultsProvider"
        note="One decision for every stepper below it: which way the flow runs, where the labels sit, and whether the order is enforced."
      >
        <StepperDefaultsProvider labelPlacement="bottom" orientation="horizontal">
          <Flow defaultStep={1} names={['Cart', 'Address', 'Payment']} />
        </StepperDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        layout="block"
        label="Tab, arrows, Home, End, Enter"
        note="Tab reaches every header and the arrows reach the same ones, following the reading direction and wrapping at the ends. Enter and Space move to a step the flow has opened."
      >
        <Flow defaultStep={1} messages={{ label: 'Checkout' }} />
      </Scene>
    </div>
  ),
};
