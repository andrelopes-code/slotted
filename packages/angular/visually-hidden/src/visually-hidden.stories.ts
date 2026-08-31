import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlVisuallyHidden } from './visually-hidden';
import {
  ANGULAR_VISUALLY_HIDDEN_DOCS,
  ANGULAR_VISUALLY_HIDDEN_TOKENS,
} from './visually-hidden.docs';

interface VisuallyHiddenStoryArgs {
  content: string;
  focusable: boolean;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta: Meta<VisuallyHiddenStoryArgs> = {
  title: 'Components/VisuallyHidden',
  component: SlVisuallyHidden,
  decorators: [moduleMetadata({ imports: [SlVisuallyHidden] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VisuallyHidden',
        description: 'Content a screen reader reads and the eye never sees.',
        framework: 'Angular',
        ...ANGULAR_VISUALLY_HIDDEN_DOCS.visuallyHidden,
        tokens: ANGULAR_VISUALLY_HIDDEN_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<VisuallyHiddenStoryArgs>;

export const Playground: Story = {
  args: { content: 'Delete invoice', focusable: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <button type="button">
      <span aria-hidden="true">&#128465;</span>
      <span slVisuallyHidden [focusable]="focusable">{{ content }}</span>
    </button>
    <p>
      The button shows a glyph and nothing else. Its accessible name is the hidden text, so a
      screen reader announces the action the glyph stands for.
    </p>
  </div>
</div>`,
  }),
};

export const Focusable: Story = {
  parameters: scenario('focusable'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <a slVisuallyHidden focusable href="#visually-hidden-main">Skip to content</a>
    <p>
      Press Tab with focus inside this frame. The skip link above is hidden until it holds focus,
      then it lays itself out like any other link.
    </p>
    <p id="visually-hidden-main">The link's destination.</p>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A column header shown as a glyph</span>
      <span class="slotted-demo-scene__note">The hidden text names the column for a screen reader.</span>
    </header>
    <div class="slotted-demo-stage">
      <table>
        <thead>
          <tr>
            <th scope="col">Invoice</th>
            <th scope="col">
              <span aria-hidden="true">&#10003;</span>
              <span slVisuallyHidden>Paid</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>INV-0042</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Extra context for a repeated link</span>
      <span class="slotted-demo-scene__note">Every link on the page reads &ldquo;Read more&rdquo; without it.</span>
    </header>
    <div class="slotted-demo-stage">
      <a href="#visually-hidden-main">
        Read more
        <span slVisuallyHidden> about quarterly billing</span>
      </a>
    </div>
  </section>
</div>`,
  }),
};
