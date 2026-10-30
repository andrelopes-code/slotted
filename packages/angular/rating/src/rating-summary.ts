import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { type PartialMessages, ratingMessages, type RatingMessages } from '@slotted/core/i18n';
import { formatRating, formatShare, summariseRatings } from '@slotted/core/rating';
import type { RatingInsight, RatingInsightThresholds } from '@slotted/core/rating';
import { createControllable } from '@slotted/core/state';
import type { ChangeRequest } from '@slotted/core/state';

import { cssNumber, formatCount, injectRatingDefaults } from './rating-defaults';
import type { RatingSize, RatingSummaryVariant, RatingTone } from './rating-defaults';

/** Stands in for the share while a message is written, so the share can be set apart. */
const SHARE_MARK = '\uE000';
import { SlRatingDisplay } from './rating-display';

/** Why the selected levels moved: a press, or Space or Enter on a level. */
export type RatingLevelsReason = 'pointer' | 'keyboard';

/** The tone each conclusion is drawn in, from the family's contract. */
const INSIGHT_TONE: Record<RatingInsight, 'success' | 'warning' | 'secondary'> = {
  divided: 'warning',
  few: 'secondary',
  consensus: 'success',
  mixed: 'secondary',
};

interface SummaryLevel {
  level: number;
  count: number;
  countText: string;
  /** The level's share of the total, for the bar of `bars`. */
  share: string;
  /** The level over the largest level, for the column of `spectrum`. */
  peak: string;
  shareText: string;
  label: string;
  pressed: boolean;
}

interface SummaryBucket {
  key: 'positive' | 'neutral' | 'negative';
  tone: 'success' | 'secondary' | 'danger';
  before: string;
  share: string;
  after: string;
}

/**
 * The aggregate of many ratings: the figure, how many readings it is made of,
 * and how they spread over the levels.
 *
 * `bars` draws one bar per level, highest first, the order every surveyed
 * summary uses. `spectrum` draws the same counts as columns over the scale,
 * lowest first, with the mean and its 95% interval laid over them, the
 * readings split into three buckets, and one conclusion — split, too few,
 * agreed, or none of those — so a 3,3 made of ones and fives does not read
 * like a 3,3 made of threes.
 *
 * With `filterable`, each level is a toggle button, and the pressed levels are
 * a selection the page filters its reviews by; a level nobody chose is
 * disabled, because a filter that returns nothing is a dead end.
 */
@Component({
  selector: 'section[slRatingSummary]',
  standalone: true,
  exportAs: 'slRatingSummary',
  imports: [NgTemplateOutlet, SlGlyph, SlIcon, SlRatingDisplay],
  template: `<ng-template #levelLabel let-level
      ><span data-part="level-label" data-part-level-label=""
        ><span>{{ level }}</span
        ><span slIcon><svg slGlyph name="star"></svg></span></span
    ></ng-template>
    <div data-part="aggregate" data-part-aggregate="">
      @if (summary().total > 0) {
        <span data-part="value" data-part-value="">{{ averageText() }}</span>
        <span data-part="scale" data-part-scale="">{{ scaleText() }}</span>
      }
      @if (insight(); as conclusion) {
        <span data-part="insight" data-part-insight="" [attr.data-tone]="conclusion.tone">{{
          conclusion.text
        }}</span>
      }
      @if (resolvedVariant() === 'bars') {
        <div
          slRatingDisplay
          size="sm"
          [tone]="resolvedTone()"
          [value]="summary().average ?? 0"
          [max]="resolvedMax()"
          [showValue]="false"
          [messages]="messages()"
          [locale]="resolvedLocale()"
        ></div>
      }
      <span data-part="count" data-part-count="">{{ countText() }}</span>
    </div>
    @if (resolvedVariant() === 'bars') {
      <ul
        data-part="distribution"
        data-part-distribution=""
        [attr.aria-label]="t('distributionLabel')"
      >
        @for (level of highestFirst(); track level.level) {
          <li>
            @if (filterable()) {
              <button
                data-part="level"
                data-part-level=""
                type="button"
                [attr.aria-pressed]="level.pressed ? 'true' : 'false'"
                [attr.data-pressed]="level.pressed ? '' : null"
                [attr.aria-label]="level.label"
                [attr.disabled]="level.count === 0 ? '' : null"
                (click)="toggle(level.level, $event)"
              >
                <ng-container *ngTemplateOutlet="levelBody; context: { $implicit: level }" />
              </button>
            } @else {
              <div
                data-part="level"
                data-part-level=""
                role="group"
                [attr.aria-label]="level.label"
              >
                <ng-container *ngTemplateOutlet="levelBody; context: { $implicit: level }" />
              </div>
            }
          </li>
        }
      </ul>
      <ng-template #levelBody let-level
        ><ng-container *ngTemplateOutlet="levelLabel; context: { $implicit: level.level }" /><span
          data-part="track"
          data-part-track=""
          aria-hidden="true"
          ><span
            data-part="indicator"
            data-part-indicator=""
            [style.--slotted-rating-share]="level.share"
          ></span></span
        ><span data-part="level-count" data-part-level-count="">{{
          level.countText
        }}</span></ng-template
      >
    } @else {
      <div data-part="plot" data-part-plot="">
        <div data-part="field" data-part-field="">
          <div data-part="columns" data-part-columns="">
            @for (level of lowestFirst(); track level.level) {
              @if (filterable()) {
                <button
                  data-part="column"
                  data-part-column=""
                  type="button"
                  [attr.aria-pressed]="level.pressed ? 'true' : 'false'"
                  [attr.data-pressed]="level.pressed ? '' : null"
                  [attr.aria-label]="level.label"
                  [attr.disabled]="level.count === 0 ? '' : null"
                  [style.--slotted-rating-share]="level.peak"
                  (click)="toggle(level.level, $event)"
                >
                  <span data-part="bar" data-part-bar=""></span>
                </button>
              } @else {
                <div
                  data-part="column"
                  data-part-column=""
                  role="group"
                  [attr.aria-label]="level.label"
                  [style.--slotted-rating-share]="level.peak"
                >
                  <span data-part="bar" data-part-bar=""></span>
                </div>
              }
            }
          </div>
          @if (summary().total > 0) {
            <span data-part="interval" data-part-interval="" aria-hidden="true"></span>
            <span data-part="mean" data-part-mean="" aria-hidden="true"
              ><span data-part="mean-label" data-part-mean-label="">{{ averageText() }}</span></span
            >
          }
        </div>
        <div data-part="axis" data-part-axis="" aria-hidden="true">
          @for (level of lowestFirst(); track level.level) {
            <span data-part="tick" data-part-tick=""
              ><ng-container
                *ngTemplateOutlet="levelLabel; context: { $implicit: level.level }"
              /><span data-part="tick-share" data-part-tick-share="">{{
                level.shareText
              }}</span></span
            >
          }
        </div>
      </div>
      @if (summary().total > 0) {
        <p data-part="sentiment" data-part-sentiment="">
          @for (bucket of buckets(); track bucket.key) {
            <span data-part="bucket" data-part-bucket="" [attr.data-tone]="bucket.tone"
              ><span data-part="swatch" data-part-swatch="" aria-hidden="true"></span
              >{{ bucket.before }}<strong>{{ bucket.share }}</strong
              >{{ bucket.after }}</span
            >
          }
        </p>
      }
    }`,
  styleUrl: '../../../styles/src/rating/rating.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-ui': 'rating',
    'data-ui-rating': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.data-variant]': "resolvedVariant() === 'bars' ? 'summary' : 'spectrum'",
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'resolvedTone()',
    '[style.--slotted-rating-mean]': 'meanProperties()?.mean ?? null',
    '[style.--slotted-rating-low]': 'meanProperties()?.low ?? null',
    '[style.--slotted-rating-high]': 'meanProperties()?.high ?? null',
  },
})
export class SlRatingSummary {
  /** How many readings each level holds, lowest level first — the order a store keeps them in. */
  readonly counts = input.required<readonly number[]>();
  /** How many levels the scale has. A level missing from `counts` holds none; one past it is dropped. */
  readonly max = input<number | undefined>(undefined);
  readonly variant = input<RatingSummaryVariant>('bars');
  /** Each level becomes a toggle button, and the pressed ones are `selectedLevels`. */
  readonly filterable = input(false, { transform: booleanAttribute });
  /** The levels pressed, ascending. Two-way; every move is asked first through `selectedLevelsChangeRequest`. */
  readonly selectedLevels = model<readonly number[]>([]);
  /** Merged over the application's thresholds, key by key. */
  readonly insightThresholds = input<Partial<RatingInsightThresholds> | undefined>(undefined);
  readonly showInsight = input(true, { transform: booleanAttribute });
  readonly size = input<RatingSize | undefined>(undefined);
  readonly tone = input<RatingTone | undefined>(undefined);
  /** Words laid over the catalog of the language in force, key by key. */
  readonly messages = input<PartialMessages<RatingMessages> | undefined>(undefined);
  /** The locale numbers are written in. Unstated, the language in force. */
  readonly locale = input<string | undefined>(undefined);

  /**
   * Emitted before the selection moves, with the levels asked for, the ones
   * they replace, the reason and the event. `cancel()` keeps the selection.
   */
  readonly selectedLevelsChangeRequest = output<ChangeRequest<readonly number[]>>();

