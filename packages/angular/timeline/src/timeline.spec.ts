import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { provideSlotted } from '@slotted/angular/i18n';
import type { PartialMessages, TimelineMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';

import contract from '../../../../specs/components/timeline/contract.json';
import {
  SlTimeline,
  SlTimelineActions,
  SlTimelineActor,
  SlTimelineGroup,
  SlTimelineGroupList,
  SlTimelineItem,
  SlTimelineList,
  SlTimelineMarker,
  SlTimelineOpposite,
  SlTimelineTime,
  SlTimelineTitle,
} from './timeline';
import { provideTimelineDefaults } from './timeline.constants';

const NOW = Date.UTC(2026, 8, 14, 12, 32);
const PARTS = [
  SlTimeline,
  SlTimelineActions,
  SlTimelineActor,
  SlTimelineGroup,
  SlTimelineGroupList,
  SlTimelineItem,
  SlTimelineList,
  SlTimelineMarker,
  SlTimelineOpposite,
  SlTimelineTime,
  SlTimelineTitle,
];

@Component({
  imports: PARTS,
  template: `<div
    slTimeline
    label="Invoice activity"
    locale="en-GB"
    timeZone="UTC"
    [now]="now"
    [mode]="mode()"
    [order]="order()"
    [placement]="placement()"
    [variant]="variant()"
    [tone]="tone()"
    [growing]="growing()"
    [timeFormat]="timeFormat()"
    [loading]="loading()"
    [freshCount]="freshCount()"
    [count]="count()"
    [autoComplete]="autoComplete()"
    [messages]="words()"
    (loadMoreRequest)="onLoadMore($event)"
    (revealRequest)="onReveal($event)"
  >
    @if (mode() === 'feed') {
      <div slTimelineList>
        @for (event of events(); track event.title) {
          <article
            slTimelineItem
            [title]="event.title"
            [description]="event.description"
            [time]="event.time"
            [current]="event.current ?? false"
            [loading]="event.loading ?? false"
            [tone]="event.tone"
          >
            @if (event.action) {
              <div slTimelineActions>
                <button type="button">{{ event.action }}</button>
              </div>
            }
          </article>
        }
      </div>
    } @else {
      <ol slTimelineList>
        @for (event of events(); track event.title) {
          <li
            slTimelineItem
            [title]="event.title"
            [description]="event.description"
            [time]="event.time"
            [current]="event.current ?? false"
            [loading]="event.loading ?? false"
            [tone]="event.tone"
          ></li>
        }
      </ol>
    }
  </div>`,
})
class TestHost {
  readonly now = NOW;
  readonly mode = signal<'list' | 'feed' | undefined>(undefined);
  readonly order = signal<'oldest-first' | 'newest-first' | undefined>(undefined);
  readonly placement = signal<'end' | 'start' | 'alternate' | undefined>(undefined);
  readonly variant = signal<'solid' | 'outline' | 'subtle' | 'plain' | undefined>(undefined);
  readonly tone = signal<'secondary' | 'accent' | undefined>(undefined);
  readonly growing = signal<'none' | 'button' | 'scroll' | undefined>(undefined);
  readonly timeFormat = signal<'absolute' | 'relative' | undefined>(undefined);
  readonly loading = signal(false);
  readonly freshCount = signal(0);
  readonly count = signal<number | undefined>(undefined);
  readonly autoComplete = signal(false);
  readonly words = signal<PartialMessages<TimelineMessages> | undefined>(undefined);
  readonly events = signal<
    {
      title: string;
      description?: string;
      time?: string;
      current?: boolean;
      loading?: boolean;
      tone?: 'accent' | 'success';
      action?: string;
    }[]
  >([
    {
      title: 'Invoice created',
      description: 'Draft INV-4821 for Solaris Freight.',
      time: '2026-09-08T09:12:00Z',
      action: 'Retry',
    },
    { title: 'Sent to client', time: '2026-09-08T09:15:00Z', tone: 'accent' },
    { title: 'Paid in full', time: '2026-09-14T10:32:00Z', current: true, tone: 'success' },
    { title: 'Receipt', loading: true },
  ]);
  readonly onLoadMore = vi.fn();
  readonly onReveal = vi.fn();
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [TestHost], providers: providers as never[] });
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="timeline"]') as HTMLElement;
  const items = () => [...root.querySelectorAll('[data-part="item"]')] as HTMLElement[];
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    items,
    item: (index: number) => items()[index] as HTMLElement,
    part: (element: HTMLElement, name: string) =>
      element.querySelector(`[data-part="${name}"]`) as HTMLElement,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlTimeline', () => {
  it('is selected in public by the family identifier and its parts', () => {
    const { root, item, part } = setup();
    expect(root.getAttribute('data-ui')).toBe(contract.ui);
    expect(root.getAttribute('data-part')).toBe('root');
    for (const name of ['list', 'rail', 'marker', 'connector', 'content', 'title', 'time']) {
      expect(root.querySelector(`[data-part="${name}"]`)).not.toBeNull();
    }
    expect(part(item(0), 'title').textContent?.trim()).toBe('Invoice created');
  });

  it('is an ordered list by default, with no keyboard of its own', () => {
    const { root, item } = setup();
    const list = root.querySelector('[data-part="list"]') as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(list.getAttribute('aria-label')).toBe('Invoice activity');
    expect(list.hasAttribute('role')).toBe(false);
    expect(item(0).tagName).toBe('LI');
    expect(item(0).hasAttribute('tabindex')).toBe(false);
  });

  it('writes every axis the stylesheet reads', () => {
    const { host, root, item, settle } = setup();
    host.placement.set('alternate');
    host.variant.set('solid');
    settle();
    expect(root.getAttribute('data-mode')).toBe('list');
    expect(root.getAttribute('data-order')).toBe('oldest-first');
    expect(root.getAttribute('data-placement')).toBe('alternate');
    expect(root.getAttribute('data-variant')).toBe('solid');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(item(0).getAttribute('data-side')).toBe('end');
    expect(item(1).getAttribute('data-side')).toBe('start');
    expect(item(1).getAttribute('data-variant')).toBe('solid');
  });

  it('draws no connector after the last event', () => {
    const { item, part } = setup();
    expect(part(item(0), 'connector')).not.toBeNull();
    expect(part(item(3), 'connector')).toBeNull();
  });

  it('marks the current event and reads it after the title', () => {
    const { item, part } = setup();
    expect(item(2).getAttribute('aria-current')).toBe('true');
    expect(item(2).getAttribute('data-current')).toBe('');
    expect(part(item(2), 'content').textContent?.replace(/\s+/g, ' ')).toContain(
      'Paid in full, current',
    );
  });

  it('derives completion and the dashed side from the declared order', () => {
    const { host, item, part, settle } = setup();
    /* A finished dot holds the family's check, marked so the sheet keeps it a dot. */
    const check = (index: number) =>
      part(item(index), 'marker')
        .querySelector('[data-ui="icon"][data-check] > svg[data-glyph]')
        ?.getAttribute('data-glyph');
    expect(item(0).hasAttribute('data-complete')).toBe(false);
    expect(part(item(0), 'marker').childElementCount).toBe(0);
    host.autoComplete.set(true);
    settle();
    expect(item(0).getAttribute('data-complete')).toBe('');
    expect(item(1).getAttribute('data-complete')).toBe('');
    expect(item(2).hasAttribute('data-complete')).toBe(false);
    expect(check(0)).toBe('check');
    expect(check(1)).toBe('check');
    expect(part(item(2), 'marker').childElementCount).toBe(0);
    expect(item(2).getAttribute('data-connector')).toBe('dashed');
    expect(item(0).hasAttribute('data-connector')).toBe(false);
    host.order.set('newest-first');
    settle();
    expect(item(3).getAttribute('data-complete')).toBe('');
    expect(item(0).hasAttribute('data-complete')).toBe(false);
    expect(item(0).getAttribute('data-connector')).toBe('dashed');
  });

  it('turns the shared ring in a loading marker', () => {
    const { item, part } = setup();
    expect(item(3).getAttribute('data-loading')).toBe('');
    expect(item(3).getAttribute('aria-busy')).toBe('true');
    expect(part(item(3), 'marker').querySelector('[data-ui="spinner"]')).not.toBeNull();
  });

  it('writes the timestamp as a time element, absolute or relative', () => {
    const { host, item, part, settle } = setup();
    const time = part(item(0), 'time');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('datetime')).toBe('2026-09-08T09:12:00Z');
    expect(time.textContent).toMatch(/8 Sept 2026, 09:12/);
    expect(time.hasAttribute('title')).toBe(false);
    host.timeFormat.set('relative');
    settle();
    expect(part(item(2), 'time').textContent?.trim()).toBe('2 hours ago');
    expect(part(item(2), 'time').getAttribute('title')).toMatch(/10:32/);
  });

  it('inherits tone from the root and lets an event override it', () => {
    const { host, item, settle } = setup();
    host.tone.set('accent');
    settle();
    expect(item(0).getAttribute('data-tone')).toBe('accent');
    expect(item(2).getAttribute('data-tone')).toBe('success');
  });

  it('shows the empty part with nothing loaded and hides it while loading', () => {
    const { host, root, settle } = setup();
    expect(root.querySelector('[data-part="empty"]')).toBeNull();
    host.events.set([]);
    settle();
    expect(root.querySelector('[data-part="empty"]')?.textContent?.trim()).toBe('No events yet');
    host.loading.set(true);
    settle();
    expect(root.querySelector('[data-part="empty"]')).toBeNull();
  });
});

