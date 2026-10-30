import { Directive } from '@angular/core';

/**
 * The one destination a card resolves to, written on the anchor the page
 * already has. Its hit area covers the whole surface, so the card is clickable
 * without the root becoming a link: the accessible name stays the title rather
 * than every string in the card, and Enter, the context menu and middle-click
 * stay the platform's.
 *
 * A card carries at most one. Two would be two destinations for one surface.
 */
@Directive({
  selector: 'a[slCardLink]',
  standalone: true,
  exportAs: 'slCardLink',
  host: { 'data-part': 'link', 'data-part-link': '' },
})
export class SlCardLink {}
