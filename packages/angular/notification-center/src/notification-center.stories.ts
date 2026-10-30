import { Component, computed, input, signal, viewChild } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlInline } from '@slotted/angular/inline';
import { SlLink } from '@slotted/angular/link';
import {
  SlPopover,
  SlPopoverContent,
  SlPopoverLayer,
  SlPopoverTrigger,
} from '@slotted/angular/popover';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import {
  SlNotificationActions,
  SlNotificationCenter,
  SlNotificationCenterActions,
  SlNotificationCenterEmpty,
  SlNotificationCenterFooter,
  SlNotificationItem,
  SlNotificationVisual,
} from './notification-center';
import {
  provideNotificationCenterDefaults,
  type NotificationCenterArrivals,
  type NotificationCenterControls,
  type NotificationCenterGrowing,
  type NotificationCenterItemRequest,
  type NotificationCenterLevel,
  type NotificationCenterReadRequest,
  type NotificationCenterRevealRequest,
  type NotificationCenterSize,
  type NotificationCenterTimeFormat,
  type NotificationItem,
  type NotificationView,
} from './notification-center-defaults';
import {
  ANGULAR_NOTIFICATION_CENTER_DOCS,
  ANGULAR_NOTIFICATION_CENTER_TOKENS,
} from './notification-center.docs';

/* ── What happened to the Nexora sales desk ─────────────────────────────── */

/** The instant every relative time in the pages is measured from. */
const NOW = Date.parse('2026-09-17T10:20:00Z');

interface Facts {
  name?: string;
  shipment?: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    data: { name: 'Shipment', shipment: true } satisfies Facts,
    description:
      'Shipment SHP-009841 left Columbus with 3 packages. The rest goes in the next loading window, on September 24.',
    href: '#SO-2026-01842',
    key: 'so-01842-partial',
    read: false,
    time: '2026-09-17T08:20:00Z',
    title: 'SO-2026-01842 partially fulfilled: 6 units of Servo Motor MX-240 backordered',
    tone: 'warning',
  },
  {
    data: { name: 'Mary Stone' } satisfies Facts,
    description: '$44,560.00 by wire transfer. $41,860.00 remains open, 14 days past due.',
    href: '#INV-2026-02891',
    key: 'inv-02891-payment',
    read: false,
    time: '2026-09-17T07:05:00Z',
    title: 'Martha Silver recorded a partial payment on INV-2026-02891',
    tone: 'danger',
  },
  {
    data: { name: 'Daniel Okafor' } satisfies Facts,
    href: '#TCK-10492',
    key: 'tck-10492-assigned',
    read: true,
    time: '2026-09-17T06:40:00Z',
    title: 'Daniel Okafor assigned you ticket TCK-10492 · Shipping delay',
  },
  {
    description: 'Northwind Fabrication · $12,480.00 · delivery requested for September 15.',
    key: 'so-01841-approved',
    read: false,
    time: '2026-09-16T15:12:00Z',
    title: 'SO-2026-01841 approved within authority limit',
    tone: 'success',
  },
  {
    description: 'Prepaid, $4,120.00. Approval is with Key Accounts.',
    href: '#SO-2026-01843',
    key: 'so-01843-approval',
    read: true,
    time: '2026-09-16T09:30:00Z',
    title: 'Approval requested for SO-2026-01843 · Helios Automation GmbH',
  },
];

const OLDER: NotificationItem[] = [
  {
    key: 'report-weekly',
    read: true,
    time: '2026-09-15T12:00:00Z',
    title: 'Weekly sales report available',
    tone: 'accent',
  },
  {
    key: 'maintenance-oh1',
    read: true,
    time: '2026-09-14T22:00:00Z',
    title: 'The Columbus (OH-1) maintenance window has ended',
    tone: 'secondary',
  },
];

const ARRIVALS: NotificationItem[] = [
  {
    description: 'Meridian Controls Group · 3 linhas · US$ 18.900,00.',
    href: '#SO-2026-01844',
    key: 'so-01844-new',
    read: false,
    time: '2026-09-17T10:18:00Z',
    title: 'New order SO-2026-01844 received through the portal',
    tone: 'accent',
  },
  {
    data: { name: 'Priya Raman' } satisfies Facts,
    key: 'tck-10493-comment',
    read: false,
    time: '2026-09-17T10:19:00Z',
    title: 'Priya Raman comentou em TCK-10493',
  },
];

