import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type LoadingBarPlacement = 'inline' | 'fixed';

export interface LoadingBarRootProps extends HTMLAttributes<HTMLElement> {
  'aria-valuemax': number;
  'aria-valuemin': number;
  'aria-valuenow': number | undefined;
  'aria-valuetext': string | undefined;
  children: ReactNode;
  className: string;
  'data-indeterminate'?: '' | undefined;
  'data-part': string;
  'data-placement': LoadingBarPlacement;
  'data-slotted-component': string;
  role: string;
}

export interface LoadingBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  max?: number;
  placement?: LoadingBarPlacement;
  render?: (props: LoadingBarRootProps) => ReactNode;
  value?: number | null;
  valueText?: string;
}
