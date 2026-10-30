import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';

import { Heading, Text } from '../typography';
import { Card } from './card';
import { CardActions } from './card-actions';
import { CardLink } from './card-link';
import { CardBody } from './card-body';
import { CardFooter } from './card-footer';
import { CardHeader } from './card-header';
import { CardSelection } from './card-selection';
import { CardMedia } from './card-media';
import { REACT_CARD_DOCS, REACT_CARD_TOKENS } from './card.docs';

/**
 * Button is still being rebuilt, so the reference page uses the platform
 * control rather than coupling Card's page to a family that is about to
 * change. What Card has to demonstrate is the surface around a control, not
 * the control.
 */
const CONTROL: CSSProperties = {
  background: 'var(--slotted-surface)',
  blockSize: 'var(--slotted-control-height-sm)',
  border: 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  borderRadius: 'var(--slotted-control-radius)',
  color: 'inherit',
  font: 'inherit',
  fontSize: 'var(--slotted-control-font-size-sm)',
  fontWeight: 'var(--slotted-control-font-weight)',
  paddingInline: 'var(--slotted-control-padding-inline-sm)',
};

const BADGE: CSSProperties = {
  background: 'var(--slotted-tone-warning-surface)',
  borderRadius: 'var(--slotted-radius-full)',
  color: 'var(--slotted-tone-warning-text)',
  fontSize: 'var(--slotted-font-size-xs)',
  fontWeight: 'var(--slotted-font-weight-medium)',
  paddingBlock: 'var(--slotted-space-1)',
  paddingInline: 'var(--slotted-space-4)',
};

const RULE: CSSProperties = {
  blockSize: 0,
  border: 0,
  borderBlockStart: 'var(--slotted-border-width-thin) solid var(--slotted-border-subtle)',
  margin: 0,
};

