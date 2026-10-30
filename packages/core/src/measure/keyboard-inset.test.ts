import { describe, expect, it } from 'vitest';

import { observeKeyboardInset } from './index';

function fakeView(innerHeight: number) {
  const listeners = new Map<string, () => void>();
  const viewport = {
    height: innerHeight,
    offsetTop: 0,
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  };
  return {
    listeners,
    view: { innerHeight, visualViewport: viewport } as unknown as Window,
    viewport,
  };
}

describe('observeKeyboardInset', () => {
  it('reports the band of the layout viewport below the visual one', () => {
    const { listeners, view, viewport } = fakeView(800);
    const seen: number[] = [];
    const stop = observeKeyboardInset(view, (pixels) => seen.push(pixels));
    expect(seen).toEqual([0]);

    viewport.height = 500;
    listeners.get('resize')?.();
    expect(seen).toEqual([0, 300]);

    viewport.offsetTop = 40;
    listeners.get('scroll')?.();
    expect(seen).toEqual([0, 300, 260]);

    stop();
    expect(listeners.size).toBe(0);
  });

  it('answers nothing where there is no visual viewport', () => {
    const seen: number[] = [];
    observeKeyboardInset({} as Window, (pixels) => seen.push(pixels))();
    expect(seen).toEqual([]);
  });
});
