/**
 * The order of events a tour runs through, for both bindings.
 *
 * A binding owns the two values — whether the tour is open and which step is
 * current — and this owns what happens between a reader pressing Next and a
 * card appearing: which step that is, the wait while it prepares, and what a
 * press made during that wait replaces. A move is a request, as everywhere in
 * the library; the controller asks, and shows the step only once the binding
 * reports the value through `sync`, which is how a controlled consumer that
 * refuses a step keeps the card where it was.
 */

import { resolveStep } from './tour';
import type { ResolvedStep, TourMissing, TourStepShape } from './tour';

export type TourOutcome = 'complete' | 'skip' | 'close' | 'unavailable';

export type TourNavigationReason = 'pointer' | 'keyboard' | 'programmatic';

export interface TourControllerSettings {
  readonly missing: TourMissing;
  readonly targetTimeout: number;
  readonly document?: Document | undefined;
}

export interface TourControllerOptions<Step extends TourStepShape> {
  steps: () => readonly Step[];
  settings: () => TourControllerSettings;
  /** The step to draw, with its target. */
  onShow: (resolved: ResolvedStep<Step>) => void;
  /** A navigation is waiting on `prepare` or on a target. */
  onPending: (pending: boolean) => void;
  /** Asks the binding to make `id` current. The binding answers through `sync`. */
  requestStep: (id: string, reason: TourNavigationReason, source?: unknown) => void;
  /** Asks the binding to close the tour. */
  requestClose: (outcome: TourOutcome, reason: TourNavigationReason, source?: unknown) => void;
}

export interface TourController<Step extends TourStepShape> {
  /** The step on screen now, or `null` before the first one resolves. */
  readonly shown: ResolvedStep<Step> | null;
  /** The binding's current id changed, or the tour opened. `null` is the first step. */
  sync: (id: string | null) => void;
  next: (reason: TourNavigationReason, source?: unknown) => void;
  prev: (reason: TourNavigationReason, source?: unknown) => void;
  goTo: (id: string, reason: TourNavigationReason, source?: unknown) => void;
  /** The shown step's target left the document: the step stays, centred. */
  markMissing: () => void;
  /** Forgets the shown step, for a tour that closed and may open again. */
  reset: () => void;
  destroy: () => void;
}

export function createTourController<Step extends TourStepShape>(
  options: TourControllerOptions<Step>,
): TourController<Step> {
  let shown: ResolvedStep<Step> | null = null;
  /** A step resolved and asked for, not yet reported back through `sync`. */
  let candidate: ResolvedStep<Step> | null = null;
  let navigation: AbortController | null = null;
  let destroyed = false;

  const show = (resolved: ResolvedStep<Step>) => {
    shown = resolved;
    candidate = null;
    options.onShow(resolved);
  };

  /**
   * Runs one resolution, abandoning whichever one was in flight: a press made
   * while the next step prepares replaces it, rather than queueing behind it.
   */
  const run = (
    plan: Parameters<typeof resolveStep<Step>>[1],
    done: (resolved: ResolvedStep<Step> | null) => void,
  ) => {
    if (destroyed) return;
    navigation?.abort();
    const controller = new AbortController();
    navigation = controller;
    const settings = options.settings();
    options.onPending(true);

    void resolveStep(options.steps(), {
      ...plan,
      missing: settings.missing,
      targetTimeout: settings.targetTimeout,
      signal: controller.signal,
      ...(settings.document ? { document: settings.document } : {}),
    }).then((resolved) => {
      if (controller.signal.aborted || destroyed) return;
      navigation = null;
      options.onPending(false);
      done(resolved);
    });
  };

  const move = (resolved: ResolvedStep<Step>, reason: TourNavigationReason, source?: unknown) => {
    candidate = resolved;
    options.requestStep(resolved.step.id, reason, source);
  };

  return {
    get shown() {
      return shown;
    },

    sync(id) {
      if (destroyed) return;
      if (id !== null && shown?.step.id === id) return;
      if (id !== null && candidate?.step.id === id) {
        show(candidate);
        return;
      }
      run(id === null ? { from: null, direction: 1 } : { at: id, direction: 1 }, (resolved) => {
        if (resolved === null) {
          options.requestClose('unavailable', 'programmatic');
          return;
        }
        if (resolved.step.id !== id) {
          /* The named step was unavailable, or none was named: the value moves
             to the step that will actually be shown. */
          move(resolved, 'programmatic');
          return;
        }
        show(resolved);
      });
    },

    next(reason, source) {
      const from = shown?.step.id ?? null;
      run({ from, direction: 1 }, (resolved) => {
        if (resolved === null) options.requestClose('complete', reason, source);
        else move(resolved, reason, source);
      });
    },

    prev(reason, source) {
      const from = shown?.step.id ?? null;
      if (from === null) return;
      run({ from, direction: -1 }, (resolved) => {
        if (resolved !== null) move(resolved, reason, source);
      });
    },

    goTo(id, reason, source) {
      run({ at: id, direction: 1 }, (resolved) => {
        if (resolved !== null) move(resolved, reason, source);
      });
    },

    markMissing() {
      if (shown === null || shown.target === null) return;
      show({ ...shown, target: null, missing: true });
    },

    reset() {
      navigation?.abort();
      navigation = null;
      shown = null;
      candidate = null;
    },

    destroy() {
      destroyed = true;
      navigation?.abort();
      navigation = null;
    },
  };
}
