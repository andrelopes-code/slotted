import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createScrollAffordance, NOT_OVERFLOWING, overflowState } from './overflow';

describe('overflowState', () => {
  it('reports a row that fits as having nothing to reach', () => {
    expect(overflowState({ clientSize: 400, scrollSize: 400, scrollStart: 0 })).toEqual(
      NOT_OVERFLOWING,
    );
  });

  it('reports both ends of a row that has not been scrolled', () => {
    expect(overflowState({ clientSize: 400, scrollSize: 900, scrollStart: 0 })).toEqual({
      overflowing: true,
      atStart: true,
      atEnd: false,
    });
  });

  it('reports the far end once the row has been scrolled to it', () => {
    expect(overflowState({ clientSize: 400, scrollSize: 900, scrollStart: 500 })).toEqual({
      overflowing: true,
      atStart: false,
      atEnd: true,
    });
  });

  /**
   * A right-to-left scroller counts from zero at its own start, downwards. The
   * magnitude is the distance from the start in both directions, which is what
   * lets one rule answer for both.
   */
  it('reads a mirrored scroller by the distance rather than by the sign', () => {
    expect(overflowState({ clientSize: 400, scrollSize: 900, scrollStart: -500 })).toEqual({
      overflowing: true,
      atStart: false,
      atEnd: true,
    });
  });

  /**
   * Sub-pixel layout leaves a scroller a fraction short of its own end, and a
   * paging control that never disables is a control that does nothing when it
   * is pressed.
   */
  it('counts a fraction short of an end as being at it', () => {
    expect(overflowState({ clientSize: 400, scrollSize: 900.4, scrollStart: 499.6 }).atEnd).toBe(
      true,
    );
    expect(overflowState({ clientSize: 400, scrollSize: 400.5, scrollStart: 0 }).overflowing).toBe(
      false,
    );
  });
});

function mount(sizes: { client: number; scroll: number; start?: number }) {
  document.body.innerHTML = '<div id="row"></div>';
  const container = document.getElementById('row') as HTMLElement;
  Object.defineProperty(container, 'clientWidth', { value: sizes.client, configurable: true });
  Object.defineProperty(container, 'scrollWidth', { value: sizes.scroll, configurable: true });
  container.scrollLeft = sizes.start ?? 0;
  container.scrollBy = vi.fn();
  return container;
}

describe('createScrollAffordance', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('measures once on creation where no observer exists', () => {
    const container = mount({ client: 300, scroll: 800 });
    const handle = createScrollAffordance(container);

    expect(handle.state()).toEqual({ overflowing: true, atStart: true, atEnd: false });
    handle.destroy();
  });

  it('reports a change and only a change', () => {
    const container = mount({ client: 300, scroll: 800 });
    const onChange = vi.fn();
    const handle = createScrollAffordance(container, { onChange });

    handle.refresh();
    container.scrollLeft = 500;
    container.dispatchEvent(new Event('scroll'));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
      overflowing: true,
      atStart: false,
      atEnd: true,
    });
    handle.destroy();
  });

  it('moves most of a view rather than all of it, so the eye keeps a landmark', () => {
    const container = mount({ client: 300, scroll: 800 });
    const handle = createScrollAffordance(container);

    handle.page(1);

    expect(container.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 240 }));
    handle.destroy();
  });

  /**
   * A table mounted with a scroller measured its overflow as the scroller was
   * created, which forced a synchronous layout of every row inside the task
   * that mounted them. The observer's first report arrives after the browser
   * has laid the rows out, and the measurement waits for it.
   */
  it('reads no layout on creation when an observer will report the first size', () => {
    const reports: (() => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          reports.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    document.body.innerHTML = '<div id="row"></div>';
    const container = document.getElementById('row') as HTMLElement;
    let reads = 0;
    Object.defineProperty(container, 'clientWidth', {
      configurable: true,
      get: () => {
        reads += 1;
        return 300;
      },
    });
    Object.defineProperty(container, 'scrollWidth', { value: 800, configurable: true });
    const onChange = vi.fn();
    const handle = createScrollAffordance(container, { onChange });

    expect(reads).toBe(0);
    expect(handle.state()).toEqual({ overflowing: false, atStart: true, atEnd: true });

    reports[0]?.();

    expect(reads).toBe(1);
    expect(onChange).toHaveBeenCalledWith({ overflowing: true, atStart: true, atEnd: false });
    handle.destroy();
    vi.unstubAllGlobals();
  });

  it('stops measuring after destroy', () => {
    const container = mount({ client: 300, scroll: 800 });
    const onChange = vi.fn();
    const handle = createScrollAffordance(container, { onChange });
    onChange.mockClear();

    handle.destroy();
    container.scrollLeft = 500;
    container.dispatchEvent(new Event('scroll'));

    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * A tab list below the fold of a page header, revealed with `scrollIntoView`,
 * brought the whole page down by the tab's height on mount. The container
 * scrolls itself along its own axis and nothing else moves.
 */
describe('createScrollAffordance reveal', () => {
  function measured(container: HTMLElement, item: HTMLElement, left: number, width: number) {
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 300, bottom: 40 }) as DOMRect;
    item.getBoundingClientRect = () =>
      ({ left, top: 0, right: left + width, bottom: 40 }) as DOMRect;
  }

  it('scrolls the container by what the item lacks at the far end', () => {
    const container = mount({ client: 300, scroll: 800 });
    const item = document.createElement('button');
    container.append(item);
    measured(container, item, 250, 100);
    const handle = createScrollAffordance(container);

    handle.reveal(item);

    expect(container.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 50 }));
    handle.destroy();
  });

  it('scrolls back by what the item lacks at the near end, and not at all when it fits', () => {
    const container = mount({ client: 300, scroll: 800, start: 100 });
    const item = document.createElement('button');
    container.append(item);
    const handle = createScrollAffordance(container);

    measured(container, item, -30, 100);
    handle.reveal(item);
    expect(container.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -30 }));

    (container.scrollBy as ReturnType<typeof vi.fn>).mockClear();
    measured(container, item, 20, 100);
    handle.reveal(item);
    expect(container.scrollBy).not.toHaveBeenCalled();
    handle.destroy();
  });
});
