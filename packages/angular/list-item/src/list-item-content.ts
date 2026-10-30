import { computed, Directive, ElementRef, forwardRef, inject } from '@angular/core';

import { SlListItem } from './list-item';
import { SlListItemBodyScope, SlListItemBox, warnNesting } from './list-item-nesting';

/**
 * The box that is read, and sometimes activated. One directive on the element
 * the page wrote, which is what this ecosystem composes with: `<a
 * slListItemContent [routerLink]>` is a real destination and `<button
 * slListItemContent>` a real command, and the router link, the form ownership
 * and the modified click a browser gives an anchor all stay the page's.
 *
 * React exports three components instead, because there the component owns the
 * tag and a string that picked between three accessibility trees would turn a
 * typo into a `div` no reader can reach. Both bindings reach the same tree.
 *
 * How an interaction is refused depends on the element, because the platform
 * gives each element a different way to say so:
 *
 * - a `button` takes the native `disabled`, which removes it from the tab order
 *   and stops the activation at the platform;
 * - an `a` takes `aria-disabled="true"` and keeps its destination, because that
 *   attribute means perceivable but not operable and leaves the element
 *   focusable — a reader can still reach the row and hear why it is
 *   unavailable. The activation is refused by `SlListItem`, which is also the
 *   only place the refusal can be made to run first;
 * - anything else takes neither, and any control the page put in
 *   `slListItemActions` is the page's own to disable.
 */
@Directive({
  selector: '[slListItemContent]',
  standalone: true,
  exportAs: 'slListItemContent',
  providers: [{ provide: SlListItemBox, useExisting: forwardRef(() => SlListItemContent) }],
  host: {
    'data-part': 'content',
    'data-part-content': '',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-busy]': "loading() ? 'true' : null",
  },
})
export class SlListItemContent {
  private readonly row = inject(SlListItem, { optional: true });
  private readonly tag = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName;

  constructor() {
    warnNesting(
      'slListItemContent',
      inject(SlListItemBodyScope, { optional: true, skipSelf: true }) !== null,
      'slListItemContent must not be inside slListItemBody; slListItemBody goes inside slListItemContent',
    );
  }

  readonly loading = computed(() => this.row?.loading() ?? false);

  private readonly blocked = computed(() => this.row?.blocked() ?? false);

  protected readonly nativeDisabled = computed(() =>
    this.tag === 'BUTTON' && this.blocked() ? '' : null,
  );

  protected readonly ariaDisabled = computed(() =>
    this.tag === 'A' && this.blocked() ? 'true' : null,
  );
}
