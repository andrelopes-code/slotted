/**
 * The order a tour's changes are seen in, for both bindings.
 *
 * Three things move when a step changes — the card that leaves, the cutout
 * that goes to the next target, the card that arrives — and the eye follows
 * them only if they happen one after another: the card leaves while the
 * cutout travels, the page scrolls the target in if it has to, and the new
 * card arrives once the cutout has landed. A card that arrived while the
 * cutout was still on its way pointed at a place nothing was lit yet.
 *
 * The durations are the theme's, read off the tour's own element, so reduced
 * motion — which collapses every duration token to a millisecond — collapses
 * the sequence with them, and a theme that retunes the motion scale retunes
 * the choreography.
 */

import { scrollTargetIntoView } from './tour';

/**
 * How the cutout moves: `travel` from one target to the next, `light` where
 * none was, `close` where there will be none, `rest` when nothing moves — and
 * the cutout then follows its target without a transition, so a scroll never
 * drags it.
 */
export type SpotMove = 'rest' | 'travel' | 'light' | 'close';

/** `from` is `undefined` when the tour is opening, and `null` for a centred step. */
export function spotMove(from: Element | null | undefined, to: Element | null): SpotMove {
  if (from === undefined) return to === null ? 'rest' : 'light';
  if (from === to) return 'rest';
  if (from !== null && to !== null) return 'travel';
  if (to !== null) return 'light';
  return from !== null ? 'close' : 'rest';
}

/** A duration token as the theme resolved it on this element, in milliseconds. */
export function durationOf(node: Element | null, token: string): number {
  if (node === null) return 0;
  const view = node.ownerDocument.defaultView;
  const raw = view?.getComputedStyle(node).getPropertyValue(token).trim() ?? '';
  const match = /^(-?[\d.]+)(ms|s)$/.exec(raw);
  if (match === null) return 0;
  const value = Number.parseFloat(match[1] as string);
  return match[2] === 's' ? value * 1000 : value;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export interface StageStepOptions {
  /** The tour's own element, which carries the resolved duration tokens. */
  root: Element | null;
  /** The target the cutout is on now; `undefined` when the tour is opening. */
  from: Element | null | undefined;
  /** The target of the step arriving; `null` for a centred step. */
  to: Element | null;
  /** Bring the target into view first, when it is not wholly on screen. */
  scroll: boolean;
  /** A newer step change aborts this one where it stands. */
  signal: AbortSignal;
  /** The cutout's target and how it gets there. */
  spot: (target: Element | null, move: SpotMove) => void;
  /** The card leaves, or the arriving step's card enters. */
  card: (phase: 'leave' | 'enter') => void;
}

export async function stageStep(options: StageStepOptions): Promise<void> {
  const { from, root, signal, to } = options;
  const opening = from === undefined;
  const move = spotMove(from, to);

  const travel = move === 'rest' ? 0 : durationOf(root, '--slotted-duration-long');

  if (!opening) options.card('leave');

  /**
   * The page scrolls first, and the cutout moves after. A cutout travelling
   * while the page scrolled under it had its transition restarted on every
   * frame of the scroll, and trailed the target by a quarter of a second
   * after the page had stopped. At rest it follows the old target through the
   * scroll without lag, and then travels once, to a target that stands still.
   */
  if (to !== null && options.scroll) await scrollTargetIntoView(to, signal);
  if (signal.aborted) return;

  if (move === 'close') options.spot(from ?? null, 'close');
  else options.spot(to, move);

  /* Opening is the scrim and the card together, as a dialog opens; the cutout
     lights while they arrive, and rests once it has. */
  if (opening) {
    options.card('enter');
    await wait(travel, signal);
    if (!signal.aborted) options.spot(to, 'rest');
    return;
  }

  /**
   * The card arrives when the cutout has all but landed: on the standard
   * curve the cutout has covered nineteen twentieths of its way by the medium
   * step, and a card held until the last pixel read as a pause. The cutout
   * keeps its movement to the end of the long step and only then rests, so
   * nothing cuts its last few pixels short.
   */
  const leave = durationOf(root, '--slotted-duration-short');
  const landed =
    move === 'rest' ? 0 : Math.min(travel, durationOf(root, '--slotted-duration-medium'));
  const started = Date.now();
  await wait(Math.max(leave, landed), signal);
  if (signal.aborted) return;
  options.card('enter');
  await wait(travel - (Date.now() - started), signal);
  if (signal.aborted) return;
  options.spot(move === 'close' ? null : to, 'rest');
}
