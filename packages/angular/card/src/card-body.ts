import { booleanAttribute, Directive, input } from '@angular/core';

/** The content. It takes whatever a card stretched to a row height has left. */
@Directive({
  selector: '[slCardBody]',
  standalone: true,
  exportAs: 'slCardBody',
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.data-bleed]': "bleed() ? '' : null",
  },
})
export class SlCardBody {
  /**
   * Runs the body's children from one edge of the card to the other: the body
   * gives up its padding and is clipped to the corners of the card it touches.
   * For a list whose rules and row grounds reach the edge.
   */
  readonly bleed = input(false, { transform: booleanAttribute });
}
