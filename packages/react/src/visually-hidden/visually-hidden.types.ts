import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface VisuallyHiddenRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-focusable'?: '' | undefined;
  'data-part': string;
  'data-slotted-component': string;
}

export interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
  focusable?: boolean;
  render?: (props: VisuallyHiddenRootProps) => ReactNode;
}