const COVER = (from: string, to: string) =>
  `linear-gradient(135deg, ${from}, ${to})` satisfies CSSProperties['background'];

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Anatomy as never,
});

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Card',
        description:
          'A bounded surface that groups one subject, with a media, a header, a body and a footer that are all optional.',
        framework: 'React',
        ...REACT_CARD_DOCS.card,
        tokens: REACT_CARD_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { disabled: false, fill: 'outline', orientation: 'vertical', selected: false, size: 'md' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-measure">
      <Card {...args}>
        <CardMedia>
          <div style={{ background: COVER('#4f46e5', '#06b6d4'), blockSize: '7rem' }} />
        </CardMedia>
        <CardHeader>
          <Heading level={3} size="xl">
            Northwind billing
          </Heading>
          <Text size="sm" tone="muted">
            Invoices, payment methods and the address they are issued to.
          </Text>
          <CardActions>
            <span style={BADGE}>Overdue</span>
          </CardActions>
        </CardHeader>
        <CardBody>
          <Text>
            The next invoice settles on the first working day of October against the card ending
            4417.
          </Text>
        </CardBody>
        <CardFooter>
          <button style={CONTROL} type="button">
            Pay now
          </button>
          <button style={CONTROL} type="button">
            Download
          </button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Every region</span>
          <span className="slotted-demo-scene__note">Media, header, body, footer.</span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardMedia>
              <div style={{ background: COVER('#4f46e5', '#06b6d4'), blockSize: '5rem' }} />
            </CardMedia>
            <CardHeader>
              <Heading level={3} size="lg">
                Northwind
              </Heading>
              <Text size="sm" tone="muted">
                Twelve open invoices
              </Text>
            </CardHeader>
            <CardBody>
              <Text>Settling on the first working day of October.</Text>
            </CardBody>
            <CardFooter>
              <Text size="xs" tone="muted">
                Updated 12 minutes ago
              </Text>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A body alone</span>
          <span className="slotted-demo-scene__note">
            The same inset as a full card, not a tighter one.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardBody>
              <Text>A region at either end absorbs the padding its neighbour would carry.</Text>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Header and footer</span>
          <span className="slotted-demo-scene__note">A missing body leaves no gap behind.</span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardHeader>
              <Heading level={3} size="lg">
                Storage
              </Heading>
            </CardHeader>
            <CardFooter>
              <Text size="xs" tone="muted">
                84 GB of 200 GB
              </Text>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  ),
};

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(
        [
          ['outline', 'sm', 'A hairline edge and the tightest inset.'],
          ['elevated', 'md', 'The same edge, plus the smallest step of the shadow scale.'],
          ['subtle', 'lg', 'A filled surface that recedes into the page.'],
        ] as const
      ).map(([fill, size, note]) => (
        <section className="slotted-demo-scene" key={fill}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {fill} · {size}
            </span>
            <span className="slotted-demo-scene__note">{note}</span>
          </header>
          <div className="slotted-demo-stage" data-align="start">
            <Card fill={fill} size={size}>
              <CardHeader>
                <Heading level={3} size="md">
                  {fill}
                </Heading>
              </CardHeader>
              <CardBody>
                <Text>{note}</Text>
              </CardBody>
            </Card>
          </div>
        </section>
      ))}
      <section className="slotted-demo-scene" data-span="full">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A rule between two regions</span>
          <span className="slotted-demo-scene__note">
            Composition, not an axis: a Divider written between two regions runs edge to edge
            because each region owns its own inset, and <code>inset</code> on the rule lines it up
            with the text instead.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardHeader>
              <Heading level={3} size="lg">
                Review pictures
              </Heading>
              <CardActions>
                <span style={BADGE}>200 new</span>
              </CardActions>
            </CardHeader>
            <hr style={RULE} />
            <CardBody>
              <Text>Two hundred images have been uploaded since the last visit.</Text>
            </CardBody>
            <hr style={{ ...RULE, marginInline: 'var(--slotted-control-padding-inline-md)' }} />
            <CardFooter>
              <Text size="xs" tone="muted">
                The second rule is inset.
              </Text>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene" data-span="full">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Horizontal</span>
          <span className="slotted-demo-scene__note">
            The media keeps the first column while the card is wide enough. Narrow the window: below
            24rem of card width it returns to the top, because the card answers its own inline size
            rather than the viewport.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card orientation="horizontal">
            <CardMedia>
              <div style={{ background: COVER('#f59e0b', '#ec4899'), blockSize: '100%' }} />
            </CardMedia>
            <CardHeader>
              <Heading level={3} size="lg">
                Quarterly report
              </Heading>
              <Text size="sm" tone="muted">
                PDF · 2.4 MB
              </Text>
            </CardHeader>
            <CardBody>
              <Text>Revenue, retention and the two accounts that moved them.</Text>
            </CardBody>
            <CardFooter>
              <Text size="xs" tone="muted">
                Shared with four people
              </Text>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  ),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">One destination</span>
          <span className="slotted-demo-scene__note">
            Hover and tab into it: the whole surface responds, and the link is named
            &ldquo;Northwind Traders&rdquo; rather than by every string in the card.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardHeader>
              <CardLink href="#northwind" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Heading level={3} size="lg">
                  Northwind Traders
                </Heading>
              </CardLink>
              <Text size="sm" tone="muted">
                Twelve open invoices
              </Text>
            </CardHeader>
            <CardBody>
              <Text>The footer sits above the stretched hit area.</Text>
            </CardBody>
            <CardFooter>
              <a href="#settings">Billing settings</a>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">A choice</span>
          <span className="slotted-demo-scene__note">
            The card is the label, so the whole surface is the target. CardSelection keeps the
            column; the control announces the state the card paints.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <form className="slotted-demo-stack">
            <Card render={(props) => <label {...props} />}>
              <CardHeader>
                <CardSelection>
                  <input name="plan" type="radio" value="starter" />
                </CardSelection>
                <Heading level={3} size="lg">
                  Starter
                </Heading>
                <Text size="sm" tone="muted">
                  Two seats, no shared billing
                </Text>
              </CardHeader>
            </Card>
            <Card render={(props) => <label {...props} />} selected>
              <CardHeader>
                <CardSelection>
                  <input defaultChecked name="plan" type="radio" value="team" />
                </CardSelection>
                <Heading level={3} size="lg">
                  Team
                </Heading>
                <Text size="sm" tone="muted">
                  Twenty seats, shared billing and audit history
                </Text>
              </CardHeader>
            </Card>
            <Card disabled render={(props) => <label {...props} />}>
              <CardHeader>
                <CardSelection>
                  <input disabled name="plan" type="radio" value="enterprise" />
                </CardSelection>
                <Heading level={3} size="lg">
                  Enterprise
                </Heading>
                <Text size="sm">Not available on this account</Text>
              </CardHeader>
            </Card>
            <Card fill="subtle" render={(props) => <label {...props} />}>
              <CardHeader>
                <CardSelection>
                  <input name="audit" type="checkbox" value="audit" />
                </CardSelection>
                <Heading level={3} size="lg">
                  Audit history
                </Heading>
                <Text size="sm" tone="muted">
                  Kept for seven years
                </Text>
              </CardHeader>
            </Card>
          </form>
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
          <span className="slotted-demo-scene__label">An article</span>
          <span className="slotted-demo-scene__note">
            The page says what the card is; the family only says how it is bounded.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card render={(props) => <article {...props} aria-labelledby="card-post" />}>
            <CardHeader>
              <Heading id="card-post" level={3} size="lg">
                Shipping the rebuild
              </Heading>
              <Text size="sm" tone="muted">
                1 September 2026
              </Text>
            </CardHeader>
            <CardBody>
              <Text>
                Every family now reads the same surface, the same inset and the same edge.
              </Text>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="slotted-demo-scene">
        <header className="slotted-demo-scene__header">
          <span className="slotted-demo-scene__label">Content the card did not choose</span>
          <span className="slotted-demo-scene__note">
            An unbroken name, a long body and more actions than fit on one line.
          </span>
        </header>
        <div className="slotted-demo-stage" data-align="start">
          <Card>
            <CardHeader>
              <Heading level={3} size="lg" style={{ overflowWrap: 'anywhere' }}>
                contoso-manufacturing-emea-consolidated-settlement
              </Heading>
            </CardHeader>
            <CardBody>
              <Text>
                Payment terms run to thirty days from the issue date, and a disputed line is held
                out of the settlement until it is resolved.
              </Text>
            </CardBody>
            <CardFooter>
              <button style={CONTROL} type="button">
                Approve
              </button>
              <button style={CONTROL} type="button">
                Dispute
              </button>
              <button style={CONTROL} type="button">
                Share with the finance team
              </button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  ),
};
