import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlSplitter } from './splitter';
import type { SplitterOrientation } from './splitter';
import { ANGULAR_SPLITTER_DOCS, ANGULAR_SPLITTER_TOKENS } from './splitter.docs';
import { SlSplitterHandle } from './splitter-handle';
import { SlSplitterPane } from './splitter-pane';

interface SplitterStoryArgs {
  max: number;
  min: number;
  orientation: SplitterOrientation;
  step: number;
  value: number;
}

const FRAME = 'block-size: 11rem';

const pane = (title: string, body: string) => `
        <div style="padding: 0.75rem">
          <strong>${title}</strong>
          <p>${body}</p>
        </div>`;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Orientations as never,
});

const meta: Meta<SplitterStoryArgs> = {
  title: 'Components/Splitter',
  component: SlSplitter,
  decorators: [moduleMetadata({ imports: [SlSplitter, SlSplitterHandle, SlSplitterPane] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Splitter',
        description: 'Two regions whose shared boundary the reader can move.',
        framework: 'Angular',
        ...ANGULAR_SPLITTER_DOCS.splitter,
        tokens: ANGULAR_SPLITTER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SplitterStoryArgs>;

export const Playground: Story = {
  args: { max: 90, min: 10, orientation: 'horizontal', step: 5, value: 40 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-measure">
  <div
    slSplitter
    style="${FRAME}"
    [max]="max"
    [min]="min"
    [orientation]="orientation"
    [step]="step"
    [(value)]="value"
  >
    <div slSplitterPane id="playground-nav">${pane('Navigation', 'Drag the boundary.')}
    </div>
    <div slSplitterHandle aria-controls="playground-nav" aria-label="Resize navigation"></div>
    <div slSplitterPane>${pane('Content', 'Or focus the handle and use the arrows.')}
    </div>
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
      <span class="slotted-demo-scene__note">Panes side by side; the separator is a vertical line.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slSplitter style="${FRAME}" [value]="40">
        <div slSplitterPane>${pane('Start', 'Left in this document.')}
        </div>
        <div slSplitterHandle aria-label="Resize columns"></div>
        <div slSplitterPane>${pane('End', 'Right in this document.')}
        </div>
      </div>
    </div>
  </section>
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">vertical</span>
      <span class="slotted-demo-scene__note">Panes stacked; the separator is a horizontal line.</span>
    </header>
    <div class="slotted-demo-stage">
      <div slSplitter orientation="vertical" style="${FRAME}" [value]="40">
        <div slSplitterPane>${pane('Above', 'The first pane.')}
        </div>
        <div slSplitterHandle aria-label="Resize rows"></div>
        <div slSplitterPane>${pane('Below', 'The second pane.')}
        </div>
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
    <div slSplitter style="${FRAME}" [max]="85" [min]="15" [step]="10" [value]="50">
      <div slSplitterPane>${pane('Start', 'Focus the handle with Tab.')}
      </div>
      <div slSplitterHandle aria-label="Resize columns"></div>
      <div slSplitterPane>${pane('End', 'Then try the keys below.')}
      </div>
    </div>
    <ul>
      <li>Left and Right move the separator by one step, here ten percent.</li>
      <li>Home takes it to the minimum, End to the maximum &mdash; fifteen and eighty-five.</li>
      <li>Enter collapses the first pane, and Enter again restores where it was.</li>
      <li>Up and Down do nothing, so a page inside a pane still scrolls.</li>
    </ul>
  </div>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-measure">
  <div slSplitter style="block-size: 16rem" [max]="60" [min]="15" [value]="30">
    <div slSplitterPane>${pane('Files', 'One splitter.')}
    </div>
    <div slSplitterHandle aria-label="Resize files"></div>
    <div slSplitterPane>
      <div slSplitter orientation="vertical" style="block-size: 100%" [value]="60">
        <div slSplitterPane>${pane('Editor', 'A second splitter inside the first.')}
        </div>
        <div slSplitterHandle aria-label="Resize editor"></div>
        <div slSplitterPane>${pane('Output', 'Three regions, no coupled constraints.')}
        </div>
      </div>
    </div>
  </div>
</div>`,
  }),
};
