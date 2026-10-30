import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Badge, BadgeAnchor } from '../badge';
import { SlottedProvider } from '../i18n';
import { Heading, Text } from '../typography';
import { VisuallyHidden } from '../visually-hidden';
import { StatusIndicator } from './status-indicator';
import { StatusIndicatorDefaultsProvider } from './status-indicator-defaults';
import {
  REACT_STATUS_INDICATOR_DOCS,
  REACT_STATUS_INDICATOR_TOKENS,
} from './status-indicator.docs';
import type { StatusIndicatorSize, StatusIndicatorStatus } from './status-indicator.types';

const STATUSES: readonly { status: StatusIndicatorStatus; words: string }[] = [
  { status: 'neutral', words: 'Draft' },
  { status: 'info', words: 'Live' },
  { status: 'success', words: 'Healthy' },
  { status: 'warning', words: 'Degraded' },
  { status: 'danger', words: 'Failed' },
  { status: 'unknown', words: 'No data' },
];

const SIZES: readonly StatusIndicatorSize[] = ['sm', 'md', 'lg'];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_STATUS_INDICATOR_DOCS.statusIndicator.scenes, {
    playground: Playground,
    statuses: Statuses,
    marks: Marks,
    sizes: Sizes,
    pulse: Pulse,
    announcements: Announcements,
    context: Context,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Status Indicator',
        description:
          'The operational state of something the application observes: a mark, the word it stands for, and a name a reader always hears.',
        framework: 'React',
        ...REACT_STATUS_INDICATOR_DOCS.statusIndicator,
        tokens: REACT_STATUS_INDICATOR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: ReactNode;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** An indicator beside the words a screen reader reads out for it. */
function Heard({ children, says }: { children: ReactNode; says: string }) {
  return (
    <>
      <div>{children}</div>
      <Text size="sm" tone="muted">
        {says}
      </Text>
    </>
  );
}

/** A row of a service table: the name takes the room, the status takes the end. */
function Row({ children, service }: { children: ReactNode; service: string }) {
  return (
    <>
      <Text>{service}</Text>
      <div>{children}</div>
    </>
  );
}

export const Playground: Story = {
  args: {
    children: 'Healthy',
    live: 'off',
    mark: 'dot',
    pulse: false,
    size: 'md',
    status: 'success',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="prose">
      <Text>
        The checkout service is <StatusIndicator {...args} /> and has been since the deploy at
        09:14. A status is only ever as legible as the row it interrupts, which is why this one is
        written inside a sentence.
      </Text>
    </div>
  ),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The six, and what a product calls them"
        note="Each maps onto one of the library’s five tones. The words are the product’s; the tone and the glyph are the family’s."
      >
        <div className="slotted-demo-rows">
          {STATUSES.map(({ status, words }) => (
            <Row key={status} service={status}>
              <StatusIndicator status={status}>{words}</StatusIndicator>
            </Row>
          ))}
        </div>
      </Scene>
      <Scene
        label="The two that share a tone"
        note="neutral is filled and unknown is a dashed ring as wide as a lit dot, so “nothing is happening” and “nobody knows” are never told apart by colour alone."
      >
        <StatusIndicator status="neutral">Draft — nothing has started</StatusIndicator>
        <StatusIndicator status="unknown">No data — the agent stopped reporting</StatusIndicator>
        <StatusIndicator mark="icon" status="neutral">
          Draft — nothing has started
        </StatusIndicator>
        <StatusIndicator mark="icon" status="unknown">
          No data — the agent stopped reporting
        </StatusIndicator>
      </Scene>
    </div>
  ),
};

