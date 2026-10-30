import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Glyph, Icon } from '../icon';
import {
  Bubble,
  BubbleCaret,
  BubbleStream,
  BubbleContent,
  BubbleQuote,
  BubbleReaction,
  BubbleReactions,
  BubbleTyping,
  Message,
  MessageAvatar,
  MessageBody,
  MessageFooter,
} from './index';
import { LONG_ANSWER, MARTA, Stack, useSimulatedStream } from './message-demo';
import { REACT_MESSAGE_DOCS, REACT_MESSAGE_TOKENS } from './message.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MESSAGE_DOCS.bubble.scenes, {
    playground: Playground,
    variants: Variants,
    tones: Tones,
    interactive: Interactive,
    quote: Quote,
    clamp: Clamp,
    streaming: Streaming,
    typing: Typing,
    reactions: Reactions,
    content: Content,
  });

const meta = {
  title: 'Components/Message/Bubble',
  component: Bubble,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Bubble',
        description:
          'The surface a message’s words are painted on: four paintings in five tones, a quote, a clamp for long replies, a caret while it streams, the dots of someone writing, reactions and the retry control of a message that did not go.',
        framework: 'React',
        ...REACT_MESSAGE_DOCS.bubble,
        tokens: REACT_MESSAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Bubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { tone: 'secondary', variant: 'soft' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'plain'] },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'secondary', 'info', 'success', 'warning', 'danger'],
    },
    maxLines: { control: { type: 'number', min: 1, max: 12 } },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Bubble {...args}>
      <BubbleContent>
        The destination account does not exist at the bank. I already asked the vendor for the new
        IBAN and it should arrive this afternoon.
      </BubbleContent>
    </Bubble>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Filled, tinted, outlined, unframed"
        note="The four paintings in the tone each is usually worn in; switch the scheme to high contrast and the tinted bubble keeps an edge."
      >
        <Stack>
          <Bubble tone="accent" variant="solid">
            <BubbleContent>solid — a tua mensagem</BubbleContent>
          </Bubble>
          <Bubble variant="soft">
            <BubbleContent>soft — a mensagem de outra pessoa</BubbleContent>
          </Bubble>
          <Bubble variant="outline">
            <BubbleContent>outline — webhook.ts devolveu 500 em 41 eventos</BubbleContent>
          </Bubble>
          <Bubble variant="plain">
            <BubbleContent>
              plain — an assistant reply with no frame, which takes the whole line and reads as
              running text.
            </BubbleContent>
          </Bubble>
        </Stack>
      </Scene>
    </Grid>
  ),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What each tone is for"
        note="A suggestion in the accent’s tint, a credit in success, a limit in warning, a failure in danger — each saying its news in words as well."
      >
        <Stack>
          <Bubble tone="accent">
            <BubbleContent>
              Suggestion: resend invoices 4417 and 4419 in the next batch.
            </BubbleContent>
          </Bubble>
          <Bubble tone="success">
            <BubbleContent>O reembolso de 248,00 € foi creditado.</BubbleContent>
          </Bubble>
          <Bubble tone="warning">
            <BubbleContent>The daily transfer limit is at 90%.</BubbleContent>
          </Bubble>
          <Bubble tone="danger">
            <BubbleContent>
              Step 5 failed and the worker did not come back after the restart.
            </BubbleContent>
          </Bubble>
        </Stack>
      </Scene>
    </Grid>
  ),
};

function QuickReplies() {
  const [picked, setPicked] = useState<string | null>(null);
  const options = ['Resend both now', 'Wait until the addresses are confirmed'];
  return (
    <Stack>
      <Message aria-label="Assistente">
        <MessageBody>
          <Bubble>
            <BubbleContent>Two invoices failed last night. What do you want to do?</BubbleContent>
          </Bubble>
        </MessageBody>
      </Message>
      <Message align="end" aria-label="Respostas sugeridas">
        <MessageBody>
          {picked === null ? (
            <>
              {options.map((option) => (
                <Bubble key={option} tone="accent" variant="soft">
                  <BubbleContent
                    render={(props) => (
                      <button type="button" {...props} onClick={() => setPicked(option)} />
                    )}
                  >
                    {option}
                  </BubbleContent>
                </Bubble>
              ))}
              <Bubble variant="outline">
                <BubbleContent render={(props) => <a href="#record" {...props} />}>
                  Open the invoice record{' '}
                  <Icon>
                    <Glyph name="external" />
                  </Icon>
                </BubbleContent>
              </Bubble>
            </>
          ) : (
            <Bubble>
              <BubbleContent>{picked}</BubbleContent>
            </Bubble>
          )}
        </MessageBody>
      </Message>
    </Stack>
  );
}

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Answers the reader can press"
        note="Point at each surface, press it, tab to it: the hover, a darker press and the ring all belong to the bubble. Picking one sends it as the reader’s own message."
      >
        <QuickReplies />
      </Scene>
    </Grid>
  ),
};

