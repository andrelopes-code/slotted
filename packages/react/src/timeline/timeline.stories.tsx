import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard, FileText, Send } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '../collapsible';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Icon } from '../icon';
import { Link } from '../link';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Timeline } from './timeline';
import { TimelineDefaultsProvider } from './timeline-defaults';
import { TimelineGroup, TimelineItem, TimelineTime } from './timeline-parts';
import { REACT_TIMELINE_DOCS, REACT_TIMELINE_TOKENS } from './timeline.docs';
import type { TimelineItemProps, TimelineProps } from './timeline.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIMELINE_DOCS.timeline.scenes, {
    playground: Playground,
    feed: Feed,
    placement: Placement,
    orientation: Orientation,
    order: Order,
    statuses: Statuses,
    appearance: Appearance,
    groups: Groups,
    growing: Growing,
    fresh: Fresh,
    timestamps: Timestamps,
    content: Content,
    composition: Composition,
    empty: Empty,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Timeline',
        description:
          'An ordered list of events along a line, with machine time, actor, marker and actions — and, in feed mode, the APG Feed pattern.',
        framework: 'React',
        ...REACT_TIMELINE_DOCS.timeline,
        tokens: REACT_TIMELINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One moment, so the relative readings on the page never drift from the captions. */
const NOW = Date.UTC(2026, 8, 14, 15, 32);
const BRAZIL = { locale: 'pt-BR', now: NOW, timeZone: 'America/Sao_Paulo' } as const;

const SOLARIS = <Avatar name="Solaris Fretes" shape="square" size="xs" tone="secondary" />;
const ANA = <Avatar name="Ana Ribeiro" size="xs" tone="accent" />;

function Actor({ avatar, name }: { avatar: ReactNode; name: string }) {
  return (
    <>
      {avatar}
      {name}
    </>
  );
}

const INVOICE: readonly TimelineItemProps[] = [
  {
    actor: <Actor avatar={ANA} name="Anna Rivers" />,
    description: 'Draft INV-4821 for Solaris Freight, 12 lines.',
    time: '2026-09-08T12:12:00Z',
    title: 'Invoice created',
  },
  {
    description: 'To billing@solarisfreight.example, with the PDF attached.',
    marker: (
      <Icon>
        <Send aria-hidden="true" focusable="false" />
      </Icon>
    ),
    time: '2026-09-08T12:15:00Z',
    title: 'Sent to the customer',
  },
  {
    actions: (
      <>
        <Button size="sm" variant="outline">
          Retry payment
        </Button>
        <Button size="sm" tone="secondary" variant="ghost">
          Contact customer
        </Button>
      </>
    ),
    description: 'Card ending in 4421 declined by the issuer.',
    marker: (
      <Icon>
        <CreditCard aria-hidden="true" focusable="false" />
      </Icon>
    ),
    time: '2026-09-11T11:30:00Z',
    title: 'Payment failed',
    tone: 'danger',
  },
  {
    actor: <Actor avatar={SOLARIS} name="Solaris Freight" />,
    current: true,
    description: '$18,240.00 by bank transfer.',
    time: '2026-09-14T13:32:00Z',
    title: 'Paid',
    tone: 'success',
  },
];

function Invoice({
  events = INVOICE,
  ...props
}: Partial<TimelineProps> & { events?: readonly TimelineItemProps[] }) {
  return (
    <Timeline label="Invoice activity" {...BRAZIL} {...props}>
      {events.map((event, index) => (
        <TimelineItem key={index} {...event} />
      ))}
    </Timeline>
  );
}

const TRACKING: readonly TimelineItemProps[] = [
  { time: '2026-09-12T19:40:00Z', title: 'Order confirmed' },
  { time: '2026-09-13T12:05:00Z', title: 'Packed at the Seattle warehouse' },
  {
    current: true,
    description: 'Left the Portland hub on truck 118.',
    time: '2026-09-14T10:20:00Z',
    title: 'In transit',
  },
  { title: 'Out for delivery' },
  { description: 'Awaiting confirmation from the carrier.', loading: true, title: 'Delivered' },
];

