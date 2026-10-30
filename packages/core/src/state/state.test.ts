import { describe, expect, it, vi } from 'vitest';

import { createControllable, isControlled } from './state';

describe('createControllable', () => {
  it('starts an uncontrolled component at its initial value', () => {
    const state = createControllable({ initial: false });

    expect(state.controlled).toBe(false);
    expect(state.value).toBe(false);
  });

  it('moves its own state when nobody owns it', () => {
    const state = createControllable({ initial: false });

    expect(state.request(true, 'pointer')).toBe(true);
    expect(state.value).toBe(true);
  });

  it('starts a controlled component at the consumer value, not the initial one', () => {
    const state = createControllable({ controlled: true, initial: false });

    expect(state.controlled).toBe(true);
    expect(state.value).toBe(true);
  });

  it('never moves state the consumer owns', () => {
    const onRequest = vi.fn();
    const state = createControllable({ controlled: false, initial: false, onRequest });

    expect(state.request(true, 'keyboard')).toBe(false);
    expect(state.value).toBe(false);
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('takes the consumer value back through sync', () => {
    const state = createControllable({ controlled: false, initial: false });

    state.request(true, 'keyboard');
    state.sync(true);

    expect(state.value).toBe(true);
  });

  it('ignores sync while it owns the state', () => {
    const state = createControllable({ initial: false });

    state.sync(true);

    expect(state.value).toBe(false);
  });

  it('carries the reason and the originating event to the consumer', () => {
    const source = { type: 'keydown' };
    const onRequest = vi.fn();
    const state = createControllable({ initial: 'a', onRequest });

    state.request('b', 'escape', source);

    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'b', previous: 'a', reason: 'escape', source }),
    );
  });

  it('commits nothing when the request is cancelled', () => {
    const state = createControllable({
      initial: false,
      onRequest: (request) => request.cancel(),
    });

    expect(state.request(true, 'pointer')).toBe(false);
    expect(state.value).toBe(false);
  });

  it('reports a cancelled request as cancelled', () => {
    const seen: boolean[] = [];
    const state = createControllable({
      initial: false,
      onRequest: (request) => {
        request.cancel();
        seen.push(request.cancelled);
      },
    });

    state.request(true, 'pointer');

    expect(seen).toEqual([true]);
  });

  it('says nothing when the value would not change', () => {
    const onRequest = vi.fn();
    const state = createControllable({ initial: 'a', onRequest });

    expect(state.request('a', 'programmatic')).toBe(false);
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('compares composite values the way the caller says', () => {
    const onRequest = vi.fn();
    const state = createControllable<string[]>({
      initial: ['a'],
      onRequest,
      equals: (a, b) => a.length === b.length && a.every((item, index) => item === b[index]),
    });

    expect(state.request(['a'], 'select')).toBe(false);
    expect(state.request(['a', 'b'], 'select')).toBe(true);
    expect(onRequest).toHaveBeenCalledOnce();
  });
});

describe('isControlled', () => {
  it('treats only undefined as absent', () => {
    expect(isControlled(undefined)).toBe(false);
    expect(isControlled(false)).toBe(true);
    expect(isControlled(null)).toBe(true);
    expect(isControlled(0)).toBe(true);
  });
});
