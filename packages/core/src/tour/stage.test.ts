import { afterEach, describe, expect, it } from 'vitest';

import { durationOf, spotMove, stageStep } from './index';

afterEach(() => document.body.replaceChildren());

describe('spotMove', () => {
  const a = document.createElement('div');
  const b = document.createElement('div');

  it('lights the cutout the tour opens on, and has nothing to do for a centred opening', () => {
    expect(spotMove(undefined, a)).toBe('light');
    expect(spotMove(undefined, null)).toBe('rest');
  });

  it('travels between two targets, lights a new one and closes the last one', () => {
    expect(spotMove(a, b)).toBe('travel');
    expect(spotMove(null, b)).toBe('light');
    expect(spotMove(a, null)).toBe('close');
    expect(spotMove(null, null)).toBe('rest');
  });

  /** The same element twice is a step change on one target: nothing moves. */
  it('rests when the target does not change', () => {
    expect(spotMove(a, a)).toBe('rest');
  });
});

describe('durationOf', () => {
  it('reads a duration token in milliseconds or seconds, and zero when it is absent', () => {
    const node = document.createElement('div');
    document.body.append(node);
    node.style.setProperty('--slotted-duration-long', '320ms');
    node.style.setProperty('--slotted-duration-loop', '1.1s');
    expect(durationOf(node, '--slotted-duration-long')).toBe(320);
    expect(durationOf(node, '--slotted-duration-loop')).toBe(1100);
    expect(durationOf(node, '--slotted-duration-medium')).toBe(0);
    expect(durationOf(null, '--slotted-duration-long')).toBe(0);
  });
});

describe('stageStep', () => {
  function recorder() {
    const log: string[] = [];
    return {
      log,
      spot: (target: Element | null, move: string) =>
        log.push(`spot ${target?.id ?? 'none'} ${move}`),
      card: (phase: string) => log.push(`card ${phase}`),
    };
  }

  function root(long: string, short: string) {
    const node = document.createElement('div');
    node.style.setProperty('--slotted-duration-long', long);
    node.style.setProperty('--slotted-duration-short', short);
    document.body.append(node);
    return node;
  }

  function target(id: string) {
    const node = document.createElement('button');
    node.id = id;
    document.body.append(node);
    return node;
  }

  /**
   * The order a step change is seen in: the old card leaves while the cutout
   * travels, and the new card arrives once the cutout has landed.
   */
  it('lets the card leave, moves the spotlight, and brings the card in after the move', async () => {
    const run = recorder();
    const started = performance.now();
    await stageStep({
      root: root('40ms', '10ms'),
      from: target('a'),
      to: target('b'),
      scroll: false,
      signal: new AbortController().signal,
      spot: run.spot,
      card: run.card,
    });
    expect(performance.now() - started).toBeGreaterThanOrEqual(35);
    expect(run.log).toEqual(['card leave', 'spot b travel', 'card enter', 'spot b rest']);
  });

  it('closes the cutout on its old target before it goes', async () => {
    const run = recorder();
    await stageStep({
      root: root('5ms', '5ms'),
      from: target('a'),
      to: null,
      scroll: false,
      signal: new AbortController().signal,
      spot: run.spot,
      card: run.card,
    });
    expect(run.log).toEqual(['card leave', 'spot a close', 'card enter', 'spot none rest']);
  });

  /** Opening is the scrim and the card together, as a dialog opens: no wait for the light. */
  it('opens without waiting for the cutout to light, and rests it once it has', async () => {
    const run = recorder();
    const started = performance.now();
    let entered = 0;
    await stageStep({
      root: root('60ms', '10ms'),
      from: undefined,
      to: target('a'),
      scroll: false,
      signal: new AbortController().signal,
      spot: run.spot,
      card: (phase) => {
        entered = performance.now() - started;
        run.card(phase);
      },
    });
    expect(entered).toBeLessThan(30);
    expect(run.log).toEqual(['spot a light', 'card enter', 'spot a rest']);
  });

  it('stops where it is when a newer step change aborts it', async () => {
    const run = recorder();
    const controller = new AbortController();
    const pending = stageStep({
      root: root('60ms', '10ms'),
      from: target('a'),
      to: target('b'),
      scroll: false,
      signal: controller.signal,
      spot: run.spot,
      card: run.card,
    });
    controller.abort();
    await pending;
    expect(run.log).toEqual(['card leave', 'spot b travel']);
  });
});
