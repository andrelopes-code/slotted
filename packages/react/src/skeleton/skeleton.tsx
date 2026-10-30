import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/skeleton/skeleton.css';

import type { CSSProperties } from 'react';

import { useSkeletonDefaults } from './skeleton-defaults';
import { useSkeletonRegion } from './skeleton-region-context';
import type { SkeletonGeometry, SkeletonProps, SkeletonRootProps } from './skeleton.types';

/**
 * The geometry reaches the stylesheet as the family's own custom properties
 * rather than as `width` and `height`, because every rule in this library is
 * logical and a physical declaration would be the one thing in the family that
 * did not mirror. A bare number is pixels, which is what a consumer who typed
 * one meant.
 */
export function geometryStyle(
  { blockSize, inlineSize }: SkeletonGeometry,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (blockSize === undefined && inlineSize === undefined) return style;
  return {
    ...style,
    ...(blockSize === undefined ? {} : { '--slotted-skeleton-block-size': length(blockSize) }),
    ...(inlineSize === undefined ? {} : { '--slotted-skeleton-inline-size': length(inlineSize) }),
  } as CSSProperties;
}

const length = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

/**
 * One placeholder box.
 *
 * With no children it draws the geometry `shape` and `size` describe. With
 * children it takes *their* geometry and covers them, which is the only form
 * in which the reserved space cannot disagree with what replaces it — MUI
 * infers the box from `children` and React Spectrum clones the child with a
 * skeleton class, and both arrive here.
 *
 * Hidden from assistive technology and taken out of the tab order while it is
 * painted: reading out the absence of something is noise, and focus must not
 * fall into content that is not ready. `aria-hidden="false"` written by hand
 * is the escape hatch, and it is an explicit value rather than `undefined`
 * because React reads an `undefined`-valued prop as absent — the finding this
 * family recorded in August and `alert` reused.
 */
export function Skeleton({
  animation,
  'aria-hidden': ariaHidden,
  blockSize,
  children,
  inlineSize,
  loading,
  render,
  shape = 'text',
  size = 'md',
  style,
  ...nativeProps
}: SkeletonProps) {
  const defaults = useSkeletonDefaults();
  const region = useSkeletonRegion();
  const painted = loading ?? region?.loading ?? true;
  const resolved = {
    animation: animation ?? region?.animation ?? defaults.animation ?? 'shimmer',
  };

  const rootProps: SkeletonRootProps = keyedProps({
    ...nativeProps,
    'aria-hidden': painted ? (ariaHidden ?? 'true') : ariaHidden,
    children,
    'data-animation': resolved.animation,
    'data-loading': painted || undefined,
    'data-part': 'root',
    'data-shape': shape,
    'data-size': size,
    'data-ui': 'skeleton',
    inert: painted || undefined,
    style: geometryStyle({ blockSize, inlineSize }, style),
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}
