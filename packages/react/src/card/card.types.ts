import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface CardRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-part': string;
  'data-slotted-component': string;
}

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  render?: (props: CardRootProps) => ReactNode;
}

export type CardRegionProps = ComponentPropsWithoutRef<'div'>;
