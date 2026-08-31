import type { AriaAttributes, ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperStatus = 'upcoming' | 'current' | 'complete';

export interface StepperRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-orientation': StepperOrientation;
  'data-part': string;
  'data-slotted-component': string;
}

export interface StepperProps extends ComponentPropsWithoutRef<'ol'> {
  orientation?: StepperOrientation;
  render?: (props: StepperRootProps) => ReactNode;
}

export interface StepperStepProps extends ComponentPropsWithoutRef<'li'> {
  'aria-current'?: AriaAttributes['aria-current'];
  status?: StepperStatus;
}

export type StepperMarkerProps = ComponentPropsWithoutRef<'span'>;
export type StepperLabelProps = ComponentPropsWithoutRef<'span'>;
