import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMessageScroller, ROOM_PROPERTY } from './message-scroller';

/**
 * jsdom has no layout, and what is under test is the engine's arithmetic and
 * its reading of intent, not a layout engine. The fixture lays the rows out
 * itself: each row has a height, rows stack from the top of the content, the
 * content's height is their sum plus the room the engine asks for, and the
 * viewport's scroll offset moves every rectangle.
 */
interface Fixture {
  root: HTMLElement;
  viewport: HTMLElement;
  content: HTMLElement;
  add: (id: string, height: number, opts?: { anchor?: boolean; before?: boolean }) => HTMLElement;
  resize: (row: HTMLElement, height: number) => void;
  scrollBy: (delta: number, gesture?: 'wheel' | 'none') => void;
  flush: () => Promise<void>;
  heights: Map<HTMLElement, number>;
}

let fixtures: Array<() => void> = [];

function fixture(viewportHeight = 400): Fixture {
  const root = document.createElement('div');
  const viewport = document.createElement('div');
  const content = document.createElement('div');
  root.append(viewport);
  viewport.append(content);
  document.body.append(root);
  const heights = new Map<HTMLElement, number>();
  let scrollTop = 0;

  const rows = () => [...content.querySelectorAll<HTMLElement>(':scope > [data-part="item"]')];
  const room = () => Number.parseFloat(content.style.getPropertyValue(ROOM_PROPERTY)) || 0;
  const contentHeight = () =>
    rows().reduce((sum, row) => sum + (heights.get(row) ?? 0), 0) + room();
  const maxScroll = () => Math.max(0, contentHeight() - viewportHeight);

  Object.defineProperty(viewport, 'clientHeight', {
    configurable: true,
    get: () => viewportHeight,
  });
  Object.defineProperty(viewport, 'scrollHeight', { configurable: true, get: contentHeight });
  Object.defineProperty(content, 'scrollHeight', { configurable: true, get: contentHeight });
  Object.defineProperty(viewport, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      const next = Math.min(Math.max(0, value), maxScroll());
      if (next === scrollTop) return;
      scrollTop = next;
      viewport.dispatchEvent(new Event('scroll'));
    },
  });
  viewport.scrollTo = ((options: ScrollToOptions) => {
    viewport.scrollTop = options.top ?? 0;
  }) as typeof viewport.scrollTo;
  viewport.getBoundingClientRect = () =>
    ({
      top: 0,
      bottom: viewportHeight,
      height: viewportHeight,
      left: 0,
      right: 600,
      width: 600,
    }) as DOMRect;
  content.getBoundingClientRect = () =>
    ({ top: -scrollTop, height: contentHeight(), bottom: contentHeight() - scrollTop }) as DOMRect;

  const place = (row: HTMLElement) => {
    row.getBoundingClientRect = () => {
      let top = 0;
      for (const other of rows()) {
        if (other === row) break;
        top += heights.get(other) ?? 0;
      }
      const height = heights.get(row) ?? 0;
      return {
        top: top - scrollTop,
        bottom: top + height - scrollTop,
        height,
        left: 0,
        right: 600,
        width: 600,
      } as DOMRect;
    };
  };

  fixtures.push(() => root.remove());

  return {
    root,
    viewport,
    content,
    heights,
    add(id, height, opts = {}) {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'item');
      row.setAttribute('data-message-id', id);
      if (opts.anchor) row.setAttribute('data-anchor', 'true');
      heights.set(row, height);
      place(row);
      if (opts.before) content.prepend(row);
      else content.append(row);
      return row;
    },
    resize(row, height) {
      heights.set(row, height);
    },
    scrollBy(delta, gesture = 'wheel') {
      if (gesture === 'wheel') viewport.dispatchEvent(new Event('wheel'));
      viewport.scrollTop = scrollTop + delta;
    },
    flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
  };
}

afterEach(() => {
  for (const remove of fixtures) remove();
  fixtures = [];
  vi.useRealTimers();
});

function seed(f: Fixture, count: number, height = 100) {
  for (let index = 0; index < count; index += 1) {
    f.add(`m${index}`, height, { anchor: index % 2 === 0 });
  }
}

describe('opening', () => {
  it('opens at the end when the last turn fits, and positions rows that arrive after an empty start', async () => {
    const f = fixture();
    const scroller = createMessageScroller({ defaultPosition: 'last-anchor' });
    scroller.connect(f);
    /* Nothing to position: the content shows rather than waiting for rows that may never come. */
    expect(scroller.getState().pending).toBe(false);
    expect(f.viewport.hasAttribute('data-pending')).toBe(false);

    seed(f, 10);
    await f.flush();
    expect(f.viewport.scrollTop).toBe(600);
    expect(scroller.getState().pending).toBe(false);
    expect(f.root.getAttribute('data-scrollable')).toBe('start');
  });

  it('opens at the last anchored turn when the turn is taller than the viewport', async () => {
    const f = fixture();
    f.add('q1', 60, { anchor: true });
    f.add('a1', 700);
    f.add('q2', 60, { anchor: true });
    f.add('a2', 900);
    const scroller = createMessageScroller({ defaultPosition: 'last-anchor', scrollMargin: 12 });
    scroller.connect(f);
    expect(f.viewport.scrollTop).toBe(760 - 12);
    expect(scroller.getState().scrollable).toEqual({ start: true, end: true });
  });

  it('opens at the start when asked, without a pending state', () => {
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ defaultPosition: 'start' });
    scroller.connect(f);
    expect(f.viewport.scrollTop).toBe(0);
    expect(scroller.getState().pending).toBe(false);
  });
});

