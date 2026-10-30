import { Directive } from '@angular/core';

/**
 * Content that stands in for the picture, in place of the initials and the
 * glyph: a company mark, a product logo, an `sl-icon`.
 *
 * It is a marker rather than a bare `<ng-content>` because Angular cannot ask
 * whether anything was projected, and an avatar that wrote its initials
 * *and* the consumer's logo into the same disc would be drawing two fallbacks.
 * React answers the same question by looking at `children`.
 */
@Directive({
  selector: '[slAvatarFallback]',
  standalone: true,
  exportAs: 'slAvatarFallback',
})
export class SlAvatarFallback {}
