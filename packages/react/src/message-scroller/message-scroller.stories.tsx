import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { Bubble, BubbleCaret, BubbleContent, Message, MessageBody } from '../message';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerJump,
  MessageScrollerLoader,
  MessageScrollerSeparator,
  MessageScrollerUnread,
  MessageScrollerViewport,
} from './index';
import type { MessageScrollerHandle, MessageScrollerPosition } from './index';
import {
  REACT_MESSAGE_SCROLLER_DOCS,
  REACT_MESSAGE_SCROLLER_TOKENS,
} from './message-scroller.docs';

interface Row {
  id: string;
  own: boolean;
  text: string;
}

/** One incident, one product: a webhook returning 500 on refunds. */
const SEED: Row[] = [
  { id: 'q1', own: true, text: 'The Stripe webhook is returning 500 on charge.refunded.' },
  {
    id: 'a1',
    own: false,
    text: 'The handler fails before acknowledging, so Stripe delivers the same event again. Each new attempt goes through the same path and the queue grows instead of draining.',
  },
  { id: 'q2', own: true, text: 'What is failing, exactly?' },
  {
    id: 'a2',
    own: false,
    text: 'The refund branch reads charge.payment_intent, which comes back null on refunds created in the dashboard. The null reaches the lookup helper, which fails before the 200 goes out.',
  },
  { id: 'q3', own: true, text: 'Give me the smallest patch that unblocks the queue.' },
  {
    id: 'a3',
    own: false,
    text: 'Return 200 as soon as the signature is verified and process the refund in a queue. A webhook acknowledges receipt, not success. That way, a null payment_intent becomes a job that fails and retries on your side.',
  },
];

const OLDER: Row[] = [
  {
    id: 'o1',
    own: true,
    text: 'I opened ticket 4821: the customer says the exports come back empty.',
  },
  { id: 'o2', own: false, text: 'Empty, not failed: each job finished with zero rows.' },
  { id: 'o3', own: true, text: 'Always the same workspace?' },
  { id: 'o4', own: false, text: 'Just one, ws_3311. No other account shows the pattern.' },
];

const REPLY =
  'I can write the patch and leave the resend script alongside it. The queue drains by itself after the deploy, because Stripe keeps failed events for three days; the guard is one line: if payment_intent comes back null, the helper returns early and the 200 goes out.';

function Bubbles({ row, streaming = false }: { row: Row; streaming?: boolean }) {
  return (
    <Message align={row.own ? 'end' : 'start'} aria-label={row.own ? 'Tu' : 'Assistente'}>
      <MessageBody>
        <Bubble {...(row.own ? {} : { variant: 'plain' as const })}>
          <BubbleContent>
            {row.text}
            {streaming ? <BubbleCaret /> : null}
          </BubbleContent>
        </Bubble>
      </MessageBody>
    </Message>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-viewport" data-size="tall">
      {children}
    </div>
  );
}

function Controls({ children }: { children: ReactNode }) {
  return <div className="slotted-demo-row">{children}</div>;
}

interface ChatProps {
  follow?: boolean;
  defaultPosition?: MessageScrollerPosition;
  peek?: number;
  history?: boolean;
  separators?: boolean;
  unread?: boolean;
  navigator?: boolean;
}

