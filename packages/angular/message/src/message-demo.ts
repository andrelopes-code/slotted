import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton, SlIconButton } from '@slotted/angular/button';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { splitWords } from '@slotted/core/text-stream';

import {
  SlBubble,
  SlBubbleCaret,
  SlBubbleStream,
  SlBubbleContent,
  SlBubbleReaction,
  SlBubbleReactions,
} from './bubble';
import { SlMessage, SlMessageGroup } from './message';
import {
  SlBubbleMeta,
  SlMessageActions,
  SlMessageAuthor,
  SlMessageAvatar,
  SlMessageBody,
  SlMessageFooter,
  SlMessageHeader,
  SlMessageReceipt,
  SlMessageTime,
  SlMessageVersions,
} from './message-parts';

/**
 * One product for every page: a payments support desk, where Marta Silva from
 * the operations team and the reader resolve a payout returned by the bank.
 */
export const DRAFTS = [
  'Version 4.2 moves billing to the new tax service, so EU orders carry the VAT line in the PDF, the receipt and the CSV export.',
  'The highlight of 4.2 is European VAT: calculated per order and not per account, and visible wherever an amount appears.',
  'In 4.2, EU orders start showing VAT; the portal remembers filters, and a failed payment only becomes overdue after two attempts.',
];

export const LONG_ANSWER =
  'Checkout slowed down at 21:40 because the connection pool hit its ceiling and every new request queued behind one that was already running. The payments worker had replayed a batch of 1200 webhooks after a processor timeout, and each replay opened its own connection. We raised the pool to 60 and limited the worker to 8 simultaneous deliveries; p95 dropped back below 400 ms four minutes later.';

export const MESSAGE_DEMO_PARTS = [
  SlAvatar,
  SlBubble,
  SlBubbleCaret,
  SlBubbleStream,
  SlBubbleContent,
  SlBubbleMeta,
  SlBubbleReaction,
  SlBubbleReactions,
  SlButton,
  SlGlyph,
  SlIcon,
  SlIconButton,
  SlMessage,
  SlMessageActions,
  SlMessageAuthor,
  SlMessageAvatar,
  SlMessageBody,
  SlMessageFooter,
  SlMessageGroup,
  SlMessageHeader,
  SlMessageReceipt,
  SlMessageTime,
  SlMessageVersions,
];

/** The actions an assistant's reply carries. */
export const REPLY_ACTIONS = `
  <div slMessageActions>
    <button slIconButton aria-label="Copiar" size="sm" variant="ghost">
      <span slIcon><svg slGlyph name="copy"></svg></span>
    </button>
    <button slIconButton aria-label="Gerar de novo" size="sm" variant="ghost">
      <span slIcon><svg slGlyph name="rotate-ccw"></svg></span>
    </button>
  </div>`;

/** Marta's side. */
export const theirs = (text: string, { avatar = true, time = '' } = {}) => `
  <article slMessage aria-label="Marta Silva">
    ${avatar ? '<div slMessageAvatar><span slAvatar name="Marta Silva" size="sm"></span></div>' : ''}
    <div slMessageBody>
      <div slBubble>
        <div slBubbleContent>${text}${
          time === ''
            ? ''
            : `<span slBubbleMeta><time slMessageTime datetime="2026-09-30T${time}">${time}</time></span>`
        }</div>
      </div>
    </div>
  </article>`;

/** The reader's own side, with the hour and the receipt inside. */
export const mine = (text: string, status = 'read', time = '09:41') => `
  <article slMessage align="end" aria-label="Tu" status="${status}">
    <div slMessageBody>
      <div slBubble>
        <div slBubbleContent>${text}<span slBubbleMeta>${
          status === 'sending'
            ? ''
            : `<time slMessageTime datetime="2026-09-30T${time}">${time}</time>`
        }<span slMessageReceipt></span></span></div>
      </div>
    </div>
  </article>`;

