import { Directive } from '@angular/core';

/**
 * An adornment before the value in the reading direction: a calendar mark, a
 * label, a zone name. Named for the direction rather than for a side, so the
 * same markup puts the mark before the value in both directions.
 *
 * It is a directive on the consumer's own element, so an `icon`, a `kbd` or a
 * `span` all work and none of them loses its own semantics. The stylesheet
 * sizes any icon inside it from the control's own glyph scale.
 */
@Directive({
  selector: '[slDateTimeFieldStart]',
  standalone: true,
  exportAs: 'slDateTimeFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlDateTimeFieldStart {}

/** An adornment after the value in the reading direction. */
@Directive({
  selector: '[slDateTimeFieldEnd]',
  standalone: true,
  exportAs: 'slDateTimeFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlDateTimeFieldEnd {}
