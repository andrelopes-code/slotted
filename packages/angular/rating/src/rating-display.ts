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
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { type PartialMessages, ratingMessages, type RatingMessages } from '@slotted/core/i18n';
import { formatRating, formatRatingValue, ratingFills } from '@slotted/core/rating';

import { cssNumber, formatCount, injectRatingDefaults } from './rating-defaults';
import type { RatingDisplayVariant, RatingSize, RatingTone } from './rating-defaults';

/**
 * A rating the page reports rather than asks for: an image of lit symbols
 * named by the number it draws.
 *
 * Any fraction is drawn — 4,6 lights six tenths of the fifth star — because
 * nothing here is a target; the input member offers whole and half steps
 * only. `compact` and `histogram` draw one lit star beside the number, for a
 * row of a table or a card, and `histogram` adds the distribution as bars,
 * each level over the largest, so a split between the two ends is visible at
 * a glance where a mean of 3,3 would hide it.
 */
@Component({
  selector: 'div[slRatingDisplay]',
  standalone: true,
  exportAs: 'slRatingDisplay',
  imports: [SlGlyph, SlIcon],
  template: `<div data-part="symbols" data-part-symbols="">
      @for (fill of fills(); track $index) {
        <span data-part="item" data-part-item="" [style.--slotted-rating-fill]="fill"
          ><span data-part="symbol" data-part-symbol=""
            ><span slIcon><svg slGlyph name="star"></svg></span></span
          ><span data-part="fill" data-part-fill=""
            ><span slIcon><svg slGlyph name="star"></svg></span></span
        ></span>
      }
    </div>
    @if (showValue()) {
      <span data-part="value" data-part-value="" aria-hidden="true">{{ valueText() }}</span>
    }
    @if (resolvedVariant() === 'histogram') {
      <span data-part="histogram" data-part-histogram="" aria-hidden="true">
        @for (share of shares(); track $index) {
          <span data-part="bar" data-part-bar="" [style.--slotted-rating-share]="share"></span>
        }
      </span>
    }
    @if (countText(); as text) {
      <span data-part="count" data-part-count="" aria-hidden="true">{{ text }}</span>
    }`,
  styleUrl: '../../../styles/src/rating/rating.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'rating',
    'data-ui-rating': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'img',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'resolvedTone()',
    '[attr.data-variant]': "resolvedVariant() === 'full' ? null : resolvedVariant()",
    '[attr.aria-label]': 'label()',
  },
})
export class SlRatingDisplay {
  /** The number drawn. Any fraction; clamped to the scale when it is drawn. */
  readonly value = input.required<number>();
  readonly max = input<number | undefined>(undefined);
  readonly size = input<RatingSize | undefined>(undefined);
  readonly tone = input<RatingTone | undefined>(undefined);
  readonly variant = input<RatingDisplayVariant>('full');
  /** How many readings the value is made of. Written beside it and in the name. */
  readonly count = input<number | undefined>(undefined);
  /** Counts per level, lowest first, for the `histogram` variant. */
  readonly distribution = input<readonly number[] | undefined>(undefined);
  readonly showValue = input(true, { transform: booleanAttribute });
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<RatingMessages> | undefined>(undefined);
  /** The locale numbers are written in. Unstated, the language in force. */
  readonly locale = input<string | undefined>(undefined);

  private readonly defaults = injectRatingDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this display's `messages` laid over them. */
  readonly t = injectMessages(ratingMessages, this.messages);
  private readonly writtenLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  readonly resolvedMax = computed(() => Math.max(1, Math.round(this.max() ?? this.defaults.max)));
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  readonly resolvedVariant = computed(() => this.variant());
  private readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());

  /** The value clamped to the scale, and `NaN` read as nought. */
  private readonly drawn = computed(() => {
    const value = this.value();
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), this.resolvedMax()) : 0;
  });

  /** Every symbol's lit share; one full star for the variants that draw one. */
  protected readonly fills = computed(() =>
    this.resolvedVariant() === 'full'
      ? ratingFills(this.drawn(), this.resolvedMax()).map((fill) => cssNumber(fill, 4))
      : ['1'],
  );

  protected readonly shares = computed(() => {
    const counts = (this.distribution() ?? []).map((count) =>
      Number.isFinite(count) ? Math.max(0, count) : 0,
    );
    const largest = Math.max(0, ...counts);
    return counts.map((count) => cssNumber(largest === 0 ? 0 : count / largest, 4));
  });

  protected readonly valueText = computed(() => formatRating(this.drawn(), this.resolvedLocale()));

  protected readonly countText = computed(() => {
    const count = this.count();
    if (count === undefined) return null;
    const text = formatCount(count, this.resolvedLocale());
    return this.resolvedVariant() === 'histogram' ? text : `(${text})`;
  });

  protected readonly label = computed(() => {
    if (this.writtenLabel !== null) return this.writtenLabel;
    const count = this.count();
    const value = formatRatingValue(this.drawn(), this.resolvedLocale());
    const max = this.resolvedMax();
    return count === undefined
      ? this.t('displayLabel', { value, max })
      : this.t('displayLabelWithCount', { value, max, count });
  });
}
