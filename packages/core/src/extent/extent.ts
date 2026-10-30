/**
 * How much of the space available to it a panel takes, and how a pointer or a
 * keyboard moves that number.
 *
 * The value is a **fraction of the layer**, in `[0, 1]`, rather than a length.
 * Three things follow from that and none of them holds for a length: the
 * WAI-ARIA Window Splitter pattern's `aria-valuenow`, `aria-valuemin` and
 * `aria-valuemax` are the fraction times a hundred, which is the range that
 * pattern calls typical; the limits and the snap points are the same kind of
 * number, so one clamp covers all three; and a keyboard step is a proportion,
 * so no caller carries a pixel literal.
 *
 * Nothing here touches the DOM. The caller measures the rectangle and this
 * module does the arithmetic, which is the split `packages/core/src/slider`
 * already has — and the reason both are testable without a browser.
 *
 * `drawer` is the first consumer. `splitter`, in wave 8, holds the same value
 * between two panes and answers the same pattern.
 */
import { clamp } from '../measure';

/** Which edge the panel is anchored to. Logical, as the guide's §2.4 requires. */
export type ExtentSide = 'start' | 'end' | 'top' | 'bottom';

/** The rectangle the fraction is measured against, in client coordinates. */
export interface ExtentRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ExtentPointRequest {
  /** Where the pointer is, in client coordinates. */
  readonly point: { readonly x: number; readonly y: number };
  /** The layer the panel is measured against. */
  readonly rect: ExtentRect;
  readonly side: ExtentSide;
  /** Whether the document reads right to left. Only `start` and `end` care. */
  readonly rtl?: boolean;
}

export interface ExtentStepRequest {
  readonly fraction: number;
  /** `1` grows the panel, `-1` shrinks it. */
  readonly direction: 1 | -1;
  /** How much of the layer one press moves, when there are no snap points. */
  readonly amount: number;
  readonly min: number;
  readonly max: number;
  /** The stops the panel lands on. Empty means the range is continuous. */
  readonly snapPoints?: readonly number[];
}

/**
 * What one arrow press and one `Shift`+arrow press move, in pixels.
 *
 * They are lengths and not fractions because a reader adjusting a pane is
 * placing an edge against the content beside it, and five per cent of a
 * twelve-hundred-pixel layer is sixty pixels — a jump, not an adjustment. SAP's
 * Splitter, VS Code's sash and the Window Splitter pattern's own examples all
 * move a fixed distance. The fraction is still what the family stores; this is
 * converted against the measured layer at the moment of the press.
 */
export const EXTENT_STEP_PX = 16;
export const EXTENT_LARGE_STEP_PX = 64;

/**
 * A distance in pixels as a fraction of the layer along the panel's own axis.
 *
 * A layer with no extent along that axis answers nought rather than infinity,
 * which is what a press against an unmeasured or collapsed layer has to do.
 */
export function stepAmountFromPixels({
  pixels,
  rect,
  side,
}: {
  readonly pixels: number;
  readonly rect: ExtentRect;
  readonly side: ExtentSide;
}): number {
  const span = isInlineSide(side) ? rect.width : rect.height;
  return span > 0 ? pixels / span : 0;
}

/** Whether the panel's extent grows along the inline axis. */
export function isInlineSide(side: ExtentSide): boolean {
  return side === 'start' || side === 'end';
}

/**
 * Whether the panel is anchored at the physically first edge of its axis — the
 * left in a left-to-right document, the top always.
 *
 * It is the one fact both halves of the pattern need. A pointer's distance is
 * measured from the anchored edge, and a key that moves the separator toward
 * the physically first edge grows the panel exactly when the panel is *not*
 * anchored there. Deriving it twice is how the pointer and the keyboard come to
 * disagree about which way is bigger in a mirrored document.
 */
export function anchorsAtStart(side: ExtentSide, rtl = false): boolean {
  if (side === 'start') return !rtl;
  if (side === 'end') return rtl;
  return side === 'top';
}

/**
 * The stops in ascending order, with anything outside `[0, 1]` dropped and
 * duplicates removed. A caller's array is not modified.
 */
export function orderSnapPoints(snapPoints: readonly number[]): number[] {
  return [...new Set(snapPoints.filter((point) => point >= 0 && point <= 1))].sort((a, b) => a - b);
}

/**
 * Where a pointer sits, as a fraction of the layer along the panel's own axis.
 *
 * The panel is anchored to `side`, so the fraction is the distance from the
 * *opposite* edge: dragging the inner edge of an `end` panel toward the start
 * of the layer makes the panel larger. `rtl` flips only the inline sides,
 * because `start` and `end` are the two that the reading direction names.
 */
export function extentAtPoint({ point, rect, rtl = false, side }: ExtentPointRequest): number {
  const inline = isInlineSide(side);
  const span = inline ? rect.width : rect.height;
  if (span <= 0) return 0;

  const fromFirstEdge = inline ? (point.x - rect.x) / span : (point.y - rect.y) / span;
  const measured = anchorsAtStart(side, rtl) ? fromFirstEdge : 1 - fromFirstEdge;
  return clamp(measured, 0, 1);
}

