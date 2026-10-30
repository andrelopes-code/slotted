/**
 * Which option a key moves the highlight to.
 *
 * Written against Select and Combobox, the collection engine's first real
 * callers. Both keep DOM focus on their own control and mark the highlighted
 * option with `aria-activedescendant`, so `packages/core/src/focus/arrow-navigation`
 * — which moves real focus — cannot serve them. What is left is arithmetic over
 * an enabled mask, and arithmetic is what this module holds.
 *
 * The mask rather than the items: this function has no opinion about what an
 * option is, which is the rule `collection.ts` states in its own header and the
 * reason `listbox`, `multi-select` and `tree` can each keep their own item type.
 *
 * Nothing here touches the DOM or a framework.
 */

/** How far a key asks the highlight to travel. */
export type MoveIntent = 'first' | 'last' | 'next' | 'previous' | 'pageDown' | 'pageUp';

export interface MoveIndexInput {
  /** One entry per option, in document order: whether it can be highlighted. */
  enabled: readonly boolean[];
  /** Where the highlight is now, or `-1` when there is none. */
  from: number;
  /** What the key asked for. */
  intent: MoveIntent;
  /**
   * Whether `next` past the end returns to the start. Both callers default it
   * to `false`: the APG's select-only example does not wrap, and a list of two
   * hundred options that jumps from the last to the first loses the reader.
   */
  loop?: boolean;
  /**
   * How many options a page key travels. Ten, which is the number the APG's
   * select-only combobox example states for `PageUp` and `PageDown`.
   */
  page?: number;
}

/** The page a page key travels, and the number the APG example names. */
export const PAGE_STEP = 10;

const nextEnabled = (enabled: readonly boolean[], from: number, step: 1 | -1, loop: boolean) => {
  const size = enabled.length;
  for (let taken = 1; taken <= size; taken += 1) {
    const raw = from + step * taken;
    if (!loop && (raw < 0 || raw >= size)) return -1;
    const index = ((raw % size) + size) % size;
    if (enabled[index] === true) return index;
  }
  return -1;
};

const edge = (enabled: readonly boolean[], step: 1 | -1) => {
  const start = step === 1 ? 0 : enabled.length - 1;
  if (enabled[start] === true) return start;
  return nextEnabled(enabled, start, step, false);
};

/**
 * The index the highlight moves to, or `-1` when nothing is reachable.
 *
 * An empty collection, a collection whose every option is disabled, and a
 * collection still loading all return `-1`, and none of the three is a caller
 * error: each is a list with nothing to highlight, and the caller's answer to
 * all three is the same — write no `aria-activedescendant`.
 *
 * A `from` outside the collection is treated as no highlight at all, which is
 * what a caller holds for one render after its list has been replaced by a
 * shorter one.
 */
export function moveIndex({
  enabled,
  from,
  intent,
  loop = false,
  page = PAGE_STEP,
}: MoveIndexInput): number {
  const size = enabled.length;
  if (size === 0) return -1;

  const current = from >= 0 && from < size ? from : -1;

  if (intent === 'first') return edge(enabled, 1);
  if (intent === 'last') return edge(enabled, -1);

  if (intent === 'next') {
    return current === -1 ? edge(enabled, 1) : nextEnabled(enabled, current, 1, loop);
  }
  if (intent === 'previous') {
    return current === -1 ? edge(enabled, -1) : nextEnabled(enabled, current, -1, loop);
  }

  /**
   * A page never wraps, whatever `loop` says, and lands on the nearest enabled
   * option at or before the target rather than skipping past it. A page key
   * that wrapped would move the reader a screen and a list in one press.
   */
  const step = intent === 'pageDown' ? 1 : -1;
  const anchor = current === -1 ? (step === 1 ? -1 : size) : current;
  const target = Math.min(Math.max(anchor + step * page, 0), size - 1);

  if (enabled[target] === true) return target;
  const inward = nextEnabled(enabled, target, step === 1 ? -1 : 1, false);
  if (inward !== -1 && inward !== current) return inward;
  const outward = nextEnabled(enabled, target, step, false);
  return outward !== -1 ? outward : edge(enabled, step);
}
