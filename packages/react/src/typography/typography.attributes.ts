import type { CSSProperties } from 'react';

import type { TypographyAxes } from './typography.types';

const LINE_CLAMP_PROPERTY = '--slotted-typography-lines';

function lines(truncate: TypographyAxes['truncate']) {
  if (truncate === undefined || truncate === false) return undefined;
  if (truncate === true) return 1;
  return Math.max(1, Math.trunc(truncate));
}

/**
 * An axis reaches the stylesheet only when someone decided it. The base rule
 * already paints the family default, and text is the most numerous element in
 * any document: restating that default on every one of them would be seven
 * attributes of noise per paragraph.
 *
 * `tone: 'inherit'` is the absence of a colour rather than a colour, so it
 * writes nothing at all.
 */
export function axisAttributes(axes: TypographyAxes): Record<string, string> {
  const { align, numeric, size, tone, transform, truncate, weight, wrap } = axes;
  const count = lines(truncate);

  return {
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(numeric === undefined ? {} : { 'data-numeric': numeric }),
    ...(size === undefined ? {} : { 'data-size': size }),
    ...(tone === undefined || tone === 'inherit' ? {} : { 'data-tone': tone }),
    ...(transform === undefined ? {} : { 'data-transform': transform }),
    ...(weight === undefined ? {} : { 'data-weight': weight }),
    ...(wrap === undefined ? {} : { 'data-wrap': wrap }),
    ...(count === undefined ? {} : { 'data-truncate': String(count) }),
  };
}

/**
 * A line count cannot be read from an attribute by CSS, so it travels as a
 * custom property. The consumer's own style still wins the properties it sets.
 */
export function truncationStyle(
  truncate: TypographyAxes['truncate'],
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  const count = lines(truncate);
  if (count === undefined) return style;
  return { [LINE_CLAMP_PROPERTY]: count, ...style } as CSSProperties;
}
