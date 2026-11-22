import { textBoxValues } from '@slotted/core/text';
import type { CSSProperties } from 'react';

import type { TypographyAxes } from './typography.types';

const LINE_CLAMP_PROPERTY = '--slotted-typography-lines';
const TEXT_BOX_EDGE_PROPERTY = '--_text-box-edge';

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
 * `tone: 'inherit'` is the absence of a color rather than a color, so it
 * writes nothing at all.
 */
export function axisAttributes(axes: TypographyAxes): Record<string, string> {
  const { align, numeric, size, textBox, tone, transform, truncate, weight, wrap } = axes;
  const count = lines(truncate);
  const { trim } = textBoxValues(textBox);

  return {
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(numeric === undefined ? {} : { 'data-numeric': numeric }),
    ...(size === undefined ? {} : { 'data-size': size }),
    ...(tone === undefined || tone === 'inherit' ? {} : { 'data-tone': tone }),
    ...(transform === undefined ? {} : { 'data-transform': transform }),
    ...(weight === undefined ? {} : { 'data-weight': weight }),
    ...(wrap === undefined ? {} : { 'data-wrap': wrap }),
    ...(count === undefined ? {} : { 'data-truncate': String(count) }),
    ...(trim === null ? {} : { 'data-text-box': trim }),
  };
}

/**
 * A line count and a text-box edge cannot be read from an attribute by CSS, so
 * they travel as custom properties. The consumer's own style still wins the
 * properties it sets.
 */
export function truncationStyle(
  truncate: TypographyAxes['truncate'],
  style: CSSProperties | undefined,
  textBox?: TypographyAxes['textBox'],
): CSSProperties | undefined {
  const count = lines(truncate);
  const { edge } = textBoxValues(textBox);
  if (count === undefined && edge === null) return style;

  return {
    ...(count === undefined ? {} : { [LINE_CLAMP_PROPERTY]: count }),
    ...(edge === null ? {} : { [TEXT_BOX_EDGE_PROPERTY]: edge }),
    ...style,
  } as CSSProperties;
}
