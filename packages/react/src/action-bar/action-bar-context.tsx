import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { ActionBarPriority } from './action-bar.types';

/**
 * One action the surface holds, in the order the bar holds it.
 *
 * `separatorBefore` is derived rather than declared: the bar is the participant
 * that hid the units, so it is the only one that knows which of its own rules
 * are now dividing two things that are both in the surface.
 */
export interface ActionBarSurfaceUnit {
  readonly id: string;
  readonly separatorBefore: boolean;
}

export interface ActionBarOverflowValue {
  /**
   * Records what an action becomes in the surface. It is called during render
   * and keyed by an identifier rather than by the element, because the element
   * is not known until the ref callback runs and a consumer may put the trigger
   * anywhere in the run — including before an action, where a registration made
   * in an effect would be one render behind.
   */
  declare: (id: string, counterpart: ReactNode) => void;
  release: (id: string) => void;
  /** What the action with this identifier becomes. */
  counterpart: (id: string) => ReactNode;
  /** The control that opens what did not fit. The bar measures it. */
  registerTrigger: (element: HTMLElement | null) => void;
  /** The run, which is the box the collapse measures rather than the root. */
  registerActions: (element: HTMLElement | null) => void;
  /** What the surface holds: the collapsed actions and every `always` one. */
  surface: readonly ActionBarSurfaceUnit[];
}

const NOTHING: ActionBarOverflowValue = {
  counterpart: () => null,
  declare: () => undefined,
  registerActions: () => undefined,
  registerTrigger: () => undefined,
  release: () => undefined,
  surface: [],
};

export const ActionBarOverflowContext = createContext<ActionBarOverflowValue>(NOTHING);

/**
 * What an action and the trigger both read. A part rendered outside a bar takes
 * the empty value rather than throwing: an `ActionBar.Action` around a control
 * in a page that is not a bar is a box, and a box is a reasonable thing to be.
 */
export function useActionBarOverflow() {
  return useContext(ActionBarOverflowContext);
}

/** The attribute that says an action has somewhere to go. */
export const UNIT_ATTRIBUTE = 'data-unit';

/** The attribute the measurement reads a rank from. */
export const PRIORITY_ATTRIBUTE = 'data-priority';

/**
 * The custom property the stacking query raises, read back by the measurement.
 *
 * The breakpoint is literal because `@container (width < var(--x))` is invalid,
 * and it is written once — in the stylesheet. The binding asks CSS what it
 * decided rather than comparing widths of its own, so the layout and the
 * measurement cannot disagree about where the bar becomes a column.
 */
export const STACK_PROPERTY = '--_stacked';

/**
 * Where each rank stands in the order of giving way: the lowest goes first, and
 * position decides inside one rank. `pinned` is absent because a pinned unit
 * never gives way at all, and `always` because it is never in the bar to give.
 */
export const RANK: Readonly<Record<ActionBarPriority, number>> = Object.freeze({
  always: 0,
  hide: 0,
  high: 2,
  low: 1,
  pinned: 0,
});

/**
 * The rank an action ends up at.
 *
 * A rank that needs somewhere to go and has nowhere behaves as `pinned`. It is a
 * consumer error, and failing where it can be seen — the control stays in the
 * bar — is the choice `docs/build-briefing.md` asks for when two answers are
 * defensible.
 */
export function resolvePriority(
  stated: ActionBarPriority | undefined,
  hasCounterpart: boolean,
): ActionBarPriority {
  if (stated === undefined) return hasCounterpart ? 'low' : 'pinned';
  if (stated === 'hide' || stated === 'pinned') return stated;
  return hasCounterpart ? stated : 'pinned';
}
