import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlFloatingPanel,
  SlFloatingPanelBody,
  SlFloatingPanelClose,
  SlFloatingPanelHandle,
  SlFloatingPanelTitle,
} from './floating-panel';
import { ANGULAR_FLOATING_PANEL_DOCS, ANGULAR_FLOATING_PANEL_TOKENS } from './floating-panel.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_FLOATING_PANEL_DOCS.floatingPanel.scenes, {
    playground: Playground,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const family = moduleMetadata({
  imports: [
    SlFloatingPanel,
    SlFloatingPanelBody,
    SlFloatingPanelClose,
    SlFloatingPanelHandle,
    SlFloatingPanelTitle,
  ],
});

const meta: Meta = {
  title: 'Components/FloatingPanel',
  component: SlFloatingPanel,
  decorators: [family],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FloatingPanel',
        description:
          'A tool that stays over the page while the page stays usable: no scrim, no focus trap, moved by its handle and kept whole inside the viewport.',
        framework: 'Angular',
        ...ANGULAR_FLOATING_PANEL_DOCS.floatingPanel,
        tokens: ANGULAR_FLOATING_PANEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

const calculator = (attributes: string) => `
<div class="slotted-demo-stage" data-align="start" data-layout="block">
  <section slFloatingPanel [open]="true" ${attributes}>
    <div slFloatingPanelHandle>
      <h2 slFloatingPanelTitle>Calculator</h2>
      <button slFloatingPanelClose></button>
    </div>
    <div slFloatingPanelBody><output>1,240.00</output></div>
  </section>
</div>`;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({ template: calculator('') }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: { place: { x: 24, y: 24 } },
    template: calculator('[place]="place" (placeChange)="place = $event"'),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({ template: calculator('label="Calculator tool"') }),
};
