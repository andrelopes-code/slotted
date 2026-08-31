import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  model,
  ViewEncapsulation,
} from '@angular/core';

/**
 * A `details` element, so the expanded state, the keyboard model and the role
 * come from the platform. The component adds only the two-way value the rest
 * of the library uses.
 */
@Component({
  selector: 'details[slCollapsible]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/collapsible/collapsible.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-collapsible',
    'data-slotted-component': 'collapsible',
    'data-part': 'root',
    '[attr.open]': "open() ? '' : null",
    '(toggle)': 'handleToggle()',
  },
})
export class SlCollapsible {
  readonly open = model(false);

  private readonly element = inject(ElementRef<HTMLDetailsElement>).nativeElement;

  handleToggle() {
    const next = this.element.open;
    if (next === this.open()) return;
    this.open.set(next);
  }
}
