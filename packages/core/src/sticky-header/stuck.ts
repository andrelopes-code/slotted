import { findScrollParent } from './sticky-header';

const px = (value: string) => Number.parseFloat(value) || 0;

/**
 * Reports whether a sticky header is held below the parent's first content
 * edge, which is when content scrolls under it. That edge is the parent's top
 * plus its border and padding: a header sticks at that line or above it, and
 * only a header lower than it has the parent's content passing under. A
 * negative block-start margin on the header, which moves it above the line at
 * rest, is not counted.
 *
 * Measured on the frame after a scroll of the nearest scroller, or of the
 * window, and after a resize of either box. Nothing is read while this is
 * called: the first measurement waits for a frame, so mounting forces no
 * layout. Returns the function that stops observing.
 */
export function observeStuck(header: HTMLElement, onChange: (stuck: boolean) => void): () => void {
  const root = header.parentElement;
  const view = header.ownerDocument.defaultView;
  if (root === null || view === null) return () => {};

  const scrollSource: EventTarget = findScrollParent(header) ?? view;
  let current = false;
  let frame = 0;

  function measure() {
    frame = 0;
    const own = view!.getComputedStyle(root!);
    const edge =
      root!.getBoundingClientRect().top + px(own.borderBlockStartWidth) + px(own.paddingBlockStart);
    const next = header.getBoundingClientRect().top - edge > 0.5;
    if (next === current) return;
    current = next;
    onChange(next);
  }

  function schedule() {
    if (frame === 0) frame = view!.requestAnimationFrame(measure);
  }

  scrollSource.addEventListener('scroll', schedule, { passive: true });
  const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  sizes?.observe(root);
  sizes?.observe(header);
  schedule();

  return () => {
    scrollSource.removeEventListener('scroll', schedule);
    sizes?.disconnect();
    if (frame !== 0) view.cancelAnimationFrame(frame);
  };
}

/**
 * `data-stuck` on every element inside `container` that `selector` matches,
 * each measured by `observeStuck` against its own parent. Elements added or
 * removed later are picked up, so a list whose groups change as the reader
 * types keeps every label marked. Returns the function that stops observing
 * and removes the attribute.
 */
export function markStuckWithin(container: HTMLElement, selector: string): () => void {
  const stops = new Map<HTMLElement, () => void>();

  function release(element: HTMLElement) {
    stops.get(element)?.();
    stops.delete(element);
    element.removeAttribute('data-stuck');
  }

  function sync() {
    const found = new Set(container.querySelectorAll<HTMLElement>(selector));

    for (const element of [...stops.keys()]) {
      if (!found.has(element)) release(element);
    }

    for (const element of found) {
      if (stops.has(element)) continue;
      const stop = observeStuck(element, (stuck) => element.toggleAttribute('data-stuck', stuck));
      stops.set(element, stop);
    }
  }

  const view = container.ownerDocument.defaultView;
  const mutations = view?.MutationObserver === undefined ? null : new view.MutationObserver(sync);

  mutations?.observe(container, { childList: true, subtree: true });
  sync();

  return () => {
    mutations?.disconnect();
    for (const element of [...stops.keys()]) release(element);
  };
}
