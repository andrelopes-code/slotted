import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createScrollSpy,
  currentTarget,
  focusTarget,
  landingLine,
  landOn,
  readStickyTop,
} from './scroll-spy';

/**
 * The observers are stubs the test drives by hand, because what is under
 * test is the rule — which target is current for a line — and not a layout
 * engine. Positions are stated on the elements.
 */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  readonly rootMargin: string;
  readonly observed: Element[] = [];
  constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = init?.rootMargin ?? '';
    FakeIntersectionObserver.instances.push(this);
  }
  observe(element: Element) {
    this.observed.push(element);
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
  fire() {
    this.callback([], this as never);
  }
}

function at(element: HTMLElement, top: number, height = 40, width = 300) {
  element.getBoundingClientRect = () =>
    ({ top, bottom: top + height, height, width, left: 0, right: width }) as DOMRect;
  return element;
}

function scene(tops: number[], { scrollerHeight = 400, scrollHeight = 2000 } = {}) {
  const scroller = document.createElement('div');
  scroller.style.overflowY = 'auto';
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: scrollerHeight });
  Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: scrollHeight });
  scroller.getBoundingClientRect = () =>
    ({ top: 100, bottom: 500, height: 400, width: 600, left: 0, right: 600 }) as DOMRect;
  const targets = tops.map((top, index) => {
    const section = document.createElement('section');
    section.id = `s${index + 1}`;
    scroller.append(section);
    return at(section, 100 + top);
  });
  document.body.append(scroller);
  return { scroller, targets };
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('currentTarget', () => {
  it('is the last target whose top is at or above the line, measured from the scroller', () => {
    const { scroller, targets } = scene([0, 300, 600]);
    expect(currentTarget(targets, scroller, 0)?.id).toBe('s1');
    expect(currentTarget(targets, scroller, 300)?.id).toBe('s2');
    expect(currentTarget(targets, scroller, 599)?.id).toBe('s2');
    expect(currentTarget(targets, scroller, 600)?.id).toBe('s3');
  });

  it('is the first target while the scroller is at its start, and none once scrolled short of it', () => {
    const { scroller, targets } = scene([120, 300]);
    expect(currentTarget(targets, scroller, 60)?.id).toBe('s1');
    scroller.scrollTop = 10;
    expect(currentTarget(targets, scroller, 60)).toBeNull();
  });

  /** A final section shorter than the scrollport never reaches the line. */
  it('is the last target once the scroller has reached its end', () => {
    const { scroller, targets } = scene([0, 300, 380], { scrollHeight: 800 });
    scroller.scrollTop = 400;
    expect(currentTarget(targets, scroller, 60)?.id).toBe('s3');
  });

  /** A heading inside a closed disclosure is not a place the reader can be. */
  it('never picks a target with no box', () => {
    const { scroller, targets } = scene([0, 50, 300]);
    at(targets[1] as HTMLElement, 150, 0, 0);
    expect(currentTarget(targets, scroller, 200)?.id).toBe('s1');
  });
});