function Tracking(props: Partial<TimelineProps>) {
  return (
    <Timeline autoComplete label="Rastreio da encomenda" tone="accent" {...BRAZIL} {...props}>
      {TRACKING.map((event, index) => (
        <TimelineItem key={index} {...event} />
      ))}
    </Timeline>
  );
}

export const Playground: Story = {
  args: {
    autoComplete: false,
    growing: 'none',
    mode: 'list',
    order: 'oldest-first',
    orientation: 'vertical',
    placement: 'end',
    size: 'md',
    timeFormat: 'absolute',
    tone: 'secondary',
    variant: 'outline',
  },
  argTypes: {
    growing: { control: 'radio', options: ['none', 'button', 'scroll'] },
    mode: { control: 'radio', options: ['list', 'feed'] },
    order: { control: 'radio', options: ['oldest-first', 'newest-first'] },
    orientation: { control: 'radio', options: ['vertical', 'horizontal'] },
    placement: { control: 'radio', options: ['end', 'start', 'alternate'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    timeFormat: { control: 'radio', options: ['absolute', 'relative'] },
    tone: {
      control: 'select',
      options: ['secondary', 'accent', 'info', 'success', 'warning', 'danger'],
    },
    variant: { control: 'radio', options: ['solid', 'outline', 'subtle', 'plain'] },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Invoice {...args} />
    </div>
  ),
};

function GrowingFeed() {
  const [events, setEvents] = useState(INVOICE);
  const [loading, setLoading] = useState(false);
  const load = () => {
    setLoading(true);
    window.setTimeout(() => {
      setEvents((current) => [
        ...current,
        { time: '2026-09-14T13:33:00Z', title: 'Receipt sent' },
        {
          description: 'By the customer, in the portal.',
          time: '2026-09-14T14:02:00Z',
          title: 'Receipt downloaded',
        },
      ]);
      setLoading(false);
    }, 900);
  };
  return (
    <Timeline
      count={12}
      growing="button"
      label="Atividade da conta"
      loading={loading}
      mode="feed"
      onLoadMore={load}
      order="newest-first"
      timeFormat="relative"
      {...BRAZIL}
    >
      {[...events].reverse().map((event, index) => (
        <TimelineItem key={index} {...event} current={false} />
      ))}
    </Timeline>
  );
}

export const Feed: Story = {
  parameters: scenario('feed'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='mode="feed" · growing="button" · count={12}'
        note="A div with role=feed and articles with tabindex, position and set size. Tab stops at each event; PageDown and PageUp jump between them; loading more appends at the end and the position of each article keeps counting."
      >
        <GrowingFeed />
      </Scene>
    </Grid>
  ),
};

const RELEASES = [
  {
    date: '2026-06-02T00:00:00Z',
    label: 'June 2026',
    description: 'Schedules, pauses and templates per customer.',
    title: '2.12 — Recurring invoices',
  },
  {
    date: '2026-07-20T00:00:00Z',
    label: 'July 2026',
    description: 'Invoices in the customer’s currency, settled in yours.',
    title: '2.13 — Multicurrency',
  },
  {
    date: '2026-09-14T00:00:00Z',
    label: 'September 2026',
    description: 'A declined card is retried on a schedule the customer can see.',
    title: '2.14 — New payment retries',
  },
];

function Releases(props: Partial<TimelineProps>) {
  return (
    <Timeline label="Release history" tone="accent" variant="solid" {...BRAZIL} {...props}>
      {RELEASES.map((release) => (
        <TimelineItem
          description={release.description}
          key={release.title}
          opposite={<TimelineTime value={release.date}>{release.label}</TimelineTime>}
          title={release.title}
        />
      ))}
    </Timeline>
  );
}

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='placement="end" with opposite'
        note="The time on the other side of the line, in a fixed-width column: the classic reading, with the titles aligned to each other."
      >
        <Releases />
      </Scene>
      <Scene
        label='placement="start"'
        note="The mirrored row: the body before the line and aligned to it, the opposite side after. In an RTL document it is the same line inverted, because the grid is logical."
      >
        <Invoice events={INVOICE.slice(0, 2)} placement="start" />
      </Scene>
      <Scene
        label='placement="alternate"'
        note="The line in the middle and the events taking turns. Shrink the stage below 480 px: alternate falls to one side and the date moves to the line above the body."
      >
        <Releases placement="alternate" />
      </Scene>
    </Grid>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='orientation="horizontal"'
        note="Equal columns, the line along the center of the markers, and scrolling on the inline axis when it does not fit. Below 480 px of its own width it goes back to being a column."
      >
        <Tracking orientation="horizontal" />
      </Scene>
      <Scene
        label='orientation="horizontal" reflow={false}'
        note="The same row without reflow: at any width it keeps scrolling sideways, which is what a consumer wants in a step bar."
      >
        <Tracking orientation="horizontal" reflow={false} />
      </Scene>
    </Grid>
  ),
};

