import { parseDuration } from '../dashboard-grid/flip';

/**
 * A number that moves from the value it showed to the one it holds now,
 * instead of being replaced in one frame, so a reader sees that a figure
 * changed and in which direction.
 *
 * The timing is the theme's: `--slotted-duration-long` and
 * `--slotted-easing-standard`, read on `element`. The curve is the platform's
 * own, a Web Animation with no keyframes whose eased progress is read on each
 * frame, so no easing is reimplemented here. A duration of 1ms or less, which
 * is what the theme resolves under reduced motion, and a platform without Web
 * Animations both move to the final number in one step.
 */

export interface PlayCountOptions {
  /** The element whose theme the timing is read from. */
  element: Element;
  from: number;
  to: number;
  /** Called on every frame with the number to draw, and last with `to`. */
  onFrame: (value: number) => void;
}

/** Plays the count and returns the function that stops it where it is. */
export function playCount({ element, from, onFrame, to }: PlayCountOptions): () => void {
  const view = element.ownerDocument.defaultView;
  const style = view?.getComputedStyle(element);
  const duration = parseDuration(style?.getPropertyValue('--slotted-duration-long') ?? '');
  const easing = style?.getPropertyValue('--slotted-easing-standard').trim() || 'ease';

  if (duration <= 1 || view === null || typeof element.animate !== 'function') {
    onFrame(to);

    return () => {};
  }

  const clock = element.animate([], { duration, easing });
  const places = Math.max(decimals(from), decimals(to));
  let frame = 0;

  function tick() {
    const progress = clock.effect?.getComputedTiming().progress;

    if (clock.playState === 'finished' || progress === null || progress === undefined) {
      frame = 0;
      onFrame(to);
      return;
    }

    onFrame(Number((from + (to - from) * progress).toFixed(places)));
    frame = view!.requestAnimationFrame(tick);
  }

  frame = view.requestAnimationFrame(tick);

  return () => {
    if (frame !== 0) view.cancelAnimationFrame(frame);
    clock.cancel();
  };
}

/** How many decimal places a number is written with, so a count between two whole numbers stays whole. */
export function decimals(value: number): number {
  const [, fraction = ''] = String(value).split('.');

  return Math.min(fraction.length, 20);
}
