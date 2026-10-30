import { scenario } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import {
  Attachment,
  AttachmentBody,
  AttachmentDetail,
  AttachmentGroup,
  AttachmentLink,
  AttachmentPreview,
} from '../attachment';
import { Grid, Scene } from '../field/field-demo';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerJump,
  MessageScrollerSeparator,
  MessageScrollerViewport,
} from '../message-scroller';
import {
  Bubble,
  BubbleContent,
  BubbleMeta,
  BubbleQuote,
  BubbleReaction,
  BubbleReactions,
  BubbleRetry,
  BubbleTyping,
  Message,
  MessageActivity,
  MessageActivityStep,
  MessageAuthor,
  MessageAvatar,
  MessageBody,
  MessageFooter,
  MessageGroup,
  MessageHeader,
  MessageReceipt,
  MessageTime,
  MessageVersions,
} from './index';
import { MARTA, Mine, ReplyActions, Stack, Theirs } from './message-demo';

const meta = {
  title: 'Components/Message/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A row and a surface"
        note='Two members under data-ui="message": the article with its avatar, header, footer, receipt, actions and versions, and the bubble with its meta, quote, reactions and retry control.'
      >
        <MessageGroup>
          <Message status="read" versionCount={2}>
            <MessageAvatar>
              <Avatar name={MARTA} size="sm" />
            </MessageAvatar>
            <MessageBody>
              <MessageHeader>
                <MessageAuthor>{MARTA}</MessageAuthor>
                <MessageTime dateTime="2026-09-30T09:38">09:38</MessageTime>
              </MessageHeader>
              <Bubble>
                <BubbleContent>
                  <BubbleQuote author="You">Do you have the new IBAN yet?</BubbleQuote>
                  It arrives this afternoon.
                  <BubbleMeta>
                    <MessageTime dateTime="2026-09-30T09:39">09:39</MessageTime>
                  </BubbleMeta>
                </BubbleContent>
                <BubbleReactions>
                  <BubbleReaction aria-label="Gosto, 1" count={1}>
                    👍
                  </BubbleReaction>
                </BubbleReactions>
              </Bubble>
              <MessageFooter>
                <MessageVersions />
                <ReplyActions />
              </MessageFooter>
            </MessageBody>
          </Message>
        </MessageGroup>
      </Scene>
    </Grid>
  ),
};

export const Conversation: Story = {
  parameters: scenario('conversation'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A payout returned by the bank"
        note="Marta’s run with one avatar, the reader’s messages with the hour and two ticks inside, a failed one with its retry control, and Marta writing."
      >
        <Stack>
          <MessageGroup>
            <Theirs avatar={false}>Tuesday's payout came back with error R03.</Theirs>
            <Theirs avatar={false}>
              The destination account does not exist at the bank. I already asked the vendor for the
              new IBAN.
            </Theirs>
            <Theirs time="09:38">It arrives this afternoon.</Theirs>
          </MessageGroup>
          <MessageGroup>
            <Mine status="read" time="09:41">
              Great. I will resend as soon as it arrives.
            </Mine>
            <Message align="end" aria-label="You" status="failed">
              <MessageBody>
                <Bubble>
                  <BubbleContent>And invoice 4417 too.</BubbleContent>
                  <BubbleRetry />
                </Bubble>
                <MessageFooter>
                  <MessageReceipt />
                </MessageFooter>
              </MessageBody>
            </Message>
          </MessageGroup>
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
            </MessageBody>
          </Message>
        </Stack>
      </Scene>
    </Grid>
  ),
};

export const Thread: Story = {
  parameters: scenario('thread'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The same family as a comment thread"
        note='layout="thread" on a group: avatars at the top, names inline, words unframed, reactions as a row under them and a band under the pointer.'
      >
        <MessageGroup layout="thread">
          <Message>
            <MessageAvatar>
              <Avatar decorative name="Emily Parker" />
            </MessageAvatar>
            <MessageBody>
              <MessageHeader>
                <MessageAuthor>Emily Parker</MessageAuthor>
                <MessageTime dateTime="2026-09-30T09:12">4 minutes ago</MessageTime>
              </MessageHeader>
              <Bubble>
                <BubbleContent>
                  Can we name the SSO owner before the review with the customer?
                </BubbleContent>
                <BubbleReactions>
                  <BubbleReaction aria-label="Gosto, 2" count={2} defaultPressed>
                    👍
                  </BubbleReaction>
                </BubbleReactions>
              </Bubble>
            </MessageBody>
          </Message>
          <Message>
            <MessageAvatar>
              <Avatar decorative name="Tiago Moreira" />
            </MessageAvatar>
            <MessageBody>
              <MessageHeader>
                <MessageAuthor>Tyler Morgan</MessageAuthor>
                <MessageTime dateTime="2026-09-30T09:08">8 minutes ago</MessageTime>
              </MessageHeader>
              <Bubble>
                <BubbleContent>
                  I moved the procurement note above the renewal risk summary.
                </BubbleContent>
              </Bubble>
            </MessageBody>
          </Message>
        </MessageGroup>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In a scroller, with a file"
        note="Rows in a MessageScroller with a sticky day, an attachment in the reader’s message beside its bubble, and an assistant reply working before it has words."
      >
        <div className="slotted-demo-viewport" data-size="tall">
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent>
                <MessageScrollerItem>
                  <MessageScrollerSeparator sticky>Today</MessageScrollerSeparator>
                </MessageScrollerItem>
                <MessageScrollerItem anchor messageId="c1">
                  <Message align="end" aria-label="Tu" status="delivered">
                    <MessageBody>
                      <AttachmentGroup aria-label="Anexos" layout="list">
                        <Attachment file={{ name: 'extrato-setembro.pdf', size: 412_000 }}>
                          <AttachmentPreview />
                          <AttachmentBody>
                            <AttachmentLink href="#extrato" />
                            <AttachmentDetail />
                          </AttachmentBody>
                        </Attachment>
                      </AttachmentGroup>
                      <Bubble>
                        <BubbleContent>
                          The statement shows the debit twice. Can you check?
                          <BubbleMeta>
                            <MessageTime dateTime="2026-09-30T14:02">14:02</MessageTime>
                            <MessageReceipt />
                          </BubbleMeta>
                        </BubbleContent>
                      </Bubble>
                    </MessageBody>
                  </Message>
                </MessageScrollerItem>
                <MessageScrollerItem messageId="c2">
                  <Message aria-label="Assistente" status="streaming">
                    <MessageBody>
                      <MessageActivity>
                        <MessageActivityStep status="complete">
                          Li o extrato de setembro
                        </MessageActivityStep>
                        <MessageActivityStep>A comparar com os movimentos…</MessageActivityStep>
                      </MessageActivity>
                    </MessageBody>
                  </Message>
                </MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerJump />
          </MessageScroller>
        </div>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="What a screen reader hears"
        note="Each article is named by its author; inside a bubble the ticks carry the word Read for assistive technology; the typing dots are one image with a name, never three characters."
      >
        <Stack>
          <Theirs time="09:38">It arrives this afternoon.</Theirs>
          <Mine status="read" time="09:41">
            I will resend as soon as it arrives.
          </Mine>
        </Stack>
      </Scene>
    </Grid>
  ),
};
