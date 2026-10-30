import { computed, Directive, input } from '@angular/core';

import type { BadgeOffset, BadgeOverlap, BadgePlacement } from './badge-defaults';

/**
 * The frame that places a badge on the corner of something else. It is written
 * on the element the page already has around the host — a `span`, a `div`, the
 * `li` of a list — rather than wrapping it, which is the one place this binding
 * is the smaller of the two: React must render a wrapper of its own.
 *
 * It does not rewrite the host's semantics. The badge is read after the host in
 * document order, and an interactive host whose name must carry the count wires
 * `aria-describedby` to the badge's own id, or names the count in its own
 * `aria-label`. Both wirings are on the reference page.
 */
@Directive({
  selector: '[slBadgeAnchor]',
  standalone: true,
  exportAs: 'slBadgeAnchor',
  host: {
    'data-ui': 'badge',
    'data-ui-badge': '',
    'data-part': 'anchor',
    'data-part-anchor': '',
    '[attr.data-placement]': 'resolvedPlacement()',
    '[attr.data-overlap]': 'resolvedOverlap()',
    '[style.--slotted-badge-anchor-offset-x]': 'offsetX()',
    '[style.--slotted-badge-anchor-offset-y]': 'offsetY()',
  },
})
export class SlBadgeAnchor {
  /** Which corner of the host the badge sits on. Mirrors in a right-to-left document. */
  readonly placement = input<BadgePlacement>();
  /** `circle` moves the badge in from the corner far enough to meet the curve. */
  readonly overlap = input<BadgeOverlap>();
  /**
   * Moves the badge off the corner the frame computed, in pixels. `overlap` has
   * two values and hosts have many: how far a badge sits into one depends on
   * that host's own curve, shadow and optical weight.
   */
  readonly offset = input<BadgeOffset>();

  protected readonly resolvedPlacement = computed(() => this.placement() ?? 'top-end');
  protected readonly resolvedOverlap = computed(() => this.overlap() ?? 'rectangle');
  /**
   * An axis the page did not state is `null`, which removes the property rather
   * than writing nought into it: the sheet's own default is what answers, and a
   * theme that moves it still wins.
   */
  protected readonly offsetX = computed(() => length(this.offset()?.x));
  protected readonly offsetY = computed(() => length(this.offset()?.y));
}

function length(value: number | undefined): string | null {
  return value === undefined ? null : `${value}px`;
}
