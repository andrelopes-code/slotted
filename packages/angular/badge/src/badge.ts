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

import { formatCount } from '@slotted/core/count';

import { injectBadgeDefaults } from './badge-defaults';
import type { BadgeLive, BadgeShape, BadgeSize, BadgeTone, BadgeVariant } from './badge-defaults';

export type {
  BadgeLive,
  BadgeOverlap,
  BadgePlacement,
  BadgeShape,
  BadgeSize,
  BadgeTone,
  BadgeVariant,
} from './badge-defaults';

const ROLE: Record<BadgeLive, string | null> = { off: null, polite: 'status', assertive: 'alert' };

/**
 * A short, non-editable piece of metadata: a count, a status, a label. It is
 * never a command — it answers no hover and gives no press feedback — and it
 * carries no role of its own, because what a badge means comes from where it
 * sits.
 *
 * The directive is written on the element the page chose, so a `span` in a
 * sentence, a `dd` in a description list and an `a` that navigates are all the
 * same badge.
 *
 * `count` is the one place the family does work rather than paint. The ceiling
 * above which a count becomes `99+`, whether nought is a value or an absence,
 * and which locale writes the digits are three decisions every consumer would
 * otherwise take again, and `@slotted/core/count` is where both bindings take
 * them once.
 */
@Component({
  selector: '[slBadge]',
  standalone: true,
  exportAs: 'slBadge',
  /**
   * The text has a box of its own so `text-box` can trim its line to the cap
   * and the baseline: a flex container's own text lives in an anonymous item no
   * stylesheet can reach. The glyphs are projected by selector, so they stay
   * siblings of that box rather than joining the line inside it.
   */
  template: `<ng-content select="[slBadgeStart]"></ng-content
    ><span data-part="label" data-part-label="">{{ value() }}<ng-content></ng-content></span
    ><ng-content select="[slBadgeEnd]"></ng-content>`,
  styleUrl: '../../../styles/src/badge/badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'badge',
    'data-ui-badge': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': 'resolvedVariant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-shape]': 'resolvedShape()',
    '[attr.role]': 'role()',
    /**
     * React returns nothing for a count that has fallen to nought. This
     * directive is written on an element the consumer owns, so it cannot
     * un-write it; `display: none` is the same outcome the platform can give
     * from here — no box, no layout, and nothing in the accessibility tree.
     * The inline style is what beats the family's own `display: inline-flex`,
     * which the `hidden` attribute would lose to.
     */
    '[style.display]': "empty() ? 'none' : null",
  },
})
export class SlBadge {
  /** Defaults to the provider, then to `secondary`. */
  readonly tone = input<BadgeTone>();
  /** Defaults to the provider, then to `soft`. */
  readonly variant = input<BadgeVariant>();
  /** Defaults to the provider, then to `md`. */
  readonly size = input<BadgeSize>();
  /** `dot` draws no value; the words it cannot say are projected content. */
  readonly shape = input<BadgeShape>();
  /**
   * Whether a change to this badge is announced, and how urgently. `off` by
   * default: a page of twenty badges that all announce is a page no screen
   * reader user can read.
   */
  readonly live = input<BadgeLive>('off');
  /** The number the badge shows, written before any projected content. */
  readonly count = input<number | undefined>(undefined);
  /**
   * The largest count written in full; above it the badge shows the ceiling and
   * a `+`. `false` removes the ceiling. Defaults to the provider, then to `99`.
   */
  readonly max = input<number | false | undefined>(undefined);
  /** Whether a count of nought is a value worth showing or an absence worth hiding. */
  readonly showZero = input(false, { transform: booleanAttribute });
  /** BCP 47, for the digits of `count`. Defaults to the provider, then to the runtime. */
  readonly locale = input<string | undefined>(undefined);

  private readonly defaults = injectBadgeDefaults();
  /** An explicit role the consumer wrote is never replaced by an inferred one. */
  private readonly writtenRole = inject(new HostAttributeToken('role'), { optional: true });

  protected readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  protected readonly resolvedVariant = computed(() => this.variant() ?? this.defaults.variant);
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  protected readonly resolvedShape = computed(() => this.shape() ?? this.defaults.shape);

  protected readonly role = computed(() => this.writtenRole ?? ROLE[this.live()]);

  private readonly counted = computed(() => {
    const count = this.count();
    if (count === undefined) return undefined;
    return formatCount({
      count,
      max: this.max() ?? this.defaults.max,
      showZero: this.showZero(),
      locale: this.locale() ?? this.defaults.locale,
    });
  });

  /**
   * A count that has fallen to nought leaves the corner rather than sitting
   * there as a blank circle. A badge given no count at all is untouched by the
   * rule: an empty `dot` is the whole point of that shape.
   */
  protected readonly empty = computed(
    () => this.count() !== undefined && this.counted() === undefined,
  );

  /** A dot draws no value at any size. */
  protected readonly value = computed(() =>
    this.resolvedShape() === 'dot' ? '' : (this.counted() ?? ''),
  );
}
