import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Input } from './input';
import { REACT_INPUT_DOCS, REACT_INPUT_TOKENS } from './input.docs';

const SIZES = ['sm', 'md', 'lg'] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { placeholder: 'you@example.com', size: 'md' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Input',
        description: 'A single-line text control that wires itself to the field around it.',
        framework: 'React',
        ...REACT_INPUT_DOCS.input,
        tokens: REACT_INPUT_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input {...args} type="email" />
        <FieldDescription>We only use it to sign you in.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {SIZES.map((size) => (
        <section className="slotted-demo-scene" key={size}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{size}</span>
          </header>
          <div className="slotted-demo-stage">
            <Field>
              <FieldLabel>Workspace</FieldLabel>
              <Input defaultValue="acme" size={size} />
            </Field>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      {(
        [
          ['default', {}, 'Nothing set.'],
          ['invalid', { invalid: true }, 'aria-invalid, and the error border.'],
          ['read-only', { readOnly: true }, 'Visible, selectable, not editable.'],
          ['disabled', { disabled: true }, 'Out of the tab order and out of submission.'],
        ] as const
      ).map(([label, props, note]) => (
        <section className="slotted-demo-scene" key={label}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{label}</span>
            <span className="slotted-demo-scene__note">{note}</span>
          </header>
          <div className="slotted-demo-stage">
            <Input defaultValue="acme" {...props} />
          </div>
        </section>
      ))}
    </div>
  ),
};

export const InField: Story = {
  name: 'In a field',
  parameters: scenario('field'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Field id="signup-email" invalid required>
          <FieldLabel>Email</FieldLabel>
          <Input defaultValue="not-an-address" type="email" />
          <FieldDescription>We only use it to sign you in.</FieldDescription>
          <FieldError>That address is not valid.</FieldError>
        </Field>
        <Field disabled>
          <FieldLabel>Workspace</FieldLabel>
          <Input defaultValue="acme" />
          <FieldDescription>Set once, when the account is created.</FieldDescription>
        </Field>
        <Field disabled>
          <FieldLabel>Override</FieldLabel>
          <Input defaultValue="still editable" disabled={false} />
          <FieldDescription>
            The control&rsquo;s own value wins over the field&rsquo;s, in both directions.
          </FieldDescription>
        </Field>
        <ul>
          <li>
            The first control&rsquo;s <code>id</code> is <code>signup-email-control</code>, which is
            what the label&rsquo;s <code>for</code> resolves to, and its{' '}
            <code>aria-describedby</code> names the description and the error in that order.
          </li>
          <li>
            The field is <code>required</code>, so the control carries <code>aria-required</code> —
            never the native attribute, which would engage constraint validation and change what
            submitting the form does.
          </li>
        </ul>
      </div>
    </div>
  ),
};
