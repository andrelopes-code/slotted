import {
  SlAttachment,
  SlAttachmentBody,
  SlAttachmentDetail,
  SlAttachmentGroup,
  SlAttachmentPreview,
  SlAttachmentTrigger,
} from '@slotted/angular/attachment';
import {
  SlMessageScroller,
  SlMessageScrollerContent,
  SlMessageScrollerItem,
  SlMessageScrollerJump,
  SlMessageScrollerSeparator,
  SlMessageScrollerViewport,
} from '@slotted/angular/message-scroller';
import { scenario } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBubbleQuote, SlBubbleRetry, SlBubbleTyping } from './bubble';
import { MESSAGE_DEMO_PARTS, mine, REPLY_ACTIONS, theirs } from './message-demo';
import { SlMessageActivity, SlMessageActivityStep } from './message-parts';

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const page = (body: string) => `<div class="slotted-demo-grid" data-columns="1">${body}</div>`;
const stack = (body: string) => `<div class="slotted-demo-stack" data-stretch>${body}</div>`;

const meta: Meta = {
  title: 'Components/Message/Overview',
  decorators: [
    moduleMetadata({
      imports: [
        ...MESSAGE_DEMO_PARTS,
        SlAttachment,
        SlAttachmentBody,
        SlAttachmentDetail,
        SlAttachmentGroup,
        SlAttachmentPreview,
        SlAttachmentTrigger,
        SlBubbleQuote,
        SlBubbleRetry,
        SlBubbleTyping,
        SlMessageActivity,
        SlMessageActivityStep,
        SlMessageScroller,
        SlMessageScrollerContent,
        SlMessageScrollerItem,
        SlMessageScrollerJump,
        SlMessageScrollerSeparator,
        SlMessageScrollerViewport,
      ],
    }),
  ],
  parameters: { controls: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: page(
      scene(
        'A row and a surface',
        'Two members under data-ui="message": the article with its avatar, header, footer, actions and versions, and the bubble with its meta, quote and reactions.',
        `<div slMessageGroup>
          <article slMessage status="read" [versionCount]="2">
            <div slMessageAvatar><span slAvatar name="Marta Silva" size="sm"></span></div>
            <div slMessageBody>
              <div slMessageHeader>
                <span slMessageAuthor>Marta Silva</span>
                <time slMessageTime datetime="2026-09-30T09:38">09:38</time>
              </div>
              <div slBubble>
                <div slBubbleContent>
                  <div slBubbleQuote author="You">Do you have the new account number yet?</div>
                  It arrives this afternoon.
                  <span slBubbleMeta><time slMessageTime datetime="2026-09-30T09:39">09:39</time></span>
                </div>
                <div slBubbleReactions>
                  <button slBubbleReaction aria-label="Gosto, 1" [count]="1">👍</button>
                </div>
              </div>
              <div slMessageFooter>
                <div slMessageVersions></div>
                ${REPLY_ACTIONS}
              </div>
            </div>
          </article>
        </div>`,
      ),
    ),
  }),
};

export const Conversation: Story = {
  parameters: scenario('conversation'),
  render: () => ({
    template: page(
      scene(
        'A payout returned by the bank',
        'Marta’s run with one avatar, the reader’s messages with the hour and two ticks inside, a failed one with its retry control, and Marta writing.',
        stack(`
          <div slMessageGroup>
            ${theirs('The payout from Tuesday came back with error R03.', { avatar: false })}
            ${theirs('The destination account does not exist at the bank. I already asked the supplier for the new account number.', { avatar: false })}
            ${theirs('It arrives this afternoon.', { time: '09:38' })}
          </div>
          <div slMessageGroup>
            ${mine('Great. I will resend as soon as it arrives.')}
            <article slMessage align="end" aria-label="You" status="failed">
              <div slMessageBody>
                <div slBubble>
                  <div slBubbleContent>And invoice 4417 too.</div>
                  <button slBubbleRetry></button>
                </div>
                <div slMessageFooter><span slMessageReceipt></span></div>
              </div>
            </article>
          </div>
          <article slMessage aria-label="Marta Silva">
            <div slMessageAvatar><span slAvatar name="Marta Silva" size="sm"></span></div>
            <div slMessageBody>
              <div slBubble>
                <div slBubbleContent><span slBubbleTyping aria-label="Mary Stone is typing"></span></div>
              </div>
            </div>
          </article>`),
      ),
    ),
  }),
};

