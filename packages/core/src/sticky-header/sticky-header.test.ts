import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPACT_BELOW } from '../measure';
import {
  COLLAPSE_PROPERTY,
  CONTAINED_COLLAPSE_AT,
  createStickyHeader,
  findScrollParent,
  PRINCIPAL_SCROLL_FRACTION,
  STICKY_TOP_PROPERTY,
} from './sticky-header';
import type { StickyHeaderHandle, StickyHeaderState } from './sticky-header';

/**
 * The observers are stubs the test drives by hand, because what is under test
 * is the rule — when a scroll collapses, when a return re-opens, when a press
 * reveals — and not a layout engine. Heights are stated on the elements.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
    this.callback = callback;
    this.root = init?.root ?? null;
    this.rootMargin = init?.rootMargin ?? '';
    FakeIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean, height = 1) {
    this.callback(
      [{ isIntersecting, boundingClientRect: { height } } as IntersectionObserverEntry],
      this as never,
    );
  }
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  fire() {
    this.callback([], this as never);
  }
}

function sized(element: HTMLElement, height: number) {
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
  return element;
}

function scene({
  scrollerHeight = 400,
  contained,
  withArea = true,
}: {
  scrollerHeight?: number;
  /** Given the page body, returns what the header is told is contained. */
  contained?: (body: HTMLElement) => HTMLElement | null;
  /** Whether the header has a header area: a header of a title alone has none. */
  withArea?: boolean;
} = {}) {
  const scroller = document.createElement('div');
  scroller.style.overflowY = 'auto';
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: scrollerHeight });
  const root = document.createElement('header');
  const title = sized(document.createElement('div'), 60);
  const area = sized(document.createElement('div'), 120);
  const tabs = sized(document.createElement('div'), 40);
  root.append(title, area, tabs);
  /* A filled page: the body under the header holds a list that scrolls on its own. */
  const body = document.createElement('div');
  const list = document.createElement('div');
  body.append(list);
  scroller.append(root, body);
  document.body.append(scroller);

  const state: StickyHeaderState = { expanded: true, pinned: false, collapse: 'scroll' };
  const onScrolled = vi.fn();
  const onRevealed = vi.fn();
  const onStuck = vi.fn();
  const onScrollRequest = vi.fn((expanded: boolean) => {
    state.expanded = expanded;
    handle.expandedChanged(expanded, 'scroll');
  });
  const handle: StickyHeaderHandle = createStickyHeader({
    root,
    area: () => (withArea ? area : null),
    chrome: () => [title, tabs],
    state: () => state,
    onScrolled,
    onRevealed,
    onScrollRequest,
    onStuck,
    ...(contained === undefined ? {} : { contained: () => contained(body) }),
  });
  /* The size observer's first report, after layout: the engine's first measurement. */
  FakeResizeObserver.instances.at(-1)?.fire();
  const io = FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver;
  return {
    area,
    handle,
    io,
    list,
    onRevealed,
    onScrollRequest,
    onScrolled,
    onStuck,
    root,
    scroller,
    state,
    title,
  };
}

