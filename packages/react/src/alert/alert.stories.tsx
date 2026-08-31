import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Alert } from './alert';
import { AlertActions } from './alert-actions';
import { AlertDescription } from './alert-description';
import { AlertIcon } from './alert-icon';
import { AlertTitle } from './alert-title';
import { REACT_ALERT_DOCS, REACT_ALERT_TOKENS } from './alert.docs';
import type { AlertFill, AlertVariant } from './alert.types';

const VARIANTS: readonly AlertVariant[] = ['accent', 'secondary', 'success', 'warning', 'danger'];
const FILLS: readonly AlertFill[] = ['subtle', 'outline', 'solid'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Alert',
        description: 'A message in the page, announced only when it has to be.',
        framework: 'React',
        ...REACT_ALERT_DOCS.alert,
        tokens: REACT_ALERT_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { fill: 'subtle', live: 'off', size: 'md', variant: 'accent' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Alert {...args}>
        <AlertIcon>i</AlertIcon>
        <AlertTitle>Scheduled maintenance</AlertTitle>
        <AlertDescription>
          The workspace will be read-only on Sunday between 02:00 and 04:00.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {FILLS.map((fill) => (
        <section className="slotted-demo-scene" key={fill}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{fill}</span>
            <span className="slotted-demo-scene__note">
              The five tones the library names, in one fill.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-stack">
              {VARIANTS.map((variant) => (
                <Alert fill={fill} key={variant} size="sm" variant={variant}>
                  <AlertTitle>{variant}</AlertTitle>
                </Alert>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

function LiveDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <div className="slotted-demo-stack">
      <Button
        onClick={() => setMessages((current) => [...current, `Invoice ${current.length + 1} sent`])}
      >
        Send an invoice
      </Button>
      <div>
        {messages.map((message) => (
          <Alert key={message} live="polite" variant="success">
            <AlertIcon>✓</AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ))}
      </div>
    </div>
  );
}

export const Live: Story = {
  parameters: scenario('live'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Alert variant="accent">
          <AlertTitle>off — read in document order</AlertTitle>
          <AlertDescription>
            No role. This message was on the page before anyone arrived.
          </AlertDescription>
        </Alert>
        <Alert live="assertive" variant="danger">
          <AlertTitle>assertive — interrupts</AlertTitle>
          <AlertDescription>
            role=&quot;alert&quot;. Reserve it for something going wrong now.
          </AlertDescription>
        </Alert>
        <LiveDemo />
        <p>
          The polite messages above appear inside a container that was already in the document. A
          live region added at the same moment as its text is often not announced at all.
        </p>
      </div>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-measure">
      <Alert variant="danger">
        <AlertIcon>!</AlertIcon>
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>The card ending 4242 was declined by the issuer.</AlertDescription>
        <AlertActions>
          <Button size="sm" variant="danger">
            Try another card
          </Button>
        </AlertActions>
      </Alert>
      <p>
        The icon spans both rows and the actions sit in a column of their own, so the message reads
        as one block whether it has one line or three.
      </p>
    </div>
  ),
};
