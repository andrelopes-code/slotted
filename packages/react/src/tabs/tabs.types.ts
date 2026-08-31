import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivation = 'automatic' | 'manual';

export interface TabsContextValue {
  activation: TabsActivation;
  orientation: TabsOrientation;
  panelId: (value: string) => string;
  select: (value: string) => void;
  tabId: (value: string) => string;
  value: string | undefined;
}

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'id' | 'onChange'> {
  activation?: TabsActivation | undefined;
  children?: ReactNode | undefined;
  defaultValue?: string | undefined;
  id?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  orientation?: TabsOrientation | undefined;
  value?: string | undefined;
}

export type TabListProps = ComponentPropsWithoutRef<'div'>;

export interface TabProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value'> {
  value: string;
}

export interface TabPanelProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
}
