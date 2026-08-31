import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarRootProps extends HTMLAttributes<HTMLElement> {
  'aria-orientation': 'vertical' | undefined;
  className: string;
  'data-orientation': ToolbarOrientation;
  'data-part': string;
  'data-slotted-component': string;
  role: string;
}

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: ToolbarOrientation;
}
