import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type SkeletonShape = 'text' | 'rectangle' | 'circle';

/**
 * Hidden from assistive technology by default. A placeholder stands for
 * content that has not arrived, and reading out the absence of something is
 * noise. Announcing the wait is the job of the region the skeletons are in,
 * through aria-busy or a status message the application owns.
 */
@Component({
  selector: 'span[slSkeleton]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/skeleton/skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-skeleton',
    'data-slotted-component': 'skeleton',
    'data-part': 'root',
    '[attr.data-shape]': 'shape()',
    '[attr.aria-hidden]': 'ariaHidden()',
  },
})
export class SlSkeleton {
  readonly shape = input<SkeletonShape>('text');

  private readonly ownAriaHidden = inject(ElementRef<HTMLElement>).nativeElement.getAttribute(
    'aria-hidden',
  );

  readonly ariaHidden = computed(() => this.ownAriaHidden ?? 'true');
}
