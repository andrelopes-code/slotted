import timelineTokens from '@slotted/styles/timeline/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TIMELINE_TOKENS = timelineTokens.map((name) => ({
  name,
  purpose: 'Theme decision about the timeline',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlTimeline,\n  SlTimelineActions,\n  SlTimelineActor,\n  SlTimelineDescription,\n  SlTimelineGroup,\n  SlTimelineGroupList,\n  SlTimelineItem,\n  SlTimelineList,\n  SlTimelineMarker,\n  SlTimelineOpposite,\n  SlTimelineTime,\n  SlTimelineTitle,\n  provideTimelineDefaults,\n} from '@slotted/angular/timeline';",
  selector:
    '[slTimeline], ol[slTimelineList] or div[slTimelineList], li[slTimelineGroup] or div[slTimelineGroup], ol[slTimelineGroupList] or div[slTimelineGroupList], li[slTimelineItem] or article[slTimelineItem], time[slTimelineTime], [slTimelineTitle], [slTimelineActor], [slTimelineDescription], [slTimelineActions], [slTimelineOpposite], [slTimelineMarker], [slTimelineEmpty]',
  exportAs:
    'slTimeline, slTimelineList, slTimelineGroup, slTimelineGroupList, slTimelineItem, slTimelineTime',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'Owns the axes, the messages, the time zone and the query container that reflows the line. Carries data-ui="timeline" and each axis as an attribute. It is not a landmark.',
  },
  {
    part: 'fresh',
    element: 'button',
    required: false,
    purpose:
      'The pill that holds new events until the reader asks for them. It appears when freshCount rises above zero and stays mounted afterwards, hidden at zero with the last count as text, so it leaves with a transition. It sits before the list and outside the feed, is announced once per count change, and pressing it moves focus to the first revealed event.',
  },
  {
    part: 'list',
    element: 'ol, or div with role="feed"',
    required: true,
    purpose:
      'The ordered list, or the APG feed when mode="feed". Carries the name, aria-busy while loading, and the four feed keys — only the list sees every article.',
  },
  {
    part: 'group',
    element: 'li, or div in the feed',
    required: false,
    purpose:
      'A period: the heading and its own list. The line breaks at it. Carries data-open, the only mutable state of the family.',
  },
  {
    part: 'group-label',
    element: 'h2 to h6, by level',
    required: false,
    purpose: 'The period name, as a heading of the level declared on the root or on the group.',
  },
  {
    part: 'group-trigger',
    element: 'button',
    required: false,
    purpose:
      'Inside the heading of a collapsible group: aria-expanded, aria-controls pointing to the list, and the period name followed by ", Show events" or ", Hide events" (the expand and collapse messages, with their own separator).',
  },
  {
    part: 'group-indicator',
    element: 'span',
    required: false,
    purpose:
      'The trigger’s chevron, the chevron-down glyph inside an icon, which rotates between down and up.',
  },
  {
    part: 'group-list',
    element: 'ol, or div in the feed',
    required: false,
    purpose:
      'The list of a group. Receives hidden when the group closes, and the events stay in the DOM: a feed that lost them would lose the reader’s position.',
  },
  {
    part: 'item',
    element: 'li, or article in the feed',
    required: true,
    purpose:
      'An event, and the element where each state is written: data-current, data-complete, data-loading, data-connector, data-side, data-tone, data-variant. In the feed it is a focusable article with position, set size, label and description.',
  },
  {
    part: 'opposite',
    element: 'div',
    required: false,
    purpose:
      'The other side of the line. With placement="end" it is a fixed-width column before the line, where the time lives in the classic reading; with alternate it takes the side the body does not take.',
  },
  {
    part: 'rail',
    element: 'div',
    required: true,
    purpose:
      'The column of the marker and the line, stretched to the height of the event. It keeps the line at the center of the marker, whether the marker is a dot or an avatar.',
  },
  {
    part: 'marker',
    element: 'span',
    required: true,
    purpose:
      'The marker on the line, centered on the first line of the title. Empty, it draws a dot the size of the spinner; with a glyph or an avatar it draws a badge; loading draws the spinner in place of the dot; complete, without a consumer marker, receives the check glyph (an icon with data-check) cut out of the disc and stays a dot.',
  },
  {
    part: 'connector',
    element: 'span',
    required: false,
    purpose:
      'The line from the marker to the next event, aria-hidden. The last event of each list does not draw it. Dashed on the future side of the current event, with autoComplete.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The body: title and time on the first line, actor below, description, whatever the consumer writes, and the actions.',
  },
  {
    part: 'title',
    element: 'div',
    required: false,
    purpose:
      'The event name, and the first id of aria-labelledby in the feed. The current state is read after it, in a visually-hidden element.',
  },
  {
    part: 'actor',
    element: 'div',
    required: false,
    purpose: 'Who did it: an avatar and a name. Enters the article label after the title.',
  },
  {
    part: 'time',
    element: 'time',
    required: false,
    purpose:
      'When it happened. Always writes datetime with the machine value; the text is formatted by the locale and the timeZone, or replaced by timeLabel, and a relative reading keeps the absolute one in title.',
  },
  {
    part: 'description',
    element: 'div',
    required: false,
    purpose: 'The second line, and the article’s aria-describedby in the feed.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'The row of controls below the description. An event with actions is not actionable as a whole: each action is its own target.',
  },
  {
    part: 'more',
    element: 'button, or div while loading',
    required: false,
    purpose:
      'The end of what was loaded, when growing is not none. A button that asks for more, or, with scroll, a sentinel that asks when it enters the scroller; while loading it shows the ring and the message.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'What takes the place of the list when there are no events and nothing is loading.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'Every axis on an invoice, moved by the controls below the stage. Switch mode to feed and the same list becomes focusable articles.',
    snippet: defineSnippet({
      id: 'timeline-angular-playground',
      language: 'angular',
      label: 'The life of an invoice',
      source:
        '<div slTimeline label="Invoice activity" locale="en-US" timeZone="America/Sao_Paulo">\n  <ol slTimelineList>\n    <li\n      slTimelineItem\n      actor="Ana Ribeiro"\n      description="Draft INV-4821 for Solaris Freight."\n      time="2026-09-08T09:12:00Z"\n      title="Invoice created"\n    ></li>\n    <li slTimelineItem current time="2026-09-14T10:32:00Z" title="Paid" tone="success"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'feed',
    title: 'A feed that is a feed',
    note: 'With mode="feed" the list is role="feed" and each event an article with aria-posinset, aria-setsize and the label read from the title, the actor and the time. Tab stops on each article; PageDown and PageUp jump between them.',
    snippet: defineSnippet({
      id: 'timeline-angular-feed',
      language: 'angular',
      label: 'The APG Feed pattern, item by item',
      source:
        '<div\n  slTimeline\n  mode="feed"\n  growing="button"\n  label="Activity"\n  [count]="120"\n  (loadMoreRequest)="load()"\n>\n  <div slTimelineList>\n    @for (event of events; track event.id) {\n      <article slTimelineItem [title]="event.title" [time]="event.time"></article>\n    }\n  </div>\n</div>',
    }),
  },
  {
    id: 'placement',
    title: 'Which side of the line',
    note: 'end is the default; start mirrors the row; alternate puts the line in the middle and the events take turns. The opposite part always takes the side the body does not take, and below thirty rems alternate falls back to one side.',
    snippet: defineSnippet({
      id: 'timeline-angular-placement',
      language: 'angular',
      label: 'The time on the other side of the line',
      source:
        '<div slTimeline placement="alternate">\n  <ol slTimelineList>\n    <li slTimelineItem title="2.12 — Recurring invoices">\n      <div slTimelineOpposite><time slTimelineTime value="2026-06-02T00:00:00Z"></time></div>\n    </li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'orientation',
    title: 'A row of events',
    note: 'horizontal turns the line on its side, with equal columns that scroll on the inline axis when there are more events than width. Below thirty rems of its own width it becomes a column again; reflow={false} turns that off.',
    snippet: defineSnippet({
      id: 'timeline-angular-orientation',
      language: 'angular',
      label: 'The same line, lying down',
      source:
        '<div slTimeline orientation="horizontal" autoComplete>\n  <ol slTimelineList>\n    <li slTimelineItem title="Order confirmed"></li>\n    <li slTimelineItem current title="In transit"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'order',
    title: 'The order is declared, never reversed',
    note: 'order says what the list is and does not reorder the array: the consumer sorts. The order decides where autoComplete cuts — in oldest-first the past is before the current event, in newest-first after it.',
    snippet: defineSnippet({
      id: 'timeline-angular-order',
      language: 'angular',
      label: 'Newest first, and the past below',
      source:
        '<div slTimeline order="newest-first" autoComplete>\n  <ol slTimelineList>\n    <li slTimelineItem title="Delivered"></li>\n    <li slTimelineItem current title="In transit"></li>\n    <li slTimelineItem title="Packed"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'statuses',
    title: 'What an event can be',
    note: 'Each state is a shape as well as a color: pending is the shape of the variant, current is a filled disc with a ring, complete is a filled disc with a cut-out check, loading is the spinner at the size of the dot. autoComplete derives complete for the past side of the current event and dashes the future.',
    snippet: defineSnippet({
      id: 'timeline-angular-statuses',
      language: 'angular',
      label: 'A parcel tracking',
      source:
        '<div slTimeline tone="accent" autoComplete>\n  <ol slTimelineList>\n    <li slTimelineItem title="Order confirmed"></li>\n    <li slTimelineItem current title="In transit"></li>\n    <li slTimelineItem title="Out for delivery"></li>\n    <li slTimelineItem loading title="Delivered"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'appearance',
    title: 'Appearance and size',
    note: 'variant on the root or per event: outline separates the marker from the line in any scheme, solid fills, subtle is a background with a thin edge, plain is the dot without a ring for a row of small events. tone paints the marker with one of the five tones; size picks the step.',
    snippet: defineSnippet({
      id: 'timeline-angular-appearance',
      language: 'angular',
      label: 'An event that disagrees with the root',
      source:
        '<div slTimeline size="sm" variant="plain">\n  <ol slTimelineList>\n    <li slTimelineItem title="Commit 4f2a"></li>\n    <li slTimelineItem title="Tests failed" tone="danger" variant="solid"></li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'groups',
    title: 'Grouping by period',
    note: 'The consumer groups, because the period belongs to the domain. A group is a heading of the declared level over its own list; collapsible turns the heading into a button with aria-expanded, and the closed list stays in the DOM with hidden.',
    snippet: defineSnippet({
      id: 'timeline-angular-groups',
      language: 'angular',
      label: 'Today, open; last week, closed',
      source:
        '<div slTimeline [level]="3">\n  <ol slTimelineList>\n    <li slTimelineGroup label="Today" collapsible>\n      <ol slTimelineGroupList>\n        <li slTimelineItem title="Paid"></li>\n      </ol>\n    </li>\n    <li slTimelineGroup label="Last week" collapsible [defaultOpen]="false">\n      <ol slTimelineGroupList>\n        <li slTimelineItem title="Sent"></li>\n      </ol>\n    </li>\n  </ol>\n</div>',
    }),
  },
  {
    id: 'growing',
    title: 'Loading more',
    note: 'growing="button" puts a button at the end of what was loaded and asks with pointer or keyboard; growing="scroll" asks with scroll when the end enters the scroller. While loading, the end shows the ring and the root is aria-busy.',
    snippet: defineSnippet({
      id: 'timeline-angular-growing',
      language: 'angular',
      label: 'The consumer appends to the array',
      source:
        '<div slTimeline growing="button" [loading]="pending" (loadMoreRequest)="fetchMore($event.reason)">\n  <ol slTimelineList>\n    @for (event of events; track event.id) {\n      <li slTimelineItem [title]="event.title"></li>\n    }\n  </ol>\n</div>',
    }),
  },
  {
    id: 'fresh',
    title: 'New events while the reader reads',
    note: 'A feed that inserts at the top pushes what is being read. With freshCount, the family holds the new events behind a pill, announces the count in polite, and (revealRequest) is the moment the consumer joins them to the array. The pill leaves with a transition, and focus that was on it moves to the first revealed event.',
    snippet: defineSnippet({
      id: 'timeline-angular-fresh',
      language: 'angular',
      label: 'Three events waiting',
      source:
        '<div slTimeline mode="feed" [freshCount]="held.length" (revealRequest)="reveal()">\n  <div slTimelineList>\n    @for (event of events; track event.id) {\n      <article slTimelineItem [title]="event.title"></article>\n    }\n  </div>\n</div>',
    }),
  },
  {
    id: 'timestamps',
    title: 'Machine time, explicit time zone',
    note: 'time accepts an ISO instant with a zone designator, written in the declared timeZone, or a wall-clock value without a zone, written as it is. datetime always carries the machine value; timeFormat="relative" writes "2 hours ago" and keeps the absolute value in title.',
    snippet: defineSnippet({
      id: 'timeline-angular-timestamps',
      language: 'ts',
      label: 'The same instant in two time zones, and a relative one',
      source:
        'providers: [\n  provideSlotted({ locale: \'en-US\' }),\n  provideTimelineDefaults({ now: Date.now(), timeZone: \'America/Sao_Paulo\' }),\n];\n\n// <div slTimeline timeFormat="relative">\n//   <ol slTimelineList>\n//     <li slTimelineItem time="2026-09-14T10:32:00Z" title="Paid"></li>\n//   </ol>\n// </div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A nine-word title, an unbreakable reference, an Arabic title, an avatar in the marker, an event without a title. The marker never leaves the first line and the line never leaves the center.',
    snippet: defineSnippet({
      id: 'timeline-angular-content',
      language: 'angular',
      label: 'An avatar in the marker',
      source:
        '<li slTimelineItem title="Approved the revised quote for the shipment program">\n  <span slTimelineMarker slAvatar name="Ana Ribeiro"></span>\n</li>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'The title is whatever the consumer gives it — a Link — and the actions are buttons of the button family. Expandable content is a Collapsible inside the body. exportAs reaches the list and focusItem(index) for the feed, and provideTimelineDefaults decides once for the injector.',
    snippet: defineSnippet({
      id: 'timeline-angular-composition',
      language: 'angular',
      label: 'A link in the title and a disclosure in the body',
      source:
        '<li slTimelineItem>\n  <a slTimelineTitle slLink href="/invoices/4821">Payment failed</a>\n  <div slCollapsible variant="plain">\n    <h4 slCollapsibleHeader><button slCollapsibleTrigger>View the issuer response</button></h4>\n    <div slCollapsiblePanel>Code 05: do not honor.</div>\n  </div>\n  <div slTimelineActions><button slButton size="sm">Retry</button></div>\n</li>',
    }),
  },
  {
    id: 'empty',
    title: 'No events',
    note: 'Without items and without loading, the empty part takes the place of the list with the family message or with whatever the consumer projects — a result-state, for example.',
    snippet: defineSnippet({
      id: 'timeline-angular-empty',
      language: 'angular',
      label: 'What takes the place of the list',
      source:
        '<div slTimeline label="Activity">\n  <ol slTimelineList></ol>\n  <div slTimelineEmpty slResultState status="empty">\n    <div slResultStateContent><p slResultStateTitle>No events yet</p></div>\n  </div>\n</div>',
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'In list the keyboard is the platform’s: Tab goes through the links and buttons of the body. In feed, Tab stops on each article, PageDown and PageUp jump between articles, Control+End and Control+Home leave the feed for the next or previous focusable element.',
    snippet: defineSnippet({
      id: 'timeline-angular-keyboard',
      language: 'angular',
      label: 'What an article announces',
      source:
        '<!-- "Paid, Solaris Freight, 2 hours ago, article 1 of 3": title, actor and time, and the position. -->\n<div slTimeline mode="feed" label="Activity">\n  <div slTimelineList>\n    <article\n      slTimelineItem\n      title="Paid"\n      actor="Solaris Freight"\n      time="2026-09-14T13:32:00Z"\n    ></article>\n  </div>\n</div>',
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(openRequest)',
    payload: 'ChangeRequest<boolean>',
    when: 'On slTimelineGroup, before the group opens or closes; [(open)] is the other half, the value. The request carries the previous value, the reason — pointer, keyboard or programmatic — and the source event; cancelling it moves nothing.',
  },
  {
    name: '(loadMoreRequest)',
    payload: '{ reason: "pointer" | "keyboard" | "scroll"; event?: Event }',
    when: 'When the reader presses the load-more button, or when the sentinel enters the scroller under growing="scroll". There is no value to hold: the consumer appends to the array.',
  },
  {
    name: '(revealRequest)',
    payload: '{ reason: "pointer" | "keyboard"; event?: Event }',
    when: 'When the reader presses the new-events pill. The consumer joins the events it was holding to the array and sets freshCount to zero.',
  },
];

export const ANGULAR_TIMELINE_DOCS = {
  timeline: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['mode', "'list' | 'feed'", 'list', 'Timeline', 'An ordered list, or the APG Feed pattern'],
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'Timeline',
        'A column, or a row that scrolls and reflows',
      ],
      [
        'placement',
        "'end' | 'start' | 'alternate'",
        'end',
        'Timeline',
        'Which side of the line the body lives on',
      ],
      [
        'order',
        "'oldest-first' | 'newest-first'",
        'oldest-first',
        'Timeline',
        'What the list is; decides where autoComplete cuts. Never reorders the array',
      ],
      [
        'variant',
        "'solid' | 'outline' | 'subtle' | 'plain'",
        'subtle',
        'Timeline',
        'The marker appearance, inherited by the events',
      ],
      [
        'tone',
        "'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'Timeline',
        'The marker tone, inherited by the events',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'Timeline', 'The step of the marker and the type'],
      [
        'growing',
        "'none' | 'button' | 'scroll'",
        'none',
        'Timeline',
        'How the end of what was loaded asks for more',
      ],
      [
        'timeFormat',
        "'absolute' | 'relative'",
        'absolute',
        'Timeline',
        'How the time is written; relative keeps the absolute value in title',
      ],
      [
        'locale',
        'string',
        '—',
        'Timeline',
        'BCP 47 for the times; without it, the current locale (provideSlotted)',
      ],
      [
        'timeZone',
        'string',
        '—',
        'Timeline',
        'The time zone an instant is written in; without it, the runtime’s',
      ],
      [
        'now',
        'number',
        '—',
        'Timeline',
        'The instant a relative reading counts from, in epoch milliseconds; without it, the clock at render',
      ],
      ['level', '2 | 3 | 4 | 5 | 6', '3', 'Timeline', 'The level of the group headings'],
      [
        'reflow',
        'boolean',
        'true',
        'Timeline',
        'Whether horizontal and alternate reflow below thirty rems',
      ],
      [
        'autoComplete',
        'boolean',
        'false',
        'Timeline',
        'Marks the events on the past side of the current one complete, and dashes the future',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Timeline',
        'More events on the way: aria-busy on the feed, ring at the end',
      ],
      ['freshCount', 'number', '0', 'Timeline', 'How many new events the pill holds'],
      [
        'count',
        'number',
        '—',
        'Timeline',
        'The total, for aria-setsize; without it, -1 while the list can grow',
      ],
      ['label', 'string', '—', 'Timeline', 'The accessible name of the list'],
      [
        'aria-label',
        'attribute',
        '—',
        'ol[slTimelineList]',
        'A name written on the list wins over the root’s',
      ],
      [
        'messages',
        'PartialMessages<TimelineMessages>',
        '—',
        'Timeline',
        'Words over the catalog of the current locale, key by key: the family’s seven messages',
      ],
      ['label', 'string', '—', 'TimelineGroup', 'The period name, as a heading'],
      [
        'collapsible',
        'boolean',
        'false',
        'TimelineGroup',
        'Whether the heading is a button that folds the group',
      ],
      [
        'open',
        'model<boolean | undefined>',
        '—',
        'TimelineGroup',
        '[(open)]: present means controlled, for the life of the group',
      ],
      [
        'defaultOpen',
        'boolean',
        'true',
        'TimelineGroup',
        'Where an uncontrolled group starts, read once',
      ],
      [
        'level',
        '2 | 3 | 4 | 5 | 6',
        '—',
        'TimelineGroup',
        'The level of this heading, over the root’s',
      ],
      [
        'title',
        'string',
        '—',
        'TimelineItem',
        'The event name; or a projected [slTimelineTitle] element',
      ],
      [
        'description',
        'string',
        '—',
        'TimelineItem',
        'The second line; or a projected [slTimelineDescription]',
      ],
      ['actor', 'string', '—', 'TimelineItem', 'Who did it; or a projected [slTimelineActor]'],
      [
        'time',
        'PlainDateTime | string',
        '—',
        'TimelineItem',
        'When: ISO instant or wall-clock value',
      ],
      ['timeLabel', 'string', '—', 'TimelineItem', 'The text in place of the formatted time'],
      [
        '[slTimelineMarker]',
        'projection',
        '—',
        'TimelineItem',
        'What the marker holds in place of the dot',
      ],
      ['[slTimelineOpposite]', 'projection', '—', 'TimelineItem', 'The other side of the line'],
      ['[slTimelineActions]', 'projection', '—', 'TimelineItem', 'The row of controls'],
      ['current', 'boolean', 'false', 'TimelineItem', 'The event the reader is at: aria-current'],
      ['complete', 'boolean', '—', 'TimelineItem', 'Complete; wins over the derivation'],
      ['loading', 'boolean', 'false', 'TimelineItem', 'Still arriving: the marker spins the ring'],
      [
        'connector',
        "'solid' | 'dashed' | 'none'",
        '—',
        'TimelineItem',
        'The line after this event',
      ],
      [
        'side',
        "'start' | 'end'",
        '—',
        'TimelineItem',
        'The side under alternate; parity without it',
      ],
      ['tone', 'TimelineTone', '—', 'TimelineItem', 'The tone of this event, over the root’s'],
      [
        'variant',
        'TimelineVariant',
        '—',
        'TimelineItem',
        'The appearance of this event, over the root’s',
      ],
      [
        'value',
        'PlainDateTime | string',
        '—',
        'TimelineTime',
        'The machine value, written in datetime',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        'slTimeline | slTimelineList | slTimelineGroup | slTimelineItem | slTimelineTime',
        '—',
        'every part',
        'Reaches the instance from the template: #list="slTimelineList" and list.focusItem(2) moves focus to a feed article',
      ],
      [
        'ng-content',
        '[slTimelineTitle] | [slTimelineActor] | [slTimelineDescription] | [slTimelineActions] | [slTimelineOpposite] | [slTimelineMarker] | [slTimelineEmpty]',
        '—',
        'TimelineItem, Timeline',
        'Each part of the body as a consumer element, with data-part and id written by the directive',
      ],
      [
        'time[slTimelineTime]',
        '{ value, format, locale, timeZone, now }',
        '—',
        'anywhere',
        'The time part alone, for an opposite column or a table cell; reads the root when there is one',
      ],
      [
        'provideTimelineDefaults()',
        'mode | orientation | placement | order | variant | tone | size | growing | timeFormat | timeZone | now | level',
        '—',
        'Injector',
        'Decides the fourteen once for everything below; an input on the timeline wins',
      ],
    ]),
    accessibility: [
      'In list the list is an ol and each event an li: the sequence and the set size come from the platform without a line of ARIA, and the keyboard is that of the links and buttons the consumer writes. There is no invented role on a list that does not grow.',
      'In feed the list is role="feed" and each event an article with tabindex="0", aria-posinset, aria-setsize — the declared total, the loaded count when the list does not grow, -1 when it can grow — aria-labelledby with title, actor and time in that order, and aria-describedby with the description. It is the APG Feed pattern item by item, and an li does not accept the article role: so the element changes with the mode.',
      'The current event carries aria-current="true" and a visually-hidden element with the current message after the title, because not every screen reader speaks aria-current inside an article. Complete and loading are shapes — a disc with a check, the spinner ring — and not colors only.',
      'A collapsible group is the Disclosure pattern: the heading contains a button with aria-expanded and aria-controls, and the closed list receives hidden without leaving the DOM. The button name is the period followed by ", Show events" or ", Hide events": the expand and collapse messages bring their own separator.',
      'The time is always a time element with datetime, the value the screen reader and the search engine read; the text follows the declared locale and time zone, and a relative reading leaves the absolute one in title.',
      'New events are announced in polite once per count change, and stay behind a button until the reader asks for them, so nothing moves under what is being read.',
    ],
    snippets: [
      defineSnippet({
        id: 'timeline-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-ui="timeline"\n  data-part="root"\n  data-mode="list"\n  data-placement="end"\n  data-variant="outline"\n>\n  <ol aria-label="Invoice activity" data-part="list">\n    <li data-part="item" data-tone="success" data-variant="outline">\n      <div data-part="rail">\n        <span data-part="marker"></span>\n        <span aria-hidden="true" data-part="connector"></span>\n      </div>\n      <div data-part="content">\n        <div data-part="title">Paid</div>\n        <time data-part="time" datetime="2026-09-14T10:32:00Z">Sep 14, 2026, 7:32 AM</time>\n        <div data-part="description">$18,240.00 by bank transfer.</div>\n      </div>\n    </li>\n  </ol>\n</div>',
      }),
      defineSnippet({
        id: 'timeline-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='timeline'] {\n  --slotted-timeline-core-ratio: 0.6;\n  --slotted-timeline-connector-thickness: 2px;\n  --slotted-timeline-opposite-size: 10rem;\n}",
      }),
    ],
  },
} as const;
