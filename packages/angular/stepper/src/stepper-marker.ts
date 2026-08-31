import { computed, Directive, ElementRef, inject } from '@angular/core';

/**
 * Hidden from assistive technology. The marker holds a number or a tick that
 * repeats what the label and aria-current already say, and "3" read out
 * between two step names is noise.
 */
@Directive({
  selector: 'span[slStepperMarker]',
  standalone: true,
  host: {
    'data-part': 'marker',
    '[attr.aria-hidden]': 'ariaHidden()',
  },
})
export class SlStepperMarker {
  private readonly ownAriaHidden = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-hidden',
  );

  readonly ariaHidden = computed(() => this.ownAriaHidden ?? 'true');
}
