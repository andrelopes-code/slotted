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
import {
  type PartialMessages,
  sparklineMessages,
  type SparklineMessages,
} from '@slotted/core/i18n';
import { describeStrip, layoutStrip } from '@slotted/core/sparkline';
import type { SparklineDatum } from '@slotted/core/sparkline';

import { optionalNumber } from './sparkline';
import { injectSparklineDefaults } from './sparkline-defaults';
import type { SparklineSize, SparklineTone } from './sparkline.constants';

/**
 * Where one value stands among its own recent values, on one axis: a dot per
 * period, their span as a band, the value as a larger dot, a dashed reference
 * tick, the zero tick when the extent crosses it, and the two ends written at
 * the ends. Every mark is placed by a share of the track, so rows with the
 * same `min` and `max` line up. The host is `role="img"`, named by the value,
 * the span of the periods and the reference.
 */
@Component({
  selector: '[slPositionStrip]',
  standalone: true,
  template: `<span data-part="start" data-part-start="">{{ ends().low }}</span
    ><span data-part="track" data-part-track="">
      @if (layout().band; as band) {
        <span
          data-part="band"
          data-part-band=""
          [style.--slotted-sparkline-from]="band.from"
          [style.--slotted-sparkline-to]="band.to"
        ></span>
      }
      @if (layout().zero !== null) {
        <span
          data-part="zero"
          data-part-zero=""
          [style.--slotted-sparkline-at]="layout().zero"
        ></span>
      }
      @if (layout().reference !== null) {
        <span
          data-part="reference"
          data-part-reference=""
          [style.--slotted-sparkline-at]="layout().reference"
        ></span>
      }
      @for (dot of layout().dots; track dot.index) {
        <span data-part="dot" data-part-dot="" [style.--slotted-sparkline-at]="dot.at"></span>
      }
      @if (layout().value !== null) {
        <span
          data-part="value"
          data-part-value=""
          [style.--slotted-sparkline-at]="layout().value"
        ></span>
      }</span
    ><span data-part="end" data-part-end="">{{ ends().high }}</span>`,
  styleUrl: '../../../styles/src/sparkline/sparkline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slPositionStrip',
  host: {
    'data-ui': 'sparkline',
    'data-ui-sparkline': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-type': 'strip',
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone() ?? null',
  },
})
export class SlPositionStrip {
  /** The current value. `null` while it is not known: the dot is left out and the name says so. */
  readonly value = input<number | null, unknown>(null, {
    transform: (value: unknown) => optionalNumber(value) ?? null,
  });
  /** The periods the value is read against, oldest first. `null` is a gap. */
  readonly values = input<readonly SparklineDatum[]>([]);
  readonly reference = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Widen the extent, for rows that line up. The data widens it, never narrows it. */
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** Leaves the value dot out while the value is incomplete, and says so in the name. */
  readonly hideValue = input(false, { transform: booleanAttribute });
  readonly size = input<SparklineSize>('md');
  readonly tone = input<SparklineTone | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);
  readonly messages = input<PartialMessages<SparklineMessages> | undefined>(undefined);

  readonly t = injectMessages(sparklineMessages, this.messages);
  private readonly appLocale = injectLocale();
  private readonly defaults = injectSparklineDefaults();
  /** An `aria-label` the consumer wrote on the element wins over the generated name. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  private readonly request = computed(() => ({
    value: this.hideValue() ? null : this.value(),
    values: this.values(),
    reference: this.reference(),
    min: this.min(),
    max: this.max(),
  }));

  readonly layout = computed(() => layoutStrip(this.request()));

  private readonly format = computed(() => {
    const own = this.valueFormatter();
    if (own) return own;
    const formatter = new Intl.NumberFormat(
      this.locale() ?? this.appLocale(),
      this.formatOptions() ?? this.defaults.formatOptions,
    );

    return (value: number) => formatter.format(value);
  });

  readonly ends = computed(() => {
    const { low, high } = this.layout();
    const format = this.format();

    return {
      low: low === null ? '' : format(low),
      high: high === null ? '' : format(high),
    };
  });

  readonly name = computed(
    () =>
      this.ownLabel ??
      this.description() ??
      describeStrip(this.request(), { t: this.t, format: this.format(), label: this.label() }),
  );
}
