import { Directive } from '@angular/core';

/**
 * Always in the template. The stylesheet takes it out of the document once the
 * picture arrives, so the decision lives in one place and matches React.
 */
@Directive({
  selector: 'span[slAvatarFallback]',
  standalone: true,
  host: {
    'data-part': 'fallback',
  },
})
export class SlAvatarFallback {}
