import { Directive } from '@angular/core';

/**
 * An adornment before the date in the reading direction: a calendar mark, a
 * label, an icon. Named for the direction rather than for a side, so the same
 * markup puts the mark before the date in both directions.
 *
 * It is a directive on the consumer's own element, so an `icon`, a `kbd` or a
 * `span` all work and none of them loses its own semantics. The stylesheet
 * sizes any icon inside it from the control's own glyph scale.
 */
@Directive({
  selector: '[slDateFieldStart]',
  standalone: true,
  exportAs: 'slDateFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlDateFieldStart {}

/** An adornment after the date in the reading direction. */
@Directive({
  selector: '[slDateFieldEnd]',
  standalone: true,
  exportAs: 'slDateFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlDateFieldEnd {}
