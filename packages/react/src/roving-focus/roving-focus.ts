import { isNavigationDisabled } from '@slotted/core/focus';
import { useCallback, useRef } from 'react';
import type { KeyboardEvent, RefCallback, RefObject } from 'react';

export interface RovingFocusOptions {
  /** The axis the arrows travel: the block axis for `vertical`, the reading direction for `horizontal`. */
  orientation: 'vertical' | 'horizontal';
  /** Wraps past the ends. Default `true`; a list that exits to the trigger does not wrap at that end. */
  loop?: boolean | undefined;
  /**
   * The end of the list that hands focus back to the trigger: the arrow that
   * moves past the first item (`'start'`) or past the last (`'end'`) focuses
   * the trigger instead of wrapping. `false`, the default, has no such end.
   */
  exitToTrigger?: 'start' | 'end' | false | undefined;
  /**
   * The items are laid out against the order the arrows count in, as a speed
   * dial rises out of its trigger: item `0` is the one nearest the trigger and
   * the key that moves away from it is the one that points that way. Swaps
   * the two arrows of the axis.
   */
  reverse?: boolean | undefined;
  /** The control that opened the list: `Escape` and `exitToTrigger` give focus back to it. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Asked for by `Escape` and by `Tab`; the application closes the list. */
  onClose: () => void;
}

export interface RovingFocus {
  /** Spread on item `index`: it takes no tab stop of its own and registers for the arrows. */
  getItemProps: (index: number) => { ref: RefCallback<HTMLElement>; tabIndex: -1 };
  /** Spread on the element that contains the items. */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Focuses the first item a reader can act on, which is where a list opened by the keyboard starts. */
  focusFirst: () => void;
}

const AXIS = {
  vertical: { next: 'ArrowDown', previous: 'ArrowUp' },
  horizontal: { next: 'ArrowRight', previous: 'ArrowLeft' },
} as const;

/**
 * The keyboard model of a menu for a list the application draws itself: items
 * outside the tab sequence, the arrows of the axis moving between them,
 * `Home` and `End` going to the ends, `Escape` closing and giving focus back
 * to the trigger, and `Tab` closing. It follows the ring rules of the arrow
 * engine the menu family runs on (`createArrowNavigation` in
 * `@slotted/core/focus`) — a disabled item is skipped, one carrying
 * `aria-disabled` stays in the ring, the horizontal axis follows the reading
 * direction — and is reached through props instead of a selector, for a
 * surface the menu's positioned layer cannot be.
 */
export function useRovingFocus({
  exitToTrigger = false,
  loop = true,
  onClose,
  orientation,
  reverse = false,
  triggerRef,
}: RovingFocusOptions): RovingFocus {
  const items = useRef(new Map<number, HTMLElement>());
  const latest = useRef({ exitToTrigger, loop, onClose, orientation, reverse });
  latest.current = { exitToTrigger, loop, onClose, orientation, reverse };

  const ordered = () =>
    [...items.current.entries()].sort(([a], [b]) => a - b).map(([, element]) => element);

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (element: HTMLElement | null) => {
        if (element === null) items.current.delete(index);
        else items.current.set(index, element);
      },
      tabIndex: -1 as const,
    }),
    [],
  );

  const focusAt = (list: readonly HTMLElement[], from: number, step: 1 | -1, wrap: boolean) => {
    let index = from;
    for (let taken = 0; taken < list.length; taken += 1) {
      index += step;
      if (index < 0 || index >= list.length) {
        if (!wrap) return false;
        index = (index + list.length) % list.length;
      }
      const item = list[index]!;
      if (!isNavigationDisabled(item, true)) {
        item.focus();
        return true;
      }
    }
    return false;
  };

  const focusFirst = useCallback(() => {
    const list = ordered();
    const first = list.find((item) => !isNavigationDisabled(item, true)) ?? list[0];
    first?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const options = latest.current;
    const trigger = triggerRef.current;

    if (event.key === 'Escape') {
      event.preventDefault();
      options.onClose();
      trigger?.focus();
      return;
    }
    if (event.key === 'Tab') {
      options.onClose();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const list = ordered();
    if (list.length === 0) return;
    const rtl =
      options.orientation === 'horizontal' &&
      event.currentTarget.ownerDocument.defaultView?.getComputedStyle(event.currentTarget)
        .direction === 'rtl';
    const axis = AXIS[options.orientation];
    const forward = rtl ? axis.previous : axis.next;
    const backward = rtl ? axis.next : axis.previous;
    const toward = options.reverse
      ? ({ next: backward, previous: forward } as const)
      : ({ next: forward, previous: backward } as const);
    const from = list.findIndex((item) => item.contains(event.target as Node));

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (event.key === 'Home') focusAt(list, -1, 1, false);
      else focusAt(list, list.length, -1, false);
      return;
    }
    if (event.key !== toward.next && event.key !== toward.previous) return;

    event.preventDefault();
    const step = event.key === toward.next ? 1 : -1;
    const edge = step === 1 ? 'end' : 'start';
    const past = from === -1 ? false : step === 1 ? from === list.length - 1 : from === 0;
    if (past && options.exitToTrigger === edge && trigger !== null) {
      trigger.focus();
      return;
    }
    focusAt(list, from === -1 ? (step === 1 ? -1 : list.length) : from, step, options.loop);
  };

  return { focusFirst, getItemProps, onKeyDown };
}
