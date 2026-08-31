import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlField } from '../../field/src/field';
import { SlFieldDescription } from '../../field/src/field-description';
import { SlFieldError } from '../../field/src/field-error';
import { SlFieldLabel } from '../../field/src/field-label';
import { SlInput } from '../../input/src/input';
import { SlSwitch } from '../../switch/src/switch';
import { SlTextarea } from '../../textarea/src/textarea';
import { SlFieldset } from './fieldset';
import type { FieldsetOrientation } from './fieldset';
import { ANGULAR_FIELDSET_DOCS, ANGULAR_FIELDSET_TOKENS } from './fieldset.docs';
import { SlFieldsetLegend } from './fieldset-legend';

interface FieldsetStoryArgs {
  disabled: boolean;
  invalid: boolean;
  orientation: FieldsetOrientation;
}

const FORM_IMPORTS = [
  SlField,
  SlFieldDescription,
  SlFieldError,
  SlFieldLabel,
  SlFieldset,
  SlFieldsetLegend,
  SlInput,
  SlSwitch,
  SlTextarea,
];

const ADDRESS = `
      <div slField>
        <label slFieldLabel>Street</label>
        <input slInput value="14 Rua da Prata" />
      </div>
      <div slField>
        <label slFieldLabel>City</label>
        <input slInput value="Lisbon" />
      </div>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<FieldsetStoryArgs> = {
  title: 'Components/Fieldset',
  component: SlFieldset,
  decorators: [moduleMetadata({ imports: FORM_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Fieldset',
        description: 'A group of related fields, named by its legend.',
        framework: 'Angular',
        ...ANGULAR_FIELDSET_DOCS.fieldset,
        tokens: ANGULAR_FIELDSET_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FieldsetStoryArgs>;

export const Playground: Story = {
  args: { disabled: false, invalid: false, orientation: 'vertical' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <fieldset slFieldset [disabled]="disabled" [invalid]="invalid" [orientation]="orientation">
    <legend slFieldsetLegend>Billing address</legend>${ADDRESS}
  </fieldset>
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
      <span class="slotted-demo-scene__label">vertical</span>
      <span class="slotted-demo-scene__note">Fields stacked, one per row.</span>
    </header>
    <div class="slotted-demo-stage">
      <fieldset slFieldset>
        <legend slFieldsetLegend>Billing address</legend>${ADDRESS}
      </fieldset>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">horizontal</span>
      <span class="slotted-demo-scene__note">Fields side by side, wrapping.</span>
    </header>
    <div class="slotted-demo-stage">
      <fieldset slFieldset orientation="horizontal">
        <legend slFieldsetLegend>Billing address</legend>${ADDRESS}
      </fieldset>
    </div>
  </section>
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <fieldset slFieldset [disabled]="true">
      <legend slFieldsetLegend>Disabled group</legend>
      <div slField>
        <label slFieldLabel>Street</label>
        <input slInput value="14 Rua da Prata" />
      </div>
      <div slField>
        <label slFieldLabel>Deliver on weekends</label>
        <button slSwitch></button>
      </div>
    </fieldset>
    <fieldset slFieldset [invalid]="true">
      <legend slFieldsetLegend>Invalid group</legend>
      <div slField [invalid]="true">
        <label slFieldLabel>Street</label>
        <input slInput />
        <p slFieldError>A street is required.</p>
      </div>
    </fieldset>
    <ul>
      <li>
        The first group sets nothing on the controls inside it. The native <code>disabled</code>
        attribute makes every one of them <em>actually</em> disabled, which is what
        <code>:disabled</code> matches and what each control&rsquo;s stylesheet paints.
      </li>
      <li>
        The second marks the group and colours its legend, and reaches into no control. Which field
        is at fault is the field&rsquo;s own to say.
      </li>
    </ul>
  </div>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <fieldset slFieldset>
    <legend slFieldsetLegend>Notifications</legend>
    <div slField>
      <label slFieldLabel>Email</label>
      <input slInput type="email" value="team@example.com" />
      <p slFieldDescription>Where the digest is sent.</p>
    </div>
    <div slField>
      <label slFieldLabel>Send a digest</label>
      <button slSwitch [checked]="true"></button>
    </div>
    <div slField>
      <label slFieldLabel>Signature</label>
      <textarea slTextarea [autoSize]="true" [rows]="2">&mdash; The build robot</textarea>
    </div>
  </fieldset>
</div>`,
  }),
};