describe('SlTimeline in feed mode', () => {
  it('is a feed of labelled, described, positioned articles', () => {
    const { host, root, item, settle } = setup();
    host.mode.set('feed');
    host.growing.set('button');
    settle();
    const feed = root.querySelector('[data-part="list"]') as HTMLElement;
    expect(feed.tagName).toBe('DIV');
    expect(feed.getAttribute('role')).toBe('feed');
    const first = item(0);
    expect(first.tagName).toBe('ARTICLE');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-posinset')).toBe('1');
    expect(first.getAttribute('aria-setsize')).toBe('-1');
    const labelled = (first.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(labelled).toHaveLength(2);
    expect(document.getElementById(labelled[0] as string)?.getAttribute('data-part')).toBe('title');
    expect(document.getElementById(labelled[1] as string)?.getAttribute('data-part')).toBe('time');
    expect(
      document
        .getElementById(first.getAttribute('aria-describedby') as string)
        ?.textContent?.trim(),
    ).toBe('Draft INV-4821 for Solaris Freight.');
  });

  it('states the set size it knows, or the loaded count when it will not grow', () => {
    const { host, item, settle } = setup();
    host.mode.set('feed');
    settle();
    expect(item(0).getAttribute('aria-setsize')).toBe('4');
    host.growing.set('scroll');
    host.count.set(120);
    settle();
    expect(item(0).getAttribute('aria-setsize')).toBe('120');
  });

  it('is busy while more is on its way', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    host.growing.set('button');
    host.loading.set(true);
    settle();
    expect(root.querySelector('[role="feed"]')?.getAttribute('aria-busy')).toBe('true');
    expect(root.getAttribute('data-loading')).toBe('');
    const more = root.querySelector('[data-part="more"]') as HTMLElement;
    expect(more.tagName).toBe('DIV');
    expect(more.querySelector('[data-ui="spinner"]')).not.toBeNull();
  });

  it('moves focus between articles on the page keys and finds the article from a control', () => {
    const { host, item, settle } = setup();
    host.mode.set('feed');
    settle();
    item(0).focus();
    item(0).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'PageDown' }));
    expect(document.activeElement).toBe(item(1));
    item(1).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'PageUp' }));
    expect(document.activeElement).toBe(item(0));
    const retry = item(0).querySelector('button') as HTMLElement;
    retry.focus();
    retry.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'PageDown' }));
    expect(document.activeElement).toBe(item(1));
  });

  it('asks to load more with the reason the press carries', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    host.growing.set('button');
    settle();
    const more = root.querySelector('button[data-part="more"]') as HTMLButtonElement;
    expect(more.textContent?.trim()).toBe('Load more');
    more.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(host.onLoadMore).toHaveBeenLastCalledWith(
      expect.objectContaining({ reason: 'pointer' }),
    );
    more.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(host.onLoadMore).toHaveBeenLastCalledWith(
      expect.objectContaining({ reason: 'keyboard' }),
    );
  });

  it('holds fresh events behind a pill and asks to reveal them', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    host.freshCount.set(3);
    settle();
    const fresh = root.querySelector('[data-part="fresh"]') as HTMLButtonElement;
    expect(fresh.textContent?.trim()).toBe('3 new events');
    expect(fresh.nextElementSibling?.getAttribute('role')).toBe('feed');
    fresh.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(host.onReveal).toHaveBeenCalledWith(expect.objectContaining({ reason: 'pointer' }));
    host.freshCount.set(0);
    settle();
    expect(fresh.hidden).toBe(true);
    expect(fresh.textContent?.trim()).toBe('3 new events');
    host.freshCount.set(2);
    settle();
    expect(fresh.hidden).toBe(false);
    expect(fresh.textContent?.trim()).toBe('2 new events');
  });

  it('renders no pill until there is something to hold', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    settle();
    expect(root.querySelector('[data-part="fresh"]')).toBeNull();
  });

  it('takes the reader to the first revealed event, at the top of a newest-first feed', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    host.order.set('newest-first');
    host.freshCount.set(2);
    settle();
    (root.querySelector('[data-part="fresh"]') as HTMLButtonElement).focus();
    host.freshCount.set(0);
    settle();
    expect(document.activeElement).toBe(root.querySelectorAll('[data-part="item"]')[0]);
  });

  it('takes the reader to the first revealed event after the old ones, oldest-first', () => {
    const { host, root, settle } = setup();
    host.mode.set('feed');
    host.freshCount.set(2);
    settle();
    (root.querySelector('[data-part="fresh"]') as HTMLButtonElement).focus();
    host.freshCount.set(0);
    settle();
    const items = root.querySelectorAll('[data-part="item"]');
    expect(document.activeElement).toBe(items[items.length - 2]);
  });

  it('leaves focus alone when the reader was not on the pill', () => {
    const { host, settle } = setup();
    host.mode.set('feed');
    host.freshCount.set(2);
    settle();
    host.freshCount.set(0);
    settle();
    expect(document.activeElement).toBe(document.body);
  });
});

