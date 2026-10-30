import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { toneAttribute } from './icon.types';
import type { IconSize, IconTone } from './icon.types';

/**
 * Icon is the box a glyph is drawn in, not the glyph. The library ships no
 * catalogue: the artwork is the consumer's — an `ng-icon`, an inline `svg`,
 * anything that renders one — and this family owns the size it is drawn at,
 * the colour it inherits, where it sits against a line of text, and whether it
 * mirrors where reading runs the other way.
 *
 * The selector is the bare attribute, so the consumer writes the element. It
 * is a component rather than a directive only because a directive carries no
 * `styleUrl`, and that also means it cannot sit on `<ng-icon>` itself: Angular
 * refuses two components on one element, so the box is always written.
 */
@Component({
  selector: '[slIcon]',
  standalone: true,
  exportAs: 'slIcon',
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/icon/icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'icon',
    'data-ui-icon': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-tone]': 'toneAttribute()',
    '[attr.data-directional]': 'directional() ? "" : null',
    '[attr.role]': 'role()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-hidden]': 'named() ? null : "true"',
  },
})
export class SlIcon {
  readonly directional = input(false, { transform: booleanAttribute });
  readonly label = input<string>();
  readonly size = input<IconSize>();
  readonly tone = input<IconTone>();

  /**
   * A name the consumer wrote on the element counts as much as the input, and
   * has to be read rather than assumed absent: a host binding that wrote
   * `null` would delete the consumer's own `aria-label` and hide the icon it
   * named, which is a silent defect in the likeliest mistake. `aria-labelledby`
   * is read and never written, so the attribute the consumer put there stays
   * exactly as written.
   */
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly writtenLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly ariaLabel = computed(() => this.label() ?? this.writtenLabel);

  /**
   * The icon is decorative when it has no name and meaningful when it has one,
   * which is why there is no `decorative` input: named and hidden cannot both
   * be true.
   */
  protected readonly named = computed(
    () => this.ariaLabel() !== null || this.writtenLabelledBy !== null,
  );

  /**
   * `role="img"` requires a name, so it appears only once there is one, and a
   * role the consumer chose is left alone.
   */
  protected readonly role = computed(() =>
    this.writtenRole === null ? (this.named() ? 'img' : null) : this.writtenRole,
  );

  protected readonly toneAttribute = computed(() => toneAttribute(this.tone()));
}
