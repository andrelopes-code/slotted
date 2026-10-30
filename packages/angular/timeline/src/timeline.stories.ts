import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCreditCard, lucideFileText, lucideSend } from '@ng-icons/lucide';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import {
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
} from '@slotted/angular/collapsible';
import { SlIcon } from '@slotted/angular/icon';
import { SlLink } from '@slotted/angular/link';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlTimeline,
  SlTimelineActions,
  SlTimelineActor,
  SlTimelineDescription,
  SlTimelineEmpty,
  SlTimelineGroup,
  SlTimelineGroupList,
  SlTimelineItem,
  SlTimelineList,
  SlTimelineMarker,
  SlTimelineOpposite,
  SlTimelineTime,
  SlTimelineTitle,
} from './timeline';
import type {
  TimelineGrowing,
  TimelineMode,
  TimelineOrder,
  TimelineOrientation,
  TimelinePlacement,
  TimelineSize,
  TimelineTimeFormat,
  TimelineTone,
  TimelineVariant,
} from './timeline.constants';
import { provideTimelineDefaults } from './timeline.constants';
import { ANGULAR_TIMELINE_DOCS, ANGULAR_TIMELINE_TOKENS } from './timeline.docs';

interface TimelineStoryArgs {
  autoComplete: boolean;
  growing: TimelineGrowing;
  mode: TimelineMode;
  order: TimelineOrder;
  orientation: TimelineOrientation;
  placement: TimelinePlacement;
  size: TimelineSize;
  timeFormat: TimelineTimeFormat;
  tone: TimelineTone;
  variant: TimelineVariant;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TIMELINE_DOCS.timeline.scenes, {
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

const IMPORTS = [
  NgIcon,
  SlAvatar,
  SlButton,
  SlCollapsible,
  SlCollapsibleHeader,
  SlCollapsiblePanel,
  SlCollapsibleTrigger,
  SlIcon,
  SlLink,
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
  SlTimeline,
  SlTimelineActions,
  SlTimelineActor,
  SlTimelineDescription,
  SlTimelineEmpty,
  SlTimelineGroup,
  SlTimelineGroupList,
  SlTimelineItem,
  SlTimelineList,
  SlTimelineMarker,
  SlTimelineOpposite,
  SlTimelineTime,
  SlTimelineTitle,
];

/** One moment, so the relative readings on the page never drift from the captions. */
const NOW = Date.UTC(2026, 8, 14, 15, 32);

const meta: Meta<TimelineStoryArgs> = {
  title: 'Components/Timeline',
  component: SlTimeline,
  decorators: [
    moduleMetadata({
      imports: IMPORTS,
      providers: [
        provideIcons({ lucideCreditCard, lucideFileText, lucideSend }),
        provideTimelineDefaults({ now: NOW, timeZone: 'America/Sao_Paulo' }),
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Timeline',
        description:
          'An ordered list of events along a line, with machine time, actor, marker and actions — and, in feed mode, the APG Feed pattern.',
        framework: 'Angular',
        ...ANGULAR_TIMELINE_DOCS.timeline,
        tokens: ANGULAR_TIMELINE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<TimelineStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out.
 */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const glyph = (name: string) =>
  `<span slIcon slTimelineMarker><ng-icon aria-hidden="true" name="${name}"></ng-icon></span>`;
const ANA = `<span slAvatar name="Ana Ribeiro" size="xs" tone="accent"></span>`;
const SOLARIS = `<span slAvatar name="Solaris Fretes" shape="square" size="xs" tone="secondary"></span>`;

/** The invoice every scene that does not need its own events is drawn from. */
const invoice = (item: 'li' | 'article' = 'li', current = true) => `
  <${item} slTimelineItem time="2026-09-08T12:12:00Z" title="Invoice created" description="Draft INV-4821 for Solaris Freight, 12 lines.">
    <div slTimelineActor>${ANA} Anna Rivers</div>
  </${item}>
  <${item} slTimelineItem time="2026-09-08T12:15:00Z" title="Sent to the customer" description="To billing@solarisfreight.example, with the PDF attached.">
    ${glyph('lucideSend')}
  </${item}>
  <${item} slTimelineItem time="2026-09-11T11:30:00Z" title="Payment failed" description="Card ending in 4421 declined by the issuer." tone="danger">
    ${glyph('lucideCreditCard')}
    <div slTimelineActions>
      <button slButton size="sm" variant="outline" type="button">Retry payment</button>
      <button slButton size="sm" tone="secondary" variant="ghost" type="button">Contact customer</button>
    </div>
  </${item}>
  <${item} slTimelineItem time="2026-09-14T13:32:00Z" title="Paid" description="$18,240.00 by bank transfer." tone="success" ${current ? 'current' : ''}>
    <div slTimelineActor>${SOLARIS} Solaris Freight</div>
  </${item}>`;

const FIRST_TWO = `
  <li slTimelineItem time="2026-09-08T12:12:00Z" title="Invoice created" description="Draft INV-4821 for Solaris Freight, 12 lines.">
    <div slTimelineActor>${ANA} Anna Rivers</div>
  </li>
  <li slTimelineItem time="2026-09-08T12:15:00Z" title="Sent to the customer" description="To billing@solarisfreight.example, with the PDF attached.">
    ${glyph('lucideSend')}
  </li>`;

const LAST_TWO = `
  <li slTimelineItem time="2026-09-11T11:30:00Z" title="Payment failed" description="Card ending in 4421 declined by the issuer." tone="danger">
    ${glyph('lucideCreditCard')}
    <div slTimelineActions>
      <button slButton size="sm" variant="outline" type="button">Retry payment</button>
      <button slButton size="sm" tone="secondary" variant="ghost" type="button">Contact customer</button>
    </div>
  </li>
  <li slTimelineItem time="2026-09-14T13:32:00Z" title="Paid" description="$18,240.00 by bank transfer." tone="success" current>
    <div slTimelineActor>${SOLARIS} Solaris Freight</div>
  </li>`;

const NEWEST_FIRST = `
  <article slTimelineItem time="2026-09-14T13:32:00Z" title="Paid" description="$18,240.00 by bank transfer." tone="success">
    <div slTimelineActor>${SOLARIS} Solaris Freight</div>
  </article>
  <article slTimelineItem time="2026-09-11T11:30:00Z" title="Payment failed" description="Card ending in 4421 declined by the issuer." tone="danger">
    ${glyph('lucideCreditCard')}
  </article>
  <article slTimelineItem time="2026-09-08T12:15:00Z" title="Sent to the customer">${glyph('lucideSend')}</article>
  <article slTimelineItem time="2026-09-08T12:12:00Z" title="Invoice created">
    <div slTimelineActor>${ANA} Anna Rivers</div>
  </article>`;

const TRACKING = `
  <li slTimelineItem time="2026-09-12T19:40:00Z" title="Order confirmed"></li>
  <li slTimelineItem time="2026-09-13T12:05:00Z" title="Packed at the Seattle warehouse"></li>
  <li slTimelineItem time="2026-09-14T10:20:00Z" title="In transit" description="Left the Tacoma hub on truck 118." current></li>
  <li slTimelineItem title="Out for delivery"></li>
  <li slTimelineItem title="Delivered" description="Awaiting carrier confirmation." loading></li>`;

const tracking = (attributes = '') =>
  `<div slTimeline label="Rastreio da encomenda" tone="accent" autoComplete ${attributes}><ol slTimelineList>${TRACKING}</ol></div>`;

const RELEASES = [
  [
    '2026-06-02T00:00:00Z',
    'June 2026',
    '2.12 — Recurring invoices',
    'Schedules, pauses and templates per customer.',
  ],
  [
    '2026-07-20T00:00:00Z',
    'July 2026',
    '2.13 — Multicurrency',
    'Invoices in the customer’s currency, settled in yours.',
  ],
  [
    '2026-09-14T00:00:00Z',
    'September 2026',
    '2.14 — Payment retries',
    'A declined card is retried on a schedule the customer can see.',
  ],
] as const;

const releases = (attributes = '') =>
  `<div slTimeline label="Release history" tone="accent" variant="solid" ${attributes}><ol slTimelineList>${RELEASES.map(
    ([value, label, title, description]) =>
      `<li slTimelineItem title="${title}" description="${description}"><div slTimelineOpposite><time slTimelineTime value="${value}">${label}</time></div></li>`,
  ).join('')}</ol></div>`;

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
  render: (args) => ({
    props: args,
    template: `
<div class="slotted-demo-stage" data-layout="block">
  <div
    slTimeline
    label="Invoice activity"
    [autoComplete]="autoComplete"
    [growing]="growing"
    [mode]="mode"
    [order]="order"
    [orientation]="orientation"
    [placement]="placement"
    [size]="size"
    [timeFormat]="timeFormat"
    [tone]="tone"
    [variant]="variant"
  >
    @if (mode === 'feed') {
      <div slTimelineList>${invoice('article')}</div>
    } @else {
      <ol slTimelineList>${invoice()}</ol>
    }
  </div>
</div>`,
  }),
};

export const Feed: Story = {
  parameters: scenario('feed'),
  render: () => ({
    props: {
      loading: false,
      more: [] as { time: string; title: string; description?: string }[],
      load(this: {
        loading: boolean;
        more: { time: string; title: string; description?: string }[];
      }) {
        this.loading = true;
        window.setTimeout(() => {
          this.more = [
            { time: '2026-09-14T13:33:00Z', title: 'Receipt sent' },
            {
              description: 'By the customer, in the portal.',
              time: '2026-09-14T14:02:00Z',
              title: 'Receipt downloaded',
            },
          ];
          this.loading = false;
        }, 900);
      },
    },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'mode="feed" · growing="button" · [count]="12"',
    'A div with role=feed and articles with tabindex, position and set size. Tab stops at each event; PageDown and PageUp jump between them; loading more appends to the end and the position of each article keeps counting.',
    `<div slTimeline label="Account activity" mode="feed" growing="button" order="newest-first" timeFormat="relative" [count]="12" [loading]="loading" (loadMoreRequest)="load()">
      <div slTimelineList>
        ${NEWEST_FIRST}
        @for (event of more; track event.title) {
          <article slTimelineItem [time]="event.time" [title]="event.title" [description]="event.description"></article>
        }
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'placement="end" with [slTimelineOpposite]',
    'The time on the other side of the line, in a fixed-width column: the classic reading, with the titles aligned to each other.',
    releases(),
  )}
  ${scene(
    'placement="start"',
    'The mirrored row: the body before the line and aligned to it, the opposite side after. In an RTL document it is the same line inverted, because the grid is logical.',
    `<div slTimeline label="Invoice activity" placement="start"><ol slTimelineList>${FIRST_TWO}</ol></div>`,
  )}
  ${scene(
    'placement="alternate"',
    'The line in the middle and the events taking turns. Shrink the stage below 480 px: alternate falls back to one side and the date moves to the line above the body.',
    releases('placement="alternate"'),
  )}
</div>`,
  }),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'orientation="horizontal"',
    'Equal columns, the line along the center of the markers, and scrolling on the inline axis when it does not fit. Below 480 px of its own width it becomes a column again.',
    tracking('orientation="horizontal"'),
  )}
  ${scene(
    'orientation="horizontal" [reflow]="false"',
    'The same row without reflow: at any width it keeps scrolling sideways, which is what a consumer wants in a step bar.',
    tracking('orientation="horizontal" [reflow]="false"'),
  )}
</div>`,
  }),
};

export const Order: Story = {
  parameters: scenario('order'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene(
    'order="oldest-first"',
    'The past comes before the current: the first two are completed and the line after the current one is dashed.',
    tracking(),
  )}
  ${scene(
    'order="newest-first"',
    'The same array written in reverse by the consumer. The past comes after the current, and that is where autoComplete cuts; nothing was reordered.',
    `<div slTimeline label="Tracking" tone="accent" autoComplete order="newest-first"><ol slTimelineList>
      <li slTimelineItem title="Delivered" description="Awaiting carrier confirmation." loading></li>
      <li slTimelineItem title="Out for delivery"></li>
      <li slTimelineItem time="2026-09-14T10:20:00Z" title="In transit" current></li>
      <li slTimelineItem time="2026-09-13T12:05:00Z" title="Packed at the Seattle warehouse"></li>
      <li slTimelineItem time="2026-09-12T19:40:00Z" title="Order confirmed"></li>
    </ol></div>`,
  )}
</div>`,
  }),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'complete · current · pending · loading',
    'A filled disc with a check, a target, a ring with a dot and the spinner ring. In high contrast the four remain four shapes.',
    tracking(),
  )}
</div>`,
  }),
};

const TONES = ['secondary', 'accent', 'info', 'success', 'warning', 'danger'];
const swatches = (variant: string) =>
  `<div slTimeline label="Variante ${variant}" variant="${variant}"><ol slTimelineList>${TONES.map(
    (tone) => `<li slTimelineItem title="${tone}" tone="${tone}"></li>`,
  ).join('')}</ol></div>`;
const twoEvents = (attributes: string) =>
  `<div slTimeline label="Invoice activity" ${attributes}><ol slTimelineList>${FIRST_TWO}</ol></div>`;

export const Appearance: Story = {
  parameters: scenario('appearance'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene('variant="outline"', 'The hollow ring, in the tone’s ink; the page background covers the line inside it.', swatches('outline'))}
  ${scene('variant="solid"', 'A filled disc in the tone’s ink.', swatches('solid'))}
  ${scene('variant="subtle"', 'The default: a solid core in a soft disc of the tone itself.', swatches('subtle'))}
  ${scene('variant="plain"', 'Only the core, threaded on the line, for a row of commits or a log.', swatches('plain'))}
</div>
<div class="slotted-demo-grid" data-columns="1">
  ${scene('size="sm"', 'Dot of 11 px and type of 12 px, with the rhythm between events following.', twoEvents('size="sm"'))}
  ${scene('size="md"', 'The default: dot of 13 px, the size of the spinner, over the 13 px type of the medium control.', twoEvents(''))}
  ${scene('size="lg"', 'Dot of 15 px and type of 14 px; density restates all three.', twoEvents('size="lg"'))}
</div>`,
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'collapsible · [defaultOpen] · [level]',
    'Today open, last week closed, August without a trigger. The line breaks at each heading, and the closed list stays in the DOM.',
    `<div slTimeline label="Invoice activity" [level]="3" timeFormat="relative">
      <ol slTimelineList>
        <li slTimelineGroup label="Today" collapsible>
          <ol slTimelineGroupList>
            <li slTimelineItem time="2026-09-14T13:32:00Z" title="Paid" tone="success"></li>
            <li slTimelineItem time="2026-09-14T13:33:00Z" title="Receipt sent"></li>
          </ol>
        </li>
        <li slTimelineGroup label="Last week" collapsible [defaultOpen]="false">
          <ol slTimelineGroupList>
            <li slTimelineItem time="2026-09-11T11:30:00Z" title="Payment failed" tone="danger"></li>
            <li slTimelineItem time="2026-09-08T12:15:00Z" title="Sent to the customer"></li>
          </ol>
        </li>
        <li slTimelineGroup label="Agosto">
          <ol slTimelineGroupList>
            <li slTimelineItem time="2026-08-27T14:00:00Z" timeLabel="Aug 27" title="Customer added"></li>
            <li slTimelineItem time="2026-08-29T18:30:00Z" timeLabel="Aug 29" title="Price list agreed"></li>
          </ol>
        </li>
      </ol>
    </div>`,
  )}
