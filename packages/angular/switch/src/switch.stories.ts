import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlField } from '../../field/src/field';
import { SlFieldDescription } from '../../field/src/field-description';
import { SlFieldError } from '../../field/src/field-error';
import { SlFieldLabel } from '../../field/src/field-label';
import { SlSwitch } from './switch';
import type { SwitchSize } from './switch';
import { ANGULAR_SWITCH_DOCS, ANGULAR_SWITCH_TOKENS } from './switch.docs';

interface SwitchStoryArgs {
  checked: boolean;
  size: SwitchSize;
}

const FIELD_IMPORTS = [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlSwitch];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<SwitchStoryArgs> = {
  title: 'Components/Switch',
  component: SlSwitch,
  decorators: [moduleMetadata({ imports: FIELD_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Switch',
        description: 'A binary setting that takes effect as it is turned.',
        framework: 'Angular',
        ...ANGULAR_SWITCH_DOCS.switch,
        tokens: ANGULAR_SWITCH_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SwitchStoryArgs>;

export const Playground: Story = {
  args: { checked: true, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slField>
    <label slFieldLabel>Email alerts</label>
    <button slSwitch [size]="size" [(checked)]="checked"></button>
    <p slFieldDescription>Sent when a build fails.</p>
  </div>
</div>`,
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: { sizes: ['sm', 'md', 'lg'] },
    template: `
<div class="slotted-demo-grid" data-columns="3">
  @for (size of sizes; track size) {
    <section class="slotted-demo-scene">
      <header class="slotted-demo-scene__header">
        <span class="slotted-demo-scene__label">{{ size }}</span>
      </header>
      <div class="slotted-demo-stage">
        <div class="slotted-demo-stack">
          <button slSwitch [attr.aria-label]="'Off, ' + size" [size]="size"></button>
          <button slSwitch [attr.aria-label]="'On, ' + size" [checked]="true" [size]="size"></button>
        </div>
      </div>
    </section>
  }
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">off and on</span>
      <span class="slotted-demo-scene__note">Space and Enter turn it; the component binds neither.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <button slSwitch aria-label="Off"></button>
        <button slSwitch aria-label="On" [checked]="true"></button>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">disabled</span>
      <span class="slotted-demo-scene__note">There is no read-only switch. A setting that cannot change is disabled.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <button slSwitch aria-label="Disabled, off" [disabled]="true"></button>
        <button slSwitch aria-label="Disabled, on" [checked]="true" [disabled]="true"></button>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const InField: Story = {
  name: 'In a field',
  parameters: scenario('field'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slField id="alerts" [required]="true">
      <label slFieldLabel>Email alerts</label>
      <button slSwitch [checked]="true"></button>
      <p slFieldDescription>Sent when a build fails.</p>
    </div>
    <div slField [invalid]="true">
      <label slFieldLabel>Terms</label>
      <button slSwitch></button>
      <p slFieldError>You have to accept the terms to continue.</p>
    </div>
    <div slField [disabled]="true">
      <label slFieldLabel>Beta features</label>
      <button slSwitch></button>
      <p slFieldDescription>Available on the team plan.</p>
    </div>
    <ul>
      <li>
        The control takes the field&rsquo;s <code>id</code>, so the label&rsquo;s <code>for</code>
        resolves to it, and its <code>aria-describedby</code> names whichever of the description and
        the error is present.
      </li>
      <li>
        A required field gives the control <code>aria-required</code> &mdash; never the native
        attribute, which a button does not carry meaningfully anyway.
      </li>
      <li>
        The control does not submit with a form. Add a hidden input beside it when the value has to
        reach the server without JavaScript.
      </li>
    </ul>
  </div>
</div>`,
  }),
};
