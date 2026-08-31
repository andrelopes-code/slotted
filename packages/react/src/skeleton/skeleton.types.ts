import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type SkeletonShape = 'text' | 'rectangle' | 'circle';

export interface SkeletonRootProps extends HTMLAttributes<HTMLElement> {
  'aria-hidden': boolean | 'true' | 'false' | undefined;
  className: string;
  'data-part': string;
  'data-shape': SkeletonShape;
  'data-slotted-component': string;
}

export interface SkeletonProps extends ComponentPropsWithoutRef<'span'> {
  render?: (props: SkeletonRootProps) => ReactNode;
  shape?: SkeletonShape;
}
