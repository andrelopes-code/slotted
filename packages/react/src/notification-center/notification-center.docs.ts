import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import notificationCenterTokens from '@slotted/styles/notification-center/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_NOTIFICATION_CENTER_TOKENS = notificationCenterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned NotificationCenter decision',
}));

const imports: ReferenceImport = {
  source:
    "import { NotificationCenter, NotificationCenterDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section, or the element render returns',
    required: true,
    purpose:
      'The region, carrying data-ui="notification-center", the seven axes as data attributes, data-loading, and aria-labelledby the title. It is the container query every breakpoint reads.',
  },
  {
    part: 'header',
    element: 'div',
    required: true,
    purpose:
      'The row above the views: the title with the unread count, mark-all, and the consumer’s actions. A control that wraps lands at the end of its own line.',
  },
  {
    part: 'title',
    element: 'h2, h3 or h4 per level; on an item, a or span',
    required: true,
    purpose:
      'On the header, the heading messages.title names the region and the feed by. On an item, the words that name it — a link when href, text otherwise — clamped at two lines with the whole text kept.',
  },
  {
    part: 'count',
    element: 'span',
    required: false,
    purpose:
      'A chip beside words on the type scale’s smallest step, in tabular figures: the unread total after the header’s title in the accent pair, a view’s count in its tab. One measure for both dimensions, so a single digit is a circle. Absent at zero.',
  },
  {
    part: 'mark-all',
    element: 'span around a Button',
    required: true,
    purpose:
      'The ghost Button that asks onReadChange for every unread shown key; disabled while nothing is unread.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'On the header, the consumer’s own controls after mark-all — a preferences link, a menu. On an item, the consumer’s controls for that item under its time, from the item’s actions field.',
  },
  {
    part: 'views',
    element: 'div around a Tabs list',
    required: false,
    purpose:
      'The strip over views — the tabs family with its list alone and no track, every tab naming the feed with aria-controls. Absent when views holds one entry.',
  },
  {
    part: 'fresh',
    element: 'button',
    required: false,
    purpose:
      'The held arrivals: a pill in the accent pair naming their count, between the strip and the feed. Present while keys are held; PageUp from the first article reaches it.',
  },
  {
    part: 'feed',
    element: 'div',
    required: true,
    purpose:
      'role="feed", aria-labelledby the title, aria-busy while loading, the id every tab controls. The keys of the pattern are handled here.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose:
      'Under groupBy: the items filed under one label, in the order the labels first appear.',
  },
  {
    part: 'group-label',
    element: 'h3, h4 or h5 — one rank below the title',
    required: false,
    purpose: 'The heading of a group, in small capitals on the muted ink.',
  },
  {
    part: 'item',
    element: 'article',
    required: false,
    purpose:
      'One notification: tabindex="0", aria-labelledby its title, aria-describedby its description, aria-posinset and aria-setsize, data-key, data-tone, data-read once read. Unread stands on a wash in the tone with a semibold title.',
  },
  {
    part: 'visual',
    element: 'span',
    required: false,
    purpose:
      'The consumer’s avatar or icon at the small step. For an item with a tone and no visual, the family’s own: the tone’s glyph filled — the tone’s surface as a disc under the ringed glyph, at the avatar’s diameter. Absent when the item has neither.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'Title, description, time, actions, in that order, or what renderItem returns. Its first line is centerd on the visual.',
  },
  {
    part: 'description',
    element: 'p',
    required: false,
    purpose: 'The body, clamped at three lines with the whole text kept in the DOM.',
  },
  {
    part: 'time',
    element: 'time',
    required: false,
    purpose:
      'datetime holds the ISO value; the words are relative — 2 hours ago — with the absolute reading in title, or absolute under timeFormat="absolute".',
  },
  {
    part: 'controls',
    element: 'div',
    required: false,
    purpose:
      'The family’s two controls at the inline end, muted at rest and in the text ink on the row under the pointer or holding focus. Each opens a tooltip with its name on hover, on keyboard focus and on a held touch. Which exist is the controls axis; below 320 pixels they drop under the content, and under a coarse pointer they grow to the comfortable target.',
  },
  {
    part: 'read-toggle',
    element: 'button',
    required: false,
    purpose:
      'The check glyph while unread, named messages.markRead; the dot glyph while read, named messages.markUnread. Asks onReadChange for this key.',
  },
  {
    part: 'dismiss',
    element: 'button',
    required: false,
    purpose: 'The x glyph, named messages.dismiss. Asks onRemove for this key.',
  },
  {
    part: 'more',
    element: 'button, or div',
    required: false,
    purpose:
      'Under growing="button" the button asking for the next page; under "scroll" the sentinel an IntersectionObserver watches; while loading with items shown, the polite waiting row. Absent under "none".',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'After a feed that holds nothing: the consumer’s ResultState from the empty prop, or messages.empty — messages.caughtUp under the unread view.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'The consumer’s link from the popover to the page, centerd. Absent when not written.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Five notifications of the Nexora sales desk over a store that answers every request. Mark one read, dismiss one, switch to Unread, and use the controls below to change the size, the rank, how more loads and which item controls exist.',
    snippet: defineSnippet({
      id: 'notification-center-react-playground',
      language: 'tsx',
      label: 'The center over a store',
      source: `<NotificationCenter
  items={items}
  now={now}
  onReadChange={({ keys, read }) => markRead(keys, read)}
  onRemove={(key) => remove(key)}
/>;`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The header with the title, its count and a preferences link; the strip with three views; the feed grouped under Today and Yesterday with an avatar, a family visual and no visual; a button for more; a footer link. Every part the contract names, in one box.',
    snippet: defineSnippet({
      id: 'notification-center-react-anatomy',
      language: 'tsx',
      label: 'The twenty-three parts',
      source: `<NotificationCenter
  actions={<Link href="/preferences">Preferences</Link>}
  footer={<Link href="/notifications">See all notifications</Link>}
  groupBy={dayOf}
  growing="button"
  items={items}
  views={views}
/>;`,
    }),
  },
  {
    id: 'read',
    title: 'Read is the store’s fact',
    note: 'Press the check on an unread row: the family asks onReadChange with the key and true, and the row changes only when the store answers. The count in the title and the tab follow the items; mark-all asks for every unread shown key at once and is disabled at zero.',
    snippet: defineSnippet({
      id: 'notification-center-react-read',
      language: 'tsx',
      label: 'Answering a read request',
      source: `const onReadChange = ({ keys, read }: NotificationCenterReadChange) =>
  setItems((items) => items.map((item) => (keys.includes(item.key) ? { ...item, read } : item)));`,
    }),
  },
  {
    id: 'views',
    title: 'Views',
    note: 'The built-in strip: All and Unread, the second with its count; the family filters the unread view itself. Below, the consumer’s own views — the family shows what it is given for each — and a controlled view that refuses to leave All.',
    snippet: defineSnippet({
      id: 'notification-center-react-views',
      language: 'tsx',
      label: 'The consumer’s views, controlled',
      source: `<NotificationCenter
  items={view === 'mentions' ? mentions : items}
  onViewChange={(next, request) => {
    if (next === 'archived') request.cancel();
    else setView(next);
  }}
  view={view}
  views={[
    { value: 'all', label: 'All' },
    { value: 'mentions', label: 'Mentions', count: mentions.length },
    { value: 'archived', label: 'Archived' },
  ]}
/>;`,
    }),
  },
  {
    id: 'arrivals',
    title: 'Arrivals are held while the reader reads',
    note: 'Focus an article, then press Chegam duas: the list stays where it is and a pill counts what arrived. Press the pill — or PageUp from the first article, then Enter — and the two show at the top with focus on the first. Press Chegam duas without focus in the feed and they show at once. Under arrivals="show" nothing is ever held.',
    snippet: defineSnippet({
      id: 'notification-center-react-arrivals',
      language: 'tsx',
      label: 'The hold, and what a reveal asks',
      source: `<NotificationCenter
  arrivals="hold"
  items={items}
  onReveal={(count, request) =>
    analytics.track('notifications.reveal', { count, reason: request.reason })
  }
/>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'groupBy files each item under a label — the day here — in the order the items give; the label is a heading one rank below the title and the positions run across the groups.',
    snippet: defineSnippet({
      id: 'notification-center-react-groups',
      language: 'tsx',
      label: 'Filing by day',
      source: `<NotificationCenter
  groupBy={(item) => (isToday(item.time) ? 'Today' : 'Yesterday')}
  items={items}
/>;`,
    }),
  },
  {
    id: 'growing',
    title: 'Growing',
    note: 'growing="button" draws Load more; press it, the waiting row says Loading notifications and two older items arrive. growing="scroll" replaces the button with a sentinel that asks with the reason scroll when it enters the scrollport. aria-setsize is -1 while more may come and the consumer’s count when stated.',
    snippet: defineSnippet({
      id: 'notification-center-react-growing',
      language: 'tsx',
      label: 'A page at a time',
      source: `<NotificationCenter
  count={total}
  growing="scroll"
  items={items}
  loading={loading}
  onLoadMore={(request) => loadPage(request.reason)}
/>;`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions and controls',
    note: 'Two slots for the consumer: the header’s actions after mark-all, and an item’s actions under its time. The family’s own two controls are the controls axis: both, read alone, dismiss alone, or none for a feed whose store has no per-item read or removal.',
    snippet: defineSnippet({
      id: 'notification-center-react-actions',
      language: 'tsx',
      label: 'Slots and the controls axis',
      source: `<NotificationCenter
  actions={<Link href="/preferences">Preferences</Link>}
  controls="dismiss"
  items={items.map((item) => ({
    ...item,
    actions: item.shipment ? <Button size="sm">View shipment</Button> : undefined,
  }))}
/>;`,
    }),
  },
  {
    id: 'hosts',
    title: 'Hosts',
    note: 'The bell is a Popover trigger with the unread count the family reports through onUnreadChange; inside, the center at size="sm" with a footer to the page. Open it, press PageDown through the articles, press Escape. The page host is the same family at size="md" with groups.',
    snippet: defineSnippet({
      id: 'notification-center-react-hosts',
      language: 'tsx',
      label: 'In a popover under the bell',
      source: `<Popover>
  <PopoverTrigger
    render={(props) => (
      <Button {...props} aria-label={\`Notifications, \${unread} unread\`}>
        <BellIcon />
      </Button>
    )}
  />
  <PopoverLayer>
    <PopoverContent aria-label="Notifications">
      <NotificationCenter
        footer={<Link href="/notifications">See all notifications</Link>}
        items={items}
        onUnreadChange={setUnread}
        size="sm"
      />
    </PopoverContent>
  </PopoverLayer>
</Popover>;`,
    }),
  },
  {
    id: 'loading',
    title: 'Loading',
    note: 'With nothing loaded, three skeleton rows stand in the item’s inset — a circle for the visual, two lines for the words — hidden from assistive technology, and the feed is busy. With items loaded and more on the way, the waiting row under the feed says so politely.',
    snippet: defineSnippet({
      id: 'notification-center-react-loading',
      language: 'tsx',
      label: 'Before the first page',
      source: `<NotificationCenter items={[]} loading />;`,
    }),
  },
  {
    id: 'empty',
    title: 'Empty',
    note: 'A feed with nothing shows messages.empty; the unread view with nothing unread shows messages.caughtUp — All caught up. The empty prop replaces both with a ResultState of the consumer’s own.',
    snippet: defineSnippet({
      id: 'notification-center-react-empty',
      language: 'tsx',
      label: 'The consumer’s empty page',
      source: `<NotificationCenter
  empty={
    <ResultState reach="inline" status="success">
      <ResultStateContent>
        <ResultStateTitle>All read</ResultStateTitle>
        <ResultStateDescription>Nothing is waiting for your attention.</ResultStateDescription>
      </ResultStateContent>
    </ResultState>
  }
  items={[]}
/>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes and ranks',
    note: 'size="sm" for a popover — the small type steps, tighter insets, the small inner-control box, a 24-pixel family visual — and "md" for a page. level sets the heading rank: 2 on a page, 3 in a popover under a page’s h2, 4 deeper; group labels take the rank below.',
    snippet: defineSnippet({
      id: 'notification-center-react-sizes',
      language: 'tsx',
      label: 'The popover’s step',
      source: `<NotificationCenter items={items} level="3" size="sm" />;`,
    }),
  },
  {
    id: 'content',
    title: 'Extreme content',
    note: 'A title of thirty words clamps at two lines, a description at three, and the whole text stays in the DOM; a reference with no spaces breaks at any character. Below 320 pixels the controls drop under the content instead of squeezing it; the phone room shows the header wrapping.',
    snippet: defineSnippet({
      id: 'notification-center-clamps',
      language: 'css',
      label: 'Retuning the clamps',
      source: `[data-ui='notification-center'] {
  --slotted-notification-center-title-clamp: 1;
  --slotted-notification-center-description-clamp: 2;
}`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The families a center is made of: Avatar in the visual, Button in the item’s actions and in mark-all, Tabs in the strip, Skeleton while loading, ResultState when empty, Link in the header and the footer. renderItem substitutes the content of a row — a Text and a Badge here — while the article, its wiring and its controls stay the family’s.',
    snippet: defineSnippet({
      id: 'notification-center-react-composition',
      language: 'tsx',
      label: 'Substituting an item’s content',
      source: `<NotificationCenter
  items={items}
  renderItem={(item, state) => (
    <>
      <span data-part="title" id={state.ids.title}>
        {item.title}
      </span>
      <Badge size="sm" tone={state.tone} variant="soft">
        {item.category}
      </Badge>
      <time data-part="time" dateTime={state.time.dateTime}>
        {state.time.text}
      </time>
    </>
  )}
/>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'Defaults and the handle',
    note: 'Two centers under one provider: neither states a size or a growing mode, and both read small and paged by button; the second states its own controls and wins. The handle focuses the first article, reveals held arrivals and marks every shown item read with the reason programmatic.',
    snippet: defineSnippet({
      id: 'notification-center-react-defaults',
      language: 'tsx',
      label: 'Once, for the application',
      source: `<NotificationCenterDefaultsProvider growing="button" size="sm" timeZone="Europe/Lisbon">
  <App />
</NotificationCenterDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches mark-all, the selected tab, fresh, then each article and the two controls inside it, then more and the footer. On an article: PageDown and PageUp move between articles, PageUp on the first reaches fresh, Control+End and Control+Home leave the feed, Delete asks to remove with the reason keyboard and moves focus to the neighbour. Enter on the title asks onOpen before the link navigates.',
    snippet: defineSnippet({
      id: 'notification-center-react-keyboard',
      language: 'tsx',
      label: 'Refusing a removal, refusing a navigation',
      source: `<NotificationCenter
  items={items}
  onOpen={(key, request) => {
    if (!canOpen(key)) request.cancel();
  }}
  onRemove={(key, request) => {
    if (request.reason === 'keyboard' && !confirmed(key)) request.cancel();
    else remove(key);
  }}
/>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    note: 'The region is named by its heading, the feed by the same, every article by its title and described by its body; the tabs name the feed. Held arrivals and the unread count are announced politely once per change. Read the ring on an article — inward, because the rows touch — and on a control — outward.',
    snippet: defineSnippet({
      id: 'notification-center-react-accessibility',
      language: 'tsx',
      label: 'The consumer’s own name',
      source: `<NotificationCenter aria-label="Sales team inbox" items={items} />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onViewChange',
    payload: '(view: string, request: ChangeRequest<string>)',
    when: 'Before the view moves. The request carries the new value, the value it replaces, the reason — pointer or keyboard from the strip, programmatic from the consumer — the originating event, and cancel(), which refuses the move before anything commits.',
  },
  {
    name: 'onReadChange',
    payload: '({ keys, read }, request: { reason, source, cancelled, cancel() })',
    when: 'When the reader presses a read-toggle (one key), mark-all (every unread shown key) or the handle’s markAllRead() — reasons pointer, keyboard, programmatic. The family marks nothing itself: the store answers by changing items.',
  },
  {
    name: 'onRemove',
    payload: '(key: string, request: { reason, source, cancelled, cancel() })',
    when: 'When the reader presses dismiss, or Delete on an article — reasons pointer, keyboard. Cancelling a keyboard removal keeps focus where it is; otherwise focus moves to the next article, the previous, or the first control of the region.',
  },
  {
    name: 'onOpen',
    payload: '(key: string, request: { reason, source, cancelled, cancel() })',
    when: 'Before a title link navigates — reasons pointer, keyboard. cancel() prevents the navigation.',
  },
  {
    name: 'onReveal',
    payload: '(count: number, request: { reason, source, cancelled, cancel() })',
    when: 'Before held arrivals are shown: a press of fresh (pointer, keyboard) or the handle’s reveal() (programmatic). A keyboard reveal moves focus to the first revealed article.',
  },
  {
    name: 'onLoadMore',
    payload: '(request: { reason, source, cancelled, cancel() })',
    when: 'When the reader presses more (pointer, keyboard) or the sentinel enters the scrollport (scroll). The consumer loads the page and appends to items.',
  },
  {
    name: 'onUnreadChange',
    payload: '(count: number)',
    when: 'A fact, not a request: on mount and whenever the unread count among items changes, for the bell in the top navigation.',
  },
  {
    name: 'onKeyDown, onClick, onFocus on the root',
    payload: 'the element’s own events',
    when: 'Whenever the section fires them. The consumer’s onKeyDown runs before the feed keys, and a defaultPrevented event stops them.',
  },
];

export const REACT_NOTIFICATION_CENTER_DOCS = {
  notificationCenter: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'items',
        'readonly NotificationItem[]',
        '—',
        'NotificationCenter',
        'The consumer’s array: key, title, description, time (a PlainDateTime or an ISO instant), read, href, tone, visual, actions. The family holds none of its facts',
      ],
      [
        'view',
        'string',
        'all',
        'NotificationCenter',
        'Present means the consumer owns the view, for the life of the component. all shows every shown item; unread the ones whose read is false; any other value what the consumer gave',
      ],
      [
        'defaultView',
        'string',
        '—',
        'NotificationCenter',
        'The view an uncontrolled center starts on, read once. With neither, the first entry of views',
      ],
      [
        'views',
        'readonly { value, label, count? }[]',
        'all, unread',
        'NotificationCenter',
        'The strip’s entries. Unstated, the built-in All and Unread with the unread count; one entry draws no strip',
      ],
      [
        'size',
        "'sm' | 'md'",
        'md',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'sm for the popover: the small type steps, tighter insets, the small inner-control box. md for the page',
      ],
      [
        'level',
        "'2' | '3' | '4'",
        '2',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'The rank of the header’s heading; group labels take the rank below',
      ],
      [
        'growing',
        "'none' | 'button' | 'scroll'",
        'none',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'How more is loaded: never, on a button, or when the sentinel under the feed enters the scrollport',
      ],
      [
        'arrivals',
        "'hold' | 'show'",
        'hold',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'Whether a key that arrives while focus is in the feed or the feed’s scroller is past its start waits behind fresh. show holds nothing',
      ],
      [
        'timeFormat',
        "'relative' | 'absolute'",
        'relative',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'How time is written: 2 hours ago with the absolute reading in title, or the absolute reading alone',
      ],
      [
        'controls',
        "'both' | 'read' | 'dismiss' | 'none'",
        'both',
        'NotificationCenter, NotificationCenterDefaultsProvider',
        'Which of the family’s two item controls are drawn',
      ],
      [
        'loading',
        'boolean',
        'false',
        'NotificationCenter',
        'aria-busy on the feed and data-loading on the root; skeleton rows while nothing is loaded, the waiting row under the feed otherwise',
      ],
      [
        'count',
        'number',
        '—',
        'NotificationCenter',
        'How many items exist in all, for aria-setsize. Unstated, the loaded number under growing="none" and -1 while more may come',
      ],
      [
        'groupBy',
        '(item) => ReactNode',
        '—',
        'NotificationCenter',
        'Files each item under a label, in the order the labels first appear; each group gets a heading one rank below the title',
      ],
      [
        'locale, timeZone, now',
        'string, string, number',
        'the language in force, the runtime’s',
        'NotificationCenter, NotificationCenterDefaultsProvider (timeZone)',
        'What the time is formatted with. State now for a stable server render of a relative time',
      ],
      [
        'messages',
        'PartialMessages<NotificationCenterMessages>',
        '—',
        'NotificationCenter',
        'Words laid over the language in force, key by key: title, markAll, markRead, markUnread, dismiss, fresh {count}, unread {count}, loadMore, loading, empty, caughtUp, all, unreadView, views',
      ],
      [
        'actions, footer, empty',
        'ReactNode',
        '—',
        'NotificationCenter',
        'The consumer’s controls in the header after mark-all; the link from the popover to the page; the ResultState in place of the family’s empty words',
      ],
      [
        'renderItem',
        '(item, state) => ReactNode',
        '—',
        'NotificationCenter',
        'Substitutes an item’s content. state carries the position, the resolved tone, the formatted time and the ids for the title and the description; the article, its wiring and its controls stay the family’s',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'NotificationCenter',
        'Substitutes the root element and hands it every attribute, the ref callback included',
      ],
      [
        'ref',
        'Ref<NotificationCenterHandle>',
        '—',
        'NotificationCenter',
        'The element; focus(), which lands on fresh when arrivals are held and on the first article otherwise; reveal(); markAllRead() — the last two with the reason programmatic',
      ],
      [
        'NotificationCenterDefaultsProvider',
        '{ size, level, growing, arrivals, timeFormat, controls, timeZone }',
        '—',
        'a subtree',
        'The decisions an application takes once. A center that states any of them itself still wins',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"section">',
        '—',
        'NotificationCenter',
        'aria-*, data-*, className, style and handlers reach the section; a consumer’s aria-label or aria-labelledby replaces the title wiring',
      ],
    ]),
    accessibility: [
      'The governing pattern is the WAI-ARIA Authoring Practices Feed (w3.org/WAI/ARIA/apg/patterns/feed/): the feed is role="feed" named by the title, every item is an article with tabindex="0", aria-labelledby its title, aria-describedby its description, aria-posinset its position and aria-setsize the consumer’s count, the loaded number under growing="none", or -1 while more may come. PageDown and PageUp move between articles, Control+End and Control+Home leave the feed on either side, and the feed is aria-busy while a page is on its way. The keys are @slotted/core/timeline’s, shared with the timeline family.',
      'The root is a section — a region — named by aria-labelledby its own heading, Notifications in English, so a reader finds it in the landmark list under the words it shows; a consumer’s aria-label or aria-labelledby wins. The strip is the tabs family’s list with the feed as its one panel: every tab carries aria-controls naming the feed, and ArrowLeft, ArrowRight, Home and End are the tabs family’s.',
      'Read is said three ways and none of them is color alone: the wash under the row, the semibold title, and the read-toggle’s name — Mark as read while unread, Mark as unread once read — so a reader hears the state on the control that changes it. The family’s tone glyphs are all circles; a triangle is refused in this library.',
      'Held arrivals are announced politely once per change of their count, and the unread count once per change after the first, through the shared live announcer. A keyboard reveal moves focus to the first revealed article; a keyboard removal moves it to the next article, the previous, or the first control of the region, so focus never lands on a row that left.',
      'While loading with nothing loaded, the three skeleton rows are aria-hidden and the feed is busy; the tabs stay, because the views are known before the items are. The article’s focus ring is drawn inward because the rows touch, and every control’s ring outward; the controls are muted at rest and take the text ink on the row under the pointer or holding focus, so they are visible before they are needed and legible when they are.',
    ],
    snippets: [
      defineSnippet({
        id: 'notification-center-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section
  data-ui="notification-center"
  data-part="root"
  data-size="md"
  data-level="2"
  data-growing="none"
  data-arrivals="hold"
  data-time-format="relative"
  data-controls="both"
  data-view="all"
  aria-labelledby=":r1:-title"
>
  <div data-part="header">
    <h2 data-part="title" id=":r1:-title">
      Notifications <span data-part="count">3</span>
    </h2>
    <span data-part="mark-all">
      <button data-ui="button">Mark all as read</button>
    </span>
    <div data-part="actions">…</div>
  </div>
  <div data-part="views">
    <div data-ui="tabs">…</div>
  </div>
  <div data-part="feed" role="feed" id=":r1:-feed" aria-labelledby=":r1:-title">
    <div data-part="group">
      <h3 data-part="group-label">Today</h3>
      <article
        data-part="item"
        tabindex="0"
        data-key="so-01842-partial"
        data-tone="warning"
        aria-labelledby=":r1:-so-01842-partial-t"
        aria-describedby=":r1:-so-01842-partial-d"
        aria-posinset="1"
        aria-setsize="5"
      >
        <span data-part="visual">…</span>
        <div data-part="content">
          <a data-part="title" id=":r1:-so-01842-partial-t" href="/orders/SO-2026-01842">
            …
          </a>
          <p data-part="description" id=":r1:-so-01842-partial-d">
            …
          </p>
          <time data-part="time" datetime="2026-09-17T08:20:00Z">
            2 hours ago
          </time>
          <div data-part="actions">…</div>
        </div>
        <div data-part="controls">
          <button data-part="read-toggle" aria-label="Mark as read" />
          <button data-part="dismiss" aria-label="Dismiss" />
        </div>
      </article>
    </div>
  </div>
  <button data-part="more">Load more</button>
  <div data-part="footer">…</div>
</section>;`,
      }),
      defineSnippet({
        id: 'notification-center-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='notification-center'] {
  --slotted-notification-center-inset-inline-md: var(--slotted-space-7);
  --slotted-notification-center-title-size-md: var(--slotted-font-size-xl);
  --slotted-notification-center-border: var(--slotted-border-strong);
  --slotted-notification-center-title-clamp: 1;
}`,
      }),
    ],
  },
} as const;
