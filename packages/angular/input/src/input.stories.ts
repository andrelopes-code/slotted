import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlField } from '../../field/src/field';
import { SlFieldDescription } from '../../field/src/field-description';
import { SlFieldError } from '../../field/src/field-error';
import { SlFieldLabel } from '../../field/src/field-label';
import { SlInput } from './input';
import type { InputSize } from './input';
import { ANGULAR_INPUT_DOCS, ANGULAR_INPUT_TOKENS } from './input.docs';

interface InputStoryArgs {
  placeholder: string;
  size: InputSize;
}

const FIELD_IMPORTS = [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlInput];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<InputStoryArgs> = {
  title: 'Components/Input',
  component: SlInput,
  decorators: [moduleMetadata({ imports: FIELD_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Input',
        description: 'A single-line text control that wires itself to the field around it.',
        framework: 'Angular',
        ...ANGULAR_INPUT_DOCS.input,
        tokens: ANGULAR_INPUT_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<InputStoryArgs>;

export const Playground: Story = {
  args: { placeholder: 'you@example.com', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slField>
    <label slFieldLabel>Email</label>
    <input slInput type="email" [placeholder]="placeholder" [size]="size" />
    <p slFieldDescription>We only use it to sign you in.</p>
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
        <div slField>
          <label slFieldLabel>Workspace</label>
          <input slInput value="acme" [size]="size" />
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
      <span class="slotted-demo-scene__label">default</span>
      <span class="slotted-demo-scene__note">Nothing set.</span>
    </header>
    <div class="slotted-demo-stage"><input slInput value="acme" /></div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">invalid</span>
      <span class="slotted-demo-scene__note">aria-invalid, and the error border.</span>
    </header>
    <div class="slotted-demo-stage"><input slInput value="acme" [invalid]="true" /></div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">read-only</span>
      <span class="slotted-demo-scene__note">Visible, selectable, not editable.</span>
    </header>
    <div class="slotted-demo-stage"><input slInput value="acme" [readOnly]="true" /></div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">disabled</span>
      <span class="slotted-demo-scene__note">Out of the tab order and out of submission.</span>
    </header>
    <div class="slotted-demo-stage"><input slInput value="acme" [disabled]="true" /></div>
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
    <div slField id="signup-email" [invalid]="true" [required]="true">
      <label slFieldLabel>Email</label>
      <input slInput type="email" value="not-an-address" />
      <p slFieldDescription>We only use it to sign you in.</p>
      <p slFieldError>That address is not valid.</p>
    </div>
    <div slField [disabled]="true">
      <label slFieldLabel>Workspace</label>
      <input slInput value="acme" />
      <p slFieldDescription>Set once, when the account is created.</p>
    </div>
    <div slField [disabled]="true">
      <label slFieldLabel>Override</label>
      <input slInput value="still editable" [disabled]="false" />
      <p slFieldDescription>The control&rsquo;s own value wins over the field&rsquo;s, in both directions.</p>
    </div>
    <ul>
      <li>
        The first control&rsquo;s <code>id</code> is <code>signup-email-control</code>, which is what
        the label&rsquo;s <code>for</code> resolves to, and its <code>aria-describedby</code> names
        the description and the error in that order.
      </li>
      <li>
        The field is <code>required</code>, so the control carries <code>aria-required</code>
        &mdash; never the native attribute, which would engage constraint validation and change what
        submitting the form does.
      </li>
    </ul>
  </div>
</div>`,
  }),
};
