import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { markStuckWithin, observeStuck } from './stuck';

const rect = (top: number) => ({ top }) as DOMRect;

describe('observeStuck', () => {
  let root: HTMLElement;
  let header: HTMLElement;
  let tops: { root: number; header: number };
  let frames: FrameRequestCallback[];
  const flush = () => frames.splice(0).forEach((callback) => callback(0));

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => {};
    });
    root = document.createElement('section');
    header = document.createElement('div');
    root.append(header);
    document.body.append(root);
    tops = { root: 100, header: 100 };
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(() => rect(tops.root));
    vi.spyOn(header, 'getBoundingClientRect').mockImplementation(() => rect(tops.header));
  });

  afterEach(() => {
    root.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports true when the header sits below the parent’s content edge, and false on return', () => {
    const changes: boolean[] = [];
    const stop = observeStuck(header, (stuck) => changes.push(stuck));
    flush();
    expect(changes).toEqual([]);

    tops = { root: 60, header: 100 };
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(changes).toEqual([true]);

    tops = { root: 100, header: 100 };
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(changes).toEqual([true, false]);
    stop();
  });

  it('counts the parent’s padding in the content edge', () => {
    root.style.paddingTop = '16px';
    const changes: boolean[] = [];
    const stop = observeStuck(header, (stuck) => changes.push(stuck));
    flush();

    tops = { root: 90, header: 100 };
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(changes).toEqual([]);

    tops = { root: 70, header: 100 };
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(changes).toEqual([true]);
    stop();
  });

  it('stops listening once disposed', () => {
    const changes: boolean[] = [];
    observeStuck(header, (stuck) => changes.push(stuck))();
    tops = { root: 0, header: 100 };
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(changes).toEqual([]);
  });
});

describe('markStuckWithin', () => {
  let frames: FrameRequestCallback[];
  const flush = () => frames.splice(0).forEach((callback) => callback(0));

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function group(list: HTMLElement, top: { group: number; label: number }) {
    const element = document.createElement('div');
    const label = document.createElement('div');

    label.dataset['part'] = 'group-label';
    element.append(label);
    list.append(element);
    vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => rect(top.group));
    vi.spyOn(label, 'getBoundingClientRect').mockImplementation(() => rect(top.label));

    return label;
  }

  it('marks each matching element while it is stuck, including one added later', async () => {
    const list = document.createElement('div');
    document.body.append(list);
    const first = group(list, { group: 0, label: 40 });
    const stop = markStuckWithin(list, '[data-part="group-label"]');
    flush();

    expect(first.hasAttribute('data-stuck')).toBe(true);

    const second = group(list, { group: 100, label: 140 });
    await Promise.resolve();
    flush();

    expect(second.hasAttribute('data-stuck')).toBe(true);

    stop();

    expect(first.hasAttribute('data-stuck')).toBe(false);
  });
});
