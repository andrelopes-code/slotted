import { initialLoadingVisibility, nextLoadingVisibility } from '@slotted/core/loading';
import type { LoadingVisibilityState } from '@slotted/core/loading';
import { useEffect, useRef, useState } from 'react';

/**
 * Drives the shared timing machine from React's clock.
 *
 * The first answer is computed during render rather than in an effect, because
 * an effect would paint one frame of the wrong state: with no delay set — the
 * default — a placeholder would flash absent for a frame on every mount, which
 * is the defect this whole mechanism exists to prevent, reintroduced by the
 * mechanism itself.
 *
 * A timer is scheduled only when the machine asks for one, so an application
 * that sets neither duration pays for no timer at all.
 */
export function useLoadingVisibility({
  delay,
  loading,
  minDuration,
}: {
  delay: number;
  loading: boolean;
  minDuration: number;
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

  return answer.state.visible;
}
