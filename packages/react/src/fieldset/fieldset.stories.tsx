import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Input } from '../input/input';
import { Switch } from '../switch/switch';
import { Textarea } from '../textarea/textarea';
import { Fieldset } from './fieldset';
import { REACT_FIELDSET_DOCS, REACT_FIELDSET_TOKENS } from './fieldset.docs';
import { FieldsetLegend } from './fieldset-legend';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta = {
  title: 'Components/Fieldset',
  component: Fieldset,
  args: { disabled: false, invalid: false, orientation: 'vertical' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Fieldset',
        description: 'A group of related fields, named by its legend.',
        framework: 'React',
        ...REACT_FIELDSET_DOCS.fieldset,
        tokens: REACT_FIELDSET_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

const Address = () => (
  <>
    <Field>
      <FieldLabel>Street</FieldLabel>
      <Input defaultValue="14 Rua da Prata" />
    </Field>
    <Field>
      <FieldLabel>City</FieldLabel>
      <Input defaultValue="Lisbon" />
    </Field>
  </>
);

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Fieldset {...args}>
        <FieldsetLegend>Billing address</FieldsetLegend>
        <Address />
      </Fieldset>
    </div>
  ),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">vertical</span>
          <span className="slotted-demo-scene__note">Fields stacked, one per row.</span>
        </header>
        <div className="slotted-demo-stage">
          <Fieldset>
            <FieldsetLegend>Billing address</FieldsetLegend>
            <Address />
          </Fieldset>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">horizontal</span>
          <span className="slotted-demo-scene__note">Fields side by side, wrapping.</span>
        </header>
        <div className="slotted-demo-stage">
          <Fieldset orientation="horizontal">
            <FieldsetLegend>Billing address</FieldsetLegend>
            <Address />
          </Fieldset>
        </div>
      </section>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Fieldset disabled>
          <FieldsetLegend>Disabled group</FieldsetLegend>
          <Field>
            <FieldLabel>Street</FieldLabel>
            <Input defaultValue="14 Rua da Prata" />
          </Field>
          <Field>
            <FieldLabel>Deliver on weekends</FieldLabel>
            <Switch />
          </Field>
        </Fieldset>
        <Fieldset invalid>
          <FieldsetLegend>Invalid group</FieldsetLegend>
          <Field invalid>
            <FieldLabel>Street</FieldLabel>
            <Input defaultValue="" />
            <FieldError>A street is required.</FieldError>
          </Field>
        </Fieldset>
        <ul>
          <li>
            The first group sets nothing on the controls inside it. The native <code>disabled</code>{' '}
            attribute makes every one of them <em>actually</em> disabled, which is what{' '}
            <code>:disabled</code> matches and what each control&rsquo;s stylesheet paints.
          </li>
          <li>
            The second marks the group and colours its legend, and reaches into no control. Which
            field is at fault is the field&rsquo;s own to say.
          </li>
        </ul>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Fieldset>
        <FieldsetLegend>Notifications</FieldsetLegend>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input defaultValue="team@example.com" type="email" />
          <FieldDescription>Where the digest is sent.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Send a digest</FieldLabel>
          <Switch defaultChecked />
        </Field>
        <Field>
          <FieldLabel>Signature</FieldLabel>
          <Textarea autoSize defaultValue="— The build robot" rows={2} />
        </Field>
      </Fieldset>
    </div>
  ),
};