describe('createStickyHeader', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    FakeIntersectionObserver.instances = [];
    FakeResizeObserver.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  it('finds the element the header scrolls inside', () => {
    const { root, scroller, handle } = scene();
    expect(findScrollParent(root)).toBe(scroller);
    expect(handle.scroller()).toBe(scroller);
    handle.destroy();
  });

  /**
   * Stuck, the root stops at minus the area's height and the area's bottom
   * edge lands exactly under the title, inside the scrollport and covered. In
   * Chrome an observer over the whole scrollport kept reporting it in, and the
   * header never snapped in Storybook while every fake said it did. The
   * observer's top edge therefore moves down by what stands above the area.
   */
  it('observes the area under a top margin the size of what stands above it', () => {
    const { area, io, root, handle } = scene();
    /* jsdom lays nothing out: the root and the area share a top, so the margin is the one pixel. */
    expect(io.rootMargin).toBe('-1px 0px 0px 0px');

    let top = 60;
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);
    vi.spyOn(area, 'getBoundingClientRect').mockImplementation(() => ({ top }) as DOMRect);
    handle.refresh();
    expect((FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver).rootMargin).toBe(
      '-61px 0px 0px 0px',
    );

    /* The title wrapped to a second line: the size observer fires, the margin follows. */
    top = 84;
    const built = FakeIntersectionObserver.instances.length;
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).callback([], {} as ResizeObserver);
    expect(FakeIntersectionObserver.instances.length).toBe(built + 1);
    expect((FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver).rootMargin).toBe(
      '-85px 0px 0px 0px',
    );
    handle.destroy();
  });

  it('publishes the collapse height on the root and the chrome height on the scroller', () => {
    const { handle, root, scroller } = scene();
    expect(root.style.getPropertyValue(COLLAPSE_PROPERTY)).toBe('120px');
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('100px');
    handle.destroy();
    expect(root.style.getPropertyValue(COLLAPSE_PROPERTY)).toBe('');
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('');
  });

  it('observes the area against the scroller rather than the viewport', () => {
    const { io, scroller, handle } = scene();
    expect(io.root).toBe(scroller);
    handle.destroy();
  });

  /** The scroll passes the area: the fact flips and expanded is asked to move. */
  it('collapses with the reason scroll when the area leaves, and re-opens when it returns', () => {
    const { handle, io, onScrollRequest, onScrolled, scroller, state } = scene();

    /* The reader has scrolled: only then can the area have left. */
    scroller.scrollTop = 300;
    io.report(false);
    expect(onScrolled).toHaveBeenLastCalledWith(true);
    expect(onScrollRequest).toHaveBeenLastCalledWith(false);
    expect(state.expanded).toBe(false);

    io.report(true);
    expect(onScrolled).toHaveBeenLastCalledWith(false);
    expect(onScrollRequest).toHaveBeenLastCalledWith(true);
    expect(state.expanded).toBe(true);
    handle.destroy();
  });

  /** Collapsed by the control, a return scroll does not re-open the area. */
  it('leaves an area the control collapsed alone when the scroll returns', () => {
    const { handle, io, onScrollRequest, state } = scene();
    state.expanded = false;
    handle.expandedChanged(false, 'control');

    io.report(false);
    io.report(true);
    expect(onScrollRequest).not.toHaveBeenCalled();
    handle.destroy();
  });

  /** Expanding by the control while scrolled past reveals in place. */
  it('reveals the area in place when the control opens it while the scroll has passed it', () => {
    const { handle, io, onRevealed, onScrolled, scroller, state } = scene();
    /* The reader has scrolled: only then can the area have left. */
    scroller.scrollTop = 300;
    io.report(false);
    onScrolled.mockClear();

    state.expanded = true;
    handle.expandedChanged(true, 'control');
    expect(onRevealed).toHaveBeenLastCalledWith(true);
    expect(handle.revealed()).toBe(true);

    /* The root at 0 brings the area back into view; the report is ignored. */
    io.report(true);
    expect(onScrolled).not.toHaveBeenCalled();
    expect(handle.scrolled()).toBe(true);
    handle.destroy();
  });

  /** A reveal ends on the next scroll, with the reason scroll. */
  it('ends a reveal on the next scroll of more than two pixels', () => {
    const { handle, io, onRevealed, onScrollRequest, scroller, state } = scene();
    /* The reader has scrolled: only then can the area have left. */
    scroller.scrollTop = 300;
    io.report(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    onScrollRequest.mockClear();

    scroller.scrollTop = 301;
    scroller.dispatchEvent(new Event('scroll'));
    expect(onScrollRequest).not.toHaveBeenCalled();

    scroller.scrollTop = 340;
    scroller.dispatchEvent(new Event('scroll'));
    expect(onRevealed).toHaveBeenLastCalledWith(false);
    expect(onScrollRequest).toHaveBeenLastCalledWith(false);
    handle.destroy();
  });

  /** Pinned, the chrome that stays includes the area. */
  it('counts the area into the chrome while pinned or revealed', () => {
    const { handle, scroller, state } = scene();
    state.pinned = true;
    handle.pinnedChanged(true);
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('220px');
    state.pinned = false;
    handle.pinnedChanged(false);
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('100px');
    handle.destroy();
  });

  /** A header taller than six tenths of the scrollport goes to the top instead of revealing. */
  it('scrolls to the top rather than revealing an area taller than the scrollport allows', () => {
    const { area, handle, io, onRevealed, scroller, state } = scene({ scrollerHeight: 150 });
    sized(area, 120);
    scroller.scrollTo = vi.fn();
    /* The reader has scrolled: only then can the area have left. */
    scroller.scrollTop = 300;
    io.report(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect(onRevealed).not.toHaveBeenCalled();
    handle.destroy();
  });

  /** Under manual collapse no scroll ever moves expanded. */
  /**
   * Scrolled past, revealed by the control, collapsed by the control: the root
   * travels back to its offset and the observer sees the area in on the way.
   * Honoured, that report emptied the area, moved the scroll and started a
   * loop of expand and collapse. It is ignored until the area is out again.
   */
  it('ignores the area coming into view while the root travels back after a reveal', () => {
    const { handle, io, onScrollRequest, onScrolled, scroller, state } = scene();
    /* The reader has scrolled: only then can the area have left. */
    scroller.scrollTop = 300;
    io.report(false);
    expect(state.expanded).toBe(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    expect(handle.revealed()).toBe(true);

    state.expanded = false;
    handle.expandedChanged(false, 'control');
    expect(handle.revealed()).toBe(false);
    onScrolled.mockClear();
    onScrollRequest.mockClear();

    io.report(true);
    expect(onScrolled).not.toHaveBeenCalled();
    expect(onScrollRequest).not.toHaveBeenCalled();
    expect(handle.scrolled()).toBe(true);

    /* Out again: the travel is over and the fact is reported as before. */
    io.report(false);
    io.report(true);
    expect(onScrolled).toHaveBeenLastCalledWith(false);
    handle.destroy();
  });

  it('lets a scroll up through the travel decide again', () => {
    const { handle, io, scroller, state } = scene();
    scroller.scrollTop = 400;
    scroller.dispatchEvent(new Event('scroll'));
    io.report(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    state.expanded = false;
    handle.expandedChanged(false, 'control');
    const built = FakeIntersectionObserver.instances.length;

    scroller.scrollTop = 100;
    scroller.dispatchEvent(new Event('scroll'));
    expect(FakeIntersectionObserver.instances.length).toBe(built + 1);
    handle.destroy();
  });

  /**
   * Folded to nothing by the control, the area is a zero-height box on the
   * observer's edge, and a browser reports it out; honoured, that set
   * `scrolled` at the top of the page and opened the fold again.
   */
  it('ignores a report on an area with no height, and an "out" while nothing is scrolled', () => {
    const { handle, io, onScrolled, scroller } = scene();
    io.report(false, 0);
    expect(onScrolled).not.toHaveBeenCalled();
    scroller.scrollTop = 0;
    io.report(false);
    expect(onScrolled).not.toHaveBeenCalled();
    scroller.scrollTop = 300;
    io.report(false);
    expect(onScrolled).toHaveBeenLastCalledWith(true);
    expect(handle.scrolled()).toBe(true);
    handle.destroy();
  });

  /**
   * The observer is rebuilt when the title changes height and repeats the
   * fact it knew. Between the control setting `expanded` and the binding
   * telling the engine, that repeat asked the area to close again in Angular.
   */
  it('asks to collapse on the crossing only, never on a repeated out report', () => {
    const { handle, io, onScrollRequest, scroller, state } = scene();
    scroller.scrollTop = 300;
    io.report(false);
    expect(onScrollRequest).toHaveBeenCalledTimes(1);
    /* The control set it, the binding has not told the engine yet. */
    state.expanded = true;
    io.report(false);
    expect(onScrollRequest).toHaveBeenCalledTimes(1);
    handle.expandedChanged(true, 'control');
    expect(handle.revealed()).toBe(true);
    handle.destroy();
  });

  /**
   * Scroll anchoring moves the position by the few pixels the title grew as
   * the reveal began; that is not the reader scrolling, and the reveal holds.
   * A real scroll of more than that, or any scroll later on, ends it.
   */
  it('holds a reveal through the small scroll that anchoring makes as the title grows', () => {
    vi.useFakeTimers();
    try {
      const { handle, io, onRevealed, scroller, state } = scene();
      scroller.scrollTop = 300;
      io.report(false);
      state.expanded = true;
      handle.expandedChanged(true, 'control');
      expect(handle.revealed()).toBe(true);

      scroller.scrollTop = 305;
      scroller.dispatchEvent(new Event('scroll'));
      expect(handle.revealed()).toBe(true);

      scroller.scrollTop = 360;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onRevealed).toHaveBeenLastCalledWith(false);
      handle.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * The control folded the area while the page was scrolled and the reader
   * comes back up: the area folds here rather than re-opening, and as the fold
   * lands the scroll moves up by what the flow lost, before paint, so nothing
   * on screen moves. Before this the fold animated, the content shortened,
   * the observer reported again, and the header flickered all the way up.
   */
  it('folds instantly and compensates the scroll when a control-folded area comes back into view', () => {
    const { area, handle, io, onScrolled, onScrollRequest, scroller, state } = scene();
    scroller.scrollTop = 300;
    io.report(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    state.expanded = false;
    handle.expandedChanged(false, 'control');
    onScrollRequest.mockClear();

    scroller.scrollTop = 150;
    scroller.dispatchEvent(new Event('scroll'));
    (FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver).report(true);
    expect(onScrolled).toHaveBeenLastCalledWith(false);
    expect(onScrollRequest).not.toHaveBeenCalled();
    expect(area.style.transitionProperty).toBe('none');

    /* The binding folded the track: the size observer sees the area at nothing. */
    sized(area, 0);
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).callback([], {} as ResizeObserver);
    expect(scroller.scrollTop).toBe(30);
    expect(area.style.transitionProperty).toBe('');
    handle.destroy();
  });

  it('opens a folded header in place while it is stuck', () => {
    const { handle, onRevealed, root, scroller, state } = scene();
    state.expanded = false;
    handle.expandedChanged(false, 'control');
    scroller.scrollTop = 300;
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);
    vi.spyOn(scroller, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    expect(onRevealed).toHaveBeenLastCalledWith(true);
    handle.destroy();
  });

  /**
   * Scrolling up keeps a reveal; once the root leaves the scroller's edge the
   * area is where it would be anyway and the reveal ends without a move.
   */
  it('keeps a reveal on a scroll up, and lets it go once the root is off the edge', () => {
    const { handle, io, onRevealed, onScrolled, root, scroller, state } = scene();
    scroller.scrollTop = 300;
    io.report(false);
    state.expanded = true;
    handle.expandedChanged(true, 'control');
    /* Stuck: the root sits on the scroller's edge while the reveal holds. */
    const rect = vi
      .spyOn(root, 'getBoundingClientRect')
      .mockImplementation(() => ({ top: 0 }) as DOMRect);
    vi.spyOn(scroller, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect);

    scroller.scrollTop = 200;
    scroller.dispatchEvent(new Event('scroll'));
    expect(handle.revealed()).toBe(true);

    /* Above its natural top the root leaves the edge. */
    rect.mockImplementation(() => ({ top: 40 }) as DOMRect);
    scroller.scrollTop = 100;
    scroller.dispatchEvent(new Event('scroll'));
    expect(onRevealed).toHaveBeenLastCalledWith(false);
    expect(onScrolled).toHaveBeenLastCalledWith(false);
    expect(state.expanded).toBe(true);
    handle.destroy();
  });

  /**
   * Too much of the screen to hold: on a phone a pinned header took nearly
   * the whole height. The fact is written, and a held header is let go.
   */
  it('says the header is tall when it would take most of the scrollport, and lets a held one go', () => {
    const onTall = vi.fn();
    const onPinRequest = vi.fn();
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 400 });
    const root = document.createElement('header');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const title = sized(document.createElement('div'), 80);
    const area = sized(document.createElement('div'), 120);
    root.append(title, area);
    scroller.append(root);
    document.body.append(scroller);
    const state: StickyHeaderState = { expanded: true, pinned: true, collapse: 'scroll' };
    const handle = createStickyHeader({
      root,
      area: () => area,
      chrome: () => [title],
      state: () => state,
      onScrolled: vi.fn(),
      onRevealed: vi.fn(),
      onScrollRequest: vi.fn(),
      onTall,
      onPinRequest,
    });
    /* 200 of 400: held. */
    expect(handle.tall()).toBe(false);
    expect(onPinRequest).not.toHaveBeenCalled();

    /* The area grows past six tenths of the scrollport. */
    sized(area, 200);
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).callback([], {} as ResizeObserver);
    expect(onTall).toHaveBeenLastCalledWith(true);
    expect(onPinRequest).toHaveBeenLastCalledWith(false);

    /* A phone's width says the same whatever the height. */
    state.pinned = false;
    sized(area, 40);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).callback([], {} as ResizeObserver);
    expect(handle.tall()).toBe(true);
    handle.destroy();
  });

  /**
   * Started inside the binding's mount, the engine read the boxes of a page
   * just committed and forced a synchronous layout of it. The first
   * measurement waits for the size observer's first report.
   */
  it('reads no box before the size observer first reports', () => {
    const rects = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    const heights = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get');
    const offsets = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get');
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    const root = document.createElement('header');
    const area = document.createElement('div');
    root.append(area);
    scroller.append(root);
    document.body.append(scroller);
    const state: StickyHeaderState = { expanded: true, pinned: false, collapse: 'scroll' };
    const handle = createStickyHeader({
      root,
      area: () => area,
      chrome: () => [],
      state: () => state,
      onScrolled: vi.fn(),
      onRevealed: vi.fn(),
      onScrollRequest: vi.fn(),
    });
    handle.refresh();
    handle.expandedChanged(true, 'programmatic');
    expect(rects).not.toHaveBeenCalled();
    expect(heights).not.toHaveBeenCalled();
    expect(offsets).not.toHaveBeenCalled();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);

    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('0px');
    handle.destroy();
    rects.mockRestore();
    heights.mockRestore();
    offsets.mockRestore();
  });

  it('attaches no intersection observer under manual collapse', () => {
    FakeIntersectionObserver.instances = [];
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    const root = document.createElement('header');
    const area = sized(document.createElement('div'), 80);
    root.append(area);
    scroller.append(root);
    document.body.append(scroller);
    const handle = createStickyHeader({
      root,
      area: () => area,
      chrome: () => [],
      state: () => ({ expanded: true, pinned: false, collapse: 'manual' }),
      onScrolled: vi.fn(),
      onRevealed: vi.fn(),
      onScrollRequest: vi.fn(),
    });
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('80px');
    handle.destroy();
  });

  it('republishes when a chrome part changes height', () => {
    const { handle, scroller, title } = scene();
    sized(title, 90);
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
    expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('130px');
    handle.destroy();
  });
  it('holds the header from the compact size class up, and lets it go below it', () => {
    const onTall = vi.fn();
    const scroller = document.createElement('div');
    scroller.style.overflowY = 'auto';
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 800 });
    const root = document.createElement('header');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: COMPACT_BELOW });
    const area = sized(document.createElement('div'), 40);
    root.append(area);
    scroller.append(root);
    document.body.append(scroller);
    const handle = createStickyHeader({
      root,
      area: () => area,
      chrome: () => [],
      state: () => ({ expanded: true, pinned: false, collapse: 'scroll' }),
      onScrolled: vi.fn(),
      onRevealed: vi.fn(),
      onScrollRequest: vi.fn(),
      onTall,
    });
    expect(handle.tall()).toBe(false);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: COMPACT_BELOW - 1 });
    (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
    expect(onTall).toHaveBeenLastCalledWith(true);
    handle.destroy();
  });

  describe('stuck', () => {
    function at(element: HTMLElement, top: number) {
      vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => ({ top }) as DOMRect);
    }

    /**
     * Content passes under the chrome once the title area holds at its sticky
     * offset with the scroll past its rest position: what a variant with
     * no ground of its own reads to paint one.
     */
    it('reports the title area held at the top, and lets it go back at rest', () => {
      const { handle, onStuck, scroller, title } = scene();
      at(scroller, 0);
      at(title, 0);
      scroller.scrollTop = 50;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).toHaveBeenLastCalledWith(true);

      scroller.scrollTop = 0;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).toHaveBeenLastCalledWith(false);
      handle.destroy();
    });

    it('does not report a title area that has not reached its offset yet', () => {
      const { handle, onStuck, root, scroller, title } = scene();
      at(scroller, 0);
      at(root, 80);
      at(title, 80);
      scroller.scrollTop = 50;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).not.toHaveBeenCalledWith(true);
      handle.destroy();
    });

    /** A floating header holds its title area an inset below the scroller's edge. */
    it('measures the hold against the title area’s own offset, and counts it into the sticky top', () => {
      const { handle, onStuck, root, scroller, title } = scene();
      title.style.top = '12px';
      handle.refresh();
      /* The root is still travelling: only the title area can be held. */
      at(root, 30);
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('112px');

      at(scroller, 0);
      at(title, 0);
      scroller.scrollTop = 50;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).not.toHaveBeenCalledWith(true);

      at(title, 12);
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).toHaveBeenLastCalledWith(true);
      handle.destroy();
    });

    /**
     * A floating header takes its inset once stuck: flush with the edge at
     * rest, it would otherwise sit an inset over the content under it. The
     * offset moves with the fact, so the sticky top is published again.
     */
    it('publishes the sticky top again when the fact moves the title area’s offset', () => {
      const { handle, onStuck, scroller, title } = scene();
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('100px');
      at(scroller, 0);
      /* Held, the title area stands at whatever offset it is given. */
      vi.spyOn(title, 'getBoundingClientRect').mockImplementation(
        () => ({ top: Number.parseFloat(title.style.top) || 0 }) as DOMRect,
      );
      onStuck.mockImplementation((stuck: boolean) => {
        title.style.top = stuck ? '12px' : '0px';
      });
      scroller.scrollTop = 50;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).toHaveBeenLastCalledWith(true);
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('112px');
      handle.destroy();
    });

    /**
     * A floating root has a border all round: stuck at its offset, its title
     * area stands a border below it, short of its own offset by a pixel.
     */
    it('reports the root held at its offset when the title area stands a border below', () => {
      const { handle, onStuck, root, scroller, title } = scene();
      at(scroller, 0);
      at(root, 0);
      at(title, 1);
      scroller.scrollTop = 200;
      scroller.dispatchEvent(new Event('scroll'));
      expect(onStuck).toHaveBeenLastCalledWith(true);
      handle.destroy();
    });

    /** The inset is reached through a transition: its end publishes the sticky top again. */
    it('publishes the sticky top again when a transition in the root ends', () => {
      const { handle, scroller, title } = scene();
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('100px');
      title.style.top = '8px';
      title.dispatchEvent(new Event('transitionend', { bubbles: true }));
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('108px');
      handle.destroy();
    });

    it('reports the root stuck at its own offset, an inset below the edge', () => {
      const { handle, root, scroller } = scene();
      root.style.top = '12px';
      at(scroller, 0);
      at(root, 12);
      scroller.scrollTop = 50;
      expect(handle.stuck()).toBe(true);
      at(root, 0);
      expect(handle.stuck()).toBe(false);
      handle.destroy();
    });
  });

  describe('contained', () => {
    function scrollTo(element: HTMLElement, top: number) {
      element.scrollTop = top;
      element.dispatchEvent(new Event('scroll'));
    }

    /**
     * A filled page does not scroll: its list does. The header's own scroller
     * never moves, so the list moving down past a few pixels is what snaps the
     * area shut, and the list back at its top is what opens it.
     */
    it('collapses when a list inside scrolls down past the threshold, and re-opens at its top', () => {
      const { handle, list, onScrollRequest, state } = scene({ contained: (body) => body });

      scrollTo(list, CONTAINED_COLLAPSE_AT);
      expect(onScrollRequest).not.toHaveBeenCalled();

      scrollTo(list, 40);
      expect(onScrollRequest).toHaveBeenLastCalledWith(false);
      expect(state.expanded).toBe(false);

      /* Up, but not at the top yet: the area stays shut. */
      scrollTo(list, 20);
      expect(onScrollRequest).toHaveBeenCalledTimes(1);

      scrollTo(list, 0);
      expect(onScrollRequest).toHaveBeenLastCalledWith(true);
      expect(state.expanded).toBe(true);
      handle.destroy();
    });

    it('ignores a scroll outside the contained element, and the header’s own scroller', () => {
      const outside = document.createElement('div');
      document.body.append(outside);
      const { handle, onScrollRequest, scroller } = scene({ contained: () => document.body });

      scrollTo(scroller, 300);
      expect(onScrollRequest).not.toHaveBeenCalled();
      handle.destroy();

      const other = scene({ contained: (body) => body });
      scrollTo(outside, 300);
      expect(other.onScrollRequest).not.toHaveBeenCalled();
      other.handle.destroy();
    });

    /**
     * A grid scrolled sideways fires `scroll` with its `scrollTop` where it was,
     * often at 0. Read as a return to the top, that re-opened the area the
     * reader had just scrolled shut.
     */
    it('ignores a scroll that leaves the block position where it was', () => {
      const { handle, list, onScrollRequest } = scene({ contained: (body) => body });
      const grid = document.createElement('div');
      list.after(grid);

      scrollTo(list, 40);
      expect(onScrollRequest).toHaveBeenCalledTimes(1);

      list.dispatchEvent(new Event('scroll'));
      grid.scrollLeft = 120;
      grid.dispatchEvent(new Event('scroll'));
      expect(onScrollRequest).toHaveBeenCalledTimes(1);
      handle.destroy();
    });

    it('never re-opens an area the control collapsed, nor one it re-opened and collapsed again', () => {
      const { handle, list, onScrollRequest, state } = scene({ contained: (body) => body });
      state.expanded = false;
      handle.expandedChanged(false, 'control');
      scrollTo(list, 40);
      scrollTo(list, 0);
      expect(onScrollRequest).not.toHaveBeenCalled();

      state.expanded = true;
      handle.expandedChanged(true, 'control');
      scrollTo(list, 40);
      expect(onScrollRequest).toHaveBeenLastCalledWith(false);
      state.expanded = true;
      handle.expandedChanged(true, 'control');
      state.expanded = false;
      handle.expandedChanged(false, 'programmatic');
      onScrollRequest.mockClear();
      scrollTo(list, 0);
      expect(onScrollRequest).not.toHaveBeenCalled();
      handle.destroy();
    });

    it('leaves a pinned header, and one under manual collapse, alone', () => {
      const pinned = scene({ contained: (body) => body });
      pinned.state.pinned = true;
      scrollTo(pinned.list, 40);
      expect(pinned.onScrollRequest).not.toHaveBeenCalled();
      pinned.handle.destroy();
      document.body.innerHTML = '';

      const manual = scene({ contained: (body) => body });
      manual.state.collapse = 'manual';
      scrollTo(manual.list, 40);
      expect(manual.onScrollRequest).not.toHaveBeenCalled();
      manual.handle.destroy();
    });

    it('stops listening once destroyed', () => {
      const { handle, list, onScrollRequest } = scene({ contained: (body) => body });
      handle.destroy();
      scrollTo(list, 40);
      expect(onScrollRequest).not.toHaveBeenCalled();
    });

    function clientHeight(element: HTMLElement, value: number) {
      Object.defineProperty(element, 'clientHeight', { configurable: true, value });
    }

    /**
     * Only the body's principal scroller moves the header. A note typed into
     * a textarea, or a short scroll area beside the list, scrolling down past
     * sixteen pixels snapped the area shut while the list the reader was
     * reading had not moved.
     */
    it('ignores a form control scrolling, however tall it is', () => {
      const { handle, list, onScrollRequest } = scene({ contained: (body) => body });
      const body = list.parentElement as HTMLElement;
      clientHeight(body, 500);
      for (const tag of ['textarea', 'input', 'select'] as const) {
        const control = document.createElement(tag);
        clientHeight(control, 400);
        body.append(control);
        scrollTo(control, 40);
      }
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', '');
      clientHeight(editable, 400);
      body.append(editable);
      scrollTo(editable, 40);
      expect(onScrollRequest).not.toHaveBeenCalled();
      handle.destroy();
    });

    it('ignores a scroller shorter than half the contained element, and follows one that is not', () => {
      const { handle, list, onScrollRequest, state } = scene({ contained: (body) => body });
      const body = list.parentElement as HTMLElement;
      clientHeight(body, 500);
      const aside = document.createElement('div');
      clientHeight(aside, 500 * PRINCIPAL_SCROLL_FRACTION - 1);
      body.append(aside);
      scrollTo(aside, 40);
      expect(onScrollRequest).not.toHaveBeenCalled();

      /* The rows of a grid: half the body or more. */
      clientHeight(list, 500 * PRINCIPAL_SCROLL_FRACTION);
      scrollTo(list, 40);
      expect(onScrollRequest).toHaveBeenLastCalledWith(false);
      expect(state.expanded).toBe(false);

      /* The short one back at its top does not re-open what the list shut. */
      scrollTo(aside, 0);
      expect(onScrollRequest).toHaveBeenCalledTimes(1);
      scrollTo(list, 0);
      expect(onScrollRequest).toHaveBeenLastCalledWith(true);
      handle.destroy();
    });

    /**
     * Collapsed, a header of a title alone hides nothing: the title only steps
     * down a size and every pane under it moves. In a split inbox that was
     * each scroll of the queue, the thread or the context resizing the panes.
     */
    it('leaves a header with no header area expanded, whatever the list scrolls', () => {
      const { handle, list, onScrollRequest, state } = scene({
        contained: (body) => body,
        withArea: false,
      });
      scrollTo(list, 400);
      expect(onScrollRequest).not.toHaveBeenCalled();
      expect(state.expanded).toBe(true);
      handle.destroy();
    });
  });

  /**
   * Below the compact size class nothing sticks: the root is in the flow and
   * scrolls away with the page, so there is nothing to collapse, reveal or
   * stop under. On a phone a record's header and tabs took 40 per cent of
   * the screen for the whole scroll with nothing to condense.
   */
  describe('compact', () => {
    function compactScene(width: number, contained = false) {
      const built = scene(contained ? { contained: (body) => body } : {});
      const observersBefore = FakeIntersectionObserver.instances.length;
      const onCompact = vi.fn();
      built.handle.destroy();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      const onScrollRequest = vi.fn((expanded: boolean) => {
        built.state.expanded = expanded;
        handle.expandedChanged(expanded, 'scroll');
      });
      const onRevealed = vi.fn();
      const handle = createStickyHeader({
        root: built.root,
        area: () => built.area,
        chrome: () => [built.title],
        state: () => built.state,
        onScrolled: vi.fn(),
        onRevealed,
        onScrollRequest,
        onCompact,
        ...(contained ? { contained: () => built.list.parentElement as HTMLElement } : {}),
      });
      const resize = () => (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
      resize();
      const observers = () => FakeIntersectionObserver.instances.length - observersBefore;
      return { ...built, handle, observers, onCompact, onRevealed, onScrollRequest, resize };
    }

    it('says so below the width, observes no scroll and leaves no sticky offset', () => {
      const { handle, observers, onCompact, scroller } = compactScene(COMPACT_BELOW - 1);
      expect(handle.compact()).toBe(true);
      expect(onCompact).toHaveBeenLastCalledWith(true);
      expect(observers()).toBe(0);
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('0px');
      handle.destroy();
    });

    /**
     * The class is a phone's. A detail panel scrolling itself as a pane beside
     * a list is narrower than it in a frame of 1 440 pixels, and its header
     * went out of `sticky` and scrolled away with the record.
     */
    it('is not compact for a narrow header in a wide frame', () => {
      const { handle, onCompact, root } = compactScene(1440);
      Object.defineProperty(root, 'clientWidth', { configurable: true, value: 420 });
      (FakeResizeObserver.instances.at(-1) as FakeResizeObserver).fire();
      expect(handle.compact()).toBe(false);
      expect(onCompact).not.toHaveBeenCalledWith(true);
      handle.destroy();
    });

    it('is not compact from the width up', () => {
      const { handle, onCompact, scroller } = compactScene(COMPACT_BELOW);
      expect(handle.compact()).toBe(false);
      expect(onCompact).not.toHaveBeenCalled();
      expect(scroller.style.getPropertyValue(STICKY_TOP_PROPERTY)).toBe('60px');
      handle.destroy();
    });

    it('ignores a contained scroll, and opens in the flow rather than revealing', () => {
      const { handle, list, onRevealed, onScrollRequest, scroller, state } = compactScene(
        390,
        true,
      );
      list.scrollTop = 40;
      list.dispatchEvent(new Event('scroll'));
      expect(onScrollRequest).not.toHaveBeenCalled();

      scroller.scrollTop = 300;
      state.expanded = false;
      handle.expandedChanged(false, 'control');
      state.expanded = true;
      handle.expandedChanged(true, 'control');
      expect(onRevealed).not.toHaveBeenCalled();
      expect(handle.revealed()).toBe(false);
      handle.destroy();
    });

    it('opens an area the scroll shut when the header turns compact, and observes again above it', () => {
      const width = { value: 1024 };
      const { handle, onCompact, onScrollRequest, resize, scroller, state } = compactScene(1024);
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width.value });

      scroller.scrollTop = 300;
      (FakeIntersectionObserver.instances.at(-1) as FakeIntersectionObserver).report(false);
      expect(state.expanded).toBe(false);

      width.value = 390;
      resize();
      expect(onCompact).toHaveBeenLastCalledWith(true);
      expect(onScrollRequest).toHaveBeenLastCalledWith(true);
      expect(state.expanded).toBe(true);
      expect(handle.scrolled()).toBe(false);

      const built = FakeIntersectionObserver.instances.length;
      width.value = 1024;
      resize();
      expect(onCompact).toHaveBeenLastCalledWith(false);
      expect(FakeIntersectionObserver.instances.length).toBe(built + 1);
      handle.destroy();
    });

    it('leaves an area the control shut as it is when the header turns compact', () => {
      const width = { value: 1024 };
      const { handle, onScrollRequest, resize, state } = compactScene(1024);
      Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width.value });
      state.expanded = false;
      handle.expandedChanged(false, 'control');
      width.value = 390;
      resize();
      expect(onScrollRequest).not.toHaveBeenCalled();
      expect(state.expanded).toBe(false);
      handle.destroy();
    });
  });
});