const LONG: NotificationItem[] = [
  {
    description:
      'Shipment SHP-009841 left Columbus with 3 of 9 packages, traveling by the regional carrier to the Cincinnati distribution center, where it will be consolidated with the shielded cabling shipment from Helios Automation GmbH before the last leg to line 3 of the Columbus plant, with arrival expected in the morning window of September 24.',
    href: '#SO-2026-01842',
    key: 'long-title',
    read: false,
    time: '2026-09-17T08:20:00Z',
    title:
      'SO-2026-01842 partially fulfilled: 6 units of Servo Motor MX-240 backordered, 3 PLC-7 controllers and 40 meters of shielded cabling follow in the next loading window after consolidation in Cincinnati',
    tone: 'warning',
  },
  {
    key: 'long-reference',
    read: true,
    time: '2026-09-16T09:30:00Z',
    title: 'HA-DE-2026-Q3-00092817-COLUMBUS-L3-SERVO-PLC-REPL-CONSOLIDATED-CINCINNATI-BATCH-02',
  },
];

const THREE_VIEWS: NotificationView[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Mentions', value: 'mentions' },
];

function dayOf(item: NotificationItem): string {
  return String(item.time) >= '2026-09-17' ? 'Today' : 'Yesterday';
}

/** A store that answers every request: read, remove, more, arrivals. */
class Store {
  readonly items = signal<readonly NotificationItem[]>(NOTIFICATIONS);
  readonly loading = signal(false);
  private paged = false;

  constructor(initial: readonly NotificationItem[] = NOTIFICATIONS) {
    this.items.set(initial);
  }

  read(request: NotificationCenterReadRequest) {
    this.items.update((items) =>
      items.map((item) =>
        request.keys.includes(item.key) ? { ...item, read: request.read } : item,
      ),
    );
  }

  remove(request: NotificationCenterItemRequest) {
    this.items.update((items) => items.filter((item) => item.key !== request.key));
  }

  loadMore() {
    if (this.paged) return;
    this.loading.set(true);
    window.setTimeout(() => {
      this.items.update((items) => [...items, ...OLDER]);
      this.paged = true;
      this.loading.set(false);
    }, 900);
  }

  arrive() {
    this.items.update((items) => [
      ...ARRIVALS.filter((item) => !items.some((known) => known.key === item.key)),
      ...items,
    ]);
  }

  reset(initial: readonly NotificationItem[] = NOTIFICATIONS) {
    this.items.set(initial);
    this.paged = false;
  }
}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

function panel(body: string) {
  return `<div class="slotted-demo-frame slotted-demo-measure">${body}</div>`;
}

function inbox(attributes: string) {
  return `<sl-nc-inbox ${attributes}></sl-nc-inbox>`;
}

/** The centre over a store of its own, with the slots a scene turns on. */
const INBOX_TEMPLATE = `<section
  slNotificationCenter
  locale="pt-PT"
  [items]="store.items()"
  [loading]="store.loading()"
  [now]="now"
  [size]="size()"
  [level]="level()"
  [growing]="growing()"
  [arrivals]="arrivals()"
  [controls]="controls()"
  [timeFormat]="timeFormat()"
  [views]="viewList()"
  [groupBy]="grouping()"
  (readRequest)="store.read($event)"
  (removeRequest)="store.remove($event)"
  (loadMoreRequest)="store.loadMore()"
>
  @if (actions()) {
    <div slNotificationCenterActions>
      <a slLink href="#preferences" underline="hover">Preferences</a>
    </div>
  }
  <ng-template slNotificationVisual let-item>
    @if (item.data?.name) {
      <span slAvatar decorative [name]="item.data.name" shape="circle" size="sm" [tone]="item.data.shipment ? 'secondary' : 'accent'"></span>
    }
  </ng-template>
  <ng-template slNotificationActions let-item>
    @if (item.data?.shipment) {
      <button slButton size="sm" tone="secondary" variant="outline" type="button">View shipment</button>
    }
  </ng-template>
  @if (footer()) {
    <div slNotificationCenterFooter>
      <a slLink href="#notifications" underline="hover">See all notifications</a>
    </div>
  }
</section>`;

