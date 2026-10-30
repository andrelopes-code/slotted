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

/** Where the label sits along the rule, in logical terms. */
export type DividerAlign = 'start' | 'center' | 'end';

/**
 * A rule between two regions, written on the element the consumer chose. On an
 * `hr` the element already means separation and the component writes no role;
 * on anything else — the `li` a menu separator has to be, or the `div` a label
 * needs — it writes `role="separator"` instead.
 *
 * A label is a string rather than projected content, because the name has to
 * reach `aria-label`: the separator role makes its children presentational, so
 * the visible label never reaches the accessibility tree on its own.
 */
@Component({
  selector: '[slDivider]',
  standalone: true,
  exportAs: 'slDivider',
  template: `
    @if (labelled()) {
      <span data-part="label" data-part-label="">{{ label() }}</span>
    }
  `,
  styleUrl: '../../../styles/src/divider/divider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'divider',
    'data-ui-divider': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-align]': 'labelled() ? align() : null',
    '[attr.data-inset]': "inset() ? '' : null",
    '[attr.data-labelled]': "labelled() ? '' : null",
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-orientation]': "!decorative() && orientation() === 'vertical' ? 'vertical' : null",
  },
})
export class SlDivider {
  readonly align = input<DividerAlign>('center');
  readonly decorative = input(false, { transform: booleanAttribute });
  readonly inset = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  readonly orientation = input<DividerOrientation>('horizontal');

  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  /**
   * What the consumer wrote on the element themselves. Read once, before the
   * host bindings run, because a binding that resolves to `null` removes the
   * attribute rather than leaving the consumer's value in place.
   */
  private readonly ownRole = this.element.getAttribute('role');
  private readonly ownLabel = this.element.getAttribute('aria-label');
  private readonly rendersOwnRule = this.element.tagName === 'HR';

  protected readonly labelled = computed(() => this.label() !== undefined);

  readonly role = computed(() => {
    if (this.ownRole !== null) return this.ownRole;
    if (this.decorative()) return 'none';
    return this.rendersOwnRule ? null : 'separator';
  });

  /* A rule that is decoration has no name to give: role="none" prohibits one. */
  protected readonly ariaLabel = computed(
    () => this.ownLabel ?? (this.decorative() ? null : (this.label() ?? null)),
  );
}
