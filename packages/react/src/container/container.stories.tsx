import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';

import { Container } from './container';
import { ContainerBreakout } from './container-breakout';
import { REACT_CONTAINER_DOCS, REACT_CONTAINER_TOKENS } from './container.docs';
import type { ContainerSize } from './container.types';

/**
 * Container paints nothing, so the reference page supplies the edges. Space is
 * the box the container is given; Block is anything inside the bounded column,
 * so the column's own edges are visible. Both are demonstration devices and
 * never part of the family.
 */
function Space({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--slotted-surface-sunken)',
        border: '1px dashed var(--slotted-border-strong)',
        borderRadius: 'var(--slotted-radius-md)',
        inlineSize: '100%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Block({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--slotted-surface-raised)',
        border: '1px solid var(--slotted-border-subtle)',
        borderRadius: 'var(--slotted-radius-sm)',
        boxSizing: 'border-box',
        fontSize: '12px',
        paddingBlock: 'var(--slotted-space-3)',
        paddingInline: 'var(--slotted-space-4)',
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        color: 'var(--slotted-text-muted)',
        display: 'block',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        paddingBlockEnd: 'var(--slotted-space-3)',
      }}
    >
      {children}
    </span>
  );
}

const PROSE: CSSProperties = { lineHeight: 1.5, margin: 0 };

const PARAGRAPH =
  'Invoices are issued on the first working day of each month and settle against the payment ' +
  'method on file. A line this long is where a reader starts to lose the beginning of the next ' +
  'one, which is the whole reason the bound exists.';

/** The maxima retuned small, so four steps all wider than this stage still differ. */
const RETUNED = {
  '--slotted-container-measure': '16ch',
  '--slotted-container-content': '14rem',
  '--slotted-container-wide': '22rem',
} as CSSProperties;

const STEPS: readonly { size: ContainerSize; note: string }[] = [
  { size: 'measure', note: '16ch here · the comfortable reading line' },
  { size: 'content', note: '14rem here · the default' },
  { size: 'wide', note: '22rem here · a dense application page' },
  { size: 'full', note: '120rem elsewhere · the frame, up to the ceiling' },
  { size: 'bleed', note: 'no maximum, and the gutters remain' },
];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Bounds as never,
});

const meta = {
  title: 'Components/Container',
  component: Container,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Container',
        description:
          'A bounded, inset, placed column — and the owner of comfortable measure. A breakout child reaches both edges.',
        framework: 'React',
        ...REACT_CONTAINER_DOCS.container,
        tokens: REACT_CONTAINER_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { align: 'center', inset: 6, size: 'content' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start">
      <Space>
        <Container {...args}>
          <Block>Bounded, inset and placed</Block>
        </Container>
      </Space>
    </div>
  ),
};

export const Measure: Story = {
  parameters: scenario('measure'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The line, counted in characters</span>
          <span className="slotted-demo-scene__note">
            measure states 65ch, so the bound follows the inherited type and the reader’s zoom. A
            maximum stated in pixels gets longer in characters when the text is enlarged, which is
            the opposite of what the bound is for. WCAG SC 1.4.8 caps a line at eighty characters.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={{ display: 'grid', gap: 'var(--slotted-space-8)', inlineSize: '100%' }}>
            <div>
              <Label>size measure</Label>
              <Space>
                <Container size="measure">
                  <p style={PROSE}>{PARAGRAPH}</p>
                </Container>
              </Space>
            </div>
            <div>
              <Label>size full · the same paragraph across the whole space</Label>
              <Space>
                <Container size="full">
                  <p style={PROSE}>{PARAGRAPH}</p>
                </Container>
              </Space>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Bounds: Story = {
  parameters: scenario('bounds'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Four steps, named for what they bound</span>
          <span className="slotted-demo-scene__note">
            The maxima are retuned small here so all four differ at this width. That is also the
            whole theming story: the bound is a token, and nothing else in the family changes.
            Nothing here answers density — how tightly controls are packed is not a page decision.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div
            style={{
              display: 'grid',
              gap: 'var(--slotted-space-8)',
              inlineSize: '100%',
              ...RETUNED,
            }}
          >
            {STEPS.map(({ note, size }) => (
              <div key={size}>
                <Label>
                  {size} · {note}
                </Label>
                <Space>
                  <Container size={size}>
                    <Block>Bounded</Block>
                  </Container>
                </Space>
              </div>
            ))}
            <div>
              <Label>align start · center · end, and inset 0 · 6 · 9</Label>
              <div style={{ display: 'grid', gap: 'var(--slotted-space-3)' }}>
                {(['start', 'center', 'end'] as const).map((align) => (
                  <Space key={align}>
                    <Container align={align} size="content">
                      <Block>align {align}</Block>
                    </Container>
                  </Space>
                ))}
                {([0, 6, 9] as const).map((inset) => (
                  <Space key={inset}>
                    <Container inset={inset} size="full">
                      <Block>inset {inset}</Block>
                    </Container>
                  </Space>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Breakout: Story = {
  parameters: scenario('breakout'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A child that reaches both edges</span>
          <span className="slotted-demo-scene__note">
            The breakout answers the container, not the viewport, so it is still correct nested,
            inside a scroll region, and in a container that does not fill the page. Bounded content
            returns inside it by nesting another Container.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Space>
            <Container size="measure">
              <p style={PROSE}>
                Usage this month. The summary below is billed per seat and settles with the invoice.
              </p>
              <ContainerBreakout
                style={{
                  background: 'var(--slotted-surface-inverse)',
                  boxSizing: 'border-box',
                  color: 'var(--slotted-text-inverse)',
                  fontSize: '12px',
                  marginBlock: 'var(--slotted-space-5)',
                  padding: 'var(--slotted-space-4)',
                }}
              >
                <Container inset={9} size="full">
                  <div style={{ fontSize: '12px' }}>
                    A strip at the container’s edge, with a container of its own inside it.
                  </div>
                </Container>
              </ContainerBreakout>
              <p style={PROSE}>Bounded content resumes after it, at the same column.</p>
            </Container>
          </Space>
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
          <span className="slotted-demo-scene__label">One container inside another</span>
          <span className="slotted-demo-scene__note">
            The bound is the smaller of the maximum and what is left after both gutters, so an inner
            container never exceeds its outer one and the insets add rather than fight. Separation
            between children is Stack’s; the container only bounds.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Space>
            <Container inset={6} size="full">
              <Space style={{ background: 'transparent' }}>
                <Container inset={6} size="content">
                  <div style={{ display: 'grid', gap: 'var(--slotted-space-3)' }}>
                    <Block>Inner column, inset again</Block>
                    <Block>Second row, same column</Block>
                  </div>
                </Container>
              </Space>
            </Container>
          </Space>
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
            Rendering into a main keeps the landmark a screen reader announces. Container adds no
            role of its own. A long unbroken token overflows its own box rather than widening the
            page, which is the two-axis scroll SC 1.4.10 refuses.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <div style={{ display: 'grid', gap: 'var(--slotted-space-8)', inlineSize: '100%' }}>
            <Space>
              <Container
                render={(props) => <main {...props} aria-label="Billing" />}
                size="measure"
              >
                <p style={PROSE}>A main landmark that happens to be bounded.</p>
              </Container>
            </Space>
            <div style={RETUNED}>
              <Label>a token longer than the column, given nothing to break it</Label>
              <Space>
                <Container align="start" size="measure">
                  <Block>The column is this wide</Block>
                  <p style={{ ...PROSE, overflowWrap: 'normal' }}>
                    Kraftfahrzeughaftpflichtversicherungsbedingungen
                  </p>
                </Container>
              </Space>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};