  private readonly defaults = injectRatingDefaults();
  private readonly appLocale = injectLocale();
  /** The family's words in the language in force, with this summary's `messages` laid over them. */
  readonly t = injectMessages(ratingMessages, this.messages);

  readonly resolvedMax = computed(() => Math.max(1, Math.round(this.max() ?? this.defaults.max)));
  readonly resolvedVariant = computed(() => this.variant());
  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size);
  readonly resolvedTone = computed(() => this.tone() ?? this.defaults.tone);
  protected readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  private readonly thresholds = computed<RatingInsightThresholds>(() => ({
    ...this.defaults.insightThresholds,
    ...this.insightThresholds(),
  }));

  /** Everything drawn is read from here: `summariseRatings` over the counts on the scale. */
  readonly summary = computed(() => {
    const counts = this.counts();
    const levels = Array.from({ length: this.resolvedMax() }, (_, index) => counts[index] ?? 0);
    return summariseRatings(levels, this.thresholds());
  });

  protected readonly lowestFirst = computed<SummaryLevel[]>(() => {
    const { levels, total } = this.summary();
    const locale = this.resolvedLocale();
    const pressed = this.selectedLevels();
    const largest = Math.max(0, ...levels.map((level) => level.count));
    return [...levels].reverse().map(({ level, count, share }) => {
      const shareText = formatShare(share, locale);
      const countText = formatCount(count, locale);
      return {
        level,
        count,
        countText,
        share: cssNumber(total === 0 ? 0 : share, 4),
        peak: cssNumber(largest === 0 ? 0 : count / largest, 4),
        shareText,
        label: this.t('levelLabel', { level, count, share: shareText }),
        pressed: pressed.includes(level),
      };
    });
  });

  protected readonly highestFirst = computed(() => [...this.lowestFirst()].reverse());

  protected readonly averageText = computed(() => {
    const average = this.summary().average;
    return average === null ? '' : formatRating(average, this.resolvedLocale());
  });

  protected readonly scaleText = computed(() => this.t('scale', { max: this.resolvedMax() }));

  protected readonly countText = computed(() => {
    const { total, margin, interval } = this.summary();
    const locale = this.resolvedLocale();
    if (total === 0) return this.t('summaryEmpty');
    if (this.resolvedVariant() === 'bars') return this.t('summaryCount', { count: total });
    if (margin !== null && interval !== null && margin >= this.thresholds().margin) {
      return this.t('spectrumUncertain', {
        count: total,
        low: formatRating(interval[0], locale),
        high: formatRating(interval[1], locale),
      });
    }
    /* Two places, written here: the core writes a number to one place, and a
       margin of 0,04 would read as nought. */
    const written = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(margin ?? 0);
    return this.t('spectrumCount', { count: total, margin: written });
  });

  protected readonly insight = computed(() => {
    const insight = this.summary().insight;
    /* The conclusion is read from the spread, which only the spectrum draws. */
    if (this.resolvedVariant() !== 'spectrum' || !this.showInsight() || insight === null) {
      return null;
    }
    return { tone: INSIGHT_TONE[insight], text: this.t(insight) };
  });

  protected readonly buckets = computed<SummaryBucket[]>(() => {
    const { buckets } = this.summary();
    const locale = this.resolvedLocale();
    const tones = { positive: 'success', neutral: 'secondary', negative: 'danger' } as const;
    return (['positive', 'neutral', 'negative'] as const).map((key) => {
      const [before = '', after = ''] = this.t(key, { share: SHARE_MARK }).split(SHARE_MARK);
      return { key, tone: tones[key], before, share: formatShare(buckets[key], locale), after };
    });
  });

  protected readonly meanProperties = computed(() => {
    const { mean, interval } = this.summary();
    if (this.resolvedVariant() !== 'spectrum' || mean === null || interval === null) return null;
    return {
      mean: cssNumber(mean, 3),
      low: cssNumber(interval[0], 3),
      high: cssNumber(interval[1], 3),
    };
  });

  protected toggle(level: number, event: MouseEvent) {
    const held = this.selectedLevels();
    const next = held.includes(level)
      ? held.filter((candidate) => candidate !== level)
      : [...held, level].sort((a, b) => a - b);
    const state = createControllable<readonly number[]>({
      initial: held,
      /* Two fresh arrays are never the same object; the toggle always changes membership. */
      equals: () => false,
      onRequest: (request) => this.selectedLevelsChangeRequest.emit(request),
    });
    if (!state.request(next, event.detail === 0 ? 'keyboard' : 'pointer', event)) return;
    this.selectedLevels.set(next);
  }
}
