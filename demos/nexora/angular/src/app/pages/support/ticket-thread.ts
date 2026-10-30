import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import {
  SlBubble,
  SlBubbleContent,
  SlMessage,
  SlMessageAvatar,
  SlMessageAuthor,
  SlMessageBody,
  SlMessageFooter,
  SlMessageHeader,
  SlMessageTime,
} from '@slotted/angular/message';
import {
  SlMessageScroller,
  SlMessageScrollerContent,
  SlMessageScrollerItem,
  SlMessageScrollerJump,
  SlMessageScrollerSeparator,
  SlMessageScrollerViewport,
} from '@slotted/angular/message-scroller';
import { SlTag, SlTagBody } from '@slotted/angular/tag';

import { ClockService } from '../../core/session/clock.service';
import type { TicketDetail, TicketMessage } from '../../core/support/support.model';

type Entry =
  | { readonly kind: 'day'; readonly key: string; readonly label: string }
  | { readonly kind: 'system'; readonly key: string; readonly text: string; readonly at: string }
  | { readonly kind: 'message'; readonly key: string; readonly message: TicketMessage; readonly author: string };

/**
 * A ticket's conversation (§14 "conversation threads", §68.6): every message
 * in the order it was written, under a sticky separator for its day. A line
 * Nexora wrote — an escalation, a reopen — is a row of the log, not a message
 * with no sender (the `message` contract's `systemMessage`). An internal note
 * carries its mark and the words that say who reads it: never presented as
 * something the customer sees.
 */
@Component({
  selector: 'app-ticket-thread',
  imports: [
    SlAvatar,
    SlBubble,
    SlBubbleContent,
    SlMessage,
    SlMessageAvatar,
    SlMessageAuthor,
    SlMessageBody,
    SlMessageFooter,
    SlMessageHeader,
    SlMessageScroller,
    SlMessageScrollerContent,
    SlMessageScrollerItem,
    SlMessageScrollerJump,
    SlMessageScrollerSeparator,
    SlMessageScrollerViewport,
    SlMessageTime,
    SlTag,
    SlTagBody,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'thread-host' },
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-block-size: 0;
    }
    [slMessageScroller] {
      flex: 1 1 0;
      min-block-size: 0;
    }
    /* Below the compact size class the page scrolls, and the conversation is as tall as its rows. */
    @media (width < 600px) {
      [slMessageScroller] {
        flex: none;
      }
    }
    .body {
      white-space: pre-line;
    }
  `,
  template: `
    <div slMessageScroller follow defaultPosition="end" data-testid="thread">
      <div slMessageScrollerViewport [attr.aria-label]="label()">
        <div slMessageScrollerContent>
          @for (entry of entries(); track entry.key) {
            @switch (entry.kind) {
              @case ('day') {
                <div slMessageScrollerItem>
                  <div slMessageScrollerSeparator sticky>{{ entry.label }}</div>
                </div>
              }
              @case ('system') {
                <div slMessageScrollerItem data-testid="system-line">
                  <div slMessageScrollerSeparator>{{ entry.text }} · {{ time(entry.at) }}</div>
                </div>
              }
              @case ('message') {
                <div
                  slMessageScrollerItem
                  [messageId]="entry.message.id"
                  [attr.data-visibility]="entry.message.visibility"
                >
                  <article slMessage layout="thread">
                    <div slMessageAvatar>
                      <span
                        slAvatar
                        size="sm"
                        variant="soft"
                        [tone]="entry.message.authorType === 'customer' ? 'secondary' : 'accent'"
                        [name]="entry.message.authorName"
                      ></span>
                    </div>
                    <div slMessageBody>
                      <div slMessageHeader>
                        <span slMessageAuthor>{{ entry.author }}</span>
                        <time slMessageTime [attr.datetime]="entry.message.createdAt">{{
                          time(entry.message.createdAt)
                        }}</time>
                      </div>
                      <div
                        slBubble
                        [variant]="entry.message.visibility === 'internal' ? 'soft' : 'plain'"
                        [tone]="entry.message.visibility === 'internal' ? 'warning' : 'secondary'"
                      >
                        <div slBubbleContent class="body">{{ entry.message.body }}</div>
                      </div>
                      @if (entry.message.visibility === 'internal') {
                        <div slMessageFooter>
                          <span slTag size="sm" tone="warning" data-testid="internal-mark"
                            ><span slTagBody>Internal note · not visible to the customer</span></span
                          >
                        </div>
                      }
                    </div>
                  </article>
                </div>
              }
            }
          }
        </div>
      </div>
      <button slMessageScrollerJump></button>
    </div>
  `,
})
export class TicketThread {
  private readonly clock = inject(ClockService);

  readonly detail = input.required<TicketDetail>();

  readonly label = computed(() => `Conversation of ${this.detail().ticket.ticketNumber}`);

  readonly entries = computed<readonly Entry[]>(() => {
    const detail = this.detail();
    const entries: Entry[] = [];
    let day = '';
    for (const message of detail.messages) {
      const label = this.clock.formatDate(message.createdAt, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (label !== day) {
        day = label;
        entries.push({ kind: 'day', key: `day:${label}`, label });
      }
      if (message.authorType === 'system') {
        entries.push({ kind: 'system', key: message.id, text: message.body, at: message.createdAt });
        continue;
      }
      entries.push({
        kind: 'message',
        key: message.id,
        message,
        author:
          message.authorType === 'customer'
            ? `${message.authorName}, ${detail.customer.displayName}`
            : `${message.authorName}, Nexora support`,
      });
    }
    return entries;
  });

  time(instant: string): string {
    return this.clock.formatTime(instant);
  }
}
