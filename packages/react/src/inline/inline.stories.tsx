import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Inline } from './inline';
import { REACT_INLINE_DOCS, REACT_INLINE_TOKENS } from './inline.docs';
import type { InlineAlign, InlineGap } from './inline.types';

/**
 * Inline paints nothing, so the reference page supplies the edges. The chip is
 * a demonstration device and never part of the family.
 */
function Chip({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        background: 'var(--slotted-surface-sunken)',
        border: '1px solid var(--slotted-border-subtle)',
        borderRadius: 'var(--slotted-radius-full)',
        color: 'var(--slotted-text)',
        fontSize: '12px',
        paddingBlock: 'var(--slotted-space-2)',
        paddingInline: 'var(--slotted-space-4)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--slotted-text-muted)', fontSize: '11px' }}>{children}</span>;
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

const STEPS: readonly InlineGap[] = [1, 4, 8];
const ALIGNMENTS: readonly InlineAlign[] = ['center', 'baseline', 'start', 'stretch'];
const STATUSES = [
  'Overdue',
  'Awaiting review',
  'Paid in full',
  'Refunded',
  'Disputed',
  'Written off',
  'Partially settled',
];

const column: CSSProperties = {
  display: 'grid',
  gap: 'var(--slotted-space-8)',
  gridTemplateColumns: 'minmax(0, 1fr)',
  inlineSize: '100%',
};
const row: CSSProperties = { ...column, gap: 'var(--slotted-space-3)' };

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Separation as never,
});

const meta = {
  title: 'Components/Inline',
  component: Inline,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Inline',
        description: 'Items along the inline axis, wrapping when the container runs out.',
        framework: 'React',
        ...REACT_INLINE_DOCS.inline,
        tokens: REACT_INLINE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Inline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { gap: 4 },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start">
      <Inline {...args} style={{ inlineSize: '100%' }}>
        <Chip>Draft</Chip>
        <Chip>Awaiting review</Chip>
        <Chip>Paid</Chip>
      </Inline>
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
            The default sits below the line height of the default type step, so a run reads as one
            line rather than as a list laid sideways.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            {STEPS.map((step) => (
              <div key={step} style={row}>
                <Caption>gap {step}</Caption>
                <Inline gap={step}>
                  <Chip>Draft</Chip>
                  <Chip>Awaiting review</Chip>
                  <Chip>Paid</Chip>
                </Inline>
              </div>
            ))}
          </div>
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
            baseline puts the type of every item on one line; center only puts the boxes there.
            justify distributes what is left along the inline axis.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            {ALIGNMENTS.map((align) => (
              <div key={align} style={row}>
                <Caption>align {align}</Caption>
                <Frame>
                  <Inline align={align} gap={4}>
                    <Chip>Short</Chip>
                    <Chip style={{ paddingBlock: 'var(--slotted-space-6)' }}>Taller item</Chip>
                    <Chip style={{ fontSize: '20px' }}>Larger type</Chip>
                  </Inline>
                </Frame>
              </div>
            ))}
            <div style={row}>
              <Caption>justify between</Caption>
              <Frame>
                <Inline gap={4} justify="between">
                  <Chip>Cancel</Chip>
                  <Chip>Save changes</Chip>
                </Inline>
              </Frame>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Wrapping: Story = {
  parameters: scenario('wrapping'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Wrapping, and refusing to</span>
          <span className="slotted-demo-scene__note">
            Narrow the window. The first run wraps, and its rows keep the separation the gap states.
            The second was told to keep one line and overflows its container instead, which is what
            asking for nowrap costs.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={column}>
            <div style={row}>
              <Caption>wrap · the default</Caption>
              <Frame>
                <Inline>
                  {STATUSES.map((status) => (
                    <Chip key={status}>{status}</Chip>
                  ))}
                </Inline>
              </Frame>
            </div>
            <div style={row}>
              <Caption>nowrap</Caption>
              <Frame>
                <Inline wrap="nowrap">
                  {STATUSES.map((status) => (
                    <Chip key={status}>{status}</Chip>
                  ))}
                </Inline>
              </Frame>
            </div>
          </div>
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
            Rendering into a ul keeps the list semantics a screen reader announces. Inline adds no
            role of its own, and offers no axis that would let the visual order disagree with the
            reading order.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Inline
            gap={2}
            render={(props) => <ul {...props} style={{ ...props.style, margin: 0, padding: 0 }} />}
            style={{ inlineSize: '100%' }}
          >
            {['First, and read first', 'Second', 'Third'].map((label) => (
              <li key={label} style={{ listStyle: 'none' }}>
                <Chip>{label}</Chip>
              </li>
            ))}
          </Inline>
        </div>
      </section>
    </div>
  ),
};