@Component({
  selector: 'sl-nc-inbox',
  standalone: true,
  imports: [
    SlNotificationCenter,
    SlNotificationCenterActions,
    SlNotificationCenterFooter,
    SlNotificationVisual,
    SlNotificationActions,
    SlAvatar,
    SlButton,
    SlLink,
  ],
  template: INBOX_TEMPLATE,
})
class InboxDemo {
  readonly size = input<NotificationCenterSize | undefined>(undefined);
  readonly level = input<NotificationCenterLevel | undefined>(undefined);
  readonly growing = input<NotificationCenterGrowing | undefined>(undefined);
  readonly arrivals = input<NotificationCenterArrivals | undefined>(undefined);
  readonly controls = input<NotificationCenterControls | undefined>(undefined);
  readonly timeFormat = input<NotificationCenterTimeFormat | undefined>(undefined);
  readonly actions = input(false);
  readonly footer = input(false);
  readonly groups = input(false);
  readonly views = input<'builtin' | 'three'>('builtin');
  readonly initial = input<'default' | 'long'>('default');

  readonly now = NOW;
  readonly store = new Store();
  readonly viewList = computed(() => (this.views() === 'three' ? THREE_VIEWS : undefined));
  readonly grouping = computed(() => (this.groups() ? dayOf : undefined));

  constructor() {
    queueMicrotask(() => {
      if (this.initial() === 'long') this.store.reset(LONG);
    });
  }
}

