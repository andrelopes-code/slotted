import { Directive } from '@angular/core';

/**
 * A glyph before the words. The artwork is the consumer's, and the part gives
 * it a box that is sized and centerd; the directive is written on the element
 * the page already has, so nothing is wrapped.
 */
@Directive({
  selector: '[slBadgeStart]',
  standalone: true,
  exportAs: 'slBadgeStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlBadgeStart {}

/** A glyph after the words. */
@Directive({
  selector: '[slBadgeEnd]',
  standalone: true,
  exportAs: 'slBadgeEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlBadgeEnd {}
