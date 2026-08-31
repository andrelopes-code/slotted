import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface ProgressBarRootProps extends HTMLAttributes<HTMLElement> {
  'aria-valuemax': number;
  'aria-valuemin': number;
  'aria-valuenow': number | undefined;
  'aria-valuetext': string | undefined;
  children: ReactNode;
  className: string;
  'data-indeterminate'?: '' | undefined;
  'data-part': string;
  'data-slotted-component': string;
  role: string;
}

export interface ProgressBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  max?: number;
  render?: (props: ProgressBarRootProps) => ReactNode;
  value?: number | null;
  valueText?: string;
}
