import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import { useEffect, useRef, useState } from 'react';

/**
 * Drives the shared timing machine from React's clock, and reports the moment
 * an indicator that was painted is withdrawn.
 *
 * The first answer is computed during render rather than in an effect, because
 * an effect would paint one frame of the wrong state: with no delay set — the
 * default — an indicator would flash absent for a frame on every mount, which
 * is the defect this whole mechanism exists to prevent, reintroduced by the
 * mechanism itself. `skeleton` recorded the finding for the same machine.
 *
 * A timer is scheduled only when the machine asks for one, so an application
 * that sets neither duration pays for no timer at all.
 */
export function useLoadingVisibility({
  delay,
  loading,
  minDuration,
  onWithdraw,
}: {
  delay: number;
  loading: boolean;
  minDuration: number;
  onWithdraw?: (() => void) | undefined;
}): boolean {
  const state = useRef<LoadingVisibilityState>(initialLoadingVisibility);
  const [, retick] = useState(0);

  const answer = nextLoadingVisibility({
    delay,
    loading,
    minDuration,
    now: Date.now(),
    state: state.current,
  });
  state.current = answer.state;

  const { wait } = answer;
  useEffect(() => {
    if (wait === null) return undefined;
    const timer = setTimeout(() => retick((tick) => tick + 1), wait);
    return () => clearTimeout(timer);
  }, [wait, loading]);

  /**
   * The withdrawal, not the prop. With `minDuration` holding, `loading` turns
   * false well before the indicator leaves, and an application unmounting on
   * the prop would take the indicator down mid-hold.
   */
  const painted = answer.state.visible;
  const wasPainted = useRef(painted);
  useEffect(() => {
    if (wasPainted.current && !painted) onWithdraw?.();
    wasPainted.current = painted;
  }, [painted, onWithdraw]);

  return painted;
}
