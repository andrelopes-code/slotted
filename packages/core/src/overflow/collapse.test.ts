import { describe, expect, it } from 'vitest';

import { collapseState, createCollapse } from './collapse';

/**
 * The arithmetic of a bar that has to give something up: which units go, and
 * whether the control that holds them is drawn at all. It is a pure function
 * over numbers so the decision is tested without a layout engine — the same
 * split `overflowState` already makes for a scrolling row.
 */
const unit = (size: number, collapsible = true) => ({ collapsible, size });

describe('collapseState', () => {
  it('collapses nothing and draws no trigger while the bar fits', () => {
    const state = collapseState({
      available: 300,
      gap: 10,
      triggerSize: 30,
      units: [unit(100), unit(100)],
    });

    expect(state).toEqual({ collapsed: [], triggerVisible: false });
  });

  it('takes the room the trigger needs into account before it is drawn', () => {
    /* Three units and two gaps are 320 against 300, so one has to go. Once it
       does, the trigger arrives and takes its own room and its own gap. */
    const state = collapseState({
      available: 300,
      gap: 10,
      triggerSize: 30,
      units: [unit(100), unit(100), unit(100)],
    });

    expect(state).toEqual({ collapsed: [2], triggerVisible: true });
  });

  it('gives way from the end, whatever the sizes are', () => {
    const state = collapseState({
      available: 100,
      gap: 0,
      triggerSize: 20,
      units: [unit(80), unit(10), unit(10), unit(10)],
    });

    expect(state.collapsed).toEqual([1, 2, 3]);
  });

  it('leaves a unit with nowhere to go where it is', () => {
    const state = collapseState({
      available: 100,
      gap: 0,
      triggerSize: 20,
      units: [unit(40), unit(40, false), unit(40)],
    });

    expect(state.collapsed).toEqual([2]);
    expect(state.triggerVisible).toBe(true);
  });

  /**
   * The rule the refinement exists for: a bar of controls that cannot move
   * overflows rather than hiding one of them, and the trigger is not drawn to
   * announce a menu with nothing in it.
   */
  it('draws no trigger when nothing in the bar can collapse', () => {
    const state = collapseState({
      available: 50,
      gap: 0,
      triggerSize: 20,
      units: [unit(40, false), unit(40, false)],
    });

    expect(state).toEqual({ collapsed: [], triggerVisible: false });
  });

  it('collapses everything it can when even that is not enough', () => {
    const state = collapseState({
      available: 30,
      gap: 0,
      triggerSize: 20,
      units: [unit(100, false), unit(40), unit(40)],
    });

    expect(state.collapsed).toEqual([1, 2]);
    expect(state.triggerVisible).toBe(true);
  });

  /**
   * A spacer is passed in as a unit of no size so that it is counted in the
   * gaps and never in the room; it grows into whatever is left, so a bar with
   * one still fits exactly when its controls fit.
   */
  it('counts a gap for every box that is still drawn', () => {
    const fits = collapseState({
      available: 100,
      gap: 10,
      triggerSize: 20,
      units: [unit(40), unit(0, false), unit(40)],
    });

    expect(fits).toEqual({ collapsed: [], triggerVisible: false });

    const overflows = collapseState({
      available: 98,
      gap: 10,
      triggerSize: 20,
      units: [unit(40), unit(0, false), unit(40)],
    });

    expect(overflows.collapsed).toEqual([2]);
  });

  it('holds a bar a fraction of a pixel over its own width', () => {
    const state = collapseState({
      available: 199.6,
      gap: 0,
      triggerSize: 20,
      units: [unit(100), unit(100)],
    });

    expect(state).toEqual({ collapsed: [], triggerVisible: false });
  });

  /**
   * A rule that divides nothing is a stray line. The order alone almost gets
   * there — the end gives way first — and misses when the collapse stops as
   * soon as the bar fits.
   */
  it('takes a rule that is left dividing nothing', () => {
    const state = collapseState({
      available: 100,
      gap: 0,
      triggerSize: 20,
      units: [unit(40), { collapsible: false, divides: true, size: 10 }, unit(60)],
    });

    expect(state.collapsed).toEqual([1, 2]);
  });

  it('leaves a rule that still divides two visible units', () => {
    const state = collapseState({
      available: 120,
      gap: 0,
      triggerSize: 20,
      units: [unit(40), { collapsible: false, divides: true, size: 10 }, unit(40), unit(60)],
    });

    expect(state.collapsed).toEqual([3]);
  });

  it('reports an empty bar as fitting', () => {
    expect(collapseState({ available: 0, gap: 8, triggerSize: 20, units: [] })).toEqual({
      collapsed: [],
      triggerVisible: false,
    });
  });

  /**
   * The rank. A bar whose reading order and whose order of importance run the
   * same way needs none, and `toolbar` says so in its own contract. A bar of
   * actions is the case where they run in opposite directions: every surveyed
   * implementation puts the action that confirms at the end of the line, so
   * giving way from the end gives up Save first.
   */
  describe('rank', () => {
    const ranked = (size: number, rank: number) => ({ collapsible: true, rank, size });

    it('gives way from the lowest rank, whatever the position', () => {
      /* Four units of 40 and no gap in 100: two have to go, and the two that
         go are the ones ranked lowest rather than the two at the end. */
      const state = collapseState({
        available: 100,
        gap: 0,
        triggerSize: 20,
        units: [ranked(40, 0), ranked(40, 2), ranked(40, 0), ranked(40, 2)],
      });

      expect(state.collapsed).toEqual([0, 2]);
      expect(state.triggerVisible).toBe(true);
    });

    it('gives way from the end within one rank', () => {
      const state = collapseState({
        available: 100,
        gap: 0,
        triggerSize: 20,
        units: [ranked(40, 1), ranked(40, 1), ranked(40, 1)],
      });

      expect(state.collapsed).toEqual([2]);
    });

    it('reaches a higher rank only once the lower one is exhausted', () => {
      const state = collapseState({
        available: 60,
        gap: 0,
        triggerSize: 20,
        units: [ranked(40, 5), ranked(40, 1), ranked(40, 5)],
      });

      expect(state.collapsed).toEqual([1, 2]);
    });

    it('reads an unranked unit as rank nought, which is what the bar did before', () => {
      /* Both unranked units give way before the one ranked above them, and the
         one ranked above them is left holding the bar. */
      const state = collapseState({
        available: 60,
        gap: 0,
        triggerSize: 20,
        units: [unit(40), ranked(40, 1), unit(40)],
      });

      expect(state.collapsed).toEqual([0, 2]);
    });

    it('never gives way a unit with nowhere to go, whatever its rank', () => {
      const state = collapseState({
        available: 40,
        gap: 0,
        triggerSize: 20,
        units: [{ collapsible: false, rank: 0, size: 40 }, ranked(40, 9)],
      });

      expect(state.collapsed).toEqual([1]);
    });
  });
});

