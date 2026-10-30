import { keyedProps } from '@slotted/core/selector-key';
import {
  describeSparkline,
  layoutSparkline,
  observeSparklineBox,
  SPARKLINE_STEPS,
  sparklineInset,
} from '@slotted/core/sparkline';
import type { SparklineBox } from '@slotted/core/sparkline';
import { sparklineMessages } from '@slotted/core/i18n';
import '@slotted/styles/sparkline/sparkline.css';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useLocale, useMessages } from '../i18n';
import { useSparklineDefaults } from './sparkline-defaults';
import type { SparklineProps, SparklineRootProps } from './sparkline.types';

/** The bar's corner and the space between two bars, in pixels; the stylesheet's geometry. */
const BAR_GAP = 2;
const BAR_RADIUS = 2;

/**
 * A series of numbers drawn in a box: a line through them or a bar per
 * period, a disc on the last point, a dashed line at a reference. The
 * geometry is `@slotted/core/sparkline`'s and the paint is the stylesheet's;
 * what this binding decides is when to measure and what to say.
 *
 * The box is measured in a layout effect, so the first client paint is
 * already on the real grid; on the server and before hydration the drawing
 * is laid out on the nominal grid of its size step and stretched to the box,
 * where `vector-effect: non-scaling-stroke` keeps every stroke and both
 * discs at their screen size. The root is `role="img"` with the generated
 * description as its name, and the `svg` is hidden: a drawing with no
 * interaction is an image, and its content is pixels.
 */
export function Sparkline({
  area,
  curve,
  data,
  description,
  formatOptions,
  label,
  locale,
  marker,
  max,
  messages,
  min,
  ref,
  reference,
  render,
  series,
  size = 'md',
  tone,
  type = 'line',
  valueFormatter,
  ...nativeProps
}: SparklineProps) {
  const defaults = useSparklineDefaults();
  const appLocale = useLocale();
  const t = useMessages(sparklineMessages, messages);
  const resolved = {
    area: area ?? defaults.area ?? false,
    curve: curve ?? defaults.curve ?? 'linear',
    marker: marker ?? defaults.marker ?? true,
    locale: locale ?? appLocale,
    formatOptions: formatOptions ?? defaults.formatOptions,
  };

  const rootRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<SparklineBox | null>(null);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (element === null) return undefined;
    const handle = observeSparklineBox(element, setBox);
    return () => handle.destroy();
  }, []);

  const step = SPARKLINE_STEPS[size];
  const width = box?.width || step.width;
  const height = box?.height || step.height;

  /* Only a change of `data` animates the marks. A box that settles after mount
     — a table cell sizing its column — redraws at once: a path that eased to
     the new width read as the series growing. The drawing last committed is
     the reference, so a render React repeats compares against the same one. */
  const drawn = useRef({ data, width, height });
  const animate =
    drawn.current.data !== data && drawn.current.width === width && drawn.current.height === height;
  useLayoutEffect(() => {
    drawn.current = { data, width, height };
  });

  const layout = useMemo(
    () =>
      layoutSparkline({
        data,
        width,
        height,
        inset: sparklineInset(size, type, resolved.marker),
        type,
        curve: resolved.curve,
        area: resolved.area,
        min,
        max,
        reference,
        gap: BAR_GAP,
        radius: BAR_RADIUS,
      }),
    [
      data,
      width,
      height,
      size,
      type,
      resolved.marker,
      resolved.curve,
      resolved.area,
      min,
      max,
      reference,
    ],
  );

  const format = useMemo(() => {
    if (valueFormatter) return valueFormatter;
    const formatter = new Intl.NumberFormat(resolved.locale, resolved.formatOptions);
    return (value: number) => formatter.format(value);
  }, [valueFormatter, resolved.locale, resolved.formatOptions]);

  const name = description ?? describeSparkline(data, { t, format, label });

  const rootProps: SparklineRootProps = keyedProps({
    ...nativeProps,
    'aria-label': name,
    children: (
      <svg
        aria-hidden="true"
        data-part="plot"
        data-part-plot=""
        focusable="false"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        {layout.area ? <path d={layout.area} data-part="area" data-part-area="" /> : null}
        {layout.line ? <path d={layout.line} data-part="line" data-part-line="" /> : null}
        {layout.bars.map((bar, index) => (
          <path
            d={bar.path}
            data-current={index === layout.bars.length - 1 ? '' : undefined}
            data-part="bar"
            data-part-bar=""
            key={bar.index}
          />
        ))}
        {layout.reference === null ? null : (
          <line
            data-part="reference"
            data-part-reference=""
            x1={0}
            x2={width}
            y1={layout.reference}
            y2={layout.reference}
          />
        )}
        {resolved.marker && type === 'line' && layout.marker ? (
          <>
            <path
              d={`M${layout.marker.x} ${layout.marker.y}h0.001`}
              data-part="ring"
              data-part-ring=""
            />
            <path
              d={`M${layout.marker.x} ${layout.marker.y}h0.001`}
              data-part="marker"
              data-part-marker=""
            />
          </>
        ) : null}
      </svg>
    ),
    ...(animate ? { 'data-animate': '' } : {}),
    'data-curve': resolved.curve,
    'data-part': 'root',
    'data-series': series === undefined ? undefined : String(series),
    'data-size': size,
    'data-tone': tone,
    'data-type': type,
    'data-ui': 'sparkline',
    /* The consumer's ref and the one the observer needs, both kept. */
    ref: (element: HTMLSpanElement | null) => {
      rootRef.current = element;
      if (typeof ref === 'function') ref(element);
      else if (ref !== null && ref !== undefined) ref.current = element;
    },
    role: 'img',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
