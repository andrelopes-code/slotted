/**
 * What a stepped flow knows about itself, resolved once for both bindings.
 *
 * Four questions: what status one step is in, whether the reader may jump to
 * it, how far the flow has come, and where an arrow key moves focus. The last
 * one is here rather than in each binding because it is the only rule in the
 * family that has to mirror — in a right-to-left row the next step is to the
 * left — and a rule that has to mirror is exactly the rule two copies get
 * wrong in different ways.
 *
 * Nothing here touches the DOM or a framework.
 */

export type StepStatus = 'pending' | 'current' | 'complete';

export type StepOrientation = 'horizontal' | 'vertical';

export type StepDirection = 'ltr' | 'rtl';

export interface StepStatusInput {
  /** The step being read, zero-based. */
  index: number;
  /** The step the reader is on, zero-based. */
  step: number;
  /** Whether the consumer marked this step finished. */
  complete?: boolean | undefined;
  /**
   * Whether reaching a later step means the earlier ones are finished. Off by
   * default: walking past a step is not the same as completing it, and a
   * family that assumed otherwise would report work as done that never was.
   */
  autoComplete?: boolean | undefined;
}

export interface StepReachableInput extends StepStatusInput {
  /** How many steps the flow has. */
  count: number;
  /** Whether the flow must be taken in order. */
  linear?: boolean | undefined;
  /** Whether the consumer disabled this step outright. */
  disabled?: boolean | undefined;
  /** Whether an earlier step is finished. Asked only in a linear flow. */
  isComplete?: ((index: number) => boolean) | undefined;
}

export interface StepFocusInput {
  /** The step focus is on now, zero-based. */
  from: number;
  /** The key that was pressed. */
  key: string;
  count: number;
  orientation: StepOrientation;
  direction: StepDirection;
  /** Whether a step is out of reach and should be stepped over. */
  isDisabled?: ((index: number) => boolean) | undefined;
}

/**
 * `complete` is the consumer's fact, not the family's: only the consumer knows
 * whether the form on step two was actually saved. `autoComplete` is the
 * shorthand for the flow where reaching step three does mean the first two are
 * finished.
 */
export function stepStatus({ index, step, complete, autoComplete }: StepStatusInput): StepStatus {
  if (complete === true) return 'complete';
  if (index === step) return 'current';
  if (complete === false) return 'pending';
  return autoComplete === true && index < step ? 'complete' : 'pending';
}

/**
 * Whether the reader may move to a step by pressing its own header.
 *
 * A linear flow lets them reach the step they are on, any step behind it, and
 * the first step ahead whose predecessors are all finished. Anything further
 * would skip work the flow says is required. A non-linear flow reaches every
 * step the consumer has not disabled.
 */
export function stepReachable(input: StepReachableInput): boolean {
  const { index, step, count, disabled, linear, isComplete } = input;

  if (disabled === true) return false;
  if (index < 0 || index >= Math.max(0, Math.trunc(count))) return false;
  if (linear !== true) return true;
  if (index <= step) return true;

  const finished =
    isComplete ??
    ((candidate: number) =>
      stepStatus({ ...input, index: candidate, complete: undefined }) === 'complete');

  for (let earlier = 0; earlier < index; earlier += 1) {
    if (!finished(earlier)) return false;
  }
  return true;
}

/**
 * How far along the row the reader has travelled, as a percentage.
 *
 * It measures distance, not completion: a five-step flow has four connectors,
 * and reaching step three has filled two of them. So it is nought on the first
 * step and a hundred on the last, whether or not the last step is finished —
 * which is what the connector needs, because the connector is the thing
 * between two markers and there is none after the final one.
 *
 * A flow of one step has no connector at all and reads nought, rather than
 * dividing by nought.
 */
export function stepPercent({ step, count }: { step: number; count: number }): number {
  const total = Math.max(1, Math.trunc(count));
  if (total === 1) return 0;

  const reached = Math.min(Math.max(0, Math.trunc(step)), total - 1);
  return (reached / (total - 1)) * 100;
}

const KEYS_NEXT = new Set(['ArrowDown']);
const KEYS_PREVIOUS = new Set(['ArrowUp']);

/**
 * Where focus goes for an arrow, `Home` or `End`, or `-1` for a key this
 * family does not answer.
 *
 * The inline arrows follow the reading direction, which is what "the next
 * step" means in a row that runs the other way; the block arrows never mirror,
 * because `dir` does not mirror the block axis. A vertical stepper answers only
 * the block arrows and a horizontal one only the inline arrows, so an arrow
 * that means nothing in this orientation is left to the page.
 *
 * Movement wraps and steps over a disabled header. A wrap that landed on a
 * disabled step, or a flow whose every step is disabled, returns `-1` rather
 * than moving focus nowhere.
 */
export function stepFocusIndex({
  from,
  key,
  count,
  orientation,
  direction,
  isDisabled,
}: StepFocusInput): number {
  const total = Math.max(0, Math.trunc(count));
  if (total === 0) return -1;

  const disabled = isDisabled ?? (() => false);
  const seek = (start: number, delta: number) => {
    let index = start;
    for (let taken = 0; taken < total; taken += 1) {
      index = (index + delta + total) % total;
      if (!disabled(index)) return index;
    }
    return -1;
  };

  const edge = (delta: 1 | -1) => {
    const start = delta === 1 ? 0 : total - 1;
    for (let taken = 0; taken < total; taken += 1) {
      const index = start + delta * taken;
      if (!disabled(index)) return index;
    }
    return -1;
  };

  if (key === 'Home') return edge(1);
  if (key === 'End') return edge(-1);

  const mirrored = direction === 'rtl';
  const inlineNext = mirrored ? 'ArrowLeft' : 'ArrowRight';
  const inlinePrevious = mirrored ? 'ArrowRight' : 'ArrowLeft';

  const isNext = orientation === 'vertical' ? KEYS_NEXT.has(key) : key === inlineNext;
  const isPrevious = orientation === 'vertical' ? KEYS_PREVIOUS.has(key) : key === inlinePrevious;

  if (!isNext && !isPrevious) return -1;
  return seek(from, isNext ? 1 : -1);
}
