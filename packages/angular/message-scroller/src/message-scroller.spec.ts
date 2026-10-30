import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { provideSlotted } from '@slotted/angular/i18n';
import type { MessageScrollerMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/message-scroller/contract.json';

import {
  SlMessageScroller,
  SlMessageScrollerContent,
  SlMessageScrollerItem,
  SlMessageScrollerJump,
  SlMessageScrollerLoader,
  SlMessageScrollerSeparator,
  SlMessageScrollerUnread,
  SlMessageScrollerViewport,
} from './message-scroller';
import { provideMessageScrollerDefaults } from './message-scroller-defaults';

@Component({
  imports: [
    SlMessageScroller,
    SlMessageScrollerContent,
    SlMessageScrollerItem,
    SlMessageScrollerJump,
    SlMessageScrollerLoader,
    SlMessageScrollerSeparator,
    SlMessageScrollerUnread,
    SlMessageScrollerViewport,
  ],
  template: `
    <div slMessageScroller #chat="slMessageScroller" id="root" [busy]="busy()" [messages]="words()">
      <div slMessageScrollerViewport id="viewport">
        <div slMessageScrollerContent id="log">
          <div slMessageScrollerLoader></div>
          <div slMessageScrollerItem><div slMessageScrollerSeparator sticky>Today</div></div>
          <div slMessageScrollerItem><div slMessageScrollerUnread></div></div>
          @for (row of rows; track row) {
            <div slMessageScrollerItem [messageId]="row" [anchor]="row.endsWith('0')">
              {{ row }}
            </div>
          }
        </div>
      </div>
      <button slMessageScrollerJump id="jump"></button>
    </div>
  `,
})
class Chat {
  readonly busy = signal(false);
  readonly words = signal<PartialMessages<MessageScrollerMessages> | undefined>(undefined);
  readonly rows = ['m0', 'm1', 'm2'];
  readonly chat = viewChild.required<SlMessageScroller>('chat');
}

@Component({
  imports: [SlMessageScroller, SlMessageScrollerContent, SlMessageScrollerViewport],
  template: `
    <div slMessageScroller id="root" defaultPosition="end">
      <div slMessageScrollerViewport id="viewport">
        <div slMessageScrollerContent><p>Notice</p></div>
      </div>
    </div>
  `,
})
class Notice {}

async function mount() {
  const fixture = TestBed.createComponent(Chat);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

describe('slMessageScroller', () => {
  it('writes the family identifier and every contract part', async () => {
    const { root } = await mount();
    expect(root.querySelector('#root')?.getAttribute('data-ui')).toBe(contract.ui);
    for (const part of contract.members.messageScroller.parts) {
      if (part === 'root' || part === 'jump-count') continue;
      expect(root.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
  });

  /** Content with no item to position is shown rather than held pending for good. */
  it('shows content that holds no item, without a pending state', async () => {
    const fixture = TestBed.createComponent(Notice);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#root')?.hasAttribute('data-pending')).toBe(false);
    expect(root.querySelector('#viewport')?.hasAttribute('data-pending')).toBe(false);
  });

  it('is a labelled, focusable region around a log that holds arrivals back while busy', async () => {
    const { fixture, root } = await mount();
    const viewport = root.querySelector('#viewport') as HTMLElement;
    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('aria-label')).toBe('Messages');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    const log = root.querySelector('#log') as HTMLElement;
    expect(log.getAttribute('role')).toBe('log');
    expect(log.getAttribute('aria-relevant')).toBe('additions');
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    expect(log.getAttribute('aria-busy')).toBe('true');
  });

  it('marks rows by id and anchor', async () => {
    const { root } = await mount();
    const first = root.querySelector('[data-message-id="m0"]') as HTMLElement;
    expect(first.getAttribute('data-anchor')).toBe('true');
    expect(root.querySelector('[data-message-id="m1"]')?.hasAttribute('data-anchor')).toBe(false);
  });

  it('keeps the jump control inert while there is nowhere to go', async () => {
    const { root } = await mount();
    const jump = root.querySelector('#jump') as HTMLButtonElement;
    expect(jump.getAttribute('data-active')).toBe('false');
    expect(jump.getAttribute('tabindex')).toBe('-1');
    expect(jump.hasAttribute('inert')).toBe(true);
    expect(jump.getAttribute('aria-label')).toBe('Go to the latest');
  });

  it('exposes the commands on the instance', async () => {
    const { fixture, root } = await mount();
    const chat = fixture.componentInstance.chat();
    expect(chat.scrollToMessage('m1')).toBe(true);
    expect(chat.scrollToMessage('nowhere')).toBe(false);
    chat.focus();
    expect(document.activeElement).toBe(root.querySelector('#viewport'));
  });

  it('lays its own words over the language in force', async () => {
    TestBed.configureTestingModule({ providers: [provideMessageScrollerDefaults({ peek: 32 })] });
    const { fixture, root } = await mount();
    fixture.componentInstance.words.set({ label: 'Conversa', unread: 'Por ler' });
    fixture.detectChanges();
    expect(root.querySelector('#viewport')?.getAttribute('aria-label')).toBe('Conversa');
    expect(root.querySelector('[data-part="unread"]')?.textContent?.trim()).toBe('Por ler');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.configureTestingModule({
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    const { fixture, root } = await mount();
    const viewport = root.querySelector('#viewport') as HTMLElement;
    const loader = root.querySelector('[data-part="loader"]') as HTMLElement;
    expect(viewport.getAttribute('aria-label')).toBe('Mensagens');
    expect(loader.textContent?.trim()).toBe('Carregando mensagens anteriores');

    locale.set('en-US');
    fixture.detectChanges();
    expect(viewport.getAttribute('aria-label')).toBe('Messages');
    expect(loader.textContent?.trim()).toBe('Loading earlier messages');
  });
});