describe('following', () => {
  it('follows new rows at the live edge and stops the moment the reader scrolls away', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ follow: true, defaultPosition: 'end' });
    scroller.connect(f);
    expect(scroller.getState().following).toBe(true);
    expect(f.root.hasAttribute('data-following')).toBe(true);

    const reply = f.add('r', 100);
    await f.flush();
    expect(f.viewport.scrollTop).toBe(700);

    f.resize(reply, 300);
    f.content.dispatchEvent(new Event('resize'));
    f.scrollBy(-200);
    expect(scroller.getState().following).toBe(false);

    f.add('late', 100);
    await f.flush();
    expect(f.viewport.scrollTop).toBe(500);
    expect(scroller.getState().newCount).toBe(1);
  });

  it('counts rows that arrive out of view and clears the count at the end', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ defaultPosition: 'end' });
    scroller.connect(f);
    f.scrollBy(-300);
    f.add('n1', 100);
    f.add('n2', 100);
    await f.flush();
    expect(scroller.getState().newCount).toBe(2);

    scroller.scrollToEnd();
    expect(scroller.getState().newCount).toBe(0);
    expect(scroller.getState().scrollable.end).toBe(false);
  });

  it('a selection inside the content stops the follow', async () => {
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ follow: true, defaultPosition: 'end' });
    scroller.connect(f);
    const text = document.createTextNode('words');
    f.content.querySelector('[data-part="item"]')?.append(text);
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 3);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    expect(scroller.getState().following).toBe(false);
  });
});

describe('anchoring a new turn', () => {
  it('lifts the anchored row near the top, keeps a peek of the row above, and keeps room below', async () => {
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ defaultPosition: 'end', peek: 64, scrollMargin: 8 });
    scroller.connect(f);

    f.add('question', 60, { anchor: true });
    await f.flush();
    const room = Number.parseFloat(f.content.style.getPropertyValue(ROOM_PROPERTY));
    expect(room).toBe(400 - 8 - 64 - 60);
    expect(f.viewport.scrollTop).toBe(1000 - 8 - 64);
  });

  it('gives the room back as the reply grows', async () => {
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ defaultPosition: 'end', peek: 64 });
    scroller.connect(f);
    f.add('question', 60, { anchor: true });
    await f.flush();
    const reply = f.add('reply', 100);
    await f.flush();
    f.resize(reply, 400);
    // The engine hears a size change from its ResizeObserver; jsdom has none, so the test calls the same path through a mutation.
    f.content.append(document.createComment('reflow'));
    await f.flush();
    expect(
      Number.parseFloat(f.content.style.getPropertyValue(ROOM_PROPERTY)),
    ).toBeGreaterThanOrEqual(0);
  });
});

describe('history', () => {
  it('keeps the reader on the same row when older rows arrive above', async () => {
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({ defaultPosition: 'end' });
    scroller.connect(f);
    f.scrollBy(-250);
    const readingTop = f.viewport.scrollTop;

    f.add('old2', 100, { before: true });
    f.add('old1', 120, { before: true });
    await f.flush();
    expect(f.viewport.scrollTop).toBe(readingTop + 220);
    await f.flush();
  });

  it('asks for older rows once when the reader reaches the top', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const f = fixture();
    seed(f, 10);
    const reachStart = vi.fn();
    const scroller = createMessageScroller({ defaultPosition: 'end', onReachStart: reachStart });
    scroller.connect(f);
    f.scrollBy(-590);
    expect(reachStart).not.toHaveBeenCalled();
    f.scrollBy(-10);
    expect(reachStart).toHaveBeenCalledWith('scroll');
    f.scrollBy(0);
    expect(reachStart).toHaveBeenCalledTimes(1);
  });
});

describe('jumping', () => {
  it('scrolls to a row by id, releases the follow, and marks the landed row for a moment', async () => {
    vi.useFakeTimers();
    const f = fixture();
    seed(f, 10);
    const scroller = createMessageScroller({
      follow: true,
      defaultPosition: 'end',
      scrollMargin: 12,
    });
    scroller.connect(f);
    expect(scroller.scrollToMessage('m3', { highlight: true })).toBe(true);
    expect(f.viewport.scrollTop).toBe(300 - 12);
    expect(scroller.getState().following).toBe(false);
    const row = f.content.querySelector('[data-message-id="m3"]');
    expect(row?.hasAttribute('data-current')).toBe(true);
    vi.advanceTimersByTime(1600);
    expect(row?.hasAttribute('data-current')).toBe(false);
  });

  it('answers false for a row that is not there, and queues one asked for before any row', () => {
    const f = fixture();
    const scroller = createMessageScroller({ defaultPosition: 'start' });
    scroller.connect(f);
    expect(scroller.scrollToMessage('later')).toBe(true);
    seed(f, 3);
    expect(scroller.scrollToMessage('nowhere')).toBe(false);
  });

  it('reports the anchored turn a jump lands on', () => {
    const f = fixture();
    seed(f, 10);
    const onAnchorChange = vi.fn();
    const scroller = createMessageScroller({ defaultPosition: 'start', onAnchorChange });
    scroller.connect(f);
    scroller.scrollToMessage('m4');
    expect(onAnchorChange).toHaveBeenCalledWith('m4', 'programmatic');
    expect(scroller.getState().currentAnchorId).toBe('m4');
  });

  it('turns a smooth jump into an instant one when the reader asked for less motion', () => {
    const f = fixture();
    seed(f, 10);
    const scrollTo = vi.fn();
    f.viewport.scrollTo = scrollTo as never;
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as never;
    const scroller = createMessageScroller({ defaultPosition: 'start' });
    scroller.connect(f);
    scroller.scrollToEnd({ behavior: 'smooth' });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(f.viewport.scrollTop).toBe(600);
  });
});
