import { Directive } from '@angular/core';

/**
 * The corner of the header: a badge, a status, a menu button. It stays on the
 * first row, so a title that wraps to two lines does not drag it down, and it
 * sits above the hit area a card link stretches, so it stays operable.
 */
@Directive({
  selector: '[slCardActions]',
  standalone: true,
  exportAs: 'slCardActions',
  host: { 'data-part': 'actions', 'data-part-actions': '' },
})
export class SlCardActions {}