/** A conversation the reader can drive: ask, stream, receive, load older, jump. */
function Chat({
  defaultPosition = 'last-anchor',
  follow = true,
  history = false,
  navigator = false,
  peek = 48,
  separators = false,
  unread = false,
}: ChatProps) {
  const scroller = useRef<MessageScrollerHandle>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [older, setOlder] = useState(history ? OLDER : []);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<{ id: string; length: number } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const turns = useRef(0);

  useEffect(() => {
    if (stream === null || stream.length >= REPLY.length) return undefined;
    const timer = window.setTimeout(
      () => setStream((value) => (value === null ? null : { ...value, length: value.length + 4 })),
      40,
    );
    return () => window.clearTimeout(timer);
  }, [stream]);

  const ask = () => {
    turns.current += 1;
    const id = `live-q${turns.current}`;
    setRows((all) => [...all, { id, own: true, text: 'E se o evento chegar sem assinatura?' }]);
    window.setTimeout(() => setStream({ id: `live-a${turns.current}`, length: 0 }), 500);
  };
  const receive = () => {
    turns.current += 1;
    setRows((all) => [
      ...all,
      { id: `in-${turns.current}`, own: false, text: 'The 16:00 deploy already has the guard.' },
    ]);
  };
  const loadOlder = () => {
    if (loading || older.length === 0) return;
    setLoading(true);
    window.setTimeout(() => {
      setRows((all) => [...older, ...all]);
      setOlder([]);
      setLoading(false);
    }, 700);
  };

  const streaming = stream !== null && stream.length < REPLY.length;
  const questions = [...rows.filter((row) => row.own).map((row) => row.id)];
  const index = Math.max(0, questions.indexOf(current ?? ''));

  return (
    <div className="slotted-demo-stack" data-stretch="">
      <Frame>
        <MessageScroller
          busy={streaming}
          defaultPosition={defaultPosition}
          follow={follow}
          onAnchorChange={(id) => setCurrent(id)}
          onReachStart={history ? loadOlder : undefined}
          peek={peek}
          ref={scroller}
          scrollMargin={8}
        >
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {loading ? <MessageScrollerLoader /> : null}
              {separators ? (
                <MessageScrollerItem>
                  <MessageScrollerSeparator sticky>Yesterday</MessageScrollerSeparator>
                </MessageScrollerItem>
              ) : null}
              {rows.map((row, position) => (
                <Fragment key={row.id}>
                  {separators && position === 3 ? (
                    <MessageScrollerItem>
                      <MessageScrollerSeparator sticky>Today</MessageScrollerSeparator>
                    </MessageScrollerItem>
                  ) : null}
                  {unread && position === 4 ? (
                    <MessageScrollerItem>
                      <MessageScrollerUnread />
                    </MessageScrollerItem>
                  ) : null}
                  <MessageScrollerItem anchor={row.own} messageId={row.id}>
                    <Bubbles row={row} />
                  </MessageScrollerItem>
                </Fragment>
              ))}
              {stream === null ? null : (
                <MessageScrollerItem messageId={stream.id}>
                  <Bubbles
                    row={{ id: stream.id, own: false, text: REPLY.slice(0, stream.length) }}
                    streaming={streaming}
                  />
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerJump />
        </MessageScroller>
      </Frame>
      <Controls>
        <Button onClick={ask} size="sm" variant="outline">
          Send question
        </Button>
        <Button onClick={receive} size="sm" variant="outline">
          Receber resposta
        </Button>
        {history ? (
          <Button onClick={loadOlder} size="sm" variant="outline">
            Load earlier
          </Button>
        ) : null}
        {navigator ? (
          <>
            <Button
              disabled={index <= 0}
              onClick={() =>
                scroller.current?.scrollToMessage(questions[index - 1] ?? '', {
                  behavior: 'smooth',
                  highlight: true,
                })
              }
              size="sm"
              variant="ghost"
            >
              Pergunta anterior
            </Button>
            <Button
              disabled={index >= questions.length - 1}
              onClick={() =>
                scroller.current?.scrollToMessage(questions[index + 1] ?? '', {
                  behavior: 'smooth',
                  highlight: true,
                })
              }
              size="sm"
              variant="ghost"
            >
              Pergunta seguinte
            </Button>
          </>
        ) : null}
      </Controls>
    </div>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MESSAGE_SCROLLER_DOCS.messageScroller.scenes, {
    playground: Playground,
    opening: Opening,
    follow: Follow,
    anchor: Anchor,
    history: History,
    jump: Jump,
    navigator: Navigator,
    separators: Separators,
    unread: Unread,
    busy: Busy,
  });

const meta = {
  title: 'Components/MessageScroller',
  component: MessageScroller,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'MessageScroller',
        description:
          'The region a conversation scrolls in: where a saved one opens, following a reply and letting go, a sent turn lifted to the top, older rows without a jump, a jump to any row, and a control back to the latest that says how many arrived.',
        framework: 'React',
        ...REACT_MESSAGE_SCROLLER_DOCS.messageScroller,
        tokens: REACT_MESSAGE_SCROLLER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof MessageScroller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { defaultPosition: 'last-anchor', follow: true, peek: 48 },
  argTypes: {
    defaultPosition: { control: 'inline-radio', options: ['start', 'end', 'last-anchor'] },
    follow: { control: 'boolean' },
    peek: { control: { type: 'number', min: 0, max: 160, step: 8 } },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Chat
      defaultPosition={args.defaultPosition ?? 'last-anchor'}
      follow={args.follow ?? true}
      key={`${String(args.defaultPosition)}-${String(args.follow)}-${String(args.peek)}`}
      peek={args.peek ?? 48}
    />
  ),
};

export const Opening: Story = {
  parameters: scenario('opening'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="last-anchor, end and start"
        note="Three copies of one saved conversation: the first opens on the last question with its answer below, the second on the last line, the third on the first."
      >
        <Chat defaultPosition="last-anchor" />
        <Chat defaultPosition="end" />
        <Chat defaultPosition="start" />
      </Scene>
    </Grid>
  ),
};

export const Follow: Story = {
  parameters: scenario('follow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Send a question, then scroll up while it answers"
        note="The reply streams into the room under the question; scroll up and the view stays where you put it while the words keep arriving below."
      >
        <Chat />
      </Scene>
    </Grid>
  ),
};

export const Anchor: Story = {
  parameters: scenario('anchor'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The question stands at the top"
        note="Press Send question: the question rises to 8 pixels plus a 48-pixel peek of the answer before it, and the room below shrinks as the reply fills it."
      >
        <Chat peek={48} />
      </Scene>
    </Grid>
  ),
};

export const History: Story = {
  parameters: scenario('history'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Reach the top"
        note="Scroll to the top, or press Load earlier: the loader holds the head, four older rows arrive above, and the row you were reading does not move."
      >
        <Chat defaultPosition="start" history />
      </Scene>
    </Grid>
  ),
};

export const Jump: Story = {
  parameters: scenario('jump'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Two arrived while you were away"
        note="Scroll up, then press Receber resposta twice: the round control widens into 2 new; press it to go back to the end and it leaves."
      >
        <Chat follow={false} />
      </Scene>
    </Grid>
  ),
};

export const Navigator: Story = {
  parameters: scenario('navigator'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Question by question"
        note="The two buttons under the frame read the current turn from onAnchorChange and jump with highlight: the landed question glows and fades."
      >
        <Chat navigator />
      </Scene>
    </Grid>
  ),
};

export const Separators: Story = {
  parameters: scenario('separators'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Yesterday, then Today"
        note="Scroll through the conversation: Yesterday stays at the top until Today arrives and takes its place, each a pill with no rule across the words."
      >
        <Chat defaultPosition="start" separators />
      </Scene>
    </Grid>
  ),
};

export const Unread: Story = {
  parameters: scenario('unread'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="From here on, unread"
        note="The accent line stands above the first message the reader has not seen, in the flow of the rows, and scrolls with them."
      >
        <Chat defaultPosition="start" unread />
      </Scene>
    </Grid>
  ),
};

export const Busy: Story = {
  parameters: scenario('busy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A reply announced once"
        note="Send a question: while the answer streams the log is aria-busy and a screen reader hears Responding; when it ends, Response complete."
      >
        <Chat />
      </Scene>
    </Grid>
  ),
};
