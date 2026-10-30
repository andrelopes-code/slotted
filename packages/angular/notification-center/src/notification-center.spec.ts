import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChangeRequest } from '@slotted/core/state';
import { provideSlotted } from '@slotted/angular/i18n';
import type { NotificationCenterMessages, PartialMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import contract from '../../../../specs/components/notification-center/contract.json';
import {
  SlNotificationActions,
  SlNotificationCenter,
  SlNotificationCenterActions,
  SlNotificationCenterEmpty,
  SlNotificationCenterFooter,
  SlNotificationItem,
  SlNotificationVisual,
} from './notification-center';
import { provideNotificationCenterDefaults } from './notification-center-defaults';
import type {
  NotificationCenterArrivals,
  NotificationCenterControls,
  NotificationCenterGrowing,
  NotificationCenterItemRequest,
  NotificationCenterLevel,
  NotificationCenterLoadReason,
  NotificationCenterReadRequest,
  NotificationCenterRequest,
  NotificationCenterRevealRequest,
  NotificationCenterTimeFormat,
  NotificationItem,
  NotificationView,
} from './notification-center-defaults';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

const NOW = Date.parse('2026-09-17T10:20:00Z');

const ITEMS: NotificationItem[] = [
  {
    data: { initials: 'EX' },
    description: 'Shipment SHP-009841 left Columbus with 3 packages.',
    href: '#SO-2026-01842',
    key: 'n1',
    read: false,
    time: '2026-09-17T08:20:00Z',
    title: 'SO-2026-01842 parcialmente atendido',
    tone: 'warning',
  },
  {
    key: 'n2',
    read: false,
    time: '2026-09-17T07:05:00Z',
    title: 'Partial payment on INV-2026-02891',
    tone: 'danger',
  },
  {
    key: 'n3',
    read: true,
    time: '2026-09-16T15:12:00Z',
    title: 'SO-2026-01841 approved within authority limit',
  },
];

@Component({
  standalone: true,
  imports: [
    SlNotificationCenter,
    SlNotificationCenterActions,
    SlNotificationCenterFooter,
    SlNotificationCenterEmpty,
    SlNotificationItem,
    SlNotificationVisual,
    SlNotificationActions,
  ],
  template: `<button type="button">antes</button>
    <section
      slNotificationCenter
      [items]="items()"
      [views]="views()"
      [size]="size()"
      [level]="level()"
      [growing]="growing()"
      [arrivals]="arrivals()"
      [timeFormat]="timeFormat()"
      [controls]="controls()"
      [loading]="loading()"
      [count]="count()"
      [groupBy]="groupBy()"
      [now]="now"
      [messages]="words()"
      [(view)]="view"
      (viewRequest)="viewRequests.push($event); onView($event)"
      (readRequest)="readRequests.push($event)"
      (removeRequest)="removeRequests.push($event); onRemove($event)"
      (openRequest)="openRequests.push($event); onOpen($event)"
      (revealRequest)="revealRequests.push($event)"
      (loadMoreRequest)="loadRequests.push($event)"
      (unreadChange)="unreadCounts.push($event)"
    >
      @if (withActions()) {
        <div slNotificationCenterActions><a href="#p">Preferences</a></div>
      }
      @if (withVisual()) {
        <ng-template slNotificationVisual let-item>
          @if (item.data) {
            <span data-testid="avatar">{{ item.data.initials }}</span>
          }
        </ng-template>
      }
      @if (withItemTemplate()) {
        <ng-template slNotificationItem let-item let-position="position" let-ids="ids">
          <span data-part="title" data-part-title="" [id]="ids.title"
            >{{ position }}. {{ item.title }}</span
          >
        </ng-template>
      }
      @if (withItemActions()) {
        <ng-template slNotificationActions let-item>
          <button type="button">Ver {{ item.key }}</button>
        </ng-template>
      }
      @if (withFooter()) {
        <div slNotificationCenterFooter><a href="#all">Ver todas</a></div>
      }
    </section>
    <button type="button">depois</button>`,
})
class Host {
  readonly center = viewChild.required(SlNotificationCenter);
  readonly items = signal<readonly NotificationItem[]>(ITEMS);
  readonly views = signal<readonly NotificationView[] | undefined>(undefined);
  readonly size = signal<'sm' | 'md' | undefined>(undefined);
  readonly level = signal<NotificationCenterLevel | undefined>(undefined);
  readonly growing = signal<NotificationCenterGrowing | undefined>(undefined);
  readonly arrivals = signal<NotificationCenterArrivals | undefined>(undefined);
  readonly timeFormat = signal<NotificationCenterTimeFormat | undefined>(undefined);
  readonly controls = signal<NotificationCenterControls | undefined>(undefined);
  readonly loading = signal(false);
  readonly count = signal<number | undefined>(undefined);
  readonly groupBy = signal<((item: NotificationItem) => string) | undefined>(undefined);
  readonly view = signal<string | undefined>(undefined);
  readonly words = signal<PartialMessages<NotificationCenterMessages> | undefined>(undefined);
  readonly now = NOW;
  readonly withActions = signal(false);
  readonly withVisual = signal(true);
  readonly withItemTemplate = signal(false);
  readonly withItemActions = signal(false);
  readonly withFooter = signal(false);

  readonly viewRequests: ChangeRequest<string | undefined>[] = [];
  readonly readRequests: NotificationCenterReadRequest[] = [];
  readonly removeRequests: NotificationCenterItemRequest[] = [];
  readonly openRequests: NotificationCenterItemRequest[] = [];
  readonly revealRequests: NotificationCenterRevealRequest[] = [];
  readonly loadRequests: NotificationCenterRequest<NotificationCenterLoadReason>[] = [];
  readonly unreadCounts: number[] = [];
  onView: (request: ChangeRequest<string | undefined>) => void = () => undefined;
  onRemove: (request: NotificationCenterItemRequest) => void = () => undefined;
  onOpen: (request: NotificationCenterItemRequest) => void = () => undefined;
}

/**
 * A control-flow block with one root is projected by that root's selector
 * even while it is off, so the consumer's empty page lives in a host of its
 * own rather than behind an `@if`.
 */
@Component({
  standalone: true,
  imports: [SlNotificationCenter, SlNotificationCenterEmpty],
  template: `<section slNotificationCenter [items]="[]">
    <p slNotificationCenterEmpty>Nothing here</p>
  </section>`,
})
class EmptyHost {}

@Component({
  standalone: true,
  imports: [SlNotificationCenter],
  template: `<section slNotificationCenter defaultView="unread" [items]="items"></section>`,
})
class DefaultViewHost {
  readonly items = ITEMS;
}

describe('SlNotificationCenter', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const all = (selector: string) => [
    ...(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>),
  ];
  const root = () => query('[data-ui="notification-center"]') as HTMLElement;
  const heading = () => query('[data-part="header"] > [data-part="title"]') as HTMLElement;
  const feed = () => query('[role="feed"]') as HTMLElement;
  const articles = () => all('article[data-part="item"]');
  const article = (index: number) => articles()[index] as HTMLElement;
  const button = (name: string) =>
    all('button').find(
      (candidate) =>
        candidate.getAttribute('aria-label') === name || candidate.textContent?.trim() === name,
    ) as HTMLElement;
  const press = (element: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...init }));
  const click = (element: HTMLElement, detail = 1) =>
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail }));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('renders the region, the feed and one article per item with the pattern wiring', () => {
    expect(root().getAttribute('aria-labelledby')).toBe(heading().id);
    expect(heading().textContent).toContain('Notifications');
    expect(feed().getAttribute('aria-labelledby')).toBe(heading().id);
    expect(articles()).toHaveLength(3);
    expect(article(0).getAttribute('tabindex')).toBe('0');
    expect(article(0).getAttribute('aria-posinset')).toBe('1');
    expect(article(0).getAttribute('aria-setsize')).toBe('3');
    const title = query(`#${CSS.escape(article(0).getAttribute('aria-labelledby') ?? '')}`);
    expect(title?.textContent).toBe('SO-2026-01842 parcialmente atendido');
    expect(article(0).getAttribute('aria-describedby')).toBeTruthy();
    expect(article(0).getAttribute('data-tone')).toBe('warning');
    expect(article(0).hasAttribute('data-read')).toBe(false);
    expect(article(2).hasAttribute('data-read')).toBe(true);
    expect(article(2).getAttribute('data-tone')).toBe('accent');
  });

  it('declares every axis on the root and the defaults the contract names', () => {
    const defaults = contract.members.notificationCenter.defaults;
    expect(root().getAttribute('data-size')).toBe(defaults.size);
    expect(root().getAttribute('data-level')).toBe(defaults.level);
    expect(root().getAttribute('data-growing')).toBe(defaults.growing);
    expect(root().getAttribute('data-arrivals')).toBe(defaults.arrivals);
    expect(root().getAttribute('data-time-format')).toBe(defaults.timeFormat);
    expect(root().getAttribute('data-view')).toBe(defaults.view);
    expect(root().getAttribute('data-controls')).toBe(defaults.controls);
    expect(root().hasAttribute('data-loading')).toBe(false);
  });

  it('renders every part the contract declares', async () => {
    host.withActions.set(true);
    host.withFooter.set(true);
    host.withItemActions.set(true);
    host.groupBy.set((item) => (item.read ? 'Yesterday' : 'Today'));
    host.growing.set('button');
    await settle();

    const parts = new Set(all('[data-part]').map((element) => element.getAttribute('data-part')));
    const expected = contract.members.notificationCenter.parts.filter(
      (part) => !['root', 'empty', 'fresh'].includes(part),
    );
    for (const part of expected) expect(parts.has(part), part).toBe(true);
    expect(root().getAttribute('data-part')).toBe('root');
  });

  it('writes the time as a machine value with relative words, and absolute on request', async () => {
    const time = article(0).querySelector('time') as HTMLElement;
    expect(time.getAttribute('datetime')).toBe('2026-09-17T08:20:00Z');
    expect(time.textContent).toMatch(/2 horas|2 hours|2 h/);
    expect(time.hasAttribute('title')).toBe(true);

    host.timeFormat.set('absolute');
    await settle();
    expect(root().getAttribute('data-time-format')).toBe('absolute');
    expect(article(0).querySelector('time')?.hasAttribute('title')).toBe(false);
  });

  it('draws the visual template, the family visual for a tone, and none without either', async () => {
    expect(article(0).querySelector('[data-part="visual"] [data-testid="avatar"]')).toBeTruthy();
    expect(article(1).querySelector('[data-part="visual"]')).toBeTruthy();

    host.withVisual.set(false);
    await settle();
    expect(article(0).querySelector('[data-part="visual"]')?.textContent).toBe('');
    expect(article(1).querySelector('[data-part="visual"]')?.textContent).toBe('');
    expect(article(2).querySelector('[data-part="visual"]')).toBeNull();
    /* The family's own visual: the tone's glyph, marked as the family's. */
    const toneGlyph = (index: number) =>
      article(index)
        .querySelector('[data-part="visual"] > [data-ui="icon"][data-tone-glyph] > svg')
        ?.getAttribute('data-glyph');
    expect(toneGlyph(0)).toBe('circle-alert');
    expect(toneGlyph(1)).toBe('circle-x');
  });

  it('draws check to mark read, dot to mark unread, and x to dismiss', () => {
    const glyph = (index: number, part: string) =>
      article(index)
        .querySelector(`[data-part="${part}"] > [data-ui="icon"] > svg[data-glyph]`)
        ?.getAttribute('data-glyph');
    expect(glyph(0, 'read-toggle')).toBe('check');
    expect(glyph(2, 'read-toggle')).toBe('dot');
    expect(glyph(0, 'dismiss')).toBe('x');
  });

  it('asks to mark read and never marks itself', () => {
    click(button('Mark as read'));
    expect(host.readRequests.at(-1)).toMatchObject({ keys: ['n1'], read: true, reason: 'pointer' });
    expect(article(0).hasAttribute('data-read')).toBe(false);

    click(button('Mark as unread'), 0);
    expect(host.readRequests.at(-1)).toMatchObject({
      keys: ['n3'],
      read: false,
      reason: 'keyboard',
    });

    click(button('Mark all as read'));
    expect(host.readRequests.at(-1)).toMatchObject({ keys: ['n1', 'n2'], read: true });

    host.center().markAllRead();
    expect(host.readRequests.at(-1)).toMatchObject({ keys: ['n1', 'n2'], reason: 'programmatic' });
  });

  /**
   * Two glyphs with no words beside them are two controls nobody can tell
   * apart until they are named: each of the family's own controls opens a
   * tooltip with its accessible name, on keyboard focus in the same task.
   */
  it('names its own controls with a tooltip as well as with aria-label', async () => {
    /* A key first: jsdom, like a browser, shows focus only after the keyboard was the last thing used. */
    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    const read = button('Mark as read');
    read.focus();
    read.dispatchEvent(new FocusEvent('focus'));
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    const hint = document.querySelector('[role="tooltip"]');
    expect(hint?.textContent?.trim()).toBe('Mark as read');
    expect(read.getAttribute('aria-describedby')).toBe(hint?.id);

    read.dispatchEvent(new FocusEvent('blur'));
    await settle();
    expect(read.getAttribute('aria-describedby')).toBeNull();

    const dismiss = button('Dismiss');
    dismiss.focus();
    dismiss.dispatchEvent(new FocusEvent('focus'));
    await settle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    expect(document.querySelector('[role="tooltip"]')?.textContent?.trim()).toBe('Dismiss');
  });

  it('counts the unread in the heading, disables mark-all at zero and reports the count', async () => {
    expect(heading().querySelector('[data-part="count"]')?.textContent).toBe('2');
    expect((button('Mark all as read') as HTMLButtonElement).disabled).toBe(false);
    expect(host.unreadCounts).toEqual([2]);

    host.items.set(ITEMS.map((item) => ({ ...item, read: true })));
    await settle();
    expect(heading().querySelector('[data-part="count"]')).toBeNull();
    expect((button('Mark all as read') as HTMLButtonElement).disabled).toBe(true);
    expect(host.unreadCounts).toEqual([2, 0]);
  });

  it('asks to be removed from the control and from Delete, and moves focus to a neighbour', () => {
    click(all('[data-part="dismiss"]')[1] as HTMLElement);
    expect(host.removeRequests.at(-1)).toMatchObject({ key: 'n2', reason: 'pointer' });

    article(0).focus();
    press(article(0), 'Delete');
    expect(host.removeRequests.at(-1)).toMatchObject({ key: 'n1', reason: 'keyboard' });
    expect(document.activeElement).toBe(article(1));
    expect(articles()).toHaveLength(3);

    host.onRemove = (request) => request.cancel();
    press(article(1), 'Delete');
    expect(document.activeElement).toBe(article(1));
  });

  it('asks before a title link navigates and keeps the reader here when refused', () => {
    const link = article(0).querySelector('a[data-part="title"]') as HTMLElement;
    expect(click(link)).toBe(true);
    expect(host.openRequests.at(-1)).toMatchObject({ key: 'n1', reason: 'pointer' });

    host.onOpen = (request) => request.cancel();
    expect(click(link, 0)).toBe(false);
    expect(host.openRequests.at(-1)).toMatchObject({ key: 'n1', reason: 'keyboard' });
  });

  it('moves between articles with PageDown and PageUp and out of the feed with Control', () => {
    article(0).focus();
    press(article(0), 'PageDown');
    expect(document.activeElement).toBe(article(1));
    press(article(1), 'PageUp');
    expect(document.activeElement).toBe(article(0));
    press(article(0), 'End', { ctrlKey: true });
    expect(document.activeElement).toBe(button('depois'));
    article(0).focus();
    press(article(0), 'Home', { ctrlKey: true });
    expect(document.activeElement).toBe(query('[role="tab"][aria-selected="true"]'));
  });

  it('offers all and unread as views, filters under unread, and wires the strip to the feed', async () => {
    const tabs = all('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('aria-controls')).toBe(feed().id);
    expect(tabs[1]?.getAttribute('aria-controls')).toBe(feed().id);
    expect(tabs[1]?.querySelector('[data-part="count"]')?.textContent).toBe('2');

    click(tabs[1] as HTMLElement);
    await settle();
    expect(host.viewRequests.at(-1)).toMatchObject({ value: 'unread', reason: 'pointer' });
    expect(host.view()).toBe('unread');
    expect(root().getAttribute('data-view')).toBe('unread');
    expect(articles()).toHaveLength(2);
  });

  it('starts on defaultView when the model is unbound', async () => {
    const own = TestBed.createComponent(DefaultViewHost);
    own.autoDetectChanges();
    await own.whenStable();
    const element = own.nativeElement as HTMLElement;
    expect(
      element.querySelector('[data-ui="notification-center"]')?.getAttribute('data-view'),
    ).toBe('unread');
    expect(element.querySelectorAll('article')).toHaveLength(2);
  });

  it('honors a refusal of the view', async () => {
    host.onView = (request) => request.cancel();
    click(all('[role="tab"]')[1] as HTMLElement);
    await settle();
    expect(host.view()).toBeUndefined();
    expect(root().getAttribute('data-view')).toBe('all');
    expect(articles()).toHaveLength(3);
  });

  it('takes the consumer views, draws no strip for one, and leaves their items alone', async () => {
    host.views.set([
      { label: 'All', value: 'all' },
      { label: 'Mentions', value: 'mentions' },
    ]);
    host.view.set('mentions');
    await settle();
    expect(root().getAttribute('data-view')).toBe('mentions');
    expect(articles()).toHaveLength(3);

    host.views.set([{ label: 'Todas', value: 'all' }]);
    await settle();
    expect(query('[role="tablist"]')).toBeNull();
    expect(query('[data-part="views"]')).toBeNull();
  });

  it('holds arrivals while the reader reads and shows them when revealed', async () => {
    article(0).focus();
    host.items.set([
      { key: 'n0', read: false, time: '2026-09-17T10:00:00Z', title: 'Nova' },
      ...ITEMS,
    ]);
    await settle();
    expect(articles()).toHaveLength(3);
    const fresh = query('[data-part="fresh"]') as HTMLElement;
    expect(fresh.textContent?.trim()).toBe('1 new notification');

    press(article(0), 'PageUp');
    expect(document.activeElement).toBe(fresh);

    click(fresh, 0);
    await settle();
    expect(host.revealRequests.at(-1)).toMatchObject({ count: 1, reason: 'keyboard' });
    expect(articles()).toHaveLength(4);
    expect(document.activeElement).toBe(article(0));
    expect(query('[data-part="fresh"]')).toBeNull();
  });

  it('shows arrivals at once when nobody is reading, and always under show', async () => {
    host.items.set([
      { key: 'n0', read: false, time: '2026-09-17T10:00:00Z', title: 'Nova' },
      ...ITEMS,
    ]);
    await settle();
    expect(articles()).toHaveLength(4);
    expect(query('[data-part="fresh"]')).toBeNull();

    host.arrivals.set('show');
    article(0).focus();
    host.items.set([
      { key: 'n-1', read: false, time: '2026-09-17T10:10:00Z', title: 'Outra' },
      ...host.items(),
    ]);
    await settle();
    expect(articles()).toHaveLength(5);
    expect(query('[data-part="fresh"]')).toBeNull();
  });

  it('applies a change to a shown item and a removal at once even while reading', async () => {
    article(0).focus();
    host.items.set(
      ITEMS.filter((item) => item.key !== 'n2').map((item) => ({ ...item, read: true })),
    );
    await settle();
    expect(articles()).toHaveLength(2);
    expect(article(0).hasAttribute('data-read')).toBe(true);
  });

  it('groups the feed under labels one rank below the title', async () => {
    host.groupBy.set((item) => (item.read ? 'Yesterday' : 'Today'));
    host.level.set('3');
    await settle();

    expect(heading().tagName).toBe('H3');
    const labels = all('[data-part="group-label"]');
    expect(labels.map((label) => label.tagName)).toEqual(['H4', 'H4']);
    expect(labels.map((label) => label.textContent)).toEqual(['Today', 'Yesterday']);
    expect(all('[data-part="group"]')).toHaveLength(2);
    expect(article(2).getAttribute('aria-posinset')).toBe('3');
  });

  it('loads a page from the button, from the sentinel, and says so while waiting', async () => {
    host.growing.set('button');
    await settle();
    click(button('Load more'));
    expect(host.loadRequests.at(-1)).toMatchObject({ reason: 'pointer' });
    expect(article(0).getAttribute('aria-setsize')).toBe('-1');

    host.growing.set('scroll');
    await settle();
    expect(query('div[data-part="more"]')).toBeTruthy();
    const observer = FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver;
    observer.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    );
    expect(host.loadRequests.at(-1)).toMatchObject({ reason: 'scroll' });

    host.count.set(40);
    host.loading.set(true);
    await settle();
    expect(feed().getAttribute('aria-busy')).toBe('true');
    expect(root().hasAttribute('data-loading')).toBe(true);
    expect(query('[data-part="more"]')?.textContent).toContain('Loading notifications');
    expect(article(0).getAttribute('aria-setsize')).toBe('40');
  });

  it('stands skeleton rows in while nothing has arrived, and the empty page when nothing will', async () => {
    host.items.set([]);
    host.loading.set(true);
    await settle();
    expect(feed().getAttribute('aria-busy')).toBe('true');
    expect(articles()).toHaveLength(0);
    expect(all('[data-ui="skeleton"]').length).toBeGreaterThan(0);
    expect(query('[data-part="empty"]')).toBeNull();

    host.loading.set(false);
    await settle();
    expect(query('[data-part="empty"]')?.textContent?.trim()).toBe('No notifications');

    host.items.set(ITEMS.map((item) => ({ ...item, read: true })));
    host.view.set('unread');
    await settle();
    expect(query('[data-part="empty"]')?.textContent?.trim()).toBe('All caught up');

    const own = TestBed.createComponent(EmptyHost);
    own.autoDetectChanges();
    await own.whenStable();
    expect(
      (own.nativeElement as HTMLElement).querySelector('[data-part="empty"]')?.textContent?.trim(),
    ).toBe('Nothing here');
  });

  it('draws the controls the axis names', async () => {
    host.controls.set('read');
    await settle();
    expect(all('[data-part="read-toggle"]')).toHaveLength(3);
    expect(all('[data-part="dismiss"]')).toHaveLength(0);

    host.controls.set('dismiss');
    await settle();
    expect(all('[data-part="read-toggle"]')).toHaveLength(0);
    expect(all('[data-part="dismiss"]')).toHaveLength(3);

    host.controls.set('none');
    await settle();
    expect(query('[data-part="controls"]')).toBeNull();
  });

  it('substitutes an item content through the template and keeps the article', async () => {
    host.withItemTemplate.set(true);
    await settle();
    const title = query(`#${CSS.escape(article(1).getAttribute('aria-labelledby') ?? '')}`);
    expect(title?.textContent).toBe('2. Partial payment on INV-2026-02891');
    expect(article(1).querySelector('[data-part="read-toggle"]')).toBeTruthy();
  });

  it('reads its defaults from the provider and lets an input win', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideNotificationCenterDefaults({ controls: 'none', growing: 'button', size: 'sm' }),
      ],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    host.level.set('4');
    host.words.set({ title: 'Avisos' });
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(root().getAttribute('data-size')).toBe('sm');
    expect(root().getAttribute('data-growing')).toBe('button');
    expect(root().getAttribute('data-controls')).toBe('none');
    expect(root().getAttribute('data-level')).toBe('4');
    expect(heading().tagName).toBe('H4');
    expect(heading().textContent).toContain('Avisos');
  });

  it('speaks the language in force, and follows a change of it in place', async () => {
    const locale = signal('pt-BR');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } })],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();

    // language: pt-BR
    expect(heading().textContent).toContain('Notificações');
    // language: en-US
    expect(button('Marcar tudo como lido')).toBeTruthy();

    locale.set('en-US');
    await settle();
    expect(heading().textContent).toContain('Notifications');
    expect(button('Mark all as read')).toBeTruthy();
  });

  it('exposes focus and reveal on the instance', async () => {
    host.center().focus();
    expect(document.activeElement).toBe(article(0));

    host.items.set([
      { key: 'n0', read: false, time: '2026-09-17T10:00:00Z', title: 'Nova' },
      ...ITEMS,
    ]);
    await settle();
    expect(articles()).toHaveLength(3);
    host.center().reveal();
    await settle();
    expect(host.revealRequests.at(-1)).toMatchObject({ count: 1, reason: 'programmatic' });
    expect(articles()).toHaveLength(4);
  });
});
