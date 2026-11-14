import { isClipped } from './clip';

/**
 * Whether a row of labelled segments has to stand as a column to keep every
 * label whole, decided from the width the row has and the width its labels
 * need.
 *
 * The width the labels need is read only while the row is drawn: a label cut
 * by its segment reports the rest of its text as scroll width, so the row
 * needs `width + count * (widest overflow)` when its segments share the width
 * equally. Once the row is a column there is nothing left to read, so the
 * width it needed is kept, and the row returns only when it has that width.
 * The kept width only grows, so a row that returned too early and clipped
 * again asks for more the next time and the two arrangements do not flap.
 */

export interface CondenseState {
  /** Whether the segments stand as a column. */
  stacked: boolean;
  /** The inline size the row needs to keep every label whole, or 0 while unknown. */
  needed: number;
}

export interface CondenseInput extends CondenseState {
  /** The inline size the control has now. */
  width: number;
  /** How many segments share the row. */
  count: number;
  /** The widest overflow of a label, in pixels, read while the row is drawn; 0 when none is cut. */
  overflow: number;
}

export interface CondenseOptions {
  /** The labels to read, one per segment. */
  labels: () => readonly Element[];
  /** The arrangement changed. The binding draws the column, or the row back. */
  onChange: (stacked: boolean) => void;
}

export interface CondenseHandle {
  destroy: () => void;
}

export const NOT_STACKED: CondenseState = { stacked: false, needed: 0 };

/** The arrangement that keeps every label whole at `width`. */
export function condenseState({ count, needed, overflow, stacked, width }: CondenseInput) {
  if (stacked) {
    return width >= needed ? { stacked: false, needed } : { stacked, needed };
  }

  if (overflow <= 0) return { stacked, needed };

  return { stacked: true, needed: Math.max(needed, width + count * overflow) };
}

/**
 * Observes `root` and reports when its segments have to stand as a column. A
 * change to the text or the segments inside it forgets the width the labels
 * needed and reads the row again, so a label translated longer is measured.
 */
export function createCondense(root: HTMLElement, options: CondenseOptions): CondenseHandle {
  const view = root.ownerDocument.defaultView;
  let state = NOT_STACKED;
  let frame = 0;

  function measure() {
    frame = 0;
    const labels = options.labels();
    const overflow = state.stacked ? 0 : widestOverflow(labels);
    const next = condenseState({
      ...state,
      count: labels.length,
      overflow,
      width: root.clientWidth,
    });

    if (next.stacked !== state.stacked) options.onChange(next.stacked);

    state = next;
  }

  function schedule() {
    if (frame === 0 && view !== null) frame = view.requestAnimationFrame(measure);
  }

  function reset() {
    if (state.stacked) options.onChange(false);
    state = NOT_STACKED;
    schedule();
  }

  const sizes = view?.ResizeObserver === undefined ? null : new view.ResizeObserver(schedule);
  const edits = view?.MutationObserver === undefined ? null : new view.MutationObserver(reset);

  sizes?.observe(root);
  edits?.observe(root, { characterData: true, childList: true, subtree: true });
  schedule();

  return {
    destroy() {
      sizes?.disconnect();
      edits?.disconnect();
      if (frame !== 0) view?.cancelAnimationFrame(frame);
    },
  };
}

function widestOverflow(labels: readonly Element[]) {
  let widest = 0;

  for (const label of labels) {
    if (isClipped(label)) widest = Math.max(widest, label.scrollWidth - label.clientWidth);
  }

  return widest;
}
