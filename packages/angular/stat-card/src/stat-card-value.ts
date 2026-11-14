import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { inject } from '@angular/core';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { playCount } from '@slotted/core/count';
import { figureRuns } from '@slotted/core/number';

import { SlStatCard } from './stat-card';
import { SlStatCardUnit } from './stat-card-parts';

export type StatCardValueEmphasis = 'none' | 'whole';

export type StatCardValueTransition = 'none' | 'count';

/**
 * The number. A numeric `value` is formatted with the card's locale and
 * `formatOptions` — `notation: 'compact'` is how 12,900 becomes 12.9K — and
 * projected content is the consumer's own rendering, unit and all, after
 * it. A missing or failed value is the `empty` message, a dash; a loading
 * one is a placeholder five figures wide, on the value's own line.
 * `emphasis="whole"` draws the symbol, the decimals and the suffix in the
 * `unit` part.
 *
 * `transition="count"` moves a changed numeric value from the number it
 * showed, each frame drawn by the same formatter. The moving figure is hidden
 * from assistive technology and the final one is said instead, so a reader
 * hears one number.
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
      @if (moving()) {
        <span aria-hidden="true">{{ format().format(shown()) }}</span>
        <span data-ui="visually-hidden" data-ui-visually-hidden="">{{ formatted() }}</span>
      } @else {
        @for (run of runs(); track $index) {
          @if (run.secondary) {
            <span slStatCardUnit>{{ run.text }}</span>
          } @else {
            <ng-container>{{ run.text }}</ng-container>
          }
        }
      }
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCardValue',
  host: { 'data-part': 'value', 'data-part-value': '' },
  styleUrls: ['../../../styles/src/visually-hidden/visually-hidden.css'],
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
  /**
   * `count` moves a changed numeric value from the number it showed over the
   * theme's long duration; the first render and a loading or empty card show
   * the value as it is. `none`, the default, replaces it in one frame.
   */
  readonly transition = input<StatCardValueTransition>('none');

  protected readonly card = inject(SlStatCard);
  protected readonly shown = signal(0);
  /* True from the first frame of a move to its last, so nothing is hidden before a move starts. */
  private readonly active = signal(false);
  private readonly counting = computed(
    () =>
      this.transition() === 'count' &&
      typeof this.value() === 'number' &&
      !this.card.loading() &&
      this.card.status() === 'ready',
  );
  protected readonly moving = computed(() => this.counting() && this.active());
  protected readonly format = computed(
    () =>
      new Intl.NumberFormat(
        this.card.resolvedLocale(),
        this.formatOptions() ?? this.card.resolvedFormatOptions(),
      ),
  );

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    let current: number | undefined;

    effect((onCleanup) => {
      const value = this.value();
      const target = typeof value === 'number' ? value : 0;
      const from = current;

      if (!untracked(this.counting) || from === undefined || from === target) {
        current = target;
        untracked(() => this.active.set(false));
        return;
      }

      untracked(() => this.active.set(true));
      onCleanup(
        playCount({
          element,
          from,
          to: target,
          onFrame: (next) => {
            current = next;
            this.shown.set(next);
            if (next === target) this.active.set(false);
          },
        }),
      );
    });
  }

  readonly formatted = computed(() =>
    this.runs()
      .map((run) => run.text)
      .join(''),
  );

  protected readonly runs = computed(() => {
    const value = this.value();
    if (typeof value !== 'number') return [{ text: value ?? '', secondary: false }];
    const format = this.format();
    if (this.emphasis() === 'none') return [{ text: format.format(value), secondary: false }];
    return figureRuns(format.formatToParts(value));
  });
}
