import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Badge } from '../badge';
import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Inline } from '../inline';
import { Link } from '../link';
import { Viewport } from '../page/page-demo';
import { Popover, PopoverContent, PopoverLayer, PopoverTrigger } from '../popover';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Stack } from '../stack';
import { Text } from '../typography';
import { NotificationCenter } from './notification-center';
import { NotificationCenterDefaultsProvider } from './notification-center-defaults';
import {
  dayOf,
  Inbox,
  NOTIFICATIONS,
  NOW,
  Panel,
  useNotificationStore,
} from './notification-center-demo';
import {
  REACT_NOTIFICATION_CENTER_DOCS,
  REACT_NOTIFICATION_CENTER_TOKENS,
} from './notification-center.docs';
import type {
  NotificationCenterHandle,
  NotificationCenterProps,
  NotificationItem,
} from './notification-center.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_NOTIFICATION_CENTER_DOCS.notificationCenter.scenes, {
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

const meta = {
  title: 'Components/NotificationCenter',
  component: NotificationCenter,
  args: { items: NOTIFICATIONS },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Notification Center',
        description:
          'The persistent list of what happened while the reader was not looking: a feed of notifications with their read state, views over them, arrivals held while the reader reads, and every change a request the store answers. The same family in a popover under the bell and on a page of its own.',
        framework: 'React',
        ...REACT_NOTIFICATION_CENTER_DOCS.notificationCenter,
        tokens: REACT_NOTIFICATION_CENTER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

const VIEWS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Mentions', value: 'mentions' },
];

function Preferences() {
  return (
    <Link href="#preferences" underline="hover">
      Preferences
    </Link>
  );
}

function SeeAll() {
  return (
    <Link href="#notifications" underline="hover">
      See all notifications
    </Link>
  );
}

export const Playground: Story = {
  args: {
    size: 'md',
    level: '2',
    growing: 'none',
    arrivals: 'hold',
    timeFormat: 'relative',
    controls: 'both',
    loading: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Inbox {...(args as Partial<NotificationCenterProps>)} />,
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every part, written out"
        note="Title with its count, mark-all, a preferences link; three views; Today and Yesterday; an avatar, a family visual for the success item, no visual for the last; the two controls; a button for more; the footer link."
      >
        <Inbox
          actions={<Preferences />}
          footer={<SeeAll />}
          groupBy={dayOf}
          growing="button"
          views={VIEWS}
        />
      </Scene>
    </Grid>
  ),
};

export const Read: Story = {
  parameters: scenario('read'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three unread, one store"
        note="Press the check on a row and the store answers; press it again on a read row and the row is unread again. Mark-all asks for the three keys at once and disables itself at zero. The count in the title and in the Unread tab follow the items."
      >
        <Inbox />
      </Scene>
    </Grid>
  ),
};

function ConsumerViews() {
  const store = useNotificationStore();
  const [view, setView] = useState('all');
  const mentions = store.items.filter((item) => item.key.startsWith('tck-'));
  return (
    <NotificationCenter
      items={view === 'mentions' ? mentions : store.items}
      locale="pt-PT"
      now={NOW}
      onReadChange={store.onReadChange}
      onRemove={store.onRemove}
      onViewChange={(next, request) => {
        if (next === 'archived') request.cancel();
        else setView(next);
      }}
      view={view}
      views={[
        { label: 'All', value: 'all' },
        { count: mentions.length, label: 'Mentions', value: 'mentions' },
        { label: 'Archived', value: 'archived' },
      ]}
    />
  );
}

export const Views: Story = {
  parameters: scenario('views'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The built-in views"
        note="All and Unread, the second counted. Under Unread the family filters the items itself; mark one read there and it leaves the list."
      >
        <Inbox />
      </Scene>
      <Scene
        label="The consumer’s views, controlled"
        note="Mentions shows the items the consumer gives for it; Archived is refused in onViewChange, so the strip stays where it was. The view is the consumer’s state."
      >
        <ConsumerViews />
      </Scene>
    </Grid>
  ),
};

