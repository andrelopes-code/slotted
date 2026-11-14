import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostAttributeToken,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale } from '@slotted/angular/i18n';
import { describeCompare, layoutCompare } from '@slotted/core/sparkline';
import type { CompareRow } from '@slotted/core/sparkline';

import { optionalNumber } from './sparkline';
import { injectSparklineDefaults } from './sparkline-defaults';
import type { SparklineTone } from './sparkline.constants';

/**
 * Two or three values compared as bars on one signed axis: a row each, its
 * label, a bar from zero to the value and the value written past the bar's
 * end, with a zero line when the domain crosses it and a tick at each `step`.
 * Hosts that state the same `min`, `max` and `step` draw the same axis. The
 * host is `role="img"`, named by every row's label and value.
 */
@Component({
  selector: '[slBarCompare]',
  standalone: true,
  template: `@for (row of rows(); track $index) {
    <span
      data-part="row"
      data-part-row=""
      [attr.data-negative]="row.bar.negative ? '' : null"
      [attr.data-texture]="row.texture ? '' : null"
    >
      <span data-part="label" data-part-label="">{{ row.label }}</span>
      <span data-part="track" data-part-track="">
        @for (tick of layout().ticks; track tick.value) {
          <span data-part="tick" data-part-tick="" [style.--slotted-sparkline-at]="tick.at"></span>
        }
        @if (layout().zero !== null) {
          <span
            data-part="zero"
            data-part-zero=""
            [style.--slotted-sparkline-at]="layout().zero"
          ></span>
        }
        <span
          data-part="bar"
          data-part-bar=""
          [style.--slotted-sparkline-from]="row.bar.from"
          [style.--slotted-sparkline-to]="row.bar.to"
        ></span>
        <span
          data-part="value"
          data-part-value=""
          [style.--slotted-sparkline-from]="row.bar.from"
          [style.--slotted-sparkline-to]="row.bar.to"
          >{{ row.text }}</span
        >
      </span>
    </span>
  }`,
  styleUrl: '../../../styles/src/sparkline/sparkline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slBarCompare',
  host: {
    'data-ui': 'sparkline',
    'data-ui-sparkline': '',
    'data-part': 'root',
    'data-part-root': '',
    'data-type': 'compare',
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[attr.data-tone]': 'tone() ?? null',
  },
})
export class SlBarCompare {
  /** The values compared, one row each, in the order they are drawn. */
  readonly data = input<readonly CompareRow[]>([]);
  /** The domain. Zero and the data widen it, never narrow it. */
  readonly min = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly max = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  /** The distance between two ticks. Without it, only the zero line is drawn. */
  readonly step = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly tone = input<SparklineTone | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  readonly valueFormatter = input<((value: number) => string) | undefined>(undefined);
  readonly locale = input<string | undefined>(undefined);

  private readonly appLocale = injectLocale();
  private readonly defaults = injectSparklineDefaults();
  /** An `aria-label` the consumer wrote on the element wins over the generated name. */
  private readonly ownLabel = inject(new HostAttributeToken('aria-label'), { optional: true });

  readonly layout = computed(() =>
    layoutCompare(this.data(), { min: this.min(), max: this.max(), step: this.step() }),
  );

  private readonly format = computed(() => {
    const own = this.valueFormatter();
    if (own) return own;
    const formatter = new Intl.NumberFormat(
      this.locale() ?? this.appLocale(),
      this.formatOptions() ?? this.defaults.formatOptions,
    );

    return (value: number) => formatter.format(value);
  });

  readonly rows = computed(() =>
    this.data().map((row, index) => ({
      ...row,
      bar: this.layout().bars[index]!,
      text: this.format()(row.value),
    })),
  );

  readonly name = computed(
    () => this.ownLabel ?? this.description() ?? describeCompare(this.data(), this.format()),
  );
}
