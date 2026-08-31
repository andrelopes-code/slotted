import { Directive, ElementRef, inject } from '@angular/core';
import type { AfterViewInit } from '@angular/core';

import { SlAvatar } from './avatar';

/**
 * A picture already in the browser cache finishes decoding before the listener
 * is attached, so the directive also asks the element whether it is already
 * complete. Without that, an avatar shows initials over a picture that is
 * already there.
 */
@Directive({
  selector: 'img[slAvatarImage]',
  standalone: true,
  host: {
    'data-part': 'image',
    '(load)': 'avatar.setLoaded(true)',
    '(error)': 'avatar.setLoaded(false)',
  },
})
export class SlAvatarImage implements AfterViewInit {
  protected readonly avatar = inject(SlAvatar);

  private readonly element = inject(ElementRef<HTMLImageElement>).nativeElement;

  ngAfterViewInit() {
    if (this.element.complete && this.element.naturalWidth > 0) this.avatar.setLoaded(true);
  }
}
