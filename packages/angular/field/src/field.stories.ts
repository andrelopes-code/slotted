import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlField } from './field';
import { SlFieldControl } from './field-control';
import { SlFieldDescription } from './field-description';
import { SlFieldError } from './field-error';
import { SlFieldLabel } from './field-label';
import { ANGULAR_FIELD_DOCS, ANGULAR_FIELD_TOKENS } from './field.docs';

interface FieldStoryArgs {
  disabled: boolean;
  invalid: boolean;
  readOnly: boolean;
  required: boolean;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta: Meta<FieldStoryArgs> = {
  title: 'Components/Field',
  component: SlField,
  decorators: [
    moduleMetadata({
      imports: [SlField, SlFieldControl, SlFieldDescription, SlFieldError, SlFieldLabel],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Field',
        description: 'Label, description, error, and the ARIA that binds them to a control.',
        framework: 'Angular',
        ...ANGULAR_FIELD_DOCS.field,
        tokens: ANGULAR_FIELD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<FieldStoryArgs>;

export const Playground: Story = {
  args: { disabled: false, invalid: false, readOnly: false, required: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slField [disabled]="disabled" [invalid]="invalid" [readOnly]="readOnly" [required]="required">
    <label slFieldLabel>Email</label>
    <input slFieldControl name="email" type="email" />
    <p slFieldDescription>Used for sign-in</p>
  </div>
</div>`,
  }),
};

const stateScene = (label: string, binding: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">State reaches the label and the control.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slField ${binding}>
        <label slFieldLabel>Email</label>
        <input slFieldControl value="team@example.com" />
      </div>
    </div>
  </section>`;

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="3">
  ${stateScene('Default', '')}
  ${stateScene('Required', 'required')}
  ${stateScene('Invalid', 'invalid')}
  ${stateScene('Disabled', 'disabled')}
  ${stateScene('Read-only', 'readOnly')}
</div>`,
  }),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slField id="with-description">
    <label slFieldLabel>Workspace name</label>
    <input slFieldControl value="Acme" />
    <p slFieldDescription>Visible to everyone in the workspace.</p>
  </div>
</div>`,
  }),
};

export const Error: Story = {
  parameters: scenario('error'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slField id="with-error" invalid>
    <label slFieldLabel>Email</label>
    <input slFieldControl value="not-an-email" />
    <p slFieldDescription>Used for sign-in</p>
    <p slFieldError>Enter an address in the form name&#64;example.com</p>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slField id="native" required>
    <label slFieldLabel>Port</label>
    <input slFieldControl type="number" min="1" max="65535" />
    <p slFieldDescription>A plain native input receives the same wiring.</p>
  </div>
</div>`,
  }),
};