@Component({
  imports: PARTS,
  template: `<div slTimeline label="Grouped" [level]="2" [mode]="mode()">
    @if (mode() === 'feed') {
      <div slTimelineList>
        <div
          slTimelineGroup
          label="Today"
          [collapsible]="collapsible()"
          [(open)]="open"
          (openRequest)="onOpenRequest($event)"
        >
          <div slTimelineGroupList>
            <article slTimelineItem title="Paid in full"></article>
            <article slTimelineItem title="Receipt sent"></article>
          </div>
        </div>
        <div slTimelineGroup label="Last week" [level]="4">
          <div slTimelineGroupList>
            <article slTimelineItem title="Sent to client" current></article>
          </div>
        </div>
      </div>
    } @else {
      <ol slTimelineList>
        <li
          slTimelineGroup
          label="Today"
          [collapsible]="collapsible()"
          [(open)]="open"
          (openRequest)="onOpenRequest($event)"
        >
          <ol slTimelineGroupList>
            <li slTimelineItem title="Paid in full"></li>
            <li slTimelineItem title="Receipt sent"></li>
          </ol>
        </li>
        <li slTimelineGroup label="Last week" [level]="4">
          <ol slTimelineGroupList>
            <li slTimelineItem current>
              <a slTimelineTitle href="#sent">Sent to client</a>
              <span slTimelineActor>Ana Ribeiro</span>
            </li>
          </ol>
        </li>
      </ol>
    }
  </div>`,
})
class GroupedHost {
  readonly mode = signal<'list' | 'feed'>('list');
  readonly collapsible = signal(false);
  open: boolean | undefined = undefined;
  readonly onOpenRequest = vi.fn();
}

