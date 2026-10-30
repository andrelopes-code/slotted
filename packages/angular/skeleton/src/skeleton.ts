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

import { injectSkeletonDefaults } from './skeleton-defaults';
import { SlSkeletonRegion } from './skeleton-region';
import {
  SKELETON_DEFAULT_ANIMATION,
  SKELETON_DEFAULT_SHAPE,
  SKELETON_DEFAULT_SIZE,
  type SkeletonAnimation,
  type SkeletonShape,
  type SkeletonSize,
} from './skeleton.constants';

/**
 * One placeholder box.
 *
 * With no projected content it draws the geometry `shape` and `size` describe.
 * With content it takes *that* content's geometry and covers it, which is the
 * only form in which the reserved space cannot disagree with what replaces it
 * — MUI infers the box from `children` and React Spectrum clones the child
 * with a skeleton class, and both arrive here. The stylesheet tells the two
 * apart with `:empty`, so nothing has to be declared about which one this is.
 *
 * Hidden from assistive technology and taken out of the tab order while it is
 * painted: reading out the absence of something is noise, and focus must not
 * fall into content that is not ready. An `aria-hidden` the consumer wrote on
 * their own element is read once through `HostAttributeToken` and kept, which
 * is the escape hatch this family established in August.
 *
 * The selector is a bare attribute, so the element stays the consumer's: a
 * placeholder standing in for a word belongs in a `span` and one standing in
 * for a card belongs in whatever the card is.
 */
@Component({
  selector: '[slSkeleton]',
  standalone: true,
  template: '<ng-content />',
  styleUrl: '../../../styles/src/skeleton/skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSkeleton',
  host: {
    'data-ui': 'skeleton',
    'data-ui-skeleton': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-shape]': 'shape()',
    '[attr.data-size]': 'size()',
    '[attr.data-animation]': 'animationValue()',
    '[attr.data-loading]': 'painted() ? "" : null',
    '[attr.aria-hidden]': 'ariaHidden()',
    '[attr.inert]': 'painted() ? "" : null',
    '[style.--slotted-skeleton-inline-size]': 'inlineSize()',
    '[style.--slotted-skeleton-block-size]': 'blockSize()',
  },
})
export class SlSkeleton {
  readonly shape = input<SkeletonShape>(SKELETON_DEFAULT_SHAPE);
  readonly size = input<SkeletonSize>(SKELETON_DEFAULT_SIZE);
  readonly animation = input<SkeletonAnimation | undefined>(undefined);
  readonly loading = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  /**
   * The geometry, named for the axes the layout is written in rather than for
   * the screen's. Every rule in this library is logical, and a `width` input
   * feeding an `inline-size` declaration would be one word lying about the
   * other.
   */
  readonly inlineSize = input<string | undefined>(undefined);
  readonly blockSize = input<string | undefined>(undefined);

  private readonly defaults = injectSkeletonDefaults();
  /** `null` outside a region, which is how "nobody said" differs from "false". */
  private readonly region = inject(SlSkeletonRegion, { optional: true, skipSelf: true });
  private readonly ownAriaHidden = inject(new HostAttributeToken('aria-hidden'), {
    optional: true,
  });

  readonly painted = computed(() => this.loading() ?? this.region?.painted() ?? true);
  readonly animationValue = computed(
    () =>
      this.animation() ??
      this.region?.animationValue() ??
      this.defaults.animation ??
      SKELETON_DEFAULT_ANIMATION,
  );

  readonly ariaHidden = computed(() =>
    this.painted() ? (this.ownAriaHidden ?? 'true') : this.ownAriaHidden,
  );
}

/**
 * Absence has to survive the transform. `booleanAttribute` maps an unset input
 * to `false`, and `false` is a value: it would stop the region's own answer
 * from ever reaching a placeholder that says nothing.
 */
export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}