export const Marks: Story = {
  parameters: scenario('marks'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="dot"
        note="The compact mark: one cap tall, so it is the height of the letters beside it at every size and every density."
      >
        {STATUSES.map(({ status, words }) => (
          <StatusIndicator key={status} status={status}>
            {words}
          </StatusIndicator>
        ))}
      </Scene>
      <Scene
        label="icon"
        note="Six circles, the glyphs alert and toast draw for the same tones. The silhouette is what still separates the six when the colour is gone — in greyscale, in high contrast, and under forced colours."
      >
        {STATUSES.map(({ status, words }) => (
          <StatusIndicator key={status} mark="icon" status={status}>
            {words}
          </StatusIndicator>
        ))}
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The three steps"
        note="Type from the control type scale and glyph from the control glyph scale, so a status shrinks with the controls it sits among when density changes."
      >
        {SIZES.map((size) => (
          <StatusIndicator key={size} size={size} status="success">
            Healthy · {size}
          </StatusIndicator>
        ))}
        {SIZES.map((size) => (
          <StatusIndicator key={size} mark="icon" size={size} status="warning">
            Degraded · {size}
          </StatusIndicator>
        ))}
      </Scene>
      <Scene
        label="sm, which is what a table wants"
        note="The step a dense row is built for: the indicator takes the row’s own height rather than pushing it taller, and the mark still clears its contrast."
      >
        <div className="slotted-demo-rows">
          <Row service="checkout-api">
            <StatusIndicator size="sm" status="success">
              Healthy
            </StatusIndicator>
          </Row>
          <Row service="payments-worker">
            <StatusIndicator size="sm" status="warning">
              Degraded
            </StatusIndicator>
          </Row>
          <Row service="legacy-billing">
            <StatusIndicator size="sm" status="unknown">
              No data
            </StatusIndicator>
          </Row>
        </div>
      </Scene>
    </div>
  ),
};

export const Pulse: Story = {
  parameters: scenario('pulse'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A value moving while the reader watches"
        note="A wave leaves the dot and fades, then rests before the next beat. An icon mark does not pulse. It is an enhancement: the tone, the glyph and the word have already said what the status is."
      >
        <StatusIndicator pulse status="info">
          Deploying to production
        </StatusIndicator>
        <StatusIndicator pulse status="danger">
          Error rate climbing
        </StatusIndicator>
        <StatusIndicator pulse status="warning">
          Certificate expiring today
        </StatusIndicator>
      </Scene>
      <Scene
        label="What it is not for"
        note="A status that settled last week does not pulse. Motion that repeats forever and carries no news is the thing reduced motion exists to stop, and this family stops it either way."
      >
        <StatusIndicator status="success">Healthy since Tuesday</StatusIndicator>
        <StatusIndicator status="neutral">Draft, unchanged</StatusIndicator>
      </Scene>
    </div>
  ),
};

