import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type BadgeFill = 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-fill': BadgeFill;
  'data-part': string;
  'data-size': BadgeSize;
  'data-slotted-component': string;
  'data-variant': BadgeVariant;
}

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  fill?: BadgeFill;
  render?: (props: BadgeRootProps) => ReactNode;
  size?: BadgeSize;
  variant?: BadgeVariant;
}
