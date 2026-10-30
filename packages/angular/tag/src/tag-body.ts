import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';

import { SlTag } from './tag';

/**
 * The template every content box shares. The words get a box of their own — it
 * is what `text-box` needs to trim the line to the cap and the baseline, what
 * `text-overflow` needs to clip a long value, and what `aria-labelledby` on
 * the remove control points at so it announces the value rather than the word
 * "Remove" on its own.
 *
 * Every space between these tags is load-bearing: Angular collapses a newline
 * between two nodes into a space, and a space beside the label box would put a
 * word gap inside the chip that the family's own `gap` is already drawing.
 */
export const TAG_BODY_TEMPLATE =
  '<ng-content select="[slTagStart]"></ng-content>' +
  '<span data-part="label" data-part-label="" [id]="tag.labelId"><ng-content></ng-content></span>' +
  '<ng-content select="[slTagEnd]"></ng-content>';

/**
 * The content box, and the primary target when there is one. It is written on
 * the element the chip *is*: a `span` that does nothing, a `button` that runs
 * a command, an `a` that navigates. The element is the member, which is what
 * keeps `routerLink`, `type`, `download` and every native listener on the
 * element that owns them.
 *
 * `disabled` belongs to the chip rather than to this element, because a chip
 * is unavailable as a whole. What that means depends on the element, and the
 * platform only offers one of the two forms per element.
 */
@Component({
  selector: '[slTagBody]',
  standalone: true,
  exportAs: 'slTagBody',
  template: TAG_BODY_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'body',
    'data-part-body': '',
    '[attr.disabled]': 'nativelyDisabled()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.role]': 'anchorRole()',
  },
})
export class SlTagBody {
  protected readonly tag = inject(SlTag);

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly isButton = this.element.tagName === 'BUTTON';
  private readonly isAnchor = this.element.tagName === 'A';

  protected readonly nativelyDisabled = computed(() =>
    this.isButton && this.tag.disabled() ? '' : null,
  );
  protected readonly ariaDisabled = computed(() =>
    this.isAnchor && this.tag.disabled() ? 'true' : null,
  );
  /** An anchor without a destination is no longer a link, so it says it is one. */
  protected readonly anchorRole = computed(() =>
    this.isAnchor && this.tag.disabled() ? 'link' : null,
  );

  /**
   * A disabled anchor keeps its place in the tab sequence and loses its
   * destination, which is the line `link` draws for the same case: an anchor
   * without an `href` would drop out of the tab sequence and take its own
   * explanation with it. The attribute is withheld rather than overwritten, so
   * it is given back the moment the chip becomes available again.
   */
  private withheldHref: string | null = null;

  constructor() {
    if (this.isAnchor) {
      effect(() => {
        if (this.tag.disabled()) {
          this.withheldHref ??= this.element.getAttribute('href');
          this.renderer.removeAttribute(this.element, 'href');
          this.renderer.setAttribute(this.element, 'tabindex', '0');
          return;
        }
        if (this.withheldHref !== null) {
          this.renderer.setAttribute(this.element, 'href', this.withheldHref);
          this.withheldHref = null;
        }
      });
    }

    /**
     * The capture phase, because a control that is unavailable must refuse the
     * activation before any listener the consumer attached to it can run. A
     * natively disabled button needs none of this; an anchor and a `span` with
     * a listener on it do.
     */
    if (!this.isButton) {
      const destroyRef = inject(DestroyRef);
      const refuse = (event: Event) => {
        if (!this.tag.disabled()) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      };
      for (const type of ['click', 'auxclick', 'keydown']) {
        this.element.addEventListener(type, refuse, { capture: true });
        destroyRef.onDestroy(() =>
          this.element.removeEventListener(type, refuse, { capture: true }),
        );
      }
    }
  }
}
