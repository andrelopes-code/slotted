import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX } from '@ng-icons/lucide';
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

/**
 * The icon belongs to the consumer, and it is Lucide's. A character is never an
 * icon, and a reference page that used one would be teaching the wrong thing
 * beside the right one.
 */
const glyph = (name: string) => `<ng-icon aria-hidden="true" name="${name}" size="14"></ng-icon>`;

const CROSS = glyph('lucideX');
const CHECK = glyph('lucideCheck');

const meta: Meta<VisuallyHiddenStoryArgs> = {
  title: 'Components/VisuallyHidden',
  component: SlVisuallyHidden,
  decorators: [
    moduleMetadata({
      imports: [NgIcon, SlVisuallyHidden],
      providers: [provideIcons({ lucideCheck, lucideX })],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'VisuallyHidden',
        description: 'Content a screen reader reads, the eye never sees, and layout never feels.',
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
  args: { content: 'Remove invoice', focusable: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <button type="button">
      ${CROSS}
      <span slVisuallyHidden [focusable]="focusable">{{ content }}</span>
    </button>
    <p>
      The button shows a glyph and nothing else. Its accessible name is the hidden text, so a
      screen reader announces the action the glyph stands for. Turn <code>focusable</code> on and
      press Tab to see the difference: the name becomes visible while the button holds focus.
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
      then it stops being hidden and renders as the anchor it is &mdash; the directive paints
      nothing on it, so its appearance is the one the consumer gives the link.
    </p>
    <p id="visually-hidden-main">The link's destination.</p>
  </div>
</div>`,
  }),
};

/**
 * The promise that separates this primitive from `aria-label`: the content is
 * read and it costs no space. Both rows carry the same two buttons, and the
 * second one carries hidden text inside the first button and between the two.
 */
export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Without hidden content</span>
      <span class="slotted-demo-scene__note">Two buttons in a row with a gap.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div class="slotted-demo-row">
        <button type="button">A</button>
        <button type="button">B</button>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">With hidden content</span>
      <span class="slotted-demo-scene__note">The same row, with a name inside the first button and a hidden span between the two.</span>
    </header>
    <div class="slotted-demo-stage" data-align="start">
      <div class="slotted-demo-row">
        <button type="button">A<span slVisuallyHidden>pprove</span></button>
        <span slVisuallyHidden>Not a third gap</span>
        <button type="button">B</button>
      </div>
    </div>
  </section>
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
              ${CHECK}
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
