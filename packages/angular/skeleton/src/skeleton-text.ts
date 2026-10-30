import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';

import { injectSkeletonDefaults } from './skeleton-defaults';
import { SlSkeletonRegion } from './skeleton-region';
import { optionalBoolean } from './skeleton';
import {
  SKELETON_DEFAULT_ANIMATION,
  SKELETON_DEFAULT_LINES,
  type SkeletonAnimation,
} from './skeleton.constants';

/**
 * The rows of a paragraph that has not arrived.
 *
 * Each row is exactly one line box and the bar inside it is one em, so `lines`
 * rows occupy exactly the `lines` lines of the paragraph they stand in — at
 * every type size and every density, because both come from the type the rows
 * are placed in rather than from a number typed here. Every implementation
 * surveyed while this family was rebuilt states a pixel height instead, and is
 * therefore right at one density and wrong at the others.
 *
 * The last row is drawn short, which is what makes a stack of bars read as
 * prose rather than as a barcode — and only when there is more than one, since
 * a lone row cut to 62% stands for a sentence that was never there. The widths
 * are fixed rather than random: Carbon randomises them, and a randomised width
 * is a hydration mismatch waiting for its first server-rendered page.
 */
@Component({
  selector: '[slSkeletonText]',
  standalone: true,
  template: `@for (row of rows(); track row) {
    <span data-part="line" data-part-line=""></span>
  }`,
  styleUrl: '../../../styles/src/skeleton/skeleton.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slSkeletonText',
  host: {
    'data-ui': 'skeleton',
    'data-ui-skeleton': '',
    'data-part': 'text',
    'data-part-text': '',
    '[attr.data-animation]': 'animationValue()',
    '[attr.data-loading]': 'painted() ? "" : null',
    '[attr.aria-hidden]': 'painted() ? "true" : null',
    '[attr.inert]': 'painted() ? "" : null',
    '[style.--slotted-skeleton-inline-size]': 'inlineSize()',
    '[style.--slotted-skeleton-last-line-size]': 'lastLineSizeValue()',
  },
})
export class SlSkeletonText {
  readonly lines = input(SKELETON_DEFAULT_LINES, { transform: numberAttribute });
  readonly animation = input<SkeletonAnimation | undefined>(undefined);
  readonly loading = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly lastLineSize = input<string | undefined>(undefined);
  readonly inlineSize = input<string | undefined>(undefined);

  private readonly defaults = injectSkeletonDefaults();
  private readonly region = inject(SlSkeletonRegion, { optional: true, skipSelf: true });

  readonly painted = computed(() => this.loading() ?? this.region?.painted() ?? true);
  readonly animationValue = computed(
    () =>
      this.animation() ??
      this.region?.animationValue() ??
      this.defaults.animation ??
      SKELETON_DEFAULT_ANIMATION,
  );
  readonly lastLineSizeValue = computed(() => this.lastLineSize() ?? this.defaults.lastLineSize);

  /**
   * No rows at all once the paragraph has arrived. The element stays, and the
   * stylesheet takes it out of layout, so nothing the consumer wrote beside it
   * is remounted on the way through.
   *
   * A paragraph of no rows is not a paragraph, whatever arithmetic produced
   * the number, so the count never falls below one.
   */
  readonly rows = computed(() => {
    if (!this.painted()) return [];
    const count = Math.max(1, Math.trunc(this.lines()) || 1);
    return Array.from({ length: count }, (_, row) => row);
  });
}