function Live({ arrivals }: { arrivals: 'hold' | 'show' }) {
  const store = useNotificationStore();
  const [log, setLog] = useState('');
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button onClick={store.arrive} size="sm" variant="outline">
          Chegam duas
        </Button>
        <Button onClick={store.reset} size="sm" tone="secondary" variant="ghost">
          Repor
        </Button>
        <Text size="sm" tone="muted">
          {log}
        </Text>
      </Inline>
      <NotificationCenter
        arrivals={arrivals}
        items={store.items}
        locale="pt-PT"
        now={NOW}
        onReadChange={store.onReadChange}
        onRemove={store.onRemove}
        onReveal={(count, request) => setLog(`onReveal(${count}, ${request.reason})`)}
      />
    </Stack>
  );
}

export const Arrivals: Story = {
  parameters: scenario('arrivals'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="arrivals='hold', the default"
        note="Focus an article, then press Chegam duas: the list stays and the pill counts what arrived. Press the pill, or PageUp from the first article and Enter, and the two show at the top. Press Chegam duas without focus in the feed and they show at once."
      >
        <Live arrivals="hold" />
      </Scene>
      <Scene
        label="arrivals='show'"
        note="Nothing is held: focus an article, press Chegam duas, and the two are at the top at once, above the row that had focus."
      >
        <Live arrivals="show" />
      </Scene>
    </Grid>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Filed by day"
        note="Today and Yesterday as headings at h3, one rank below the title; the positions run across the groups, so the first item of Yesterday is the fourth of five."
      >
        <Inbox groupBy={dayOf} />
      </Scene>
    </Grid>
  ),
};

function Scrolling() {
  const store = useNotificationStore();
  return (
    <Viewport size="tall">
      <NotificationCenter
        count={7}
        growing="scroll"
        items={store.items}
        loading={store.loading}
        locale="pt-PT"
        now={NOW}
        onLoadMore={store.onLoadMore}
        onReadChange={store.onReadChange}
        onRemove={store.onRemove}
      />
    </Viewport>
  );
}

export const Growing: Story = {
  parameters: scenario('growing'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="growing='button'"
        note="Press Load more: the waiting row says Loading notifications for a moment and two older items arrive at the end. aria-setsize is -1 on every article until the consumer states a count."
      >
        <Inbox growing="button" />
      </Scene>
      <Scene
        label="growing='scroll', count={7}"
        note="A box of a fixed height: scroll to the end and the sentinel asks with the reason scroll. The consumer stated seven in all, so aria-setsize is 7 from the first render."
      >
        <Scrolling />
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The two slots"
        note="Preferences after mark-all in the header; View shipment under the first item’s time, above the row’s hover, so it can be pressed without opening the item."
      >
        <Inbox actions={<Preferences />} />
      </Scene>
      <Scene
        label="controls='read'"
        note="The read-toggle alone: a feed whose store has no removal."
      >
        <Inbox controls="read" />
      </Scene>
      <Scene
        label="controls='dismiss'"
        note="Dismiss alone: a feed whose items are read by being opened."
      >
        <Inbox controls="dismiss" />
      </Scene>
      <Scene
        label="controls='none'"
        note="No controls of the family’s; the consumer’s actions slot holds whatever the product decides."
      >
        <Inbox controls="none" />
      </Scene>
    </Grid>
  ),
};

function Bell() {
  const store = useNotificationStore();
  const unread = store.items.filter((item) => !item.read).length;
  return (
    <Viewport size="tall">
      <Inline gap={3} justify="end">
        <Popover align="end" portal={false} side="bottom" size="lg">
          <PopoverTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Notifications
                {unread > 0 ? (
                  <>
                    {' '}
                    <Badge count={unread} shape="pill" size="sm" tone="accent" variant="solid" />
                  </>
                ) : null}
              </Button>
            )}
          />
          <PopoverLayer>
            <PopoverContent aria-label="Notifications">
              <NotificationCenter
                footer={<SeeAll />}
                items={store.items}
                level="3"
                locale="pt-PT"
                now={NOW}
                onReadChange={store.onReadChange}
                onRemove={store.onRemove}
                size="sm"
              />
            </PopoverContent>
          </PopoverLayer>
        </Popover>
      </Inline>
    </Viewport>
  );
}

