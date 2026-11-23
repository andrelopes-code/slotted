import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cachedChartTheme, chartThemeKey, observeChartTheme, readChartTheme } from './theme';

/**
 * `observeChartTheme` schedules its re-read on `requestAnimationFrame`, which
 * Vitest does not fake by default. Faking it here lets the test advance the
 * one pending frame deterministically instead of waiting on a real one.
 */
function useFrames() {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
}

describe('observeChartTheme', () => {
  beforeEach(() => {
    useFrames();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the theme again when a theme stylesheet is applied', () => {
    const element = document.createElement('div');
    document.body.append(element);
    let reads = 0;
    const stop = observeChartTheme(element, () => {
      reads += 1;
    });

    document.dispatchEvent(
      new CustomEvent('slotted-themechange', { detail: { name: 'x', applied: true } }),
    );
    vi.advanceTimersToNextFrame();

    stop();
    element.remove();
    expect(reads).toBe(1);
  });

  /**
   * A container carried or pulled writes its geometry every frame: a widget
   * in hand, a pane being resized. Re-reading the theme on each write cost a
   * probe and two dozen computed styles a frame for a theme that had not
   * moved. Only a declaration that can reach the plot's colors reads again:
   * a private property (`--_*`) is a family's own wiring, never a theme input.
   */
  it('leaves the theme alone when an ancestor writes only its geometry or private wiring', async () => {
    /* Mutation records arrive on a microtask, before the frame they schedule. */
    const settle = async () => {
      await Promise.resolve();
      vi.advanceTimersToNextFrame();
    };
    const ancestor = document.createElement('div');
    const element = document.createElement('div');
    ancestor.append(element);
    document.body.append(ancestor);
    let reads = 0;
    const stop = observeChartTheme(element, () => {
      reads += 1;
    });

    ancestor.style.translate = '40px 30px';
    ancestor.style.inlineSize = '320px';
    ancestor.style.insetBlockStart = '12px';
    ancestor.style.order = '4';
    ancestor.style.gridColumn = '2 / span 3';
    /* A family's private wiring: a dashboard widget's cell. */
    ancestor.style.setProperty('--_dg-x', '3');
    await settle();
    expect(reads).toBe(0);

    ancestor.style.setProperty('--slotted-seed-accent', 'red');
    await settle();
    expect(reads).toBe(1);

    ancestor.style.color = 'blue';
    await settle();
    expect(reads).toBe(2);

    ancestor.style.removeProperty('translate');
    await settle();
    expect(reads).toBe(2);

    stop();
    ancestor.remove();
  });
});

describe('readChartTheme', () => {
  /**
   * jsdom answers a read of an undeclared custom property by asking every
   * ancestor twice, so one read doubles per level: 3 s at 20 levels, and the
   * theme has thirty properties. A write between two computed reads empties
   * its cascade cache, and forces one style recalculation in a browser.
   */
  it('reads no custom property and writes to the document once', () => {
    const { element, remove } = nested(24);
    const custom = vi.spyOn(CSSStyleDeclaration.prototype, 'getPropertyValue');
    const observer = new MutationObserver(() => {});
    observer.observe(document, { attributes: true, childList: true, subtree: true });
    const start = performance.now();

    readChartTheme(element);

    const elapsed = performance.now() - start;
    const writes = observer.takeRecords();
    observer.disconnect();
    remove();
    expect(custom).not.toHaveBeenCalled();
    custom.mockRestore();
    /* The probes enter in one insertion and leave in one removal. */
    expect(writes.map(({ type }) => type)).toEqual(['childList', 'childList']);
    expect(elapsed).toBeLessThan(2000);
  });

  it('takes every fallback in a document whose style sheets declare no chart token', () => {
    const { element, remove } = nested(2);
    const probe = document.createElement('span');
    element.append(probe);
    const resolved = (color: string) => {
      probe.style.color = color;
      return getComputedStyle(probe).color;
    };

    const theme = readChartTheme(element);

    expect(theme).toMatchObject({
      text: resolved('CanvasText'),
      label: resolved('GrayText'),
      overflow: resolved('GrayText'),
      surface: resolved('Canvas'),
      labelSize: 12,
      lineWidth: 2,
      markerSize: 6,
      barRadius: 4,
      areaOpacity: 0.16,
      inset: 8,
      duration: 0,
      easing: [0.2, 0, 0, 1],
    });
    expect(new Set([...theme.slots, ...Object.values(theme.tones)])).toEqual(new Set([theme.text]));
    expect(theme.slots).toHaveLength(8);
    remove();
  });
});

describe('the theme cache', () => {
  it('gives a chart the theme another chart read in the same context', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);

    expect(cachedChartTheme(second)).toBeNull();
    const theme = readChartTheme(first);
    expect(cachedChartTheme(second)).toBe(theme);

    first.remove();
    second.remove();
  });

  /**
   * A wrapper that overrides a token paints the chart under it differently
   * from the one beside it; a wrapper that only places its chart does not.
   */
  it('keys the context by what can reach a color', () => {
    const wrapper = document.createElement('div');
    const element = document.createElement('div');
    wrapper.append(element);
    document.body.append(wrapper);
    const key = chartThemeKey(element);

    wrapper.style.gridColumn = '2 / span 3';
    wrapper.style.setProperty('--_dg-x', '3');
    expect(chartThemeKey(element)).toBe(key);

    wrapper.style.setProperty('--slotted-seed-accent', 'red');
    expect(chartThemeKey(element)).not.toBe(key);
    wrapper.style.removeProperty('--slotted-seed-accent');

    wrapper.setAttribute('data-slotted-scheme', 'dark');
    expect(chartThemeKey(element)).not.toBe(key);
    wrapper.removeAttribute('data-slotted-scheme');

    document.dispatchEvent(
      new CustomEvent('slotted-themechange', { detail: { name: 'x', applied: true } }),
    );
    expect(chartThemeKey(element)).not.toBe(key);

    wrapper.remove();
  });
});

/** An element under `depth` elements of the body. */
function nested(depth: number) {
  const top = document.createElement('div');
  let element: HTMLElement = top;
  for (let level = 1; level < depth; level += 1) {
    const child = document.createElement('div');
    element.append(child);
    element = child;
  }
  document.body.append(top);

  return { element, remove: () => top.remove() };
}
