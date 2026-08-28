import type { ComponentPropsWithRef, ReactNode } from 'react';

import type {
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  leading?: ReactNode;
  size?: ButtonSize;
  tone?: ButtonTone;
  trailing?: ReactNode;
  type?: ButtonType;
  variant?: ButtonVariant;
}
