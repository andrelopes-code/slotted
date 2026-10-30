import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ChangeRequest } from '@slotted/core/state';
import { provideSlotted } from '@slotted/angular/i18n';
import type { MessageMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { describe, expect, it, vi } from 'vitest';

import contract from '../../../../specs/components/message/contract.json';

import {
  SlBubble,
  SlBubbleCaret,
  SlBubbleStream,
  SlBubbleContent,
  SlBubbleQuote,
  SlBubbleReaction,
  SlBubbleReactions,
  SlBubbleRetry,
  SlBubbleTyping,
} from './bubble';
import { SlMessage, SlMessageGroup } from './message';
import type { MessageRetryRequest, MessageStatus } from './message-defaults';
import { provideMessageDefaults } from './message-defaults';
import {
  SlBubbleMeta,
  SlMessageActions,
  SlMessageActivity,
  SlMessageActivityStep,
  SlMessageAuthor,
  SlMessageAvatar,
  SlMessageBody,
  SlMessageFooter,
  SlMessageHeader,
  SlMessageReceipt,
  SlMessageTime,
  SlMessageVersions,
} from './message-parts';

const ALL = [
  SlBubble,
  SlBubbleCaret,
  SlBubbleStream,
  SlBubbleContent,
  SlBubbleMeta,
  SlBubbleQuote,
  SlBubbleReaction,
  SlBubbleReactions,
  SlBubbleRetry,
  SlBubbleTyping,
  SlMessage,
  SlMessageActions,
  SlMessageActivity,
  SlMessageActivityStep,
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

@Component({
  imports: ALL,
  template: `
    <div slMessageGroup>
      <article
        slMessage
        id="row"
        [status]="status()"
        [messages]="rowMessages()"
        [versionCount]="3"
        [(version)]="version"
        (versionChangeRequest)="versionAsked($event)"
        (retry)="retried($event)"
      >
        <div slMessageAvatar></div>
        <div slMessageBody>
          <div slMessageHeader>
            <span slMessageAuthor>Marta Silva</span>
            <time slMessageTime datetime="2026-09-30T09:38">09:38</time>
          </div>
          <div slMessageActivity>
            <div slMessageActivityStep status="complete">Li o registo</div>
            <div slMessageActivityStep id="now">A procurar</div>
          </div>
          <div slBubble id="bubble" [maxLines]="3">
            <div slBubbleContent>
              <div slBubbleQuote author="Tim">The account does not exist.</div>
              <span slBubbleStream text="It arrives this afternoon."></span>
              <span slBubbleCaret></span>
              <span slBubbleTyping></span>
              <span slBubbleMeta>
                <time slMessageTime datetime="2026-09-30T09:41">09:41</time>
                <span slMessageReceipt id="inside"></span>
              </span>
            </div>
            <button slBubbleRetry></button>
            <div slBubbleReactions>
              <button slBubbleReaction id="reaction" [count]="2" [(pressed)]="pressed">👍</button>
            </div>
          </div>
          <div slMessageFooter>
            <span slMessageReceipt id="outside" status="failed"></span>
            <div slMessageVersions></div>
            <div slMessageActions><button type="button">Copiar</button></div>
          </div>
        </div>
      </article>
    </div>
    <article slMessage align="end">
      <div slBubble id="own"><div slBubbleContent>a</div></div>
    </article>
    <article slMessage layout="thread">
      <div slBubble id="thread"><div slBubbleContent>b</div></div>
    </article>
  `,
})
class Everything {
  readonly status = signal<MessageStatus>('read');
  readonly rowMessages = signal<PartialMessages<MessageMessages> | undefined>(undefined);
  version = 0;
  pressed = false;
  readonly versionAsked = vi.fn<(request: ChangeRequest<number>) => void>();
  readonly retried = vi.fn<(request: MessageRetryRequest) => void>();
}

function mount() {
  const fixture = TestBed.createComponent(Everything);
  fixture.detectChanges();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

describe('slMessage', () => {
  it('writes the family identifier and every contract part', () => {
    const { root } = mount();
    const row = root.querySelector('#row') as HTMLElement;
    expect(row.getAttribute('data-ui')).toBe(contract.ui);
    expect(row.tagName).toBe('ARTICLE');
    const parts = [...contract.members.message.parts, ...contract.members.bubble.parts].filter(
      /* `more` draws only on overflow, `stream-chunk` only while a word enters: both have tests of their own. */
      (part) => part !== 'root' && part !== 'more' && part !== 'stream-chunk',
    );
    for (const part of parts) {
      expect(root.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(root.querySelector('#bubble')?.getAttribute('data-part')).toBe(contract.rootPart.bubble);
  });

  it('names the article by its author', () => {
    const { root } = mount();
    const row = root.querySelector('#row') as HTMLElement;
    const author = root.querySelector('[data-part="author"]') as HTMLElement;
    expect(row.getAttribute('aria-labelledby')).toBe(author.id);
  });

  it('writes the delivery state as the shared state attributes', () => {
    const { fixture, root } = mount();
    const row = root.querySelector('#row') as HTMLElement;
    expect(row.hasAttribute('data-read')).toBe(true);
    fixture.componentInstance.status.set('sending');
    fixture.detectChanges();
    expect(row.getAttribute('aria-busy')).toBe('true');
    expect(row.hasAttribute('data-loading')).toBe(true);
    fixture.componentInstance.status.set('failed');
    fixture.detectChanges();
    expect(row.hasAttribute('data-invalid')).toBe(true);
  });

  it('paints the reader’s own bubble in the accent’s fill and a thread with no box', () => {
    const { root } = mount();
    expect(root.querySelector('#own')?.getAttribute('data-variant')).toBe('solid');
    expect(root.querySelector('#own')?.getAttribute('data-tone')).toBe('accent');
    expect(root.querySelector('#thread')?.getAttribute('data-variant')).toBe('plain');
  });

  it('draws the receipt as a mark with a hidden word inside the meta, and as the word alone outside', () => {
    const { root } = mount();
    const inside = root.querySelector('#inside') as HTMLElement;
    expect(inside.querySelector('svg')).not.toBeNull();
    expect(inside.textContent).toContain('Read');
    const outside = root.querySelector('#outside') as HTMLElement;
    expect(outside.querySelector('svg')).toBeNull();
    expect(outside.textContent?.trim()).toBe('Not sent');
  });

  it('pages versions without wrapping, asking first, by pointer and by arrow', () => {
    const { fixture, root } = mount();
    const next = root.querySelector('[data-part="version-next"]') as HTMLButtonElement;
    const previous = root.querySelector('[data-part="version-previous"]') as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    next.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(fixture.componentInstance.version).toBe(1);
    expect(fixture.componentInstance.versionAsked).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 1, reason: 'pointer' }),
    );
    next.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.version).toBe(2);
    expect(root.querySelector('[data-part="version-label"]')?.textContent?.trim()).toBe('3 of 3');
    expect(next.disabled).toBe(true);
  });

  it('asks the row to send a failed message again', () => {
    const { fixture, root } = mount();
    const retry = root.querySelector('[data-part="retry"]') as HTMLButtonElement;
    expect(retry.getAttribute('aria-label')).toBe('Try sending again');
    retry.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(fixture.componentInstance.retried).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'pointer' }),
    );
  });

  it('toggles a reaction the reader gives, two-way', () => {
    const { fixture, root } = mount();
    const reaction = root.querySelector('#reaction') as HTMLButtonElement;
    expect(reaction.getAttribute('aria-pressed')).toBe('false');
    reaction.click();
    fixture.detectChanges();
    expect(reaction.getAttribute('aria-pressed')).toBe('true');
    expect(reaction.hasAttribute('data-pressed')).toBe(true);
    expect(fixture.componentInstance.pressed).toBe(true);
    expect(reaction.textContent).toContain('2');
  });

  it('marks the activity steps with the shared states', () => {
    const { root } = mount();
    const now = root.querySelector('#now') as HTMLElement;
    expect(now.hasAttribute('data-current')).toBe(true);
    expect(now.getAttribute('aria-current')).toBe('step');
    expect(root.querySelector('[data-complete]')).not.toBeNull();
  });

  it('lets an application set the layout once, and a row lay its own words over the language', () => {
    TestBed.configureTestingModule({
      providers: [provideMessageDefaults({ layout: 'thread' })],
    });
    const { fixture, root } = mount();
    fixture.componentInstance.rowMessages.set({ actions: 'Actions' });
    fixture.detectChanges();
    expect(root.querySelector('[data-part="actions"]')?.getAttribute('aria-label')).toBe('Actions');
    expect(root.querySelector('#row')?.getAttribute('data-layout')).toBe('thread');
  });

  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { fixture, root } = mount();
    const label = () => root.querySelector('[data-part="version-label"]')?.textContent?.trim();
    const typing = () => root.querySelector('[data-part="typing"]')?.getAttribute('aria-label');
    expect(label()).toBe('1 de 3');
    expect(typing()).toBe('Digitando');

    locale.set('en-US');
    fixture.detectChanges();
    expect(label()).toBe('1 of 3');
    expect(typing()).toBe('Typing');
  });
});

