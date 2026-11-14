import { describeCompare, layoutCompare } from '@slotted/core/sparkline';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/sparkline/sparkline.css';

import type { CSSProperties } from 'react';

import type { BarCompareProps, BarCompareRootProps } from './sparkline.types';
import { useSparklineFormat } from './use-sparkline-format';

/**
 * Two or three values compared as bars on one signed axis: a row each, its
 * label, a bar from zero to the value and the value written past the bar's
 * end, with a zero line when the domain crosses it and a tick at each `step`.
 * Roots that state the same `min`, `max` and `step` draw the same axis. The
 * root is `role="img"`, named by every row's label and value.
 */
export function BarCompare({
  data,
  description,
  formatOptions,
  locale,
  max,
  min,
  render,
  step,
  tone,
  valueFormatter,
  ...nativeProps
}: BarCompareProps) {
  const format = useSparklineFormat(valueFormatter, formatOptions, locale);
  const layout = layoutCompare(data, { min, max, step });

  const rootProps: BarCompareRootProps = keyedProps({
    ...nativeProps,
    'aria-label': description ?? describeCompare(data, format),
    children: data.map((row, index) => {
      const bar = layout.bars[index]!;

      return (
        <span
          data-negative={bar.negative ? '' : undefined}
          data-part="row"
          data-part-row=""
          data-texture={row.texture === true ? '' : undefined}
          key={`${index}-${row.label}`}
        >
          <span data-part="label" data-part-label="">
            {row.label}
          </span>
          <span data-part="track" data-part-track="">
            {layout.ticks.map((tick) => (
              <span
                data-part="tick"
                data-part-tick=""
                key={tick.value}
                style={{ '--slotted-sparkline-at': tick.at } as CSSProperties}
              />
            ))}
            {layout.zero === null ? null : (
              <span
                data-part="zero"
                data-part-zero=""
                style={{ '--slotted-sparkline-at': layout.zero } as CSSProperties}
              />
            )}
            <span
              data-part="bar"
              data-part-bar=""
              style={
                {
                  '--slotted-sparkline-from': bar.from,
                  '--slotted-sparkline-to': bar.to,
                } as CSSProperties
              }
            />
            <span
              data-part="value"
              data-part-value=""
              style={
                {
                  '--slotted-sparkline-from': bar.from,
                  '--slotted-sparkline-to': bar.to,
                } as CSSProperties
              }
            >
              {format(row.value)}
            </span>
          </span>
        </span>
      );
    }),
    'data-part': 'root',
    'data-tone': tone,
    'data-type': 'compare',
    'data-ui': 'sparkline',
    role: 'img',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
