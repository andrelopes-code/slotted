import { Directive } from '@angular/core';

/**
 * A child that leaves the bound behind and reaches both edges of the
 * container: a table, a banner, a strip of media inside a page of prose.
 *
 * It answers the container rather than the viewport, so it is still correct
 * nested, inside a scroll region, and in a container that does not fill the
 * page. Bounded content returns inside it by nesting another `slContainer`.
 */
@Directive({
  selector: '[slContainerBreakout]',
  standalone: true,
  exportAs: 'slContainerBreakout',
  host: { 'data-part': 'breakout', 'data-part-breakout': '' },
})
export class SlContainerBreakout {}
