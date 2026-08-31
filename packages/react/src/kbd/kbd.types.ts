import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type KbdSize = 'sm' | 'md';

export interface KbdRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-part': string;
  'data-size': KbdSize;
  'data-slotted-component': string;
}

export interface KbdProps extends ComponentPropsWithoutRef<'kbd'> {
  render?: (props: KbdRootProps) => ReactNode;
  size?: KbdSize;
}
