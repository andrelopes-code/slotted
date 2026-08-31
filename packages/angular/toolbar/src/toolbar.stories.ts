import { signal } from '@angular/core';
import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '../../button/src/button';
import { SlDivider } from '../../divider/src/divider';
import { SlToolbar } from './toolbar';
import type { ToolbarOrientation } from './toolbar';
import { ANGULAR_TOOLBAR_DOCS, ANGULAR_TOOLBAR_TOKENS } from './toolbar.docs';

interface ToolbarStoryArgs {
  orientation: ToolbarOrientation;
}

const FORMATTING = `
      <button slButton size="sm" variant="secondary">Bold</button>
      <button slButton disabled size="sm" variant="secondary">Italic</button>
      <hr slDivider orientation="vertical" />
      <button slButton size="sm" variant="secondary">Align left</button>
      <button slButton size="sm" variant="secondary">Align right</button>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<ToolbarStoryArgs> = {
  title: 'Components/Toolbar',
  component: SlToolbar,
  decorators: [moduleMetadata({ imports: [SlButton, SlDivider, SlToolbar] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Toolbar',
        description: 'A group of controls that costs a keyboard user one Tab.',
        framework: 'Angular',
        ...ANGULAR_TOOLBAR_DOCS.toolbar,
        tokens: ANGULAR_TOOLBAR_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ToolbarStoryArgs>;

export const Playground: Story = {
  args: { orientation: 'horizontal' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div slToolbar aria-label="Formatting" [orientation]="orientation">${FORMATTING}
  </div>
</div>`,
  }),
};

export const Orientations: Story = {
  parameters: scenario('orientations'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">horizontal</span>
      <span class="slotted-demo-scene__note">Left and Right move between controls.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slToolbar aria-label="Horizontal formatting">${FORMATTING}
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">vertical</span>
      <span class="slotted-demo-scene__note">Up and Down do, and the rule turns.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slToolbar aria-label="Vertical formatting" orientation="vertical">${FORMATTING}
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slToolbar aria-label="Keyboard demonstration">${FORMATTING}
    </div>
    <ul>
      <li>Tab reaches the toolbar once, whatever it holds.</li>
      <li>Left and Right move between controls, and wrap past either end.</li>
      <li>Home and End go to the first and last control.</li>
      <li>Italic is disabled: the tab stop steps over it and does not stop there.</li>
      <li>Up and Down do nothing, so a scrollable page still scrolls.</li>
    </ul>
  </div>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    const extra = signal(false);
    return {
      props: { extra, toggle: () => extra.update((current) => !current) },
      template: `
<div class="slotted-demo-measure">
  <div class="slotted-demo-stack">
    <div slToolbar aria-label="Growing toolbar">
      <button slButton size="sm" variant="secondary">Bold</button>
      <button slButton size="sm" variant="secondary">Italic</button>
      @if (extra()) {
        <button slButton size="sm" variant="secondary">Strikethrough</button>
      }
    </div>
    <button slButton size="sm" (click)="toggle()">
      {{ extra() ? 'Remove the third control' : 'Add a third control' }}
    </button>
  </div>
  <p>
    The controls are ordinary Buttons, not something the toolbar wraps, and one added after the
    toolbar was built joins the single tab stop on its own.
  </p>
</div>`,
    };
  },
};
