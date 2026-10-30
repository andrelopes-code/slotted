import { Directive } from '@angular/core';

/**
 * Content over the placeholder's ground while the picture is on its way — a
 * skeleton, a blurhash canvas. A marker rather than a bare `<ng-content>`,
 * so the slot can be selected by name and nothing else falls into it.
 */
@Directive({
  selector: '[slImagePlaceholder]',
  standalone: true,
  exportAs: 'slImagePlaceholder',
})
export class SlImagePlaceholder {}

/**
 * Content of the fallback, in place of the glyph, once the picture has
 * failed: a message, a retry, a logotype. The glyph is the slot's default
 * content, so projecting anything here replaces it.
 */
@Directive({
  selector: '[slImageFallback]',
  standalone: true,
  exportAs: 'slImageFallback',
})
export class SlImageFallback {}
