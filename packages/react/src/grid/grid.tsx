import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/grid/grid.css';

import type { CSSProperties } from 'react';

import type { GridProps, GridRootProps } from './grid.types';

const COLUMN_COUNT_PROPERTY = '--slotted-grid-columns';

/**
 * A track function cannot read an integer from an attribute, so the count
 * travels as a custom property as well. The attribute is what a reader of the
 * DOM and a test select on; the property is what the track function divides by.
 * The consumer's own style still wins the properties it sets.
 */
function columnStyle(
  columns: GridProps['columns'],
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (columns === undefined) return style;
  return { [COLUMN_COUNT_PROPERTY]: columns, ...style } as CSSProperties;
}

/**
 * Grid arranges its children across two axes and reflows by measuring itself
 * rather than the viewport, so no breakpoint appears anywhere in the family. It
 * paints nothing and adds no semantics: a div is the default because a div
 * claims nothing, and the element is a claim the consumer makes through
 * `render`.
 *
 * It is not the APG grid widget. There is no `role="grid"`, no cell, and no
 * arrow-key navigation: this family lays children out, and the children keep
 * whatever semantics they already had.
 *
 * There is no axis that reorders or places children. The order they are written
 * in is the order they are read in, by a screen reader and by the Tab key
 * alike; a child that must cross two tracks says so on itself.
 */
export function Grid({
  align,
  columns,
  gap,
  justify,
  minItemWidth,
  render,
  style,
  ...nativeProps
}: GridProps) {
  const rootProps: GridRootProps = keyedProps({
    ...nativeProps,
    ...(align === undefined ? {} : { 'data-align': align }),
    ...(columns === undefined ? {} : { 'data-columns': String(columns) }),
    ...(gap === undefined ? {} : { 'data-gap': String(gap) }),
    ...(justify === undefined ? {} : { 'data-justify': justify }),
    ...(minItemWidth === undefined ? {} : { 'data-min-item-width': minItemWidth }),
    'data-part': 'root',
    'data-ui': 'grid',
    style: columnStyle(columns, style),
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}