function setupGrouped() {
  TestBed.configureTestingModule({ imports: [GroupedHost] });
  const fixture = TestBed.createComponent(GroupedHost);
  fixture.detectChanges();
  const root = fixture.nativeElement.querySelector('[data-ui="timeline"]') as HTMLElement;
  const items = () => [...root.querySelectorAll('[data-part="item"]')] as HTMLElement[];
  return {
    fixture,
    host: fixture.componentInstance,
    root,
    items,
    settle: () => fixture.detectChanges(),
  };
}

describe('SlTimelineGroup', () => {
  it('is a heading of the declared level over a nested list', () => {
    const { root } = setupGrouped();
    const headings = [...root.querySelectorAll('[data-part="group-label"]')] as HTMLElement[];
    expect(headings.map((heading) => heading.tagName)).toEqual(['H2', 'H4']);
    expect(headings[0]?.textContent?.trim()).toBe('Today');
    const group = headings[0]?.closest('[data-part="group"]') as HTMLElement;
    expect(group.tagName).toBe('LI');
    expect(group.querySelector('[data-part="group-list"]')?.tagName).toBe('OL');
    expect(group.getAttribute('data-open')).toBe('');
  });

  it('counts events across groups and draws no connector after the last of each', () => {
    const { host, items, settle } = setupGrouped();
    host.mode.set('feed');
    settle();
    expect(items().map((element) => element.getAttribute('aria-posinset'))).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(items()[2]?.getAttribute('aria-setsize')).toBe('3');
    expect(items()[0]?.querySelector('[data-part="connector"]')).not.toBeNull();
    expect(items()[1]?.querySelector('[data-part="connector"]')).toBeNull();
  });

  it('labels an article by its projected title and actor', () => {
    const { items } = setupGrouped();
    const link = items()[2]?.querySelector('a') as HTMLElement;
    expect(link.getAttribute('data-part')).toBe('title');
    expect(link.id).not.toBe('');
    expect(items()[2]?.querySelector('[data-part="actor"]')?.textContent).toBe('Ana Ribeiro');
  });

  it('folds on its trigger and keeps the events in the DOM', () => {
    const { host, root, settle } = setupGrouped();
    host.collapsible.set(true);
    settle();
    const trigger = root.querySelector('[data-part="group-trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(
      trigger
        .querySelector('[data-part="group-indicator"] > [data-ui="icon"] > svg[data-glyph]')
        ?.getAttribute('data-glyph'),
    ).toBe('chevron-down');
    expect(trigger.textContent?.replace(/\s+/g, ' ').trim()).toBe('Today, Hide events');
    const list = document.getElementById(
      trigger.getAttribute('aria-controls') as string,
    ) as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    settle();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(list.hidden).toBe(true);
    expect(list.querySelectorAll('[data-part="item"]')).toHaveLength(2);
    expect(host.open).toBe(false);
    expect(host.onOpenRequest).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'keyboard', value: false }),
    );
  });
});

