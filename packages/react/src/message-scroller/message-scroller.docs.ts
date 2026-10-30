import scrollerTokens from '@slotted/styles/message-scroller/tokens.json';
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

export const REACT_MESSAGE_SCROLLER_TOKENS = scrollerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned MessageScroller decision',
}));

const imports: ReferenceImport = {
  source:
    "import { MessageScroller, MessageScrollerContent, MessageScrollerDefaultsProvider, MessageScrollerItem, MessageScrollerJump, MessageScrollerLoader, MessageScrollerSeparator, MessageScrollerUnread, MessageScrollerViewport, useMessageScroller } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame. Fills a bounded parent; the engine writes data-scrollable, data-following and data-pending on it while the reader scrolls. data-pending hides the content until the opening position is applied, and content that holds no item is never pending.',
  },
  {
    part: 'viewport',
    element: 'div',
    required: true,
    purpose:
      'The element that scrolls: role region, tabIndex 0, named Messages. Hidden, laid out, until the opening position applies.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'The rows: role log with aria-relevant additions, aria-busy while a reply streams. Its bottom inset holds the room an anchored turn needs.',
  },
  {
    part: 'item',
    element: 'div',
    required: true,
    purpose:
      'One row: data-message-id for jumps and prepends, data-anchor for a turn that starts an exchange.',
  },
  {
    part: 'separator',
    element: 'div',
    required: false,
    purpose:
      'A day or a line the system writes; sticky keeps its pill at the top while its rows are in view.',
  },
  {
    part: 'unread',
    element: 'div',
    required: false,
    purpose: 'The accent line above the first message the reader has not seen.',
  },
  {
    part: 'loader',
    element: 'div',
    required: false,
    purpose: 'Older rows on their way: the shared ring and a status line at the head of the rows.',
  },
  {
    part: 'jump',
    element: 'button',
    required: false,
    purpose:
      'Takes the reader to the latest row, or the first; inert and out of the tab order when there is nowhere to go.',
  },
  {
    part: 'jump-count',
    element: 'span',
    required: false,
    purpose: 'How many rows arrived out of view, in the control’s face and its name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A conversation in a frame 22 rem tall with follow, the opening position and the peek on the controls. Scroll up and the jump control arrives; press it and it leaves.',
    snippet: defineSnippet({
      id: 'message-scroller-react-playground',
      language: 'tsx',
      label: 'A conversation',
      source: `<MessageScroller follow>
  <MessageScrollerViewport>
    <MessageScrollerContent>
      {messages.map((message) => (
        <MessageScrollerItem key={message.id} messageId={message.id} anchor={message.own}>
          <Message align={message.own ? 'end' : 'start'}>…</Message>
        </MessageScrollerItem>
      ))}
    </MessageScrollerContent>
  </MessageScrollerViewport>
  <MessageScrollerJump />
</MessageScroller>;`,
    }),
  },
  {
    id: 'opening',
    title: 'Where a saved conversation opens',
    note: 'last-anchor opens at the reader’s last question with the answer under it; end at the last line; start at the first. None of them shows the oldest rows first and then jumps.',
    snippet: defineSnippet({
      id: 'message-scroller-react-opening',
      language: 'tsx',
      label: 'Open at the last turn',
      source: `<MessageScroller defaultPosition="last-anchor">…</MessageScroller>;`,
    }),
  },
  {
    id: 'follow',
    title: 'Following a reply, and letting go',
    note: 'With follow the view keeps the streaming reply in sight while the reader is at the end. Scroll up, select a word or press an arrow and it stops pulling; the jump control resumes it.',
    snippet: defineSnippet({
      id: 'message-scroller-react-follow',
      language: 'tsx',
      label: 'Follow while at the end',
      source: `<MessageScroller follow busy={streaming}>
  …
</MessageScroller>;`,
    }),
  },
  {
    id: 'anchor',
    title: 'A question lifted to the top',
    note: 'An item with anchor that arrives is brought to the top with a peek of the row above it, and room is kept below so it can stand there while the answer is still short.',
    snippet: defineSnippet({
      id: 'message-scroller-react-anchor',
      language: 'tsx',
      label: 'The reader’s question anchors',
      source: `<MessageScroller peek={48} scrollMargin={8}>
  <MessageScrollerViewport>
    <MessageScrollerContent>
      <MessageScrollerItem anchor messageId="q7">
        …
      </MessageScrollerItem>
    </MessageScrollerContent>
  </MessageScrollerViewport>
</MessageScroller>;`,
    }),
  },
  {
    id: 'history',
    title: 'Older messages without a jump',
    note: 'Reach the top and onReachStart asks for more; the rows arrive above and the one the reader was on stays exactly where it was. The loader holds the head while they travel.',
    snippet: defineSnippet({
      id: 'message-scroller-react-history',
      language: 'tsx',
      label: 'Load older on reaching the top',
      source: `<MessageScroller onReachStart={loadOlder}>
  <MessageScrollerViewport>
    <MessageScrollerContent>
      {loading ? <MessageScrollerLoader /> : null}
      {rows}
    </MessageScrollerContent>
  </MessageScrollerViewport>
</MessageScroller>;`,
    }),
  },
  {
    id: 'jump',
    title: 'Back to the latest, with a count',
    note: 'Scroll up and send two messages from the other side: the control widens to say how many arrived out of view. It arrives on the enter curve and leaves faster than it came.',
    snippet: defineSnippet({
      id: 'message-scroller-react-jump',
      language: 'tsx',
      label: 'The jump control',
      source: `<MessageScroller>
  …
  <MessageScrollerJump />
</MessageScroller>;`,
    }),
  },
  {
    id: 'navigator',
    title: 'Jumping to a turn from outside',
    note: 'A footer outside the frame reads onAnchorChange and drives ref.current.scrollToMessage with highlight: the landed row glows in the accent’s tint and loses it slowly.',
    snippet: defineSnippet({
      id: 'message-scroller-react-navigator',
      language: 'tsx',
      label: 'A turn navigator',
      source: `const scroller = useRef<MessageScrollerHandle>(null);

<MessageScroller ref={scroller} onAnchorChange={setCurrent}>
  …
</MessageScroller>;
<Button onClick={() => scroller.current?.scrollToMessage(next, { highlight: true })}>
  Pergunta seguinte
</Button>;`,
    }),
  },
  {
    id: 'separators',
    title: 'Days that stay at the top',
    note: 'A sticky separator is a pill that stays at the top while its day is in view and gives way to the next day as it arrives; a separator that is not sticky keeps its rules.',
    snippet: defineSnippet({
      id: 'message-scroller-react-separators',
      language: 'tsx',
      label: 'A day',
      source: `<MessageScrollerItem>
  <MessageScrollerSeparator sticky>Yesterday</MessageScrollerSeparator>
</MessageScrollerItem>;`,
    }),
  },
  {
    id: 'unread',
    title: 'Where the reader stopped reading',
    note: 'The unread line is a row like any other, in the accent, above the first message the reader has not seen; it is text in the flow, so it is read in order.',
    snippet: defineSnippet({
      id: 'message-scroller-react-unread',
      language: 'tsx',
      label: 'New messages',
      source: `<MessageScrollerItem>
  <MessageScrollerUnread />
</MessageScrollerItem>;`,
    }),
  },
  {
    id: 'busy',
    title: 'Announcing a reply once',
    note: 'While busy the log holds its announcements back; the change is said once each way — Responding, then Response complete — never word by word.',
    snippet: defineSnippet({
      id: 'message-scroller-react-busy',
      language: 'tsx',
      label: 'A streaming reply',
      source: `<MessageScroller busy={status === 'streaming'}>…</MessageScroller>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onReachStart',
    payload: "(reason: 'scroll')",
    when: 'Once each time the reader reaches the top by a gesture — the moment to ask for older messages.',
  },
  {
    name: 'onAnchorChange',
    payload: "(id: string | null, reason: 'scroll' | 'programmatic')",
    when: 'When the anchored turn at the top of the view changes, by the reader’s scroll or by a jump.',
  },
  {
    name: 'onScrollableChange',
    payload: '({ start, end })',
    when: 'When the edges the viewport can still scroll toward change.',
  },
];

export const REACT_MESSAGE_SCROLLER_DOCS = {
  messageScroller: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'follow',
        'boolean',
        'false',
        'MessageScroller',
        'Keep a growing reply in view while the reader is at the end',
      ],
      [
        'defaultPosition',
        "'start' | 'end' | 'last-anchor'",
        'last-anchor',
        'MessageScroller',
        'Where the conversation opens, applied once',
      ],
      [
        'edgeThreshold',
        'number',
        '8',
        'MessageScroller',
        'Pixels from an edge that still count as at it',
      ],
      [
        'scrollMargin',
        'number',
        '0',
        'MessageScroller',
        'Pixels kept above a row the scroller scrolls to',
      ],
      [
        'peek',
        'number',
        '64',
        'MessageScroller',
        'Pixels of the previous row kept above an anchored turn',
      ],
      [
        'preserveOnPrepend',
        'boolean',
        'true',
        'MessageScroller',
        'Keep the reader’s row in place when older rows arrive above',
      ],
      [
        'busy',
        'boolean',
        'false',
        'MessageScroller',
        'A reply is streaming: the log is aria-busy and the change is announced once each way',
      ],
      [
        'messages',
        'PartialMessages<MessageScrollerMessages>',
        '—',
        'MessageScroller',
        'Words laid over the language in force, key by key: the region’s name, the jump controls, the unread line, the loader and the two streaming announcements',
      ],
      [
        'messageId',
        'string',
        '—',
        'MessageScrollerItem',
        'The stable id jumps and prepends address the row by',
      ],
      [
        'anchor',
        'boolean',
        'false',
        'MessageScrollerItem',
        'The row starts a turn and is lifted to the top when it arrives',
      ],
      [
        'sticky',
        'boolean',
        'false',
        'MessageScrollerSeparator',
        'Stays at the top while its rows are in view',
      ],
      [
        'direction',
        "'end' | 'start'",
        'end',
        'MessageScrollerJump',
        'Which edge the control takes the reader to',
      ],
      [
        'behavior',
        'ScrollBehavior',
        'smooth',
        'MessageScrollerJump',
        'Instant under reduced motion whatever it says',
      ],
      [
        'ref',
        'Ref<MessageScrollerHandle>',
        '—',
        'MessageScroller',
        'scrollToMessage, scrollToEnd, scrollToStart, focus and root',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Renders the wiring into another element',
      ],
    ]),
    composition: apiRows([
      [
        'MessageScrollerDefaultsProvider',
        '{ follow, defaultPosition, peek, scrollMargin }',
        '—',
        'a subtree',
        'Sets them once; a scroller still wins',
      ],
      [
        'useMessageScroller',
        '() => { state, scrollToMessage, … }',
        '—',
        'inside the frame',
        'The commands and the live state for a control of the consumer’s',
      ],
      [
        'ref',
        'MessageScrollerHandle',
        '—',
        'MessageScroller',
        'The commands for a control outside the frame',
      ],
      [
        'onClick',
        'handler',
        '—',
        'MessageScrollerJump',
        'Composed: preventDefault refuses the jump',
      ],
    ]),
    accessibility: [
      'The viewport is a region named Messages with tabIndex 0, so a keyboard reaches it and scrolls it with the arrows, Page Up, Page Down, Home and End the platform already binds.',
      'The rows are a WAI-ARIA log with aria-relevant additions: a row that arrives is read, a row that grows is not; busy holds even the arrival back until a reply is whole.',
      'A streaming reply is announced once when it starts and once when it ends through the shared live announcer, never word by word.',
      'The jump control is a real button, inert and out of the tab order while there is nowhere to go, and its name carries the count of rows that arrived out of view.',
      'Separators and the unread line are text in the flow, so they are read in order rather than skipped as decoration.',
      'Under reduced motion every smooth scroll the family starts becomes instant, and a row arrives without rising.',
    ],
    snippets: [
      defineSnippet({
        id: 'message-scroller-react-anatomy',
        language: 'tsx',
        label: 'Every part',
        source: `<MessageScroller follow busy={streaming} onReachStart={loadOlder}>
  <MessageScrollerViewport>
    <MessageScrollerContent>
      <MessageScrollerLoader />
      <MessageScrollerItem>
        <MessageScrollerSeparator sticky>Today</MessageScrollerSeparator>
      </MessageScrollerItem>
      <MessageScrollerItem>
        <MessageScrollerUnread />
      </MessageScrollerItem>
      <MessageScrollerItem anchor messageId="q1">
        …
      </MessageScrollerItem>
    </MessageScrollerContent>
  </MessageScrollerViewport>
  <MessageScrollerJump />
</MessageScroller>;`,
      }),
    ],
  },
} as const;
