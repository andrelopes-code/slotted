import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Check, ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useId } from 'react';

import { Avatar } from '../avatar';
import { Button, IconButton } from '../button';
import { Inline } from '../inline';
import { Heading, Text } from '../typography';
import { VisuallyHidden } from '../visually-hidden';
import { Badge } from './badge';
import { BadgeAnchor } from './badge-anchor';
import { BadgeDefaultsProvider } from './badge-defaults';
import { REACT_BADGE_DOCS, REACT_BADGE_TOKENS } from './badge.docs';
import type { BadgePlacement, BadgeShape, BadgeSize, BadgeTone, BadgeVariant } from './badge.types';

const TONES: readonly BadgeTone[] = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS: readonly BadgeVariant[] = ['solid', 'soft', 'outline'];
const SIZES: readonly BadgeSize[] = ['sm', 'md', 'lg'];
const SHAPES: readonly BadgeShape[] = ['pill', 'square', 'dot'];
const PLACEMENTS: readonly BadgePlacement[] = [
  'top-end',
  'top-start',
  'bottom-end',
  'bottom-start',
];

/**
 * The artwork belongs to the consumer, and it is Lucide's: a character is never
 * an icon, and a story draws no artwork of its own.
 */
const CHECK = <Check aria-hidden="true" focusable="false" />;
const BELL = <Bell aria-hidden="true" focusable="false" />;
const CHEVRON = <ChevronDown aria-hidden="true" focusable="false" />;

const TABLE: CSSProperties = { borderCollapse: 'collapse', inlineSize: '100%', textAlign: 'start' };
const CELL: CSSProperties = { paddingBlock: 'var(--slotted-space-3)' };