export const Order: Story = {
  parameters: scenario('order'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label='order="oldest-first"'
        note="The past comes before the current one: the first two are completed and the line after the current one is dashed."
      >
        <Tracking />
      </Scene>
      <Scene
        label='order="newest-first"'
        note="The same array written backwards by the consumer. The past comes after the current one, and that is where autoComplete cuts; nothing was reordered."
      >
        <Timeline autoComplete label="Tracking" order="newest-first" tone="accent" {...BRAZIL}>
          {[...TRACKING].reverse().map((event, index) => (
            <TimelineItem key={index} {...event} />
          ))}
        </Timeline>
      </Scene>
    </Grid>
  ),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="complete · current · pending · loading"
        note="A filled disc with a check, a target, a ring with a dot and the spinner ring. In high contrast the four remain four shapes."
      >
        <Tracking />
      </Scene>
    </Grid>
  ),
};

const TONES = ['secondary', 'accent', 'info', 'success', 'warning', 'danger'] as const;

function Swatches({ variant }: { variant: 'solid' | 'outline' | 'subtle' | 'plain' }) {
  return (
    <Timeline label={`Variante ${variant}`} variant={variant} {...BRAZIL}>
      {TONES.map((tone) => (
        <TimelineItem key={tone} title={tone} tone={tone} />
      ))}
    </Timeline>
  );
}

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => (
    <>
      <Grid columns={2}>
        <Scene
          label='variant="outline"'
          note="The hollow ring, in the ink of the tone; the page background covers the line inside it."
        >
          <Swatches variant="outline" />
        </Scene>
        <Scene label='variant="solid"' note="Um disco cheio na tinta do tom.">
          <Swatches variant="solid" />
        </Scene>
        <Scene
          label='variant="subtle"'
          note="The default: a solid core on a soft disc of its own tone."
        >
          <Swatches variant="subtle" />
        </Scene>
        <Scene
          label='variant="plain"'
          note="Just the core, threaded on the line, for a row of commits or a log."
        >
          <Swatches variant="plain" />
        </Scene>
      </Grid>
      <Grid columns={1}>
        <Scene
          label='size="sm"'
          note="11 px dot and 12 px type, with the rhythm between events following along."
        >
          <Invoice events={INVOICE.slice(0, 2)} size="sm" />
        </Scene>
        <Scene
          label='size="md"'
          note="The default: 13 px dot, the size of the spinner, over the 13 px type of the medium control."
        >
          <Invoice events={INVOICE.slice(0, 2)} />
        </Scene>
        <Scene label='size="lg"' note="15 px dot and 14 px type; density restates all three.">
          <Invoice events={INVOICE.slice(0, 2)} size="lg" />
        </Scene>
      </Grid>
    </>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="collapsible · defaultOpen · level"
        note="Today open, last week closed, August with no trigger. The line breaks at each heading, and the closed list stays in the DOM."
      >
        <Timeline label="Invoice activity" level={3} timeFormat="relative" {...BRAZIL}>
          <TimelineGroup collapsible label="Today">
            <TimelineItem time="2026-09-14T13:32:00Z" title="Paid" tone="success" />
            <TimelineItem time="2026-09-14T13:33:00Z" title="Receipt sent" />
          </TimelineGroup>
          <TimelineGroup collapsible defaultOpen={false} label="Last week">
            <TimelineItem time="2026-09-11T11:30:00Z" title="Payment failed" tone="danger" />
            <TimelineItem time="2026-09-08T12:15:00Z" title="Sent to the customer" />
          </TimelineGroup>
          <TimelineGroup label="August">
            <TimelineItem time="2026-08-27T14:00:00Z" timeLabel="Aug 27" title="Customer added" />
            <TimelineItem
              time="2026-08-29T18:30:00Z"
              timeLabel="Aug 29"
              title="Price table agreed"
            />
          </TimelineGroup>
        </Timeline>
      </Scene>
    </Grid>
  ),
};

