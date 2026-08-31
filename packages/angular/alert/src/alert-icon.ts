import { computed, Directive, ElementRef, inject } from '@angular/core';

/**
 * Hidden from assistive technology by default. The tone the icon carries is
 * already in the words; announcing "warning triangle" adds a noun nobody
 * needs. An aria-hidden="false" already on the element puts it back.
 */
@Directive({
  selector: 'span[slAlertIcon]',
  standalone: true,
  host: {
    'data-part': 'icon',
    '[attr.aria-hidden]': 'ariaHidden()',
  },
})
export class SlAlertIcon {
  private readonly ownAriaHidden = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-hidden',
  );

  readonly ariaHidden = computed(() => this.ownAriaHidden ?? 'true');
}
