import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * One unit that gave way, in the order the bar held it.
 *
 * `separatorBefore` is derived rather than declared: the bar is the participant
 * that hid the units, so it is the only one that knows which of its own rules
 * are now dividing two things that are both in the surface. Fluent asks the
 * consumer to wire the same outcome with `useIsOverflowGroupVisible`.
 */
export interface ToolbarCollapsedUnit {
  readonly id: string;
  readonly separatorBefore: boolean;
}

export interface ToolbarOverflowValue {
  /**
   * Records what a unit becomes in the surface. It is called during render and
   * keyed by an identifier rather than by the element, because the element is
   * not known until the ref callback runs and a consumer may put the trigger
   * anywhere in the bar — including before an item, where a registration made
   * in an effect would be one render behind.
   */
  declare: (id: string, overflow: ReactNode) => void;
  release: (id: string) => void;
  /** What the unit with this identifier becomes. */
  counterpart: (id: string) => ReactNode;
  /** The control that opens what did not fit. The bar measures it. */
  registerTrigger: (element: HTMLElement | null) => void;
  /** The units that gave way, in the order the bar held them. */
  collapsed: readonly ToolbarCollapsedUnit[];
  /** The axis the controls run along, which a separator stands across. */
  orientation: 'horizontal' | 'vertical';
}

const NOTHING: ToolbarOverflowValue = {
  collapsed: [],
  counterpart: () => null,
  declare: () => undefined,
  orientation: 'horizontal',
  registerTrigger: () => undefined,
  release: () => undefined,
};

export const ToolbarOverflowContext = createContext<ToolbarOverflowValue>(NOTHING);

/**
 * What a unit and the trigger both read. A part rendered outside a bar takes
 * the empty value rather than throwing: `ToolbarItem` around a control in a
 * page that is not a toolbar is a box, and a box is a reasonable thing to be.
 */
export function useToolbarOverflow() {
  return useContext(ToolbarOverflowContext);
}

/** The attribute that says a unit has somewhere to go. */
export const UNIT_ATTRIBUTE = 'data-unit';
