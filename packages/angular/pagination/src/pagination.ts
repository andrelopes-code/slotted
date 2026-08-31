import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';

/**
 * A nav needs a name, and a page with a pagination control usually has other
 * navigation on it. The default names this one; an aria-labelledby already on
 * the element suppresses it, so the two never both appear.
 */
@Component({
  selector: 'nav[slPagination]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/pagination/pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-pagination',
    'data-slotted-component': 'pagination',
    'data-part': 'root',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class SlPagination {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;

  private readonly own = {
    ariaLabel: this.element.getAttribute('aria-label'),
    ariaLabelledBy: this.element.getAttribute('aria-labelledby'),
  };

  readonly ariaLabel = computed(() =>
    this.own.ariaLabelledBy !== null ? this.own.ariaLabel : (this.own.ariaLabel ?? 'Pagination'),
  );
}
