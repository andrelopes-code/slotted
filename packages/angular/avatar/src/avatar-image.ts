import { afterNextRender, Directive, ElementRef, HostAttributeToken, inject } from '@angular/core';

import { AVATAR_IMAGE_HOST } from './avatar-image-host';

/**
 * The picture inside an avatar.
 *
 * It is written on an `<img>` the consumer owns, which is what lets
 * `NgOptimizedImage` do its work: `ngSrc`, the priority hint, the generated
 * `srcset` and the size warnings all belong to a real `<img>` in the
 * consumer's template, and none of them survive being handed a `src` string
 * through an input. React has no equivalent, and its `renderImage` is the other
 * half of the same idea.
 *
 * `alt` is written empty only when the consumer wrote none: the avatar's name
 * is on the root, so naming the picture as well would read the person twice —
 * and would name them differently before the picture arrives.
 */
@Directive({
  selector: 'img[slAvatarImage]',
  standalone: true,
  exportAs: 'slAvatarImage',
  host: {
    'data-part': 'image',
    'data-part-image': '',
    '[attr.alt]': 'alt',
    '(load)': 'avatar.reportStatus("loaded")',
    '(error)': 'avatar.reportStatus("error")',
  },
})
export class SlAvatarImage {
  protected readonly avatar = inject(AVATAR_IMAGE_HOST);

  /** A static `alt` the consumer wrote is read before the host binding writes one. */
  protected readonly alt = inject(new HostAttributeToken('alt'), { optional: true }) ?? '';

  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  constructor() {
    /**
     * A picture already in the browser cache finishes decoding before the
     * listener is attached, so the element is asked whether it is already
     * complete rather than waited on for an event that has been and gone.
     * Without it an avatar shows initials over a picture that is already there.
     */
    afterNextRender(() => {
      if (this.element.complete && this.element.naturalWidth > 0) {
        this.avatar.reportStatus('loaded');
      }
    });
  }
}
