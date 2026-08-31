import { booleanAttribute, Directive, ElementRef, inject, input, isDevMode } from '@angular/core';

/**
 * The cross is drawn by the stylesheet, so the control projects nothing: a
 * glyph placed here would sit beside the drawn one rather than replacing it.
 * The name is the consumer's, because "Remove" alone does not say what.
 */
@Directive({
  selector: 'button[slTagRemove]',
  standalone: true,
  host: {
    'data-part': 'remove',
    type: 'button',
    '[attr.data-disabled]': "disabled() ? '' : null",
    '[attr.disabled]': "disabled() ? '' : null",
  },
})
export class SlTagRemove {
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  constructor() {
    if (!isDevMode()) return;
    const ariaLabel = this.element.getAttribute('aria-label');
    const ariaLabelledBy = this.element.getAttribute('aria-labelledby');
    if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) {
      console.warn(
        'TagRemove has no accessible name. Give it aria-label naming the value it removes, such as "Remove design".',
      );
    }
  }
}
