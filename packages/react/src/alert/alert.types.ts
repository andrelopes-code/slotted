import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'accent' | 'secondary' | 'success' | 'warning' | 'danger';
export type AlertFill = 'subtle' | 'outline' | 'solid';
export type AlertSize = 'sm' | 'md';
export type AlertLive = 'off' | 'polite' | 'assertive';

export interface AlertRootProps extends HTMLAttributes<HTMLElement> {
  className: string;
  'data-fill': AlertFill;
  'data-part': string;
  'data-size': AlertSize;
  'data-slotted-component': string;
  'data-variant': AlertVariant;
  role: string | undefined;
}

export interface AlertProps extends ComponentPropsWithoutRef<'div'> {
  fill?: AlertFill;
  live?: AlertLive;
  render?: (props: AlertRootProps) => ReactNode;
  size?: AlertSize;
  variant?: AlertVariant;
}

export type AlertIconProps = ComponentPropsWithoutRef<'span'>;
export type AlertTitleProps = ComponentPropsWithoutRef<'div'>;
export type AlertDescriptionProps = ComponentPropsWithoutRef<'p'>;
export type AlertActionsProps = ComponentPropsWithoutRef<'div'>;
