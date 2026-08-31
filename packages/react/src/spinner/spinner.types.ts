import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerRootProps extends HTMLAttributes<HTMLElement> {
  'aria-hidden': 'true' | undefined;
  children: ReactNode;
  className: string;
  'data-part': string;
  'data-size': SpinnerSize;
  'data-slotted-component': string;
  role: string | undefined;
}

export interface SpinnerProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  decorative?: boolean;
  label?: string;
  render?: (props: SpinnerRootProps) => ReactNode;
  size?: SpinnerSize;
}
