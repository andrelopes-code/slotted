import { afterEach, describe, expect, it } from 'vitest';

import { createTourController } from './index';
import type { ResolvedStep, TourStepShape } from './index';

afterEach(() => document.body.replaceChildren());

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * A binding in miniature: it owns the current id, commits a request at once
 * when uncontrolled, and calls `sync` whenever the id changes — which is what
 * both bindings do from an effect.
 */
function harness(steps: TourStepShape[], controlled = false) {
  let current: string | null = null;
  const shown: string[] = [];
  const closes: [string, string][] = [];
  const pending: boolean[] = [];
  const requests: [string, string][] = [];

  const controller = createTourController({
    steps: () => steps,
    settings: () => ({ missing: 'center', targetTimeout: 0 }),
    onShow: (resolved: ResolvedStep<TourStepShape>) => shown.push(resolved.step.id),
    onPending: (value) => pending.push(value),
    requestStep: (id, reason) => {
      requests.push([id, reason]);
      if (controlled) return;
      current = id;
      controller.sync(current);
    },
    requestClose: (outcome, reason) => closes.push([outcome, reason]),
  });

  return {
    controller,
    shown,
    closes,
    pending,
    requests,
    accept(id: string) {
      current = id;
      controller.sync(current);
    },
  };
}

describe('createTourController', () => {
  it('shows the first available step when it opens with no step named', async () => {
    const run = harness([{ id: 'a', when: () => false }, { id: 'b' }]);
    run.controller.sync(null);
    await tick();
    expect(run.shown).toEqual(['b']);
    expect(run.requests).toEqual([['b', 'programmatic']]);
  });

  it('asks to move on next and shows the step once the move is committed', async () => {
    const run = harness([{ id: 'a' }, { id: 'b' }]);
    run.controller.sync('a');
    await tick();
    run.controller.next('pointer');
    await tick();
    expect(run.requests).toEqual([['b', 'pointer']]);
    expect(run.shown).toEqual(['a', 'b']);
  });

  it('waits for a controlled consumer to accept the step before showing it', async () => {
    const run = harness([{ id: 'a' }, { id: 'b' }], true);
    run.controller.sync('a');
    await tick();
    run.controller.next('keyboard');
    await tick();
    expect(run.shown).toEqual(['a']);
    run.accept('b');
    await tick();
    expect(run.shown).toEqual(['a', 'b']);
  });

  it('asks to close with the outcome complete when next finds no step left', async () => {
    const run = harness([{ id: 'a' }, { id: 'b', when: () => false }]);
    run.controller.sync('a');
    await tick();
    run.controller.next('pointer');
    await tick();
    expect(run.closes).toEqual([['complete', 'pointer']]);
  });

  it('does nothing on prev at the first step', async () => {
    const run = harness([{ id: 'a' }, { id: 'b' }]);
    run.controller.sync('a');
    await tick();
    run.controller.prev('keyboard');
    await tick();
    expect(run.requests).toEqual([]);
    expect(run.closes).toEqual([]);
  });

  it('asks to close with the outcome unavailable when no step can be shown', async () => {
    const run = harness([{ id: 'a', when: () => false }]);
    run.controller.sync(null);
    await tick();
    expect(run.closes).toEqual([['unavailable', 'programmatic']]);
    expect(run.shown).toEqual([]);
  });

  it('reports pending while a step prepares, and drops a navigation it was told to abandon', async () => {
    let release: () => void = () => {};
    const slow = new Promise<void>((resolve) => {
      release = resolve;
    });
    const run = harness([{ id: 'a' }, { id: 'b', prepare: () => slow }, { id: 'c' }]);
    run.controller.sync('a');
    await tick();
    run.controller.next('pointer');
    await tick();
    expect(run.pending.at(-1)).toBe(true);
    run.controller.goTo('c', 'pointer');
    release();
    await tick();
    await tick();
    expect(run.shown).toEqual(['a', 'c']);
    expect(run.pending.at(-1)).toBe(false);
  });

  it('turns the shown step into a missing one when its target leaves', async () => {
    const node = document.createElement('div');
    node.id = 'x';
    document.body.append(node);
    const seen: ResolvedStep<TourStepShape>[] = [];
    const controller = createTourController({
      steps: () => [{ id: 'a', target: '#x' }],
      settings: () => ({ missing: 'center', targetTimeout: 0 }),
      onShow: (resolved) => seen.push(resolved),
      onPending: () => {},
      requestStep: () => {},
      requestClose: () => {},
    });
    controller.sync('a');
    await tick();
    expect(seen.at(-1)?.target).toBe(node);
    controller.markMissing();
    expect(seen.at(-1)).toMatchObject({ target: null, missing: true });
  });

  it('abandons everything once destroyed', async () => {
    const run = harness([{ id: 'a' }]);
    run.controller.destroy();
    run.controller.sync('a');
    await tick();
    expect(run.shown).toEqual([]);
  });
});
