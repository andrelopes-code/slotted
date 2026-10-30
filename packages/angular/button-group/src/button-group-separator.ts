import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { SlButtonGroup } from './button-group';

/**
 * A rule between two runs of actions. It takes no room at all: the bar is one
 * shape, and a rule is not licence to cut it — what the rule marks is painted
 * in the column the shared edge already occupies, one step stronger than the
 * seams around it, so the boundary reads without the bar coming apart. A
 * filled run keeps its seam, which is the darkest step of its own tone and the
 * strongest line that bar has.
 *
 * Its axis is the group's, mirrored: a rule across a row is vertical. It is
 * derived rather than accepted, because a rule that could disagree with the
 * group it divides is a rule that eventually does.
 */
@Component({
  selector: '[slButtonGroupSeparator]',
  standalone: true,
  exportAs: 'slButtonGroupSeparator',
  template: '',
  styleUrl: '../../../styles/src/button-group/button-group.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-part': 'separator',
    'data-part-separator': '',
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.aria-orientation]': 'axis()',
  },
})
export class SlButtonGroupSeparator {
  private readonly group = inject(SlButtonGroup, { optional: true });

  /**
   * Drops the rule out of the accessibility tree. Use it when the boundary is
   * cosmetic; a boundary that carries meaning is better said by a nested group
   * with a name of its own.
   */
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly axis = computed(() => {
    if (this.decorative()) return null;
    return (this.group?.flow() ?? 'horizontal') === 'vertical' ? 'horizontal' : 'vertical';
  });
}