export const Quote: Story = {
  parameters: scenario('quote'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A reply that points back"
        note="The quote is tinted with the surface’s own ink, so it reads on the accent fill and on the grey tint alike; with onJump it is a button with a hover and a ring."
      >
        <Stack>
          <Message align="end" aria-label="Tu">
            <MessageBody>
              <Bubble>
                <BubbleContent>
                  <BubbleQuote author={MARTA} onJump={() => undefined}>
                    The destination account does not exist at the bank. I already asked the vendor
                    for the new IBAN.
                  </BubbleQuote>
                  Send me the IBAN when it arrives, and I will do the resend myself.
                </BubbleContent>
              </Bubble>
            </MessageBody>
          </Message>
          <Message aria-label={MARTA}>
            <MessageBody>
              <Bubble>
                <BubbleContent>
                  <BubbleQuote author="You">Send me the IBAN when it arrives.</BubbleQuote>
                  Done: PT50 0035 0651 0000 1234 5678 9.
                </BubbleContent>
              </Bubble>
            </MessageBody>
          </Message>
        </Stack>
      </Scene>
    </Grid>
  ),
};

export const Clamp: Story = {
  parameters: scenario('clamp'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three lines, then the rest"
        note="The clamp ends in an ellipsis and the inset under it stays clean; press Show more and the chevron turns. A short text under the same clamp draws no control."
      >
        <Stack>
          <Message aria-label="Assistente">
            <MessageBody>
              <Bubble maxLines={3}>
                <BubbleContent>{LONG_ANSWER}</BubbleContent>
              </Bubble>
            </MessageBody>
          </Message>
          <Message aria-label="Assistente">
            <MessageBody>
              <Bubble maxLines={3}>
                <BubbleContent>O p95 voltou a menos de 400 ms.</BubbleContent>
              </Bubble>
            </MessageBody>
          </Message>
        </Stack>
      </Scene>
    </Grid>
  ),
};

function StreamingReply() {
  const { done, replay, text } = useSimulatedStream();
  return (
    <Message aria-label="Assistente" {...(done ? {} : { status: 'streaming' as const })}>
      <MessageBody>
        <Bubble variant="plain">
          <BubbleContent>
            <BubbleStream text={text} />
            {done ? null : <BubbleCaret />}
          </BubbleContent>
        </Bubble>
        <MessageFooter>
          <Button onClick={replay} size="sm" variant="ghost">
            Repetir
          </Button>
        </MessageFooter>
      </MessageBody>
    </Message>
  );
}

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Words arriving"
        note="Words arrive in bursts, as a model serves them; each burst enters as a wave of at most 320 ms, every word out of a blur. The dot breathes after the last word while the row is aria-busy, and leaves with the last word."
      >
        <StreamingReply />
      </Scene>
    </Grid>
  ),
};

export const Typing: Story = {
  parameters: scenario('typing'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Marta is writing"
        note="The dots rise in a wave inside her bubble, which trails two circles of its own fill; the line under it is for the eye, the dots carry the name."
      >
        <Message aria-label={MARTA}>
          <MessageAvatar>
            <Avatar name={MARTA} size="sm" />
          </MessageAvatar>
          <MessageBody>
            <Bubble>
              <BubbleContent>
                <BubbleTyping aria-label="Martha Wells is typing" />
              </BubbleContent>
            </Bubble>
            <MessageFooter aria-hidden="true">Martha is typing</MessageFooter>
          </MessageBody>
        </Message>
      </Scene>
    </Grid>
  ),
};

export const Reactions: Story = {
  parameters: scenario('reactions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="On a bubble, and on the reader’s own"
        note="Press a reaction to give or take it back; the one already given wears the accent. The disabled one keeps its figure legible."
      >
        <Stack>
          <Message aria-label={MARTA}>
            <MessageBody>
              <Bubble>
                <BubbleContent>The new empty state is already behind the flag.</BubbleContent>
                <BubbleReactions>
                  <BubbleReaction aria-label="Like, 4" count={4} defaultPressed>
                    👍
                  </BubbleReaction>
                  <BubbleReaction aria-label="Festa, 2" count={2}>
                    🎉
                  </BubbleReaction>
                  <BubbleReaction aria-label="A ver, 1" count={1} disabled>
                    👀
                  </BubbleReaction>
                </BubbleReactions>
              </Bubble>
            </MessageBody>
          </Message>
          <Message align="end" aria-label="Tu">
            <MessageBody>
              <Bubble>
                <BubbleContent>Rolling out to the beta workspaces now.</BubbleContent>
                <BubbleReactions>
                  <BubbleReaction aria-label="Rocket, 3" count={3}>
                    🚀
                  </BubbleReaction>
                </BubbleReactions>
              </Bubble>
            </MessageBody>
          </Message>
        </Stack>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Unbroken, right-to-left, two letters"
        note="At 360 pixels: the URL breaks inside the bubble’s share, the Arabic sentence reads from the right inside a left-hand bubble, and Ok stays a rounded bubble."
      >
        <Measure>
          <Stack>
            <Bubble>
              <BubbleContent>
                https://payments.example.com/payouts/po_9f2k4m8n1q7r3s5t6u8v0w2x4y6z8a0b2c4d6e8f0g2h4j6k8/resend
              </BubbleContent>
            </Bubble>
            <Bubble>
              <BubbleContent>تم تحويل المبلغ إلى الحساب الجديد صباح اليوم.</BubbleContent>
            </Bubble>
            <Message align="end" aria-label="Tu">
              <MessageBody>
                <Bubble>
                  <BubbleContent>Ok</BubbleContent>
                </Bubble>
              </MessageBody>
            </Message>
          </Stack>
        </Measure>
      </Scene>
    </Grid>
  ),
};
