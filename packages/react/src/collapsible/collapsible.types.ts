import type { ComponentPropsWithoutRef } from 'react';

export interface CollapsibleProps extends Omit<ComponentPropsWithoutRef<'details'>, 'onToggle'> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export type CollapsibleTriggerProps = ComponentPropsWithoutRef<'summary'>;
export type CollapsibleContentProps = ComponentPropsWithoutRef<'div'>;
