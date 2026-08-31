import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from './field';
import { FieldControl } from './field-control';
import { FieldDescription } from './field-description';
import { FieldError } from './field-error';
import { FieldLabel } from './field-label';
import { REACT_FIELD_DOCS, REACT_FIELD_TOKENS } from './field.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: States as never,
});

const meta = {
  title: 'Components/Field',
  component: Field,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Field',
        description: 'Label, description, error, and the ARIA that binds them to a control.',
        framework: 'React',
        ...REACT_FIELD_DOCS.field,
        tokens: REACT_FIELD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { disabled: false, invalid: false, readOnly: false, required: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Field {...args}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl name="email" type="email" />
        <FieldDescription>Used for sign-in</FieldDescription>
      </Field>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(
        [
          ['Default', {}],
          ['Required', { required: true }],
          ['Invalid', { invalid: true }],
          ['Disabled', { disabled: true }],
          ['Read-only', { readOnly: true }],
        ] as const
      ).map(([label, props]) => (
        <section className="slotted-demo-scene" key={label}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{label}</span>
            <span className="slotted-demo-scene__note">
              State reaches the label and the control.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <Field {...props}>
              <FieldLabel>Email</FieldLabel>
              <FieldControl defaultValue="team@example.com" />
            </Field>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => (
    <div className="slotted-demo-measure">
      <Field id="with-description">
        <FieldLabel>Workspace name</FieldLabel>
        <FieldControl defaultValue="Acme" />
        <FieldDescription>Visible to everyone in the workspace.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Error: Story = {
  parameters: scenario('error'),
  render: () => (
    <div className="slotted-demo-measure">
      <Field id="with-error" invalid>
        <FieldLabel>Email</FieldLabel>
        <FieldControl defaultValue="not-an-email" />
        <FieldDescription>Used for sign-in</FieldDescription>
        <FieldError>Enter an address in the form name@example.com</FieldError>
      </Field>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <Field id="native" required>
        <FieldLabel>Port</FieldLabel>
        <FieldControl render={(props) => <input {...props} max={65535} min={1} type="number" />} />
        <FieldDescription>A plain native input receives the same wiring.</FieldDescription>
      </Field>
    </div>
  ),
};