export const Announcements: Story = {
  parameters: scenario('announcements'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label='live="off"'
        note="The default, and the right answer for a status that was already on the page. Shoelace makes every badge a live region and announces text nobody changed."
      >
        <StatusIndicator status="success">Healthy</StatusIndicator>
        <Text size="sm" tone="muted">
          No role at all in the DOM
        </Text>
      </Scene>
      <Scene
        label='live="polite"'
        note='role="status": an implicit aria-atomic means the mark and its word are announced together, once, when the reader is next idle.'
      >
        <StatusIndicator live="polite" status="info">
          Deploying
        </StatusIndicator>
        <Text size="sm" tone="muted">
          role=&quot;status&quot; on the root
        </Text>
      </Scene>
      <Scene
        label='live="assertive"'
        note='role="alert", which interrupts whatever is being read. It belongs to something the reader has to act on now, and to nothing else.'
      >
        <StatusIndicator live="assertive" status="danger">
          Region offline
        </StatusIndicator>
        <Text size="sm" tone="muted">
          role=&quot;alert&quot; on the root
        </Text>
      </Scene>
    </div>
  ),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A column of services"
        note="The words take the page’s own colour and the tone stays on the mark, so the status column reads as easily as the column of names beside it."
      >
        <div className="slotted-demo-rows">
          <Row service="checkout-api">
            <StatusIndicator size="sm" status="success">
              Healthy
            </StatusIndicator>
          </Row>
          <Row service="payments-worker">
            <StatusIndicator size="sm" status="warning">
              Degraded
            </StatusIndicator>
          </Row>
          <Row service="search-index">
            <StatusIndicator detail="62% · 4 min left" pulse size="sm" status="info">
              Reindexing
            </StatusIndicator>
          </Row>
          <Row service="legacy-billing">
            <StatusIndicator size="sm" status="unknown">
              No data
            </StatusIndicator>
          </Row>
        </div>
      </Scene>
      <Scene
        label="On a surface the family did not choose"
        note="The mark brings its own tone and the words inherit, so an indicator on an inverse header keeps its meaning without a variant for it."
      >
        <div className="slotted-demo-surface" data-surface="inverse">
          <StatusIndicator mark="icon" status="success">
            All systems operational
          </StatusIndicator>
        </div>
        <div className="slotted-demo-surface" data-surface="sunken">
          <StatusIndicator mark="icon" status="danger">
            Two incidents open
          </StatusIndicator>
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="A status that is a sentence"
        note="It wraps rather than truncating, and the mark holds the first line’s cap. Half an instruction is wrong where a taller row is only taller."
      >
        <div className="slotted-demo-measure">
          <StatusIndicator mark="icon" status="warning">
            Waiting for approval from the security review board since Tuesday
          </StatusIndicator>
        </div>
      </Scene>
      <Scene
        label="A token with nothing to break on"
        note="A container digest has no space and no hyphen, so it breaks mid-string rather than widening the column past the viewport. Nothing is removed from the DOM."
      >
        <div className="slotted-demo-measure">
          <StatusIndicator status="danger">
            sha256:9f2b7c1de4a80b35c7f9a1e6d2408baf5c31
          </StatusIndicator>
        </div>
      </Scene>
      <Scene
        label="Another language, decided once"
        note="A catalog for the locale replaces the six fallback words, so a bare mark announces “Fehler” without a translation call at any call site."
      >
        <SlottedProvider
          catalogs={{
            'de-DE': {
              statusIndicator: { danger: 'Fehler', success: 'Erfolgreich', warning: 'Warnung' },
            },
          }}
          locale="de-DE"
        >
          <StatusIndicator status="danger" />
          <StatusIndicator status="success">Bereitstellung abgeschlossen</StatusIndicator>
          <StatusIndicator mark="icon" status="warning">
            Zertifikat läuft ab
          </StatusIndicator>
        </SlottedProvider>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="One decision for the application"
        note="The provider sets the mark, the size, the announcing and the wording once. An indicator that states any of them still wins over it."
      >
        <StatusIndicatorDefaultsProvider mark="icon" size="sm">
          <StatusIndicator status="success">Healthy</StatusIndicator>
          <StatusIndicator mark="dot" status="success">
            Healthy, stated
          </StatusIndicator>
        </StatusIndicatorDefaultsProvider>
      </Scene>
      <Scene
        label="Another element"
        note="render substitutes what is rendered and hands it every part, so a status can be the link to the build it reports without losing its mark or its name."
      >
        <StatusIndicator render={(props) => <a href="#build-4821" {...props} />} status="danger">
          Build 4821 failed
        </StatusIndicator>
        <StatusIndicator render={(props) => <output {...props} />} status="info">
          Deploy queued
        </StatusIndicator>
      </Scene>
      <Scene
        label="A mark on a corner belongs to badge"
        note="Placing a mark on the corner of something else is badge’s anchor, and two families answering that would be two answers. The cost: a corner mark cannot carry this family’s glyph."
      >
        <BadgeAnchor overlap="circle">
          <Avatar name="Ada Lovelace" />
          <Badge shape="dot" tone="success">
            <VisuallyHidden>Online</VisuallyHidden>
          </Badge>
        </BadgeAnchor>
        <StatusIndicator size="sm" status="success">
          Ada Lovelace is online
        </StatusIndicator>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A mark with no words still has one"
        note="Each of these announces a word that is in the document and clipped from view, so it is read, found by a page search, and available to an aria-labelledby elsewhere."
      >
        <div className="slotted-demo-rows">
          <Heard says="“Success”, from the family’s own table">
            <StatusIndicator status="success" />
          </Heard>
          <Heard says="“Unknown”, in the same six words">
            <StatusIndicator status="unknown" />
          </Heard>
          <Heard says="“Deploy failed”, from the application">
            <StatusIndicator label="Deploy failed" status="danger" />
          </Heard>
          <Heard says="“Build 4821 failed”, from the words on the page">
            <StatusIndicator status="danger">Build 4821 failed</StatusIndicator>
          </Heard>
        </div>
      </Scene>
      <Scene
        label="Colour is never the only carrier"
        layout="prose"
        note="Every indicator has words. Where a product cannot show them, the icon mark gives each status a silhouette of its own — which is what survives the reader’s own high-contrast mode."
      >
        <Heading level={3}>Two ways to say the same six things</Heading>
        <Text>
          A dot beside its own word, or a glyph that keeps its meaning with the colour switched off.
          The dot is lit with a halo of its own colour, and the glyph set is six circles, so no two
          statuses are told apart by colour alone.
        </Text>
        <div className="slotted-demo-row">
          <StatusIndicator mark="icon" status="success">
            Healthy
          </StatusIndicator>
          <StatusIndicator mark="icon" status="warning">
            Degraded
          </StatusIndicator>
          <StatusIndicator mark="icon" status="danger">
            Failed
          </StatusIndicator>
        </div>
      </Scene>
    </div>
  ),
};
