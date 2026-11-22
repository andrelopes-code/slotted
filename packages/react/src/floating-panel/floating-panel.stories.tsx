import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { FloatingPanel } from './floating-panel';
import {
  FloatingPanelBody,
  FloatingPanelClose,
  FloatingPanelHandle,
  FloatingPanelTitle,
} from './floating-panel-parts';
import { REACT_FLOATING_PANEL_DOCS, REACT_FLOATING_PANEL_TOKENS } from './floating-panel.docs';
import type { FloatingPlace } from './floating-panel.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_FLOATING_PANEL_DOCS.floatingPanel.scenes, {
    playground: Playground,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/FloatingPanel',
  component: FloatingPanel,
  args: { open: true, onOpenChange: () => {} },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'FloatingPanel',
        description:
          'A tool that stays over the page while the page stays usable: no scrim, no focus trap, moved by its handle and kept whole inside the viewport.',
        framework: 'React',
        ...REACT_FLOATING_PANEL_DOCS.floatingPanel,
        tokens: REACT_FLOATING_PANEL_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function Calculator({ label, place }: { label?: string; place?: boolean }) {
  const [open, setOpen] = useState(true);
  const [stored, setStored] = useState<FloatingPlace | undefined>(undefined);

  return (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <Button onClick={() => setOpen(true)}>Open the calculator</Button>
      <FloatingPanel
        aria-label={label}
        onOpenChange={setOpen}
        open={open}
        {...(place === true ? { onPlaceChange: setStored, place: stored } : {})}
      >
        <FloatingPanelHandle>
          <FloatingPanelTitle>Calculator</FloatingPanelTitle>
          <FloatingPanelClose />
        </FloatingPanelHandle>
        <FloatingPanelBody>
          <output>1,240.00</output>
        </FloatingPanelBody>
      </FloatingPanel>
    </div>
  );
}

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => <Calculator />,
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => <Calculator place />,
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => <Calculator label="Calculator tool" />,
};