@Component({
  selector: 'sl-nc-live',
  standalone: true,
  imports: [
    SlNotificationCenter,
    SlNotificationVisual,
    SlAvatar,
    SlButton,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `<div slStack [gap]="4">
    <div slInline [gap]="3">
      <button slButton size="sm" variant="outline" type="button" (click)="store.arrive()">
        Chegam duas
      </button>
      <button
        slButton
        size="sm"
        tone="secondary"
        variant="ghost"
        type="button"
        (click)="store.reset()"
      >
        Repor
      </button>
      <span slText size="sm" tone="muted">{{ log() }}</span>
    </div>
    <section
      slNotificationCenter
      locale="pt-PT"
      [arrivals]="arrivals()"
      [items]="store.items()"
      [now]="now"
      (readRequest)="store.read($event)"
      (removeRequest)="store.remove($event)"
      (revealRequest)="reveal($event)"
    >
      <ng-template slNotificationVisual let-item>
        @if (item.data?.name) {
          <span slAvatar decorative [name]="item.data.name" shape="circle" size="sm"></span>
        }
      </ng-template>
    </section>
  </div>`,
})
class LiveDemo {
  readonly arrivals = input<NotificationCenterArrivals>('hold');
  readonly now = NOW;
  readonly store = new Store();
  readonly log = signal('');
  reveal(request: NotificationCenterRevealRequest) {
    this.log.set(`revealRequest(${request.count}, ${request.reason})`);
  }
}

@Component({
  selector: 'sl-nc-views',
  standalone: true,
  imports: [SlNotificationCenter],
  template: `<section
    slNotificationCenter
    locale="pt-PT"
    [items]="shown()"
    [now]="now"
    [views]="views()"
    [(view)]="view"
    (viewRequest)="$event.value === 'archived' ? $event.cancel() : null"
    (readRequest)="store.read($event)"
    (removeRequest)="store.remove($event)"
  ></section>`,
})
class ViewsDemo {
  readonly now = NOW;
  readonly store = new Store();
  readonly view = signal<string | undefined>('all');
  readonly mentions = computed(() =>
    this.store.items().filter((item) => item.key.startsWith('tck-')),
  );
  readonly shown = computed(() =>
    this.view() === 'mentions' ? this.mentions() : this.store.items(),
  );
  readonly views = computed<NotificationView[]>(() => [
    { label: 'All', value: 'all' },
    { count: this.mentions().length, label: 'Mentions', value: 'mentions' },
    { label: 'Archived', value: 'archived' },
  ]);
}

@Component({
  selector: 'sl-nc-scroll',
  standalone: true,
  imports: [SlNotificationCenter],
  template: `<div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
    <section
      slNotificationCenter
      growing="scroll"
      locale="pt-PT"
      [count]="7"
      [items]="store.items()"
      [loading]="store.loading()"
      [now]="now"
      (readRequest)="store.read($event)"
      (removeRequest)="store.remove($event)"
      (loadMoreRequest)="store.loadMore()"
    ></section>
  </div>`,
})
class ScrollDemo {
  readonly now = NOW;
  readonly store = new Store();
}

@Component({
  selector: 'sl-nc-bell',
  standalone: true,
  imports: [
    SlNotificationCenter,
    SlNotificationCenterFooter,
    SlBadge,
    SlButton,
    SlInline,
    SlLink,
    SlPopover,
    SlPopoverContent,
    SlPopoverLayer,
    SlPopoverTrigger,
  ],
  template: `<div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">
    <div slInline [gap]="3" justify="end">
      <ng-container slPopover side="bottom" align="end" size="lg" [portal]="false">
        <button slButton slPopoverTrigger tone="secondary" variant="outline" type="button">
          Notifications
          @if (unread() > 0) {
            &ngsp;<span
              slBadge
              [count]="unread()"
              shape="pill"
              size="sm"
              tone="accent"
              variant="solid"
            ></span>
          }
        </button>
        <ng-template slPopoverLayer>
          <div slPopoverContent aria-label="Notifications">
            <section
              slNotificationCenter
              level="3"
              locale="pt-PT"
              size="sm"
              [items]="store.items()"
              [now]="now"
              (readRequest)="store.read($event)"
              (removeRequest)="store.remove($event)"
            >
              <div slNotificationCenterFooter>
                <a slLink href="#notifications" underline="hover">See all notifications</a>
              </div>
            </section>
          </div>
        </ng-template>
      </ng-container>
    </div>
  </div>`,
})
class BellDemo {
  readonly now = NOW;
  readonly store = new Store();
  readonly unread = computed(() => this.store.items().filter((item) => !item.read).length);
}

@Component({
  selector: 'sl-nc-empty',
  standalone: true,
  imports: [
    SlNotificationCenter,
    SlNotificationCenterEmpty,
    SlResultState,
    SlResultStateContent,
    SlResultStateTitle,
    SlResultStateDescription,
  ],
  template: `<section slNotificationCenter locale="pt-PT" [items]="[]" [now]="now">
    <section slNotificationCenterEmpty slResultState status="success" reach="inline" live="off">
      <div slResultStateContent>
        <div slResultStateTitle>All caught up</div>
        <p slResultStateDescription>Nothing is waiting for your attention.</p>
      </div>
    </section>
  </section>`,
})
class EmptyDemo {
  readonly now = NOW;
}

@Component({
  selector: 'sl-nc-rendered',
  standalone: true,
  imports: [SlNotificationCenter, SlNotificationItem, SlBadge, SlInline],
  template: `<section
    slNotificationCenter
    locale="pt-PT"
    [items]="store.items()"
    [now]="now"
    (readRequest)="store.read($event)"
    (removeRequest)="store.remove($event)"
  >
    <ng-template slNotificationItem let-item let-time="time" let-tone="tone" let-ids="ids">
      <span data-part="title" data-part-title="" [id]="ids.title">{{ item.title }}</span>
      <div slInline [gap]="3">
        <span slBadge shape="pill" size="sm" variant="soft" [tone]="tone">{{ tone }}</span>
        <time data-part="time" data-part-time="" [attr.datetime]="time.dateTime">{{
          time.text
        }}</time>
      </div>
    </ng-template>
  </section>`,
})
class RenderedDemo {
  readonly now = NOW;
  readonly store = new Store();
}

@Component({
  selector: 'sl-nc-handled',
  standalone: true,
  imports: [SlNotificationCenter, SlButton, SlInline, SlStack],
  template: `<div slStack [gap]="4">
    <div slInline [gap]="3">
      <button slButton size="sm" variant="outline" type="button" (click)="centre().focus()">
        focus()
      </button>
      <button slButton size="sm" variant="outline" type="button" (click)="store.arrive()">
        Chegam duas
      </button>
      <button slButton size="sm" variant="outline" type="button" (click)="centre().reveal()">
        reveal()
      </button>
      <button slButton size="sm" variant="outline" type="button" (click)="centre().markAllRead()">
        markAllRead()
      </button>
    </div>
    <section
      slNotificationCenter
      aria-label="Sales team inbox"
      locale="pt-PT"
      [items]="store.items()"
      [now]="now"
      (readRequest)="store.read($event)"
      (removeRequest)="store.remove($event)"
    ></section>
  </div>`,
})
class HandledDemo {
  readonly now = NOW;
  readonly store = new Store();
  readonly centre = viewChild.required(SlNotificationCenter);
}

@Component({
  selector: 'sl-nc-provided',
  standalone: true,
  imports: [InboxDemo, SlStack],
  providers: [provideNotificationCenterDefaults({ growing: 'button', size: 'sm' })],
  template: `<div slStack [gap]="6">${panel(inbox(''))} ${panel(inbox('controls="none"'))}</div>`,
})
class ProvidedDemo {}

@Component({
  selector: 'sl-nc-refusing',
  standalone: true,
  imports: [SlNotificationCenter, SlStack, SlText],
  template: `<div slStack [gap]="4">
    <span slText size="sm" tone="muted">{{ log() || 'Nothing asked yet.' }}</span>
    <section
      slNotificationCenter
      locale="pt-PT"
      [items]="store.items()"
      [now]="now"
      (openRequest)="open($event)"
      (readRequest)="store.read($event)"
      (removeRequest)="remove($event)"
    ></section>
  </div>`,
})
class RefusingDemo {
  readonly now = NOW;
  readonly store = new Store();
  readonly log = signal('');
  open(request: NotificationCenterItemRequest) {
    request.cancel();
    this.log.set(`openRequest(${request.key}, ${request.reason}) — refused`);
  }
  remove(request: NotificationCenterItemRequest) {
    if (request.reason === 'keyboard') {
      request.cancel();
      this.log.set(`removeRequest(${request.key}, keyboard) — refused; press the x instead`);
      return;
    }
    this.store.remove(request);
    this.log.set(`removeRequest(${request.key}, pointer)`);
  }
}

/* ── The page ───────────────────────────────────────────────────────────── */

interface NotificationCenterStoryArgs {
  size: NotificationCenterSize;
  level: NotificationCenterLevel;
  growing: NotificationCenterGrowing;
  arrivals: NotificationCenterArrivals;
  timeFormat: NotificationCenterTimeFormat;
  controls: NotificationCenterControls;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_NOTIFICATION_CENTER_DOCS.notificationCenter.scenes, {
    playground: Playground,
    anatomy: Anatomy,
    read: Read,
    views: Views,
    arrivals: Arrivals,
    groups: Groups,
    growing: Growing,
    actions: Actions,
    hosts: Hosts,
    loading: Loading,
    empty: Empty,
    sizes: Sizes,
    content: Content,
    composition: Composition,
    defaults: Defaults,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<NotificationCenterStoryArgs> = {
  title: 'Components/NotificationCenter',
  decorators: [
    moduleMetadata({
      imports: [
        SlNotificationCenter,
        InboxDemo,
        LiveDemo,
        ViewsDemo,
        ScrollDemo,
        BellDemo,
        EmptyDemo,
        RenderedDemo,
        HandledDemo,
        ProvidedDemo,
        RefusingDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Notification Center',
        description:
          'The persistent list of what happened while the reader was not looking: a feed of notifications with their read state, views over them, arrivals held while the reader reads, and every change a request the store answers. The same family in a popover under the bell and on a page of its own.',
        framework: 'Angular',
        ...ANGULAR_NOTIFICATION_CENTER_DOCS.notificationCenter,
        tokens: ANGULAR_NOTIFICATION_CENTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<NotificationCenterStoryArgs>;

const PROPS = { items: NOTIFICATIONS, now: NOW };

export const Playground: Story = {
  args: {
    size: 'md',
    level: '2',
    growing: 'none',
    arrivals: 'hold',
    timeFormat: 'relative',
    controls: 'both',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: { ...PROPS, ...args },
    template: inbox(
      '[size]="size" [level]="level" [growing]="growing" [arrivals]="arrivals" [timeFormat]="timeFormat" [controls]="controls"',
    ),
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Every part, written out',
        'Title with its count, mark-all, a preferences link; three views; Today and Yesterday; an avatar, a family visual for the success item, no visual for the last; the two controls; a button for more; the footer link.',
        inbox('[actions]="true" [footer]="true" [groups]="true" growing="button" views="three"'),
      ),
    ),
  }),
};

export const Read: Story = {
  parameters: scenario('read'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Three unread, one store',
        'Press the check on a row and the store answers; press it again on a read row and the row is unread again. Mark-all asks for the three keys at once and disables itself at zero. The count in the title and in the Unread tab follow the items.',
        inbox(''),
      ),
    ),
  }),
};

export const Views: Story = {
  parameters: scenario('views'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'The built-in views',
        'All and Unread, the second counted. Under Unread the family filters the items itself; mark one read there and it leaves the list.',
        inbox(''),
      ) +
        scene(
          'The consumer’s views, two-way',
          'Mentions shows the items the consumer gives for it; Archived is refused in viewRequest, so the strip stays where it was. The view is the consumer’s model.',
          '<sl-nc-views></sl-nc-views>',
        ),
    ),
  }),
};