export const Hosts: Story = {
  parameters: scenario('hosts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Under the bell"
        note="The trigger shows the store’s unread count — the centre reports the same through onUnreadChange while it is mounted. Open it: the centre at size='sm' and level='3', with the footer to the page. PageDown through the articles, mark one read and read the count change, press Escape."
      >
        <Bell />
      </Scene>
      <Scene
        label="A page of its own"
        note="The same family at size='md' with groups and a button for more — the page the footer link leads to."
      >
        <Inbox groupBy={dayOf} growing="button" />
      </Scene>
    </Grid>
  ),
};

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Before the first page"
        note="Three skeleton rows in the item’s inset — a circle for the visual, two lines for the words — hidden from assistive technology; the feed is busy and the tabs stay."
      >
        <NotificationCenter items={[]} loading locale="pt-PT" now={NOW} />
      </Scene>
      <Scene
        label="With items loaded and more on the way"
        note="The rows stay; the waiting row under the feed says Loading notifications politely."
      >
        <NotificationCenter
          growing="scroll"
          items={NOTIFICATIONS}
          loading
          locale="pt-PT"
          now={NOW}
        />
      </Scene>
    </Grid>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Nothing at all"
        note="The feed holds nothing and messages.empty stands under the strip."
      >
        <NotificationCenter items={[]} locale="pt-PT" now={NOW} />
      </Scene>
      <Scene
        label="Nothing unread"
        note="Under the unread view with every item read, the caughtUp message."
      >
        <NotificationCenter
          defaultView="unread"
          items={NOTIFICATIONS.map((item) => ({ ...item, read: true }))}
          locale="pt-PT"
          now={NOW}
        />
      </Scene>
      <Scene
        label="The consumer’s empty page"
        note="A ResultState at reach='inline' in the empty prop replaces the family’s words."
      >
        <NotificationCenter
          empty={
            <ResultState live="off" reach="inline" status="success">
              <ResultStateContent>
                <ResultStateTitle>All read</ResultStateTitle>
                <ResultStateDescription>
                  Nothing is waiting for your attention.
                </ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          }
          items={[]}
          locale="pt-PT"
          now={NOW}
        />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="size='sm', level='3'"
        note="The popover’s step in a popover’s width: the small type steps, tighter insets, 24-pixel visuals and the small inner-control box."
      >
        <Panel>
          <Inbox footer={<SeeAll />} level="3" size="sm" />
        </Panel>
      </Scene>
      <Scene
        label="size='md', level='2', the default"
        note="The page’s step: the medium type steps and 28-pixel visuals, with the title at h2."
      >
        <Inbox />
      </Scene>
    </Grid>
  ),
};

const LONG: NotificationItem[] = [
  {
    description:
      'Shipment SHP-009841 left Columbus with 3 of 9 packages, traveling by the regional carrier to the Cincinnati distribution center, where it will be consolidated with the shielded cabling shipment from Helios Automation GmbH before the last leg to line 3 of the Columbus plant, with arrival expected in the morning window on September 24.',
    href: '#SO-2026-01842',
    key: 'long-title',
    read: false,
    time: '2026-09-17T08:20:00Z',
    title:
      'SO-2026-01842 partially fulfilled: 6 units of Servo Motor MX-240 backordered, 3 PLC-7 controllers and 40 meters of shielded cabling follow in the next shipping window after consolidation in Cincinnati',
    tone: 'warning',
  },
  {
    key: 'long-reference',
    read: true,
    time: '2026-09-16T09:30:00Z',
    title: 'HA-DE-2026-Q3-00092817-COLUMBUS-L3-SERVO-PLC-REPL-CONSOLIDATED-CINCINNATI-BATCH-02',
  },
];

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A title of a sentence, a description of a paragraph, a reference with no spaces"
        note="Two lines for the title, three for the description, the rest kept in the DOM; the reference breaks at any character rather than widening the row."
      >
        <Inbox initial={LONG} />
      </Scene>
      <Scene
        label="In a phone’s width"
        note="At 375 pixels the header’s controls wrap to the end of their own line and the title clamps sooner; below 320 the controls drop under the content at the inline end."
      >
        <div className="slotted-demo-room" data-room="phone">
          <Viewport size="tall">
            <Inbox actions={<Preferences />} />
          </Viewport>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The families a centre is made of"
        note="Avatar in the visual, Button in the actions and in mark-all, Tabs in the strip, Link in the header and the footer. The family places each and owns none of their behaviour."
      >
        <Inbox actions={<Preferences />} footer={<SeeAll />} />
      </Scene>
      <Scene
        label="renderItem"
        note="The content of each row is the consumer’s — the title, a Badge with the tone’s name and the time — while the article, its wiring and its two controls stay the family’s."
      >
        <Inbox
          renderItem={(item, state) => (
            <>
              <span data-part="title" data-part-title="" id={state.ids.title}>
                {item.title}
              </span>
              <Inline gap={3}>
                <Badge shape="pill" size="sm" tone={state.tone} variant="soft">
                  {state.tone}
                </Badge>
                <time data-part="time" data-part-time="" dateTime={state.time.dateTime}>
                  {state.time.text}
                </time>
              </Inline>
            </>
          )}
        />
      </Scene>
    </Grid>
  ),
};

