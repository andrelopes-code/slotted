import { computed, Directive, ElementRef, inject } from '@angular/core';

/**
 * Hidden from assistive technology: a gap between two page numbers is not a
 * destination, and reading "ellipsis" between four and nine helps nobody.
 */
@Directive({
  selector: 'span[slPaginationEllipsis]',
  standalone: true,
  host: {
    'data-part': 'ellipsis',
    '[attr.aria-hidden]': 'ariaHidden()',
  },
})
export class SlPaginationEllipsis {
  private readonly ownAriaHidden = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-hidden',
  );

  readonly ariaHidden = computed(() => this.ownAriaHidden ?? 'true');
}
