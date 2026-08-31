import { booleanAttribute, computed, Directive, ElementRef, inject, input } from '@angular/core';

/**
 * The current page stays a link to itself and carries aria-current="page",
 * which is what the Authoring Practices breadcrumb example does. Removing the
 * href would take the last crumb out of the tab order and out of the list a
 * screen reader reads as links.
 */
@Directive({
  selector: 'a[slBreadcrumbLink]',
  standalone: true,
  host: {
    'data-part': 'link',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.data-current]': "current() ? '' : null",
  },
})
export class SlBreadcrumbLink {
  readonly current = input(false, { transform: booleanAttribute });

  private readonly ownAriaCurrent = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-current',
  );

  readonly ariaCurrent = computed(() => this.ownAriaCurrent ?? (this.current() ? 'page' : null));
}
