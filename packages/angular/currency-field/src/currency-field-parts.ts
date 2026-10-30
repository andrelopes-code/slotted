import { Directive, inject, input, signal } from '@angular/core';
import { createScrub, SCRUB_SENSITIVITY } from '@slotted/core/number';
import type { Scrub } from '@slotted/core/number';

import { SlCurrencyField } from './currency-field';

/**
 * An adornment before the amount in the reading direction: a currency mark, a
 * period, an icon. Named for the direction rather than for a side, so the same
 * markup puts the mark before the amount in both directions.
 *
 * It is a sibling of the number rather than part of it. A symbol that belongs
 * *inside* the amount is what `currency` and `currencyDisplay` write, and it is
 * selected, copied and parsed with the amount; this one is none of those
 * things.
 */
@Directive({
  selector: '[slCurrencyFieldStart]',
  standalone: true,
  exportAs: 'slCurrencyFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlCurrencyFieldStart {}

/** An adornment after the amount in the reading direction. */
@Directive({
  selector: '[slCurrencyFieldEnd]',
  standalone: true,
  exportAs: 'slCurrencyFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlCurrencyFieldEnd {}

/**
 * A mark that moves the amount when it is dragged sideways — the design
 * tools' gesture, shared with `slNumberFieldScrub`. Placed inside
 * `slCurrencyFieldStart` or `slCurrencyFieldEnd`, where the frame it belongs
 * to is its ancestor; the currency symbol, with `currencyDisplay="none"` on
 * the control, is the natural mark:
 *
 * ```html
 * <span slCurrencyFieldStart><span slCurrencyFieldScrub>R$</span></span>
 * ```
 *
 * Each `sensitivity` pixels towards the inline end is one step up; `Shift`
 * moves by the large step and `Alt` by the small one, as on the keyboard. It
 * is hidden from assistive technology and takes no focus: the input's arrow
 * keys are the same movement.
 */
@Directive({
  selector: '[slCurrencyFieldScrub]',
  standalone: true,
  exportAs: 'slCurrencyFieldScrub',
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
export class SlCurrencyFieldScrub {
  /** Pixels of horizontal travel per step. Defaults to 2. */
  readonly sensitivity = input<number>(SCRUB_SENSITIVITY);

  private readonly frame = inject(SlCurrencyField);
  protected readonly active = signal(false);
  private travel: Scrub | null = null;

  protected begin(event: PointerEvent) {
    const control = this.frame.control();
    if (event.button !== 0 || control === undefined || this.frame.inert()) return;
    /* No text selection, and the caret stays in the amount the drag moves. */
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
