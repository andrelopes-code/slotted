import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { attachSheetScroll } from './sheet-scroll';
import type { SheetScroll, SheetScrollOptions } from './sheet-scroll';

/**
 * jsdom lays nothing out and scrolls nothing: the layer is given 800 pixels of
 * height and the panel's content its own, and a scroll that comes to rest is a
 * `scroll` followed by a `scrollend`.
 */
describe('attachSheetScroll', () => {
  let layer: HTMLElement;
  let panel: HTMLElement;
  let scroll: SheetScroll | null = null;
  let panelHeight = 400;

  beforeEach(() => {
    layer = document.createElement('div');
    panel = document.createElement('div');
    /* The content's end is read off the panel's parts: one part, as tall as the content. */
    const part = document.createElement('div');
    panel.append(part);
    layer.append(panel);
    document.body.append(layer);
    Object.defineProperty(layer, 'clientHeight', { configurable: true, get: () => 800 });
    Object.defineProperty(part, 'offsetHeight', { configurable: true, get: () => panelHeight });
    panelHeight = 400;
  });

  afterEach(() => {
    scroll?.destroy();
    scroll = null;
    layer.remove();
  });

  const attach = (options: Partial<SheetScrollOptions> = {}) => {
    const onSettle = vi.fn();
    scroll = attachSheetScroll(layer, panel, {
      content: () => true,
      dismissible: () => true,
      onSettle,
      reserve: '0px',
      snapPoints: () => [],
      step: '0px',
      ...options,
    });
    return { onSettle, scroll };
  };

  const settleAt = (top: number) => {
    layer.scrollTop = top;
    layer.dispatchEvent(new Event('scroll'));
    layer.dispatchEvent(new Event('scrollend'));
  };

  const stops = () =>
    [...layer.querySelectorAll<HTMLElement>('[data-part="stop"]')].map(
      (stop) => stop.style.insetBlockStart,
    );

  it('lays out the close and each stop as a snap point, and the panel at the highest', () => {
    const { scroll } = attach({ content: () => false, snapPoints: () => [0.5, 0.9] });
    scroll.layout(0.5);
    expect(stops()).toEqual(['0px', '400px', '720px']);
    expect(panel.style.getPropertyValue('--slotted-drawer-sheet-height')).toBe('720px');
    expect(layer.scrollTop).toBe(400);
  });

  it('rests a content sheet at its content, and adds no close when it cannot be dismissed', () => {
    const { scroll } = attach({ dismissible: () => false });
    scroll.layout(0.5);
    expect(stops()).toEqual(['400px']);
    expect(scroll.rest()).toBe(0.5);
  });

  it('makes the top of the screen a stop for content taller than the layer', () => {
    panelHeight = 2000;
    const { scroll } = attach();
    scroll.layout(1);
    expect(layer.hasAttribute('data-sheet-scrolls')).toBe(true);
    expect(stops().at(-1)).toBe('800px');
  });

  it('reads a scroll at rest out of sight as the close, and one on a stop as that stop', () => {
    const { onSettle, scroll } = attach({ content: () => false, snapPoints: () => [0.5, 0.9] });
    scroll.layout(0.5);
    settleAt(720);
    expect(onSettle).toHaveBeenLastCalledWith(0.9);
    settleAt(0);
    expect(onSettle).toHaveBeenLastCalledWith('close');
  });

  it('reads no close at the bottom an opening starts from', () => {
    const { onSettle, scroll } = attach();
    /* jsdom has no scrollTo: the opening arrives at once, and the start is behind it. */
    Object.defineProperty(layer, 'scrollTo', { configurable: true, value: () => undefined });
    scroll.enter(0.5);
    settleAt(0);
    expect(onSettle).not.toHaveBeenCalled();
    settleAt(400);
    expect(onSettle).toHaveBeenLastCalledWith(0.5);
  });

  it('reads content past the top with no snap, and folds the spacer once no finger is down', () => {
    panelHeight = 2000;
    const { scroll } = attach();
    scroll.layout(1);
    settleAt(1200);
    expect(layer.hasAttribute('data-sheet-content')).toBe(true);
    expect(layer.hasAttribute('data-sheet-anchored')).toBe(true);
    /* The fold moved what scrolls up by the layer's height, and nothing on screen. */
    expect(layer.scrollTop).toBe(400);
    expect(scroll.at()).toBe(1);
  });

  it('unfolds the spacer under a finger, so a pull from the top of the content moves the sheet', () => {
    panelHeight = 2000;
    const { scroll } = attach();
    scroll.layout(1);
    settleAt(1200);
    const touch = new Event('touchstart');
    Object.defineProperty(touch, 'touches', { value: [{}] });
    layer.dispatchEvent(touch);
    expect(layer.hasAttribute('data-sheet-anchored')).toBe(false);
    expect(layer.scrollTop).toBe(1200);
  });

  it('gives the layer and the panel back as they were', () => {
    const { scroll } = attach();
    scroll.layout(0.5);
    scroll.destroy();
    expect(layer.querySelector('[data-part="stops"]')).toBeNull();
    expect(panel.style.getPropertyValue('--slotted-drawer-sheet-height')).toBe('');
    expect(layer.hasAttribute('data-top-stop')).toBe(false);
  });
});
