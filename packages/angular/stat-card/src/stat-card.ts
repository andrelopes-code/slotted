import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale, injectMessages } from '@slotted/angular/i18n';
import { type PartialMessages, statCardMessages, type StatCardMessages } from '@slotted/core/i18n';

import { injectStatCardDefaults } from './stat-card-defaults';
import {
  toneOf,
  trendOf,
  type StatCardAttention,
  type StatCardFill,
  type StatCardGoodWhen,
  type StatCardLayout,
  type StatCardSize,
  type StatCardTone,
  type StatCardValueStatus,
} from './stat-card.constants';

let nextId = 0;

/**
 * A metric with its name, its change and its trend, in a frame.
 *
 * The root holds the facts the parts read — which way is good, the change,
 * the status, whether it is loading — and derives the one thing two parts
 * have to agree on: the tone of the change, which the delta wears and the
 * trend hands to its sparkline. It is derived here, from `delta` and
 * `goodWhen`, so the first render already carries it.
 *
 * The root is a group named by its label, so a reader who lands on the
 * action inside it hears which metric it belongs to; an `aria-label` or
 * `aria-labelledby` the consumer wrote on the element wins. It carries
 * `aria-busy` while loading; the placeholders are `skeleton`s, and a
 * consumer who wants one announcement for a whole dashboard wraps it in a
 * `slSkeletonRegion`.
 */
@Component({
  selector: '[slStatCard]',
  standalone: true,
  template: '<div data-part="body" data-part-body=""><ng-content /></div>',
  styleUrl: '../../../styles/src/stat-card/stat-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slStatCard',
  host: {
    'data-ui': 'stat-card',
    'data-ui-stat-card': '',
    'data-part': 'root',
    'data-part-root': '',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-fill]': 'resolvedFill()',
    '[attr.data-layout]': 'resolvedLayout()',
    '[attr.data-status]': 'status()',
    '[attr.data-good-when]': 'resolvedGoodWhen()',
    '[attr.data-tone]': 'resolvedTone() ?? null',
    '[attr.data-attention]': 'resolvedAttention() ?? null',
    '[attr.data-loading]': 'loading() ? "" : null',
  },
})
export class SlStatCard {
  readonly size = input<StatCardSize | undefined>(undefined);
  readonly fill = input<StatCardFill | undefined>(undefined);
  readonly layout = input<StatCardLayout | undefined>(undefined);
  /** Whether there is a value to show, and if not, why. */
  readonly status = input<StatCardValueStatus>('ready');
  /** The value is still on its way: every part stands in with a placeholder. */
  readonly loading = input<boolean, unknown>(false, { transform: booleanAttribute });
  /** Which way is good for this metric. The delta's tone is derived from it, never from the sign. */
  readonly goodWhen = input<StatCardGoodWhen | undefined>(undefined);
  /**
   * The change since the comparison period, as the first delta inside reads
   * it: a fraction for a percentage (`0.124` is +12.4%), or a number.
   */
  readonly delta = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** The tone the card hands to its trend. Unset, it is the delta's. */
  readonly tone = input<StatCardTone | undefined>(undefined);
  /**
   * The figure is past a threshold the product states: the value and the
   * edge take the tone, the delta keeps its own. A ready value only; the
   * comparison line says which threshold it passed.
   */
  readonly attention = input<StatCardAttention | undefined>(undefined);
  /** The locale numbers are written in; the language in force when absent. */
  readonly locale = input<string | undefined>(undefined);
  /** How the value, the delta and the comparison read numbers. */
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /**
   * Words laid over the catalog of the language in force, key by key: what a
   * screen reader hears beside a change (`up`, `down`, `flat`, read before the
   * number because a sign is a glyph some readers skip) and what stands in for
   * a value that is not there (`empty`).
   */
  readonly messages = input<PartialMessages<StatCardMessages> | undefined>(undefined);

  private readonly defaults = injectStatCardDefaults();
  private readonly appLocale = injectLocale();
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });
  private readonly ownLabelledBy = inject(new HostAttributeToken('aria-labelledby'), {
    optional: true,
  });

  /** The id the label takes, and the root is named by. */
  readonly labelId = `slotted-stat-card-label-${nextId++}`;

  readonly resolvedSize = computed(() => this.size() ?? this.defaults.size ?? 'md');
  readonly resolvedFill = computed(() => this.fill() ?? this.defaults.fill ?? 'outline');
  readonly resolvedLayout = computed(() => this.layout() ?? this.defaults.layout ?? 'inline');
  readonly resolvedGoodWhen = computed(() => this.goodWhen() ?? this.defaults.goodWhen ?? 'up');
  readonly resolvedLocale = computed(() => this.locale() ?? this.appLocale());
  readonly resolvedFormatOptions = computed(
    () => this.formatOptions() ?? this.defaults.formatOptions,
  );
  /** The family's words in the language in force, with this card's `messages` laid over them. */
  readonly t = injectMessages(statCardMessages, this.messages);
  readonly resolvedTone = computed<StatCardTone | undefined>(() => {
    const explicit = this.tone();
    if (explicit !== undefined) return explicit;
    const delta = this.delta();
    return delta === undefined ? undefined : toneOf(trendOf(delta), this.resolvedGoodWhen());
  });

  readonly resolvedAttention = computed(() =>
    this.status() === 'ready' && !this.loading() ? this.attention() : undefined,
  );

  readonly labelledBy = computed(() =>
    this.ownLabel !== null ? null : (this.ownLabelledBy ?? this.labelId),
  );
}

export function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return numberAttribute(value);
}

export function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}