@Component({
  imports: [SlMessage, SlMessageBody, SlBubble, SlBubbleContent, SlBubbleStream],
  template: `
    <article slMessage aria-label="Assistente" [status]="status()">
      <div slMessageBody>
        <div slBubble>
          <div slBubbleContent><span slBubbleStream id="stream" [text]="text()"></span></div>
        </div>
      </div>
    </article>
  `,
})
class StreamReply {
  readonly text = signal('');
  readonly status = signal<MessageStatus | undefined>('streaming');
}

function mountStream(text: string, status: MessageStatus | undefined) {
  const fixture = TestBed.createComponent(StreamReply);
  fixture.componentInstance.text.set(text);
  fixture.componentInstance.status.set(status);
  fixture.detectChanges();
  const stream = fixture.nativeElement.querySelector('#stream') as HTMLElement;
  const chunks = () => [...stream.querySelectorAll<HTMLElement>('[data-part="stream-chunk"]')];
  return { fixture, stream, chunks };
}

describe('slBubbleStream', () => {
  it('paints a finished reply as plain text, with nothing entering', () => {
    const { stream, chunks } = mountStream('O p95 voltou a 260 ms.', undefined);
    expect(stream.textContent).toBe('O p95 voltou a 260 ms.');
    expect(chunks()).toEqual([]);
  });

  it('puts every word that arrives in the DOM at once, each entering after its delay', () => {
    const { fixture, stream, chunks } = mountStream('The ', 'streaming');
    fixture.componentInstance.text.set('The tax filing service');
    fixture.detectChanges();
    expect(stream.textContent).toBe('The tax filing service');
    expect(chunks().map((chunk) => chunk.textContent)).toEqual(['tax ', 'filing ', 'service']);
    const delays = chunks().map((chunk) => Number.parseFloat(chunk.style.animationDelay));
    expect(delays.slice(1).every((delay, index) => delay > (delays[index] ?? 0))).toBe(true);
  });

  it('folds a word back into the text once it has entered', () => {
    const { fixture, stream, chunks } = mountStream('', 'streaming');
    fixture.componentInstance.text.set('um dois');
    fixture.detectChanges();
    chunks().at(-1)?.dispatchEvent(new Event('animationend'));
    fixture.detectChanges();
    expect(chunks()).toEqual([]);
    expect(stream.textContent).toBe('um dois');
  });

  it('replaces a reply that does not extend the one received, at once', () => {
    const { fixture, stream, chunks } = mountStream('First version', 'streaming');
    fixture.componentInstance.text.set('Another');
    fixture.detectChanges();
    expect(stream.textContent).toBe('Another');
    expect(chunks()).toEqual([]);
  });
});
