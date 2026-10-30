import { afterEach, describe, expect, it, vi } from 'vitest';

import { createScrollEdges, NO_SCROLL_EDGES, scrollEdgeAttributes } from './edges';

function mount(sizes: {
  clientWidth?: number;
  scrollWidth?: number;
  scrollLeft?: number;
  clientHeight?: number;
  scrollHeight?: number;
  scrollTop?: number;
}) {
  document.body.innerHTML = '<div id="area"></div>';
  const container = document.getElementById('area') as HTMLElement;
  for (const [name, value] of Object.entries({
    clientWidth: 0,
    scrollWidth: 0,
    scrollLeft: 0,
    clientHeight: 0,
    scrollHeight: 0,
    scrollTop: 0,
    ...sizes,
  })) {
    Object.defineProperty(container, name, { value, configurable: true, writable: true });
  }
  return container;
}

function writingMode(mode: string) {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    writingMode: mode,
  } as unknown as CSSStyleDeclaration);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('createScrollEdges', () => {
  it('reads both axes from one measurement', () => {
    const container = mount({
      clientWidth: 400,
      scrollWidth: 900,
      clientHeight: 300,
      scrollHeight: 300,
    });

    const handle = createScrollEdges(container);

    expect(handle.state()).toEqual({
      block: { overflowing: false, atStart: true, atEnd: true },
      inline: { overflowing: true, atStart: true, atEnd: false },
    });

    handle.destroy();
  });

  /**
   * The block axis runs down the page in a horizontal writing mode and across
   * it in a vertical one. Measuring physically and naming logically is what
   * lets the family write one rule per edge instead of two.
   */
  it('maps the block axis to the vertical one in a horizontal writing mode', () => {
    writingMode('horizontal-tb');
    const container = mount({
      clientHeight: 200,
      scrollHeight: 800,
      scrollTop: 600,
      clientWidth: 400,
      scrollWidth: 400,
    });

    const handle = createScrollEdges(container);

    expect(handle.state().block).toEqual({ overflowing: true, atStart: false, atEnd: true });
    expect(handle.state().inline.overflowing).toBe(false);

    handle.destroy();
  });

  it('maps the block axis to the horizontal one in a vertical writing mode, and says so', () => {
    writingMode('vertical-rl');
    const container = mount({
      clientWidth: 200,
      scrollWidth: 800,
      scrollLeft: 600,
      clientHeight: 400,
      scrollHeight: 400,
    });

    const handle = createScrollEdges(container);

    expect(handle.state().block).toEqual({ overflowing: true, atStart: false, atEnd: true });
    expect(handle.state().inline.overflowing).toBe(false);
    expect(handle.sideways()).toBe(true);

    handle.destroy();
  });

  /**
   * A mirrored scroller reports zero at its own start and counts downwards, so
   * the distance from the start is the magnitude in both directions.
   */
  it('reads a mirrored inline axis by the distance rather than by the sign', () => {
    const container = mount({ clientWidth: 400, scrollWidth: 900, scrollLeft: -500 });

    const handle = createScrollEdges(container);

    expect(handle.state().inline).toEqual({ overflowing: true, atStart: false, atEnd: true });

    handle.destroy();
  });

  it('reports a change once, and only when something changed', () => {
    const container = mount({ clientWidth: 400, scrollWidth: 900 });
    const onChange = vi.fn();

    const handle = createScrollEdges(container, { onChange });
    onChange.mockClear();

    handle.refresh();
    expect(onChange).not.toHaveBeenCalled();

    container.scrollLeft = 500;
    handle.refresh();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].inline.atEnd).toBe(true);

    handle.destroy();
  });

  it('answers a scroll of the element it was given', () => {
    const container = mount({ clientHeight: 200, scrollHeight: 800 });
    const onChange = vi.fn();

    const handle = createScrollEdges(container, { onChange });
    /* The first measurement is itself a change, and is reported as one. */
    expect(onChange).toHaveBeenCalledTimes(1);
    onChange.mockClear();

    container.scrollTop = 600;
    container.dispatchEvent(new Event('scroll'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].block).toEqual({
      overflowing: true,
      atStart: false,
      atEnd: true,
    });

    handle.destroy();
  });

  it('stops answering once it is destroyed', () => {
    const container = mount({ clientHeight: 200, scrollHeight: 800 });
    const onChange = vi.fn();

    const handle = createScrollEdges(container, { onChange });
    onChange.mockClear();
    handle.destroy();

    container.scrollTop = 600;
    container.dispatchEvent(new Event('scroll'));

    expect(onChange).not.toHaveBeenCalled();
  });

  /**
   * The writing mode is read when the box is measured and not when it is
   * scrolled: `getComputedStyle` on every scroll event is a layout read per
   * frame, and a writing mode does not change during a scroll.
   */
  it('reads the writing mode on refresh rather than on every scroll', () => {
    const computed = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ writingMode: 'horizontal-tb' } as unknown as CSSStyleDeclaration);
    const container = mount({ clientHeight: 200, scrollHeight: 800 });

    const handle = createScrollEdges(container);
    const afterCreate = computed.mock.calls.length;

    container.scrollTop = 100;
    container.dispatchEvent(new Event('scroll'));
    expect(computed.mock.calls.length).toBe(afterCreate);

    handle.refresh();
    expect(computed.mock.calls.length).toBeGreaterThan(afterCreate);

    handle.destroy();
  });
});

