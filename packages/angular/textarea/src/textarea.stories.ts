import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlField } from '../../field/src/field';
import { SlFieldDescription } from '../../field/src/field-description';
import { SlFieldError } from '../../field/src/field-error';
import { SlFieldLabel } from '../../field/src/field-label';
import { SlTextarea } from './textarea';
import type { TextareaSize } from './textarea';
import { ANGULAR_TEXTAREA_DOCS, ANGULAR_TEXTAREA_TOKENS } from './textarea.docs';

interface TextareaStoryArgs {
  autoSize: boolean;
  placeholder: string;
  rows: number;
  size: TextareaSize;
}

const FIELD_IMPORTS = [SlField, SlFieldDescription, SlFieldError, SlFieldLabel, SlTextarea];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<TextareaStoryArgs> = {
  title: 'Components/Textarea',
  component: SlTextarea,
  decorators: [moduleMetadata({ imports: FIELD_IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Textarea',
        description: 'A multi-line text control that wires itself to the field around it.',
        framework: 'Angular',
        ...ANGULAR_TEXTAREA_DOCS.textarea,
        tokens: ANGULAR_TEXTAREA_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TextareaStoryArgs>;

export const Playground: Story = {
  args: { autoSize: false, placeholder: 'Say something', rows: 3, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slField>
    <label slFieldLabel>Notes</label>
    <textarea
      slTextarea
      [autoSize]="autoSize"
      [placeholder]="placeholder"
      [rows]="rows"
      [size]="size"
    ></textarea>
    <p slFieldDescription>Anything the team should know.</p>
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
          <label slFieldLabel>Notes</label>
          <textarea slTextarea [rows]="2" [size]="size">Two lines is the smallest this gets.</textarea>
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
      <span class="slotted-demo-scene__label">invalid, from the field</span>
      <span class="slotted-demo-scene__note">The control takes the state, and the description order, from the field.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slField id="notes-invalid" [invalid]="true" [required]="true">
        <label slFieldLabel>Notes</label>
        <textarea slTextarea [rows]="2"></textarea>
        <p slFieldDescription>Anything the team should know.</p>
        <p slFieldError>Notes cannot be empty.</p>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">read-only and disabled</span>
      <span class="slotted-demo-scene__note">Neither offers the resize handle a reader cannot use.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-stack">
        <textarea slTextarea [readOnly]="true" [rows]="2">Kept, and not editable.</textarea>
        <textarea slTextarea [disabled]="true" [rows]="2">Out of the tab order.</textarea>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const AutoSize: Story = {
  name: 'Auto-size',
  parameters: scenario('auto-size'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slField>
      <label slFieldLabel>Grows with what you type</label>
      <textarea slTextarea [autoSize]="true" [rows]="2">Type into this one. It starts at two lines and grows to sixteen rem.</textarea>
    </div>
    <div slField>
      <label slFieldLabel>Stays at two lines</label>
      <textarea slTextarea [rows]="2">This one keeps its rows and offers the resize handle instead.</textarea>
    </div>
    <ul>
      <li>
        <code>autoSize</code> writes one attribute and the stylesheet sets
        <code>field-sizing: content</code>. There is no measurement, no observer and no effect
        &mdash; the platform answers this itself.
      </li>
      <li>
        <code>rows</code> stays the floor, so a browser without <code>field-sizing</code> shows a
        two-line box rather than a broken one.
      </li>
      <li>
        The resize handle is withdrawn while auto-sizing: a control that resizes itself and a handle
        that fixes its size disagree on the next keystroke.
      </li>
    </ul>
  </div>
</div>`,
  }),
};