</div>`,
  }),
};

export const Growing: Story = {
  parameters: scenario('growing'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene('growing="button"', 'A button at the end of what is loaded; while loading, the ring and the message in the same place.', twoEvents('growing="button"'))}
  ${scene('growing="button" loading', 'The button gave way to the ring: the list is aria-busy and nothing can be requested twice.', twoEvents('growing="button" loading'))}
</div>`,
  }),
};

export const Fresh: Story = {
  parameters: scenario('fresh'),
  render: () => ({
    props: { held: 3 },
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    '[freshCount]="3" · (revealRequest)',
    'Three events waiting behind the pill, announced once. Press it: the consumer merges them into the array and the count returns to zero.',
    `<div slTimeline label="Account activity" mode="feed" order="newest-first" timeFormat="relative" [freshCount]="held" (revealRequest)="held = 0">
      <div slTimelineList>${NEWEST_FIRST}</div>
    </div>`,
  )}
</div>`,
  }),
};

export const Timestamps: Story = {
  parameters: scenario('timestamps'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'timeZone="America/Sao_Paulo" · "UTC" · wall value',
    'The same instant 13:32Z written in two time zones, and a value without a zone written as it is — never converted.',
    `<div slTimeline label="Time zones"><ol slTimelineList>
      <li slTimelineItem time="2026-09-14T13:32:00Z" title="Instant" description="America/Sao_Paulo"></li>
      <li slTimelineItem time="2026-09-14T10:32" title="Wall value" description="Written as is: 10:32 is 10:32"></li>
    </ol></div>
    <div slTimeline label="Time zones" timeZone="UTC"><ol slTimelineList>
      <li slTimelineItem time="2026-09-14T13:32:00Z" title="Instante" description="UTC"></li>
    </ol></div>`,
  )}
  ${scene(
    'timeFormat="relative" · now',
    '2 hours ago, 3 days ago, 6 days ago — and the absolute time in title, on hover. now comes from provideTimelineDefaults, so the server and the client write the same thing.',
    `<div slTimeline label="Activity" mode="feed" order="newest-first" timeFormat="relative"><div slTimelineList>${NEWEST_FIRST}</div></div>`,
  )}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'nine words · unbroken token · Arabic · avatar in the marker · no title',
    'The title wraps inside its column and the marker stays on the first line; the reference breaks anywhere; the Arabic reads from the right; the avatar fills the ring; the untitled event is labeled by the actor.',
    `<div slTimeline label="Invoice activity"><ol slTimelineList>
      <li slTimelineItem time="2026-09-10T20:45:00Z" title="Approved the revised quote for the cross-border shipment program from Solaris Freight" description="Reference TRX-2026-09-10-000000000000000000000000000000000000000000000000000000000000-A">
        <span slTimelineMarker slAvatar name="Anna Rivers" size="xs" tone="accent"></span>
      </li>
      <li slTimelineItem time="2026-09-11T11:30:00Z">
        <span slTimelineTitle dir="rtl" lang="ar">تم إرسال الفاتورة إلى العميل</span>
        <span slTimelineDescription dir="rtl" lang="ar">مع ملف PDF مرفق.</span>
      </li>
      <li slTimelineItem time="2026-09-12T13:00:00Z" description="Added a note without a title.">
        <div slTimelineActor>${ANA} Anna Rivers</div>
      </li>
    </ol></div>`,
  )}
  ${scene(
    '360 px',
    'The same list in a narrow column: the time drops to its own line and the title keeps the full measure.',
    `<div class="slotted-demo-measure"><div slTimeline label="Invoice activity"><ol slTimelineList>${LAST_TWO}</ol></div></div>`,
  )}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'a[slLink] in the title · [slCollapsible] in the body · button[slButton] in the actions · #list="slTimelineList"',
    'Each part is a family that already exists: the title is a link, the issuer’s reply is a collapsible, the actions are buttons. The button outside the list calls list.focusItem(2) through the exported reference.',
    `<div slTimeline label="Invoice activity" mode="feed">
      <div slTimelineList #list="slTimelineList">
        <article slTimelineItem time="2026-09-11T11:30:00Z" description="Card ending in 4421 declined by the issuer." tone="danger">
          ${glyph('lucideCreditCard')}
          <a slTimelineTitle slLink href="#invoice-4821">Payment failed</a>
          <div slCollapsible variant="plain">
            <h4 slCollapsibleHeader><button slCollapsibleTrigger>View issuer response</button></h4>
            <div slCollapsiblePanel>Code 05: do not honor. Second attempt scheduled for September 18.</div>
          </div>
          <div slTimelineActions>
            <button slButton size="sm" variant="outline" type="button">Retry payment</button>
            <button slButton size="sm" tone="secondary" variant="ghost" type="button">Contact customer</button>
          </div>
        </article>
        <article slTimelineItem time="2026-09-12T13:00:00Z" title="Second notice sent" tone="warning">${glyph('lucideFileText')}</article>
        <article slTimelineItem time="2026-09-14T13:32:00Z" title="Paid" tone="success" current>
          <div slTimelineActor>${SOLARIS} Solaris Freight</div>
        </article>
      </div>
    </div>
    <div class="slotted-demo-row"><button slButton size="sm" variant="outline" type="button" (click)="list.focusItem(2)">Focar o terceiro artigo</button></div>`,
  )}
</div>`,
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  ${scene('no items', 'The family message in place of the list, in the muted color, centered.', `<div slTimeline label="Invoice activity"><ol slTimelineList></ol></div>`)}
  ${scene(
    '[slTimelineEmpty] com [slResultState]',
    'Whatever the consumer projects: a result-state with an action, because an empty list is a place to start.',
    `<div slTimeline label="Invoice activity">
      <ol slTimelineList></ol>
      <div slTimelineEmpty slResultState reach="inline" status="empty">
        <div slResultStateContent>
          <p slResultStateTitle>No events yet</p>
          <p slResultStateDescription>The first invoice appears here as soon as it is created.</p>
        </div>
      </div>
    </div>`,
  )}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="1">
  ${scene(
    'feed · Tab · PageDown · PageUp · Control+End · Control+Home',
    'Focus the button before the feed and continue with Tab: each article is a stop with a ring. PageDown jumps to the next article even from a button inside it; Control+End lands on the button after the feed.',
    `<div class="slotted-demo-row"><button slButton size="sm" variant="outline" type="button">Before the feed</button></div>
    <div slTimeline label="Invoice activity" mode="feed"><div slTimelineList>${invoice('article')}</div></div>
    <div class="slotted-demo-row"><button slButton size="sm" variant="outline" type="button">Depois do feed</button></div>`,
  )}
</div>`,
  }),
};
