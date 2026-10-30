import { Directive } from '@angular/core';

/**
 * Media that bleeds to the card's edge and rounds the corners it touches. It
 * clips itself, because a card that clipped its own content would cut off an
 * overlay opened inside it.
 */
@Directive({
  selector: '[slCardMedia]',
  standalone: true,
  exportAs: 'slCardMedia',
  host: { 'data-part': 'media', 'data-part-media': '' },
})
export class SlCardMedia {}
