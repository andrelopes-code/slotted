import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export interface CollapsibleRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-part': string;
  'data-slotted-component': string;
  open: boolean;
}

export interface CollapsibleProps extends Omit<ComponentPropsWithoutRef<'details'>, 'onToggle'> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export type CollapsibleTriggerProps = ComponentPropsWithoutRef<'summary'>;
export type CollapsibleContentProps = ComponentPropsWithoutRef<'div'>;
