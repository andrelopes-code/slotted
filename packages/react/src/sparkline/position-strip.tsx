import { describeStrip, layoutStrip } from '@slotted/core/sparkline';
import { sparklineMessages } from '@slotted/core/i18n';
import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/sparkline/sparkline.css';

import type { CSSProperties } from 'react';

import { useMessages } from '../i18n';
import type { PositionStripProps, PositionStripRootProps } from './sparkline.types';
import { useSparklineFormat } from './use-sparkline-format';

/**
 * Where one value stands among its own recent values, on one axis: a dot per
 * period, their span as a band, the value as a larger dot, a dashed reference
 * tick, the zero tick when the extent crosses it, and the two ends written at
 * the ends. Every mark is placed by a share of the track, so the strip needs
 * no measuring and rows with the same `min` and `max` line up. The root is
 * `role="img"`, named by the value, the span of the periods and the reference.
 */
export function PositionStrip({
  description,
  formatOptions,
  hideValue = false,
  label,
  locale,
  max,
  messages,
  min,
  reference,
  render,
  size = 'md',
  tone,
  value,
  valueFormatter,
  values,
  ...nativeProps
}: PositionStripProps) {
  const t = useMessages(sparklineMessages, messages);
  const format = useSparklineFormat(valueFormatter, formatOptions, locale);

  const request = { value: hideValue ? null : value, values, reference, min, max };
  const layout = layoutStrip(request);
  const name = description ?? describeStrip(request, { t, format, label });

  const rootProps: PositionStripRootProps = keyedProps({
    ...nativeProps,
    'aria-label': name,
    children: (
      <>
        <span data-part="start" data-part-start="">
          {layout.low === null ? null : format(layout.low)}
        </span>
        <span data-part="track" data-part-track="">
          {layout.band === null ? null : (
            <span
              data-part="band"
              data-part-band=""
              style={span(layout.band.from, layout.band.to)}
            />
          )}
          {layout.zero === null ? null : (
            <span data-part="zero" data-part-zero="" style={at(layout.zero)} />
          )}
          {layout.reference === null ? null : (
            <span data-part="reference" data-part-reference="" style={at(layout.reference)} />
          )}
          {layout.dots.map((dot) => (
            <span data-part="dot" data-part-dot="" key={dot.index} style={at(dot.at)} />
          ))}
          {layout.value === null ? null : (
            <span data-part="value" data-part-value="" style={at(layout.value)} />
          )}
        </span>
        <span data-part="end" data-part-end="">
          {layout.high === null ? null : format(layout.high)}
        </span>
      </>
    ),
    'data-part': 'root',
    'data-size': size,
    'data-tone': tone,
    'data-type': 'strip',
    'data-ui': 'sparkline',
    role: 'img',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

function at(share: number) {
  return { '--slotted-sparkline-at': share } as CSSProperties;
}

function span(from: number, to: number) {
  return { '--slotted-sparkline-from': from, '--slotted-sparkline-to': to } as CSSProperties;
}
