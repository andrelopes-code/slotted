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

export const ANGULAR_MESSAGE_TOKENS = messageTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Message decision',
}));

const imports: ReferenceImport = {
  source:
    "import { provideMessageDefaults, SlBubble, SlBubbleCaret, SlBubbleContent, SlBubbleMeta, SlBubbleQuote, SlBubbleReaction, SlBubbleReactions, SlBubbleRetry, SlBubbleStream, SlBubbleTyping, SlMessage, SlMessageActions, SlMessageActivity, SlMessageActivityStep, SlMessageAuthor, SlMessageAvatar, SlMessageBody, SlMessageFooter, SlMessageGroup, SlMessageHeader, SlMessageReceipt, SlMessageTime, SlMessageVersions } from '@slotted/angular/message';",
  selector:
    '[slMessage], [slMessageGroup], [slMessageAvatar], [slMessageBody], [slMessageHeader], [slMessageAuthor], time[slMessageTime], [slMessageFooter], [slMessageReceipt], [slMessageActions], [slMessageActivity], [slMessageActivityStep], [slMessageVersions], [slBubble], [slBubbleContent], [slBubbleMeta], [slBubbleQuote], [slBubbleCaret], [slBubbleTyping], button[slBubbleRetry], [slBubbleReactions], button[slBubbleReaction]',
  exportAs: 'slMessage, slMessageGroup, slBubble',
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
      id: 'message-angular-playground',
      language: 'angular',
      label: 'A reply in a support thread',
      source: `<article slMessage status="read">
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>The payout from Tuesday came back with error R03.</div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'align',
    title: 'Two sides, asked once',
    note: 'align lives on the row. A bubble in an end row paints the accent’s fill by itself; a bubble in a start row the secondary tint. Nothing is repeated on the bubble.',
    snippet: defineSnippet({
      id: 'message-angular-align',
      language: 'angular',
      label: 'The reader’s own message',
      source: `<article slMessage align="end">
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>Great. I will resend as soon as it arrives.</div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'avatar',
    title: 'The avatar at the foot of the words',
    note: 'The avatar sits on the line of the last bubble, not of the footer under it, and moves to the end side with the row. It is the avatar family’s small step, so it follows the density.',
    snippet: defineSnippet({
      id: 'message-angular-avatar',
      language: 'angular',
      label: 'A row with an avatar',
      source: `<article slMessage>
  <div slMessageAvatar>
    <span slAvatar name="Marta Silva" size="sm"></span>
  </div>
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>It arrives this afternoon.</div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'group',
    title: 'A run from one sender',
    note: 'Three rows, one avatar on the last. The rows stand two pixels apart and the corners facing each other on the sender’s side draw in to four; the earlier rows keep the avatar column without an empty slot.',
    snippet: defineSnippet({
      id: 'message-angular-group',
      language: 'angular',
      label: 'A run',
      source: `<div slMessageGroup>
  <article slMessage>
    <div slMessageBody>
      <div slBubble>
        <div slBubbleContent>The payout from Tuesday came back with error R03.</div>
      </div>
    </div>
  </article>
  <article slMessage>
    <div slMessageAvatar>
      <span slAvatar name="Marta Silva" size="sm"></span>
    </div>
    <div slMessageBody>
      <div slBubble>
        <div slBubbleContent>It arrives this afternoon.</div>
      </div>
    </div>
  </article>
</div>`,
    }),
  },
  {
    id: 'header',
    title: 'Who spoke, and when',
    note: 'The header sets the name on the inset of the words, so the name stands over the first letter it names. The dot between name and hour is drawn by the stylesheet and never read aloud.',
    snippet: defineSnippet({
      id: 'message-angular-header',
      language: 'angular',
      label: 'Name and hour',
      source: `<div slMessageHeader>
  <span slMessageAuthor>Marta Silva</span>
  <time slMessageTime datetime="2026-09-30T09:38">09:38</time>
</div>`,
    }),
  },
  {
    id: 'receipt',
    title: 'Where a message is in its delivery',
    note: 'Inside the bubble the hour and the mark ride at the end of the last line: a breathing clock while sending, one tick, two ticks, and two ticks in full ink once read. A message that did not go says so in a word under it, with the retry control beside it.',
    snippet: defineSnippet({
      id: 'message-angular-receipt',
      language: 'angular',
      label: 'Read, inside the bubble',
      source: `<article slMessage align="end" status="read">
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>
        And I mark the invoice as paid only after the credit.
        <span slBubbleMeta>
          <time slMessageTime datetime="2026-09-30T09:41">09:41</time>
          <span slMessageReceipt></span>
        </span>
      </div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'actions',
    title: 'Actions the row reveals',
    note: 'With actionsVisibility="hover" the toolbar keeps its room and appears under the pointer and on focus anywhere in the row; on a screen that cannot hover it is always painted. Tab into the row to see it arrive.',
    snippet: defineSnippet({
      id: 'message-angular-actions',
      language: 'angular',
      label: 'Copy and regenerate',
      source: `<div slMessageFooter>
  <div slMessageActions>
    <button slIconButton aria-label="Copiar" variant="ghost" size="sm">
      <span slIcon><svg slGlyph name="copy"></svg></span>
    </button>
  </div>
</div>`,
    }),
  },
  {
    id: 'activity',
    title: 'What a reply is doing before it has words',
    note: 'Steps done carry a tick and step back into the muted ink; the current one carries the shared ring and a band of light across its words. Under reduced motion the band stops and the words stand in the plain ink.',
    snippet: defineSnippet({
      id: 'message-angular-activity',
      language: 'angular',
      label: 'A log of steps',
      source: `<article slMessage status="streaming">
  <div slMessageBody>
    <div slMessageActivity>
      <div slMessageActivityStep status="complete">I read the log from 14:00 to 14:10</div>
      <div slMessageActivityStep>Looking for the cause of the p95…</div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'versions',
    title: 'Versions of one reply',
    note: 'The pager draws with two or more versions and stops at both ends. ArrowLeft and ArrowRight page from either control, mirrored in a right-to-left page; the label is a polite live region.',
    snippet: defineSnippet({
      id: 'message-angular-versions',
      language: 'angular',
      label: 'Three versions',
      source: `<article slMessage [versionCount]="3" [(version)]="version">
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>{{ drafts[version] }}</div>
    </div>
    <div slMessageFooter>
      <div slMessageVersions></div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'layout',
    title: 'A comment thread',
    note: 'layout="thread" sets every row at the start with the avatar at the top, the name inline, the words unframed and a band under the pointer; the actions float at the row’s top end on a raised plate.',
    snippet: defineSnippet({
      id: 'message-angular-layout',
      language: 'angular',
      label: 'A thread row',
      source: `<article slMessage layout="thread">
  <div slMessageAvatar>
    <span slAvatar name="Emily Parker"></span>
  </div>
  <div slMessageBody>
    <div slMessageHeader>
      <span slMessageAuthor>Emily Parker</span>
      <time slMessageTime datetime="2026-09-30T09:12">4 minutes ago</time>
    </div>
    <div slBubble>
      <div slBubbleContent>Can we name the SSO owner before the review?</div>
    </div>
  </div>
</article>`,
    }),
  },
];

const bubbleScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bubble with its variant, tone and clamp on the controls. A bubble outside a row takes the provider’s painting; inside one it takes the row’s side.',
    snippet: defineSnippet({
      id: 'message-angular-bubble-playground',
      language: 'angular',
      label: 'A bubble',
      source: `<div slBubble variant="soft" tone="secondary">
  <div slBubbleContent>The destination account does not exist at the bank.</div>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'Four paintings',
    note: 'solid is the tone’s fill, soft its tint with a rim that shows only in high contrast, outline its edge on the page, plain no box at all — the unframed answer that takes the whole row.',
    snippet: defineSnippet({
      id: 'message-angular-variants',
      language: 'angular',
      label: 'The four',
      source: `<div slBubble variant="solid" tone="accent">…</div>
<div slBubble variant="soft">…</div>
<div slBubble variant="outline">…</div>
<div slBubble variant="plain">…</div>`,
    }),
  },
  {
    id: 'tones',
    title: 'Five tones',
    note: 'accent and secondary write in the page’s ink; success, warning and danger in their own, because there the color of the words is the point — and the words say it too.',
    snippet: defineSnippet({
      id: 'message-angular-tones',
      language: 'angular',
      label: 'A status bubble',
      source: `<div slBubble tone="danger">
  <div slBubbleContent>Step 5 failed and the worker did not come back.</div>
</div>`,
    }),
  },
  {
    id: 'interactive',
    title: 'Quick replies and links',
    note: 'Writing slBubbleContent on a button or an a makes the surface itself that element; it keeps the painting, the hover, a distinct press and the focus ring. A link keeps middle-click and its destination.',
    snippet: defineSnippet({
      id: 'message-angular-interactive',
      language: 'angular',
      label: 'A quick reply',
      source: `<div slBubble tone="accent">
  <button slBubbleContent type="button" (click)="retryAll()">Reenviar as duas agora</button>
</div>`,
    }),
  },
  {
    id: 'quote',
    title: 'Replying to a message',
    note: 'The quote heads the surface in a block tinted with the surface’s own ink, author over up to three lines. Written on a button it asks, through (click), the scroller to take the reader to the quoted message.',
    snippet: defineSnippet({
      id: 'message-angular-quote',
      language: 'angular',
      label: 'A reply that jumps',
      source: `<div slBubbleContent>
  <button
    slBubbleQuote
    type="button"
    author="Marta Silva"
    (click)="chat.scrollToMessage('m2', { highlight: true })"
  >
    The destination account does not exist at the bank.
  </button>
  Send me the account number when it arrives.
</div>`,
    }),
  },
  {
    id: 'clamp',
    title: 'A long reply, clamped',
    note: 'maxLines shows the first lines and draws “Show more” only while the text overflows. The whole text stays in the DOM for copying and finding in the page; the chevron turns as it opens.',
    snippet: defineSnippet({
      id: 'message-angular-clamp',
      language: 'angular',
      label: 'Three lines',
      source: `<div slBubble [maxLines]="3">
  <div slBubbleContent>{{ longAnswer }}</div>
</div>`,
    }),
  },
  {
    id: 'streaming',
    title: 'A reply while it streams',
    note: 'Words arrive in bursts. slBubbleStream splits each arrival into words, and a burst enters as a wave of at most 320 ms, each word out of a blur; nothing is held back from the DOM. The dot breathes after the last word. The row is aria-busy, so the words are not read as they land. Under reduced motion every word lands settled and the dot stands lit.',
    snippet: defineSnippet({
      id: 'message-angular-streaming',
      language: 'angular',
      label: 'Streaming',
      source: `<article slMessage status="streaming">
  <div slMessageBody>
    <div slBubble>
      <div slBubbleContent>
        <span slBubbleStream [text]="received"></span><span slBubbleCaret></span>
      </div>
    </div>
  </div>
</article>`,
    }),
  },
  {
    id: 'typing',
    title: 'Someone is writing',
    note: 'Three dots rise and brighten in a wave in the writer’s bubble, which trails two circles of its own fill and edge and arrives rising from them. It is one image named for assistive technology.',
    snippet: defineSnippet({
      id: 'message-angular-typing',
      language: 'angular',
      label: 'Typing',
      source: `<div slBubble>
  <div slBubbleContent>
    <span slBubbleTyping aria-label="Marta is typing"></span>
  </div>
</div>`,
    }),
  },
  {
    id: 'reactions',
    title: 'Reactions',
    note: 'The pill straddles the lower edge on the side away from the sender and rises into the surface by half its inset, clear of the words. The reader’s own reaction takes the accent’s tint and edge; a disabled one stays legible.',
    snippet: defineSnippet({
      id: 'message-angular-reactions',
      language: 'angular',
      label: 'A reaction the reader gave',
      source: `<div slBubbleReactions>
  <button slBubbleReaction [count]="4" [(pressed)]="liked">👍</button>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content nobody chose',
    note: 'A URL of a hundred characters breaks where it must instead of pushing the bubble past its share; an Arabic line in a Portuguese thread reads from its own side; a two-letter reply is still a bubble, not a pill.',
    snippet: defineSnippet({
      id: 'message-angular-content',
      language: 'angular',
      label: 'Any text',
      source: `<div slBubble>
  <div slBubbleContent>{{ text }}</div>
</div>`,
    }),
  },
];

const messageEvents: EventRow[] = [
  {
    name: 'versionChangeRequest',
    payload: 'ChangeRequest<number>',
    when: 'Before the version moves, bounded to the range. reason is pointer for a press and keyboard for Enter, Space or an arrow. cancel() keeps the version; [(version)] then stays.',
  },
  {
    name: '(retry)',
    payload: '{ reason, source }',
    when: 'When slBubbleRetry is pressed, after the page’s own (click); nothing is committed, the message is the page’s to send again.',
  },
];

const bubbleEvents: EventRow[] = [
  {
    name: 'revealedChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before a clamped text opens or closes, from the more control. reason is pointer or keyboard; cancel() keeps it.',
  },
  {
    name: 'pressedChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'On slBubbleReaction, before the reader’s own reaction toggles. The count stays the page’s.',
  },
  {
    name: '(click)',
    payload: 'MouseEvent',
    when: 'On a button[slBubbleQuote], the page scrolls to the quoted message with the scroller’s scrollToMessage.',
  },
];

export const ANGULAR_MESSAGE_DOCS = {
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
        'slMessage',
        'The sender’s side; end is the reader’s own message',
      ],
      [
        'layout',
        "'bubble' | 'thread'",
        'bubble',
        'slMessage, slMessageGroup',
        'Bubbles, or rows of a comment thread. Falls back to the group, then the token',
      ],
      [
        'actionsVisibility',
        "'always' | 'hover'",
        'hover',
        'slMessage',
        'Actions at rest, or revealed by pointer, focus and on touch',
      ],
      [
        'status',
        "'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'streaming'",
        '—',
        'slMessage',
        'Delivery: aria-busy and data-loading while sending or streaming, data-invalid when failed, data-read when read',
      ],
      [
        'version',
        'number (model)',
        '0',
        'slMessage',
        'The version on screen, from 0; two-way with [(version)]',
      ],
      [
        'defaultVersion',
        'number',
        '0',
        'slMessage',
        'An unbound [version] is the starting version; the component then holds it',
      ],
      [
        'versionCount',
        'number',
        '1',
        'slMessage',
        'How many versions exist; the pager draws with two or more',
      ],
      [
        'messages',
        'PartialMessages<MessageMessages>',
        '—',
        'slMessage',
        'Words laid over the language in force, key by key, for the row and every part and bubble inside it; a bubble outside a row speaks the language in force',
      ],
      [
        'status',
        "'sending' | 'sent' | 'delivered' | 'read' | 'failed'",
        'the row’s',
        'slMessageReceipt',
        'The receipt’s own status',
      ],
      [
        'status',
        "'complete' | 'current' | 'pending'",
        'current',
        'slMessageActivityStep',
        'Done with a tick, in progress with the ring, or waiting',
      ],
      [
        'datetime',
        'string',
        '—',
        'time[slMessageTime]',
        'The time element’s own machine-readable value',
      ],
      [
        'exportAs',
        'slMessage, slMessageGroup',
        '—',
        'slMessage, slMessageGroup',
        'The instance: version(), requestVersion() and the resolved layout',
      ],
    ]),
    composition: apiRows([
      [
        'provideMessageDefaults',
        '{ layout, actionsVisibility, variant, tone }',
        '—',
        'providers',
        'Sets them once; a group, a row or a bubble still wins',
      ],
      [
        'aria-label',
        'string',
        '—',
        'slMessage',
        'Written on the article, it replaces the author as the article’s name',
      ],
      [
        'the page’s element',
        'any',
        '—',
        'every part',
        'The page writes the element; the directive adds data-part and the wiring',
      ],
      [
        '(keydown)',
        'handler',
        '—',
        'slMessageVersions',
        'Runs beside the pager’s own; preventDefault keeps the arrow',
      ],
    ]),
    accessibility: [
      'Each message is an article labelled by its author, so a screen reader that moves between articles hears who spoke; an aria-label written on the article replaces the author.',
      'Delivery is said three ways: a state attribute for styling, a mark for the eye, and a word for assistive technology — the word inside slBubbleMeta is visually hidden, and outside a bubble it is the only thing drawn.',
      'A message that is sending or streaming is aria-busy, so its words are not announced as they land; the scroller’s log announces the finished row once.',
      'The actions are a toolbar named Message actions; revealed by hover, they also appear on focus inside the row and are always painted where the pointer cannot hover.',
      'The activity is a status region; the current step carries aria-current="step", and its travelling band stops under reduced motion.',
      'The version pager is a group with two named buttons and a polite live label; the buttons disable at the ends rather than wrapping.',
    ],
    snippets: [
      defineSnippet({
        id: 'message-angular-anatomy',
        language: 'angular',
        label: 'Every part of a row',
        source: `<div slMessageGroup>
  <article slMessage status="read" [versionCount]="2">
    <div slMessageAvatar><span slAvatar name="Marta Silva" size="sm"></span></div>
    <div slMessageBody>
      <div slMessageHeader>
        <span slMessageAuthor>Marta Silva</span>
        <time slMessageTime datetime="2026-09-30T09:38">09:38</time>
      </div>
      <div slMessageActivity>
        <div slMessageActivityStep status="complete">Li o registo</div>
      </div>
      <div slBubble>
        <div slBubbleContent>It arrives this afternoon.</div>
      </div>
      <div slMessageFooter>
        <span slMessageReceipt></span>
        <div slMessageVersions></div>
        <div slMessageActions></div>
      </div>
    </div>
  </article>
</div>`,
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
        'slBubble',
        'The painting. Falls back to the row (end is solid, thread is plain), then the token',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slBubble',
        'The tone. Falls back to the row (end is accent), then the token',
      ],
      [
        'maxLines',
        'number',
        '—',
        'slBubble',
        'Lines shown before the text is clamped behind “Show more”',
      ],
      [
        'revealed',
        'boolean (model)',
        'false',
        'slBubble',
        'The clamped text shown whole; two-way with [(revealed)]',
      ],
      [
        'defaultRevealed',
        'boolean',
        'false',
        'slBubble',
        'An unbound [revealed] is the starting state; the component then holds it',
      ],
      [
        'pressed',
        'boolean (model)',
        'false',
        'slBubbleReaction',
        'The reader’s own reaction; two-way with [(pressed)]',
      ],
      [
        'defaultPressed',
        'boolean',
        'false',
        'slBubbleReaction',
        'An unbound [pressed] is the starting state; the component then holds it',
      ],
      ['count', 'number', '—', 'slBubbleReaction', 'The count the page’s store holds'],
      [
        'text',
        'string',
        '—',
        'slBubbleStream',
        'The whole reply received so far; text that extends it enters word by word',
      ],
      [
        'animate',
        'boolean',
        'the row is streaming',
        'slBubbleStream',
        'Let arrivals enter; the arrival that ends the stream enters too',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slBubbleReaction',
        'The native disabled; the reaction stays legible',
      ],
      ['author', 'string', '—', 'slBubbleQuote', 'The quoted message’s author'],
      [
        'aria-label',
        'string',
        'typing message',
        'slBubbleTyping',
        'The dots’ accessible name; the typing message when absent',
      ],
      [
        'element',
        'div | button | a',
        'div',
        'slBubbleContent, slBubbleQuote',
        'The element the page writes the directive on: a button is a quick reply, an a a way out',
      ],
    ]),
    composition: apiRows([
      [
        'provideMessageDefaults',
        '{ variant, tone }',
        '—',
        'providers',
        'The painting of a bubble nothing infers',
      ],
      [
        'element',
        'button | a',
        '—',
        'slBubbleContent',
        'A button or an a keeps the painting, the states and the ring',
      ],
      [
        '(click)',
        'handler',
        '—',
        'button[slBubbleRetry], button[slBubbleReaction]',
        'Runs first; preventDefault refuses the family’s request',
      ],
    ]),
    accessibility: [
      'A bubble paints; it adds no role. slBubbleContent written on a button or an a is that element, so its name is its words and it keeps the platform’s keys.',
      'Painting is never the only signal: a danger bubble says its failure in words, the reader’s own side is the row’s alignment, and a reaction’s pressed state is aria-pressed.',
      '“Show more” is a button with aria-expanded and aria-controls on the surface; the clamped text is never removed from the DOM.',
      'The typing dots are one image with a name, and the caret is aria-hidden: neither is read as characters.',
      'The retry control is named Try sending again and sits beside the surface it resends, after it in the reading order.',
    ],
    snippets: [
      defineSnippet({
        id: 'message-angular-bubble-anatomy',
        language: 'angular',
        label: 'Every part of a bubble',
        source: `<div slBubble [maxLines]="6">
  <div slBubbleContent>
    <div slBubbleQuote author="Mary Stone">The destination account does not exist.</div>
    Send me the account number when it arrives.
    <span slBubbleMeta>
      <time slMessageTime datetime="2026-09-30T09:44">09:44</time>
      <span slMessageReceipt></span>
    </span>
  </div>
  <button slBubbleRetry></button>
  <div slBubbleReactions>
    <button slBubbleReaction [count]="2">👍</button>
  </div>
</div>`,
      }),
    ],
  },
} as const;
