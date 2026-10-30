import { DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

/**
 * Says once whether its element has entered the viewport, so a font specimen
 * names its face — and the browser downloads it — only when it can be seen.
 * A browser without `IntersectionObserver` counts it as seen at once.
 *
 * Angular's `@defer (on viewport)` does the same, and its runtime would join
 * the initial bundle's core chunk (7.8 kB) for one page that is loaded lazily.
 */
@Directive({ selector: '[appInView]', exportAs: 'inView' })
export class InView {
  readonly seen = signal(false);

  constructor() {
    const element = inject<ElementRef<Element>>(ElementRef).nativeElement;
    if (typeof IntersectionObserver === 'undefined') {
      this.seen.set(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.target === element)) return;
      this.seen.set(true);
      observer.disconnect();
    });
    observer.observe(element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
