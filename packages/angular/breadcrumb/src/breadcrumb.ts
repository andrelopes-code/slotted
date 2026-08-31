import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';

/**
 * A nav needs a name: a page usually has more than one, and "navigation" twice
 * in a landmark list tells a reader nothing. The default names this one after
 * what it is, and steps aside when the consumer pointed at visible text.
 */
@Component({
  selector: 'nav[slBreadcrumb]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/breadcrumb/breadcrumb.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-breadcrumb',
    'data-slotted-component': 'breadcrumb',
    'data-part': 'root',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class SlBreadcrumb {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly own = {
    ariaLabel: this.element.getAttribute('aria-label'),
    ariaLabelledBy: this.element.getAttribute('aria-labelledby'),
  };

  readonly ariaLabel = computed(() => {
    if (this.own.ariaLabelledBy !== null) return this.own.ariaLabel;
    return this.own.ariaLabel ?? 'Breadcrumb';
  });
}
