import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/skeleton/skeleton.css';

import type { CSSProperties } from 'react';

import { useSkeletonDefaults } from './skeleton-defaults';
import { useSkeletonRegion } from './skeleton-region-context';
import { geometryStyle } from './skeleton';
import type { SkeletonTextProps, SkeletonTextRootProps } from './skeleton.types';

/**
 * The rows of a paragraph that has not arrived.
 *
 * Each row is exactly one line box and the bar inside it is one em, so `lines`
 * rows occupy exactly the `lines` lines of the paragraph they stand in — at
 * every type size and every density, because both come from the type the rows
 * are placed in rather than from a number typed here. Every implementation
 * surveyed while this family was rebuilt states a pixel height instead, and is
 * therefore right at one density and wrong at the others.
 *
 * The last row is drawn short, which is what makes a stack of bars read as
 * prose rather than as a barcode — and only when there is more than one, since
 * a lone row cut to 62% stands for a sentence that was never there. The widths
 * are fixed rather than random: Carbon randomises them, and a randomised width
 * is a hydration mismatch waiting for its first server-rendered page.
 */
export function SkeletonText({
  animation,
  'aria-hidden': ariaHidden,
  inlineSize,
  lastLineSize,
  lines = 3,
  loading,
  render,
  style,
  ...nativeProps
}: SkeletonTextProps) {
  const defaults = useSkeletonDefaults();
  const region = useSkeletonRegion();
  const painted = loading ?? region?.loading ?? true;
  const resolvedAnimation = animation ?? region?.animation ?? defaults.animation ?? 'shimmer';
  const resolvedLastLine = lastLineSize ?? defaults.lastLineSize;

  const rootProps: SkeletonTextRootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': painted ? (ariaHidden ?? 'true') : ariaHidden,
    /**
     * No rows at all once the content has arrived. The element stays, and the
     * stylesheet takes it out of layout, so nothing the consumer wrote beside
     * it is remounted on the way through.
     */
    children: painted
      ? Array.from({ length: Math.max(1, Math.trunc(lines)) }, (_, row) => (
          <span data-part="line" data-part-line="" key={row} />
        ))
      : null,
    'data-animation': resolvedAnimation,
    'data-loading': painted || undefined,
    'data-part': 'text',
    'data-ui': 'skeleton',
    inert: painted || undefined,
    style: lastLine(resolvedLastLine, geometryStyle({ inlineSize }, style)),
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

function lastLine(size: string | undefined, style: CSSProperties | undefined) {
  if (size === undefined) return style;
  return { ...style, '--slotted-skeleton-last-line-size': size } as CSSProperties;
}
