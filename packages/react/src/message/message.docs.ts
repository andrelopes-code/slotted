import messageTokens from '@slotted/styles/message/tokens.json';
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

export const REACT_MESSAGE_TOKENS = messageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Message decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Bubble, BubbleCaret, BubbleContent, BubbleMeta, BubbleQuote, BubbleReaction, BubbleReactions, BubbleRetry, BubbleStream, BubbleTyping, Message, MessageActions, MessageActivity, MessageActivityStep, MessageAuthor, MessageAvatar, MessageBody, MessageDefaultsProvider, MessageFooter, MessageGroup, MessageHeader, MessageReceipt, MessageTime, MessageVersions } from '@slotted/react';",
};

const messageAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'article',
    required: true,
    purpose:
      'One message, named by its author. Carries data-ui="message", data-align, data-layout, data-actions, data-status, and the states data-loading, data-invalid and data-read with aria-busy while it sends or streams.',
  },
  {
    part: 'group',
    element: 'div',
    required: false,
    purpose:
      'A run from one sender. The rows stand two pixels apart, the facing corners on the sender’s side draw in, and the avatar column is kept on every row.',
  },
  {
    part: 'avatar',
    element: 'div',
    required: false,
    purpose: 'The box an Avatar stands in: at the foot of a run, or at the top in a thread.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose:
      'The column of the words: header, bubbles, attachments and footer, on the sender’s side.',
  },
  {
    part: 'header',
    element: 'div',
    required: false,
    purpose:
      'The name and, in a thread, the hour, set on the words’ inset; the dot between them is drawn, not written.',
  },
  {
    part: 'author',
    element: 'span',
    required: false,
    purpose: 'The sender’s name; while it is on the page the article is labelled by it.',
  },
  {
    part: 'time',
    element: 'time',
    required: false,
    purpose:
      'An hour, with dateTime for machines: in the header, in the footer or inside a bubble’s meta.',
  },
  {
    part: 'footer',
    element: 'div',
    required: false,
    purpose: 'What is said under the words: a receipt as a word, the versions, the actions.',
  },
  {
    part: 'receipt',
    element: 'span',
    required: false,
    purpose:
      'Where the message is in its delivery. Inside a bubble’s meta a mark with its word hidden; elsewhere the word alone.',
  },
  {
    part: 'actions',
    element: 'div',
    required: false,
    purpose:
      'A toolbar of the message’s own controls, revealed by the pointer, by focus and on touch.',
  },
  {
    part: 'activity',
    element: 'div',
    required: false,
    purpose: 'A raised card logging what a reply is doing before it has words; a status region.',
  },
  {
    part: 'activity-step',
    element: 'div',
    required: false,
    purpose:
      'One step of the activity: complete with a tick, current with the shared ring and a travelling band.',
  },
  {
    part: 'versions',
    element: 'div',
    required: false,
    purpose:
      'The pager between a reply’s versions, drawn with two or more; a group named Versions.',
  },
  {
    part: 'version-previous',
    element: 'button',
    required: false,
    purpose: 'The previous version; disabled at the first, and turned in a right-to-left page.',
  },
  {
    part: 'version-label',
    element: 'span',
    required: false,
    purpose: '“2 of 3”, a polite live region so a reader hears where the pager landed.',
  },
  {
    part: 'version-next',
    element: 'button',
    required: false,
    purpose: 'The next version; disabled at the last, never wrapping.',
  },
];

const bubbleAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The bubble, written data-part="bubble" because it nests inside a row. Carries data-variant, data-tone, data-clamped and data-revealed.',
  },
  {
    part: 'content',
    element: 'div, button or a',
    required: true,
    purpose:
      'The painted surface. As a button it is a quick reply; as an a, a way out of the thread.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'The hour and the delivery mark riding at the end of the last line, inside the surface.',
  },
  {
    part: 'quote',
    element: 'div or button',
    required: false,
    purpose:
      'The message a reply answers, at the head of the surface; a button when it jumps to it.',
  },
  {
    part: 'quote-author',
    element: 'span',
    required: false,
    purpose: 'The quoted message’s author, over its words.',
  },
  {
    part: 'more',
    element: 'button',
    required: false,
    purpose:
      '“Show more” under a clamped text, drawn only while it overflows; aria-expanded and aria-controls.',
  },
  {
    part: 'stream',
    element: 'span',
    required: false,
    purpose:
      'The words of a streamed reply. Each arrival is split into words that enter as a wave of at most 320 ms; the text is whole in the DOM at once.',
  },
  {
    part: 'stream-chunk',
    element: 'span',
    required: false,
    purpose:
      'One word still entering, out of a blur, after its delay; folded back into the text once it has entered.',
  },
  {
    part: 'caret',
    element: 'span',
    required: false,
    purpose:
      'A dot after the last word of a streaming reply, breathing; hidden from assistive technology.',
  },
  {
    part: 'typing',
    element: 'span',
    required: false,
    purpose: 'Three dots in a wave, role img, named “Typing”; the bubble trails two circles.',
  },
  {
    part: 'retry',
    element: 'button',
    required: false,
    purpose: 'The round danger control beside a message that did not go, which sends it again.',
  },
  {
    part: 'reactions',
    element: 'div',
    required: false,
    purpose:
      'A raised pill straddling the surface’s lower edge; a row under the words in a thread.',
  },
  {
    part: 'reaction',
    element: 'button',
    required: false,
    purpose: 'One reaction, aria-pressed; the reader’s own takes the accent’s tint and edge.',
  },
  {
    part: 'reaction-count',
    element: 'span',
    required: false,
    purpose: 'The count the consumer’s store holds, in tabular figures.',
  },
];

const messageScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One row with its side, layout, action visibility and status on the controls. Switch status to failed, read or streaming and watch the article’s own states and the receipt follow.',
    snippet: defineSnippet({
      id: 'message-react-playground',
      language: 'tsx',
      label: 'A reply in a support thread',
      source: `<Message align="start" status="read">
  <MessageBody>
    <Bubble>
      <BubbleContent>Tuesday's payout came back with error R03.</BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'align',
    title: 'Two sides, asked once',
    note: 'align lives on the row. A bubble in an end row paints the accent’s fill by itself; a bubble in a start row the secondary tint. Nothing is repeated on the bubble.',
    snippet: defineSnippet({
      id: 'message-react-align',
      language: 'tsx',
      label: 'The reader’s own message',
      source: `<Message align="end">
  <MessageBody>
    <Bubble>
      <BubbleContent>Great. I will resend as soon as it arrives.</BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'avatar',
    title: 'The avatar at the foot of the words',
    note: 'The avatar sits on the line of the last bubble, not of the footer under it, and moves to the end side with the row. It is the avatar family’s small step, so it follows the density.',
    snippet: defineSnippet({
      id: 'message-react-avatar',
      language: 'tsx',
      label: 'A row with an avatar',
      source: `<Message>
  <MessageAvatar>
    <Avatar name="Marta Silva" size="sm" />
  </MessageAvatar>
  <MessageBody>
    <Bubble>
      <BubbleContent>It arrives this afternoon.</BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'group',
    title: 'A run from one sender',
    note: 'Three rows, one avatar on the last. The rows stand two pixels apart and the corners facing each other on the sender’s side draw in to four; the earlier rows keep the avatar column without an empty slot.',
    snippet: defineSnippet({
      id: 'message-react-group',
      language: 'tsx',
      label: 'A run',
      source: `<MessageGroup>
  <Message>
    <MessageBody>
      <Bubble>
        <BubbleContent>Tuesday's payout came back with error R03.</BubbleContent>
      </Bubble>
    </MessageBody>
  </Message>
  <Message>
    <MessageAvatar>
      <Avatar name="Marta Silva" size="sm" />
    </MessageAvatar>
    <MessageBody>
      <Bubble>
        <BubbleContent>It arrives this afternoon.</BubbleContent>
      </Bubble>
    </MessageBody>
  </Message>
</MessageGroup>;`,
    }),
  },
  {
    id: 'header',
    title: 'Who spoke, and when',
    note: 'The header sets the name on the inset of the words, so the name stands over the first letter it names. The dot between name and hour is drawn by the stylesheet and never read aloud.',
    snippet: defineSnippet({
      id: 'message-react-header',
      language: 'tsx',
      label: 'Name and hour',
      source: `<MessageHeader>
  <MessageAuthor>Marta Silva</MessageAuthor>
  <MessageTime dateTime="2026-09-30T09:38">09:38</MessageTime>
</MessageHeader>;`,
    }),
  },
  {
    id: 'receipt',
    title: 'Where a message is in its delivery',
    note: 'Inside the bubble the hour and the mark ride at the end of the last line: a breathing clock while sending, one tick, two ticks, and two ticks in full ink once read. A message that did not go says so in a word under it, with the retry control beside it.',
    snippet: defineSnippet({
      id: 'message-react-receipt',
      language: 'tsx',
      label: 'Read, inside the bubble',
      source: `<Message align="end" status="read">
  <MessageBody>
    <Bubble>
      <BubbleContent>
        And I mark the invoice as paid only after the credit.
        <BubbleMeta>
          <MessageTime dateTime="2026-09-30T09:41">09:41</MessageTime>
          <MessageReceipt />
        </BubbleMeta>
      </BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions the row reveals',
    note: 'With actionsVisibility="hover" the toolbar keeps its room and appears under the pointer and on focus anywhere in the row; on a screen that cannot hover it is always painted. Tab into the row to see it arrive.',
    snippet: defineSnippet({
      id: 'message-react-actions',
      language: 'tsx',
      label: 'Copy and regenerate',
      source: `<MessageFooter>
  <MessageActions>
    <IconButton aria-label="Copiar" variant="ghost" size="sm">
      <Icon>
        <Glyph name="copy" />
      </Icon>
    </IconButton>
  </MessageActions>
</MessageFooter>;`,
    }),
  },
  {
    id: 'activity',
    title: 'What a reply is doing before it has words',
    note: 'Steps done carry a tick and step back into the muted ink; the current one carries the shared ring and a band of light across its words. Under reduced motion the band stops and the words stand in the plain ink.',
    snippet: defineSnippet({
      id: 'message-react-activity',
      language: 'tsx',
      label: 'A log of steps',
      source: `<Message status="streaming">
  <MessageBody>
    <MessageActivity>
      <MessageActivityStep status="complete">Read the log from 14:00 to 14:10</MessageActivityStep>
      <MessageActivityStep>Looking for the cause of p95…</MessageActivityStep>
    </MessageActivity>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'versions',
    title: 'Versions of one reply',
    note: 'The pager draws with two or more versions and stops at both ends. ArrowLeft and ArrowRight page from either control, mirrored in a right-to-left page; the label is a polite live region.',
    snippet: defineSnippet({
      id: 'message-react-versions',
      language: 'tsx',
      label: 'Three versions',
      source: `<Message versionCount={3} version={version} onVersionChange={setVersion}>
  <MessageBody>
    <Bubble>
      <BubbleContent>{drafts[version]}</BubbleContent>
    </Bubble>
    <MessageFooter>
      <MessageVersions />
    </MessageFooter>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'layout',
    title: 'A comment thread',
    note: 'layout="thread" sets every row at the start with the avatar at the top, the name inline, the words unframed and a band under the pointer; the actions float at the row’s top end on a raised plate.',
    snippet: defineSnippet({
      id: 'message-react-layout',
      language: 'tsx',
      label: 'A thread row',
      source: `<Message layout="thread">
  <MessageAvatar>
    <Avatar name="Emily Parker" />
  </MessageAvatar>
  <MessageBody>
    <MessageHeader>
      <MessageAuthor>Emily Parker</MessageAuthor>
      <MessageTime dateTime="2026-09-30T09:12">4 minutes ago</MessageTime>
    </MessageHeader>
    <Bubble>
      <BubbleContent>Can we name the SSO owner before the review?</BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
];

const bubbleScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bubble with its variant, tone and clamp on the controls. A bubble outside a row takes the provider’s painting; inside one it takes the row’s side.',
    snippet: defineSnippet({
      id: 'message-react-bubble-playground',
      language: 'tsx',
      label: 'A bubble',
      source: `<Bubble variant="soft" tone="secondary">
  <BubbleContent>The destination account does not exist at the bank.</BubbleContent>
</Bubble>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Four paintings',
    note: 'solid is the tone’s fill, soft its tint with a rim that shows only in high contrast, outline its edge on the page, plain no box at all — the unframed answer that takes the whole row.',
    snippet: defineSnippet({
      id: 'message-react-variants',
      language: 'tsx',
      label: 'The four',
      source: `<Bubble variant="solid" tone="accent">
  …
</Bubble>;
<Bubble variant="soft">…</Bubble>;
<Bubble variant="outline">…</Bubble>;
<Bubble variant="plain">…</Bubble>;`,
    }),
  },
  {
    id: 'tones',
    title: 'Five tones',
    note: 'accent and secondary write in the page’s ink; success, warning and danger in their own, because there the colour of the words is the point — and the words say it too.',
    snippet: defineSnippet({
      id: 'message-react-tones',
      language: 'tsx',
      label: 'A status bubble',
      source: `<Bubble tone="danger">
  <BubbleContent>Step 5 failed and the worker did not come back.</BubbleContent>
</Bubble>;`,
    }),
  },
  {
    id: 'interactive',
    title: 'Quick replies and links',
    note: 'render turns the surface itself into a button or an a, and it keeps the painting, the hover, a distinct press and the focus ring. A link keeps middle-click and its destination.',
    snippet: defineSnippet({
      id: 'message-react-interactive',
      language: 'tsx',
      label: 'A quick reply',
      source: `<Bubble tone="accent">
  <BubbleContent render={(props) => <button type="button" {...props} onClick={retryAll} />}>
    Reenviar as duas agora
  </BubbleContent>
</Bubble>;`,
    }),
  },
  {
    id: 'quote',
    title: 'Replying to a message',
    note: 'The quote heads the surface in a block tinted with the surface’s own ink, author over up to three lines. With onJump it is a button that asks the scroller to take the reader to the quoted message.',
    snippet: defineSnippet({
      id: 'message-react-quote',
      language: 'tsx',
      label: 'A reply that jumps',
      source: `<BubbleContent>
  <BubbleQuote
    author="Marta Silva"
    onJump={() => scroller.current?.scrollToMessage('m2', { highlight: true })}
  >
    The destination account does not exist at the bank.
  </BubbleQuote>
  Send me the IBAN when it arrives.
</BubbleContent>;`,
    }),
  },
  {
    id: 'clamp',
    title: 'A long reply, clamped',
    note: 'maxLines shows the first lines and draws “Show more” only while the text overflows. The whole text stays in the DOM for copying and finding in the page; the chevron turns as it opens.',
    snippet: defineSnippet({
      id: 'message-react-clamp',
      language: 'tsx',
      label: 'Three lines',
      source: `<Bubble maxLines={3}>
  <BubbleContent>{longAnswer}</BubbleContent>
</Bubble>;`,
    }),
  },
  {
    id: 'streaming',
    title: 'A reply while it streams',
    note: 'Words arrive in bursts. BubbleStream splits each arrival into words, and a burst enters as a wave of at most 320 ms, each word out of a blur; nothing is held back from the DOM. The dot breathes after the last word. The row is aria-busy, so the words are not read as they land. Under reduced motion every word lands settled and the dot stands lit.',
    snippet: defineSnippet({
      id: 'message-react-streaming',
      language: 'tsx',
      label: 'Streaming',
      source: `<Message status="streaming">
  <MessageBody>
    <Bubble>
      <BubbleContent>
        <BubbleStream text={received} />
        <BubbleCaret />
      </BubbleContent>
    </Bubble>
  </MessageBody>
</Message>;`,
    }),
  },
  {
    id: 'typing',
    title: 'Someone is writing',
    note: 'Three dots rise and brighten in a wave in the writer’s bubble, which trails two circles of its own fill and edge and arrives rising from them. It is one image named for assistive technology.',
    snippet: defineSnippet({
      id: 'message-react-typing',
      language: 'tsx',
      label: 'Typing',
      source: `<Bubble>
  <BubbleContent>
    <BubbleTyping aria-label="Marta is typing" />
  </BubbleContent>
</Bubble>;`,
    }),
  },
  {
    id: 'reactions',
    title: 'Reactions',
    note: 'The pill straddles the lower edge on the side away from the sender and rises into the surface by half its inset, clear of the words. The reader’s own reaction takes the accent’s tint and edge; a disabled one stays legible.',
    snippet: defineSnippet({
      id: 'message-react-reactions',
      language: 'tsx',
      label: 'A reaction the reader gave',
      source: `<BubbleReactions>
  <BubbleReaction count={4} defaultPressed>
    👍
  </BubbleReaction>
</BubbleReactions>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content nobody chose',
    note: 'A URL of a hundred characters breaks where it must instead of pushing the bubble past its share; an Arabic line in a Portuguese thread reads from its own side; a two-letter reply is still a bubble, not a pill.',
    snippet: defineSnippet({
      id: 'message-react-content',
      language: 'tsx',
      label: 'Any text',
      source: `<Bubble>
  <BubbleContent>{text}</BubbleContent>
</Bubble>;`,
    }),
  },
];

const messageEvents: EventRow[] = [
  {
    name: 'onVersionChange',
    payload: '(version: number, request: ChangeRequest<number>)',
    when: 'Before the version moves, bounded to the range. reason is pointer for a press and keyboard for Enter, Space or an arrow. cancel() keeps the version.',
  },
  {
    name: 'onRetry',
    payload: '(request: { reason, source })',
    when: 'When BubbleRetry is pressed, after the consumer’s own onClick; nothing is committed, the message is the consumer’s to send again.',
  },
];

const bubbleEvents: EventRow[] = [
  {
    name: 'onRevealedChange',
    payload: '(revealed: boolean, request: ChangeRequest<boolean>)',
    when: 'Before a clamped text opens or closes, from the more control. reason is pointer or keyboard; cancel() keeps it.',
  },
  {
    name: 'onPressedChange',
    payload: '(pressed: boolean, request: ChangeRequest<boolean>)',
    when: 'On BubbleReaction, before the reader’s own reaction toggles. The count stays the consumer’s.',
  },
  {
    name: 'onJump',
    payload: '(event)',
    when: 'On BubbleQuote, when the quote is pressed; the page scrolls to the quoted message.',
  },
];

export const REACT_MESSAGE_DOCS = {
  message: {
    imports,
    anatomy: messageAnatomy,
    scenes: messageScenes,
    events: messageEvents,
    api: apiRows([
      [
        'align',
        "'start' | 'end'",
        'start',
        'Message',
        'The sender’s side; end is the reader’s own message',
      ],
      [
        'layout',
        "'bubble' | 'thread'",
        'bubble',
        'Message, MessageGroup',
        'Bubbles, or rows of a comment thread. Falls back to the group, then the provider',
      ],
      [
        'actionsVisibility',
        "'always' | 'hover'",
        'hover',
        'Message',
        'Actions at rest, or revealed by pointer, focus and on touch',
      ],
      [
        'status',
        "'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'streaming'",
        '—',
        'Message',
        'Delivery: aria-busy and data-loading while sending or streaming, data-invalid when failed, data-read when read',
      ],
      [
        'version',
        'number',
        '—',
        'Message',
        'The version on screen, from 0. Present means controlled',
      ],
      ['defaultVersion', 'number', '0', 'Message', 'The version an uncontrolled message starts on'],
      [
        'versionCount',
        'number',
        '1',
        'Message',
        'How many versions exist; the pager draws with two or more',
      ],
      [
        'onRetry',
        '(request) => void',
        '—',
        'Message',
        'Asks to send the message again; BubbleRetry calls it',
      ],
      [
        'messages',
        'PartialMessages<MessageMessages>',
        '—',
        'Message',
        'Words laid over the language in force, key by key, for the row and every part and bubble inside it; a bubble outside a row speaks the language in force',
      ],
      [
        'status',
        "'sending' | 'sent' | 'delivered' | 'read' | 'failed'",
        'the row’s',
        'MessageReceipt',
        'The receipt’s own status',
      ],
      [
        'status',
        "'complete' | 'current' | 'pending'",
        'current',
        'MessageActivityStep',
        'Done with a tick, in progress with the ring, or waiting',
      ],
      ['dateTime', 'string', '—', 'MessageTime', 'The time element’s own machine-readable value'],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Renders the wiring into another element; spread it',
      ],
      ['ref', 'Ref<HTMLElement>', '—', 'every part', 'Reaches the native element'],
    ]),
    composition: apiRows([
      [
        'MessageDefaultsProvider',
        '{ layout, actionsVisibility, variant, tone }',
        '—',
        'a subtree',
        'Sets them once; a group, a row or a bubble still wins',
      ],
      ['aria-label', 'string', '—', 'Message', 'Replaces the author as the article’s name'],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'The consumer element receives data-part and the wiring',
      ],
      [
        'onKeyDown',
        'handler',
        '—',
        'MessageVersions',
        'Composed: preventDefault keeps the arrow from the pager',
      ],
    ]),
    accessibility: [
      'Each message is an article labelled by its author, so a screen reader that moves between articles hears who spoke; an aria-label on the row replaces the author.',
      'Delivery is said three ways: a state attribute for styling, a mark for the eye, and a word for assistive technology — the word inside a bubble’s meta is visually hidden, and outside a bubble it is the only thing drawn.',
      'A message that is sending or streaming is aria-busy, so its words are not announced as they land; the scroller’s log announces the finished row once.',
      'The actions are a toolbar named Message actions; revealed by hover, they also appear on focus inside the row and are always painted where the pointer cannot hover.',
      'The activity is a status region; the current step carries aria-current="step", and its travelling band stops under reduced motion.',
      'The version pager is a group with two named buttons and a polite live label; the buttons disable at the ends rather than wrapping.',
    ],
    snippets: [
      defineSnippet({
        id: 'message-react-anatomy',
        language: 'tsx',
        label: 'Every part of a row',
        source: `<MessageGroup>
  <Message status="read" versionCount={2}>
    <MessageAvatar>
      <Avatar name="Marta Silva" size="sm" />
    </MessageAvatar>
    <MessageBody>
      <MessageHeader>
        <MessageAuthor>Marta Silva</MessageAuthor>
        <MessageTime dateTime="2026-09-30T09:38">09:38</MessageTime>
      </MessageHeader>
      <MessageActivity>
        <MessageActivityStep status="complete">Li o registo</MessageActivityStep>
      </MessageActivity>
      <Bubble>
        <BubbleContent>It arrives this afternoon.</BubbleContent>
      </Bubble>
      <MessageFooter>
        <MessageReceipt />
        <MessageVersions />
        <MessageActions>{actions}</MessageActions>
      </MessageFooter>
    </MessageBody>
  </Message>
</MessageGroup>;`,
      }),
    ],
  },
  bubble: {
    imports,
    anatomy: bubbleAnatomy,
    scenes: bubbleScenes,
    events: bubbleEvents,
    api: apiRows([
      [
        'variant',
        "'solid' | 'soft' | 'outline' | 'plain'",
        'soft',
        'Bubble',
        'The painting. Falls back to the row (end is solid, thread is plain), then the provider',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'Bubble',
        'The tone. Falls back to the row (end is accent), then the provider',
      ],
      [
        'maxLines',
        'number',
        '—',
        'Bubble',
        'Lines shown before the text is clamped behind “Show more”',
      ],
      [
        'revealed',
        'boolean',
        '—',
        'Bubble',
        'The clamped text shown whole. Present means controlled',
      ],
      [
        'defaultRevealed',
        'boolean',
        'false',
        'Bubble',
        'Whether an uncontrolled clamp starts open',
      ],
      [
        'pressed',
        'boolean',
        '—',
        'BubbleReaction',
        'The reader’s own reaction. Present means controlled',
      ],
      [
        'defaultPressed',
        'boolean',
        'false',
        'BubbleReaction',
        'Whether an uncontrolled reaction starts pressed',
      ],
      ['count', 'number', '—', 'BubbleReaction', 'The count the consumer’s store holds'],
      [
        'text',
        'string',
        '—',
        'BubbleStream',
        'The whole reply received so far; text that extends it enters word by word',
      ],
      [
        'animate',
        'boolean',
        'the row is streaming',
        'BubbleStream',
        'Let arrivals enter; the arrival that ends the stream enters too',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'BubbleReaction',
        'The native disabled; the reaction stays legible',
      ],
      ['author', 'ReactNode', '—', 'BubbleQuote', 'The quoted message’s author'],
      [
        'onJump',
        '(event) => void',
        '—',
        'BubbleQuote',
        'Makes the quote a button that jumps to the quoted message',
      ],
      [
        'aria-label',
        'string',
        'typing message',
        'BubbleTyping',
        'The dots’ accessible name; the typing message when absent',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Bubble, BubbleContent, BubbleMeta, BubbleQuote, BubbleStream, BubbleCaret, BubbleRetry, BubbleReactions',
        'Renders the wiring into another element — the surface as a button or a link',
      ],
    ]),
    composition: apiRows([
      [
        'MessageDefaultsProvider',
        '{ variant, tone }',
        '—',
        'a subtree',
        'The painting of a bubble nothing infers',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'BubbleContent',
        'A button or an a keeps the painting, the states and the ring',
      ],
      [
        'onClick',
        'handler',
        '—',
        'BubbleRetry, BubbleReaction',
        'Composed: runs first, preventDefault refuses the family’s request',
      ],
    ]),
    accessibility: [
      'A bubble paints; it adds no role. A surface rendered as a button or an a is that element, so its name is its words and it keeps the platform’s keys.',
      'Painting is never the only signal: a danger bubble says its failure in words, the reader’s own side is the row’s alignment, and a reaction’s pressed state is aria-pressed.',
      '“Show more” is a button with aria-expanded and aria-controls on the surface; the clamped text is never removed from the DOM.',
      'The typing dots are one image with a name, and the caret is aria-hidden: neither is read as characters.',
      'The retry control is named Try sending again and sits beside the surface it resends, after it in the reading order.',
    ],
    snippets: [
      defineSnippet({
        id: 'message-react-bubble-anatomy',
        language: 'tsx',
        label: 'Every part of a bubble',
        source: `<Bubble maxLines={6}>
  <BubbleContent>
    <BubbleQuote author="Martha Wells">The destination account does not exist.</BubbleQuote>
    Send me the IBAN when it arrives.
    <BubbleMeta>
      <MessageTime dateTime="2026-09-30T09:44">09:44</MessageTime>
      <MessageReceipt />
    </BubbleMeta>
  </BubbleContent>
  <BubbleRetry />
  <BubbleReactions>
    <BubbleReaction count={2}>👍</BubbleReaction>
  </BubbleReactions>
</Bubble>;`,
      }),
    ],
  },
} as const;
