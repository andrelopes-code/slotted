import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import type {
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_FILLS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
} from './button.constants';

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonFill = (typeof BUTTON_FILLS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonGroupOrientation = (typeof BUTTON_GROUP_ORIENTATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonAppearanceProps {
  fill?: ButtonFill;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export interface ButtonContentProps {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export interface ButtonLoadingProps {
  loading?: boolean;
  loadingIndicator?: ReactNode;
  loadingText?: ReactNode;
}

export interface ButtonProps
  extends
    Omit<ComponentPropsWithRef<'button'>, 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps,
    ButtonLoadingProps {
  type?: ButtonType;
}

interface ButtonLinkSharedProps extends ButtonAppearanceProps, ButtonContentProps {
  disabled?: boolean;
}

export type ButtonLinkRootProps = ComponentPropsWithRef<'a'>;

type NativeButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href: string;
    render?: never;
  };

type AdaptedButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href?: never;
    render: (rootProps: ButtonLinkRootProps) => ReactElement;
  };

export type ButtonLinkProps = NativeButtonLinkProps | AdaptedButtonLinkProps;

type IconButtonAccessibleName =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-label'?: never; 'aria-labelledby': string };

export type IconButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'aria-label' | 'aria-labelledby' | 'children' | 'type'
> &
  ButtonAppearanceProps &
  Omit<ButtonLoadingProps, 'loadingText'> &
  IconButtonAccessibleName & {
    children: ReactNode;
    type?: ButtonType;
  };

export interface ToggleButtonProps
  extends
    Omit<ComponentPropsWithRef<'button'>, 'aria-pressed' | 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps {
  onPressedChange?: (pressed: boolean) => void;
  pressed?: boolean;
  type?: ButtonType;
}

export interface ButtonGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'role'> {
  orientation?: ButtonGroupOrientation;
}