describe('scrollEdgeAttributes', () => {
  /**
   * Content that fits shows both ends of both axes, and says so. The positive
   * form is what lets a stylesheet paint an affordance in the attribute's
   * absence rather than wrapping every selector in `:not()`.
   */
  it('shows every end of content that fits, and names no overflowing axis', () => {
    expect(scrollEdgeAttributes(NO_SCROLL_EDGES)).toEqual({
      'data-at-block-start': '',
      'data-at-block-end': '',
      'data-at-inline-start': '',
      'data-at-inline-end': '',
    });
  });

  it('names the axis that overflows', () => {
    expect(
      scrollEdgeAttributes({
        block: { overflowing: true, atStart: true, atEnd: false },
        inline: { overflowing: false, atStart: true, atEnd: true },
      })['data-overflowing'],
    ).toBe('block');

    expect(
      scrollEdgeAttributes({
        block: { overflowing: false, atStart: true, atEnd: true },
        inline: { overflowing: true, atStart: true, atEnd: false },
      })['data-overflowing'],
    ).toBe('inline');

    expect(
      scrollEdgeAttributes({
        block: { overflowing: true, atStart: true, atEnd: false },
        inline: { overflowing: true, atStart: true, atEnd: false },
      })['data-overflowing'],
    ).toBe('both');
  });

  /**
   * An edge attribute says the reader can see that end of the content, so a
   * rule that paints an affordance paints it in the absence of the attribute.
   * An axis that does not overflow shows both of its ends.
   */
  it('writes an edge only for the end that is showing', () => {
    expect(
      scrollEdgeAttributes({
        block: { overflowing: true, atStart: false, atEnd: true },
        inline: { overflowing: false, atStart: true, atEnd: true },
      }),
    ).toEqual({
      'data-overflowing': 'block',
      'data-at-block-end': '',
      'data-at-inline-start': '',
      'data-at-inline-end': '',
    });
  });
});

/**
 * A layout-less document implements neither scrolling method, so the tests
 * give the element the two it needs and read what they were asked for.
 */
function scrollable(sizes: Parameters<typeof mount>[0]) {
  const container = mount(sizes);
  const calls: { to: ScrollToOptions[]; by: ScrollToOptions[] } = { to: [], by: [] };
  Object.defineProperty(container, 'scrollTo', {
    value: (options: ScrollToOptions) => calls.to.push(options),
    configurable: true,
  });
  Object.defineProperty(container, 'scrollBy', {
    value: (options: ScrollToOptions) => calls.by.push(options),
    configurable: true,
  });
  return { container, calls };
}