export const Growing: Story = {
  parameters: scenario('growing'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label='growing="button"'
        note="A button at the end of what is loaded; while loading, the ring and the message in the same place."
      >
        <Invoice events={INVOICE.slice(0, 2)} growing="button" onLoadMore={() => {}} />
      </Scene>
      <Scene
        label='growing="button" loading'
        note="The button gave way to the ring: the list is aria-busy and nothing can be requested twice."
      >
        <Invoice events={INVOICE.slice(0, 2)} growing="button" loading />
      </Scene>
    </Grid>
  ),
};

function Held() {
  const [held, setHeld] = useState(3);
  return (
    <Timeline
      freshCount={held}
      label="Atividade da conta"
      mode="feed"
      onReveal={() => setHeld(0)}
      order="newest-first"
      timeFormat="relative"
      {...BRAZIL}
    >
      {[...INVOICE].reverse().map((event, index) => (
        <TimelineItem key={index} {...event} current={false} />
      ))}
    </Timeline>
  );
}

export const Fresh: Story = {
  parameters: scenario('fresh'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="freshCount={3} · onReveal"
        note="Three events waiting behind the pill, announced once. Press it: the consumer merges them into the array and the count returns to zero."
      >
        <Held />
      </Scene>
    </Grid>
  ),
};

