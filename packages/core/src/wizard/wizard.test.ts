import { describe, expect, it } from 'vitest';

import {
  assertUniqueSteps,
  clampStep,
  createSnapshot,
  firstIncomplete,
  formValues,
  includedValues,
  nextDestination,
  previousStep,
  readSnapshot,
  reachableStep,
  replacementStep,
  stepComplete,
  stepPosition,
  storagePersistence,
} from './wizard';
import type { WizardStepEntry, WizardValue } from './wizard';

const steps = (...names: string[]): WizardStepEntry[] => names.map((name) => ({ name }));
const flow = steps('account', 'shipping', 'payment', 'review');

describe('stepComplete', () => {
  it('is complete exactly when the name is in the value', () => {
    expect(stepComplete({ account: {} }, 'account')).toBe(true);
    expect(stepComplete({ account: {} }, 'shipping')).toBe(false);
  });
});

describe('assertUniqueSteps', () => {
  it('throws on two steps with one name, which would share one answer', () => {
    expect(() => assertUniqueSteps(steps('a', 'b', 'a'))).toThrow(/"a"/);
  });

  it('throws on no steps at all', () => {
    expect(() => assertUniqueSteps([])).toThrow(/no steps/);
  });

  it('accepts distinct names', () => {
    expect(() => assertUniqueSteps(flow)).not.toThrow();
  });
});

describe('reachableStep', () => {
  it('reaches the current step, every step behind it, and the first open one ahead', () => {
    const value: WizardValue = { account: {} };
    const at = (target: string) =>
      reachableStep({ current: 'shipping', linear: true, steps: flow, target, value });
    expect(at('account')).toBe(true);
    expect(at('shipping')).toBe(true);
    expect(at('payment')).toBe(false);
  });

  it('reaches a step ahead once every step before it is complete', () => {
    const value: WizardValue = { account: {}, payment: {}, shipping: {} };
    expect(
      reachableStep({ current: 'shipping', linear: true, steps: flow, target: 'review', value }),
    ).toBe(true);
  });

  it('reaches every step outside a linear flow, and none that is disabled', () => {
    const disabled = [...flow.slice(0, 3), { disabled: true, name: 'review' }];
    expect(
      reachableStep({
        current: 'account',
        linear: false,
        steps: flow,
        target: 'review',
        value: {},
      }),
    ).toBe(true);
    expect(
      reachableStep({
        current: 'account',
        linear: false,
        steps: disabled,
        target: 'review',
        value: {},
      }),
    ).toBe(false);
  });

  it('reaches no step that is not in the list', () => {
    expect(
      reachableStep({ current: 'account', linear: false, steps: flow, target: 'gift', value: {} }),
    ).toBe(false);
  });
});

describe('clampStep', () => {
  it('keeps a requested step that is present and reachable', () => {
    expect(
      clampStep({ linear: true, requested: 'shipping', steps: flow, value: { account: {} } }),
    ).toBe('shipping');
  });

  /** A bookmark, a reload or a shared link that points past the work done. */
  it('turns an unreachable step into the first incomplete one', () => {
    expect(
      clampStep({ linear: true, requested: 'review', steps: flow, value: { account: {} } }),
    ).toBe('shipping');
  });

  it('turns an absent step into the first incomplete one', () => {
    expect(clampStep({ linear: true, requested: 'gift', steps: flow, value: {} })).toBe('account');
  });

  it('lands on the last step when every step is complete', () => {
    const value: WizardValue = { account: {}, payment: {}, review: {}, shipping: {} };
    expect(clampStep({ linear: true, requested: 'gift', steps: flow, value })).toBe('review');
  });

  it('keeps any present step outside a linear flow', () => {
    expect(clampStep({ linear: false, requested: 'review', steps: flow, value: {} })).toBe(
      'review',
    );
  });

  it('never lands on a disabled step', () => {
    const list = [{ disabled: true, name: 'account' }, ...steps('shipping')];
    expect(clampStep({ linear: true, requested: undefined, steps: list, value: {} })).toBe(
      'shipping',
    );
  });
});

describe('nextDestination', () => {
  it('goes to the next step after the one just accepted', () => {
    expect(nextDestination({ current: 'account', steps: flow, value: { account: {} } })).toEqual({
      kind: 'step',
      name: 'shipping',
    });
  });

  it('submits after the last step when every step is complete', () => {
    const value: WizardValue = { account: {}, payment: {}, review: {}, shipping: {} };
    expect(nextDestination({ current: 'review', steps: flow, value })).toEqual({ kind: 'submit' });
  });

  /** Decision 1: a step that appeared before the current one is asked next. */
  it('asks an incomplete step that appeared before the current one first', () => {
    const grown = steps('account', 'company', 'shipping', 'payment', 'review');
    const value: WizardValue = { account: {}, shipping: {} };
    expect(nextDestination({ current: 'shipping', steps: grown, value })).toEqual({
      kind: 'step',
      name: 'company',
    });
  });

  it('asks an incomplete step before submitting from the last one', () => {
    const value: WizardValue = { account: {}, review: {}, shipping: {} };
    expect(nextDestination({ current: 'review', steps: flow, value })).toEqual({
      kind: 'step',
      name: 'payment',
    });
  });

  /** GOV.UK: a changed answer that opens a new question asks it before returning. */
  it('returns to the return point when nothing between is incomplete', () => {
    const value: WizardValue = { account: {}, payment: {}, review: {}, shipping: {} };
    expect(nextDestination({ current: 'account', returnTo: 'review', steps: flow, value })).toEqual(
      { kind: 'step', name: 'review' },
    );
  });

  it('asks a new question on the way back to the return point', () => {
    const grown = steps('account', 'company', 'shipping', 'payment', 'review');
    const value: WizardValue = { account: {}, payment: {}, review: {}, shipping: {} };
    expect(
      nextDestination({ current: 'account', returnTo: 'review', steps: grown, value }),
    ).toEqual({ kind: 'step', name: 'company' });
  });

  /** Decision 3: a return point that left the list is dropped. */
  it('drops a return point that is no longer a step', () => {
    const value: WizardValue = { account: {} };
    expect(nextDestination({ current: 'account', returnTo: 'gone', steps: flow, value })).toEqual({
      kind: 'step',
      name: 'shipping',
    });
  });

  it('steps over a disabled step', () => {
    const list = [...steps('account'), { disabled: true, name: 'shipping' }, ...steps('review')];
    expect(nextDestination({ current: 'account', steps: list, value: { account: {} } })).toEqual({
      kind: 'step',
      name: 'review',
    });
  });
});