function Handled() {
  const handle = useRef<NotificationCenterHandle>(null);
  const store = useNotificationStore();
  return (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
          handle.focus()
        </Button>
        <Button onClick={store.arrive} size="sm" variant="outline">
          Chegam duas
        </Button>
        <Button onClick={() => handle.current?.reveal()} size="sm" variant="outline">
          handle.reveal()
        </Button>
        <Button onClick={() => handle.current?.markAllRead()} size="sm" variant="outline">
          handle.markAllRead()
        </Button>
      </Inline>
      <NotificationCenter
        aria-label="Sales team inbox"
        items={store.items}
        locale="pt-PT"
        now={NOW}
        onReadChange={store.onReadChange}
        onRemove={store.onRemove}
        ref={handle}
      />
    </Stack>
  );
}

export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two centres under one provider"
        note="Neither states a size or a growing mode; both read small and paged by button. The second states controls='none' and wins. The title comes from the language in force."
      >
        <NotificationCenterDefaultsProvider growing="button" size="sm">
          <Stack gap={6}>
            <Panel>
              <Inbox />
            </Panel>
            <Panel>
              <Inbox controls="none" />
            </Panel>
          </Stack>
        </NotificationCenterDefaultsProvider>
      </Scene>
      <Scene
        label="The handle"
        note="focus() lands on fresh when arrivals are held and on the first article otherwise; reveal() and markAllRead() ask with the reason programmatic. The consumer’s aria-label replaces the title wiring on the section."
      >
        <Handled />
      </Scene>
    </Grid>
  ),
};

function Refusing() {
  const store = useNotificationStore();
  const [log, setLog] = useState('');
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        {log || 'Nothing asked yet.'}
      </Text>
      <NotificationCenter
        items={store.items}
        locale="pt-PT"
        now={NOW}
        onOpen={(key, request) => {
          request.cancel();
          setLog(`onOpen(${key}, ${request.reason}) — refused`);
        }}
        onReadChange={store.onReadChange}
        onRemove={(key, request) => {
          if (request.reason === 'keyboard') {
            request.cancel();
            setLog(`onRemove(${key}, keyboard) — refused; press the x instead`);
            return;
          }
          store.onRemove(key);
          setLog(`onRemove(${key}, pointer)`);
        }}
      />
    </Stack>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The feed keys"
        note="Tab to the first article: PageDown and PageUp move between articles, Control+End leaves to the next control on the page, Control+Home to the selected tab. Delete asks to remove — refused here with the reason keyboard, so focus stays. Enter on a title asks onOpen, refused here, so nothing navigates."
      >
        <Refusing />
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Names, announcements and rings"
        note="The region and the feed are named by the heading, each article by its title. Press Two arrive with focus in the feed and hear 2 new notifications; mark a row read and hear the unread count. The article’s ring is inward, the controls’ outward."
      >
        <Live arrivals="hold" />
      </Scene>
    </Grid>
  ),
};
