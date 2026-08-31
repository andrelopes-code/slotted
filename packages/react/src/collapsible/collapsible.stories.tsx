import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Badge } from '../badge';
import { Card, CardBody, CardHeader } from '../card';
import { Collapsible } from './collapsible';
import { CollapsibleContent } from './collapsible-content';
import { CollapsibleTrigger } from './collapsible-trigger';
import { REACT_COLLAPSIBLE_DOCS, REACT_COLLAPSIBLE_TOKENS } from './collapsible.docs';

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
});

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Collapsible',
        description: 'One region the reader can put away, built on the platform disclosure.',
        framework: 'React',
        ...REACT_COLLAPSIBLE_DOCS.collapsible,
        tokens: REACT_COLLAPSIBLE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { defaultOpen: false },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Collapsible {...args}>
        <CollapsibleTrigger>Billing details</CollapsibleTrigger>
        <CollapsibleContent>
          Invoices are issued on the first working day of each month and are due within thirty days.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
};

function Controlled() {
  const [open, setOpen] = useState(false);

  return (
    <div className="slotted-demo-stack">
      <Collapsible onOpenChange={setOpen} open={open}>
        <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
        <CollapsibleContent>Two settings nobody changes.</CollapsibleContent>
      </Collapsible>
      <p>The consumer holds the value: it is currently {open ? 'open' : 'closed'}.</p>
    </div>
  );
}

export const Open: Story = {
  parameters: scenario('open'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Uncontrolled</span>
          <span className="slotted-demo-scene__note">defaultOpen, then the reader decides.</span>
        </header>
        <div className="slotted-demo-stage">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>What is included</CollapsibleTrigger>
            <CollapsibleContent>Five seats and unlimited invoices.</CollapsibleContent>
          </Collapsible>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Controlled</span>
          <span className="slotted-demo-scene__note">open and onOpenChange, held outside.</span>
        </header>
        <div className="slotted-demo-stage">
          <Controlled />
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Card>
        <CardHeader>
          <strong>Invoice INV-0042</strong>
        </CardHeader>
        <CardBody>
          <Collapsible>
            <CollapsibleTrigger>
              Line items{' '}
              <Badge fill="subtle" size="sm" variant="secondary">
                3
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="slotted-demo-stack">
                <span>Design retainer — £800.00</span>
                <span>Research — £320.00</span>
                <span>Accessibility audit — £120.00</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardBody>
      </Card>
      <p>
        The trigger holds a badge as well as its label, because a summary takes ordinary content.
      </p>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Collapsible>
          <CollapsibleTrigger>Terms nobody reads</CollapsibleTrigger>
          <CollapsibleContent>
            In a browser that supports it, the browser&rsquo;s own find-in-page will open this
            region to show a match inside it.
          </CollapsibleContent>
        </Collapsible>
        <p>
          Tab reaches the trigger, and Enter or Space opens it. The library sets no aria-expanded
          and no aria-controls: the element already reports both, and an attribute the component
          maintained by hand is one that can fall out of step with what the browser did.
        </p>
      </div>
    </div>
  ),
};