/** A round host, so the circular overlap has something to sit on. */
const AVATAR: CSSProperties = {
  alignItems: 'center',
  background: 'var(--slotted-tone-accent-surface)',
  blockSize: '2.5rem',
  borderRadius: 'var(--slotted-radius-full)',
  color: 'var(--slotted-tone-accent-text)',
  display: 'inline-flex',
  fontWeight: 600,
  inlineSize: '2.5rem',
  justifyContent: 'center',
};

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Appearance as never,
});

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Badge',
        description:
          'A count, a status or a short piece of metadata — in the flow, or on the corner of something else.',
        framework: 'React',
        ...REACT_BADGE_DOCS.badge,
        tokens: REACT_BADGE_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: 'Pending', shape: 'pill', size: 'md', tone: 'warning', variant: 'soft' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-row">
        <Badge {...args} />
      </div>
    </div>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      {VARIANTS.map((variant) => (
        <section className="slotted-demo-scene" key={variant}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">{variant}</span>
            <span className="slotted-demo-scene__note">
              All three paint the same tone edge; only the ground changes.
            </span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              {TONES.map((tone) => (
                <Badge key={tone} tone={tone} variant={variant}>
                  {tone}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Three steps</span>
          <span className="slotted-demo-scene__note">
            The box is the badge’s own line box plus its inset, so no size can clip its type.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {SIZES.map((size) => (
              <Badge key={size} size={size} tone="success">
                Paid
              </Badge>
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">With a glyph</span>
          <span className="slotted-demo-scene__note">
            <code>start</code> and <code>end</code> put a glyph on either side of the words.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {SIZES.map((size) => (
              <Badge key={size} size={size} start={CHECK} tone="accent" variant="solid">
                Verified
              </Badge>
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Density</span>
          <span className="slotted-demo-scene__note">
            Type and glyph read the control scale, so a badge shrinks with the controls beside it.
            Change the density in the toolbar.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <Badge tone="secondary">Draft</Badge>
            <Badge count={8} tone="danger" variant="solid" />
            <Badge end={CHEVRON} tone="accent" variant="outline">
              Sort
            </Badge>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Pill, square, dot</span>
          <span className="slotted-demo-scene__note">
            A one-figure pill is as round as its own inset allows; a dot draws no value at all.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {SHAPES.map((shape) => (
              <Badge key={shape} shape={shape} tone="accent" variant="solid">
                {shape === 'dot' ? <VisuallyHidden>Live</VisuallyHidden> : '7'}
              </Badge>
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The words a dot cannot say</span>
          <span className="slotted-demo-scene__note">
            Colour alone is not a signal. The hidden text is out of flow, so it costs no space.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {(['info', 'success', 'warning', 'danger', 'secondary'] as const).map((tone) => (
              <Inline align="center" gap={3} key={tone}>
                <Badge shape="dot" tone={tone} variant={tone === 'secondary' ? 'outline' : 'solid'}>
                  <VisuallyHidden>{tone}</VisuallyHidden>
                </Badge>
                <Text>{tone === 'secondary' ? 'Queued' : 'Deployed'}</Text>
              </Inline>
            ))}
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Count: Story = {
  parameters: scenario('count'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The ceiling</span>
          <span className="slotted-demo-scene__note">
            Above <code>max</code> the badge shows the ceiling and a plus; <code>max=false</code>{' '}
            shows the real total.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {[1, 8, 42, 99, 140].map((count) => (
              <Badge count={count} key={count} tone="danger" variant="solid" />
            ))}
            <Badge count={140} max={999} tone="danger" variant="solid" />
            <Badge count={1234} max={false} tone="secondary" />
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Nought</span>
          <span className="slotted-demo-scene__note">
            A count of nought removes the badge entirely. <code>showZero</code> is for the screens
            where nought is a value.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <Inline align="center" gap={3}>
              <Badge count={0} tone="danger" variant="solid" />
              <Text>nothing rendered</Text>
            </Inline>
            <Inline align="center" gap={3}>
              <Badge count={0} showZero tone="secondary" />
              <Text>nought as a value</Text>
            </Inline>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The digits the locale writes</span>
          <span className="slotted-demo-scene__note">
            <code>Intl.NumberFormat</code>, not string interpolation.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            {(['en-US', 'de-DE', 'fr-FR', 'ar-EG'] as const).map((locale) => (
              <Inline align="center" gap={3} key={locale}>
                <Badge count={1234} locale={locale} max={false} tone="accent" />
                <Text size="sm" tone="muted">
                  {locale}
                </Text>
              </Inline>
            ))}
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Anchored: Story = {
  parameters: scenario('anchored'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Four corners</span>
          <span className="slotted-demo-scene__note">
            <code>placement</code> is logical, so every corner mirrors in a right-to-left document.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row" style={{ gap: 'var(--slotted-space-10)' }}>
            {PLACEMENTS.map((placement) => (
              <BadgeAnchor key={placement} placement={placement}>
                <Button tone="secondary" variant="outline">
                  {placement}
                </Button>
                <Badge count={4} size="sm" tone="danger" variant="solid">
                  <VisuallyHidden>unread messages</VisuallyHidden>
                </Badge>
              </BadgeAnchor>
            ))}
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A round host</span>
          <span className="slotted-demo-scene__note">
            <code>overlap=&quot;circle&quot;</code> moves the badge in from the corner far enough to
            meet the curve.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row" style={{ gap: 'var(--slotted-space-10)' }}>
            <BadgeAnchor overlap="circle" placement="bottom-end">
              <span aria-hidden="true" style={AVATAR}>
                AL
              </span>
              <Badge shape="dot" size="sm" tone="success" variant="solid">
                <VisuallyHidden>Online</VisuallyHidden>
              </Badge>
            </BadgeAnchor>
            <BadgeAnchor overlap="circle">
              <span aria-hidden="true" style={AVATAR}>
                AL
              </span>
              <Badge count={140} size="sm" tone="danger" variant="solid">
                <VisuallyHidden>unread messages</VisuallyHidden>
              </Badge>
            </BadgeAnchor>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A corner the page corrects</span>
          <span className="slotted-demo-scene__note">
            <code>offset</code> moves the badge off the computed corner, in pixels. <code>x</code>{' '}
            runs along the inline axis, so the correction mirrors with the document.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row" style={{ gap: 'var(--slotted-space-10)' }}>
            <BadgeAnchor offset={{ x: -2, y: 2 }} overlap="circle">
              <Avatar name="Ada Lovelace" size="lg" />
              <Badge shape="dot" size="sm" tone="success" variant="solid">
                <VisuallyHidden>Online</VisuallyHidden>
              </Badge>
            </BadgeAnchor>
            <BadgeAnchor offset={{ x: 0, y: 0 }}>
              <IconButton aria-label="Notifications" tone="secondary" variant="outline">
                {BELL}
              </IconButton>
              <Badge count={4} size="sm" tone="danger" variant="solid">
                <VisuallyHidden>unread messages</VisuallyHidden>
              </Badge>
            </BadgeAnchor>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">In a heading and in a row</span>
          <span className="slotted-demo-scene__note">
            A badge is phrasing content, so it is legal wherever text is.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <Inline align="center" gap={4}>
            <Heading level={3}>Invoice #4821</Heading>
            <Badge tone="warning">Pending</Badge>
          </Inline>
          <table style={TABLE}>
            <tbody>
              <tr>
                <td style={CELL}>Auth service</td>
                <td style={CELL}>
                  <Badge size="sm" tone="success">
                    Healthy
                  </Badge>
                </td>
              </tr>
              <tr>
                <td style={CELL}>Billing worker</td>
                <td style={CELL}>
                  <Badge size="sm" tone="danger">
                    Failing
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A badge that navigates</span>
          <span className="slotted-demo-scene__note">
            <code>render</code> substitutes the element. The family paints the focus ring and never
            paints hover: a badge is not a command.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <Badge
              render={(props) => <a {...props} href="#releases" />}
              tone="accent"
              variant="outline"
            >
              v4.2.0
            </Badge>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">One decision for the application</span>
          <span className="slotted-demo-scene__note">
            <code>BadgeDefaultsProvider</code>; an explicit prop still wins.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <BadgeDefaultsProvider locale="de-DE" max={9} size="sm" variant="solid">
            <div className="slotted-demo-row">
              <Badge tone="accent">Beta</Badge>
              <Badge count={40} tone="danger" />
              <Badge count={1234} max={false} tone="secondary" />
              <Badge size="lg" tone="success" variant="soft">
                Explicit wins
              </Badge>
            </div>
          </BadgeDefaultsProvider>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Extreme content</span>
          <span className="slotted-demo-scene__note">
            A badge is one line. Too long a string is clipped, not reflowed — the whole value stays
            in the DOM.
          </span>
        </header>
        <div className="slotted-demo-stage" style={{ maxInlineSize: '15rem' }}>
          <div className="slotted-demo-row">
            <Badge tone="secondary">Awaiting finance approval since 14 March</Badge>
            <Badge tone="danger" variant="outline">
              Kontostandsüberprüfungsverfahren
            </Badge>
          </div>
        </div>
      </section>
    </div>
  ),
};

function DescribedHost() {
  const id = useId();

  return (
    <BadgeAnchor>
      <Button aria-describedby={id} tone="secondary" variant="outline">
        Inbox
      </Button>
      <Badge count={4} id={id} size="sm" tone="danger" variant="solid">
        <VisuallyHidden>unread messages</VisuallyHidden>
      </Badge>
    </BadgeAnchor>
  );
}

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Naming the host</span>
          <span className="slotted-demo-scene__note">
            The frame does not rewrite its host. Wire <code>aria-describedby</code> to the badge’s
            own id, or put the count in the host’s <code>aria-label</code>.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row" style={{ gap: 'var(--slotted-space-10)' }}>
            <DescribedHost />
            <BadgeAnchor>
              <IconButton aria-label="Notifications, 12 new">{BELL}</IconButton>
              <Badge count={12} size="sm" tone="danger" variant="solid" />
            </BadgeAnchor>
          </div>
        </div>
      </section>
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">The announcement policy</span>
          <span className="slotted-demo-scene__note">
            <code>live</code> is <code>off</code> by default. <code>polite</code> writes{' '}
            <code>role=&quot;status&quot;</code>, <code>assertive</code> writes{' '}
            <code>role=&quot;alert&quot;</code>.
          </span>
        </header>
        <div className="slotted-demo-stage">
          <div className="slotted-demo-row">
            <Inline align="center" gap={3}>
              <Badge count={3} live="polite" tone="accent" variant="solid">
                <VisuallyHidden>items in the queue</VisuallyHidden>
              </Badge>
              <Text>polite</Text>
            </Inline>
            <Inline align="center" gap={3}>
              <Badge count={3} live="assertive" tone="danger" variant="solid">
                <VisuallyHidden>failed jobs</VisuallyHidden>
              </Badge>
              <Text>assertive</Text>
            </Inline>
          </div>
        </div>
      </section>
    </div>
  ),
};
