import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type BadgeVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type BadgeFill = 'solid' | 'outline' | 'subtle';
export type BadgeSize = 'sm' | 'md';

/**
 * A badge states an appearance and nothing else. It carries no role: what a
 * badge means comes from where it sits, and a role invented here would be
 * wrong more often than it was right.
 */
@Component({
  selector: 'span[slBadge]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/badge/badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-badge',
    'data-slotted-component': 'badge',
    'data-part': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-fill]': 'fill()',
    '[attr.data-size]': 'size()',
  },
})
export class SlBadge {
  readonly fill = input<BadgeFill>('solid');
  readonly size = input<BadgeSize>('md');
  readonly variant = input<BadgeVariant>('secondary');
}
