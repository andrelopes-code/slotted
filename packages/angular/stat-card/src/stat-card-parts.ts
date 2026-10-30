import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  HostAttributeToken,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SPARKLINE_DEFAULTS_TOKEN } from '@slotted/angular/sparkline';

import { SlStatCard } from './stat-card';

/** The row with the name, a status beside it and an action at the end. */
@Directive({
  selector: '[slStatCardHeader]',
  standalone: true,
  exportAs: 'slStatCardHeader',
  host: { 'data-part': 'header', 'data-part-header': '' },
})
export class SlStatCardHeader {}

/**
 * The name of the metric. It is the element the root is named by, so it
 * carries the id the root points at; an `id` the consumer wrote wins, and
 * the root then names nothing, which is the consumer's decision to make.
 */
@Directive({
  selector: '[slStatCardLabel]',
  standalone: true,
  exportAs: 'slStatCardLabel',
  host: { 'data-part': 'label', 'data-part-label': '', '[attr.id]': 'id' },
})
export class SlStatCardLabel {
  private readonly card = inject(SlStatCard);
  private readonly ownId = inject(new HostAttributeToken('id'), { optional: true });
  readonly id = this.ownId ?? this.card.labelId;
}

/** A slot beside the name for a badge or a status indicator. */
@Directive({
  selector: '[slStatCardStatus]',
  standalone: true,
  exportAs: 'slStatCardStatus',
  host: { 'data-part': 'status', 'data-part-status': '' },
})
export class SlStatCardStatus {}

/** The place at the end of the header for the consumer's link or button. */
@Directive({
  selector: '[slStatCardAction]',
  standalone: true,
  exportAs: 'slStatCardAction',
  host: { 'data-part': 'action', 'data-part-action': '' },
})
export class SlStatCardAction {}

/** The value with its unit and its delta on one line, and the comparison under them. */
@Directive({
  selector: '[slStatCardFigure]',
  standalone: true,
  exportAs: 'slStatCardFigure',
  host: { 'data-part': 'figure', 'data-part-figure': '' },
})
export class SlStatCardFigure {}

/** The unit, wherever the consumer puts it inside the value: `$` before, `%` after. */
@Directive({
  selector: '[slStatCardUnit]',
  standalone: true,
  exportAs: 'slStatCardUnit',
  host: { 'data-part': 'unit', 'data-part-unit': '' },
})
export class SlStatCardUnit {}

@Directive({
  selector: '[slStatCardPeriod]',
  standalone: true,
  exportAs: 'slStatCardPeriod',
  host: { 'data-part': 'period', 'data-part-period': '' },
})
export class SlStatCardPeriod {}

/**
 * The prose under the figure: what the value was, and the period. Shown
 * only while there is a value to compare; a placeholder while loading.
 */
@Component({
  selector: '[slStatCardComparison]',
  standalone: true,
  imports: [SlSkeleton],
  template: `@if (card.loading()) {
      <span slSkeleton inlineSize="10em"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCardComparison',
  host: {
    'data-part': 'comparison',
    'data-part-comparison': '',
    '[attr.hidden]': 'shown() ? null : ""',
  },
})
export class SlStatCardComparison {
  protected readonly card = inject(SlStatCard);
  readonly shown = computed(() => this.card.loading() || this.card.status() === 'ready');
}

/**
 * Where a sparkline goes. The stylesheet hands it the card's tone, the card's
 * ground and its box; while loading it holds a block in that box, so the card
 * does not change size when the line arrives.
 *
 * A line here is smoothed and washed unless the application or the sparkline
 * says otherwise: a card's trend is read as a shape, and twelve points joined
 * by straight segments read as a jagged edge at this size. The provider is on
 * the host, so the projected sparkline reads it.
 */
@Component({
  selector: '[slStatCardTrend]',
  standalone: true,
  imports: [SlSkeleton],
  providers: [
    {
      provide: SPARKLINE_DEFAULTS_TOKEN,
      useFactory: () => {
        const inherited = inject(SPARKLINE_DEFAULTS_TOKEN, { skipSelf: true });
        return {
          ...inherited,
          area: inherited.area ?? true,
          curve: inherited.curve ?? 'monotone',
        };
      },
    },
  ],
  template: `@if (card.loading()) {
      <span slSkeleton shape="block"></span>
    } @else {
      <ng-content />
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCardTrend',
  host: { 'data-part': 'trend', 'data-part-trend': '', '[attr.hidden]': 'shown() ? null : ""' },
})
export class SlStatCardTrend {
  protected readonly card = inject(SlStatCard);
  readonly shown = computed(() => this.card.loading() || this.card.status() === 'ready');
}

/** What is said in place of a value that is missing or failed. Shown only then. */
@Directive({
  selector: '[slStatCardMessage]',
  standalone: true,
  exportAs: 'slStatCardMessage',
  host: { 'data-part': 'message', 'data-part-message': '', '[attr.hidden]': 'shown() ? null : ""' },
})
export class SlStatCardMessage {
  private readonly card = inject(SlStatCard);
  readonly shown = computed(() => !this.card.loading() && this.card.status() !== 'ready');
}
