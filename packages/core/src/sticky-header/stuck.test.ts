import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { observeStuck } from './stuck';

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
