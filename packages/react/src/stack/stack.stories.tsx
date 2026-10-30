import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Stack } from './stack';
import { REACT_STACK_DOCS, REACT_STACK_TOKENS } from './stack.docs';
import type { StackGap } from './stack.types';

/**
 * Stack paints nothing, so the reference page supplies the edges. The tile is a
 * demonstration device and never part of the family.
 */
function Tile({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--slotted-surface-sunken)',
        border: '1px solid var(--slotted-border-subtle)',
        borderRadius: 'var(--slotted-radius-sm)',
        color: 'var(--slotted-text)',
        fontSize: '12px',
        paddingBlock: 'var(--slotted-space-3)',
        paddingInline: 'var(--slotted-space-4)',
      }}
    >
      {children}
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed var(--slotted-border-strong)',
        borderRadius: 'var(--slotted-radius-md)',
        inlineSize: '100%',
        padding: 'var(--slotted-space-3)',
      }}
    >
      {children}
    </div>
  );
}

const STEPS: readonly StackGap[] = [0, 2, 6, 9];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Separation as never,
});

const meta = {
  title: 'Components/Stack',
  component: Stack,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Stack',
        description: 'Children along the block axis, separated by one step of the space scale.',
        framework: 'React',
        ...REACT_STACK_DOCS.stack,
        tokens: REACT_STACK_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { gap: 6 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start">
      <Stack {...args} style={{ inlineSize: '100%' }}>
        <Tile>Workspace</Tile>
        <Tile>Members</Tile>
        <Tile>Billing</Tile>
      </Stack>
    </div>
  ),
};

export const Separation: Story = {
  parameters: scenario('separation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Steps on the space scale</span>
          <span className="slotted-demo-scene__note">
            The separation is a step, never a length. Nothing here changes with density: how tightly
            controls are packed is not a composition decision.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Stack gap={9} style={{ inlineSize: '100%' }}>
            {STEPS.map((step) => (
              <Stack key={step} gap={3}>
                <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>
                  gap {step}
                </span>
                <Stack gap={step}>
                  <Tile>Workspace</Tile>
                  <Tile>Members</Tile>
                  <Tile>Billing</Tile>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </div>
      </section>
    </div>
  ),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Across the flow, and along it</span>
          <span className="slotted-demo-scene__note">
            align positions children across the flow, which for a stack is the inline axis. justify
            positions them along it, and moves nothing until the stack has a block size.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Stack gap={8} style={{ inlineSize: '100%' }}>
            {(['stretch', 'start', 'center', 'end'] as const).map((align) => (
              <Stack key={align} gap={3}>
                <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>
                  align {align}
                </span>
                <Frame>
                  <Stack align={align} gap={3}>
                    <Tile>Invoice</Tile>
                    <Tile>Receipt for March</Tile>
                  </Stack>
                </Frame>
              </Stack>
            ))}
            <Stack gap={3}>
              <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>
                justify between
              </span>
              <div
                style={{
                  blockSize: '220px',
                  border: '1px dashed var(--slotted-border-strong)',
                  borderRadius: 'var(--slotted-radius-md)',
                  inlineSize: '100%',
                  padding: 'var(--slotted-space-3)',
                }}
              >
                <Stack align="start" gap={3} justify="between" style={{ blockSize: '100%' }}>
                  <Tile>Header</Tile>
                  <Tile>Body</Tile>
                  <Tile>Footer</Tile>
                </Stack>
              </div>
            </Stack>
          </Stack>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A stack of stacks</span>
          <span className="slotted-demo-scene__note">
            The outer stack separates sections and the inner one separates the lines inside them.
            Nothing sets a margin, so the rhythm is stated in one place.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Stack gap={8} style={{ inlineSize: '100%' }}>
            <Stack gap={5}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Billing and invoices</h2>
              <p style={{ lineHeight: 1.5, margin: 0 }}>
                Invoices are issued on the first working day of each month and settle against the
                payment method on file.
              </p>
            </Stack>
            <Stack gap={6}>
              <Stack gap={2}>
                <span style={{ fontWeight: 600 }}>Payment method</span>
                <span style={{ color: 'var(--slotted-text-muted)' }}>Visa ending 4242</span>
              </Stack>
              <Stack gap={2}>
                <span style={{ fontWeight: 600 }}>Billing address</span>
                <span style={{ color: 'var(--slotted-text-muted)' }}>
                  200 Harbor Street, Seattle
                </span>
              </Stack>
            </Stack>
          </Stack>
        </div>
      </section>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The element is the consumer’s</span>
          <span className="slotted-demo-scene__note">
            Rendering into a ul keeps the list semantics a screen reader announces. Stack adds no
            role of its own, and offers no axis that would let the visual order disagree with the
            reading order.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Stack
            gap={3}
            render={(props) => <ul {...props} style={{ ...props.style, margin: 0, padding: 0 }} />}
            style={{ inlineSize: '100%' }}
          >
            <li style={{ listStyle: 'none' }}>
              <Tile>First, and read first</Tile>
            </li>
            <li style={{ listStyle: 'none' }}>
              <Tile>Second</Tile>
            </li>
            <li style={{ listStyle: 'none' }}>
              <Tile>Third</Tile>
            </li>
          </Stack>
        </div>
      </section>
    </div>
  ),
};
