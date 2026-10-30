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

export const ANGULAR_NOTIFICATION_CENTER_TOKENS = notificationCenterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlNotificationCenter decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlNotificationCenter, SlNotificationItem, SlNotificationVisual, SlNotificationActions, SlNotificationCenterActions, SlNotificationCenterFooter, SlNotificationCenterEmpty, provideNotificationCenterDefaults } from '@slotted/angular/notification-center';",
  selector:
    'section[slNotificationCenter], ng-template[slNotificationItem], ng-template[slNotificationVisual], ng-template[slNotificationActions], [slNotificationCenterActions], [slNotificationCenterFooter], [slNotificationCenterEmpty]',
  exportAs: 'slNotificationCenter',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section[slNotificationCenter]',
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
      'The ghost Button that asks readRequest for every unread shown key; disabled while nothing is unread.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'On the header, the consumer’s [slNotificationCenterActions] element after mark-all — a preferences link, a menu. On an item, the consumer’s controls for that item under its time, from the slNotificationActions template.',
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
      'The slNotificationVisual template at the small step. For an item with a tone and no visual, the family’s own: the tone’s glyph filled — the tone’s surface as a disc under the ringed glyph, at the avatar’s diameter. Absent when the item has neither.',
  },
  {
    part: 'content',
    element: 'div',
    required: false,
    purpose:
      'Title, description, time, actions, in that order, or what the slNotificationItem template renders. Its first line is centerd on the visual.',
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
      'The check glyph while unread, named messages.markRead; the dot glyph while read, named messages.markUnread. Asks readRequest for this key.',
  },
  {
    part: 'dismiss',
    element: 'button',
    required: false,
    purpose: 'The x glyph, named messages.dismiss. Asks removeRequest for this key.',
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
      'After a feed that holds nothing: the consumer’s [slNotificationCenterEmpty] result-state, or messages.empty — messages.caughtUp under the unread view.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose:
      'The consumer’s [slNotificationCenterFooter] element, centerd. Absent when not written.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Five notifications of the Nexora sales desk over a store that answers every request. Mark one read, dismiss one, switch to Unread, and use the controls below to change the size, the rank, how more loads and which item controls exist.',
    snippet: defineSnippet({
      id: 'notification-center-angular-playground',
      language: 'angular',
      label: 'The center over a store',
      source: `<section
  slNotificationCenter
  [items]="items()"
  [now]="now"
  (readRequest)="markRead($event.keys, $event.read)"
  (removeRequest)="remove($event.key)"
></section>`,
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part, written out',
    note: 'The header with the title, its count and a preferences link; the strip with three views; the feed grouped under Today and Yesterday with an avatar, a family visual and no visual; a button for more; a footer link. Every part the contract names, in one box.',
    snippet: defineSnippet({
      id: 'notification-center-angular-anatomy',
      language: 'angular',
      label: 'The twenty-three parts',
      source: `<section slNotificationCenter growing="button" [items]="items()" [views]="views" [groupBy]="dayOf">
  <div slNotificationCenterActions><a slLink href="/preferences">Preferences</a></div>
  <ng-template slNotificationVisual let-item>
    <span slAvatar decorative [name]="item.data.name" shape="circle" size="sm"></span>
  </ng-template>
  <div slNotificationCenterFooter>
    <a slLink href="/notifications">See all notifications</a>
  </div>
</section>`,
    }),
  },
  {
    id: 'read',
    title: 'Read is the store’s fact',
    note: 'Press the check on an unread row: the family asks readRequest with the key and true, and the row changes only when the store answers. The count in the title and the tab follow the items; mark-all asks for every unread shown key at once and is disabled at zero.',
    snippet: defineSnippet({
      id: 'notification-center-angular-read',
      language: 'ts',
      label: 'Answering a read request',
      source: `class Inbox {
  readonly items = signal<NotificationItem[]>([]);

  markRead(keys: readonly string[], read: boolean) {
    this.items.update((items) =>
      items.map((item) => (keys.includes(item.key) ? { ...item, read } : item)),
    );
  }
}`,
    }),
  },
  {
    id: 'views',
    title: 'Views',
    note: 'The built-in strip: All and Unread, the second with its count; the family filters the unread view itself. Below, the consumer’s own views — the family shows what it is given for each — and a view that refuses to leave All.',
    snippet: defineSnippet({
      id: 'notification-center-angular-views',
      language: 'angular',
      label: 'The consumer’s views, two-way',
      source: `<section
  slNotificationCenter
  [items]="view() === 'mentions' ? mentions() : items()"
  [views]="views()"
  [(view)]="view"
  (viewRequest)="$event.value === 'archived' ? $event.cancel() : null"
></section>`,
    }),
  },
  {
    id: 'arrivals',
    title: 'Arrivals are held while the reader reads',
    note: 'Focus an article, then press Chegam duas: the list stays where it is and a pill counts what arrived. Press the pill — or PageUp from the first article, then Enter — and the two show at the top with focus on the first. Press Chegam duas without focus in the feed and they show at once. Under arrivals="show" nothing is ever held.',
    snippet: defineSnippet({
      id: 'notification-center-angular-arrivals',
      language: 'angular',
      label: 'The hold, and what a reveal asks',
      source: `<section
  slNotificationCenter
  arrivals="hold"
  [items]="items()"
  (revealRequest)="track('notifications.reveal', $event.count, $event.reason)"
></section>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'groupBy files each item under a label — the day here — in the order the items give; the label is a heading one rank below the title and the positions run across the groups.',
    snippet: defineSnippet({
      id: 'notification-center-angular-groups',
      language: 'angular',
      label: 'Filing by day',
      source: `<section slNotificationCenter [items]="items()" [groupBy]="dayOf"></section>`,
    }),
  },
  {
    id: 'growing',
    title: 'Growing',
    note: 'growing="button" draws Load more; press it, the waiting row says Loading notifications and two older items arrive. growing="scroll" replaces the button with a sentinel that asks with the reason scroll when it enters the scrollport. aria-setsize is -1 while more may come and the consumer’s count when stated.',
    snippet: defineSnippet({
      id: 'notification-center-angular-growing',
      language: 'angular',
      label: 'A page at a time',
      source: `<section
  slNotificationCenter
  growing="scroll"
  [count]="total()"
  [items]="items()"
  [loading]="loading()"
  (loadMoreRequest)="loadPage($event.reason)"
></section>`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions and controls',
    note: 'Two slots for the consumer: the header’s actions after mark-all, and an item’s actions under its time. The family’s own two controls are the controls axis: both, read alone, dismiss alone, or none for a feed whose store has no per-item read or removal.',
    snippet: defineSnippet({
      id: 'notification-center-angular-actions',
      language: 'angular',
      label: 'Slots and the controls axis',
      source: `<section slNotificationCenter controls="dismiss" [items]="items()">
  <div slNotificationCenterActions><a slLink href="/preferences">Preferences</a></div>
  <ng-template slNotificationActions let-item>
    @if (item.data.shipment) {
      <button slButton size="sm" type="button">View shipment</button>
    }
  </ng-template>
</section>`,
    }),
  },
  {
    id: 'hosts',
    title: 'Hosts',
    note: 'The bell is a popover trigger with the store’s unread count — the center reports the same through unreadChange while it is mounted; inside, the center at size="sm" with a footer to the page. Open it, press PageDown through the articles, press Escape. The page host is the same family at size="md" with groups.',
    snippet: defineSnippet({
      id: 'notification-center-angular-hosts',
      language: 'angular',
      label: 'In a popover under the bell',
      source: `<ng-container slPopover side="bottom" align="end" size="lg">
  <button
    slButton
    slPopoverTrigger
    type="button"
    [attr.aria-label]="'Notifications, ' + unread() + ' unread'"
  >
    <ng-icon name="lucideBell"></ng-icon>
  </button>
  <ng-template slPopoverLayer>
    <div slPopoverContent aria-label="Notifications">
      <section slNotificationCenter size="sm" level="3" [items]="items()">
        <div slNotificationCenterFooter>
          <a slLink href="/notifications">See all notifications</a>
        </div>
      </section>
    </div>
  </ng-template>
</ng-container>`,
    }),
  },
  {
    id: 'loading',
    title: 'Loading',
    note: 'With nothing loaded, three skeleton rows stand in the item’s inset — a circle for the visual, two lines for the words — hidden from assistive technology, and the feed is busy. With items loaded and more on the way, the waiting row under the feed says so politely.',
    snippet: defineSnippet({
      id: 'notification-center-angular-loading',
      language: 'angular',
      label: 'Before the first page',
      source: `<section slNotificationCenter loading [items]="[]"></section>`,
    }),
  },
  {
    id: 'empty',
    title: 'Empty',
    note: 'A feed with nothing shows messages.empty; the unread view with nothing unread shows messages.caughtUp — All caught up. A [slNotificationCenterEmpty] element replaces both with a result-state of the consumer’s own.',
    snippet: defineSnippet({
      id: 'notification-center-angular-empty',
      language: 'angular',
      label: 'The consumer’s empty page',
      source: `<section slNotificationCenter [items]="[]">
  <section slNotificationCenterEmpty slResultState status="success" reach="inline" live="off">
    <div slResultStateContent>
      <div slResultStateTitle>All caught up</div>
      <p slResultStateDescription>Nothing is waiting for your attention.</p>
    </div>
  </section>
</section>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes and ranks',
    note: 'size="sm" for a popover — the small type steps, tighter insets, the small inner-control box, a 24-pixel family visual and a floor width of 22rem — and "md" for a page. level sets the heading rank: 2 on a page, 3 in a popover under a page’s h2, 4 deeper; group labels take the rank below.',
    snippet: defineSnippet({
      id: 'notification-center-angular-sizes',
      language: 'angular',
      label: 'The popover’s step',
      source: `<section slNotificationCenter size="sm" level="3" [items]="items()"></section>`,
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
    note: 'The families a center is made of: Avatar in the visual template, Button in the item’s actions and in mark-all, Tabs in the strip, Skeleton while loading, ResultState when empty, Link in the header and the footer. The slNotificationItem template substitutes the content of a row — a Badge with the tone here — while the article, its wiring and its controls stay the family’s.',
    snippet: defineSnippet({
      id: 'notification-center-angular-composition',
      language: 'angular',
      label: 'Substituting an item’s content',
      source: `<section slNotificationCenter [items]="items()">
  <ng-template slNotificationItem let-item let-time="time" let-tone="tone" let-ids="ids">
    <span data-part="title" [id]="ids.title">{{ item.title }}</span>
    <span slBadge size="sm" variant="soft" [tone]="tone">{{ item.data.category }}</span>
    <time data-part="time" [attr.datetime]="time.dateTime">{{ time.text }}</time>
  </ng-template>
</section>`,
    }),
  },
  {
    id: 'defaults',
    title: 'Defaults and the instance',
    note: 'Two centers under one provider: neither states a size or a growing mode, and both read small and paged by button; the second states its own controls and wins. The instance, reached through exportAs, focuses the first article, reveals held arrivals and marks every shown item read with the reason programmatic.',
    snippet: defineSnippet({
      id: 'notification-center-angular-defaults',
      language: 'ts',
      label: 'Once, for the application',
      source: `bootstrapApplication(App, {
  providers: [
    provideNotificationCenterDefaults({
      growing: 'button',
      size: 'sm',
      timeZone: 'Europe/Lisbon',
    }),
  ],
});`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Tab reaches mark-all, the selected tab, fresh, then each article and the two controls inside it, then more and the footer. On an article: PageDown and PageUp move between articles, PageUp on the first reaches fresh, Control+End and Control+Home leave the feed, Delete asks to remove with the reason keyboard and moves focus to the neighbour. Enter on the title asks openRequest before the link navigates.',
    snippet: defineSnippet({
      id: 'notification-center-angular-keyboard',
      language: 'angular',
      label: 'Refusing a removal, refusing a navigation',
      source: `<section
  slNotificationCenter
  [items]="items()"
  (openRequest)="canOpen($event.key) || $event.cancel()"
  (removeRequest)="
    $event.reason === 'keyboard' && !confirmed($event.key) ? $event.cancel() : remove($event.key)
  "
></section>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    note: 'The region is named by its heading, the feed by the same, every article by its title and described by its body; the tabs name the feed. Held arrivals and the unread count are announced politely once per change. Read the ring on an article — inward, because the rows touch — and on a control — outward.',
    snippet: defineSnippet({
      id: 'notification-center-angular-accessibility',
      language: 'angular',
      label: 'The consumer’s own name',
      source: `<section slNotificationCenter aria-label="Sales team inbox" [items]="items()"></section>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'viewRequest',
    payload: 'ChangeRequest<string | undefined>',
    when: 'Before the view moves. The request carries the new value, the value it replaces, the reason — pointer or keyboard from the strip, programmatic from selectView() — the originating event as source, and cancel(), which refuses the move before the model is written.',
  },
  {
    name: 'viewChange',
    payload: 'string | undefined',
    when: 'After the view moved: the model’s own output, for [(view)].',
  },
  {
    name: 'readRequest',
    payload: '{ keys, read, reason, event?, cancelled, cancel() }',
    when: 'When the reader presses a read-toggle (one key), mark-all (every unread shown key) or the instance’s markAllRead() — reasons pointer, keyboard, programmatic. The family marks nothing itself: the store answers by changing items.',
  },
  {
    name: 'removeRequest',
    payload: '{ key, reason, event?, cancelled, cancel() }',
    when: 'When the reader presses dismiss, or Delete on an article — reasons pointer, keyboard. Cancelling a keyboard removal keeps focus where it is; otherwise focus moves to the next article, the previous, or the first control of the region.',
  },
  {
    name: 'openRequest',
    payload: '{ key, reason, event?, cancelled, cancel() }',
    when: 'Before a title link navigates — reasons pointer, keyboard. cancel() prevents the navigation.',
  },
  {
    name: 'revealRequest',
    payload: '{ count, reason, event?, cancelled, cancel() }',
    when: 'Before held arrivals are shown: a press of fresh (pointer, keyboard) or the instance’s reveal() (programmatic). A keyboard reveal moves focus to the first revealed article.',
  },
  {
    name: 'loadMoreRequest',
    payload: '{ reason, event?, cancelled, cancel() }',
    when: 'When the reader presses more (pointer, keyboard) or the sentinel enters the scrollport (scroll). The consumer loads the page and appends to items.',
  },
  {
    name: 'unreadChange',
    payload: 'number',
    when: 'A fact, not a request: on the first render and whenever the unread count among items changes, for the bell in the top navigation.',
  },
  {
    name: '(keydown), (click), (focus) on the host',
    payload: 'the element’s own events',
    when: 'Whenever the section fires them. The feed keys are handled on the feed, and a defaultPrevented keydown is left alone.',
  },
];

export const ANGULAR_NOTIFICATION_CENTER_DOCS = {
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
        'SlNotificationCenter',
        'The consumer’s array: key, title, description, time (a PlainDateTime or an ISO instant), read, href, tone, data. Required. The family holds none of its facts',
      ],
      [
        'view',
        'string | undefined',
        'all',
        'SlNotificationCenter',
        'The current view, as a model: [(view)] for two-way, [view] alone to read. all shows every shown item; unread the ones whose read is false; any other value what the consumer gave',
      ],
      [
        'defaultView',
        'string',
        '—',
        'SlNotificationCenter',
        'The view an unbound center starts on, read once. With neither, the first entry of views',
      ],
      [
        'views',
        'readonly { value, label, count? }[]',
        'all, unread',
        'SlNotificationCenter',
        'The strip’s entries. Unstated, the built-in All and Unread with the unread count; one entry draws no strip',
      ],
      [
        'size',
        "'sm' | 'md'",
        'md',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'sm for the popover: the small type steps, tighter insets, the small inner-control box, a floor width of 22rem. md for the page',
      ],
      [
        'level',
        "'2' | '3' | '4'",
        '2',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'The rank of the header’s heading; group labels take the rank below',
      ],
      [
        'growing',
        "'none' | 'button' | 'scroll'",
        'none',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'How more is loaded: never, on a button, or when the sentinel under the feed enters the scrollport',
      ],
      [
        'arrivals',
        "'hold' | 'show'",
        'hold',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'Whether a key that arrives while focus is in the feed or the feed’s scroller is past its start waits behind fresh. show holds nothing',
      ],
      [
        'timeFormat',
        "'relative' | 'absolute'",
        'relative',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'How time is written: 2 hours ago with the absolute reading in title, or the absolute reading alone',
      ],
      [
        'controls',
        "'both' | 'read' | 'dismiss' | 'none'",
        'both',
        'SlNotificationCenter, provideNotificationCenterDefaults',
        'Which of the family’s two item controls are drawn',
      ],
      [
        'loading',
        'boolean',
        'false',
        'SlNotificationCenter',
        'aria-busy on the feed and data-loading on the host; skeleton rows while nothing is loaded, the waiting row under the feed otherwise',
      ],
      [
        'count',
        'number',
        '—',
        'SlNotificationCenter',
        'How many items exist in all, for aria-setsize. Unstated, the loaded number under growing="none" and -1 while more may come',
      ],
      [
        'groupBy',
        '(item) => string',
        '—',
        'SlNotificationCenter',
        'Files each item under a label, in the order the labels first appear; each group gets a heading one rank below the title',
      ],
      [
        'locale, timeZone, now',
        'string, string, number',
        'the language in force, the runtime’s',
        'SlNotificationCenter, provideNotificationCenterDefaults (timeZone)',
        'What the time is formatted with. State now for a stable server render of a relative time',
      ],
      [
        'messages',
        'PartialMessages<NotificationCenterMessages>',
        '—',
        'SlNotificationCenter',
        'Words laid over the language in force, key by key: title, markAll, markRead, markUnread, dismiss, fresh {count}, unread {count}, loadMore, loading, empty, caughtUp, all, unreadView, views',
      ],
      [
        '[slNotificationCenterActions], [slNotificationCenterFooter], [slNotificationCenterEmpty]',
        'projected elements',
        '—',
        'inside the host',
        'The consumer’s controls in the header after mark-all; the link from the popover to the page; the result-state in place of the family’s empty words',
      ],
      [
        'ng-template[slNotificationItem], [slNotificationVisual], [slNotificationActions]',
        'templates with NotificationItemContext',
        '—',
        'inside the host',
        'The item’s content, its visual, its actions. The context carries the item as $implicit, the position, the resolved tone, the formatted time and the ids for the title and the description; the article, its wiring and its controls stay the family’s',
      ],
      [
        'exportAs slNotificationCenter',
        'SlNotificationCenter',
        '—',
        'a template reference',
        'focus(), which lands on fresh when arrivals are held and on the first article otherwise; reveal(); markAllRead(); selectView(value, reason) — the last three with the reason programmatic when unstated',
      ],
      [
        'provideNotificationCenterDefaults',
        '{ size, level, growing, arrivals, timeFormat, controls, timeZone }',
        '—',
        'an injector',
        'The decisions an application takes once. A center that states any of them itself still wins',
      ],
      [
        'host attributes',
        'section[slNotificationCenter]',
        '—',
        'SlNotificationCenter',
        'aria-*, data-*, class, style and listeners reach the section; a consumer’s aria-label or aria-labelledby written on the element replaces the title wiring',
      ],
    ]),
    accessibility: [
      'The governing pattern is the WAI-ARIA Authoring Practices Feed (w3.org/WAI/ARIA/apg/patterns/feed/): the feed is role="feed" named by the title, every item is an article with tabindex="0", aria-labelledby its title, aria-describedby its description, aria-posinset its position and aria-setsize the consumer’s count, the loaded number under growing="none", or -1 while more may come. PageDown and PageUp move between articles, Control+End and Control+Home leave the feed on either side, and the feed is aria-busy while a page is on its way. The keys are @slotted/core/timeline’s, shared with the timeline family.',
      'The root is a section — a region — named by aria-labelledby its own heading, Notifications in English, so a reader finds it in the landmark list under the words it shows; a consumer’s aria-label or aria-labelledby written on the element wins. The strip is the tabs family’s list with the feed as its one panel: every tab carries aria-controls naming the feed, and ArrowLeft, ArrowRight, Home and End are the tabs family’s.',
      'Read is said three ways and none of them is color alone: the wash under the row, the semibold title, and the read-toggle’s name — Mark as read while unread, Mark as unread once read — so a reader hears the state on the control that changes it. The family’s tone glyphs are all circles; a triangle is refused in this library.',
      'Held arrivals are announced politely once per change of their count, and the unread count once per change after the first, through the shared live announcer. A keyboard reveal moves focus to the first revealed article; a keyboard removal moves it to the next article, the previous, or the first control of the region, so focus never lands on a row that left.',
      'While loading with nothing loaded, the three skeleton rows are aria-hidden and the feed is busy; the tabs stay, because the views are known before the items are. The article’s focus ring is drawn inward because the rows touch, and every control’s ring outward; the controls are muted at rest and take the text ink on the row under the pointer or holding focus, so they are visible before they are needed and legible when they are.',
    ],
    snippets: [
      defineSnippet({
        id: 'notification-center-angular-dom',
        language: 'angular',
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
  aria-labelledby="slotted-notification-center-1-title"
>
  <div data-part="header">
    <h2 data-part="title" id="slotted-notification-center-1-title">
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
  <div
    data-part="feed"
    role="feed"
    id="slotted-notification-center-1-feed"
    aria-labelledby="slotted-notification-center-1-title"
  >
    <div data-part="group">
      <h3 data-part="group-label">Today</h3>
      <article
        data-part="item"
        tabindex="0"
        data-key="so-01842-partial"
        data-tone="warning"
        aria-labelledby="slotted-notification-center-1-so-01842-partial-t"
        aria-describedby="slotted-notification-center-1-so-01842-partial-d"
        aria-posinset="1"
        aria-setsize="5"
      >
        <span data-part="visual">…</span>
        <div data-part="content">
          <a
            data-part="title"
            id="slotted-notification-center-1-so-01842-partial-t"
            href="/orders/SO-2026-01842"
          >
            …
          </a>
          <p data-part="description" id="slotted-notification-center-1-so-01842-partial-d">…</p>
          <time data-part="time" datetime="2026-09-17T08:20:00Z">2 hours ago</time>
          <div data-part="actions">…</div>
        </div>
        <div data-part="controls">
          <button data-part="read-toggle" aria-label="Mark as read"></button>
          <button data-part="dismiss" aria-label="Dismiss"></button>
        </div>
      </article>
    </div>
  </div>
  <button data-part="more">Load more</button>
  <div data-part="footer">…</div>
</section>`,
      }),
      defineSnippet({
        id: 'notification-center-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='notification-center'] {
  --slotted-notification-center-inset-inline-md: var(--slotted-space-7);
  --slotted-notification-center-title-size-md: var(--slotted-font-size-xl);
  --slotted-notification-center-border: var(--slotted-border-strong);
  --slotted-notification-center-min-inline-size-sm: 20rem;
}`,
      }),
    ],
  },
} as const;
