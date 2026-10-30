import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

import { IMAGE_MEDIA_HOST } from './image-media-host';

/**
 * The picture inside an image.
 *
 * It is written on an `<img>` the consumer owns, which is what lets
 * `NgOptimizedImage` do its work: `ngSrc`, the priority hint, the generated
 * `srcset` and the size warnings all belong to a real `<img>` in the
 * consumer's template, and none of them survive being handed a `src` string
 * through an input. React has no equivalent, and its `renderImage` is the
 * other half of the same idea.
 *
 * A projected picture keeps every attribute the consumer wrote — `alt`,
 * `loading`, `width`, `height` — and the family writes only its part name.
 */
@Directive({
  selector: 'img[slImageMedia]',
  standalone: true,
  exportAs: 'slImageMedia',
  host: {
    'data-part': 'image',
    'data-part-image': '',
    '(load)': 'host.reportLoaded()',
    '(error)': 'host.reportError()',
  },
})
export class SlImageMedia {
  protected readonly host = inject(IMAGE_MEDIA_HOST);

  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  constructor() {
    /**
     * A picture already in the browser cache finishes decoding before the
     * listener is attached, so the element is asked whether it is already
     * complete rather than waited on for an event that has been and gone.
     * Without it an image shows its ground over a picture that is already
     * there.
     */
    afterNextRender(() => {
      if (this.element.complete && this.element.naturalWidth > 0) {
        this.host.reportLoaded();
      }
    });
  }
}
