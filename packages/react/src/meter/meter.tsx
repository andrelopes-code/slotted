import { meterRatio, meterRegionTone, meterValueText } from '@slotted/core/meter';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/meter/meter.css';

import type { CSSProperties } from 'react';

import { useLocale } from '../i18n';
import { useMeterDefaults } from './meter-defaults';
import type { MeterProps, MeterRootProps } from './meter.types';

/**
 * A static value within a known range, drawn as a length: a share of a whole,
 * a reading against a scale. The root is `role="meter"` with the value, the
 * range and the share as text; under `decorative` it carries no role and is
 * hidden, for a meter beside the words that state its value.
 */
export function Meter({
  decorative = false,
  formatOptions,
  high,
  locale,
  low,
  max = 100,
  min = 0,
  optimum,
  render,
  size,
  style,
  tone,
  value,
  valueText,
  ...nativeProps
}: MeterProps) {
  const defaults = useMeterDefaults();
  const appLocale = useLocale();

  const range = { value, min, max, low, high, optimum };
  const ratio = meterRatio(range);
  const resolvedTone = tone ?? meterRegionTone(range) ?? 'accent';
  const text =
    valueText ??
    meterValueText(range, locale ?? appLocale, formatOptions ?? defaults.formatOptions);
  const semantics = decorative
    ? { 'aria-hidden': true as const }
    : {
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': value,
        'aria-valuetext': text,
        role: 'meter',
      };

  const rootProps: MeterRootProps = keyedProps({
    ...semantics,
    ...nativeProps,
    children: (
      <span data-part="track" data-part-track="">
        <span data-part="indicator" data-part-indicator="" />
      </span>
    ),
    'data-part': 'root',
    'data-size': size ?? defaults.size ?? 'md',
    'data-tone': resolvedTone,
    'data-ui': 'meter',
    style: { ...style, '--slotted-meter-ratio': ratio } as CSSProperties,
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