export const Arrivals: Story = {
  parameters: scenario('arrivals'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        "arrivals='hold', the default",
        'Focus an article, then press Chegam duas: the list stays and the pill counts what arrived. Press the pill, or PageUp from the first article and Enter, and the two show at the top. Press Chegam duas without focus in the feed and they show at once.',
        '<sl-nc-live arrivals="hold"></sl-nc-live>',
      ) +
        scene(
          "arrivals='show'",
          'Nothing is held: focus an article, press Chegam duas, and the two are at the top at once, above the row that had focus.',
          '<sl-nc-live arrivals="show"></sl-nc-live>',
        ),
    ),
  }),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Filed by day',
        'Today and Yesterday as headings at h3, one rank below the title; the positions run across the groups, so the first item of Yesterday is the fourth of five.',
        inbox('[groups]="true"'),
      ),
    ),
  }),
};

export const Growing: Story = {
  parameters: scenario('growing'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        "growing='button'",
        'Press Load more: the waiting row says Loading notifications for a moment and two older items arrive at the end. aria-setsize is -1 on every article until the consumer states a count.',
        inbox('growing="button"'),
      ) +
        scene(
          'growing=\'scroll\', [count]="7"',
          'A box of a fixed height: scroll to the end and the sentinel asks with the reason scroll. The consumer stated seven in all, so aria-setsize is 7 from the first render.',
          '<sl-nc-scroll></sl-nc-scroll>',
        ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'The two slots',
        'Preferences after mark-all in the header; View shipment under the first item’s time, above the row’s hover, so it can be pressed without opening the item.',
        inbox('[actions]="true"'),
      ) +
        scene(
          "controls='read'",
          'The read-toggle alone: a feed whose store has no removal.',
          inbox('controls="read"'),
        ) +
        scene(
          "controls='dismiss'",
          'Dismiss alone: a feed whose items are read by being opened.',
          inbox('controls="dismiss"'),
        ) +
        scene(
          "controls='none'",
          'No controls of the family’s; the consumer’s actions template holds whatever the product decides.',
          inbox('controls="none"'),
        ),
    ),
  }),
};

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Under the bell',
        "The trigger shows the store’s unread count — the centre reports the same through unreadChange while it is mounted. Open it: the centre at size='sm' and level='3', with the footer to the page. PageDown through the articles, mark one read and read the count change, press Escape.",
        '<sl-nc-bell></sl-nc-bell>',
      ) +
        scene(
          'A page of its own',
          "The same family at size='md' with groups and a button for more — the page the footer link leads to.",
          inbox('[groups]="true" growing="button"'),
        ),
    ),
  }),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Before the first page',
        'Three skeleton rows in the item’s inset — a circle for the visual, two lines for the words — hidden from assistive technology; the feed is busy and the tabs stay.',
        '<section slNotificationCenter loading locale="pt-PT" [items]="[]" [now]="now"></section>',
      ) +
        scene(
          'With items loaded and more on the way',
          'The rows stay; the waiting row under the feed says Loading notifications politely.',
          '<section slNotificationCenter growing="scroll" loading locale="pt-PT" [items]="items" [now]="now"></section>',
        ),
    ),
  }),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => ({
    props: { ...PROPS, read: NOTIFICATIONS.map((item) => ({ ...item, read: true })) },
    template: grid(
      scene(
        'Nothing at all',
        'The feed holds nothing and messages.empty stands under the strip.',
        '<section slNotificationCenter locale="pt-PT" [items]="[]" [now]="now"></section>',
      ) +
        scene(
          'Nothing unread',
          'Under the unread view with every item read, the caughtUp message.',
          '<section slNotificationCenter locale="pt-PT" view="unread" [items]="read" [now]="now"></section>',
        ) +
        scene(
          'The consumer’s empty page',
          "A result-state at reach='inline' in the [slNotificationCenterEmpty] slot replaces the family’s words.",
          '<sl-nc-empty></sl-nc-empty>',
        ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        "size='sm', level='3'",
        'The popover’s step in a popover’s width: the small type steps, tighter insets, 24-pixel visuals and the small inner-control box.',
        panel(inbox('[footer]="true" level="3" size="sm"')),
      ) +
        scene(
          "size='md', level='2', the default",
          'The page’s step: the medium type steps and 28-pixel visuals, with the title at h2.',
          inbox(''),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'A title of a sentence, a description of a paragraph, a reference with no spaces',
        'Two lines for the title, three for the description, the rest kept in the DOM; the reference breaks at any character rather than widening the row.',
        inbox('initial="long"'),
      ) +
        scene(
          'In a phone’s width',
          'At 375 pixels the header’s controls wrap to the end of their own line and the title clamps sooner; below 320 the controls drop under the content at the inline end.',
          `<div class="slotted-demo-room" data-room="phone"><div class="slotted-demo-viewport" data-layout="page" data-scroll data-size="tall">${inbox('[actions]="true"')}</div></div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'The families a centre is made of',
        'Avatar in the visual template, Button in the actions and in mark-all, Tabs in the strip, Link in the header and the footer. The family places each and owns none of their behaviour.',
        inbox('[actions]="true" [footer]="true"'),
      ) +
        scene(
          'The item template',
          'The content of each row is the consumer’s — the title, a Badge with the tone’s name and the time — while the article, its wiring and its two controls stay the family’s.',
          '<sl-nc-rendered></sl-nc-rendered>',
        ),
    ),
  }),
};

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Two centres under one provider',
        "Neither states a size or a growing mode; both read small and paged by button. The second states controls='none' and wins. The title comes from the language in force.",
        '<sl-nc-provided></sl-nc-provided>',
      ) +
        scene(
          'The instance',
          'focus() lands on fresh when arrivals are held and on the first article otherwise; reveal() and markAllRead() ask with the reason programmatic. The consumer’s aria-label replaces the title wiring on the section.',
          '<sl-nc-handled></sl-nc-handled>',
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'The feed keys',
        'Tab to the first article: PageDown and PageUp move between articles, Control+End leaves to the next control on the page, Control+Home to the selected tab. Delete asks to remove — refused here with the reason keyboard, so focus stays. Enter on a title asks openRequest, refused here, so nothing navigates.',
        '<sl-nc-refusing></sl-nc-refusing>',
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    props: PROPS,
    template: grid(
      scene(
        'Names, announcements and rings',
        'The region and the feed are named by the heading, each article by its title. Press Two arrive with focus in the feed and hear 2 new notifications; mark a row read and hear the unread count. The article’s ring is inward, the controls’ outward.',
        '<sl-nc-live arrivals="hold"></sl-nc-live>',
      ),
    ),
  }),
};
