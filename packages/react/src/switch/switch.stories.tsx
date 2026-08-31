import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Switch } from './switch';
import { REACT_SWITCH_DOCS, REACT_SWITCH_TOKENS } from './switch.docs';

const SIZES = ['sm', 'md', 'lg'] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { defaultChecked: true, size: 'md' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Switch',
        description: 'A binary setting that takes effect as it is turned.',
        framework: 'React',
        ...REACT_SWITCH_DOCS.switch,
        tokens: REACT_SWITCH_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Field>
        <FieldLabel>Email alerts</FieldLabel>
        <Switch {...args} />
        <FieldDescription>Sent when a build fails.</FieldDescription>
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
            <div className="slotted-demo-stack">
              <Switch aria-label={`Off, ${size}`} size={size} />
              <Switch aria-label={`On, ${size}`} defaultChecked size={size} />
            </div>
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
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">off and on</span>
          <span className="slotted-demo-scene__note">
            Space and Enter turn it; the component binds neither.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <Switch aria-label="Off" />
            <Switch aria-label="On" defaultChecked />
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">disabled</span>
          <span className="slotted-demo-scene__note">
            There is no read-only switch. A setting that cannot change is disabled.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <Switch aria-label="Disabled, off" disabled />
            <Switch aria-label="Disabled, on" defaultChecked disabled />
          </div>
        </div>
      </section>
    </div>
  ),
};

export const InField: Story = {
  name: 'In a field',
  parameters: scenario('field'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Field id="alerts" required>
          <FieldLabel>Email alerts</FieldLabel>
          <Switch defaultChecked />
          <FieldDescription>Sent when a build fails.</FieldDescription>
        </Field>
        <Field invalid>
          <FieldLabel>Terms</FieldLabel>
          <Switch />
          <FieldError>You have to accept the terms to continue.</FieldError>
        </Field>
        <Field disabled>
          <FieldLabel>Beta features</FieldLabel>
          <Switch />
          <FieldDescription>Available on the team plan.</FieldDescription>
        </Field>
        <ul>
          <li>
            The control takes the field&rsquo;s <code>id</code>, so the label&rsquo;s{' '}
            <code>for</code> resolves to it, and its <code>aria-describedby</code> names whichever
            of the description and the error is present.
          </li>
          <li>
            A required field gives the control <code>aria-required</code> — never the native
            attribute, which a button does not carry meaningfully anyway.
          </li>
          <li>
            The control does not submit with a form. Add a hidden input beside it when the value has
            to reach the server without JavaScript.
          </li>
        </ul>
      </div>
    </div>
  ),
};