describe('the imperative actions', () => {
  it('reports the position as a distance from each logical start', () => {
    const container = mount({
      clientHeight: 200,
      scrollHeight: 800,
      scrollTop: 150,
      clientWidth: 300,
      scrollWidth: 900,
      scrollLeft: -40,
    });
    const handle = createScrollEdges(container);

    expect(handle.position()).toEqual({ block: 150, inline: 40 });

    handle.destroy();
  });

  it('moves to a logical position, and signs the inline axis for a mirrored scroller', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      writingMode: 'horizontal-tb',
      direction: 'rtl',
    } as unknown as CSSStyleDeclaration);
    const { container, calls } = scrollable({ clientHeight: 200, scrollHeight: 800 });
    const handle = createScrollEdges(container);

    handle.scrollTo({ block: 120, inline: 60 });

    expect(calls.to).toEqual([expect.objectContaining({ top: 120, left: -60 })]);

    handle.destroy();
  });

  it('turns the axes round in a vertical writing mode', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      writingMode: 'vertical-rl',
      direction: 'ltr',
    } as unknown as CSSStyleDeclaration);
    const { container, calls } = scrollable({ clientWidth: 200, scrollWidth: 800 });
    const handle = createScrollEdges(container);

    handle.scrollTo({ block: 120, inline: 60 });

    /* The block axis runs right to left, so its distance is a negative left. */
    expect(calls.to).toEqual([expect.objectContaining({ left: -120, top: 60 })]);

    handle.destroy();
  });

  it('leaves an axis alone when it was not asked to move', () => {
    const { container, calls } = scrollable({ clientHeight: 200, scrollHeight: 800 });
    const handle = createScrollEdges(container);

    handle.scrollTo({ block: 500 });

    expect(calls.to).toHaveLength(1);
    expect(calls.to[0]).toMatchObject({ top: 500 });
    expect(calls.to[0]).not.toHaveProperty('left');

    handle.destroy();
  });

  it('goes to an edge by name', () => {
    const { container, calls } = scrollable({
      clientHeight: 200,
      scrollHeight: 800,
      clientWidth: 300,
      scrollWidth: 900,
    });
    const handle = createScrollEdges(container);

    handle.scrollToEdge('block-end');
    handle.scrollToEdge('inline-start');

    expect(calls.to).toEqual([
      expect.objectContaining({ top: 600 }),
      expect.objectContaining({ left: 0 }),
    ]);

    handle.destroy();
  });

  /**
   * `scrollIntoView` scrolls every ancestor too, which is the defect `tabs`
   * recorded: a list below the fold brought the whole page down on mount. The
   * container moves itself, on both axes, by the shortest distance that shows
   * the item.
   */
  it('reveals an item by moving the container alone, on both axes', () => {
    const { container, calls } = scrollable({ clientHeight: 200, clientWidth: 300 });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 200,
      right: 300,
    } as DOMRect);
    const item = document.createElement('div');
    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({
      top: 250,
      left: -20,
      bottom: 280,
      right: 40,
    } as DOMRect);
    const handle = createScrollEdges(container);

    handle.reveal(item);

    expect(calls.by).toEqual([expect.objectContaining({ top: 80, left: -20 })]);

    handle.destroy();
  });

  it('does not move for an item already in view', () => {
    const { container, calls } = scrollable({ clientHeight: 200, clientWidth: 300 });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 200,
      right: 300,
    } as DOMRect);
    const item = document.createElement('div');
    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({
      top: 20,
      left: 20,
      bottom: 60,
      right: 80,
    } as DOMRect);
    const handle = createScrollEdges(container);

    handle.reveal(item);

    expect(calls.by).toEqual([]);

    handle.destroy();
  });
});