/** A reply whose versions the reader pages through. */
@Component({
  selector: 'sl-message-versions-demo',
  imports: MESSAGE_DEMO_PARTS,
  template: `
    <article
      slMessage
      actionsVisibility="always"
      aria-label="Assistente"
      [versionCount]="drafts.length"
      [(version)]="version"
    >
      <div slMessageBody>
        <div slBubble variant="plain">
          <div slBubbleContent>{{ drafts[version()] }}</div>
        </div>
        <div slMessageFooter>
          <div slMessageVersions></div>
          <div slMessageActions>
            <button slIconButton aria-label="Copiar" size="sm" variant="ghost">
              <span slIcon><svg slGlyph name="copy"></svg></span>
            </button>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class MessageVersionsDemo {
  readonly drafts = DRAFTS;
  readonly version = signal(0);
}

const STREAM =
  'The tax service started repeating every confirmation at 14:05, twice at 400 ms each, so the p95 of POST /api/checkout/confirm went from 240 ms to 3.1 s.\n\nThe database was never the bottleneck: connections stayed below 40% throughout the incident. I turned off the retries in the service client and the p95 returned to 260 ms within two minutes.';

/**
 * A transport as a model serves one: mostly a word every few tens of
 * milliseconds, now and then a pause and a burst of several words at once.
 * The pattern is fixed, so every replay arrives the same way.
 */
const BURSTS = [1, 1, 2, 1, 1, 3, 1, 7, 1, 2, 1, 1, 1, 12, 2, 1, 1, 4, 1, 1, 2, 9];
const PAUSES = [45, 30, 60, 35, 40, 50, 30, 240, 40, 35, 55, 30, 45, 380, 40, 30, 50, 120];
const WORDS = splitWords(STREAM);

/** A reply that streams in bursts, with its caret, and can be replayed. */
@Component({
  selector: 'sl-message-stream-demo',
  imports: MESSAGE_DEMO_PARTS,
  template: `
    <article slMessage aria-label="Assistente" [status]="done() ? undefined : 'streaming'">
      <div slMessageBody>
        <div slBubble variant="plain">
          <div slBubbleContent>
            <span slBubbleStream [text]="text()"></span>
            @if (!done()) {
              <span slBubbleCaret></span>
            }
          </div>
        </div>
        <div slMessageFooter>
          <button slButton size="sm" variant="ghost" (click)="replay()">Repetir</button>
        </div>
      </div>
    </article>
  `,
})
export class MessageStreamDemo {
  private readonly received = signal(0);
  readonly text = computed(() => WORDS.slice(0, this.received()).join(''));
  readonly done = computed(() => this.received() >= WORDS.length);
  private timer = 0;
  private tick = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => window.clearTimeout(this.timer));
    this.replay();
  }

  replay() {
    window.clearTimeout(this.timer);
    this.received.set(0);
    this.tick = 0;
    this.timer = window.setTimeout(() => this.next(), 400);
  }

  private next() {
    const burst = BURSTS[this.tick % BURSTS.length] ?? 1;
    this.received.update((value) => Math.min(WORDS.length, value + burst));
    if (this.done()) return;
    this.timer = window.setTimeout(() => this.next(), PAUSES[this.tick % PAUSES.length] ?? 40);
    this.tick += 1;
  }
}

/** A row of a comment thread. */
@Component({
  selector: 'sl-message-thread-row',
  imports: MESSAGE_DEMO_PARTS,
  template: `
    <article slMessage layout="thread">
      <div slMessageAvatar><span slAvatar decorative [name]="author()"></span></div>
      <div slMessageBody>
        <div slMessageHeader>
          <span slMessageAuthor>{{ author() }}</span>
          <time slMessageTime datetime="2026-09-30T09:12">{{ when() }}</time>
        </div>
        <div slBubble>
          <div slBubbleContent><ng-content></ng-content></div>
          @if (reactions(); as count) {
            <div slBubbleReactions>
              <button slBubbleReaction aria-label="Gosto" [count]="count" [pressed]="true">
                👍
              </button>
            </div>
          }
        </div>
      </div>
      <div slMessageActions>
        <button slIconButton aria-label="Responder" size="sm" variant="ghost">
          <span slIcon><svg slGlyph name="arrow-left"></svg></span>
        </button>
      </div>
    </article>
  `,
})
export class MessageThreadRow {
  readonly author = input.required<string>();
  readonly when = input.required<string>();
  readonly reactions = input<number | undefined>(undefined);
}
