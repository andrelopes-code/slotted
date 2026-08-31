import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlKbd } from './kbd';
import type { KbdSize } from './kbd';
import { ANGULAR_KBD_DOCS, ANGULAR_KBD_TOKENS } from './kbd.docs';

interface KbdStoryArgs {
  content: string;
  size: KbdSize;
}

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Sizes as never,
});

const meta: Meta<KbdStoryArgs> = {
  title: 'Components/Kbd',
  component: SlKbd,
  decorators: [moduleMetadata({ imports: [SlKbd] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Kbd',
        description: 'One key of a keyboard shortcut, printed.',
        framework: 'Angular',
        ...ANGULAR_KBD_DOCS.kbd,
        tokens: ANGULAR_KBD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<KbdStoryArgs>;

export const Playground: Story = {
  args: { content: 'K', size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-row">
    <kbd slKbd [size]="size">{{ content }}</kbd>
  </div>
</div>`,
  }),
};

const sizeScene = (size: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${size}</span>
      <span class="slotted-demo-scene__note">A single key is square; a word-length key grows sideways only.</span>
    </header>
    <div class="slotted-demo-stage">
      <div class="slotted-demo-row">
        <kbd slKbd size="${size}">K</kbd>
        <kbd slKbd size="${size}">W</kbd>
        <kbd slKbd size="${size}">Shift</kbd>
      </div>
    </div>
  </section>`;

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${sizeScene('sm')}
  ${sizeScene('md')}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <span><kbd slKbd>Ctrl</kbd> + <kbd slKbd>K</kbd> opens the command palette.</span>
    <span>
      <kbd slKbd aria-label="Command">&#8984;</kbd> + <kbd slKbd>K</kbd> does the same on macOS.
    </span>
    <p>
      The separator is text between two elements, not something the component prints. It is
      different in different languages, and the order of modifiers is different on different
      platforms.
    </p>
  </div>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <button aria-keyshortcuts="Control+K" type="button">
      Search <kbd slKbd size="sm">Ctrl</kbd> <kbd slKbd size="sm">K</kbd>
    </button>
    <p>
      The shortcut is announced by aria-keyshortcuts on the control that responds to it. The
      printed keys are the picture of the shortcut, and a glyph key carries a name of its own
      because a screen reader would otherwise read the character.
    </p>
  </div>
</div>`,
  }),
};