export const Timestamps: Story = {
  parameters: scenario('timestamps'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label='timeZone="America/Sao_Paulo" · "UTC" · wall value'
        note="The same instant 13:32Z written in two time zones, and a value without a zone written as is — never converted."
      >
        <Timeline label="Time zones" {...BRAZIL}>
          <TimelineItem
            description="America/Sao_Paulo"
            time="2026-09-14T13:32:00Z"
            title="Instante"
          />
          <TimelineItem
            description="Written as is: 10:32 is 10:32"
            time="2026-09-14T10:32"
            title="Wall value"
          />
        </Timeline>
        <Timeline label="Fusos" locale="pt-BR" timeZone="UTC">
          <TimelineItem description="UTC" time="2026-09-14T13:32:00Z" title="Instante" />
        </Timeline>
      </Scene>
      <Scene
        label='timeFormat="relative" · now'
        note="2 hours ago, 3 days ago, 6 days ago — and the absolute in title, on hover. now comes from the defaults, so the server and the client write the same thing."
      >
        <TimelineDefaultsProvider {...BRAZIL}>
          <Timeline label="Atividade" order="newest-first" timeFormat="relative">
            {[...INVOICE].reverse().map((event, index) => (
              <TimelineItem key={index} {...event} current={false} />
            ))}
          </Timeline>
        </TimelineDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="nine words · unbreakable token · Arabic · avatar in the marker · no title"
        note="The title wraps inside its column and the marker stays on the first line; the reference breaks anywhere; the Arabic reads from the right; the avatar fills the ring; the untitled event is labeled by the actor."
      >
        <Timeline label="Invoice activity" {...BRAZIL}>
          <TimelineItem
            description="Reference TRX-2026-09-10-000000000000000000000000000000000000000000000000000000000000-A"
            marker={ANA}
            time="2026-09-10T20:45:00Z"
            title="Approved the revised quote for the cross-border shipment program of Solaris Freight"
          />
          <TimelineItem
            description={
              <span dir="rtl" lang="ar">
                مع ملف PDF مرفق.
              </span>
            }
            time="2026-09-11T11:30:00Z"
            title={
              <span dir="rtl" lang="ar">
                تم إرسال الفاتورة إلى العميل
              </span>
            }
          />
          <TimelineItem
            actor={<Actor avatar={ANA} name="Anna Rivers" />}
            description="Added an untitled note."
            time="2026-09-12T13:00:00Z"
          />
        </Timeline>
      </Scene>
      <Scene
        label="360 px"
        note="The same list in a narrow column: the time drops to its own line and the title gets the full measure."
      >
        <Measure>
          <Invoice events={INVOICE.slice(2, 4)} />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Link in the title · Collapsible in the body · Button in the actions"
        note="Each part is a family that already exists: the title is a Link, the issuer’s reply is a Collapsible, the actions are Buttons. None of them is rewritten here."
      >
        <Timeline label="Invoice activity" mode="feed" {...BRAZIL}>
          <TimelineItem
            actions={
              <>
                <Button size="sm" variant="outline">
                  Retry payment
                </Button>
                <Button size="sm" tone="secondary" variant="ghost">
                  Contact customer
                </Button>
              </>
            }
            description="Card ending in 4421 declined by the issuer."
            marker={
              <Icon>
                <CreditCard aria-hidden="true" focusable="false" />
              </Icon>
            }
            time="2026-09-11T11:30:00Z"
            title={<Link href="#invoice-4821">Payment failed</Link>}
            tone="danger"
          >
            <Collapsible variant="plain">
              <CollapsibleHeader>
                <CollapsibleTrigger>Ver resposta do emissor</CollapsibleTrigger>
              </CollapsibleHeader>
              <CollapsiblePanel>
                Code 05: do not honor. Second attempt scheduled for September 18.
              </CollapsiblePanel>
            </Collapsible>
          </TimelineItem>
          <TimelineItem
            marker={
              <Icon>
                <FileText aria-hidden="true" focusable="false" />
              </Icon>
            }
            time="2026-09-12T13:00:00Z"
            title="Second notice sent"
            tone="warning"
          />
          <TimelineItem
            actor={<Actor avatar={SOLARIS} name="Solaris Fretes" />}
            current
            time="2026-09-14T13:32:00Z"
            title="Paga"
            tone="success"
          />
        </Timeline>
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="no items"
        note="The family message in place of the list, in the muted color, centered."
      >
        <Timeline label="Invoice activity" {...BRAZIL} />
      </Scene>
      <Scene
        label="empty={<ResultState />}"
        note="Whatever the consumer designs: a result-state with an action, because an empty list is a place to start."
      >
        <Timeline
          empty={
            <ResultState reach="inline" status="empty">
              <ResultStateContent>
                <ResultStateTitle>No events yet</ResultStateTitle>
                <ResultStateDescription>
                  The first invoice appears here as soon as it is created.
                </ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          }
          label="Invoice activity"
          {...BRAZIL}
        />
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="feed · Tab · PageDown · PageUp · Control+End · Control+Home"
        note="Focus the button before the feed and continue with Tab: each article is a stop with a ring. PageDown jumps to the next article even from a button inside it; Control+End lands on the button after the feed."
      >
        <div className="slotted-demo-row">
          <Button size="sm" variant="outline">
            Antes do feed
          </Button>
        </div>
        <Invoice mode="feed" />
        <div className="slotted-demo-row">
          <Button size="sm" variant="outline">
            Depois do feed
          </Button>
        </div>
      </Scene>
    </Grid>
  ),
};
