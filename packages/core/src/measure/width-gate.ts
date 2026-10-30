/**
 * A control that is too narrow for what it would rather show, and the one
 * question it has to answer: is it under the width the family named.
 *
 * `select` and `combobox` preview several chosen values as chips (SL4/CB4).
 * Under about a hundred and twenty pixels a chip is a shape with no room for a
 * word in it, so the preview becomes a sentence — "3 selected" — instead. The
 * threshold is a width, not a count, so it cannot be derived from what fits:
 * a control narrow enough to hold one chip of one character still has to be
 * told that a chip is the wrong answer there.
 *
 * A container query would say the same thing in the stylesheet and was not
 * used: the container has to be the control, and `container-type: inline-size`
 * makes an element's inline size stop depending on its contents — which is
 * exactly how a select that is not `fullWidth` is measured.
 *
 * Nothing here is framework-specific and nothing is imported from this
 * repository: it is a ResizeObserver, a number and a callback.
 */

export interface WidthGateOptions {
  /** The width, in CSS pixels, below which the gate is closed. */
  at: number;
  /** Called with the new answer, and only when the answer changes. */
  onChange: (narrow: boolean) => void;
}

export interface WidthGateHandle {
  /** Releases the observer. The last answer stands. */
  destroy: () => void;
  /** Measures again, after something outside the element's own box moved it. */
  refresh: () => void;
  /** Whether the element is currently under the width. */
  narrow: () => boolean;
}

/**
 * Watches `element` and reports whether its border box is under `at`.
 *
 * The first answer is reported synchronously, so a caller never paints one
 * frame of the wrong preview. Where `ResizeObserver` does not exist — a server
 * render, a test environment without layout — the element measures nought and
 * the gate stays open, because a preview that is present is recoverable and
 * one that was never rendered is not.
 */
export function createWidthGate(element: HTMLElement, options: WidthGateOptions): WidthGateHandle {
  let narrow = false;

  function measure() {
    const width = element.getBoundingClientRect?.().width ?? 0;
    /* Nought is "not measured yet", not "narrower than anything". */
    return width > 0 && width < options.at;
  }

  function refresh() {
    const next = measure();
    if (next === narrow) return;
    narrow = next;
    options.onChange(narrow);
  }

  const sizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(refresh);
  sizes?.observe(element);
  refresh();

  return {
    destroy: () => sizes?.disconnect(),
    narrow: () => narrow,
    refresh,
  };
}
