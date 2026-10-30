import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import {
  SlStepper,
  SlStepperList,
  SlStepperNext,
  SlStepperPanel,
  SlStepperPrevious,
  SlStepperStep,
} from './stepper';
import type {
  StepperLabelPlacement,
  StepperNavigation,
  StepperOrientation,
} from './stepper.constants';
import { provideStepperDefaults } from './stepper.constants';
import { ANGULAR_STEPPER_DOCS, ANGULAR_STEPPER_TOKENS } from './stepper.docs';

interface StepperStoryArgs {
  autoComplete: boolean;
  defaultStep: number;
  labelPlacement: StepperLabelPlacement;
  linear: boolean;
  navigation: StepperNavigation;
  orientation: StepperOrientation;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_STEPPER_DOCS.stepper.scenes, {
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

const parts = [
  SlStepper,
  SlStepperList,
  SlStepperNext,
  SlStepperPanel,
  SlStepperPrevious,
  SlStepperStep,
];

const meta: Meta<StepperStoryArgs> = {
  title: 'Components/Stepper',
  component: SlStepper,
  decorators: [moduleMetadata({ imports: parts })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stepper',
        description:
          'Where the reader is in a sequence of steps, which steps they may reach, and the panel belonging to the one they are on.',
        framework: 'Angular',
        ...ANGULAR_STEPPER_DOCS.stepper,
        tokens: ANGULAR_STEPPER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<StepperStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'block',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

/** The flow every scene that does not need its own steps is drawn from. */
const CHECKOUT = `
  <li slStepperStep label="Cart" [complete]="true"></li>
  <li slStepperStep label="Address" [complete]="true"></li>
  <li slStepperStep label="Payment"></li>
  <li slStepperStep label="Review"></li>`;

export const Playground: Story = {
  args: {
    autoComplete: false,
    defaultStep: 2,
    labelPlacement: 'end',
    linear: false,
    navigation: 'button',
    orientation: 'horizontal',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div
    slStepper
    [messages]="{ label: 'Checkout' }"
    [autoComplete]="autoComplete"
    [defaultStep]="defaultStep"
    [labelPlacement]="labelPlacement"
    [linear]="linear"
    [navigation]="navigation"
    [orientation]="orientation"
  >
    <ol slStepperList>${CHECKOUT}</ol>
  </div>
</div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'orientation="horizontal"',
    'Equal columns, so four markers line up however long their labels are. This is the arrangement a checkout header wants.',
    `<div slStepper [messages]="{ label: 'Checkout' }" orientation="horizontal" [defaultStep]="2">
       <ol slStepperList>${CHECKOUT}</ol>
     </div>`,
  )}
  ${scene(
    'orientation="vertical"',
    'The connector runs down the marker’s own center line, and a second line under each name has room to be read.',
    `<div slStepper [messages]="{ label: 'Release' }" orientation="vertical" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Build" description="Compiled in 42 seconds" [complete]="true"></li>
         <li slStepperStep label="Sign" description="Waiting for the release key"></li>
         <li slStepperStep label="Publish" description="Not started"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Every status at once',
    'A fill and an edge for each, never a color alone: a check on the finished disc, a cross on the failed one, a ring for where the reader is, an outline for what is still ahead.',
    `<div slStepper [messages]="{ label: 'Statuses' }" labelPlacement="bottom" [defaultStep]="2">
       <ol slStepperList>
         <li slStepperStep label="Complete" [complete]="true"></li>
         <li slStepperStep label="Failed" invalid></li>
         <li slStepperStep label="Current"></li>
         <li slStepperStep label="Pending"></li>
         <li slStepperStep label="Closed" [disabled]="true"></li>
       </ol>
     </div>`,
  )}
  ${scene(
    'loading, and the pair that outrank each other',
    'A step waiting on a check stops answering the pointer. A step marked both complete and invalid reads as invalid, because a completed step that failed is a step that failed.',
    `<div slStepper [messages]="{ label: 'Transfer' }" labelPlacement="bottom" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Amount" [complete]="true"></li>
         <li slStepperStep label="Recipient" loading></li>
         <li slStepperStep label="Rejected" invalid [complete]="true"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Linear: Story = {
  parameters: scenario('linear'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'Not linear',
    'Every header moves the flow. Use it where the reader may fill the steps in whatever order suits them and nothing downstream depends on what came first.',
    `<div slStepper [messages]="{ label: 'Profile' }" labelPlacement="bottom" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Details"></li>
         <li slStepperStep label="Address"></li>
         <li slStepperStep label="Preferences"></li>
       </ol>
     </div>`,
  )}
  ${scene(
    'linear',
    'Only the first step whose predecessors are complete opens. The two beyond it carry aria-disabled and still take Tab, so the reader finds them and finds out they are closed.',
    `<div slStepper [messages]="{ label: 'Onboarding' }" labelPlacement="bottom" linear [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Company" [complete]="true"></li>
         <li slStepperStep label="Bank account"></li>
         <li slStepperStep label="Verification"></li>
         <li slStepperStep label="Done"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Navigation: Story = {
  parameters: scenario('navigation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${scene(
    'navigation="button"',
    'The default. A header is a button that moves the step, and the whole flow lives on one page.',
    `<div slStepper [messages]="{ label: 'Checkout' }" labelPlacement="bottom" [defaultStep]="1">
       <ol slStepperList>${CHECKOUT}</ol>
     </div>`,
  )}
  ${scene(
    'navigation="link"',
    'Each header carries its own destination, for a flow whose steps are separate pages. A step the flow has not opened renders without an href, so a middle click cannot reach it either.',
    `<div slStepper [messages]="{ label: 'Application' }" labelPlacement="bottom" navigation="link" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Identity" href="#identity" [complete]="true"></li>
         <li slStepperStep label="Income" href="#income"></li>
         <li slStepperStep label="Review" href="#review"></li>
       </ol>
     </div>`,
  )}
  ${scene(
    'navigation="none"',
    'Nothing to press: the header is a span. This is the read-only progress indicator the field ships as a separate component, and here it is the same family.',
    `<div slStepper [messages]="{ label: 'Order status' }" labelPlacement="bottom" navigation="none" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Placed" [complete]="true"></li>
         <li slStepperStep label="Packed"></li>
         <li slStepperStep label="Delivered"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'labelPlacement="end"',
    'The name sits beside its marker and the connector takes whatever the label leaves. It reads best with short names, or in a column.',
    `<div slStepper [messages]="{ label: 'Checkout' }" labelPlacement="end" [defaultStep]="2">
       <ol slStepperList>${CHECKOUT}</ol>
     </div>`,
  )}
  ${scene(
    'labelPlacement="bottom"',
    'The marker centers over its own label and the connector runs between two centers. This is what a row of names longer than a word needs.',
    `<div slStepper [messages]="{ label: 'Onboarding' }" labelPlacement="bottom" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Company details" [complete]="true"></li>
         <li slStepperStep label="Bank account"></li>
         <li slStepperStep label="Verification"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Panels: Story = {
  parameters: scenario('panels'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'A panel and the buttons that move it',
    'The panel of the current step is a group labelled by its own header; the others are not rendered at all. Back and Continue are ordinary buttons wearing a directive.',
    `<div slStepper [messages]="{ label: 'Transfer' }" labelPlacement="bottom" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Amount" [complete]="true">
           <div slStepperPanel>How much, and out of which account.</div>
         </li>
         <li slStepperStep label="Recipient">
           <div slStepperPanel>The account number is checked against the sort code.</div>
         </li>
         <li slStepperStep label="Confirm">
           <div slStepperPanel>Nothing leaves the account until this step is finished.</div>
         </li>
       </ol>
       <div class="slotted-demo-row">
         <button slStepperPrevious type="button">Back</button>
         <button slStepperNext type="button">Continue</button>
       </div>
     </div>`,
  )}
</div>`,
  }),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Below thirty rems',
    'The same horizontal flow inside a narrow column. It answers its own inline size rather than the viewport, so a stepper in a panel reflows while one on a full page does not.',
    `<div class="slotted-demo-measure">
       <div slStepper [messages]="{ label: 'Checkout' }" labelPlacement="bottom" [defaultStep]="2">
         <ol slStepperList>${CHECKOUT}</ol>
       </div>
     </div>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Six steps, and a compound that will not fit',
    'The label wraps inside its own column and the marker never does, so the row of markers stays on one line however long the names get.',
    `<div slStepper [messages]="{ label: 'Umsatzsteuervoranmeldung' }" labelPlacement="bottom" [defaultStep]="2">
       <ol slStepperList>
         <li slStepperStep label="Stammdaten" [complete]="true"></li>
         <li slStepperStep label="Zahlungsabwicklungseinstellungen" [complete]="true"></li>
         <li slStepperStep label="Umsätze und Steuerbeträge prüfen"></li>
         <li slStepperStep label="Belege"></li>
         <li slStepperStep label="Prüfung"></li>
         <li slStepperStep label="Absenden"></li>
       </ol>
     </div>`,
  )}
  ${scene(
    'A second line, and a flow of one step',
    'A description renders inside the label, so the marker sits against the whole text block. One step draws no connector at all and still announces "Step 1 of 1".',
    `<div slStepper [messages]="{ label: 'Release' }" orientation="vertical">
       <ol slStepperList>
         <li slStepperStep label="Build" description="Compiled in 42 seconds"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideStepperDefaults({ labelPlacement: 'bottom', linear: true })],
    }),
  ],
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'provideStepperDefaults',
    'This page provides bottom labels and a linear flow for every stepper on it. The first inherits both; the second states its own placement and wins.',
    `<div slStepper [messages]="{ label: 'Inherited' }" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Company" [complete]="true"></li>
         <li slStepperStep label="Bank account"></li>
         <li slStepperStep label="Verification"></li>
       </ol>
     </div>
     <div slStepper [messages]="{ label: 'Stated' }" labelPlacement="end" [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Company" [complete]="true"></li>
         <li slStepperStep label="Bank account"></li>
         <li slStepperStep label="Verification"></li>
       </ol>
     </div>`,
  )}
  ${scene(
    'exportAs, and the consumer’s own buttons',
    'The template reads the instance for the count and the percentage, and moves the flow through two buttons it styled itself — the family paints no advance button of its own.',
    `<div slStepper [messages]="{ label: 'Wizard' }" navigation="none" [defaultStep]="1" #flow="slStepper">
       <ol slStepperList>
         <li slStepperStep label="One" [complete]="true"></li>
         <li slStepperStep label="Two"></li>
         <li slStepperStep label="Three"></li>
       </ol>
       <p>
         Step {{ flow.step() + 1 }} of {{ flow.count() }} — {{ flow.percent().toFixed(0) }}% of the
         way.
       </p>
       <div class="slotted-demo-row">
         <button slStepperPrevious type="button">Back</button>
         <button slStepperNext type="button">Continue</button>
       </div>
     </div>`,
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'Tab, the arrows, Home and End',
    'Every header is a tab stop. The arrows reach exactly the same ones and follow the reading direction; Home and End go to the ends; Enter and Space move to the focused step when the flow allows it.',
    `<div slStepper [messages]="{ label: 'Onboarding' }" labelPlacement="bottom" linear [defaultStep]="1">
       <ol slStepperList>
         <li slStepperStep label="Company" [complete]="true"></li>
         <li slStepperStep label="Bank account"></li>
         <li slStepperStep label="Verification"></li>
         <li slStepperStep label="Done"></li>
       </ol>
     </div>`,
  )}
</div>`,
  }),
};
