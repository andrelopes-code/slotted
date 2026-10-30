import { Directive, inject, input, signal } from '@angular/core';
import { createScrub, SCRUB_SENSITIVITY } from '@slotted/core/number';
import type { Scrub } from '@slotted/core/number';

import { SlNumberField } from './number-field';

/**
 * An adornment before the value in the reading direction: a currency mark, a
 * unit, an icon. Named for the direction rather than for a side, so the same
 * markup puts the mark before the amount in both directions.
 *
 * It is a sibling of the number rather than part of it. A symbol that belongs
 * *inside* the value — the `R$` of a currency format, a percent sign — is
 * `format`'s job and arrives through `Intl` as part of the string the control
 * holds; this one is never selected, never copied and never parsed.
 */
@Directive({
  selector: '[slNumberFieldStart]',
  standalone: true,
  exportAs: 'slNumberFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlNumberFieldStart {}

/** An adornment after the value in the reading direction. */
@Directive({
  selector: '[slNumberFieldEnd]',
  standalone: true,
  exportAs: 'slNumberFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlNumberFieldEnd {}

/**
 * A mark that moves the number when it is dragged sideways — the design
 * tools' gesture. Placed inside `slNumberFieldStart` or `slNumberFieldEnd`,
 * where the frame it belongs to is its ancestor:
 *
 * ```html
 * <span slNumberFieldStart><span slNumberFieldScrub>W</span></span>
 * ```
 *
 * Each `sensitivity` pixels towards the inline end is one step up; `Shift`
 * moves by the large step and `Alt` by the small one, as on the keyboard. It
 * is hidden from assistive technology and takes no focus: the input's arrow
 * keys are the same movement.
 */
@Directive({
  selector: '[slNumberFieldScrub]',
  standalone: true,
  exportAs: 'slNumberFieldScrub',
  host: {
    'data-part': 'scrub',
    'data-part-scrub': '',
    'aria-hidden': 'true',
    '[attr.data-scrubbing]': "active() ? '' : null",
    '(pointerdown)': 'begin($event)',
    '(pointermove)': 'drag($event)',
    '(pointerup)': 'end()',
    '(pointercancel)': 'end()',
    '(lostpointercapture)': 'end()',
  },
})
export class SlNumberFieldScrub {
  /** Pixels of horizontal travel per step. Defaults to 2. */
  readonly sensitivity = input<number>(SCRUB_SENSITIVITY);

  private readonly frame = inject(SlNumberField);
  protected readonly active = signal(false);
  private travel: Scrub | null = null;

  protected begin(event: PointerEvent) {
    const control = this.frame.control();
    if (event.button !== 0 || control === undefined || this.frame.inert()) return;
    /* No text selection, and the caret stays in the value the drag moves. */
    event.preventDefault();
    control.inputElement.focus();
    (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
    this.travel = createScrub({
      clientX: event.clientX,
      sensitivity: this.sensitivity(),
      rtl: getComputedStyle(control.inputElement).direction === 'rtl',
    });
    this.active.set(true);
    this.frame.scrubbing.set(true);
  }

  protected drag(event: PointerEvent) {
    if (this.travel === null) return;
    this.frame.control()?.scrubBy(this.travel.steps(event.clientX), event);
  }

  protected end() {
    if (this.travel === null) return;
    this.travel = null;
    this.active.set(false);
    this.frame.scrubbing.set(false);
  }
}