describe('previousStep', () => {
  it('names the previous present step, stepping over a disabled one', () => {
    const list = [...steps('account'), { disabled: true, name: 'shipping' }, ...steps('review')];
    expect(previousStep({ current: 'review', steps: list })).toBe('account');
    expect(previousStep({ current: 'account', steps: list })).toBeUndefined();
  });
});

describe('replacementStep', () => {
  it('takes the next step that is still present when the current one leaves', () => {
    const before = steps('account', 'company', 'shipping');
    const after = steps('account', 'shipping');
    expect(replacementStep({ after, before, current: 'company' })).toBe('shipping');
  });

  it('takes the previous step when nothing after it is still present', () => {
    const before = steps('account', 'company');
    const after = steps('account');
    expect(replacementStep({ after, before, current: 'company' })).toBe('account');
  });

  it('keeps the current step while it is present, wherever the list changed', () => {
    const before = steps('account', 'shipping');
    const after = steps('account', 'company', 'shipping');
    expect(replacementStep({ after, before, current: 'shipping' })).toBe('shipping');
  });
});

describe('firstIncomplete', () => {
  it('names the first present step that is not complete', () => {
    expect(firstIncomplete({ steps: flow, value: { account: {}, payment: {} } })).toBe('shipping');
    expect(
      firstIncomplete({
        steps: flow,
        value: { account: {}, payment: {}, review: {}, shipping: {} },
      }),
    ).toBeUndefined();
  });
});

describe('includedValues', () => {
  /** An absent step keeps its answer for when it returns, and is not submitted. */
  it('keeps only the steps present', () => {
    expect(includedValues({ account: { a: 1 }, company: { c: 2 } }, steps('account'))).toEqual({
      account: { a: 1 },
    });
  });
});

describe('stepPosition', () => {
  it('counts the steps present, one-based', () => {
    expect(stepPosition(flow, 'payment')).toEqual({ count: 4, index: 3 });
    expect(stepPosition(flow, 'gift')).toEqual({ count: 4, index: 0 });
  });
});

describe('formValues', () => {
  it('reads FormData in document order, with a repeated name as a list', () => {
    const data = new FormData();
    data.append('name', 'Ana');
    data.append('tag', 'a');
    data.append('tag', 'b');
    expect(formValues(data)).toEqual({ name: 'Ana', tag: ['a', 'b'] });
  });
});

describe('snapshots', () => {
  it('reads back what it wrote, at the same version', () => {
    const snapshot = createSnapshot({
      drafts: { shipping: { city: 'Sea' } },
      now: new Date('2026-09-25T14:02:00Z'),
      step: 'shipping',
      value: { account: { email: 'a@b.example' } },
      version: 3,
    });
    expect(snapshot.savedAt).toBe('2026-09-25T14:02:00.000Z');
    expect(readSnapshot(JSON.parse(JSON.stringify(snapshot)), 3)).toEqual(snapshot);
  });

  it('refuses another version and a malformed record', () => {
    const snapshot = createSnapshot({ drafts: {}, step: 'a', value: {}, version: 1 });
    expect(readSnapshot(snapshot, 2)).toBeUndefined();
    expect(readSnapshot({ step: 4 }, undefined)).toBeUndefined();
    expect(readSnapshot(null, undefined)).toBeUndefined();
  });
});

describe('storagePersistence', () => {
  it('saves, loads and clears through the storage it was given', () => {
    const persistence = storagePersistence({ key: 'k', storage: sessionStorage, version: 1 });
    const snapshot = createSnapshot({
      drafts: {},
      step: 'a',
      value: { a: { x: 'y' } },
      version: 1,
    });
    persistence.save(snapshot);
    expect(persistence.load()).toEqual(snapshot);
    persistence.clear();
    expect(persistence.load()).toBeUndefined();
  });

  it('omits a File, which Storage cannot hold', () => {
    const persistence = storagePersistence({ key: 'f', storage: localStorage, version: 1 });
    const file = new File(['x'], 'x.txt');
    persistence.save(
      createSnapshot({ drafts: {}, step: 'a', value: { a: { file, note: 'n' } }, version: 1 }),
    );
    expect(persistence.load()?.value).toEqual({ a: { note: 'n' } });
  });

  it('clears a draft written by another version of the flow', () => {
    localStorage.setItem(
      'v',
      JSON.stringify(createSnapshot({ drafts: {}, step: 'a', value: {}, version: 1 })),
    );
    const persistence = storagePersistence({ key: 'v', storage: localStorage, version: 2 });
    expect(persistence.load()).toBeUndefined();
    expect(localStorage.getItem('v')).toBeNull();
  });

  it('reads nothing from a value that is not JSON', () => {
    localStorage.setItem('broken', '{');
    const persistence = storagePersistence({ key: 'broken', storage: localStorage, version: 1 });
    expect(persistence.load()).toBeUndefined();
  });
});