export const Thread: Story = {
  parameters: scenario('thread'),
  render: () => ({
    template: page(
      scene(
        'The same family as a comment thread',
        'layout="thread" on a group: avatars at the top, names inline, words unframed, reactions as a row under them and a band under the pointer.',
        `<div slMessageGroup layout="thread">
          <article slMessage>
            <div slMessageAvatar><span slAvatar decorative name="Emily Parker"></span></div>
            <div slMessageBody>
              <div slMessageHeader>
                <span slMessageAuthor>Emily Parker</span>
                <time slMessageTime datetime="2026-09-30T09:12">4 minutes ago</time>
              </div>
              <div slBubble>
                <div slBubbleContent>Can we name the SSO owner before the review with the customer?</div>
                <div slBubbleReactions>
                  <button slBubbleReaction aria-label="Like, 2" [count]="2" [pressed]="true">👍</button>
                </div>
              </div>
            </div>
          </article>
          <article slMessage>
            <div slMessageAvatar><span slAvatar decorative name="Tiago Moreira"></span></div>
            <div slMessageBody>
              <div slMessageHeader>
                <span slMessageAuthor>Tim Morgan</span>
                <time slMessageTime datetime="2026-09-30T09:08">8 minutes ago</time>
              </div>
              <div slBubble>
                <div slBubbleContent>I moved the purchasing note above the renewal risk summary.</div>
              </div>
            </div>
          </article>
        </div>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    props: { statement: { name: 'extrato-setembro.pdf', size: 412_000 } },
    template: page(
      scene(
        'In a scroller, with a file',
        'Rows in a message scroller with a sticky day, an attachment in the reader’s message beside its bubble, and an assistant reply working before it has words.',
        `<div class="slotted-demo-viewport" data-size="tall">
          <div slMessageScroller>
            <div slMessageScrollerViewport>
              <div slMessageScrollerContent>
                <div slMessageScrollerItem><div slMessageScrollerSeparator sticky>Today</div></div>
                <div slMessageScrollerItem anchor messageId="c1">
                  <article slMessage align="end" aria-label="You" status="delivered">
                    <div slMessageBody>
                      <ul slAttachmentGroup aria-label="Anexos">
                        <li slAttachment [file]="statement">
                          <span slAttachmentPreview></span>
                          <div slAttachmentBody>
                            <a slAttachmentTrigger href="#extrato"></a>
                            <p slAttachmentDetail></p>
                          </div>
                        </li>
                      </ul>
                      <div slBubble>
                        <div slBubbleContent>
                          The statement shows the debit twice. Can you check?
                          <span slBubbleMeta>
                            <time slMessageTime datetime="2026-09-30T14:02">14:02</time>
                            <span slMessageReceipt></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
                <div slMessageScrollerItem messageId="c2">
                  <article slMessage aria-label="Assistente" status="streaming">
                    <div slMessageBody>
                      <div slMessageActivity>
                        <div slMessageActivityStep status="complete">Li o extrato de setembro</div>
                        <div slMessageActivityStep>A comparar com os movimentos…</div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
            <button slMessageScrollerJump></button>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: page(
      scene(
        'What a screen reader hears',
        'Each article is named by its author; inside a bubble the ticks carry the word Read for assistive technology; the typing dots are one image with a name, never three characters.',
        stack(
          theirs('It arrives this afternoon.', { time: '09:38' }) +
            mine('I will resend as soon as it arrives.'),
        ),
      ),
    ),
  }),
};
