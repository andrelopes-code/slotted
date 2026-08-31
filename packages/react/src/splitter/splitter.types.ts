import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode, RefObject } from 'react';

export type SplitterOrientation = 'horizontal' | 'vertical';

export interface SplitterContextValue {
  max: number;
  min: number;
  orientation: SplitterOrientation;
  rootRef: RefObject<HTMLElement | null>;
  setValue: (next: number) => void;
  step: number;
  toggleCollapse: () => void;
  value: number;
}

export interface SplitterRootProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className: string;
  'data-orientation': SplitterOrientation;
  'data-part': string;
  'data-slotted-component': string;
}

export interface SplitterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  defaultValue?: number;
  max?: number;
  min?: number;
  onValueChange?: (value: number) => void;
  orientation?: SplitterOrientation;
  step?: number;
  value?: number;
}

export type SplitterPaneProps = ComponentPropsWithoutRef<'div'>;
export type SplitterHandleProps = ComponentPropsWithoutRef<'div'>;
