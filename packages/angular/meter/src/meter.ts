import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { injectLocale } from '@slotted/angular/i18n';
import { meterRatio, meterRegionTone, meterValueText } from '@slotted/core/meter';

import type { MeterSize, MeterTone } from './meter.constants';
import { injectMeterDefaults } from './meter-defaults';

const optionalNumber = (value: number | string | undefined) =>
  value === undefined ? undefined : numberAttribute(value);

/**
 * A static value within a known range, drawn as a length: a share of a whole,
 * a reading against a scale. The host is `role="meter"` with the value, the
 * range and the share as text; under `decorative` it carries no role and is
 * hidden, for a meter beside the words that state its value. Name it with
 * `aria-label` or `aria-labelledby` on the element.
 */
@Component({
  selector: '[slMeter]',
  standalone: true,
  template: `<span data-part="track" data-part-track=""
    ><span data-part="indicator" data-part-indicator=""></span
  ></span>`,
  styleUrl: '../../../styles/src/meter/meter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'slMeter',
  host: {
    'data-ui': 'meter',
    'data-ui-meter': '',
    'data-part': 'root',
    'data-part-root': '',
    '[attr.role]': "decorative() ? null : 'meter'",
    '[attr.aria-hidden]': "decorative() ? 'true' : null",
    '[attr.aria-valuenow]': 'decorative() ? null : value()',
    '[attr.aria-valuemin]': 'decorative() ? null : min()',
    '[attr.aria-valuemax]': 'decorative() ? null : max()',
    '[attr.aria-valuetext]': 'decorative() ? null : text()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-tone]': 'resolvedTone()',
    '[style.--slotted-meter-ratio]': 'ratio()',
  },
})
export class SlMeter {
  /** The reading, between `min` and `max`. A value outside the range is drawn at its end. */
  readonly value = input.required<number, number | string>({ transform: numberAttribute });
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  /**
   * The marks that split the range into regions, as the HTML `meter` element
   * has them. With any of the three, the region the value falls in picks the
   * tone. An explicit `tone` wins.
   */
  readonly low = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly high = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly optimum = input<number | undefined, number | string | undefined>(undefined, {
    transform: optionalNumber,
  });
  readonly tone = input<MeterTone | undefined>(undefined);
  readonly size = input<MeterSize | undefined>(undefined);
  /** No role and hidden, for a meter beside words that already state its value. */
  readonly decorative = input(false, { transform: booleanAttribute });
  /** The whole `aria-valuetext`, replacing the share the family writes. */
  readonly valueText = input<string | undefined>(undefined);
  readonly formatOptions = input<Intl.NumberFormatOptions | undefined>(undefined);
  /** The locale the share is written in; the language in force when absent. */
  readonly locale = input<string | undefined>(undefined);

  private readonly defaults = injectMeterDefaults();
  private readonly appLocale = injectLocale();

  private readonly range = computed(() => ({
    value: this.value(),
    min: this.min(),
    max: this.max(),
    low: this.low(),
    high: this.high(),
    optimum: this.optimum(),
  }));

  protected readonly ratio = computed(() => meterRatio(this.range()));
  protected readonly resolvedSize = computed(() => this.size() ?? this.defaults.size ?? 'md');
  protected readonly resolvedTone = computed(
    () => this.tone() ?? meterRegionTone(this.range()) ?? 'accent',
  );
  protected readonly text = computed(
    () =>
      this.valueText() ??
      meterValueText(
        this.range(),
        this.locale() ?? this.appLocale(),
        this.formatOptions() ?? this.defaults.formatOptions,
      ),
  );
}
