import { Directive } from '@angular/core';

/**
 * Actions and metadata. The footer sits above the hit area a card action
 * stretches, so a secondary action inside it stays operable.
 */
@Directive({
  selector: '[slCardFooter]',
  standalone: true,
  exportAs: 'slCardFooter',
  host: { 'data-part': 'footer', 'data-part-footer': '' },
})
export class SlCardFooter {}
