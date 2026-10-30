import { Component, signal } from '@angular/core';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlBubble, SlBubbleQuote, SlBubbleTyping } from './bubble';
import { LONG_ANSWER, MESSAGE_DEMO_PARTS, MessageStreamDemo } from './message-demo';
import { ANGULAR_MESSAGE_DOCS, ANGULAR_MESSAGE_TOKENS } from './message.docs';

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
const bubble = (attributes: string, text: string) =>
  `<div slBubble ${attributes}><div slBubbleContent>${text}</div></div>`;

/** Two quick replies and a link; picking one sends it as the reader's own message. */
@Component({
  selector: 'sl-bubble-quick-replies-demo',
  imports: MESSAGE_DEMO_PARTS,
  template: `
    <div class="slotted-demo-stack" data-stretch>
      <article slMessage aria-label="Assistente">
        <div slMessageBody>
          <div slBubble>
            <div slBubbleContent>Two invoices failed last night. What do you want to do?</div>
          </div>
        </div>
      </article>
      <article slMessage align="end" aria-label="Respostas sugeridas">
        <div slMessageBody>
          @if (picked(); as answer) {
            <div slBubble>
              <div slBubbleContent>{{ answer }}</div>
            </div>
          } @else {
            @for (option of options; track option) {
              <div slBubble tone="accent" variant="soft">
                <button slBubbleContent type="button" (click)="picked.set(option)">
                  {{ option }}
                </button>
              </div>
            }
            <div slBubble variant="outline">
              <a slBubbleContent href="#record">
                Open the invoice record
                <span slIcon><svg slGlyph name="external"></svg></span>
              </a>
            </div>
          }
        </div>
      </article>
    </div>
  `,
})
class QuickRepliesDemo {
  readonly options = ['Resend both now', 'Wait until the addresses are confirmed'];
  readonly picked = signal<string | null>(null);
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_MESSAGE_DOCS.bubble.scenes, {
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

interface BubbleStoryArgs {
  variant: 'solid' | 'soft' | 'outline' | 'plain';
  tone: 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
}

const meta: Meta<BubbleStoryArgs> = {
  title: 'Components/Message/Bubble',
  component: SlBubble,
  decorators: [
    moduleMetadata({
      imports: [
        ...MESSAGE_DEMO_PARTS,
        MessageStreamDemo,
        QuickRepliesDemo,
        SlBubbleQuote,
        SlBubbleTyping,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Bubble',
        description:
          'The surface a message’s words are painted on: four paintings in five tones, a quote, a clamp for long replies, a caret while it streams, the dots of someone writing, reactions and the retry control of a message that did not go.',
        framework: 'Angular',
        ...ANGULAR_MESSAGE_DOCS.bubble,
        tokens: ANGULAR_MESSAGE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<BubbleStoryArgs>;

export const Playground: Story = {
  args: { tone: 'secondary', variant: 'soft' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'plain'] },
    tone: {
      control: 'inline-radio',
      options: ['accent', 'secondary', 'info', 'success', 'warning', 'danger'],
    },
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div slBubble [variant]="variant" [tone]="tone">
        <div slBubbleContent>
          The destination account does not exist at the bank. I already asked the supplier for the new account number and it should arrive this afternoon.
        </div>
      </div>`,
  }),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => ({
    template: page(
      scene(
        'Filled, tinted, outlined, unframed',
        'The four paintings in the tone each is usually worn in; switch the scheme to high contrast and the tinted bubble keeps an edge.',
        stack(
          bubble('variant="solid" tone="accent"', 'solid — a tua mensagem') +
            bubble('variant="soft"', 'soft — a mensagem de outra pessoa') +
            bubble('variant="outline"', 'outline — webhook.ts devolveu 500 em 41 eventos') +
            bubble(
              'variant="plain"',
              'plain — an assistant’s reply with no frame, which takes the whole line and reads as running text.',
            ),
        ),
      ),
    ),
  }),
};

export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => ({
    template: page(
      scene(
        'What each tone is for',
        'A suggestion in the accent’s tint, a credit in success, a limit in warning, a failure in danger — each saying its news in words as well.',
        stack(
          bubble('tone="accent"', 'Suggestion: resend invoices 4417 and 4419 in the next batch.') +
            bubble('tone="success"', 'The $248.00 refund was credited.') +
            bubble('tone="warning"', 'The daily transfer limit is at 90%.') +
            bubble(
              'tone="danger"',
              'Step 5 failed and the worker did not come back after the restart.',
            ),
        ),
      ),
    ),
  }),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => ({
    template: page(
      scene(
        'Answers the reader can press',
        'Point at each surface, press it, tab to it: the hover, a darker press and the ring all belong to the bubble. Picking one sends it as the reader’s own message.',
        '<sl-bubble-quick-replies-demo></sl-bubble-quick-replies-demo>',
      ),
    ),
  }),
};

export const Quote: Story = {
  parameters: scenario('quote'),
  render: () => ({
    template: page(
      scene(
        'A reply that points back',
        'The quote is tinted with the surface’s own ink, so it reads on the accent fill and on the grey tint alike; on a button it has a hover and a ring.',
        stack(`
          <article slMessage align="end" aria-label="Tu">
            <div slMessageBody>
              <div slBubble>
                <div slBubbleContent>
                  <button slBubbleQuote type="button" author="Mary Stone">
                    The destination account does not exist at the bank. I already asked the supplier for the new account number.
                  </button>
                  Send me the account number when it arrives, and I will resend it myself.
                </div>
              </div>
            </div>
          </article>
          <article slMessage aria-label="Marta Silva">
            <div slMessageBody>
              <div slBubble>
                <div slBubbleContent>
                  <div slBubbleQuote author="You">Send me the account number when it arrives.</div>
                  Done: 021000021 / 000123456789.
                </div>
              </div>
            </div>
          </article>`),
      ),
    ),
  }),
};

export const Clamp: Story = {
  parameters: scenario('clamp'),
  render: () => ({
    template: page(
      scene(
        'Three lines, then the rest',
        'The clamp ends in an ellipsis and the inset under it stays clean; press Show more and the chevron turns. A short text under the same clamp draws no control.',
        stack(
          `<article slMessage aria-label="Assistente"><div slMessageBody>${bubble('[maxLines]="3"', LONG_ANSWER)}</div></article>` +
            `<article slMessage aria-label="Assistente"><div slMessageBody>${bubble('[maxLines]="3"', 'O p95 voltou a menos de 400 ms.')}</div></article>`,
        ),
      ),
    ),
  }),
};

export const Streaming: Story = {
  parameters: scenario('streaming'),
  render: () => ({
    template: page(
      scene(
        'Words arriving',
        'Words arrive in bursts, as a model serves them; each burst enters as a wave of at most 320 ms, every word out of a blur. The dot breathes after the last word while the row is aria-busy, and leaves with the last word.',
        '<sl-message-stream-demo></sl-message-stream-demo>',
      ),
    ),
  }),
};

export const Typing: Story = {
  parameters: scenario('typing'),
  render: () => ({
    template: page(
      scene(
        'Marta is writing',
        'The dots rise in a wave inside her bubble, which trails two circles of its own fill; the line under it is for the eye, the dots carry the name.',
        `<article slMessage aria-label="Marta Silva">
          <div slMessageAvatar><span slAvatar name="Marta Silva" size="sm"></span></div>
          <div slMessageBody>
            <div slBubble>
              <div slBubbleContent><span slBubbleTyping aria-label="Mary Stone is typing"></span></div>
            </div>
            <div slMessageFooter aria-hidden="true">Mary is typing</div>
          </div>
        </article>`,
      ),
    ),
  }),
};

export const Reactions: Story = {
  parameters: scenario('reactions'),
  render: () => ({
    template: page(
      scene(
        'On a bubble, and on the reader’s own',
        'Press a reaction to give or take it back; the one already given wears the accent. The disabled one keeps its figure legible.',
        stack(`
          <article slMessage aria-label="Marta Silva">
            <div slMessageBody>
              <div slBubble>
                <div slBubbleContent>The new empty state is already behind the flag.</div>
                <div slBubbleReactions>
                  <button slBubbleReaction aria-label="Like, 4" [count]="4" [pressed]="true">👍</button>
                  <button slBubbleReaction aria-label="Festa, 2" [count]="2">🎉</button>
                  <button slBubbleReaction aria-label="A ver, 1" [count]="1" [disabled]="true">👀</button>
                </div>
              </div>
            </div>
          </article>
          <article slMessage align="end" aria-label="Tu">
            <div slMessageBody>
              <div slBubble>
                <div slBubbleContent>Rolling out to the beta workspaces now.</div>
                <div slBubbleReactions>
                  <button slBubbleReaction aria-label="Rocket, 3" [count]="3">🚀</button>
                </div>
              </div>
            </div>
          </article>`),
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: page(
      scene(
        'Unbroken, right-to-left, two letters',
        'At 360 pixels: the URL breaks inside the bubble’s share, the Arabic sentence reads from the right inside a left-hand bubble, and Ok stays a rounded bubble.',
        `<div class="slotted-demo-measure">${stack(
          bubble(
            '',
            'https://payments.example.com/payouts/po_9f2k4m8n1q7r3s5t6u8v0w2x4y6z8a0b2c4d6e8f0g2h4j6k8/resend',
          ) +
            bubble('', 'تم تحويل المبلغ إلى الحساب الجديد صباح اليوم.') +
            `<article slMessage align="end" aria-label="Tu"><div slMessageBody>${bubble('', 'Ok')}</div></article>`,
        )}</div>`,
      ),
    ),
  }),
};
