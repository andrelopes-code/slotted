import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlVisuallyHidden } from '@slotted/angular/visually-hidden';

import { SlStatCard, optionalNumber } from './stat-card';
import {
  toneOf,
  trendOf,
  type StatCardDeltaFormat,
  type StatCardGoodWhen,
  type StatCardTone,
} from './stat-card.constants';

/**
 * The change, with the mark that says which way and the word a screen reader
 * hears before the number. `value` is the root's `delta` unless the part
 * states its own, so a second delta on one card — month over month beside
 * year over year — is one more part with one more value.
 *
 * `percent` reads the value as a fraction, which is what a division gives;
 * the sign is always shown except on nought. The tone is derived from the
 * direction and from `goodWhen`, never from the sign, and an explicit `tone`
 * wins.
 */
@Component({
  selector: '[slStatCardDelta]',
  standalone: true,
  imports: [SlGlyph, SlIcon, SlSkeleton, SlVisuallyHidden],
  /* One glyph for a rise and a fall, turned over by the sheet for a fall. */
  template: `@if (card.loading()) {
      <span slSkeleton inlineSize="3.5em"></span>
    } @else {
      <span data-part="indicator" data-part-indicator="" aria-hidden="true"
        ><span slIcon [directional]="trend() !== 'flat'"
          ><svg slGlyph [name]="trend() === 'flat' ? 'minus' : 'trending-up'"></svg></span></span
      ><span slVisuallyHidden>{{ card.t(trend()) }} </span>{{ formatted() }}<ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCardDelta',
  host: {
    'data-part': 'delta',
    'data-part-delta': '',
    '[attr.data-trend]': 'card.loading() ? "flat" : trend()',
    '[attr.data-tone]': 'card.loading() ? "neutral" : resolvedTone()',
    '[attr.hidden]': 'shown() ? null : ""',
  },
})
export class SlStatCardDelta {
  /** The change. Unset, the root's `delta`. */
  readonly value = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** `percent` reads the value as a fraction; `decimal` reads it as it is. */
  readonly format = input<StatCardDeltaFormat>('percent');
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** Unset, the root's. */
  readonly goodWhen = input<StatCardGoodWhen | undefined>(undefined);
  /** An explicit tone, which wins over the one derived from `goodWhen`. */
  readonly tone = input<StatCardTone | undefined>(undefined);

  protected readonly card = inject(SlStatCard);

  readonly change = computed(() => this.value() ?? this.card.delta());
  readonly trend = computed(() => trendOf(this.change()));
  readonly resolvedTone = computed(
    () => this.tone() ?? toneOf(this.trend(), this.goodWhen() ?? this.card.resolvedGoodWhen()),
  );
  readonly shown = computed(() => this.card.loading() || this.card.status() === 'ready');

  readonly formatted = computed(() => {
    const change = this.change();
    if (typeof change !== 'number') return '';
    return new Intl.NumberFormat(this.card.resolvedLocale(), {
      signDisplay: 'exceptZero',
      ...(this.format() === 'percent' ? { style: 'percent', maximumFractionDigits: 1 } : {}),
      ...this.card.resolvedFormatOptions(),
      ...this.formatOptions(),
    }).format(change);
  });
}
