import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerRootProps extends HTMLAttributes<HTMLElement> {
  'aria-orientation': DividerOrientation | undefined;
  className: string;
  'data-orientation': DividerOrientation;
  'data-part': string;
  'data-slotted-component': string;
  role: string | undefined;
}

export interface DividerProps extends Omit<ComponentPropsWithoutRef<'hr'>, 'children'> {
  decorative?: boolean;
  orientation?: DividerOrientation;
  render?: (props: DividerRootProps) => ReactNode;
}