/**
 * The half of the module that touches the DOM. `ResizeObserver` does not exist
 * in jsdom and no box has a width there, so what is exercised here is the one
 * decision the arithmetic cannot make on its own: whether the control that holds
 * the surface is drawn.
 */
describe('createCollapse', () => {
  function bar() {
    const container = document.createElement('div');
    const trigger = document.createElement('button');
    trigger.setAttribute('hidden', '');
    container.append(trigger);
    document.body.append(container);
    return { container, trigger };
  }

  it('hides the control while nothing gave way', () => {
    const { container, trigger } = bar();

    const handle = createCollapse(container, {
      collapsible: () => true,
      trigger: () => trigger,
      units: () => [],
    });

    expect(trigger.hasAttribute('hidden')).toBe(true);
    handle.destroy();
  });

  /**
   * A bar whose surface holds something permanently — `action-bar`'s `always`
   * rank, Fluent's `overflowItems`, SAP's `AlwaysOverflow` — has rows in the
   * surface while every unit still fits. A control that hid itself then would be
   * a menu nobody can open.
   */
  it('draws the control anyway when the surface holds something permanently', () => {
    const { container, trigger } = bar();

    const handle = createCollapse(container, {
      collapsible: () => true,
      trigger: () => trigger,
      triggerAlways: () => true,
      units: () => [],
    });

    expect(trigger.hasAttribute('hidden')).toBe(false);
    handle.destroy();
  });
});