/**
 * The stop nearest `fraction`. An empty list has no nearest stop and the
 * fraction is its own answer, which is what makes a continuous range the
 * default rather than a second code path.
 */
export function nearestSnap(fraction: number, snapPoints: readonly number[]): number {
  const stops = orderSnapPoints(snapPoints);
  if (stops.length === 0) return fraction;

  return stops.reduce((closest, stop) =>
    Math.abs(stop - fraction) < Math.abs(closest - fraction) ? stop : closest,
  );
}

/**
 * One press of an arrow key.
 *
 * With snap points the separator moves to the adjacent stop, which is the only
 * reading under which `docs/component-features.md` §8's condition — snap points
 * "remain operable by keyboard" — is met. Without them it moves by
 * `amount`. Either way the result is held inside `[min, max]`.
 *
 * A fraction that sits between two stops moves to the stop on the side it is
 * travelling toward rather than skipping one, so a drag that ended off a stop
 * and an arrow press afterwards do not disagree about where the panel is.
 */
export function stepExtent({
  amount,
  direction,
  fraction,
  max,
  min,
  snapPoints = [],
}: ExtentStepRequest): number {
  const stops = orderSnapPoints(snapPoints).filter((stop) => stop >= min && stop <= max);

  if (stops.length > 0) {
    const next =
      direction === 1
        ? stops.find((stop) => stop > fraction + Number.EPSILON)
        : [...stops].reverse().find((stop) => stop < fraction - Number.EPSILON);
    return next ?? clamp(fraction, min, max);
  }

  return clamp(fraction + direction * amount, min, max);
}

/**
 * Where `Home` and `End` land, and where `Enter` collapses to and restores
 * from. The limits are the first and last stop when there are stops, because a
 * range whose ends are not reachable is a range with two values nothing can
 * produce.
 */
/**
 * A limit expressed as a length, as a fraction of the span it limits.
 *
 * `splitter` is why this exists. Every surveyed implementation of that pattern
 * states its limits as percentages and Zag says so outright — "the splitter
 * only supports setting percentage values" — but the commonest real constraint
 * in the family is a floor in pixels: a navigation panel that never goes below
 * two hundred of them, whatever the window is doing. A percentage cannot say
 * that, and a family that only takes percentages makes the consumer recompute
 * one on every resize.
 *
 * The caller measures the length; `measureLength` in `./gesture` is where that
 * happens, because it needs the DOM and nothing in this file does. What arrives
 * here is two numbers.
 *
 * A span of nought answers nought rather than infinity, which is what a limit
 * against an unmeasured or collapsed container has to do. The result is clamped
 * to `[0, 1]`, so a floor larger than the container reports a fraction that
 * exists rather than one nothing can produce.
 */
export function extentFromLength({
  pixels,
  span,
}: {
  readonly pixels: number;
  readonly span: number;
}): number {
  return span > 0 ? clamp(pixels / span, 0, 1) : 0;
}

/**
 * Where a value is heading, as a fraction.
 *
 * A release lands on the stop nearest the *projected* position rather than the
 * instantaneous one, and that difference is the whole of what makes a short
 * fast flick reach the stop the hand was aiming at. Without it a reader who
 * flicks a sheet twenty pixels and lets go gets twenty pixels of movement,
 * which reads as a gesture the component ignored.
 *
 * `velocity` is a fraction of the container per second, signed along the
 * panel's own axis. `horizon` is how far ahead to look; a hundred and fifty
 * milliseconds is the figure the surveyed sheet implementations converge on,
 * and it is a parameter rather than a constant because a family with a longer
 * settle wants a longer look.
 *
 * The result is clamped, so a violent flick projects to the end of the range
 * and not past it.
 */
export function projectExtent({
  fraction,
  velocity,
  horizon = 0.15,
}: {
  readonly fraction: number;
  readonly velocity: number;
  readonly horizon?: number;
}): number {
  return clamp(fraction + velocity * horizon, 0, 1);
}

/**
 * A sample of where the pointer was and when, for the velocity a release reads.
 *
 * The velocity is read over the last `EXTENT_VELOCITY_WINDOW_MS` of movement,
 * not over a count of samples: a stream at 120 Hz delivers three samples in
 * 17 ms, which is noise. A hand that held still for `EXTENT_STOPPED_MS` before
 * lifting meant to end where it is, and reads as none. Both are the horizon and
 * the stop time of Android's `VelocityTracker`, with the stop time widened for
 * a main thread that delivers a move late.
 */
export interface ExtentSample {
  readonly fraction: number;
  readonly at: number;
}

/** How far back from the last move a velocity looks, in milliseconds. */
export const EXTENT_VELOCITY_WINDOW_MS = 100;
/** How long a hand may rest before lifting and still carry its speed, in milliseconds. */
export const EXTENT_STOPPED_MS = 60;

