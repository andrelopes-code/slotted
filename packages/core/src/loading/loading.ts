/**
 * When a placeholder is actually painted, which is not the same question as
 * whether data has arrived.
 *
 * Two things go wrong with the naive answer. Data that arrives in eighty
 * milliseconds draws a placeholder that appears and vanishes — a flash, and
 * worse than having shown nothing. And a placeholder that did appear and is
 * taken away thirty milliseconds later is the same flash in reverse, with the
 * page jumping twice for one load.
 *
 * `delay` answers the first: nothing is painted until the wait has lasted long
 * enough to be worth reporting. `minDuration` answers the second: once
 * painted, the placeholder is held. Neither library surveyed while `skeleton`
 * was rebuilt ships either.
 *
 * The rule lives here rather than in a binding because both bindings need it
 * and a difference between them would be invisible: the same `loading` prop
 * would reveal at two different moments in React and Angular, and no test that
 * looked at either alone would say so.
 */

/** What the machine carries between calls. Opaque to a consumer. */
export interface LoadingVisibilityState {
  /** Whether the placeholder is painted right now. */
  readonly visible: boolean;
  /** When the placeholder was painted, in the caller's clock. */
  readonly shownAt: number | null;
  /** When loading began, in the caller's clock. */
  readonly startedAt: number | null;
}

export interface LoadingVisibilityRequest {
  /** The consumer's fact: whether the data is still on its way. */
  readonly loading: boolean;
  /** How long the wait has to last before anything is painted. */
  readonly delay: number;
  /** How long a painted placeholder is held once it has appeared. */
  readonly minDuration: number;
  /** The caller's clock, in milliseconds. */
  readonly now: number;
  readonly state: LoadingVisibilityState;
}

export interface LoadingVisibility {
  readonly state: LoadingVisibilityState;
  /**
   * How long until this answer changes, in milliseconds, or `null` when
   * nothing is pending. A caller schedules exactly one timer from it, and
   * schedules none at all in the default configuration where both durations
   * are zero.
   */
  readonly wait: number | null;
}

export const initialLoadingVisibility: LoadingVisibilityState = {
  visible: false,
  shownAt: null,
  startedAt: null,
};

const settled = (state: LoadingVisibilityState): LoadingVisibility => ({ state, wait: null });

/**
 * The next answer, and how long it stands for. Pure: the caller owns the clock
 * and the timer, which is what lets a hook, a signal effect and a test drive
 * the same rule.
 *
 * A negative or non-finite duration is read as zero rather than rejected. The
 * value reaches this from a template or a provider, where `NaN` is one typo
 * away, and a placeholder that never appears is a harder defect to find than
 * one that appears immediately.
 */
export function nextLoadingVisibility({
  loading,
  delay,
  minDuration,
  now,
  state,
}: LoadingVisibilityRequest): LoadingVisibility {
  const hold = Math.max(0, Number.isFinite(minDuration) ? minDuration : 0);
  const wait = Math.max(0, Number.isFinite(delay) ? delay : 0);

  if (loading) {
    if (state.visible) return settled(state);

    const startedAt = state.startedAt ?? now;
    const waited = now - startedAt;
    if (waited >= wait) {
      return settled({ visible: true, shownAt: now, startedAt });
    }
    return { state: { ...state, visible: false, startedAt }, wait: wait - waited };
  }

  if (!state.visible) return settled(initialLoadingVisibility);

  const held = now - (state.shownAt ?? now);
  if (held >= hold) return settled(initialLoadingVisibility);
  return { state, wait: hold - held };
}
