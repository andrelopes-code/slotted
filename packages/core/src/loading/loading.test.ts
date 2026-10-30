import { describe, expect, it } from 'vitest';

import { initialLoadingVisibility, nextLoadingVisibility } from './loading';
import type { LoadingVisibilityState } from './loading';

/** Drives the machine through a list of moments, as a binding's timer would. */
function replay(
  steps: readonly { loading: boolean; now: number }[],
  { delay = 0, minDuration = 0 } = {},
) {
  let state: LoadingVisibilityState = initialLoadingVisibility;
  return steps.map(({ loading, now }) => {
    const answer = nextLoadingVisibility({ loading, delay, minDuration, now, state });
    state = answer.state;
    return { visible: state.visible, wait: answer.wait };
  });
}

describe('loading visibility', () => {
  /**
   * The default configuration has to cost nothing: no timer is scheduled and
   * the answer is the consumer's own boolean, or every placeholder in the
   * library pays for a capability most pages do not turn on.
   */
  it('is the consumer’s own boolean when neither duration is set', () => {
    expect(
      replay([
        { loading: true, now: 0 },
        { loading: false, now: 10 },
      ]),
    ).toEqual([
      { visible: true, wait: null },
      { visible: false, wait: null },
    ]);
  });

  it('paints nothing until the wait has lasted long enough to report', () => {
    expect(
      replay(
        [
          { loading: true, now: 0 },
          { loading: true, now: 120 },
          { loading: true, now: 200 },
        ],
        { delay: 200 },
      ),
    ).toEqual([
      { visible: false, wait: 200 },
      { visible: false, wait: 80 },
      { visible: true, wait: null },
    ]);
  });

  /** The flash this exists to prevent: data that arrives inside the delay. */
  it('never paints at all when the data arrives before the delay elapses', () => {
    expect(
      replay(
        [
          { loading: true, now: 0 },
          { loading: false, now: 80 },
        ],
        { delay: 200 },
      ),
    ).toEqual([
      { visible: false, wait: 200 },
      { visible: false, wait: null },
    ]);
  });

  it('holds a placeholder that did appear, and reveals when the hold expires', () => {
    expect(
      replay(
        [
          { loading: true, now: 0 },
          { loading: false, now: 100 },
          { loading: false, now: 400 },
        ],
        { minDuration: 400 },
      ),
    ).toEqual([
      { visible: true, wait: null },
      { visible: true, wait: 300 },
      { visible: false, wait: null },
    ]);
  });

  /**
   * The hold is measured from the moment the placeholder appeared, not from
   * the moment loading began, or a delayed placeholder would be revealed
   * before it had been on screen for the duration the consumer asked for.
   */
  it('measures the hold from the paint rather than from the request', () => {
    expect(
      replay(
        [
          { loading: true, now: 0 },
          { loading: true, now: 200 },
          { loading: false, now: 300 },
          { loading: false, now: 600 },
        ],
        { delay: 200, minDuration: 400 },
      ),
    ).toEqual([
      { visible: false, wait: 200 },
      { visible: true, wait: null },
      { visible: true, wait: 300 },
      { visible: false, wait: null },
    ]);
  });

  /** A second load starts its own delay rather than inheriting the first's. */
  it('starts the wait again for the next load', () => {
    expect(
      replay(
        [
          { loading: true, now: 0 },
          { loading: true, now: 300 },
          { loading: false, now: 400 },
          { loading: true, now: 500 },
          { loading: true, now: 600 },
        ],
        { delay: 200 },
      ),
    ).toEqual([
      { visible: false, wait: 200 },
      { visible: true, wait: null },
      { visible: false, wait: null },
      { visible: false, wait: 200 },
      { visible: false, wait: 100 },
    ]);
  });

  /**
   * A value reaches this from a template or a provider, where `NaN` is one
   * typo away. A placeholder that never appears is a harder defect to find
   * than one that appears immediately, so the bad value is read as zero.
   */
  it('reads a nonsense duration as none rather than as forever', () => {
    expect(replay([{ loading: true, now: 0 }], { delay: Number.NaN, minDuration: -50 })).toEqual([
      { visible: true, wait: null },
    ]);
  });
});
