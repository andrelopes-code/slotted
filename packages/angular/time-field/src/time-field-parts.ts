import { Directive } from '@angular/core';

/**
 * An adornment before the time in the reading direction: a clock mark, a label,
 * an icon. Named for the direction rather than for a side, so the same markup
 * puts the mark before the time in both directions.
 *
 * It is a directive on the consumer's own element, so an `icon`, a `kbd` or a
 * `span` all work and none of them loses its own semantics. The stylesheet
 * sizes any icon inside it from the control's own glyph scale.
 */
@Directive({
  selector: '[slTimeFieldStart]',
  standalone: true,
  exportAs: 'slTimeFieldStart',
  host: { 'data-part': 'start', 'data-part-start': '' },
})
export class SlTimeFieldStart {}

/** An adornment after the time in the reading direction. */
@Directive({
  selector: '[slTimeFieldEnd]',
  standalone: true,
  exportAs: 'slTimeFieldEnd',
  host: { 'data-part': 'end', 'data-part-end': '' },
})
export class SlTimeFieldEnd {}
