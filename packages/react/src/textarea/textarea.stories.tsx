import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../field/field';
import { FieldDescription } from '../field/field-description';
import { FieldError } from '../field/field-error';
import { FieldLabel } from '../field/field-label';
import { Textarea } from './textarea';
import { REACT_TEXTAREA_DOCS, REACT_TEXTAREA_TOKENS } from './textarea.docs';

const SIZES = ['sm', 'md', 'lg'] as const;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: { autoSize: false, placeholder: 'Say something', rows: 3, size: 'md' },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Textarea',
        description: 'A multi-line text control that wires itself to the field around it.',
        framework: 'React',
        ...REACT_TEXTAREA_DOCS.textarea,
        tokens: REACT_TEXTAREA_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Field>
        <FieldLabel>Notes</FieldLabel>
        <Textarea {...args} />
        <FieldDescription>Anything the team should know.</FieldDescription>
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
              <FieldLabel>Notes</FieldLabel>
              <Textarea defaultValue="Two lines is the smallest this gets." rows={2} size={size} />
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
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">invalid, from the field</span>
          <span className="slotted-demo-scene__note">
            The control takes the state, and the description order, from the field.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Field id="notes-invalid" invalid required>
            <FieldLabel>Notes</FieldLabel>
            <Textarea defaultValue="" rows={2} />
            <FieldDescription>Anything the team should know.</FieldDescription>
            <FieldError>Notes cannot be empty.</FieldError>
          </Field>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">read-only and disabled</span>
          <span className="slotted-demo-scene__note">
            Neither offers the resize handle a reader cannot use.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-stack">
            <Textarea defaultValue="Kept, and not editable." readOnly rows={2} />
            <Textarea defaultValue="Out of the tab order." disabled rows={2} />
          </div>
        </div>
      </section>
    </div>
  ),
};

export const AutoSize: Story = {
  name: 'Auto-size',
  parameters: scenario('auto-size'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Field>
          <FieldLabel>Grows with what you type</FieldLabel>
          <Textarea
            autoSize
            defaultValue="Type into this one. It starts at two lines and grows to sixteen rem."
            rows={2}
          />
        </Field>
        <Field>
          <FieldLabel>Stays at two lines</FieldLabel>
          <Textarea
            defaultValue="This one keeps its rows and offers the resize handle instead."
            rows={2}
          />
        </Field>
        <ul>
          <li>
            <code>autoSize</code> writes one attribute and the stylesheet sets{' '}
            <code>field-sizing: content</code>. There is no measurement, no observer and no effect —
            the platform answers this itself.
          </li>
          <li>
            <code>rows</code> stays the floor, so a browser without <code>field-sizing</code> shows
            a two-line box rather than a broken one.
          </li>
          <li>
            The resize handle is withdrawn while auto-sizing: a control that resizes itself and a
            handle that fixes its size disagree on the next keystroke.
          </li>
        </ul>
      </div>
    </div>
  ),
};
