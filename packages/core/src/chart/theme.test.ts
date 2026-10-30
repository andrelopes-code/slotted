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
   * moved. Only a declaration that can reach the plot's colours reads again:
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
  it('keys the context by what can reach a colour', () => {
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
