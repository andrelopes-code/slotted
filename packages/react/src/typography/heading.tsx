import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/typography/typography.css';

import { createElement } from 'react';

import { useHeadingLevel } from './heading-level';
import { axisAttributes, truncationStyle } from './typography.attributes';
import type { HeadingProps, HeadingLevelValue, TypographySize } from './typography.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/** The size each rank reads at before anyone asks for another. */
const SIZE_OF_LEVEL: Record<HeadingLevelValue, TypographySize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'md',
  6: 'sm',
};

/**
 * A heading is a rank in the document outline and a size on the page, and the
 * two are separate: `level` decides the element, `size` decides how it reads.
 * Left alone, the size follows the rank, so the common case needs no decision.
 */
export function Heading({
  align,
  level,
  numeric,
  size,
  style,
  tone,
  transform,
  truncate,
  weight = 'semibold',
  wrap = 'balance',
  ...nativeProps
}: HeadingProps) {
  const ambient = useHeadingLevel();
  const resolved = level ?? ambient;

  /**
   * A rank more than one deeper than the section allows has skipped one, and a
   * skipped rank is a hole in the outline no reader can see. It is reported
   * rather than corrected: the level the consumer stated is the level rendered.
   */
  if (isDevelopment && level !== undefined && level > ambient + 1) {
    console.warn(
      `Heading level ${level} skips the outline: this section allows at most ${ambient + 1}. Wrap the section in HeadingLevel, or state the rank the content actually has.`,
    );
  }

  return createElement(
    `h${resolved}`,
    keyedProps({
      ...nativeProps,
      ...axisAttributes({
        align,
        numeric,
        size: size ?? SIZE_OF_LEVEL[resolved],
        tone,
        transform,
        truncate,
        weight,
        wrap,
      }),
      'data-part': 'root',
      'data-ui': 'typography',
      style: truncationStyle(truncate, style),
    }),
  );
}
