import { Directive } from '@angular/core';

/**
 * A glyph or an avatar before the words. The artwork is the consumer's, and
 * the part gives it a box that is sized and centred; the directive is written
 * on the element the page already has, so nothing is wrapped.
 */
@Directive({
  selector: '[slTagStart]',
  standalone: true,
  exportAs: 'slTagStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlTagStart {}

/** A glyph after the words. */
@Directive({
  selector: '[slTagEnd]',
  standalone: true,
  exportAs: 'slTagEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlTagEnd {}