/** The samples a drag keeps: the new one and those inside the window before it. */
export function addExtentSample(
  samples: readonly ExtentSample[],
  sample: ExtentSample,
): ExtentSample[] {
  return [...samples.filter((kept) => kept.at >= sample.at - EXTENT_VELOCITY_WINDOW_MS), sample];
}

/**
 * Fractions per second, from the samples a drag collected.
 *
 * `releasedAt` is when the hand lifted; a release later than `EXTENT_STOPPED_MS`
 * after the last move answers nought. An empty or single-sample window has no
 * velocity to report and answers nought too, which falls the caller back on
 * distance alone.
 */
export function extentVelocity(samples: readonly ExtentSample[], releasedAt?: number): number {
  const last = samples.at(-1);
  if (last === undefined) return 0;
  if (releasedAt !== undefined && releasedAt - last.at > EXTENT_STOPPED_MS) return 0;
  const recent = samples.filter((sample) => sample.at >= last.at - EXTENT_VELOCITY_WINDOW_MS);
  const first = recent[0];
  if (recent.length < 2 || first === undefined) return 0;
  const elapsed = last.at - first.at;
  if (elapsed <= 0) return 0;

  return ((last.fraction - first.fraction) / elapsed) * 1000;
}

export function extentBounds(
  snapPoints: readonly number[],
  min: number,
  max: number,
): { min: number; max: number } {
  const stops = orderSnapPoints(snapPoints);
  if (stops.length === 0) return { min: clamp(min, 0, 1), max: clamp(max, 0, 1) };
  return { min: stops[0] as number, max: stops.at(-1) as number };
}

/**
 * A release faster than this, in pixels per second, goes to the next stop in
 * the direction it was travelling, whatever the distance it covered.
 *
 * It is `DEFAULT_SIGNIFICANT_VEL_THRESHOLD` of Material's
 * `BottomSheetBehavior`; Vaul takes 400 and MUI's `SwipeableDrawer` 450. A
 * length per second and not a fraction of the layer, because a flick is a
 * speed of the hand and the hand does not know how tall the layer is: half a
 * layer per second was 200 pixels per second on a phone held sideways, which
 * closed a sheet on a slow drag.
 */
export const SHEET_FLING_PX_PER_S = 500;

/**
 * How far a touch travels before the sheet decides whether the gesture is its
 * own, a scroll, or a sideways swipe it never takes. Android's touch slop.
 */
export const SHEET_DRAG_SLOP_PX = 8;

export interface SettleRequest {
  /** Where the panel was when the hand left, as a fraction. */
  readonly fraction: number;
  /** Fractions per second, positive while growing. */
  readonly velocity: number;
  /** The layer's length along the panel's axis, in pixels. */
  readonly span: number;
  /** The stops the panel may rest on. */
  readonly stops: readonly number[];
  /** Whether the closed position is a stop. */
  readonly dismissible?: boolean;
}

/**
 * Where a released panel comes to rest: a stop, or `'close'`.
 *
 * The closed position is the stop `0`, which is the whole of the dismissal
 * rule — a sheet released nearer to closed than to its lowest stop closes, the
 * reading `BottomSheetBehavior`'s hide threshold and Vaul's close threshold
 * both make. A fling faster than `SHEET_FLING_PX_PER_S` goes to the first stop
 * beyond the release in the direction of travel; anything slower goes to the
 * stop nearest where the release was heading.
 */
export function settleExtent({
  dismissible = true,
  fraction,
  span,
  stops,
  velocity,
}: SettleRequest): number | 'close' {
  const ordered = orderSnapPoints(stops).filter((stop) => stop > 0);
  const candidates = dismissible ? [0, ...ordered] : ordered;
  if (candidates.length === 0) return clamp(fraction, 0, 1);

  let landed: number;
  if (Math.abs(velocity * span) >= SHEET_FLING_PX_PER_S) {
    landed =
      velocity > 0
        ? (candidates.find((stop) => stop > fraction + Number.EPSILON) ??
          (candidates.at(-1) as number))
        : ([...candidates].reverse().find((stop) => stop < fraction - Number.EPSILON) ??
          (candidates[0] as number));
  } else {
    landed = nearestSnap(projectExtent({ fraction, velocity }), candidates);
  }

  return landed === 0 && dismissible ? 'close' : landed;
}

/**
 * The stops a sheet rests on: the consumer's snap points, and the height of
 * its content when the size step is `content` — the stop gorhom's dynamic
 * sizing adds. With neither, the rest the panel is at is the only stop, so a
 * sheet dragged by its body goes back to where it was or closes.
 */
export function sheetStops({
  rest,
  restIsStop,
  snapPoints,
}: {
  readonly rest: number | undefined;
  readonly restIsStop: boolean;
  readonly snapPoints: readonly number[];
}): number[] {
  const stops = orderSnapPoints(snapPoints);
  if (rest !== undefined && (restIsStop || stops.length === 0)) {
    return orderSnapPoints([...stops, rest]);
  }
  return stops;
}
