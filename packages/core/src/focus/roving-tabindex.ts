import { createArrowNavigation, isNavigationDisabled } from './arrow-navigation';
import type { ArrowNavigationOptions, Direction, Orientation } from './arrow-navigation';

export type { Direction, Orientation };

/** Everything the movement engine takes, minus the origin the stop supplies. */
export type RovingTabindexOptions = Omit<ArrowNavigationOptions, 'origin'>;

export interface RovingTabindexHandle {
  /** Removes the listener and leaves every item as it stands. */
  destroy: () => void;
  /** Re-reads the item list after one is added or removed. */
  refresh: () => void;
  /** Moves the tab stop without moving focus. */
  setActive: (index: number) => void;
}

/**
 * One tab stop for a whole collection, and the arrow keys that move it.
 *
 * The movement is `createArrowNavigation`'s, and everything this adds is the
 * tab stop: which item carries `tabindex="0"` while every other carries `-1`.
 * The two were one function until `accordion` needed the movement without the
 * stop — the APG keeps every accordion header in the page tab sequence — and
 * splitting them was cheaper than a second copy of the stepping rules, the
 * direction mirroring and the disabled skipping.
 */
export function createRovingTabindex(
  container: HTMLElement,
  options: RovingTabindexOptions,
): RovingTabindexHandle {
  let activeIndex = 0;

  const navigation = createArrowNavigation(container, {
    ...options,
    origin: () => activeIndex,
    onMove: (index, item) => {
      activeIndex = index;
      applyTabindex();
      options.onMove?.(index, item);
    },
  });

  function applyTabindex() {
    for (const [index, item] of navigation.items().entries()) {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    }
  }

  /** Zero rather than -1: a collection of only disabled items still has a stop. */
  function firstEnabled() {
    const index = navigation.firstEnabled();
    return index === -1 ? 0 : index;
  }

  activeIndex = firstEnabled();
  applyTabindex();

  return {
    destroy: navigation.destroy,
    refresh: () => {
      navigation.refresh();
      if (activeIndex >= navigation.items().length) activeIndex = firstEnabled();
      applyTabindex();
    },
    setActive: (index) => {
      navigation.refresh();
      if (index < 0 || index >= navigation.items().length) return;
      activeIndex = index;
      applyTabindex();
    },
  };
}

export { isNavigationDisabled };
