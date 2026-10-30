import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/typography/typography.css';

import { axisAttributes, truncationStyle } from './typography.attributes';
import type { TextProps, TypographyRootProps } from './typography.types';

/**
 * Text sets the library's type on whatever element the consumer means. The
 * default is a span, which claims nothing: a paragraph, a label or a table
 * cell is a claim the consumer makes, through `render`.
 *
 * Colour is inherited rather than painted, so text on a tonal surface reads
 * that surface until `tone` asks for something else.
 */
export function Text({
  align,
  numeric,
  render,
  size,
  style,
  tone,
  transform,
  truncate,
  weight,
  wrap,
  ...nativeProps
}: TextProps) {
  const rootProps: TypographyRootProps = keyedProps({
    ...nativeProps,
    ...axisAttributes({ align, numeric, size, tone, transform, truncate, weight, wrap }),
    'data-part': 'root',
    'data-ui': 'typography',
    style: truncationStyle(truncate, style),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