describe('provideTimelineDefaults', () => {
  it('sets the family defaults once, and an explicit input still wins', () => {
    const { host, root, item, part, settle } = setup([
      provideTimelineDefaults({
        mode: 'feed',
        placement: 'start',
        timeFormat: 'relative',
        variant: 'solid',
      }),
    ]);
    host.growing.set('button');
    host.placement.set('alternate');
    host.words.set({ loadMore: 'Mais' });
    settle();
    expect(root.getAttribute('data-mode')).toBe('feed');
    expect(root.getAttribute('data-placement')).toBe('alternate');
    expect(root.getAttribute('data-variant')).toBe('solid');
    expect(part(item(2), 'time').textContent?.trim()).toBe('2 hours ago');
    expect(root.querySelector('button[data-part="more"]')?.textContent?.trim()).toBe('Mais');
  });
});

describe('language', () => {
  it('speaks the language in force, and follows a change of it in place', () => {
    const locale = signal('pt-BR');
    const { host, root, settle } = setup([
      provideSlotted({ locale, catalogs: { 'pt-BR': PT_BR } }),
    ]);
    host.freshCount.set(1);
    settle();
    const fresh = () => root.querySelector('[data-part="fresh"]')?.textContent?.trim();
    expect(fresh()).toBe('1 novo evento');
    const current = () =>
      root.querySelector('[aria-current="true"] [data-part="content"]')?.textContent;
    expect(current()?.replace(/\s+/g, ' ')).toContain('Paid in full, atual');

    locale.set('en-US');
    settle();
    expect(fresh()).toBe('1 new event');
    expect(current()?.replace(/\s+/g, ' ')).toContain('Paid in full, current');
  });
});
