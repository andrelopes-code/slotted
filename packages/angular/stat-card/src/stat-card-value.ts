import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { inject } from '@angular/core';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { figureRuns } from '@slotted/core/number';

import { SlStatCard } from './stat-card';
import { SlStatCardUnit } from './stat-card-parts';

export type StatCardValueEmphasis = 'none' | 'whole';

/**
 * The number. A numeric `value` is formatted with the card's locale and
 * `formatOptions` — `notation: 'compact'` is how 12,900 becomes 12.9K — and
 * projected content is the consumer's own rendering, unit and all, after
 * it. A missing or failed value is the `empty` message, a dash; a loading
 * one is a placeholder five figures wide, on the value's own line.
 * `emphasis="whole"` draws the symbol, the decimals and the suffix in the
 * `unit` part.
 */
@Component({
  selector: '[slStatCardValue]',
  standalone: true,
  imports: [SlSkeleton, SlStatCardUnit],
  template: `@if (card.loading()) {
      <span slSkeleton inlineSize="5ch"></span>
    } @else if (card.status() !== 'ready') {
      {{ card.t('empty') }}
    } @else {
      @for (run of runs(); track $index) {
        @if (run.secondary) {
          <span slStatCardUnit>{{ run.text }}</span>
        } @else {
          <ng-container>{{ run.text }}</ng-container>
        }
      }
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCardValue',
  host: { 'data-part': 'value', 'data-part-value': '' },
})
export class SlStatCardValue {
  /** A number, formatted with the card's locale and `formatOptions`; the text otherwise. */
  readonly value = input<number | string | undefined>(undefined);
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /**
   * `whole` draws a numeric value's symbol, decimals and suffix in the `unit`
   * part, so the whole units carry the figure. `none`, the default, draws one
   * run of text. The text is the formatter's either way.
   */
  readonly emphasis = input<StatCardValueEmphasis>('none');

  protected readonly card = inject(SlStatCard);

  readonly formatted = computed(() =>
    this.runs()
      .map((run) => run.text)
      .join(''),
  );

  protected readonly runs = computed(() => {
    const value = this.value();
    if (typeof value !== 'number') return [{ text: value ?? '', secondary: false }];
    const format = new Intl.NumberFormat(
      this.card.resolvedLocale(),
      this.formatOptions() ?? this.card.resolvedFormatOptions(),
    );
    if (this.emphasis() === 'none') return [{ text: format.format(value), secondary: false }];
    return figureRuns(format.formatToParts(value));
  });
}
