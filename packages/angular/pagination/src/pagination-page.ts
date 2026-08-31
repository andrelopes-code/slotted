import { booleanAttribute, computed, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * The selector is the bare attribute, so a page with an address is an anchor
 * and a page that only changes what a client-side list shows is a button. The
 * native disabled attribute is bound only when the element can carry it.
 */
@Directive({
  selector: '[slPaginationPage]',
  standalone: true,
  host: {
    'data-part': 'page',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.data-current]': "current() ? '' : null",
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.disabled]': 'nativeDisabled()',
  },
})
export class SlPaginationPage {
  readonly current = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly ownAriaCurrent = this.element.getAttribute('aria-current');
  private readonly isButton = this.element.tagName === 'BUTTON';

  readonly ariaCurrent = computed(() => this.ownAriaCurrent ?? (this.current() ? 'page' : null));

  readonly nativeDisabled = computed(() => (this.isButton && this.disabled() ? '' : null));
}
