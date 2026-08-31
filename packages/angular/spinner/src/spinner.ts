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

export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * The label is projected as hidden text rather than set as an aria-label,
 * because the host is a live region: a region announces the content it gains,
 * and an attribute is not content.
 */
@Component({
  selector: 'span[slSpinner]',
  standalone: true,
  template: `
    <span aria-hidden="true" data-part="indicator"></span>
    @if (!decorative()) {
      <span class="slotted-visually-hidden" data-part="label">{{ label() }}</span>
    }
  `,
  styleUrls: [
    '../../../styles/src/spinner/spinner.css',
    '../../../styles/src/visually-hidden/visually-hidden.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-spinner',
    'data-slotted-component': 'spinner',
    'data-part': 'root',
    '[attr.data-size]': 'size()',
    '[attr.role]': 'role()',
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
  },
})
export class SlSpinner {
  readonly decorative = input(false, { transform: booleanAttribute });
  readonly label = input('Loading');
  readonly size = input<SpinnerSize>('md');

  private readonly ownRole = inject(ElementRef<HTMLElement>).nativeElement.getAttribute('role');

  readonly role = computed(() => this.ownRole ?? (this.decorative() ? null : 'status'));
}
