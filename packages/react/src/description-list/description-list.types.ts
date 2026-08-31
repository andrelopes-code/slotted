import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type DescriptionListOrientation = 'horizontal' | 'vertical';

export interface DescriptionListRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-orientation': DescriptionListOrientation;
  'data-part': string;
  'data-slotted-component': string;
}

export interface DescriptionListProps extends ComponentPropsWithoutRef<'dl'> {
  orientation?: DescriptionListOrientation;
  render?: (props: DescriptionListRootProps) => ReactNode;
}

export type DescriptionTermProps = ComponentPropsWithoutRef<'dt'>;
export type DescriptionDetailsProps = ComponentPropsWithoutRef<'dd'>;
