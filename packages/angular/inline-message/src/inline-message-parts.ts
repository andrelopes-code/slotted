import { Directive } from '@angular/core';

/**
 * A mark the page supplies instead of the tone's own. It is projected into the
 * box the family draws, so it keeps the size, the colour and the place on the
 * message's first line the tone's mark would have had.
 *
 * It is a marker rather than a component: what goes inside is the page's own
 * artwork, and the family has nothing to add to it beyond where it sits.
 */
@Directive({
  selector: '[slInlineMessageIcon]',
  standalone: true,
  exportAs: 'slInlineMessageIcon',
})
export class SlInlineMessageIcon {}