describe('createScrollSpy', () => {
  it('reports the current target on creation, on the observer, on scroll, and only when it changes', () => {
    const { scroller, targets } = scene([0, 300, 600]);
    let line = 60;
    const onChange = vi.fn();
    const spy = createScrollSpy({ targets: () => targets, scroller, line: () => line, onChange });
    expect(onChange).toHaveBeenCalledWith('s1');
    expect(spy.current()).toBe('s1');

    line = 320;
    FakeIntersectionObserver.instances[0]?.fire();
    expect(onChange).toHaveBeenLastCalledWith('s2');

    FakeIntersectionObserver.instances[0]?.fire();
    expect(onChange).toHaveBeenCalledTimes(2);

    line = 700;
    scroller.dispatchEvent(new Event('scroll'));
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        expect(onChange).toHaveBeenLastCalledWith('s3');
        spy.destroy();
        resolve();
      });
    });
  });

  /** A press on the section before the last, landing the document at its end. */
  it('holds a pinned choice over the end-of-scroller rule until a gesture', async () => {
    const { scroller, targets } = scene([0, 300, 380], { scrollHeight: 800 });
    const onChange = vi.fn();
    const spy = createScrollSpy({ targets: () => targets, scroller, line: () => 4, onChange });
    scroller.scrollTop = 400;
    at(targets[1] as HTMLElement, 100);
    at(targets[2] as HTMLElement, 180);
    spy.pin('s2');
    expect(onChange).toHaveBeenLastCalledWith('s2');
    scroller.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(spy.current()).toBe('s2');
    scroller.dispatchEvent(new Event('wheel'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(spy.current()).toBe('s3');
    spy.destroy();
  });

  /** The press on the next link is a choice, not a scroll: it must not release the pin first. */
  it('keeps a pinned choice through a gesture inside the family', async () => {
    const { scroller, targets } = scene([0, 300, 380], { scrollHeight: 800 });
    const own = document.createElement('nav');
    const link = document.createElement('a');
    own.append(link);
    scroller.append(own);
    const spy = createScrollSpy({
      targets: () => targets,
      scroller,
      line: () => 4,
      onChange: vi.fn(),
      own,
    });
    scroller.scrollTop = 400;
    at(targets[1] as HTMLElement, 100);
    at(targets[2] as HTMLElement, 180);
    spy.pin('s2');
    link.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(spy.current()).toBe('s2');
    spy.destroy();
  });

  it('observes a one-pixel band at the line inside the scroller', () => {
    const { scroller, targets } = scene([0, 300]);
    const spy = createScrollSpy({
      targets: () => targets,
      scroller,
      line: () => 56,
      onChange: vi.fn(),
    });
    const observer = FakeIntersectionObserver.instances[0];
    expect(observer?.rootMargin).toBe('-56px 0px -343px 0px');
    expect(observer?.observed).toEqual(targets);
    spy.destroy();
  });

  it('derives the scroller from the first target and reads the line on refresh', () => {
    const { scroller, targets } = scene([0, 300]);
    const onChange = vi.fn();
    const spy = createScrollSpy({ targets: () => targets, line: () => 0, onChange });
    expect(spy.scroller()).toBe(scroller);
    scroller.scrollTop = 10;
    at(targets[0] as HTMLElement, 200);
    spy.refresh();
    expect(onChange).toHaveBeenLastCalledWith(null);
    spy.destroy();
  });
});

describe('readStickyTop', () => {
  it('reads the property page publishes on the scroller, and gives zero without one', () => {
    const scroller = document.createElement('div');
    document.body.append(scroller);
    expect(readStickyTop(scroller, document)).toBe(0);
    scroller.style.setProperty('--slotted-page-sticky-top', '96px');
    expect(readStickyTop(scroller, document)).toBe(96);
  });

  /* The spy reads the line on every scrolled frame. A computed style there
     forced a style recalc of the whole document each frame — 54ms on the docs'
     data-grid page, with a loading example's 72 skeleton loops in it — for a
     value `page` writes inline. */
  it('reads the inline value page writes, without computing a style', () => {
    const scroller = document.createElement('div');
    document.body.append(scroller);
    scroller.style.setProperty('--slotted-page-sticky-top', '64px');
    const computed = vi.spyOn(window, 'getComputedStyle');
    expect(readStickyTop(scroller, document)).toBe(64);
    expect(readStickyTop(null, document)).toBe(0);
    expect(computed).not.toHaveBeenCalled();
    computed.mockRestore();
  });
});

describe('landingLine', () => {
  it('takes a margin at least the chrome as including it, and adds a smaller one', () => {
    const section = document.createElement('section');
    document.body.append(section);
    section.style.scrollMarginBlockStart = '96px';
    expect(landingLine(section, 96)).toBe(96);
    expect(landingLine(section, 96, 8)).toBe(104);
    section.style.scrollMarginBlockStart = '24px';
    expect(landingLine(section, 96)).toBe(120);
    expect(landingLine(section, 0)).toBe(24);
  });
});

describe('landOn', () => {
  it('scrolls the scroller so the target sits at its landing line', () => {
    const { scroller, targets } = scene([300]);
    scroller.scrollTop = 50;
    scroller.scrollTo = vi.fn();
    landOn(targets[0] as HTMLElement, { scroller, chrome: 60, behavior: 'smooth' });
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 50 + 300 - 60, behavior: 'smooth' });
  });
});

describe('focusTarget', () => {
  it('focuses a target that cannot take focus by lending it a tabindex until it blurs', () => {
    const section = document.createElement('section');
    document.body.append(section);
    focusTarget(section);
    expect(document.activeElement).toBe(section);
    expect(section.getAttribute('tabindex')).toBe('-1');
    section.blur();
    expect(section.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves a tabindex the consumer wrote', () => {
    const section = document.createElement('section');
    section.setAttribute('tabindex', '0');
    document.body.append(section);
    focusTarget(section);
    section.blur();
    expect(section.getAttribute('tabindex')).toBe('0');
  });
});
