import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type DividerOrientation = 'horizontal' | 'vertical';

/**
 * Bound to `hr`, the element that already carries the separator role. The
 * component writes only the two departures from it: `role="none"` for a rule
 * that is decoration, and `aria-orientation` for one that runs vertically.
 */
@Component({
  selector: 'hr[slDivider]',
  standalone: true,
  template: '',
  styleUrl: '../../../styles/src/divider/divider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-divider',
    'data-slotted-component': 'divider',
    'data-part': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-orientation]': "orientation() === 'vertical' ? 'vertical' : null",
    '[attr.role]': 'role()',
  },
})
export class SlDivider {
  readonly decorative = input(false, { transform: booleanAttribute });
  readonly orientation = input<DividerOrientation>('horizontal');

  private readonly ownRole = inject(ElementRef<HTMLElement>).nativeElement.getAttribute('role');

  readonly role = computed(() => this.ownRole ?? (this.decorative() ? 'none' : null));
}
