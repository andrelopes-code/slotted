/**
 * The grip of a sheet that has no stops: a pull down on it moves the sheet
 * with the hand, and a release past half the sheet's height, or a flick down,
 * dismisses it. Any other release puts the sheet back where it rests.
 *
 * The sheet moves by an inline `translate` with its transition off, so the
 * stylesheet's own rest and entrance stay in force once the hand lifts. A
 * dismissal keeps the offset: the sheet fades out from where the hand let go,
 * and the next attach takes the offset back. The scrim, when given, dims with
 * the travel: at half the sheet's height it is half as dark.
 */

import {
  addExtentSample,
  extentVelocity,
  SHEET_DRAG_SLOP_PX,
  SHEET_FLING_PX_PER_S,
  type ExtentSample,
} from './extent';

export interface GripDismissOptions {
  /** The handle the hand takes. */
  readonly grip: HTMLElement;
  /** What moves with the hand: the fixed box the sheet is drawn in. */
  readonly sheet: HTMLElement;
  /** The scrim under the sheet, whose opacity follows the pull. */
  readonly scrim?: HTMLElement | null | undefined;
  /** A release that dismisses, with the pointer event that ended the pull. */
  readonly onDismiss: (event: PointerEvent) => void;
}

export function attachGripDismiss({
  grip,
  sheet,
  scrim,
  onDismiss,
}: GripDismissOptions): () => void {
  sheet.style.removeProperty('translate');
  sheet.style.removeProperty('transition');
  rest(scrim);

  let pointer: number | null = null;
  let start = 0;
  let pulled = 0;
  let samples: ExtentSample[] = [];

  const down = (event: PointerEvent) => {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    start = event.clientY;
    pulled = 0;
    samples = [{ fraction: 0, at: event.timeStamp }];
    grip.setPointerCapture?.(event.pointerId);
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    pulled = Math.max(0, event.clientY - start);
    samples = addExtentSample(samples, { fraction: pulled, at: event.timeStamp });
    sheet.style.transition = 'none';
    sheet.style.translate = `0 ${String(pulled)}px`;
    if (scrim == null) return;

    const height = sheet.offsetHeight;
    scrim.style.transition = 'none';
    scrim.style.opacity = String(height > 0 ? Math.max(0, 1 - pulled / height) : 1);
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    sheet.style.removeProperty('transition');
    const flung =
      pulled > SHEET_DRAG_SLOP_PX &&
      extentVelocity(samples, event.timeStamp) > SHEET_FLING_PX_PER_S;
    if (pulled > sheet.offsetHeight / 2 || flung) {
      onDismiss(event);
      /* Taken back in the task that closes the layer, so the scrim fades out
         from where the hand let it, as the sheet goes on from where it is. */
      rest(scrim);
      return;
    }

    sheet.style.removeProperty('translate');
    rest(scrim);
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    pointer = null;
    sheet.style.removeProperty('transition');
    sheet.style.removeProperty('translate');
    rest(scrim);
  };

  grip.addEventListener('pointerdown', down);
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up);
  grip.addEventListener('pointercancel', cancel);

  return () => {
    grip.removeEventListener('pointerdown', down);
    grip.removeEventListener('pointermove', move);
    grip.removeEventListener('pointerup', up);
    grip.removeEventListener('pointercancel', cancel);
  };
}

/** The scrim back on the stylesheet's own opacity and fade. */
function rest(scrim: HTMLElement | null | undefined) {
  scrim?.style.removeProperty('opacity');
  scrim?.style.removeProperty('transition');
}
